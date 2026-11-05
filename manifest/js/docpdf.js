/*
 * Geração dos PDFs do /manifest (jsPDF + autoTable).
 *
 * renderDocument(pdf, model): petição/manifestação com paginação inteligente:
 *   1) tenta caber em UMA página, reduzindo apenas espaços em branco e o entrelinhamento (no mínimo ~1,5) — a
 *      fonte continua 12 pt;
 *   2) se não couber, usa o espaçamento normal e quebra páginas sem deixar linha órfã/viúva (mín. 2 linhas de
 *      cada lado da quebra) e mantendo o fecho ("Nestes termos", data e 1ª assinatura) junto com o fim do último
 *      parágrafo — a assinatura nunca vai sozinha para a página seguinte.
 *
 * Marcação aceita no texto: **negrito** (ou <strong>/<b>), itálico com <i>/<em>; linha começando com "# " vira
 * título centralizado em negrito. Cada linha não vazia é um parágrafo.
 *
 * addDemonstrativo(pdf, calc, meta): demonstrativo de cálculo (condenação ou acordo).
 */
(function (global) {
    'use strict';

    const FONT = 'times';
    const SIZE = 12;
    const PAGE = { w: 210, h: 297, top: 20, bottom: 18, left: 25, right: 20 };
    const INDENT = 12.5; // recuo da 1ª linha (mm)

    // Níveis de compactação. O 0 é o padrão (entrelinha ~1,9, como sempre foi); o último ainda é confortável (~1,55).
    const LEVELS = [
        { line: 8.0, para: 4.0, afterHeader: 22, afterMeta: 10, afterTitle: 10, beforeClosing: 10, afterClosing: 12, beforeSign: 22, sign: 16 },
        { line: 7.6, para: 3.0, afterHeader: 16, afterMeta: 8, afterTitle: 8, beforeClosing: 8, afterClosing: 10, beforeSign: 19, sign: 15 },
        { line: 7.2, para: 2.5, afterHeader: 12, afterMeta: 6, afterTitle: 7, beforeClosing: 6, afterClosing: 8, beforeSign: 17, sign: 14 },
        { line: 6.6, para: 2.0, afterHeader: 9, afterMeta: 5, afterTitle: 5, beforeClosing: 5, afterClosing: 6, beforeSign: 15, sign: 13 }
    ];

    /**
     * As fontes padrão do PDF só têm o conjunto Windows-1252. Texto colado do WhatsApp/Word traz caracteres invisíveis
     * (marcas de direção), espaços e hífens especiais e emojis, que saem embaralhados: normaliza o que dá e remove o resto.
     */
    const clean = (s) => String(s ?? '').normalize('NFC')
        .replace(/[​-‏‪-‮⁠-⁩﻿­]/g, '')
        .replace(/[‐‑‒−⁃]/g, '-')
        .replace(/[ -   　]/g, ' ')
        .replace(/[′ʼ]/g, "'").replace(/″/g, '"')
        .replace(/ﬁ/g, 'fi').replace(/ﬂ/g, 'fl')
        .replace(/\t/g, ' ')
        .replace(/[^\n\x20-\x7E -ÿŒœŠšŸŽžƒˆ˜–—‘-„†-•…‰‹›€™]/gu, '');

    // ---------- texto rico ----------
    const styleOf = (bold, italic) => (bold && italic ? 'bolditalic' : bold ? 'bold' : italic ? 'italic' : 'normal');

    /** Converte a marcação em "runs" {text, bold, italic}. */
    function parseRuns(text) {
        const runs = [];
        let bold = false, italic = false;
        const re = /(\*\*|<\/?(?:strong|b)>|<\/?(?:em|i)>)/gi;
        let last = 0, m;
        const push = (t) => { if (t) runs.push({ text: t, bold, italic }); };
        while ((m = re.exec(text)) !== null) {
            push(text.slice(last, m.index));
            const tok = m[0].toLowerCase();
            if (tok === '**') bold = !bold;
            else if (tok === '<strong>' || tok === '<b>') bold = true;
            else if (tok === '</strong>' || tok === '</b>') bold = false;
            else if (tok === '<em>' || tok === '<i>') italic = true;
            else if (tok === '</em>' || tok === '</i>') italic = false;
            last = m.index + m[0].length;
        }
        push(text.slice(last));
        return runs;
    }

    /** Remove a marcação (para copiar o texto puro). */
    const stripMarkup = (text) => text.split('\n').map(line => parseRuns(line.replace(/^#\s+/, '')).map(r => r.text).join('')).join('\n');

    const width = (pdf, text, style) => { pdf.setFont(FONT, style); return pdf.getStringUnitWidth(text) * SIZE / pdf.internal.scaleFactor; };

    /** Palavras = sequências sem espaço comum (o espaço não separável, usado em "R$ 1,00", mantém junto). */
    function toWords(pdf, runs) {
        const words = [];
        let cur = null;
        runs.forEach(run => {
            run.text.split(/([ \t\r\n]+)/).forEach(part => {
                if (!part) return;
                if (/^[ \t\r\n]+$/.test(part)) { cur = null; return; }
                if (!cur) { cur = { runs: [], w: 0 }; words.push(cur); }
                const style = styleOf(run.bold, run.italic);
                cur.runs.push({ text: part, style });
                cur.w += width(pdf, part, style);
            });
        });
        return words;
    }

    /** Quebra em linhas. firstIndent só na 1ª linha. Palavra maior que a linha é partida por caracteres. */
    function wrap(pdf, words, maxWidth, firstIndent) {
        const space = width(pdf, ' ', 'normal');
        const lines = [];
        let line = [], lineW = 0;
        const avail = () => maxWidth - (lines.length === 0 ? firstIndent : 0);
        const flush = () => { lines.push({ words: line, w: lineW }); line = []; lineW = 0; };
        words.forEach(word => {
            const add = (line.length ? space : 0) + word.w;
            if (line.length && lineW + add > avail()) flush();
            if (!line.length && word.w > avail()) {
                // palavra gigante (ex.: link): parte em pedaços que caibam
                let chunk = { runs: [], w: 0 };
                word.runs.forEach(r => {
                    for (const ch of r.text) {
                        const cw = width(pdf, ch, r.style);
                        if (chunk.w + cw > avail() && chunk.w > 0) { line = [chunk]; lineW = chunk.w; flush(); chunk = { runs: [], w: 0 }; }
                        const lr = chunk.runs[chunk.runs.length - 1];
                        if (lr && lr.style === r.style) lr.text += ch; else chunk.runs.push({ text: ch, style: r.style });
                        chunk.w += cw;
                    }
                });
                line = [chunk]; lineW = chunk.w;
                return;
            }
            line.push(word); lineW += (line.length > 1 ? space : 0) + word.w;
        });
        if (line.length) flush();
        return lines;
    }

    /** Desenha a palavra; com trailingSpace grava um espaço real depois dela (invisível, mas faz o texto copiado/extraído
     *  do PDF — p.ex. pelo eproc — sair com as palavras separadas). A posição da próxima palavra não muda. */
    const drawWord = (pdf, word, x, y, trailingSpace) => {
        word.runs.forEach((r, i) => {
            pdf.setFont(FONT, r.style);
            pdf.text(trailingSpace && i === word.runs.length - 1 ? r.text + ' ' : r.text, x, y);
            x += width(pdf, r.text, r.style);
        });
    };

    /** Desenha uma linha: align = 'justify' | 'left' | 'center' | 'right'. */
    function drawLine(pdf, line, { x, y, maxWidth, align, isLast }) {
        const space = width(pdf, ' ', 'normal');
        if (align === 'center' || align === 'right') {
            const total = line.words.reduce((a, w) => a + w.w, 0) + space * Math.max(0, line.words.length - 1);
            let cx = align === 'center' ? x + (maxWidth - total) / 2 : x + maxWidth - total;
            line.words.forEach((w, i) => { drawWord(pdf, w, cx, y, i < line.words.length - 1); cx += w.w + space; });
            return;
        }
        let gap = space;
        if (align === 'justify' && !isLast && line.words.length > 1) {
            const wordsW = line.words.reduce((a, w) => a + w.w, 0);
            gap = (maxWidth - wordsW) / (line.words.length - 1);
            if (gap > space * 4) gap = space; // linha muito vazia: não estica (evita "rios")
        }
        let cx = x;
        line.words.forEach((w, i) => { drawWord(pdf, w, cx, y, i < line.words.length - 1); cx += w.w + gap; });
    }

    // ---------- layout de documento ----------
    /**
     * model = { header, meta: [linhas], title, body: 'texto', closing, dateLine, signatures: [nomes] }
     * Gera itens {h, sb (espaço antes), canBreakBefore, draw(pdf, top)} para o paginador.
     */
    function buildItems(pdf, model, L) {
        pdf.setFontSize(SIZE);
        const contentW = PAGE.w - PAGE.left - PAGE.right;
        const items = [];
        const baseline = (top) => top + L.line * 0.5 + 1.5;

        const addBlock = (text, { align = 'justify', indent = 0, sb = 0, keepWithNext = false, firstBreak = true, forceBold = false } = {}) => {
            let runs = parseRuns(text);
            if (forceBold) runs = runs.map(r => ({ ...r, bold: true }));
            const lines = wrap(pdf, toWords(pdf, runs), contentW, indent);
            const n = lines.length;
            lines.forEach((ln, k) => {
                const canBreakBefore = k === 0 ? firstBreak : (k >= 2 && n - k >= 2);
                items.push({
                    h: L.line, sb: k === 0 ? sb : 0, canBreakBefore, keepWithNext: keepWithNext && k === n - 1,
                    draw: (top) => drawLine(pdf, ln, {
                        x: PAGE.left + (k === 0 ? indent : 0), y: baseline(top),
                        maxWidth: contentW - (k === 0 ? indent : 0), align, isLast: k === n - 1
                    })
                });
            });
        };

        // Cabeçalho: endereçamento, metadados e título — sempre juntos no topo da 1ª página
        addBlock(model.header, { align: 'center', forceBold: true, firstBreak: false });
        (model.meta || []).forEach((m, i) => addBlock(m, { align: 'left', sb: i === 0 ? L.afterHeader : 0, firstBreak: false }));
        if (model.title) addBlock(model.title, { align: 'center', forceBold: true, sb: L.afterMeta, firstBreak: false });

        // Corpo
        const paragraphs = String(model.body || '').split('\n').map(s => s.trim()).filter(Boolean);
        let prevKeep = true; // o 1º parágrafo fica com o título
        paragraphs.forEach((p, i) => {
            const isHeading = /^#\s+/.test(p);
            const text = isHeading ? p.replace(/^#\s+/, '') : p;
            const sb = i === 0 ? L.afterTitle : (isHeading ? L.para * 2.5 : L.para);
            const keep = isHeading || /:\s*(\*\*)?\s*$/.test(text); // título ou frase que anuncia lista ("seguintes medidas:")
            addBlock(text, { align: isHeading ? 'center' : 'justify', indent: isHeading ? 0 : INDENT, sb, keepWithNext: keep, firstBreak: !prevKeep, forceBold: isHeading });
            prevKeep = keep;
        });

        // Fecho: "Nestes termos" + data + 1ª assinatura presos ao fim do último parágrafo
        if (model.closing) addBlock(model.closing, { align: 'left', sb: L.beforeClosing, firstBreak: false });
        if (model.dateLine) addBlock(model.dateLine, { align: 'right', sb: L.afterClosing, firstBreak: false });
        // Assinaturas: todas presas ao fecho (nenhuma vai sozinha para outra página); de 3 em diante, em duas colunas
        const sigs = model.signatures || [];
        const twoCols = sigs.length >= 3;
        const groups = [];
        for (let i = 0; i < sigs.length; i += twoCols ? 2 : 1) groups.push(sigs.slice(i, i + (twoCols ? 2 : 1)));
        pdf.setFont(FONT, 'normal');
        groups.forEach((names, gi) => {
            const half = twoCols ? 36 : 55;
            const centers = twoCols ? [PAGE.left + contentW * 0.25, PAGE.left + contentW * 0.75] : [PAGE.w / 2];
            const nameLines = names.map(n => pdf.splitTextToSize(n, half * 2 - 4));
            const h = 5 + Math.max(...nameLines.map(l => l.length)) * 5.2;
            items.push({
                h, sb: gi === 0 ? L.beforeSign : L.sign, canBreakBefore: false,
                draw: (top) => {
                    pdf.setLineWidth(0.3);
                    pdf.setFont(FONT, 'normal');
                    names.forEach((_, k) => {
                        const cx = names.length === 1 && twoCols ? PAGE.w / 2 : centers[k];
                        pdf.line(cx - half, top, cx + half, top);
                        pdf.text(nameLines[k], cx, top + 5, { align: 'center' });
                    });
                }
            });
        });
        return items;
    }

    /** Paginador guloso com recuo até o último ponto de quebra permitido. */
    function paginate(items) {
        const bottom = PAGE.h - PAGE.bottom;
        const pages = [];
        let cur = [], pageStart = 0, y = PAGE.top, lastBreak = -1, i = 0;
        while (i < items.length) {
            const it = items[i];
            const allowed = i > pageStart && it.canBreakBefore && !(items[i - 1] && items[i - 1].keepWithNext);
            if (allowed) lastBreak = i;
            const sb = i === pageStart ? 0 : it.sb;
            if (y + sb + it.h > bottom && i > pageStart) {
                const breakAt = lastBreak > pageStart ? lastBreak : i;
                cur = cur.filter(p => p.idx < breakAt);
                pages.push(cur);
                cur = []; pageStart = breakAt; i = breakAt; y = PAGE.top; lastBreak = -1;
                continue;
            }
            cur.push({ idx: i, top: y + sb });
            y += sb + it.h;
            i++;
        }
        pages.push(cur);
        return pages;
    }

    function renderDocument(pdf, rawModel) {
        const model = {
            ...rawModel,
            header: clean(rawModel.header), title: clean(rawModel.title), body: clean(rawModel.body),
            closing: clean(rawModel.closing), dateLine: clean(rawModel.dateLine),
            meta: (rawModel.meta || []).map(clean), signatures: (rawModel.signatures || []).map(clean).filter(Boolean)
        };
        let chosen = null;
        for (let lv = 0; lv < LEVELS.length; lv++) {
            const items = buildItems(pdf, model, LEVELS[lv]);
            const pages = paginate(items);
            if (pages.length === 1) { chosen = { items, pages }; break; }
        }
        if (!chosen) {
            const items = buildItems(pdf, model, LEVELS[0]);
            chosen = { items, pages: paginate(items) };
        }
        chosen.pages.forEach((page, pi) => {
            if (pi > 0) pdf.addPage();
            page.forEach(p => chosen.items[p.idx].draw(p.top));
        });
        const total = chosen.pages.length;
        if (total > 1) {
            // numeração discreta quando houver mais de uma página
            const first = pdf.internal.getNumberOfPages() - total + 1;
            for (let k = 0; k < total; k++) {
                pdf.setPage(first + k);
                pdf.setFont(FONT, 'normal'); pdf.setFontSize(9);
                pdf.text(`${k + 1}/${total}`, PAGE.w - PAGE.right, PAGE.h - 8, { align: 'right' });
                pdf.setFontSize(SIZE);
            }
            pdf.setPage(pdf.internal.getNumberOfPages());
        }
        return total;
    }

    // ---------- demonstrativo de cálculo ----------
    const brl = (v) => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const fx6 = (v) => (v ?? 1).toLocaleString('pt-BR', { minimumFractionDigits: 6, maximumFractionDigits: 6 });
    const fd = (d) => (d ?`${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}` : '');

    function addDemonstrativo(pdf, calc, meta = {}) {
        const W = pdf.internal.pageSize.getWidth();
        const M = 15;
        const isAgreement = calc.type === 'agreement';
        pdf.setTextColor(17, 24, 39);
        pdf.setFont('helvetica', 'bold'); pdf.setFontSize(15);
        pdf.text(isAgreement ? 'Demonstrativo de Cálculo - Descumprimento de Acordo' : 'Demonstrativo de Cálculo de Débito Judicial', W / 2, 20, { align: 'center' });
        pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10);
        pdf.text(`Cálculo atualizado até: ${fd(calc.finalDate)}`, W / 2, 27, { align: 'center' });
        let y = 38;
        const textW = W - 2 * M;
        const writeWrapped = (t, lh) => { const ls = pdf.splitTextToSize(clean(t), textW); pdf.text(ls, M, y); y += ls.length * lh; };
        writeWrapped(`Processo nº: ${meta.processNumber || 'não informado'}`, 5.5);
        if (meta.parties) writeWrapped(meta.parties, 5.5);

        if (isAgreement) {
            const a = calc.agreement;
            y += 2;
            pdf.setFontSize(9);
            writeWrapped(`Acordo: ${a.parcels.length} parcela(s) - ${global.CalcEngine.scheduleSummary(a.parcels)} = ${brl(a.totalAgreement)}`, 4.4);
            writeWrapped(`1º vencimento: ${fd(a.parcels[0].due)}  |  Pagas: ${a.paidCount}  |  Em aberto: ${a.unpaidCount}${a.defaultDate ? `  |  Inadimplemento: ${fd(a.defaultDate)}` : ''}`, 4.4);
            pdf.setFontSize(10);
        }

        // Cada lançamento é UMA linha da tabela (não se parte entre páginas): a descrição no alto da 1ª coluna e o
        // detalhe (datas, índices) desenhado embaixo, na largura toda.
        const DESC_W = 62, PAD = 2, FS = 9, DFS = 7.5, DLH = DFS * 0.3528 * 1.25;
        const lineH = FS * 0.3528 * 1.15;
        pdf.setFont('helvetica', 'italic'); pdf.setFontSize(DFS);
        const details = calc.rows.map(r => {
            const parts = [];
            if (r.detail) parts.push(r.detail);
            parts.push(`Índice inicial: ${fx6(r.indexInitial)} | Índice final: ${fx6(r.indexFinal)}`);
            if (r.interestDate && r.totalInterest > 0) parts.push(`juros desde ${fd(r.interestDate)}`);
            return pdf.splitTextToSize(clean(parts.join(' · ')), textW - 8);
        });
        pdf.setFont('helvetica', 'normal'); pdf.setFontSize(FS);
        const body = calc.rows.map((r, i) => {
            const neg = r.kind === 'deduction';
            const color = neg ? [21, 128, 61] : [17, 24, 39];
            const desc = clean(neg ? `(-) ${r.description}` : r.description);
            const descH = pdf.splitTextToSize(desc, DESC_W - 2 * PAD).length * lineH + 2 * PAD;
            const minH = descH + details[i].length * DLH + 2;
            return [
                { content: desc, styles: { textColor: color, minCellHeight: minH } },
                { content: brl(r.originalValue), styles: { halign: 'right' } },
                { content: brl(r.totalCorrection), styles: { halign: 'right' } },
                { content: neg && !r.totalInterest ? '-' : brl(r.totalInterest), styles: { halign: 'right' } },
                { content: brl(r.total), styles: { halign: 'right', textColor: color } }
            ];
        });
        pdf.autoTable({
            startY: y + 3, head: [['Descrição', 'Valor original', 'Correção (IPCA)', 'Juros de mora', 'Subtotal']], body,
            margin: { left: M, right: M }, styles: { fontSize: FS, cellPadding: PAD, valign: 'top' }, rowPageBreak: 'avoid',
            headStyles: { fillColor: [75, 85, 99], valign: 'middle' }, columnStyles: { 0: { cellWidth: DESC_W } }, theme: 'plain',
            didDrawCell: (d) => {
                if (d.section !== 'body' || d.column.index !== 0) return;
                const ls = details[d.row.index];
                const top = d.cell.y + d.cell.height - ls.length * DLH - 1.6;
                pdf.setFont('helvetica', 'italic'); pdf.setFontSize(DFS); pdf.setTextColor(107, 114, 128);
                pdf.text(ls, M + 4, top + DLH * 0.8, { lineHeightFactor: 1.25 });
                pdf.setDrawColor(229, 231, 235); pdf.setLineWidth(0.2);
                pdf.line(M, d.cell.y + d.cell.height, W - M, d.cell.y + d.cell.height);
            }
        });
        pdf.setTextColor(17, 24, 39);

        y = pdf.lastAutoTable.finalY + 8;
        const ensure = (h) => { if (y + h > pdf.internal.pageSize.getHeight() - 15) { pdf.addPage(); y = 20; } };
        pdf.setFontSize(10);
        calc.summaryLines.forEach(s => {
            ensure(7);
            pdf.setFont('helvetica', s.strong ? 'bold' : 'normal');
            const label = pdf.splitTextToSize(s.label + ':', 140);
            pdf.text(label, M, y);
            pdf.text(brl(s.value), W - M, y, { align: 'right' });
            y += 6 * label.length;
        });
        ensure(14);
        pdf.setDrawColor(0); pdf.setLineWidth(0.4); pdf.line(M, y - 2, W - M, y - 2);
        y += 4;
        pdf.setFont('helvetica', 'bold'); pdf.setFontSize(11.5);
        pdf.text('Valor total do débito:', M, y);
        pdf.text(brl(calc.grandTotal), W - M, y, { align: 'right' });
        y += 8;

        pdf.setFont('helvetica', 'italic'); pdf.setFontSize(7.5); pdf.setTextColor(75, 85, 99);
        const notes = [...(calc.notes || []), ...(calc.usesInterest === false ? [] : [global.CalcEngine.JUROS_NOTE])];
        (calc.warnings || []).forEach(w => notes.push(`Atenção: ${w}.`));
        notes.forEach(n => { const ls = pdf.splitTextToSize(n, W - 2 * M); ensure(ls.length * 3.6); pdf.text(ls, M, y); y += ls.length * 3.6 + 1.5; });
        pdf.setTextColor(17, 24, 39);

        if (isAgreement) {
            const a = calc.agreement;
            y += 4;
            ensure(25);
            pdf.setFont('helvetica', 'bold'); pdf.setFontSize(10.5);
            pdf.text('Quadro das parcelas do acordo', M, y);
            pdf.autoTable({
                startY: y + 3, margin: { left: M, right: M }, styles: { fontSize: 8.5, cellPadding: 1.6 },
                head: [['Parcela', 'Vencimento', 'Valor', 'Situação', 'Depósito', 'Valor depositado']],
                headStyles: { fillColor: [99, 102, 241] }, theme: 'striped',
                body: quadroRows(a.parcels, calc.finalDate)
            });
        }
    }

    /** Linhas do quadro de parcelas; 3+ vincendas seguidas de mesmo valor viram uma linha só ("5 a 18/18"). */
    function quadroRows(parcels, finalDate) {
        const N = parcels.length;
        const rows = [];
        const isFuture = (p) => !p.paid && p.due > finalDate;
        for (let i = 0; i < N; i++) {
            const p = parcels[i];
            if (isFuture(p)) {
                let j = i;
                while (j + 1 < N && isFuture(parcels[j + 1]) && Math.abs(parcels[j + 1].value - p.value) < 0.005) j++;
                if (j - i >= 2) {
                    rows.push([`${p.n} a ${parcels[j].n}/${N}`, `${fd(p.due)} a ${fd(parcels[j].due)}`,
                        { content: `${brl(p.value)} cada`, styles: { halign: 'right' } },
                        { content: `Vincendas (${j - i + 1})`, styles: { textColor: [107, 114, 128] } }, '-', { content: '-', styles: { halign: 'right' } }]);
                    i = j;
                    continue;
                }
            }
            const status = p.paid ? 'Paga' : (p.due <= finalDate ? 'Vencida - não paga' : 'Vincenda');
            const color = p.paid ? [21, 128, 61] : (p.due <= finalDate ? [185, 28, 28] : [107, 114, 128]);
            rows.push([
                `${p.n}/${N}`, fd(p.due), { content: brl(p.value), styles: { halign: 'right' } },
                { content: status, styles: { textColor: color } },
                p.paid ? fd(p.payDate || p.due) : '-',
                { content: p.paid ? brl(p.payValue > 0 ? p.payValue : p.value) : '-', styles: { halign: 'right' } }
            ]);
        }
        return rows;
    }

    /** Para testes: layout de um nível sem desenhar. */
    const _layout = (pdf, rawModel, lv) => {
        const model = { ...rawModel, body: clean(rawModel.body) }; const items = buildItems(pdf, model, LEVELS[lv]); const pages = paginate(items); return { items: items.map(({ h, sb, canBreakBefore, keepWithNext }) => ({ h, sb, canBreakBefore, keepWithNext })), pages }; };

    global.DocPDF = { _layout, clean, fx6, renderDocument, addDemonstrativo, parseRuns, stripMarkup, PAGE, LEVELS };
})(window);
