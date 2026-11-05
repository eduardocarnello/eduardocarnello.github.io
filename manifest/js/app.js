/* Interface do /manifest: gerador de petições + calculadora judicial. */
document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    const CONFIG = {
        juizo: 'AO JUÍZO DO JUIZADO ESPECIAL CÍVEL DA COMARCA DE MARÍLIA/SP',
        cidade: 'Marília',
        proxy: 'https://falling-morning-2baa.eduardocarnello.workers.dev',
        dataDir: '../calculadora/data/'
    };
    const E = window.CalcEngine;
    const $ = (id) => document.getElementById(id);
    const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
    const NBSP = ' ';
    const brl = (v) => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); // "R$ 1,00" com espaço não separável
    const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const fd = E.fmtDate;
    const store = {
        get: (k, d) => { try { const v = localStorage.getItem('manifest.' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
        set: (k, v) => { try { localStorage.setItem('manifest.' + k, JSON.stringify(v)); } catch (e) { /* sem storage */ } }
    };

    /** "1.234,56" | "1234,56" | "1234.56" | "R$ 10" → número (NaN se vazio/ inválido). */
    const parseMoney = (str) => {
        let s = String(str || '').replace(/[^\d,.-]/g, '');
        if (!s) return NaN;
        if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
        else if ((s.match(/\./g) || []).length > 1 || /\.\d{3}$/.test(s)) s = s.replace(/\./g, '');
        return parseFloat(s);
    };
    const money = (str) => { const v = parseMoney(str); return isNaN(v) ? 0 : v; };
    const fmtMoneyInput = (v) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const longDate = (d) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

    let toastTimer;
    const toast = (msg) => { const t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2600); };

    // =====================================================================
    // Máscaras e comportamentos de campos (delegados: valem para linhas novas)
    // =====================================================================
    const maskCNJ = (v) => v.replace(/\D/g, '').slice(0, 20)
        .replace(/(\d{7})(\d)/, '$1-$2').replace(/(\d{7}-\d{2})(\d)/, '$1.$2')
        .replace(/(\d{7}-\d{2}\.\d{4})(\d)/, '$1.$2').replace(/(\d{7}-\d{2}\.\d{4}\.\d)(\d)/, '$1.$2')
        .replace(/(\d{7}-\d{2}\.\d{4}\.\d\.\d{2})(\d)/, '$1.$2');
    /** Máscara de data. Aceita só dígitos (05112026) ou com barras e dia/mês de 1 dígito (5/11/2026 → 05/11/2026). */
    const maskDate = (v) => {
        // dia/mês de 1 dígito seguidos de barra ganham zero à esquerda; o resto é tratado como sequência de dígitos
        const parts = v.replace(/[^\d/]/g, '').split('/');
        const digits = parts.map((s, i) => (i < 2 && i < parts.length - 1 && s.length === 1 ? '0' + s : s)).join('');
        const out = digits.slice(0, 8).replace(/(\d{2})(\d)/, '$1/$2').replace(/(\d{2})\/(\d{2})(\d)/, '$1/$2/$3');
        return /\/$/.test(v) && (out.length === 2 || out.length === 5) ? out + '/' : out;
    };
    const maskCpfCnpj = (v) => {
        v = v.replace(/\D/g, '').slice(0, 14);
        if (v.length <= 11) return v.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        return v.replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d)/, '$1-$2');
    };
    const maskPhone = (v) => {
        v = v.replace(/\D/g, '').slice(0, 11);
        if (v.length > 10) return v.replace(/^(\d\d)(\d{5})(\d{4}).*/, '($1) $2-$3');
        if (v.length > 6) return v.replace(/^(\d\d)(\d{4})(\d{0,4}).*/, '($1) $2-$3');
        if (v.length > 2) return v.replace(/^(\d\d)(\d{0,5}).*/, '($1) $2');
        return v;
    };
    const maskCep = (v) => v.replace(/\D/g, '').slice(0, 8).replace(/^(\d{5})(\d)/, '$1-$2');
    /** Completa "5" → 05/MM/AAAA atual, "5/3" → 05/03/AAAA, ano com 2 dígitos → 20xx/19xx. */
    const completeDate = (value) => {
        if (!value) return value;
        const parts = value.split('/');
        if (parts.length === 3 && parts[2].length === 4) return value;
        const now = new Date();
        let [day, month, year] = [parts[0] || '', parts[1] || '', parts[2] || ''];
        if (!day) return value;
        if (!month) month = String(now.getMonth() + 1);
        if (!year) year = String(now.getFullYear());
        if (year.length < 4) year = parseInt(year, 10) < 50 ? '20' + year.padStart(2, '0') : '19' + year.padStart(2, '0');
        return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
    };

    document.addEventListener('input', (e) => {
        const t = e.target;
        if (!(t instanceof HTMLInputElement)) return;
        const cls = t.classList;
        if (cls.contains('date-input')) t.value = maskDate(t.value);
        else if (cls.contains('cnj-input')) t.value = maskCNJ(t.value);
        else if (cls.contains('cpf-input')) t.value = maskCpfCnpj(t.value);
        else if (cls.contains('phone-input')) t.value = maskPhone(t.value);
    });
    document.addEventListener('focusout', (e) => {
        const t = e.target;
        if (!(t instanceof HTMLInputElement)) return;
        if (t.classList.contains('date-input') && t.value) {
            const v = completeDate(t.value);
            if (v !== t.value) { t.value = v; t.dispatchEvent(new Event('input', { bubbles: true })); }
            t.classList.toggle('border-red-400', !!t.value && !E.parseDate(t.value));
        }
        if (t.classList.contains('money-input') && t.value) {
            const v = parseMoney(t.value);
            const nv = isNaN(v) ? '' : fmtMoneyInput(v);
            if (nv !== t.value) { t.value = nv; t.dispatchEvent(new Event('input', { bubbles: true })); }
        }
    });

    // =====================================================================
    // Índices (IPCA-15 → Tabela TJSP; Taxa Legal SGS 29543) — API do BCB via proxy, com cache local
    // =====================================================================
    let indicesReady = false;
    const setIndicesStatus = (state, extra = '') => {
        const dot = $('indices-status-dot'), txt = $('indices-status-text');
        dot.className = 'inline-block h-2 w-2 rounded-full ' + ({ online: 'bg-green-500', cache: 'bg-yellow-400', offline: 'bg-red-500' }[state] || 'bg-yellow-400 animate-pulse');
        txt.textContent = ({ online: 'Índices atualizados (BCB)', cache: 'Índices do cache local', offline: 'Índices indisponíveis' }[state] || 'Sincronizando índices...') + extra;
    };
    const fetchJson = async (url, opts) => {
        const r = await fetch(url, opts);
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const j = await r.json();
        if (!Array.isArray(j) || !j.length) throw new Error('Série vazia');
        return j;
    };
    const loadIndices = async () => {
        setIndicesStatus('loading');
        const now = new Date();
        const pad = (n) => String(n).padStart(2, '0');
        const ate = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`;
        const de = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear() - 6}`;
        let source = 'online';
        const withFallback = async (serie, from, file) => {
            for (let attempt = 0; attempt < 2; attempt++) {
                try { return await fetchJson(`${CONFIG.proxy}/?serie=${serie}&de=${from}&ate=${ate}`); } catch (e) { /* tenta de novo / cache */ }
            }
            source = 'cache';
            return fetchJson(CONFIG.dataDir + file, { cache: 'no-store' });
        };
        try {
            const [ipca15, taxaLegal] = await Promise.all([
                withFallback(7478, de, 'ipca15.json'),
                withFallback(29543, '01/08/2024', 'taxalegal.json').catch(() => null)
            ]);
            E.setData({ tabela: TJSPIndices.buildTabela(ipca15, TJSPIndices.baseTabela), taxaLegalMap: taxaLegal ? TJSPIndices.computeTaxaLegalMap(taxaLegal) : {} });
            indicesReady = true;
            setIndicesStatus(taxaLegal ? source : 'offline', taxaLegal ? '' : ' (sem Taxa Legal: juros pós-08/2024 bloqueados)');
        } catch (err) {
            console.error(err);
            setIndicesStatus('offline');
        }
        recalc();
    };

    // =====================================================================
    // Abas e montagem do painel de cálculo (um único painel, movido conforme o contexto)
    // =====================================================================
    const calcPanel = $('calc-panel');
    let currentTab = 'manifest';
    let lockedCalcType = null;

    const mountCalcPanel = (container, lockType) => {
        if (calcPanel.parentElement !== container) container.appendChild(calcPanel);
        lockedCalcType = lockType || null;
        if (lockType && $('calc-type').value !== lockType) $('calc-type').value = lockType;
        $('calc-type-wrap').classList.toggle('hidden', !!lockType);
        updateCalcTypeView();
    };

    let calcTabType = null; // tipo escolhido na aba Calculadora (o gerador pode trocar o tipo do painel)
    const setTab = (tab, { fromHash = false } = {}) => {
        if (currentTab === 'calc' && tab !== 'calc') calcTabType = $('calc-type').value;
        currentTab = tab;
        $('tab-manifest').classList.toggle('active', tab === 'manifest');
        $('tab-calc').classList.toggle('active', tab === 'calc');
        $('manifest-app').classList.toggle('hidden', tab !== 'manifest');
        $('calc-app').classList.toggle('hidden', tab !== 'calc');
        $('actions-manifest').classList.toggle('hidden', tab !== 'manifest');
        $('actions-manifest').classList.toggle('flex', tab === 'manifest');
        $('actions-calc').classList.toggle('hidden', tab !== 'calc');
        $('actions-calc').classList.toggle('flex', tab === 'calc');
        if (tab === 'calc') {
            mountCalcPanel($('calc-mount-calc'), null);
            if (calcTabType && $('calc-type').value !== calcTabType) { $('calc-type').value = calcTabType; updateCalcTypeView(); }
        } else syncManifestCalcMount();
        if (!fromHash) history.replaceState(null, '', tab === 'calc' ? '#calculadora' : location.pathname + location.search);
        recalc();
    };
    $('tab-manifest').addEventListener('click', () => setTab('manifest'));
    $('tab-calc').addEventListener('click', () => setTab('calc'));

    // Nº do processo: um campo em cada aba, sempre sincronizados
    const procInputs = [$('process-number'), $('process-number-calc')];
    procInputs.forEach(inp => inp.addEventListener('input', () => { const v = maskCNJ(inp.value); procInputs.forEach(o => { o.value = v; }); }));
    const processNumber = () => $('process-number').value.trim();

    // =====================================================================
    // CALCULADORA — condenação
    // =====================================================================
    const ROW_TYPES = [
        ['Dano Material', 'credit'], ['Dano Moral', 'credit'], ['Restituição', 'credit'], ['Multa', 'credit'],
        ['Última Atualização', 'credit'], ['Dedução/Pagamento Parcial', 'deduction'], ['Multa (%)', 'percentFine'], ['Outro', 'credit']
    ];
    const addCalcRow = (preset = {}) => {
        const row = document.createElement('div');
        row.className = 'calc-row grid grid-cols-2 md:grid-cols-12 gap-2 items-end p-3 border border-gray-200 rounded-xl bg-white';
        row.innerHTML = `
            <div class="col-span-2 md:col-span-3">
                <label class="lbl">Descrição</label>
                <select class="row-type inp">${ROW_TYPES.map(([t]) => `<option>${t}</option>`).join('')}</select>
                <input class="row-other inp mt-1 hidden" placeholder="Qual?">
            </div>
            <div class="md:col-span-2"><label class="lbl row-value-label">Valor (R$)</label><input class="row-value inp money-input" inputmode="decimal" placeholder="1.000,00"></div>
            <div class="md:col-span-3"><label class="lbl row-cdate-label">Correção desde</label><input class="row-cdate inp date-input" placeholder="DD/MM/AAAA"></div>
            <div class="md:col-span-3"><label class="lbl">Juros desde</label><input class="row-idate inp date-input" placeholder="DD/MM/AAAA"></div>
            <div class="col-span-2 md:col-span-1 flex md:justify-center"><button type="button" class="row-remove btn btn-ghost btn-xs text-red-600 w-full md:w-auto" title="Remover linha">✕</button></div>`;
        $('calc-rows').appendChild(row);
        if (preset.type) row.querySelector('.row-type').value = preset.type;
        if (preset.value) row.querySelector('.row-value').value = preset.value;
        syncRowType(row);
        return row;
    };
    const syncRowType = (row) => {
        const type = row.querySelector('.row-type').value;
        const kind = (ROW_TYPES.find(([t]) => t === type) || [])[1];
        row.querySelector('.row-other').classList.toggle('hidden', type !== 'Outro');
        const idate = row.querySelector('.row-idate');
        const cdate = row.querySelector('.row-cdate');
        idate.disabled = kind !== 'credit';
        cdate.disabled = kind === 'percentFine';
        if (idate.disabled) idate.value = '';
        if (cdate.disabled) cdate.value = '';
        idate.placeholder = kind === 'credit' ? 'DD/MM/AAAA' : 'não se aplica';
        cdate.placeholder = kind === 'percentFine' ? 'não se aplica' : 'DD/MM/AAAA';
        row.querySelector('.row-value-label').textContent = kind === 'percentFine' ? 'Percentual (%)' : 'Valor (R$)';
        row.querySelector('.row-value').classList.toggle('money-input', kind !== 'percentFine');
        row.querySelector('.row-cdate-label').textContent = kind === 'deduction' ? 'Data do pagamento' : 'Correção desde';
    };
    $('calc-rows').addEventListener('change', (e) => { if (e.target.classList.contains('row-type')) syncRowType(e.target.closest('.calc-row')); });
    $('calc-rows').addEventListener('click', (e) => {
        if (!e.target.closest('.row-remove')) return;
        if ($$('.calc-row').length > 1) e.target.closest('.calc-row').remove();
        else $$('input', e.target.closest('.calc-row')).forEach(i => { i.value = ''; });
        scheduleRecalc();
    });
    $('add-row-btn').addEventListener('click', () => { addCalcRow().querySelector('.row-value').focus(); });

    const readCondemnation = (finalDate) => ({
        finalDate,
        fine523: $('fine-523').checked,
        rows: $$('.calc-row').map(row => {
            const type = row.querySelector('.row-type').value;
            const kind = (ROW_TYPES.find(([t]) => t === type) || [])[1];
            const description = type === 'Outro' ? (row.querySelector('.row-other').value.trim() || 'Outro') : (type === 'Multa (%)' ? 'Multa' : type);
            return {
                kind, description, value: kind === 'percentFine' ? money(row.querySelector('.row-value').value) : money(row.querySelector('.row-value').value),
                correctionDate: E.parseDate(row.querySelector('.row-cdate').value), interestDate: E.parseDate(row.querySelector('.row-idate').value)
            };
        })
    });

    // =====================================================================
    // CALCULADORA — acordo
    // =====================================================================
    const penaltySelect = $('ag-penalty');
    penaltySelect.innerHTML = '<option value="0">Sem multa</option>' + [5, 10, 15, 20, 25, 30, 40, 50, 100].map(p => `<option value="${p}">${p}%</option>`).join('') + '<option value="custom">Outro %</option>';
    penaltySelect.value = String(store.get('penalty', 20));
    if (!penaltySelect.value) penaltySelect.value = '20';
    penaltySelect.addEventListener('change', () => {
        $('ag-penalty-custom').classList.toggle('hidden', penaltySelect.value !== 'custom');
        if (penaltySelect.value !== 'custom') store.set('penalty', penaltySelect.value);
        else $('ag-penalty-custom').focus();
    });
    const penaltyPercent = () => penaltySelect.value === 'custom' ? (parseMoney($('ag-penalty-custom').value) || 0) : (parseFloat(penaltySelect.value) || 0);

    const installmentMode = () => (document.querySelector('input[name="installment-mode"]:checked') || {}).value || 'regular';

    const addGroupRow = () => {
        const tr = document.createElement('tr');
        tr.className = 'group-row border-t border-gray-100';
        tr.innerHTML = `
            <td class="p-1.5"><input type="number" min="1" class="group-qty inp inp-sm sched-field" placeholder="6"></td>
            <td class="p-1.5"><input class="group-value inp inp-sm money-input sched-field" inputmode="decimal" placeholder="400,00"></td>
            <td class="p-1.5"><input class="group-date inp inp-sm date-input sched-field" placeholder="DD/MM/AAAA"></td>
            <td class="p-1.5 text-center"><button type="button" class="group-remove text-red-500 hover:text-red-700 font-bold px-2" title="Remover grupo">✕</button></td>`;
        $('groups-list').appendChild(tr);
        return tr;
    };
    $('add-group-btn').addEventListener('click', () => addGroupRow().querySelector('.group-qty').focus());
    $('groups-list').addEventListener('click', (e) => {
        if (!e.target.closest('.group-remove')) return;
        e.target.closest('.group-row').remove();
        refreshSchedule();
    });

    let scheduleError = null;
    const scheduleSpec = () => {
        scheduleError = null;
        if (installmentMode() === 'irregular') {
            const groups = [];
            $$('.group-row').forEach((tr, i) => {
                const qtyRaw = tr.querySelector('.group-qty').value.trim();
                const valRaw = tr.querySelector('.group-value').value.trim();
                const dateRaw = tr.querySelector('.group-date').value.trim();
                const bad = (el, on) => el.classList.toggle('border-red-400', on);
                if (!qtyRaw && !valRaw && !dateRaw) return; // linha vazia: ignora
                const g = { qty: parseInt(qtyRaw, 10) || 0, value: money(valRaw), firstDue: E.parseDate(dateRaw) };
                bad(tr.querySelector('.group-qty'), !(g.qty > 0));
                bad(tr.querySelector('.group-value'), !(g.value > 0));
                bad(tr.querySelector('.group-date'), !g.firstDue && dateRaw.length >= 10);
                if (g.qty > 0 && g.value > 0 && g.firstDue) groups.push(g);
                else if (!scheduleError) scheduleError = `Grupo ${i + 1} das parcelas: informe quantidade, valor e 1º vencimento (DD/MM/AAAA).`;
            });
            return groups.length ? { mode: 'irregular', groups } : null;
        }
        const count = parseInt($('ag-count').value, 10) || 0;
        const value = money($('ag-value').value);
        const firstDue = E.parseDate($('ag-first-due').value);
        if (count <= 0 || count > 600 || !(value > 0) || !firstDue) return null;
        return { mode: 'regular', count, value, firstDue, lastValue: $('ag-last-different').checked ? money($('ag-last-value').value) : 0 };
    };

    // Estado das parcelas (paga, data/valor do depósito), preservado ao mudar o cronograma
    let schedule = [];
    let parcelState = [];
    const refreshSchedule = () => {
        const spec = scheduleSpec();
        schedule = spec ? E.buildSchedule(spec) : [];
        while (parcelState.length < schedule.length) parcelState.push({ paid: false, payDate: '', payValue: '' });
        renderParcelTable();
        scheduleRecalc();
    };
    const renderParcelTable = () => {
        $('parcel-section').classList.toggle('hidden', !schedule.length);
        const finalDate = E.parseDate($('calc-final-date').value) || E.today();
        $('parcel-tbody').innerHTML = schedule.map((p, i) => {
            const st = parcelState[i];
            const cls = st.paid ? 'paid' : (p.due <= finalDate ? 'overdue' : 'future');
            const tag = st.paid ? '' : (p.due <= finalDate ? '<span class="chip bg-red-100 text-red-700 ml-1">vencida</span>' : '<span class="chip bg-gray-100 text-gray-500 ml-1">a vencer</span>');
            return `<tr class="parcel-row ${cls} border-t border-gray-100" data-i="${i}">
                <td class="p-1.5 whitespace-nowrap font-medium">${p.n}/${schedule.length}</td>
                <td class="p-1.5 whitespace-nowrap">${fd(p.due)}${tag}</td>
                <td class="p-1.5 text-right whitespace-nowrap">${esc(brl(p.value))}</td>
                <td class="p-1.5 text-center"><input type="checkbox" class="parcel-paid chk" ${st.paid ? 'checked' : ''} aria-label="Parcela ${p.n} paga"></td>
                <td class="p-1.5"><input class="parcel-date inp inp-sm date-input w-28" placeholder="${fd(p.due)}" value="${esc(st.payDate)}" ${st.paid ? '' : 'disabled'}></td>
                <td class="p-1.5"><input class="parcel-value inp inp-sm money-input w-28" inputmode="decimal" placeholder="${esc(fmtMoneyInput(p.value))}" value="${esc(st.payValue)}" ${st.paid ? '' : 'disabled'}></td>
            </tr>`;
        }).join('');
        updateParcelSummary();
    };
    const updateParcelSummary = () => {
        const paidN = schedule.filter((_, i) => parcelState[i].paid).length;
        const total = E.round2(schedule.reduce((a, p) => a + p.value, 0));
        const adjusted = schedule.filter((p, i) => parcelState[i].paid && (parcelState[i].payDate || parcelState[i].payValue)).length;
        $('parcel-summary').textContent = schedule.length
            ? `${schedule.length} parcelas · total do acordo ${brl(total)} · ${paidN} paga(s)${adjusted ? ` · ${adjusted} com depósito ajustado` : ''}. Deixe data/valor do depósito em branco quando forem iguais ao vencimento/parcela.`
            : '';
        if (document.activeElement !== $('ag-paid-count')) {
            const seq = parcelState.slice(0, schedule.length).findIndex(s => !s.paid);
            const contiguous = seq === -1 ? schedule.length : seq;
            $('ag-paid-count').value = paidN === contiguous ? String(paidN) : '';
            $('ag-paid-count').placeholder = paidN === contiguous ? '' : `${paidN}*`;
        }
    };
    $('parcel-tbody').addEventListener('change', (e) => {
        const tr = e.target.closest('.parcel-row'); if (!tr) return;
        const i = +tr.dataset.i;
        if (e.target.classList.contains('parcel-paid')) {
            const checked = e.target.checked;
            parcelState[i].paid = checked;
            renderParcelTable();
            const el = $('parcel-tbody').querySelector(`tr[data-i="${i}"] ${checked ? '.parcel-date' : '.parcel-paid'}`);
            if (el) el.focus(); // mantém o foco na mesma linha (navegação por teclado)
        }
        scheduleRecalc();
    });
    $('parcel-tbody').addEventListener('input', (e) => {
        const tr = e.target.closest('.parcel-row'); if (!tr) return;
        const i = +tr.dataset.i;
        if (e.target.classList.contains('parcel-date')) { e.target.value = maskDate(e.target.value); parcelState[i].payDate = e.target.value; }
        if (e.target.classList.contains('parcel-value')) parcelState[i].payValue = e.target.value;
        updateParcelSummary();
        scheduleRecalc();
    });
    $('ag-paid-count').addEventListener('input', () => {
        const n = Math.max(0, Math.min(schedule.length, parseInt($('ag-paid-count').value, 10) || 0));
        parcelState.forEach((s, i) => { s.paid = i < n; });
        renderParcelTable();
        scheduleRecalc();
    });

    const addExtraRow = () => {
        const row = document.createElement('div');
        row.className = 'extra-row grid grid-cols-2 md:grid-cols-12 gap-2 items-end';
        row.innerHTML = `
            <div class="col-span-2 md:col-span-6"><label class="lbl">Descrição</label><input class="extra-desc inp inp-sm" placeholder="Ex.: Valor bloqueado via SISBAJUD e levantado"></div>
            <div class="md:col-span-3"><label class="lbl">Data</label><input class="extra-date inp inp-sm date-input" placeholder="DD/MM/AAAA"></div>
            <div class="md:col-span-2"><label class="lbl">Valor (R$)</label><input class="extra-value inp inp-sm money-input" inputmode="decimal"></div>
            <div class="md:col-span-1"><button type="button" class="extra-remove btn btn-ghost btn-xs text-red-600 w-full">✕</button></div>`;
        $('extras-list').appendChild(row);
        return row;
    };
    $('add-extra-btn').addEventListener('click', () => addExtraRow().querySelector('.extra-desc').focus());
    $('extras-list').addEventListener('click', (e) => { if (e.target.closest('.extra-remove')) { e.target.closest('.extra-row').remove(); scheduleRecalc(); } });

    const readAgreement = (finalDate) => {
        if (scheduleError) { const err = new Error(scheduleError); err.code = 'INPUT'; throw err; }
        return readAgreementData(finalDate);
    };
    const readAgreementData = (finalDate) => ({
        finalDate,
        parcels: schedule.map((p, i) => ({
            ...p, paid: parcelState[i].paid,
            payDate: E.parseDate(parcelState[i].payDate) || null,
            payValue: money(parcelState[i].payValue) || null
        })),
        method: (document.querySelector('input[name="ag-method"]:checked') || {}).value,
        defaultDate: E.parseDate($('ag-default-date').value),
        withInterest: $('ag-interest').checked,
        penaltyPercent: penaltyPercent(),
        penaltyBase: (document.querySelector('input[name="penalty-base"]:checked') || {}).value,
        extras: $$('.extra-row').map(r => ({ description: r.querySelector('.extra-desc').value.trim(), date: E.parseDate(r.querySelector('.extra-date').value), value: money(r.querySelector('.extra-value').value) }))
    });

    // =====================================================================
    // Cálculo ao vivo
    // =====================================================================
    let lastCalc = null;
    let calcMessage = null; // { level: 'hint' | 'error', text }
    let recalcTimer;
    const scheduleRecalc = () => { clearTimeout(recalcTimer); recalcTimer = setTimeout(recalc, 220); };

    const updateCalcTypeView = () => {
        const isAgreement = $('calc-type').value === 'agreement';
        $('condemnation-block').classList.toggle('hidden', isAgreement);
        $('agreement-block').classList.toggle('hidden', !isAgreement);
    };
    $('calc-type').addEventListener('change', () => { updateCalcTypeView(); recalc(); });

    $('calc-panel').addEventListener('input', (e) => {
        if (e.target.classList.contains('sched-field')) { refreshSchedule(); return; }
        if (e.target.closest('#parcel-tbody') || e.target.id === 'ag-paid-count') return;
        if (e.target.id === 'calc-final-date') renderParcelTable();
        scheduleRecalc();
    });
    $('calc-panel').addEventListener('change', (e) => {
        if (e.target.closest('#parcel-tbody')) return;
        if (e.target.name === 'installment-mode') {
            $('regular-fields').classList.toggle('hidden', installmentMode() !== 'regular');
            $('irregular-fields').classList.toggle('hidden', installmentMode() !== 'irregular');
            if (installmentMode() === 'irregular' && !$$('.group-row').length) addGroupRow();
            refreshSchedule();
            return;
        }
        if (e.target.id === 'ag-last-different') $('ag-last-value').classList.toggle('hidden', !e.target.checked);
        if (e.target.classList.contains('sched-field')) { refreshSchedule(); return; }
        if (e.target.name === 'ag-method') store.set('method', e.target.value);
        scheduleRecalc();
    });

    const recalc = () => {
        clearTimeout(recalcTimer);
        if (!indicesReady) {
            lastCalc = null;
            calcMessage = { level: 'hint', text: 'Carregando os índices de correção e juros...' };
        } else {
            try {
                const finalDate = E.parseDate($('calc-final-date').value) || E.today();
                lastCalc = $('calc-type').value === 'agreement' ? E.calcAgreement(readAgreement(finalDate)) : E.calcCondemnation(readCondemnation(finalDate));
                calcMessage = null;
            } catch (err) {
                if (!err.code) console.error(err);
                lastCalc = null;
                calcMessage = { level: err.code === 'EMPTY' ? 'hint' : 'error', text: err.code ? err.message : 'Erro inesperado no cálculo: ' + err.message };
            }
        }
        renderCalcResults();
        updateActionTotals();
        onCalcChanged();
    };

    const renderCalcResults = () => {
        const box = $('calc-results');
        if (!lastCalc) {
            const color = calcMessage && calcMessage.level === 'error' ? 'text-red-700 bg-red-50' : 'text-gray-500 bg-slate-50';
            box.innerHTML = `<div class="p-4 rounded-xl text-sm ${color}">${esc(calcMessage ? calcMessage.text : '')}</div>`;
            return;
        }
        const c = lastCalc;
        const rows = c.rows.map(r => {
            const neg = r.kind === 'deduction';
            return `<tr class="border-t border-gray-100">
                <td><div class="font-medium ${neg ? 'text-green-700' : 'text-gray-800'}">${neg ? '(-) ' : ''}${esc(r.description)}</div>
                    <div class="text-xs text-gray-400">${esc(r.detail || '')}${r.detail ? ' · ' : ''}índices ${DocPDF.fx6(r.indexInitial)} → ${DocPDF.fx6(r.indexFinal)}</div></td>
                <td class="text-right whitespace-nowrap">${esc(brl(r.originalValue))}</td>
                <td class="text-right whitespace-nowrap">${esc(brl(r.totalCorrection))}</td>
                <td class="text-right whitespace-nowrap">${neg && !r.totalInterest ? '-' : esc(brl(r.totalInterest))}</td>
                <td class="text-right whitespace-nowrap font-semibold ${neg ? 'text-green-700' : ''}">${esc(brl(r.total))}</td></tr>`;
        }).join('');
        const summary = c.summaryLines.map(s => `<div class="flex justify-between gap-4 ${s.strong ? 'font-bold text-gray-900' : 'text-gray-700'}">
                <span>${esc(s.label)}</span><span class="whitespace-nowrap ${s.tone === 'deduction' ? 'text-green-700' : s.tone === 'fine' ? 'text-red-600' : ''}">${esc(brl(s.value))}</span></div>`).join('');
        const warn = (c.warnings || []).map(w => `<p class="text-xs text-amber-700">⚠ ${esc(w)}</p>`).join('');
        box.innerHTML = `
            <div class="overflow-x-auto"><table class="result-table w-full text-sm">
                <thead class="bg-slate-50 text-gray-600 text-xs uppercase"><tr><th class="text-left">Descrição</th><th class="text-right">Original</th><th class="text-right">Correção</th><th class="text-right">Juros</th><th class="text-right">Subtotal</th></tr></thead>
                <tbody>${rows}</tbody></table></div>
            <div class="p-4 border-t space-y-1 text-sm">${summary}
                <div class="flex justify-between items-center gap-4 pt-3 mt-2 border-t-2 border-indigo-500">
                    <span class="font-bold text-gray-900">Valor total do débito</span>
                    <span class="text-2xl font-bold text-indigo-700 whitespace-nowrap">${esc(brl(c.grandTotal))}</span></div>
                <div class="pt-2 space-y-1">${warn}${(c.notes || []).map(n => `<p class="text-xs text-gray-500 italic">${esc(n)}</p>`).join('')}</div>
            </div>`;
    };

    const updateActionTotals = () => {
        const txt = lastCalc ? `Total do cálculo: <b class="text-indigo-700">${esc(brl(lastCalc.grandTotal))}</b>` : '';
        $('actions-calc-total').innerHTML = txt;
        $('actions-total').innerHTML = isCalcType(manifestType()) ? txt : '';
        ['calc-preview-btn', 'calc-pdf-btn', 'calc-to-petition-btn'].forEach(id => { $(id).disabled = !lastCalc; });
    };

    // =====================================================================
    // GERADOR — partes
    // =====================================================================
    const addParty = (name = '', cpf = '') => {
        const row = document.createElement('div');
        row.className = 'party-row flex gap-2';
        row.innerHTML = `
            <input class="party-name inp flex-[2] uppercase auto-field" placeholder="Nome completo" value="${esc(name)}" autocomplete="off">
            <input class="party-cpf inp flex-1 cpf-input" placeholder="CPF/CNPJ (opcional)" inputmode="numeric" value="${esc(cpf)}" autocomplete="off">
            <button type="button" class="party-remove btn btn-ghost btn-xs text-red-600" title="Remover">✕</button>`;
        $('parties-list').appendChild(row);
        syncPartyRemoveButtons();
        return row;
    };
    const syncPartyRemoveButtons = () => { const rows = $$('.party-row'); rows.forEach(r => { r.querySelector('.party-remove').style.visibility = rows.length > 1 ? 'visible' : 'hidden'; }); };
    $('add-party-btn').addEventListener('click', () => { addParty().querySelector('.party-name').focus(); refreshAutoText(); });
    $('parties-list').addEventListener('click', (e) => {
        if (!e.target.closest('.party-remove')) return;
        e.target.closest('.party-row').remove(); syncPartyRemoveButtons(); refreshAutoText();
    });
    const getParties = () => $$('.party-row').map(r => ({ name: r.querySelector('.party-name').value.trim().toUpperCase(), cpf: r.querySelector('.party-cpf').value.trim() })).filter(p => p.name);

    // =====================================================================
    // GERADOR — tipos, seções e textos
    // =====================================================================
    const TYPES = {
        opcao1: { title: 'MANIFESTAÇÃO', intro: (v) => `${v.apresenta} sua MANIFESTAÇÃO, nos seguintes termos:`, hint: 'Escreva abaixo o que a parte pede, com as palavras dela.' },
        opcao2: { title: 'EMENDA À INICIAL', intro: (v) => `${v.vem} apresentar EMENDA À INICIAL, nos seguintes termos:`, hint: 'Explique o motivo da emenda e se há documentos juntados; para incluir parte, use "Incluir parte".' },
        opcao3: { title: 'ATUALIZAÇÃO DE ENDEREÇO', intro: (v) => `${v.vem} informar a ATUALIZAÇÃO DO SEU ENDEREÇO, nos seguintes termos:`, hint: 'Digite o CEP: rua, bairro e cidade são preenchidos sozinhos.' },
        opcao4: { title: 'INDICAÇÃO DE ENDEREÇO', intro: (v) => `${v.vem} INDICAR O ENDEREÇO DA PARTE CONTRÁRIA, nos seguintes termos:`, hint: 'Informe de quem é o endereço e digite o CEP.' },
        prazo: { title: 'PEDIDO DE PRAZO', intro: (v) => `${v.vem} requerer PRAZO, nos seguintes termos:`, hint: 'Escolha prazo ou sobrestamento, os dias e o motivo.' },
        nomeacaoDefensoria: { title: 'PEDIDO DE NOMEAÇÃO DE ADVOGADO', intro: (v) => `${v.vem} requerer a NOMEAÇÃO DE ADVOGADO PELA DEFENSORIA PÚBLICA, nos seguintes termos:`, hint: '' },
        desistencia: { title: 'DESISTÊNCIA DA AÇÃO', intro: (v) => `${v.vem} requerer a DESISTÊNCIA DA AÇÃO, nos seguintes termos:`, hint: '' },
        indicacaoBens: { title: 'INDICAÇÃO DE BENS À PENHORA', intro: (v) => `${v.vem} INDICAR BENS PASSÍVEIS DE PENHORA e requerer medidas para o prosseguimento da execução, nos seguintes termos:`, hint: 'Marque as medidas; para RENAJUD ou mandado pode indicar o bem específico.' },
        desbloqueioPenhora: { title: 'PEDIDO DE DESBLOQUEIO DE PENHORA', intro: (v) => `${v.vem} requerer o LEVANTAMENTO/DESBLOQUEIO DA PENHORA, nos seguintes termos:`, hint: 'Lembre de anexar extrato/holerite que comprove a origem do valor.' },
        opcao8: { title: 'MANIFESTAÇÃO SOBRE A CONTESTAÇÃO', intro: (v) => `${v.vem} apresentar MANIFESTAÇÃO SOBRE A CONTESTAÇÃO, nos seguintes termos:`, hint: 'Texto padrão completo: não precisa acrescentar nada.' },
        opcao9: { title: 'MANIFESTAÇÃO SOBRE A CONTESTAÇÃO', intro: (v) => `${v.vem} apresentar MANIFESTAÇÃO SOBRE A CONTESTAÇÃO, nos seguintes termos:`, hint: 'Texto padrão completo; descreva só as provas no campo próprio e, se for o caso, arrole testemunhas.' },
        opcao5: { title: 'MANIFESTAÇÃO SOBRE A CONTESTAÇÃO', intro: (v) => `${v.vem} apresentar MANIFESTAÇÃO SOBRE A CONTESTAÇÃO, nos seguintes termos:`, hint: 'Digite a réplica falada pela parte. Se for genérica, use os outros tipos de "Contestação".' },
        opcao6: { title: 'INDICAÇÃO DE PROVAS', intro: (v) => `${v.vem} INDICAR AS PROVAS que pretende produzir, nos seguintes termos:`, hint: 'Descreva as provas e, se houver, arrole até 3 testemunhas.' },
        descumprimento: { title: 'DESCUMPRIMENTO DE ACORDO', intro: (v) => `${v.apresenta} sua MANIFESTAÇÃO, nos seguintes termos:`, hint: 'Monte o acordo, marque as parcelas pagas (ajustando data/valor do depósito) e escolha as medidas. O texto e o valor se atualizam sozinhos.' },
        cumprimento: { title: 'CUMPRIMENTO DE SENTENÇA', intro: (v) => `${v.apresenta} sua MANIFESTAÇÃO, nos seguintes termos:`, hint: 'Lance os valores da condenação (data da correção e dos juros conforme a sentença). Marque a multa do art. 523 só se já houve intimação sem pagamento.' }
    };
    const isCalcType = (t) => t === 'descumprimento' || t === 'cumprimento';
    const manifestType = () => $('manifestation-type').value;

    /** Concordância com o nº de solicitantes: v.f('requer') → 'requerem' quando há mais de um. */
    const PLURAL = {
        informa: 'informam', Informa: 'Informam', requer: 'requerem', Requer: 'Requerem', indica: 'indicam', Indica: 'Indicam',
        declara: 'declaram', Declara: 'Declaram', possui: 'possuem', pugna: 'pugnam', impugna: 'impugnam',
        cientificada: 'cientificadas', segura: 'seguras', hipossuficiente: 'hipossuficientes', 'sua réplica': 'sua réplica',
        'sua conta': 'suas contas', 'seu endereço atual é': 'seu endereço atual é', 'seus interesses': 'seus interesses',
        'do próprio sustento e de sua família': 'do próprio sustento e de suas famílias'
    };
    const verbs = () => {
        const plural = getParties().length > 1;
        const f = (w) => (plural && PLURAL[w]) || w;
        return plural
            ? { apresenta: 'As partes acima qualificadas apresentam', vem: 'As partes acima qualificadas vêm', plural, f }
            : { apresenta: 'A parte acima qualificada apresenta', vem: 'A parte acima qualificada vem', plural, f };
    };

    const REPLICA = (v) => [
        `${v.f('Declara')} ter sido ${v.f('cientificada')} da possibilidade de constituição de advogado particular ou da nomeação de advogado pela Defensoria Pública, após triagem e caso atendidos os critérios daquela instituição, sentindo-se ${v.f('segura')} para apresentar ${v.plural ? 'sua réplica' : 'sua réplica'} nos seguintes termos:`,
        `${v.f('Declara')} ter lido a(s) contestação(ões) juntada(s) aos autos, ${v.f('impugna')} os argumentos da(s) parte(s) requerida(s), reiterando tudo o que foi exposto na inicial, e ${v.f('requer')} que seja afastada qualquer preliminar suscitada, bem como a narrativa dos fatos feita pela(s) parte(s) adversa(s).`,
        `${v.f('Declara')} que os fatos ocorreram da forma narrada na inicial e que a(s) parte(s) requerida(s) não comprovou(aram) suas alegações. Por fim, ${v.f('pugna')} pela total procedência da ação, nos mesmos termos da inicial.`
    ];

    const toRoman = (n) => { const m = [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]; let r = ''; m.forEach(([v, s]) => { while (n >= v) { r += s; n -= v; } }); return r; };
    const listLines = (items) => items.map((it, i) => `${toRoman(i + 1)}. ${it}${i === items.length - 1 ? '.' : ';'}`);

    const medidas = () => {
        const out = [];
        const indiv = (id) => { const box = $(id).closest('.medida-item'); const c = box.querySelector('.individualizar-check'); const v = box.querySelector('.individualizar-input').value.trim(); return c.checked && v ? v : ''; };
        if ($('bens-sisbajud').checked) {
            const teimosinha = (document.querySelector('input[name="sisbajud-type"]:checked') || {}).value === 'teimosinha';
            out.push(`a pesquisa e bloqueio de valores em contas bancárias via SISBAJUD${teimosinha ? ' (com reiteração de 30 dias)' : ''}`);
        }
        if ($('bens-renajud').checked) {
            const v = indiv('bens-renajud');
            out.push(v ? `a pesquisa, bloqueio e penhora, via RENAJUD, do veículo ${v}` : 'a pesquisa, bloqueio e penhora de veículos via RENAJUD');
        }
        if ($('bens-mandado').checked) {
            const v = indiv('bens-mandado');
            out.push(v ? `a expedição de mandado de penhora e avaliação do(s) seguinte(s) bem(ns): ${v}` : 'a expedição de mandado de penhora e avaliação de bens');
        }
        if ($('bens-outros-check').checked && $('bens-outros-text').value.trim()) out.push($('bens-outros-text').value.trim().replace(/[.;]\s*$/, ''));
        return out;
    };

    // Concordância de "quem pede" e "contra quem"
    const solicitante = () => {
        const v = $('exec-solicitante').value;
        if (v !== 'auto') return v;
        return getParties().length > 1 ? 'as partes exequentes' : 'a parte exequente';
    };
    const isPlural = (s) => /^(os|as) /.test(s);
    const contra = () => $('exec-contraria').value;
    const pela = (s) => s.replace(/^a /, 'pela ').replace(/^o /, 'pelo ').replace(/^as /, 'pelas ').replace(/^os /, 'pelos ');
    const da = (s) => s.replace(/^a /, 'da ').replace(/^o /, 'do ').replace(/^as /, 'das ').replace(/^os /, 'dos ');
    const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

    const parcelasNaoPagasTxt = (c) => {
        const ds = c.agreement.overdueUnpaid;
        if (!ds.length) return 'das parcelas pactuadas';
        if (ds.length === 1) return `da parcela de ${fd(ds[0])}`;
        if (ds.length <= 3) return `das parcelas de ${ds.slice(0, -1).map(fd).join(', ')} e ${fd(ds[ds.length - 1])}`;
        return `das parcelas vencidas a partir de ${fd(ds[0])} (${ds.length} parcelas)`;
    };

    /** Texto automático do corpo para o tipo atual (a partir dos campos). */
    const buildBody = () => {
        const t = manifestType();
        const v = verbs();
        const lines = [TYPES[t].intro(v)];
        const add = (s) => lines.push(s);
        switch (t) {
            case 'opcao3': case 'opcao4': {
                const end = enderecoTxt();
                if (t === 'opcao3') add(`${v.f('Informa')} que seu endereço atual é: ${end || '[preencha o endereço]'}.`);
                else {
                    const nome = $('name-address').value.trim().toUpperCase();
                    add(`${v.f('Indica')}, para fins de citação/intimação${nome ? ` de **${nome}**` : ' da parte contrária'}, o seguinte endereço: ${end || '[preencha o endereço]'}.`);
                }
                break;
            }
            case 'opcao2': {
                if ((document.querySelector('input[name="emenda-type"]:checked') || {}).value === 'incluir-parte') {
                    const polo = (document.querySelector('input[name="polo-type"]:checked') || {}).value || 'Ativo';
                    const parts = emendaParties();
                    add(`${v.f('Requer')} a inclusão da(s) parte(s) abaixo no polo ${polo.toLowerCase()} da ação:`);
                    parts.forEach(p => add(p));
                    if (!parts.length) add('[preencha os dados da parte a incluir]');
                }
                break;
            }
            case 'prazo': {
                const dias = parseInt($('prazo-dias').value, 10) || 30;
                let motivo = $('prazo-motivo').value;
                if (motivo === 'outro') motivo = $('prazo-motivo-outro').value.trim() || '[motivo]';
                const sobrest = (document.querySelector('input[name="prazo-tipo"]:checked') || {}).value === 'sobrestamento';
                add(sobrest ? `Requer o sobrestamento do feito pelo prazo de **${dias} dias**, ${motivo}.` : `Requer a concessão do prazo de **${dias} dias** ${motivo}.`);
                break;
            }
            case 'nomeacaoDefensoria':
                add(`Declarando-se ${v.f('hipossuficiente')}, ${v.f('requer')} seja oficiada a Defensoria Pública do Estado para a nomeação de advogado(a) que patrocine seus interesses no presente feito, por não possuir condições de arcar com os custos de advogado particular sem prejuízo ${v.f('do próprio sustento e de sua família')}.`);
                break;
            case 'desistencia':
                add(`${v.f('Informa')} que não ${v.f('possui')} mais interesse no prosseguimento da presente ação e ${v.f('requer')} a homologação da desistência, com a consequente extinção do processo, sem resolução do mérito, nos termos do art. 485, VIII, do Código de Processo Civil.`);
                break;
            case 'indicacaoBens': {
                const m = medidas();
                if (m.length) { add(`Diante da ausência de pagamento do débito, ${v.f('requer')} o prosseguimento da execução com as seguintes medidas:`); listLines(m).forEach(add); }
                break;
            }
            case 'desbloqueioPenhora': {
                let motivo = $('desbloqueio-motivo').value;
                if (motivo === 'outro') motivo = $('desbloqueio-motivo-outro').value.trim() || '[origem do valor]';
                add(`${v.f('Requer')} o imediato desbloqueio dos valores penhorados em ${v.f('sua conta')}, uma vez que são provenientes de **${motivo}**, verba de natureza impenhorável, nos termos do art. 833 do Código de Processo Civil.`);
                break;
            }
            case 'opcao8':
                REPLICA(v).forEach(add);
                add(`${v.f('Informa')} que **NÃO** ${v.f('possui')} outras provas a produzir e ${v.f('requer')} o julgamento antecipado do feito, com a procedência da ação, nos termos da inicial.`);
                break;
            case 'opcao9':
                REPLICA(v).forEach(add);
                add(`${v.f('Informa')} que **${v.f('requer')} a produção das seguintes provas**:`);
                break;
            case 'descumprimento': {
                const s = solicitante(), c = contra();
                const pl = isPlural(s);
                const calc = lastCalc && lastCalc.type === 'agreement' ? lastCalc : null;
                const quando = calc ? parcelasNaoPagasTxt(calc) : 'da(s) parcela(s) de [data]';
                add(`${pl ? 'Comparecem' : 'Comparece'} ${s} e ${pl ? 'noticiam' : 'noticia'} o descumprimento do acordo ${pela(c)}, que ${isPlural(c) ? 'deixaram' : 'deixou'} de realizar o depósito ${quando}.`);
                const fase = (document.querySelector('input[name="exec-fase"]:checked') || {}).value === 'conhecimento' ? 'o início do cumprimento de sentença' : 'o reinício da execução';
                const multa = calc && calc.values.penaltyPercent > 0 ? ', com aplicação de multa pelo descumprimento' : '';
                add(`Diante do exposto, ${pl ? 'requerem' : 'requer'} ${fase}${multa} e atualização do débito, que totaliza a quantia de ${calc ? brl(calc.grandTotal) : '[valor do cálculo]'}, conforme cálculo anexo.`);
                execTail(pl, c);
                break;
            }
            case 'cumprimento': {
                const s = solicitante(), c = contra();
                const pl = isPlural(s);
                const calc = lastCalc && lastCalc.type === 'condemnation' ? lastCalc : null;
                add(`${pl ? 'Comparecem' : 'Comparece'} ${s} e ${pl ? 'requerem' : 'requer'} o **CUMPRIMENTO DE SENTENÇA** em face ${da(c)}, tendo em vista o trânsito em julgado da r. sentença.`);
                if (calc && calc.values.fine523) {
                    add(`O débito atualizado, já acrescido da multa de 10% prevista no art. 523, § 1º, do Código de Processo Civil, totaliza a quantia de ${brl(calc.grandTotal)}, conforme cálculo anexo.`);
                    execTail(pl, c);
                } else {
                    const val = calc ? brl(calc.values.subtotal) : '[valor do cálculo]';
                    const comMulta = calc ? brl(calc.values.withFine523) : '[valor com multa]';
                    add(`Assim, ${pl ? 'requerem' : 'requer'} a intimação ${da(c)} para que, no prazo de 15 dias, efetue o pagamento do débito, no importe de ${val}, conforme cálculo anexo, sob pena de acréscimo da multa de 10% prevista no art. 523, § 1º, do Código de Processo Civil, totalizando a quantia de ${comMulta}.`);
                    const m = medidas();
                    if (m.length) { add(`Não havendo pagamento, ${pl ? 'requerem' : 'requer'}, desde já, o prosseguimento da execução com as seguintes medidas:`); listLines(m).forEach(add); }
                }
                break;
            }
            default: break; // tipos de texto livre: só a introdução
        }
        return lines.join('\n');

        function execTail(pl, c) {
            const m = medidas();
            if ($('exec-intimacao').checked) {
                add(`${pl ? 'Requerem' : 'Requer'} a intimação ${da(c)} para que efetue o pagamento do débito no prazo de ${$('exec-intimacao-prazo').value} dias, sob pena de penhora.`);
                if (m.length) { add(`Não havendo pagamento, ${pl ? 'indicam' : 'indica'} as seguintes medidas para o prosseguimento da execução:`); listLines(m).forEach(add); }
            } else if (m.length) {
                add(`Para o prosseguimento da execução, ${pl ? 'indicam' : 'indica'} as seguintes medidas:`);
                listLines(m).forEach(add);
            }
        }
    };

    const enderecoTxt = () => {
        const g = (id) => $(id).value.trim();
        const parts = [];
        if (g('rua')) parts.push(`${g('rua')}${g('numero') ? `, nº ${g('numero')}` : ', s/nº'}${g('complemento') ? `, ${g('complemento')}` : ''}`);
        if (g('bairro')) parts.push(`bairro ${g('bairro')}`);
        if (g('cidade')) parts.push(`${g('cidade')}${g('estado') ? '/' + g('estado').toUpperCase() : ''}`);
        if (g('cep')) parts.push(`CEP ${g('cep')}`);
        return parts.join(', ');
    };

    // ---------- texto automático x editado ----------
    const bodyEl = $('manifest-content');
    const titleEl = $('termo-title');
    let autoBody = '';
    let autoTitle = '';
    let staleDismissed = false;
    let lastTokens = {};

    const norm = (s) => s.replace(/\r/g, '').trim();
    const isBodyManual = () => norm(bodyEl.value) !== norm(autoBody);
    const autoResize = () => {
        const y = window.scrollY;
        bodyEl.style.height = 'auto';
        bodyEl.style.height = Math.max(224, bodyEl.scrollHeight + 4) + 'px';
        if (window.scrollY !== y) window.scrollTo(0, y); // não deixa a página "pular" enquanto digita
    };
    const updateTextStatus = () => {
        const manual = isBodyManual();
        const chip = $('text-status');
        chip.textContent = manual ? 'editado por você' : 'automático';
        chip.className = 'chip ' + (manual ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700');
    };

    /** Valores do cálculo que aparecem no texto: são trocados mesmo no texto editado. */
    const currentTokens = () => {
        if (!lastCalc) return {};
        if (lastCalc.type === 'agreement') return { total: brl(lastCalc.grandTotal) };
        return { total: brl(lastCalc.grandTotal), subtotal: brl(lastCalc.values.subtotal), with523: brl(lastCalc.values.withFine523) };
    };
    /**
     * Troca os valores antigos pelos novos no texto editado — só quando não há ambiguidade: se dois valores antigos eram
     * iguais e mudaram para valores diferentes, ou se o valor novo coincide com outro valor antigo (ex.: marcar a multa do
     * art. 523 faz o "total" virar o antigo "com multa"), não troca; o aviso amarelo cuida do caso.
     */
    const syncTokens = () => {
        const next = currentTokens();
        const olds = Object.values(lastTokens);
        const replaced = new Set();
        Object.keys(next).forEach(k => {
            const o = lastTokens[k], n = next[k];
            if (!o || !n || o === n || replaced.has(o)) return;
            const ambiguous = Object.keys(next).some(j => j !== k && lastTokens[j] === o && next[j] !== n) || olds.includes(n);
            if (!ambiguous && isBodyManual() && bodyEl.value.includes(o)) {
                bodyEl.value = bodyEl.value.split(o).join(n);
                autoBody = autoBody.split(o).join(n);
                replaced.add(o);
            }
        });
        lastTokens = next;
    };

    /**
     * Texto editado: as linhas que eram automáticas e mudaram nos campos (verbo no plural, CPF da parte incluída,
     * endereço, dias do prazo...) são atualizadas uma a uma, desde que o usuário não tenha mexido nelas.
     * Devolve true se o texto do usuário ficou em dia com o automático.
     */
    const syncChangedLines = (next) => {
        const oldLines = autoBody.split('\n'), newLines = next.split('\n');
        if (oldLines.length !== newLines.length) return false;
        const body = bodyEl.value.replace(/\r/g, '').split('\n');
        let ok = true;
        oldLines.forEach((ol, i) => {
            if (ol === newLines[i]) return;
            const at = body.findIndex(b => b.trim() === ol.trim());
            if (at === -1) { ok = false; return; }
            body[at] = newLines[i];
        });
        bodyEl.value = body.join('\n');
        return ok;
    };

    const refreshAutoText = ({ force = false, keepTitle = false } = {}) => {
        if (!isCalcType(manifestType()) || lastCalc) syncTokens();
        const next = buildBody();
        if (force || !isBodyManual()) {
            bodyEl.value = next;
            autoBody = next;
            staleDismissed = false;
            $('stale-banner').classList.add('hidden');
        } else if (norm(next) !== norm(autoBody)) {
            if (syncChangedLines(next)) { autoBody = next; $('stale-banner').classList.add('hidden'); }
            else if (!staleDismissed) {
                $('stale-calc-note').classList.toggle('hidden', !isCalcType(manifestType()));
                $('stale-banner').classList.remove('hidden'); // o banner oferece o texto novo; o do usuário fica intacto
            }
        }
        const nextTitle = TYPES[manifestType()].title;
        const customTitle = titleEl.value.trim() && titleEl.value.trim().toUpperCase() !== autoTitle;
        if ((force && !keepTitle) || !customTitle) titleEl.value = nextTitle;
        autoTitle = nextTitle;
        updateTextStatus();
        autoResize();
    };
    $('stale-apply').addEventListener('click', () => { refreshAutoText({ force: true, keepTitle: true }); toast('Texto automático aplicado.'); });
    $('stale-dismiss').addEventListener('click', () => { staleDismissed = true; $('stale-banner').classList.add('hidden'); });
    $('regen-text-btn').addEventListener('click', () => {
        if (isBodyManual() && !confirm('Refazer o texto a partir dos campos? As suas edições no texto serão perdidas.')) return;
        refreshAutoText({ force: true });
    });
    bodyEl.addEventListener('input', () => { updateTextStatus(); autoResize(); });
    $('copy-text-btn').addEventListener('click', async () => {
        const text = DocPDF.stripMarkup(bodyEl.value).replace(/ /g, ' ');
        try { await navigator.clipboard.writeText(text); }
        catch (e) { const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); }
        toast('Texto copiado.');
    });

    let autoTimer;
    const scheduleAutoText = () => { clearTimeout(autoTimer); autoTimer = setTimeout(() => refreshAutoText(), 250); };
    // Qualquer campo marcado com .auto-field (ou dentro de listas dinâmicas) refaz o texto automático
    $('manifest-app').addEventListener('input', (e) => { if (e.target.closest('.auto-field, #emenda-parte-list')) scheduleAutoText(); });
    $('manifest-app').addEventListener('change', (e) => { if (e.target.closest('.auto-field, #emenda-parte-list')) scheduleAutoText(); });

    const onCalcChanged = () => {
        if (currentTab === 'manifest' && isCalcType(manifestType())) refreshAutoText();
    };

    // ---------- troca de tipo ----------
    let prevType = manifestType();
    const syncManifestCalcMount = () => {
        const t = manifestType();
        if (t === 'descumprimento') mountCalcPanel($('calc-mount-manifest'), 'agreement');
        else if (t === 'cumprimento') mountCalcPanel($('calc-mount-manifest'), 'condemnation');
    };
    const updateManifestView = () => {
        const t = manifestType();
        const show = (id, on) => $(id).classList.toggle('hidden', !on);
        show('address-section', t === 'opcao3' || t === 'opcao4');
        $('name-address-field').style.display = t === 'opcao4' ? '' : 'none';
        show('emenda-section', t === 'opcao2');
        show('prazo-section', t === 'prazo');
        show('execucao-section', isCalcType(t));
        show('fase-wrap', t === 'descumprimento');
        show('medidas-section', t === 'indicacaoBens' || isCalcType(t));
        show('desbloqueio-section', t === 'desbloqueioPenhora');
        show('extra-content-container', t === 'opcao6' || t === 'opcao9');
        show('witness-details', t === 'opcao6' || t === 'opcao9');
        if (t === 'opcao6' || t === 'opcao9') $('witness-details').open = true;
        syncIntimacaoVisibility();
        $('pdf-split').classList.toggle('hidden', !isCalcType(t));
        $('pdf-split').classList.toggle('flex', isCalcType(t));
        $('type-hint').textContent = TYPES[t].hint || '';
        syncManifestCalcMount();
        if (isCalcType(t)) recalc();
        updateActionTotals();
    };
    /** No cumprimento sem a multa do 523 o texto já pede a intimação (prazo legal de 15 dias): o controle não se aplica. */
    const syncIntimacaoVisibility = () => {
        const hide = manifestType() === 'cumprimento' && !$('fine-523').checked;
        $('exec-intimacao-row').classList.toggle('hidden', hide);
        $('exec-intimacao-row').classList.toggle('flex', !hide);
    };
    $('fine-523').addEventListener('change', syncIntimacaoVisibility);

    $('manifestation-type').addEventListener('change', () => {
        if (isBodyManual() && norm(bodyEl.value) !== norm(TYPES[prevType].intro(verbs())) &&
            !confirm('Trocar o tipo substitui o texto que você escreveu/editou. Continuar?')) {
            $('manifestation-type').value = prevType;
            return;
        }
        prevType = manifestType();
        updateManifestView();
        refreshAutoText({ force: true });
        if (!isCalcType(prevType) && ['opcao1', 'opcao2', 'opcao5'].includes(prevType)) {
            bodyEl.focus(); bodyEl.setSelectionRange(bodyEl.value.length, bodyEl.value.length);
        }
    });

    // Seções com campos que mostram/escondem outros
    $('prazo-motivo').addEventListener('change', () => $('prazo-motivo-outro').classList.toggle('hidden', $('prazo-motivo').value !== 'outro'));
    $('desbloqueio-motivo').addEventListener('change', () => $('desbloqueio-motivo-outro').classList.toggle('hidden', $('desbloqueio-motivo').value !== 'outro'));
    $('bens-outros-check').addEventListener('change', () => $('bens-outros-text').classList.toggle('hidden', !$('bens-outros-check').checked));
    $('exec-intimacao').addEventListener('change', () => $('exec-intimacao-prazo').classList.toggle('hidden', !$('exec-intimacao').checked));
    $('medidas-section').addEventListener('change', (e) => {
        if (e.target.classList.contains('individualizar-check')) {
            const input = e.target.closest('.medida-item').querySelector('.individualizar-input');
            input.classList.toggle('hidden', !e.target.checked);
            if (e.target.checked) input.focus();
        }
    });
    document.querySelectorAll('input[name="emenda-type"]').forEach(r => r.addEventListener('change', () => {
        const incluir = (document.querySelector('input[name="emenda-type"]:checked') || {}).value === 'incluir-parte';
        $('emenda-incluir-parte-section').classList.toggle('hidden', !incluir);
        $('polo-wrap').classList.toggle('hidden', !incluir);
        if (incluir && !$$('#emenda-parte-list .eparty').length) addEmendaParty();
    }));
    document.querySelectorAll('input[name="polo-type"]').forEach(r => r.addEventListener('change', () => {
        const passivo = (document.querySelector('input[name="polo-type"]:checked') || {}).value === 'Passivo';
        $$('#emenda-parte-list .ep-dob-wrap').forEach(w => w.classList.toggle('hidden', passivo));
        $$('#emenda-parte-list .ep-noaddr-wrap').forEach(w => w.classList.toggle('hidden', !passivo));
    }));

    // ---------- CEP (endereço) ----------
    const lookupCep = async (cep, fill) => {
        try {
            const r = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const d = await r.json();
            if (d.erro) { toast('CEP não encontrado - preencha o endereço manualmente.'); return; }
            fill(d);
        } catch (e) { toast('Não foi possível consultar o CEP agora - preencha manualmente.'); }
    };
    $('cep').addEventListener('input', () => {
        $('cep').value = maskCep($('cep').value);
        const cep = $('cep').value.replace(/\D/g, '');
        if (cep.length === 8) lookupCep(cep, (d) => {
            $('rua').value = d.logradouro || ''; $('bairro').value = d.bairro || ''; $('cidade').value = d.localidade || ''; $('estado').value = d.uf || '';
            $('numero').focus(); scheduleAutoText();
        });
    });

    // ---------- emenda: incluir parte ----------
    const addEmendaParty = () => {
        const passivo = (document.querySelector('input[name="polo-type"]:checked') || {}).value === 'Passivo';
        const box = document.createElement('div');
        box.className = 'eparty p-3 border rounded-xl bg-white relative space-y-2';
        box.innerHTML = `
            <button type="button" class="ep-remove absolute top-2 right-2 btn btn-ghost btn-xs text-red-600" title="Remover parte">✕</button>
            <div class="grid grid-cols-1 md:grid-cols-6 gap-2 pr-8">
                <div class="md:col-span-3"><label class="lbl">Nome completo *</label><input class="ep-name inp inp-sm uppercase"></div>
                <div class="md:col-span-1"><label class="lbl">CPF/CNPJ</label><input class="ep-cpf inp inp-sm cpf-input" inputmode="numeric"></div>
                <div class="md:col-span-2"><label class="lbl">Estado civil</label><select class="ep-civil inp inp-sm"><option value="">-</option><option>solteiro(a)</option><option>casado(a)</option><option>em união estável</option><option>separado(a)</option><option>divorciado(a)</option><option>viúvo(a)</option></select></div>
                <div class="md:col-span-2"><label class="lbl">Profissão</label><input class="ep-prof inp inp-sm"></div>
                <div class="md:col-span-1"><label class="lbl">RG</label><input class="ep-rg inp inp-sm"></div>
                <div class="md:col-span-1"><label class="lbl">Órgão exp.</label><input class="ep-emitter inp inp-sm" placeholder="SSP/SP"></div>
                <div class="md:col-span-1 ep-dob-wrap ${passivo ? 'hidden' : ''}"><label class="lbl">Nascimento</label><input class="ep-dob inp inp-sm date-input" placeholder="DD/MM/AAAA"></div>
                <div class="md:col-span-1"><label class="lbl">Telefone</label><input class="ep-phone inp inp-sm phone-input" inputmode="tel"></div>
                <div class="md:col-span-2"><label class="lbl">E-mail</label><input class="ep-email inp inp-sm" type="email"></div>
                <div class="md:col-span-1"><label class="lbl">CEP</label><input class="ep-cep inp inp-sm" inputmode="numeric" maxlength="9"></div>
                <div class="md:col-span-3"><label class="lbl">Logradouro</label><input class="ep-street inp inp-sm"></div>
                <div class="md:col-span-1"><label class="lbl">Nº</label><input class="ep-number inp inp-sm"></div>
                <div class="md:col-span-1"><label class="lbl">Compl.</label><input class="ep-compl inp inp-sm"></div>
                <div class="md:col-span-2"><label class="lbl">Bairro</label><input class="ep-district inp inp-sm"></div>
                <div class="md:col-span-2"><label class="lbl">Cidade</label><input class="ep-city inp inp-sm"></div>
                <div class="md:col-span-1"><label class="lbl">UF</label><input class="ep-state inp inp-sm" maxlength="2"></div>
            </div>
            <label class="ep-noaddr-wrap ${passivo ? '' : 'hidden'} flex items-center gap-2 text-sm"><input type="checkbox" class="ep-noaddr chk"> Não tem o endereço desta parte (lugar incerto)</label>`;
        $('emenda-parte-list').appendChild(box);
        scheduleAutoText();
    };
    $('add-emenda-party-btn').addEventListener('click', addEmendaParty);
    $('emenda-parte-list').addEventListener('click', (e) => { if (e.target.closest('.ep-remove')) { e.target.closest('.eparty').remove(); scheduleAutoText(); } });
    $('emenda-parte-list').addEventListener('input', (e) => {
        if (!e.target.classList.contains('ep-cep')) return;
        e.target.value = maskCep(e.target.value);
        const cep = e.target.value.replace(/\D/g, '');
        const box = e.target.closest('.eparty');
        if (cep.length === 8) lookupCep(cep, (d) => {
            box.querySelector('.ep-street').value = d.logradouro || ''; box.querySelector('.ep-district').value = d.bairro || '';
            box.querySelector('.ep-city').value = d.localidade || ''; box.querySelector('.ep-state').value = d.uf || '';
            box.querySelector('.ep-number').focus(); scheduleAutoText();
        });
    });
    const emendaParties = () => {
        const passivo = (document.querySelector('input[name="polo-type"]:checked') || {}).value === 'Passivo';
        return $$('#emenda-parte-list .eparty').map(b => {
            const g = (c) => b.querySelector(c).value.trim();
            if (!g('.ep-name')) return null;
            let s = `**${g('.ep-name').toUpperCase()}**`;
            if (g('.ep-civil')) s += `, ${g('.ep-civil')}`;
            if (g('.ep-prof')) s += `, ${g('.ep-prof')}`;
            if (!passivo && g('.ep-dob')) s += `, nascido(a) em ${g('.ep-dob')}`;
            if (g('.ep-rg')) s += `, portador(a) do RG nº ${g('.ep-rg')}${g('.ep-emitter') ? ` - ${g('.ep-emitter').toUpperCase()}` : ''}`;
            if (g('.ep-cpf')) s += `, inscrito(a) no CPF/CNPJ sob o nº ${g('.ep-cpf')}`;
            if (passivo && b.querySelector('.ep-noaddr').checked) s += ', atualmente em lugar incerto e não sabido';
            else if (g('.ep-street') || g('.ep-city')) {
                const addr = [g('.ep-street') ? `${g('.ep-street')}${g('.ep-number') ? `, nº ${g('.ep-number')}` : ', s/nº'}${g('.ep-compl') ? `, ${g('.ep-compl')}` : ''}` : '',
                g('.ep-district') ? `bairro ${g('.ep-district')}` : '', g('.ep-city') ? `${g('.ep-city')}${g('.ep-state') ? '/' + g('.ep-state').toUpperCase() : ''}` : '', g('.ep-cep') ? `CEP ${g('.ep-cep')}` : ''].filter(Boolean).join(', ');
                s += `, residente e domiciliado(a) em ${addr}`;
            }
            if (g('.ep-phone')) s += `, telefone ${g('.ep-phone')}`;
            if (g('.ep-email')) s += `, e-mail ${g('.ep-email')}`;
            return s + '.';
        }).filter(Boolean);
    };

    // ---------- testemunhas ----------
    $('add-witness-btn').addEventListener('click', () => {
        if ($$('.witness-item').length >= 3) { toast('No Juizado, no máximo 3 testemunhas.'); return; }
        const box = document.createElement('div');
        box.className = 'witness-item p-3 border rounded-xl relative grid grid-cols-1 md:grid-cols-6 gap-2';
        box.innerHTML = `
            <button type="button" class="witness-remove absolute top-2 right-2 btn btn-ghost btn-xs text-red-600" title="Remover">✕</button>
            <div class="md:col-span-3 pr-8 md:pr-0"><label class="lbl">Nome completo</label><input class="witness-name inp inp-sm uppercase"></div>
            <div class="md:col-span-2"><label class="lbl">Documento (RG/CPF)</label><input class="witness-doc inp inp-sm"></div>
            <div class="md:col-span-1 flex items-end pb-1 md:pr-8"><label class="flex items-center gap-1 text-sm cursor-pointer" title="Marque se a testemunha precisa ser intimada pelo juízo (endereço obrigatório)"><input type="checkbox" class="witness-intimation chk"> Intimar</label></div>
            <div class="md:col-span-6"><label class="lbl witness-address-label">Endereço completo</label><input class="witness-address inp inp-sm"></div>`;
        $('witness-list').appendChild(box);
        box.querySelector('.witness-name').focus();
    });
    $('witness-list').addEventListener('click', (e) => { if (e.target.closest('.witness-remove')) e.target.closest('.witness-item').remove(); });
    $('witness-list').addEventListener('change', (e) => {
        if (!e.target.classList.contains('witness-intimation')) return;
        e.target.closest('.witness-item').querySelector('.witness-address-label').innerHTML = 'Endereço completo' + (e.target.checked ? ' <span class="text-red-500">*</span>' : '');
    });

    // ---------- documentos ----------
    const DOC_TYPES = ['RG/CPF', 'Comprovante de Residência', 'Comprovante de Pagamento/Depósito', 'Comprovante de Transferência/PIX', 'Extrato Bancário', 'Holerite/Comprovante de Benefício', 'Nota Fiscal', 'Conversas em WhatsApp', 'Foto/Print', 'Contrato/Termo de Adesão', 'Laudo/Atestado Médico', 'Boletim de Ocorrência', 'Outro'];
    const addDocument = (type) => {
        const box = document.createElement('div');
        box.className = 'document-item p-3 border rounded-xl relative grid grid-cols-1 md:grid-cols-2 gap-2';
        box.innerHTML = `
            <button type="button" class="document-remove absolute top-2 right-2 btn btn-ghost btn-xs text-red-600" title="Remover">✕</button>
            <div class="pr-8 md:pr-0"><label class="lbl">Documento</label><select class="document-type inp inp-sm">${DOC_TYPES.map(t => `<option>${t}</option>`).join('')}</select>
                <input class="document-other-type inp inp-sm mt-1 hidden" placeholder="Qual documento?"></div>
            <div class="md:pr-8"><label class="lbl">Para comprovar (opcional)</label><input class="document-explanation inp inp-sm" placeholder="Ex.: os depósitos realizados"></div>`;
        $('document-list').appendChild(box);
        if (type) box.querySelector('.document-type').value = type;
        updateDocCount();
    };
    const updateDocCount = () => { const n = $$('.document-item').length; $('doc-count').textContent = n ? `(${n})` : '(nenhum)'; };
    $('add-document-btn').addEventListener('click', () => addDocument());
    $('document-list').addEventListener('click', (e) => { if (e.target.closest('.document-remove')) { e.target.closest('.document-item').remove(); updateDocCount(); } });
    $('document-list').addEventListener('change', (e) => {
        if (e.target.classList.contains('document-type')) e.target.closest('.document-item').querySelector('.document-other-type').classList.toggle('hidden', e.target.value !== 'Outro');
    });

    // =====================================================================
    // Montagem do documento e PDF
    // =====================================================================
    const buildManifestModel = () => {
        const t = manifestType();
        const parties = getParties();
        const names = parties.map(p => p.cpf ? `${p.name} (CPF/CNPJ ${p.cpf})` : p.name).join('; ');
        const body = [bodyEl.value.replace(/\r/g, '')];

        if (!$('extra-content-container').classList.contains('hidden') && $('extra-content').value.trim()) body.push($('extra-content').value.trim());

        const witnesses = $$('.witness-item').map(w => ({
            name: w.querySelector('.witness-name').value.trim().toUpperCase(), doc: w.querySelector('.witness-doc').value.trim(),
            address: w.querySelector('.witness-address').value.trim(), intimar: w.querySelector('.witness-intimation').checked
        })).filter(w => w.name);
        if (!$('witness-details').classList.contains('hidden') && witnesses.length) {
            body.push('# ROL DE TESTEMUNHAS');
            witnesses.forEach((w, i) => body.push(`${i + 1}. **${w.name}**${w.doc ? `, portador(a) do documento nº ${w.doc}` : ''}${w.address ? `, residente em ${w.address}` : ''}.`));
            const intim = witnesses.filter(w => w.intimar).map(w => w.name);
            const v = verbs();
            const lista = intim.length > 1 ? `${intim.slice(0, -1).join(', ')} e ${intim[intim.length - 1]}` : intim[0];
            if (intim.length) {
                body.push(`${v.f('Requer')} a intimação pessoal ${intim.length > 1 ? 'das testemunhas' : 'da testemunha'} ${lista}.` +
                    (intim.length < witnesses.length ? ` ${witnesses.length - intim.length > 1 ? 'As demais comparecerão' : 'A outra testemunha comparecerá'} independentemente de intimação.` : ''));
            } else {
                body.push(`${witnesses.length > 1 ? 'As testemunhas comparecerão' : 'A testemunha comparecerá'} à audiência independentemente de intimação.`);
            }
        }

        const docs = $$('.document-item').map(d => {
            let type = d.querySelector('.document-type').value;
            if (type === 'Outro') type = d.querySelector('.document-other-type').value.trim();
            return { type, why: d.querySelector('.document-explanation').value.trim() };
        }).filter(d => d.type);
        if (docs.length) {
            body.push('# DOCUMENTOS QUE ACOMPANHAM A MANIFESTAÇÃO');
            docs.forEach(d => body.push(`- ${d.type}${d.why ? `: ${d.why}` : ''}.`));
        }

        let signatures = parties.map(p => p.name);
        if (t === 'opcao2' && (document.querySelector('input[name="emenda-type"]:checked') || {}).value === 'incluir-parte'
            && (document.querySelector('input[name="polo-type"]:checked') || {}).value === 'Ativo') {
            signatures = [...signatures, ...$$('#emenda-parte-list .ep-name').map(i => i.value.trim().toUpperCase()).filter(Boolean)];
        }
        return {
            header: CONFIG.juizo,
            meta: [`**Processo nº: ${processNumber()}**`, `**${parties.length > 1 ? 'Solicitantes' : 'Solicitante'}: ${names}**`],
            title: `TERMO - ${(titleEl.value.trim() || TYPES[t].title).toUpperCase()}`,
            body: body.join('\n'),
            closing: 'Nestes termos, pede deferimento.',
            dateLine: `${CONFIG.cidade}, ${longDate(new Date())}.`,
            signatures: [...new Set(signatures)]
        };
    };

    const validateManifest = (kind) => {
        const problems = [];
        if (!processNumber()) problems.push(['process-number', 'o nº do processo']);
        if (!getParties().length) problems.push([$$('.party-name')[0], 'o nome do solicitante']);
        if (kind !== 'calc' && !norm(bodyEl.value)) problems.push(['manifest-content', 'o texto da petição']);
        if (isCalcType(manifestType()) && kind !== 'petition' && !lastCalc) problems.push([null, 'um cálculo válido (' + (calcMessage ? calcMessage.text : 'confira os dados do cálculo') + ')']);
        for (const w of $$('.witness-item')) {
            if (!$('witness-details').classList.contains('hidden') && w.querySelector('.witness-intimation').checked && !w.querySelector('.witness-address').value.trim()) {
                problems.push([w.querySelector('.witness-address'), `o endereço da testemunha ${w.querySelector('.witness-name').value.trim() || ''} (pediu intimação)`]);
            }
        }
        if (problems.length) {
            const [first] = problems;
            const el = typeof first[0] === 'string' ? $(first[0]) : first[0];
            if (el) { el.focus(); el.classList.add('ring-2', 'ring-red-400'); setTimeout(() => el.classList.remove('ring-2', 'ring-red-400'), 2500); }
            alert('Falta preencher:\n• ' + problems.map(p => p[1]).join('\n• '));
            return false;
        }
        const placeholders = kind === 'calc' ? null : bodyEl.value.match(/\[(?:preencha|valor|data|motivo|origem)[^\]]*\]/g);
        if (placeholders && !confirm(`O texto ainda tem trechos a preencher: ${[...new Set(placeholders)].join(', ')}.\n\nGerar mesmo assim?`)) return false;
        if (isCalcType(manifestType()) && kind !== 'calc' && lastCalc && !bodyEl.value.includes(brl(lastCalc.grandTotal))
            && !(lastCalc.type === 'condemnation' && bodyEl.value.includes(brl(lastCalc.values.subtotal)))) {
            if (!confirm(`O valor do cálculo (${brl(lastCalc.grandTotal)}) não aparece no texto da petição. Gerar mesmo assim?`)) return false;
        }
        return true;
    };

    const newPdf = () => new window.jspdf.jsPDF('p', 'mm', 'a4');
    const fileDigits = () => processNumber().replace(/\D/g, '') || 'sem-numero';
    const calcMeta = () => ({ processNumber: processNumber(), parties: getParties().length ? `${getParties().length > 1 ? 'Exequentes' : 'Exequente'}: ${getParties().map(p => p.name).join('; ')}` : '' });

    /** kind: 'full' | 'petition' | 'calc' */
    const buildManifestPdf = (kind) => {
        const pdf = newPdf();
        let petPages = 0;
        const withCalc = isCalcType(manifestType()) && lastCalc && kind !== 'petition';
        if (kind !== 'calc') petPages = DocPDF.renderDocument(pdf, buildManifestModel());
        if (withCalc) { if (kind !== 'calc') pdf.addPage(); DocPDF.addDemonstrativo(pdf, lastCalc, calcMeta()); }
        const prefix = kind === 'calc' ? 'Calculo' : (isCalcType(manifestType()) && kind === 'full' ? 'Peticao_e_Calculo' : 'Manifestacao');
        return { pdf, name: `${prefix}_${fileDigits()}.pdf`, info: petPages ? `Petição em ${petPages} página${petPages > 1 ? 's' : ''}${withCalc ? ' + demonstrativo de cálculo' : ''}` : 'Demonstrativo de cálculo' };
    };

    let previewUrl = null;
    let previewDoc = null;
    const openPreview = (built) => {
        previewDoc = built;
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        previewUrl = URL.createObjectURL(built.pdf.output('blob'));
        $('preview-frame').src = previewUrl + '#view=FitH';
        $('preview-info').textContent = `${built.info} · ${built.name}`;
        $('preview-modal').classList.remove('hidden');
    };
    const closePreview = () => { $('preview-modal').classList.add('hidden'); $('preview-frame').src = 'about:blank'; };
    $('preview-close').addEventListener('click', closePreview);
    $('preview-modal').addEventListener('click', (e) => { if (e.target === $('preview-modal')) closePreview(); });
    $('preview-download').addEventListener('click', () => { if (previewDoc) { previewDoc.pdf.save(previewDoc.name); markSaved(); } });

    $('preview-manifest-btn').addEventListener('click', () => { if (validateManifest('full')) openPreview(buildManifestPdf('full')); });
    $('generate-manifest-btn').addEventListener('click', () => { if (validateManifest('full')) { const b = buildManifestPdf('full'); b.pdf.save(b.name); markSaved(); } });
    $('pdf-only-petition').addEventListener('click', () => { if (validateManifest('petition')) { const b = buildManifestPdf('petition'); b.pdf.save(b.name); markSaved(); } });
    $('pdf-only-calc').addEventListener('click', () => { if (validateManifest('calc')) { const b = buildManifestPdf('calc'); b.pdf.save(b.name); } });

    // Calculadora: PDF só do cálculo e atalho para a petição
    const buildCalcPdf = () => {
        const pdf = newPdf();
        DocPDF.addDemonstrativo(pdf, lastCalc, calcMeta());
        return { pdf, name: `Calculo_${fileDigits()}.pdf`, info: 'Demonstrativo de cálculo' };
    };
    $('calc-preview-btn').addEventListener('click', () => { if (lastCalc) openPreview(buildCalcPdf()); });
    $('calc-pdf-btn').addEventListener('click', () => { if (lastCalc) { const b = buildCalcPdf(); b.pdf.save(b.name); } });
    $('calc-to-petition-btn').addEventListener('click', () => {
        const calcType = $('calc-type').value;
        const type = calcType === 'agreement' ? 'descumprimento' : 'cumprimento';
        const sel = $('manifestation-type');
        const changed = sel.value !== type;
        if (changed) {
            if (isBodyManual() && norm(bodyEl.value) !== norm(TYPES[sel.value].intro(verbs())) && !confirm('O texto que você editou no gerador será substituído. Continuar?')) return;
            sel.value = type; prevType = type;
        }
        calcTabType = calcType;
        setTab('manifest');
        updateManifestView();
        // mesmo tipo: preserva o texto editado (valores do cálculo são trocados sozinhos)
        refreshAutoText({ force: changed });
        window.scrollTo({ top: 0, behavior: 'smooth' });
        if (!processNumber()) $('process-number').focus();
        else if (!getParties().length) $$('.party-name')[0].focus();
    });

    // =====================================================================
    // Limpar, proteção contra perda e atalhos
    // =====================================================================
    let savedSnapshot = null;
    const formSnapshot = () => $$('input, textarea, select').map(el => (el.type === 'checkbox' || el.type === 'radio') ? el.checked : el.value).join('|') + '#' + parcelState.map(s => `${s.paid}${s.payDate}${s.payValue}`).join(',');
    const markSaved = () => { savedSnapshot = formSnapshot(); };
    let pristine = null;
    window.addEventListener('beforeunload', (e) => {
        const snap = formSnapshot();
        if (snap !== pristine && snap !== savedSnapshot) { e.preventDefault(); e.returnValue = ''; }
    });

    const resetAll = () => {
        $$('#manifest-app input[type="text"], #manifest-app input:not([type]), #manifest-app input[type="email"], #manifest-app textarea, #calc-panel input:not([type]), #calc-panel input[type="text"], #calc-panel input[type="number"]').forEach(i => { i.value = ''; });
        procInputs.forEach(i => { i.value = ''; });
        $('parties-list').innerHTML = ''; addParty();
        $('emenda-parte-list').innerHTML = ''; $('witness-list').innerHTML = ''; $('document-list').innerHTML = ''; updateDocCount();
        $('calc-rows').innerHTML = ''; addCalcRow();
        $('groups-list').innerHTML = ''; $('extras-list').innerHTML = '';
        $('prazo-dias').value = '30';
        $('fine-523').checked = false; $('ag-last-different').checked = false; $('ag-last-value').classList.add('hidden');
        $('ag-interest').checked = true;
        document.querySelector('input[name="installment-mode"][value="regular"]').checked = true;
        $('regular-fields').classList.remove('hidden'); $('irregular-fields').classList.add('hidden');
        $('calc-final-date').value = fd(E.today());
        $$('.individualizar-input').forEach(i => i.classList.add('hidden'));
        $$('.individualizar-check').forEach(c => { c.checked = false; });
        $('bens-outros-check').checked = false; $('bens-outros-text').classList.add('hidden');
        $('exec-intimacao').checked = false; $('exec-intimacao-prazo').classList.add('hidden');
        // Todas as escolhas voltam ao padrão (selects, rádios e caixas), para o próximo atendimento não herdar nada
        $$('#manifest-app select, #calc-panel select').forEach(s => {
            const o = [...s.options].find(op => op.defaultSelected) || s.options[0];
            if (o) s.value = o.value;
        });
        $$('#manifest-app input[type="radio"], #manifest-app input[type="checkbox"], #calc-panel input[type="radio"], #calc-panel input[type="checkbox"]')
            .forEach(i => { i.checked = i.defaultChecked; });
        penaltySelect.value = String(store.get('penalty', 20)); if (!penaltySelect.value) penaltySelect.value = '20';
        const mr = document.querySelector(`input[name="ag-method"][value="${store.get('method', 'saldo')}"]`); if (mr) mr.checked = true;
        ['prazo-motivo-outro', 'desbloqueio-motivo-outro', 'emenda-incluir-parte-section', 'polo-wrap', 'ag-penalty-custom'].forEach(id => $(id).classList.add('hidden'));
        parcelState = []; schedule = [];
        refreshSchedule();
        $('manifestation-type').value = 'opcao1'; prevType = 'opcao1';
        updateManifestView();
        recalc();
        refreshAutoText({ force: true });
        pristine = formSnapshot(); savedSnapshot = null;
        window.scrollTo({ top: 0, behavior: 'smooth' });
        $('process-number').focus();
    };
    $('clear-manifest-btn').addEventListener('click', () => { if (confirm('Limpar todos os campos para um novo atendimento?')) resetAll(); });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !$('preview-modal').classList.contains('hidden')) closePreview();
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            if (currentTab === 'manifest') $('preview-manifest-btn').click(); else $('calc-preview-btn').click();
        }
    });

    // =====================================================================
    // Inicialização
    // =====================================================================
    addParty();
    addCalcRow();
    updateDocCount();
    $('calc-final-date').value = fd(E.today());
    const savedMethod = store.get('method', 'saldo');
    const methodRadio = document.querySelector(`input[name="ag-method"][value="${savedMethod}"]`);
    if (methodRadio) methodRadio.checked = true;
    if (location.hash === '#calculadora') setTab('calc', { fromHash: true });
    else setTab('manifest', { fromHash: true });
    updateManifestView();
    refreshAutoText({ force: true });
    pristine = formSnapshot();
    loadIndices();
});
