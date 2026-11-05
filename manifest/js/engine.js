/*
 * Motor de cálculo do /manifest — atualização de condenação e descumprimento de acordo.
 *
 * Mesma metodologia da /calculadora:
 *  - correção monetária pela Tabela Prática do TJSP (IPCA-15), fator = índice do mês final / índice do mês inicial;
 *  - juros de mora simples: 1% a.m. até 29/08/2024 e, a partir de 30/08/2024, Taxa Legal do art. 406 do CC
 *    (Lei 14.905/2024; SELIC deduzida do IPCA-15, série BCB/SGS 29543), contagem mensal desde a data inicial
 *    dos juros, último mês proporcional aos dias, sobre o valor corrigido até a data inicial dos juros;
 *  - deduções (pagamentos) são apenas corrigidas, desde a data do depósito.
 *
 * Funções puras (sem DOM): recebem dados e devolvem resultados. Erros de preenchimento são lançados como
 * Error com .code ('EMPTY' = nada preenchido ainda; 'INPUT' = dado faltando/ inválido; 'DATA' = índice indisponível).
 */
(function (global) {
    'use strict';

    const TJ = global.TJSPIndices;

    let tabela = {};
    let sortedKeys = [];
    let taxaLegalMap = {};

    // ---------- utilitários ----------
    const pad = (n) => String(n).padStart(2, '0');
    const round2 = (v) => Math.round((v + Number.EPSILON) * 100) / 100;
    const makeDate = (y, m0, d) => new Date(y, m0, d, 12, 0, 0, 0);
    const daysInMonth = (y, m0) => new Date(y, m0 + 1, 0).getDate();
    const monthKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
    const keyLabel = (key) => { const [y, m] = key.split('-'); return `${m}/${y}`; };

    /** Soma n meses mantendo o dia (limitado ao último dia do mês: 31/01 + 1 mês = 28 ou 29/02). */
    const addMonths = (date, n, day) => {
        const wanted = day || date.getDate();
        const total = date.getMonth() + n;
        const y = date.getFullYear() + Math.floor(total / 12);
        const m0 = ((total % 12) + 12) % 12;
        return makeDate(y, m0, Math.min(wanted, daysInMonth(y, m0)));
    };

    /** 'DD/MM/AAAA' → Date (meio-dia local) ou null se inválida. */
    const parseDate = (str) => {
        const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(str || '').trim());
        if (!m) return null;
        if (+m[3] < 1900) return null; // "0026" (erro de digitação) não vira 1926
        const d = makeDate(+m[3], +m[2] - 1, +m[1]);
        return (d.getFullYear() === +m[3] && d.getDate() === +m[1] && d.getMonth() === +m[2] - 1) ? d : null;
    };
    const fmtDate = (d) => (d ? `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}` : '');
    const sameDay = (a, b) => !!a && !!b && fmtDate(a) === fmtDate(b);
    const today = () => { const n = new Date(); return makeDate(n.getFullYear(), n.getMonth(), n.getDate()); };

    const fail = (code, message) => { const e = new Error(message); e.code = code; throw e; };

    // ---------- dados econômicos ----------
    function setData(opts) {
        if (opts.tabela) {
            tabela = { ...opts.tabela };
            sortedKeys = Object.keys(tabela).sort();
        }
        if (opts.taxaLegalMap !== undefined) taxaLegalMap = opts.taxaLegalMap || {};
    }
    const hasTaxaLegal = () => Object.keys(taxaLegalMap || {}).length > 0;

    /** Índice do mês; fora da tabela usa o mais próximo disponível (e avisa pelo conjunto `estimated`). */
    const indice = (key, estimated) => {
        if (tabela[key] !== undefined) return { key, value: tabela[key] };
        if (!sortedKeys.length) fail('DATA', 'Tabela de índices não carregada.');
        const first = sortedKeys[0];
        const last = sortedKeys[sortedKeys.length - 1];
        const useKey = key < first ? first : last;
        if (estimated && key > last) estimated.add(`índice de ${keyLabel(key)} ainda não publicado (usado o de ${keyLabel(last)})`);
        return { key: useKey, value: tabela[useKey] };
    };

    const fator = (dateFrom, dateTo, estimated) => {
        const ini = indice(monthKey(dateFrom), estimated);
        const fim = indice(monthKey(dateTo), estimated);
        return { fator: fim.value / ini.value, ini: ini.value, fim: fim.value };
    };

    /** Juros simples mês a mês (contagem por períodos mensais a partir da data dos juros; o último, pro rata die). */
    const juros = (base, interestDate, finalDate, estimated) => {
        let total = 0;
        const day = interestDate.getDate();
        for (let i = 0; i < 1200; i++) {
            const d = addMonths(interestDate, i, day);
            if (!(d < finalDate)) break;
            const key = monthKey(d);
            if (key >= '2024-08') {
                if (!hasTaxaLegal()) fail('DATA', 'A Taxa Legal (BCB) não foi carregada; sem ela não é possível calcular juros a partir de 08/2024. Recarregue a página.');
                if (taxaLegalMap[key] === undefined) estimated.add(`Taxa Legal de ${keyLabel(key)} ainda não publicada (usada a última disponível)`);
            }
            const next = addMonths(interestDate, i + 1, day);
            const periodDays = Math.round((next - d) / 864e5);
            let fracaoAntesDoCorte;
            if (key === '2024-08') {
                const daysBefore = Math.round((makeDate(2024, 7, 30) - d) / 864e5);
                fracaoAntesDoCorte = Math.min(1, Math.max(0, daysBefore / periodDays));
            }
            let rate = (TJ.getTaxaLegalMensalDeduzida(key, taxaLegalMap, fracaoAntesDoCorte) ?? 0) / 100;
            // Último período incompleto: proporcional aos dias corridos desde o último "aniversário" da data dos juros
            if (next > finalDate) rate *= Math.round((finalDate - d) / 864e5) / periodDays;
            total += base * rate;
        }
        return total;
    };

    /**
     * Uma linha do demonstrativo. kind: 'credit' (débito do executado) | 'deduction' (pagamento).
     * Dedução só tem juros quando interestDate é informado (pagamento feito depois do início dos juros: o valor pago
     * deixa de render juros a partir do depósito).
     * Base dos juros = valor corrigido até a data dos juros; se os juros começam ANTES da correção (ex.: dano moral com
     * correção do arbitramento e juros do evento), a base é o valor nominal — a correção não "volta" no tempo.
     * Valores arredondados ao centavo por componente, para que as somas batam com o que é exibido.
     */
    const linha = ({ description, detail, value, correctionDate, interestDate, finalDate, kind, estimated }) => {
        const f = fator(correctionDate, finalDate, estimated);
        const original = round2(value);
        const totalCorrection = round2(value * f.fator - value);
        let totalInterest = 0;
        if (interestDate) {
            const base = interestDate > correctionDate ? value * fator(correctionDate, interestDate, estimated).fator : value;
            totalInterest = round2(juros(base, interestDate, finalDate, estimated));
        }
        return {
            description, detail: detail || '', kind,
            originalValue: original, totalCorrection, totalInterest,
            total: round2(original + totalCorrection + totalInterest),
            indexInitial: f.ini, indexFinal: f.fim, correctionDate, interestDate: interestDate || null
        };
    };

    const sum = (arr, fn) => round2(arr.reduce((acc, x) => acc + fn(x), 0));
    const pctLabel = (p) => String(p).replace('.', ',');

    // ---------- condenação ----------
    /**
     * input = { finalDate, fine523: bool, rows: [{ kind: 'credit'|'deduction'|'percentFine', description, value,
     *           correctionDate, interestDate }] }
     */
    function calcCondemnation(input) {
        const finalDate = input.finalDate || today();
        const estimated = new Set();
        const credits = [], deductions = [], percentFines = [];
        const filled = (input.rows || []).map((r, idx) => ({ ...r, idx })).filter(r => r.value > 0);
        if (!filled.length) fail('EMPTY', 'Preencha ao menos uma linha com valor e data.');

        filled.forEach((r) => {
            if (r.kind === 'percentFine') { percentFines.push({ description: r.description, percent: r.value }); return; }
            if (!r.correctionDate) fail('INPUT', `Linha ${r.idx + 1} (${r.description}): informe a data inicial da correção.`);
            const row = linha({
                description: r.description, value: r.value, correctionDate: r.correctionDate,
                interestDate: r.kind === 'deduction' ? null : r.interestDate, finalDate, kind: r.kind, estimated,
                detail: r.kind === 'deduction' ? `Pagamento em ${fmtDate(r.correctionDate)}` : ''
            });
            (r.kind === 'deduction' ? deductions : credits).push(row);
        });
        if (!credits.length) fail('INPUT', 'Inclua ao menos um valor da condenação (não apenas deduções ou multa).');

        const positiveSubtotal = sum(credits, r => r.total);
        const totalDeductions = sum(deductions, r => r.total);
        const balance = round2(positiveSubtotal - totalDeductions);
        const fines = percentFines.map(f => ({ ...f, value: round2(balance * f.percent / 100) }));
        const subtotal = round2(balance + sum(fines, f => f.value));
        const fine523Value = input.fine523 ? round2(subtotal * 0.10) : 0;
        const grandTotal = round2(subtotal + fine523Value);

        const summaryLines = [{ label: 'Subtotal da condenação', value: positiveSubtotal }];
        if (deductions.length) summaryLines.push({ label: '(-) Total deduzido', value: totalDeductions, tone: 'deduction' });
        fines.forEach(f => summaryLines.push({ label: `(+) ${f.description} (${pctLabel(f.percent)}% sobre ${balanceLabel(deductions.length)})`, value: f.value, tone: 'fine' }));
        if (input.fine523) summaryLines.push({ label: '(+) Multa do art. 523, § 1º, do CPC (10%)', value: fine523Value, tone: 'fine' });

        return {
            type: 'condemnation', finalDate, rows: [...credits, ...deductions], summaryLines, grandTotal,
            values: { subtotal, grandTotal, withFine523: round2(subtotal * 1.10), fine523: !!input.fine523, positiveSubtotal, totalDeductions },
            notes: [], warnings: [...estimated]
        };
    }
    const balanceLabel = (hasDeductions) => hasDeductions ? 'o saldo atualizado' : 'o subtotal';

    // ---------- acordo: cronograma ----------
    /**
     * Cronograma das parcelas.
     * regular:   { mode: 'regular', count, value, firstDue: Date, lastValue? }
     * irregular: { mode: 'irregular', groups: [{ qty, value, firstDue: Date }] }
     * → [{ n, due: Date, value }] ordenado por vencimento.
     */
    function buildSchedule(spec) {
        const list = [];
        if (spec.mode === 'irregular') {
            (spec.groups || []).forEach(g => {
                for (let i = 0; i < g.qty; i++) list.push({ due: addMonths(g.firstDue, i, g.firstDue.getDate()), value: g.value });
            });
            list.sort((a, b) => a.due - b.due);
        } else {
            for (let i = 0; i < spec.count; i++) {
                const isLast = i === spec.count - 1;
                list.push({ due: addMonths(spec.firstDue, i, spec.firstDue.getDate()), value: isLast && spec.lastValue > 0 ? spec.lastValue : spec.value });
            }
        }
        return list.map((p, i) => ({ ...p, n: i + 1 }));
    }

    // ---------- acordo: cálculo ----------
    /**
     * input = {
     *   finalDate, parcels: [{ n, due, value, paid, payDate?, payValue? }],
     *   method: 'saldo' (valor total do acordo − pagamentos, vencimento antecipado) | 'vencidas' (só parcelas vencidas),
     *   defaultDate?: Date (inadimplemento; padrão = vencimento da 1ª parcela não paga),
     *   withInterest: bool, penaltyPercent: number, penaltyBase: 'saldo' | 'total',
     *   extras: [{ description, date, value }]   // outros pagamentos/abatimentos
     * }
     */
    function calcAgreement(input) {
        const finalDate = input.finalDate || today();
        const parcels = (input.parcels || []).filter(p => p.value > 0 && p.due);
        if (!parcels.length) fail('EMPTY', 'Informe as parcelas do acordo (quantidade, valor e 1º vencimento).');
        const estimated = new Set();
        const N = parcels.length;
        const method = input.method === 'vencidas' ? 'vencidas' : 'saldo';
        const paid = parcels.filter(p => p.paid);
        const unpaid = parcels.filter(p => !p.paid);
        const overdueUnpaid = unpaid.filter(p => p.due <= finalDate);
        const firstUnpaid = unpaid[0] || null;
        let defaultDate;
        if (method === 'saldo') {
            defaultDate = input.defaultDate || (firstUnpaid && firstUnpaid.due) || null;
            if (!defaultDate) fail('INPUT', 'Todas as parcelas estão marcadas como pagas. Desmarque a(s) parcela(s) não paga(s) ou informe a data do inadimplemento.');
            if (defaultDate > finalDate) {
                fail('INPUT', input.defaultDate
                    ? `A data do inadimplemento (${fmtDate(defaultDate)}) é posterior à data do cálculo (${fmtDate(finalDate)}).`
                    : 'Não há parcela vencida e não paga até a data do cálculo.');
            }
        } else {
            // "Só parcelas vencidas" não usa a data do inadimplemento digitada: cada parcela corre do próprio vencimento
            defaultDate = overdueUnpaid.length ? overdueUnpaid[0].due : null;
        }

        const totalAgreement = sum(parcels, p => p.value);
        const credits = [], deductions = [];
        const interestFrom = (d) => (input.withInterest ? d : null);
        // Pagamento feito depois do início dos juros deixa de render juros desde o depósito (juros também na dedução)
        const interestStart = defaultDate;
        const deductionInterest = (date) => (input.withInterest && interestStart && date > interestStart ? date : null);

        /** Data do depósito validada (padrão = vencimento). */
        const depositDate = (p) => {
            const d = p.payDate || p.due;
            if (d > finalDate) {
                fail('INPUT', p.payDate
                    ? `Parcela ${p.n}: a data do depósito (${fmtDate(d)}) é posterior à data do cálculo.`
                    : `Parcela ${p.n} (vence em ${fmtDate(p.due)}) está marcada como paga: informe a data do depósito antecipado.`);
            }
            return d;
        };

        const pushPayment = (p) => {
            const payDate = depositDate(p);
            const payValue = p.payValue > 0 ? p.payValue : p.value;
            const details = [`Venc. ${fmtDate(p.due)}`, `depósito em ${fmtDate(payDate)}`];
            if (round2(payValue) !== round2(p.value)) details.push(`valor da parcela ${fmtBR(p.value)}`);
            deductions.push(linha({
                description: `Parcela ${p.n}/${N} paga`, detail: details.join(' · '), value: payValue,
                correctionDate: payDate, interestDate: deductionInterest(payDate), finalDate, kind: 'deduction', estimated
            }));
        };

        if (method === 'saldo') {
            credits.push(linha({
                description: `Valor total do acordo (${N} parcela${N > 1 ? 's' : ''})`,
                detail: `${scheduleSummary(parcels)} · atualizado desde o inadimplemento (${fmtDate(defaultDate)})`,
                value: totalAgreement, correctionDate: defaultDate, interestDate: interestFrom(defaultDate), finalDate, kind: 'credit', estimated
            }));
            paid.forEach(pushPayment);
        } else {
            if (!overdueUnpaid.length) fail('INPUT', 'Não há parcela vencida e não paga até a data do cálculo.');
            overdueUnpaid.forEach(p => credits.push(linha({
                description: `Parcela ${p.n}/${N} não paga`, detail: `Vencimento em ${fmtDate(p.due)}`,
                value: p.value, correctionDate: p.due, interestDate: interestFrom(p.due), finalDate, kind: 'credit', estimated
            })));
            // Parcela paga a menor: a diferença continua devida desde o vencimento; paga a maior: o excesso é abatido.
            paid.forEach(p => {
                if (!(p.payValue > 0)) return;
                const diff = round2(p.value - p.payValue);
                if (diff > 0) {
                    credits.push(linha({
                        description: `Diferença da parcela ${p.n}/${N}`, detail: `Vencimento em ${fmtDate(p.due)} · paga ${fmtBR(p.payValue)} de ${fmtBR(p.value)}`,
                        value: diff, correctionDate: p.due, interestDate: interestFrom(p.due), finalDate, kind: 'credit', estimated
                    }));
                } else if (diff < 0) {
                    const payDate = depositDate(p);
                    deductions.push(linha({
                        description: `Excesso pago na parcela ${p.n}/${N}`, detail: `Depósito em ${fmtDate(payDate)}`,
                        value: -diff, correctionDate: payDate, interestDate: deductionInterest(payDate), finalDate, kind: 'deduction', estimated
                    }));
                }
            });
        }

        (input.extras || []).forEach((x, i) => {
            if (!(x.value > 0)) return;
            if (!x.date) fail('INPUT', `Outro pagamento nº ${i + 1}: informe a data.`);
            if (x.date > finalDate) fail('INPUT', `Outro pagamento nº ${i + 1}: a data (${fmtDate(x.date)}) é posterior à data do cálculo.`);
            deductions.push(linha({
                description: x.description || 'Outro pagamento/abatimento', detail: `Em ${fmtDate(x.date)}`,
                value: x.value, correctionDate: x.date, interestDate: deductionInterest(x.date), finalDate, kind: 'deduction', estimated
            }));
        });

        const creditTotal = sum(credits, r => r.total);
        const deductionTotal = sum(deductions, r => r.total);
        const balance = round2(creditTotal - deductionTotal);
        const penaltyPercent = Math.max(0, Number(input.penaltyPercent) || 0);
        const penaltyBase = input.penaltyBase === 'total' ? 'total' : 'saldo';
        const penaltyBaseValue = penaltyBase === 'total' ? totalAgreement : Math.max(0, balance);
        const penaltyValue = round2(penaltyBaseValue * penaltyPercent / 100);
        const grandTotal = round2(balance + penaltyValue);

        const summaryLines = [];
        if (method === 'saldo') {
            summaryLines.push({ label: 'Valor total do acordo atualizado', value: creditTotal });
            if (deductions.length) summaryLines.push({ label: '(-) Pagamentos realizados (atualizados desde cada depósito)', value: deductionTotal, tone: 'deduction' });
        } else {
            summaryLines.push({ label: 'Parcelas vencidas e não pagas (atualizadas)', value: creditTotal });
            if (deductions.length) summaryLines.push({ label: '(-) Abatimentos (atualizados)', value: deductionTotal, tone: 'deduction' });
        }
        summaryLines.push({ label: '(=) Saldo devedor atualizado', value: balance, strong: true });
        if (penaltyPercent > 0) {
            summaryLines.push({
                label: `(+) Multa pelo descumprimento (${pctLabel(penaltyPercent)}% sobre ${penaltyBase === 'total' ? 'o valor total do acordo' : 'o saldo devedor atualizado'})`,
                value: penaltyValue, tone: 'fine'
            });
        }

        const warnings = [...estimated];
        if (balance < 0) warnings.push('Os pagamentos superam o valor devido: confira as parcelas marcadas como pagas e os valores depositados.');

        const notes = [method === 'saldo'
            ? `Critério: valor total do acordo corrigido${input.withInterest ? ' e com juros de mora' : ''} desde o inadimplemento (${fmtDate(defaultDate)}), deduzidos os pagamentos, cada um corrigido desde a data do respectivo depósito${input.withInterest ? ' (pagamentos posteriores ao inadimplemento também deixam de render juros desde o depósito)' : ''}.`
            : `Critério: cada parcela vencida e não paga corrigida${input.withInterest ? ' e com juros de mora' : ''} desde o respectivo vencimento; parcelas vincendas não incluídas.`];
        if (!input.withInterest) notes.push('Cálculo sem juros de mora (apenas correção monetária).');

        return {
            type: 'agreement', finalDate, method, rows: [...credits, ...deductions], summaryLines, grandTotal,
            values: { grandTotal, balance, penaltyValue, penaltyPercent, totalAgreement },
            agreement: {
                parcels, defaultDate, totalAgreement, paidCount: paid.length, unpaidCount: unpaid.length,
                overdueUnpaid: overdueUnpaid.map(p => p.due), firstUnpaid: firstUnpaid ? firstUnpaid.due : null,
                penaltyPercent, penaltyBase, withInterest: !!input.withInterest
            },
            notes, warnings, usesInterest: !!input.withInterest
        };
    }

    const fmtBR = (v) => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    /** "18 × R$ 150,55" ou "6 × R$ 400,00 + 1 × R$ 50,00" (agrupa por valor, na ordem em que aparece). */
    function scheduleSummary(parcels) {
        const groups = [];
        parcels.forEach(p => {
            const g = groups.find(x => round2(x.value) === round2(p.value));
            if (g) g.qty++;
            else groups.push({ qty: 1, value: p.value });
        });
        return groups.map(g => `${g.qty} × ${fmtBR(g.value)}`).join(' + ');
    }

    global.CalcEngine = {
        setData, hasTaxaLegal, calcCondemnation, calcAgreement, buildSchedule, scheduleSummary,
        parseDate, fmtDate, sameDay, addMonths, makeDate, today, round2, monthKey,
        JUROS_NOTE: 'Juros de mora simples: 1% a.m. até 29/08/2024 e, a partir de 30/08/2024, Taxa Legal do art. 406 do CC (Lei 14.905/2024) = SELIC deduzida do IPCA-15, com piso zero (Res. CMN 5.171/2024; série BCB/SGS 29543). Contagem mensal desde a data inicial dos juros, com o último período proporcional aos dias, sobre o valor corrigido até a data inicial dos juros. Correção monetária pela Tabela Prática do TJSP. Pagamentos/deduções corrigidos desde a data do depósito.'
    };
})(window);
