/* ==============================================================================================
   CONFIGURAÇÃO INICIAL E LOCALIZAÇÃO
   ============================================================================================== */
moment.locale('pt-br');

/* ==============================================================================================
   INDISPONIBILIDADES: SISTEMA DO PROCESSO, ROBÔ DO TJSP (JSON) E FIRESTORE
   ----------------------------------------------------------------------------------------------
   Cada entrada de 'sistDown' fica no formato:
     { id, downDate, description, sistema, gravidade, aplicavel, horario, link, revisar, origem, ... }
   sistema:   'eproc' | 'saj' | 'custas' | 'geral' | 'outro'
   gravidade: 'severa' (suspende como feriado) | 'normal' (prorroga o vencimento) | 'informativa'
   Regra (JEC de Marília, só 1º grau): a entrada afeta o cálculo se
     aplicavel !== false && gravidade !== 'informativa' && (sistema === selecionado || sistema === 'geral')
   As demais aparecem no relatório apenas para ciência, sem mudar a contagem.
   ============================================================================================== */
const SISTEMA_LABELS = { eproc: 'eproc', saj: 'e-SAJ', custas: 'Custas', geral: 'Geral', outro: 'Outro' };
const SISTEMA_BADGE = {
    eproc: 'bg-primary',
    saj: 'bg-info text-dark',
    custas: 'bg-secondary',
    geral: 'bg-dark',
    outro: 'bg-light text-dark border'
};
const GRAVIDADE_LABELS = { severa: 'severa', normal: 'prorroga', informativa: 'informativa' };
const GRAVIDADE_BADGE = {
    severa: 'bg-danger',
    normal: 'bg-warning text-dark',
    informativa: 'bg-light text-dark border'
};
const GRAVIDADES_VALIDAS = ['severa', 'normal', 'informativa'];
const TIPOS_INDISP = ['indisponibilidade', 'severa'];
const TJSP_LINK_PREFIX = 'https://www.tjsp.jus.br/';
const INDISP_JSON_URL = '../data/indisponibilidades.json';

function escHtml(valor) {
    return String(valor == null ? '' : valor)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Só aceita links do próprio TJSP (evita javascript: e domínios de terceiros)
function linkSeguro(url) {
    return (typeof url === 'string' && url.indexOf(TJSP_LINK_PREFIX) === 0) ? url : null;
}

// Sistema escolhido no formulário (eproc é o padrão)
function getSistemaSelecionado() {
    const el = document.getElementById('sistemaProcesso');
    return (el && el.value === 'saj') ? 'saj' : 'eproc';
}

function normalizarSistema(valor, padrao) {
    if (typeof valor !== 'string' || !valor.trim()) return padrao;
    const s = valor.trim().toLowerCase().replace(/[^a-z]/g, '');
    if (s === 'eproc') return 'eproc';
    if (s === 'saj' || s === 'esaj') return 'saj';
    if (Object.prototype.hasOwnProperty.call(SISTEMA_LABELS, s)) return s;
    return 'outro';
}

// Gravidade: campo 'gravidade' > 'type' do Firestore > flag 'informativa' > texto "SEVERA" (legado)
function normalizarGravidade(src) {
    let g = (typeof src.gravidade === 'string' && GRAVIDADES_VALIDAS.includes(src.gravidade.toLowerCase()))
        ? src.gravidade.toLowerCase() : null;
    if (src.type === 'severa') g = 'severa';
    else if (src.type === 'indisponibilidade' && g === 'severa') g = 'normal';
    if (!g) {
        if (src.informativa === true) g = 'informativa';
        else g = String(src.description || '').toUpperCase().includes('SEVERA') ? 'severa' : 'normal';
    }
    return g;
}

// Infere o sistema pelo texto quando o campo 'sistema' falta (docs antigos do Firestore, itens incompletos).
// Mesma ordem do robô: custas > geral > eproc > saj > padrão.
function inferirSistemaTexto(texto, padrao) {
    const t = String(texto || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
    if (!t.trim()) return padrao;
    if (/PORTAL DE CUSTAS|CUSTAS E RECOLHIMENTOS|EMISSAO DE GUIAS/.test(t)) return 'custas';
    const temEproc = /\bE-?PROC\b/.test(t);
    const temSaj = /\bE-?SAJ\b|\bSAJ\b/.test(t);
    if (/DATACENTER|TODOS OS SISTEMAS|SISTEMAS DO TRIBUNAL|ENCERRAMENTO DE EXPEDIENTE/.test(t) || (temEproc && temSaj)) return 'geral';
    if (temEproc) return 'eproc';
    if (temSaj) return 'saj';
    return padrao;
}

function textoOuNulo(v) {
    return (typeof v === 'string' && v.trim()) ? v.trim() : null;
}

function normalizarIndisp(src, origemPadrao, sistemaPadrao) {
    return {
        id: src.id || null,
        downDate: src.downDate || src.startDate || '',
        description: String(src.description == null ? '' : src.description).trim(),
        sistema: normalizarSistema(src.sistema, sistemaPadrao || 'geral'),
        gravidade: normalizarGravidade(src),
        aplicavel: src.aplicavel === false ? false : (src.aplicavel === null ? null : true),
        horario: textoOuNulo(src.horario),
        link: linkSeguro(src.link),
        revisar: src.revisar === true,
        motivoRevisar: textoOuNulo(src.motivoRevisar),
        motivoNaoAplicavel: textoOuNulo(src.motivoNaoAplicavel),
        escopo: textoOuNulo(src.escopo),
        origem: src.origem || origemPadrao || 'fixo'
    };
}

// Funções tolerantes a entradas antigas (sem os campos novos)
function sistemaDe(e) { return normalizarSistema(e.sistema, 'geral'); }
function gravidadeDe(e) { return normalizarGravidade(e); }

function indispAfeta(e, sistemaSel) {
    const s = sistemaDe(e);
    return e.aplicavel !== false && gravidadeDe(e) !== 'informativa' && (s === sistemaSel || s === 'geral');
}

function getIndispDoDia(dateStr) {
    if (typeof sistDown === 'undefined' || !Array.isArray(sistDown)) return [];
    return sistDown.filter(d => d && d.downDate === dateStr);
}

const PrazoIndisp = (function () {
    // Cópia das listas fixas (holidaysFunc.js) antes de qualquer mesclagem
    const fixos = (typeof sistDown !== 'undefined' && Array.isArray(sistDown)) ? sistDown.slice() : [];
    let eventosTjsp = [];      // itens do robô convertidos em eventos
    let docsFirestore = [];    // docs da coleção 'events' (com id)
    let timerRecalc = null;

    // "21/10/2026– INDISPONIBILIDADE ..." -> "INDISPONIBILIDADE ..."
    function tituloSemData(titulo) {
        const t = String(titulo || '').trim();
        const semData = t.replace(/^\d{1,2}(?:\/\d{1,2})?(?:\/\d{4})?(?:\s*(?:,|e|a)\s*\d{1,2}(?:\/\d{1,2})?(?:\/\d{4})?)*\s*[–—-]\s*/i, '');
        return semData.trim() || t;
    }

    function itemParaEvento(it) {
        const g = (typeof it.gravidade === 'string' && GRAVIDADES_VALIDAS.includes(it.gravidade)) ? it.gravidade : null;
        const desc = tituloSemData(it.titulo) || textoOuNulo(it.resumo) || 'Indisponibilidade (comunicado TJSP)';
        const severa = g === 'severa' || (!g && desc.toUpperCase().includes('SEVERA'));
        const temSistema = typeof it.sistema === 'string' && it.sistema.trim() !== '';
        const sistema = temSistema ? it.sistema : inferirSistemaTexto(String(it.titulo || '') + ' ' + String(it.resumo || ''), 'outro');
        const aplicavel = it.aplicavel === false ? false : (it.aplicavel === true ? true : null);
        const motivosExtras = [];
        if (!temSistema) motivosExtras.push('sistema não informado no comunicado (inferido: ' + SISTEMA_LABELS[normalizarSistema(sistema, 'outro')] + ')');
        if (it.aplicavel !== true && it.aplicavel !== false && it.aplicavel !== null) motivosExtras.push('abrangência não informada: conferir se atinge o 1º grau de Marília');
        return {
            id: String(it.id),
            startDate: it.data,
            endDate: null,
            description: desc,
            type: severa ? 'severa' : 'indisponibilidade',
            sistema: sistema,
            gravidade: g || (severa ? 'severa' : 'normal'),
            informativa: g === 'informativa',
            aplicavel: aplicavel,
            link: it.link,
            horario: it.horario,
            revisar: it.revisar === true || motivosExtras.length > 0,
            motivoRevisar: [textoOuNulo(it.motivoRevisar)].concat(motivosExtras).filter(Boolean).join('; ') || null,
            motivoNaoAplicavel: it.motivoNaoAplicavel,
            escopo: it.escopo,
            origem: 'tjsp'
        };
    }

    // Expande startDate..endDate em entradas diárias normalizadas
    function expandirEvento(ev, origemPadrao, sistemaPadrao) {
        const out = [];
        if (!ev || typeof ev.startDate !== 'string') return out;
        const ini = moment(ev.startDate, 'DD/MM/YYYY');
        if (!ini.isValid()) return out;
        let fim = ev.endDate ? moment(ev.endDate, 'DD/MM/YYYY') : null;
        if (!fim || !fim.isValid() || fim.isBefore(ini, 'day')) fim = ini.clone();
        const cur = ini.clone();
        let guarda = 0;
        while (cur.isSameOrBefore(fim, 'day') && guarda < 370) {
            const dia = Object.assign({}, ev, { downDate: cur.format('DD/MM/YYYY') });
            out.push(normalizarIndisp(dia, origemPadrao, sistemaPadrao));
            cur.add(1, 'days');
            guarda++;
        }
        return out;
    }

    // Doc do Firestore ligado a um comunicado do TJSP (ajuste do Calendário ou cópia do robô)
    function isDocTjsp(d) {
        return !!d && (d.overrideOf === 'tjsp' || (typeof d.origem === 'string' && d.origem.indexOf('tjsp') === 0) ||
            (typeof d.id === 'string' && /^tjsp-/.test(d.id)));
    }

    // Ajuste humano (Calendário) vence o JSON; a cópia automática do robô ('tjsp-robo') não,
    // para que uma reclassificação posterior do JSON (--reprocessar) chegue ao /prazo.
    function isAjusteHumano(d) {
        return !!d && (d.overrideOf === 'tjsp' || d.origem !== 'tjsp-robo');
    }

    // Doc antigo do Firestore sem 'sistema': infere pela descrição ("apenas eproc", "PORTAL DE CUSTAS"...)
    function docComSistema(d) {
        if (typeof d.sistema === 'string' && d.sistema.trim()) return d;
        const sistema = inferirSistemaTexto(d.description, 'geral');
        const extra = { sistema: sistema };
        if (sistema === 'custas' && !d.gravidade && d.type !== 'severa') {
            extra.gravidade = 'informativa';
            extra.informativa = true;
        }
        return Object.assign({}, d, extra);
    }

    function tipoChave(g) { return g === 'severa' ? 'severa' : 'indisponibilidade'; }

    function rebuild() {
        if (typeof sistDown === 'undefined' || !Array.isArray(sistDown)) window.sistDown = [];

        const fsPorId = {};
        docsFirestore.forEach(d => { if (d && d.id) fsPorId[d.id] = d; });

        // 1. Itens do robô (JSON). Ajuste humano do Firestore vence por id (hidden remove;
        //    type/sistema/gravidade alterados valem). Cópia do robô no Firestore não sobrescreve o JSON.
        const idsTjsp = {};
        const tjspPorId = {};
        const tjspFinal = [];
        eventosTjsp.forEach(ev => {
            idsTjsp[ev.id] = true;
            tjspPorId[ev.id] = ev;
            const ov = fsPorId[ev.id];
            if (ov && ov.hidden === true) return;
            if (ov && isAjusteHumano(ov)) {
                if (ov.type && !TIPOS_INDISP.includes(ov.type)) return; // virou outro tipo de evento no Calendário
                tjspFinal.push(...expandirEvento(Object.assign({}, ev, ov, { id: ev.id }), 'tjsp', 'geral'));
            } else {
                tjspFinal.push(...expandirEvento(ev, 'tjsp', 'geral'));
            }
        });

        // 2. Demais docs do Firestore (lançamentos manuais e, se o JSON não carregou, as cópias do robô).
        //    Sem 'sistema': inferido pela descrição; sem pista = 'geral'.
        const fsOutros = [];
        docsFirestore.forEach(d => {
            if (!d || d.hidden === true || idsTjsp[d.id]) return;
            if (!TIPOS_INDISP.includes(d.type)) return;
            fsOutros.push(...expandirEvento(docComSistema(d), d.origem || 'firestore', 'geral'));
        });

        // 3. Listas fixas: descarta a entrada com a mesma data e tipo (severa | indisponibilidade) de um
        //    comunicado do TJSP do mesmo sistema (e-SAJ ou geral), como no Calendário. As chaves usam o item
        //    bruto do JSON e todos os docs TJSP do Firestore, inclusive ocultos/reclassificados: ocultar ou
        //    rebaixar no Calendário não faz a entrada fixa "voltar".
        const chavesTjsp = {};
        const addChaves = ev => {
            expandirEvento(ev, 'tjsp', 'outro').forEach(e => {
                chavesTjsp[e.downDate + '|' + tipoChave(e.gravidade) + '|' + e.sistema] = true;
            });
        };
        eventosTjsp.forEach(addChaves);
        docsFirestore.forEach(d => {
            if (!isDocTjsp(d)) return;
            addChaves(docComSistema(Object.assign({}, tjspPorId[d.id] || {}, d)));
        });
        const fixosMantidos = fixos
            .map(f => normalizarIndisp(f, 'fixo', 'saj'))
            .filter(f => {
                const base = f.downDate + '|' + tipoChave(f.gravidade) + '|';
                if (chavesTjsp[base + 'geral']) return false;               // geral cobre e-SAJ e geral
                if (f.sistema === 'saj' && chavesTjsp[base + 'saj']) return false;
                return true;
            });

        sistDown.length = 0;
        Array.prototype.push.apply(sistDown, fixosMantidos.concat(tjspFinal, fsOutros));
        agendarRecalculo();
    }

    // Recalcula sem rolar a página, apenas se já houver resultado na tela
    function agendarRecalculo() {
        clearTimeout(timerRecalc);
        timerRecalc = setTimeout(function () {
            if (typeof $ !== 'function' || !$('#results').is(':visible')) return;
            const dataDigitada = $('#initialDate').val();
            // Usuário pode estar redigitando a data: só recalcula se ela estiver completa e válida
            if (dataDigitada && moment(dataDigitada, 'DD/MM/YYYY', true).isValid()) {
                calculateResults({ scroll: false });
            }
        }, 80);
    }

    async function carregarJson() {
        try {
            if (typeof fetch !== 'function') return;
            const v = moment().format('YYYYMMDDHH'); // muda a cada hora
            const resp = await fetch(INDISP_JSON_URL + '?v=' + v, { cache: 'no-cache' });
            if (!resp.ok) throw new Error('HTTP ' + resp.status);
            const json = await resp.json();
            const itens = (json && Array.isArray(json.itens)) ? json.itens : [];
            eventosTjsp = itens
                .filter(it => it && it.id && typeof it.data === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(it.data))
                .map(itemParaEvento);
            rebuild();
            console.log('Prazo: ' + eventosTjsp.length + ' indisponibilidades do TJSP carregadas.');
        } catch (err) {
            console.warn('Prazo: não foi possível carregar ' + INDISP_JSON_URL + ' (seguindo com Firestore e listas fixas).', err);
        }
    }

    function setFirestore(docs) {
        docsFirestore = Array.isArray(docs) ? docs : [];
        rebuild();
    }

    rebuild(); // normaliza as listas fixas já na carga
    return { rebuild, carregarJson, setFirestore };
})();
window.PrazoIndisp = PrazoIndisp;
PrazoIndisp.carregarJson();

// Etiquetas (badges) de sistema, gravidade, horário, revisão e link do comunicado
// afeta === false: entrada só para ciência; a gravidade aparece neutra (não diz "prorroga")
function indispBadgesHtml(e, afeta) {
    const s = sistemaDe(e);
    const g = gravidadeDe(e);
    let html = ` <span class="badge ${SISTEMA_BADGE[s]}">${escHtml(SISTEMA_LABELS[s])}</span>`;
    if (afeta === false) {
        const rotuloNeutro = g === 'informativa' ? 'informativa' : (g === 'severa' ? 'severa (TJSP)' : 'normal (TJSP)');
        html += ` <span class="badge bg-light text-muted border">${escHtml(rotuloNeutro)}</span>`;
    } else {
        html += ` <span class="badge ${GRAVIDADE_BADGE[g]}">${escHtml(GRAVIDADE_LABELS[g])}</span>`;
    }
    if (e.horario) html += ` <span class="small text-muted">(${escHtml(e.horario)})</span>`;
    if (e.revisar === true || e.aplicavel === null) {
        const motivo = e.motivoRevisar || (e.aplicavel === null ? 'abrangência incerta: conferir se atinge o 1º grau de Marília' : 'classificação automática: conferir o comunicado');
        html += ` <span class="badge bg-warning text-dark" title="${escHtml(motivo)}"><i class="fa-solid fa-triangle-exclamation"></i> revisar</span>`;
    }
    const link = linkSeguro(e.link);
    if (link) html += ` <a href="${escHtml(link)}" target="_blank" rel="noopener noreferrer" class="small">comunicado</a>`;
    return html;
}

function indispMotivoNaoAfeta(e, sistemaSel) {
    if (e.aplicavel === false) {
        return 'não se aplica ao 1º grau do JEC de Marília' + (e.motivoNaoAplicavel ? ': ' + e.motivoNaoAplicavel : '');
    }
    if (gravidadeDe(e) === 'informativa') {
        return sistemaDe(e) === 'custas' ? 'Portal de Custas não prorroga prazo' : 'comunicado informativo';
    }
    return 'processo no ' + SISTEMA_LABELS[sistemaSel];
}

// Linhas extras do relatório: indisponibilidades do dia além da principal.
// "Ciência" = não afeta o cálculo (outro sistema, custas, informativa ou não aplicável a Marília/1º grau).
function indispLinhasExtrasHtml(dateStr, sistemaSel, principal) {
    const vistos = {};
    if (principal) vistos[sistemaDe(principal) + '|' + gravidadeDe(principal) + '|' + String(principal.description).toUpperCase()] = true;
    let html = '';
    getIndispDoDia(dateStr).forEach(e => {
        if (e === principal) return;
        const chave = sistemaDe(e) + '|' + gravidadeDe(e) + '|' + String(e.description).toUpperCase();
        if (vistos[chave]) return;
        vistos[chave] = true;
        if (indispAfeta(e, sistemaSel)) {
            const rotulo = principal ? 'Também' : (gravidadeDe(e) === 'severa' ? 'Indisponibilidade SEVERA' : 'Indisponibilidade');
            html += `<div class="small mt-1">${rotulo}: ${escHtml(e.description)}${indispBadgesHtml(e, true)}</div>`;
        } else {
            html += `<div class="small text-muted fw-normal mt-1"><i class="fa-solid fa-circle-info"></i> Ciência: ${escHtml(e.description)}${indispBadgesHtml(e, false)} <span class="fst-italic">— não afeta o prazo (${escHtml(indispMotivoNaoAfeta(e, sistemaSel))})</span></div>`;
        }
    });
    return html;
}

/* ==============================================================================================
   EVENT LISTENERS (Garantido pelo document.ready)
   ============================================================================================== */
$(document).ready(function () {

    // 1. Listener do Formulário (Submit)
    $('#deadlineCalc').on('submit', function (e) {
        e.preventDefault();

        // Feedback visual imediato
        $('#collapseReport').collapse('hide');
        $('#collapseCalendar').collapse('hide');

        // Pequeno delay para garantir a renderização da UI
        const timeout = ($('#results').is(':visible')) ? 0 : 500;
        setTimeout(calculateResults, timeout);
    });

    // 2. Botão de scroll
    $('#calcBtn').click(function (e) {
        if ($('#results').is(':visible')) {
            $('html,body').animate({
                scrollTop: $("#results").offset().top - 20
            }, 500);
        }
    });

    // 3. Auto-scroll
    $('#collapseReport, #collapseCalendar').on('shown.bs.collapse', function () {
        this.scrollIntoView({ behavior: "smooth" });
    });

});

/* ==============================================================================================
   LÓGICA PRINCIPAL (CALCULATE RESULTS)
   ============================================================================================== */

function calculateResults(opts) {
    // opts.scroll === false: recálculo automático (troca de sistema / novos dados), sem animação
    const semScroll = !!(opts && typeof opts === 'object' && opts.scroll === false);

    // 1. Captura e Validação de Inputs
    const initialDateInput = $('#initialDate').val();
    if (!initialDateInput) return;

    const inputs = {
        initialDate: moment(initialDateInput, 'DD/MM/YYYY'),
        days: parseInt($('#days').val()) || 0,
        calcType: $('#calcType').val(),
        calcTypeText: $('#calcType option:selected').text(),
        countType: $('#countType').val(),
        countTypeText: $('#countType option:selected').text(),
        chosenCity: 'Marília',
        sistema: getSistemaSelecionado()
    };
    inputs.sistemaLabel = SISTEMA_LABELS[inputs.sistema];

    if (!inputs.initialDate.isValid()) {
        alert("Data inválida. Por favor verifique.");
        return;
    }

    // 2. Recuperação de Listas de Datas (Feriados e Indisponibilidades)
    const holidayData = getHolidayList(inputs);
    const allHolidaysList = holidayData.list;

    // Configura o plugin apenas para fins visuais/calendário
    moment.updateLocale('pt-br', {
        holidays: allHolidaysList.map(h => h.holidayDate),
        holidayFormat: 'DD/MM/YYYY',
        workingWeekdays: [1, 2, 3, 4, 5]
    });

    /* ==========================================================================================
       3. HELPERS DE VERIFICAÇÃO LÓGICA (O CORAÇÃO DO CÁLCULO)
       ========================================================================================== */

    // Verifica se é Feriado (Feriado, Recesso, Suspensão) -> SUSPENDE O PRAZO
    const isHolidayExplicit = (dateMoment) => {
        const dateStr = dateMoment.format('DD/MM/YYYY');
        return allHolidaysList.some(h => h.holidayDate === dateStr);
    };

    // Verifica se é Fim de Semana -> SUSPENDE O PRAZO
    const isWeekend = (dateMoment) => {
        const day = dateMoment.day();
        return day === 0 || day === 6;
    };

    // Busca a Indisponibilidade do dia que AFETA o sistema selecionado (array 'sistDown').
    // Só conta: aplicável a Marília/1º grau, não informativa e do sistema do processo (ou geral).
    // Havendo mais de uma no mesmo dia, a severa prevalece.
    const getSystemDownInfo = (dateStr) => {
        const afetam = getIndispDoDia(dateStr).filter(d => indispAfeta(d, inputs.sistema));
        if (!afetam.length) return null;
        return afetam.find(d => gravidadeDe(d) === 'severa') || afetam[0];
    };

    // Verifica se é Indisponibilidade SEVERA -> SUSPENDE O PRAZO (Igual Feriado)
    const isSevereDowntime = (dateMoment) => {
        const info = getSystemDownInfo(dateMoment.format('DD/MM/YYYY'));
        if (!info) return false;
        // gravidade 'severa' (com fallback para a palavra "SEVERA" na descrição, em entradas antigas)
        return gravidadeDe(info) === 'severa';
    };

    // Verifica se é Indisponibilidade NORMAL -> APENAS PRORROGA (Não suspende contagem)
    const isNormalDowntime = (dateMoment) => {
        const info = getSystemDownInfo(dateMoment.format('DD/MM/YYYY'));
        if (!info) return false;
        // É normal se existe e NÃO é severa
        return gravidadeDe(info) !== 'severa';
    };

    // DEFINIÇÃO DE "DIA ÚTIL PARA CONTAGEM" (WORKING DAY)
    // Um dia conta no prazo se:
    // 1. Não é Fim de Semana
    // 2. Não é Feriado/Recesso
    // 3. Não é Indisponibilidade SEVERA
    // (Obs: Indisponibilidade NORMAL CONTA como dia útil)
    const isCountableDay = (dateMoment) => {
        return !isWeekend(dateMoment) && !isHolidayExplicit(dateMoment) && !isSevereDowntime(dateMoment);
    };

    // DEFINIÇÃO DE "DIA ÚTIL PARA VENCIMENTO" (DUE DATE CHECK)
    // O prazo não pode vencer em:
    // 1. Fim de Semana
    // 2. Feriado
    // 3. Indisponibilidade SEVERA
    // 4. Indisponibilidade NORMAL (Aqui ela afeta!)
    const isValidDueDate = (dateMoment) => {
        return isCountableDay(dateMoment) && !isNormalDowntime(dateMoment);
    };

    const getHolidayDescription = (dateStr) => {
        const h = allHolidaysList.find(item => item.holidayDate === dateStr);
        return h ? h.description : false;
    };

    /* ==========================================================================================
       4. CÁLCULO (MARCO INICIAL E PRAZO)
       ========================================================================================== */

    // --- Data Inicial ---
    let dateForCalc = inputs.initialDate.clone();
    let dispDate = undefined;
    let iPortal = 0;

    if (inputs.calcType !== 'months') {
        if (inputs.countType === '1') { // DJE
            dispDate = dateForCalc.clone();
            // A publicação ocorre no próximo dia ÚTIL (considerando feriados/severas)
            dateForCalc.add(1, 'days');
            while (!isCountableDay(dateForCalc)) {
                dateForCalc.add(1, 'days');
            }
        }
        else if (inputs.countType === '3') { // Portal
            dispDate = dateForCalc.clone();
            // 5 dias úteis de carência
            let gapDays = 5;
            let tempDate = dispDate.clone();
            while (gapDays > 0) {
                tempDate.add(1, 'days');
                if (isCountableDay(tempDate)) gapDays--;
            }
            dateForCalc = tempDate.clone();
            iPortal = dateForCalc.diff(dispDate, 'days');
        }
    }

    // --- Data Final (Loop de Contagem) ---
    let dueDate = dateForCalc.clone();

    if (inputs.calcType === 'workingDays') {
        let daysToAdd = inputs.days;
        // Soma dias que são "Countable" (úteis + indisponibilidade normal)
        while (daysToAdd > 0) {
            dueDate.add(1, 'days');
            if (isCountableDay(dueDate)) {
                daysToAdd--;
            }
        }
    }
    else if (inputs.calcType === 'months') {
        // Para parcelamento: Data Inicial + (N-1) meses
        let monthsToAdd = inputs.days > 0 ? inputs.days - 1 : 0;
        dueDate.add(monthsToAdd, 'months');
    }
    else { // Dias Corridos
        dueDate.add(inputs.days, 'days');
    }

    // --- Prorrogação Final (Para todos os tipos) ---
    // Se cair em dia inválido (FDS, Feriado, Severa OU Normal), joga para o próximo
    // Este loop substitui os loops quebrados anteriores e garante a regra correta.
    while (!isValidDueDate(dueDate)) {
        dueDate.add(1, 'days');
    }

    /* ==========================================================================================
       6. GERAÇÃO DO RELATÓRIO VISUAL
       ========================================================================================== */
    let listaDiasComTipo = [];
    let w = 0; // Contador visual

    // (A) Cabeçalhos de Disponibilização
    if (dispDate) {
        const dispStr = dispDate.format('DD/MM/YYYY');
        const dispType = inputs.countType === '3' ? 'Data da Confirmação da Citação' : 'Data da Disponibilização no DJE';
        listaDiasComTipo.push({
            index: '-',
            date: dispStr,
            _type: dispType,
            detailHtml: escHtml(dispType) + indispLinhasExtrasHtml(dispStr, inputs.sistema, null),
            class: 'susp'
        });

        let tempD = dispDate.clone().add(1, 'days');
        while (tempD.isBefore(dateForCalc, 'day')) {
            let desc = '';
            let classe = 'susp';

            if (inputs.countType === '3') {
                desc = isCountableDay(tempD) ? 'Aguardando leitura tácita' : 'Fim de Semana / Feriado / Suspensão (Gap Portal)';
            } else {
                desc = isCountableDay(tempD) ? 'Dia de intervalo' : 'Fim de Semana / Feriado / Suspensão';
            }

            const tempStr = tempD.format('DD/MM/YYYY');
            listaDiasComTipo.push({
                index: '-',
                date: tempStr,
                _type: desc,
                detailHtml: escHtml(desc) + indispLinhasExtrasHtml(tempStr, inputs.sistema, null),
                class: classe
            });
            tempD.add(1, 'days');
        }
    }

    // (B) Loop de Dias do Prazo
    if (inputs.calcType === 'months') {
        let numberOfParcels = inputs.days;
        let baseDate = inputs.initialDate.clone();

        for (let i = 0; i < numberOfParcels; i++) {
            let parcelDate = baseDate.clone().add(i, 'months');

            // Ajuste para dia útil (Feriado, FDS, Indisponibilidade)
            // Regra específica para parcelas: Recesso, Suspensão e Indisponibilidade NÃO prorrogam.
            const isValidParcelDate = (d) => {
                // 1. Fim de semana sempre prorroga
                if (isWeekend(d)) return false;

                // 2. Feriados
                const dStr = d.format('DD/MM/YYYY');
                const hDesc = getHolidayDescription(dStr);
                if (hDesc) {
                    const desc = hDesc.toUpperCase();
                    // Se for Recesso, Suspensão ou Indisponibilidade -> NÃO prorroga (é válido)
                    if (desc.includes('RECESSO') || desc.includes('SUSPENSÃO') || desc.includes('INDISPONIBILIDADE') || desc.includes('RITJSP')) {
                        return true;
                    }
                    // Outros feriados (Nacionais, etc) -> Prorroga
                    return false;
                }
                // 3. Indisponibilidade de Sistema (sistDown) -> Ignora, é válido
                return true;
            };

            while (!isValidParcelDate(parcelDate)) {
                parcelDate.add(1, 'days');
            }

            // Se for a última parcela, atualiza o dueDate global para garantir consistência
            if (i === numberOfParcels - 1) {
                dueDate = parcelDate.clone();
            }

            listaDiasComTipo.push({
                index: (i + 1) + 'ª',
                date: parcelDate.format('DD/MM/YYYY'),
                rawDate: parcelDate.toDate(),
                _type: (i === 0) ? '1ª Parcela' : 'Vencimento da ' + (i + 1) + 'ª Parcela',
                class: (i === numberOfParcels - 1) ? 'end' : 'start'
            });
        }
    } else {
        let currentDate = dateForCalc.clone();
        let safety = 0;

        // Itera até a data final calculada
        while (currentDate.isSameOrBefore(dueDate) && safety < 2000) {
            safety++;

            const dateStr = currentDate.format('DD/MM/YYYY');

            // Status do dia para classificação VISUAL
            const isBiz = isCountableDay(currentDate);
            const severeInfo = isSevereDowntime(currentDate) ? getSystemDownInfo(dateStr) : null;
            const normalInfo = isNormalDowntime(currentDate) ? getSystemDownInfo(dateStr) : null;
            const holDesc = getHolidayDescription(dateStr);
            const isWknd = isWeekend(currentDate);
            const isStart = (dateStr === dateForCalc.format('DD/MM/YYYY'));
            const isEnd = (dateStr === dueDate.format('DD/MM/YYYY'));

            let row = {
                index: '-',
                date: dateStr,
                _type: '',
                class: '',
                rawDate: currentDate.toDate()
            };
            let principalIndisp = null; // indisponibilidade exibida como descrição principal da linha

            // PRIORIDADE VISUAL: INÍCIO > SEVERA > FERIADO > FDS > NORMAL > FIM > DIA ÚTIL
            if (isStart) {
                // Configuração base do texto de início
                if (inputs.countType === '1') row._type = 'Data da Publicação no DJE (não conta)';
                else if (inputs.countType === '3') row._type = 'Início do Prazo (art. 231, IX, do CPC)';
                else row._type = 'Dia do Início (não conta)';

                // Adiciona motivo se for dia não útil (Feriado ou Fim de Semana), ignorando indisponibilidade
                if (holDesc) {
                    row._type += ` - ${holDesc}`;
                } else if (isWknd) {
                    row._type += ' - Fim de Semana';
                }

                row.class = 'start'; // Sempre azul (text-primary)
                row.index = '-';
            }
            else if (severeInfo) {
                row._type = `Indisponibilidade SEVERA (${SISTEMA_LABELS[sistemaDe(severeInfo)]}): ${severeInfo.description}`;
                principalIndisp = severeInfo;
                row.class = 'red';
            } else if (holDesc) {
                const lowerDesc = holDesc.toLowerCase();
                if (lowerDesc.includes('recesso') ||
                    lowerDesc.includes('suspensão') ||
                    lowerDesc.includes('indisponibilidade') ||
                    lowerDesc.includes('ritjsp')) {
                    row._type = holDesc;
                } else {
                    row._type = `Feriado: ${holDesc}`;
                }
                row.class = 'red';
            } else if (isWknd) {
                row._type = 'Fim de Semana';
                row.class = 'susp';
            } else if (normalInfo) {
                // Indisponibilidade Normal: Amarelo, mas CONTA como dia (se não for início)
                row._type = `Indisponibilidade (${SISTEMA_LABELS[sistemaDe(normalInfo)]}): ${normalInfo.description}`;
                principalIndisp = normalInfo;
                row.class = 'susp';
            } else if (isEnd) {
                row._type = `${currentDate.format('dddd')} (Fim do Prazo)`;
                row.class = 'end';
            } else {
                row._type = currentDate.format('dddd');
                row.class = 'blue';
            }

            // Lógica de Numeração VISUAL (Index)
            let countThisDay = false;
            if (inputs.calcType === 'workingDays') {
                // Conta se é "Countable" (Útil ou Normal Down) E não é Início
                if (isBiz && !isStart) {
                    countThisDay = true;
                }
            } else {
                // Dias Corridos
                if (!isStart) {
                    if (w < inputs.days) {
                        countThisDay = true;
                    }
                }
            }

            if (countThisDay) {
                w++;
                row.index = `<b>${w}</b>`;
            }

            // Versão HTML (escapada) para a tabela: badges + linhas de ciência; _type segue texto puro (calendário)
            if (principalIndisp) {
                const prefixo = gravidadeDe(principalIndisp) === 'severa' ? 'Indisponibilidade SEVERA' : 'Indisponibilidade';
                row.detailHtml = `${prefixo}: ${escHtml(principalIndisp.description)}${indispBadgesHtml(principalIndisp)}`;
            } else {
                row.detailHtml = escHtml(row._type);
            }
            row.detailHtml += indispLinhasExtrasHtml(dateStr, inputs.sistema, principalIndisp);

            listaDiasComTipo.push(row);
            currentDate.add(1, 'days');
        }
    }

    // 7. Renderização
    renderTables(listaDiasComTipo, dueDate, inputs);
    renderCalendar(listaDiasComTipo, allHolidaysList, dueDate);

    // Exibe e Scrolla (o recálculo automático não rola a página)
    $('#results').show();
    if (!semScroll) {
        $('html,body').animate({ scrollTop: $("#results").offset().top - 20 }, 500);
    }
}

/* ==============================================================================================
   FUNÇÕES AUXILIARES
   ============================================================================================== */

function getHolidayList(inputs) {
    const currentYear = inputs.initialDate.year();
    const finalYear = moment(inputs.initialDate).add(inputs.days + 365, 'days').year();

    if (typeof holidaysFunc === 'undefined') return { list: [] };

    const data = holidaysFunc(currentYear, finalYear, Easter);

    let allHolidays = [...data.nationalHolidays, ...data.stateHolidays];
    if (typeof amendment !== 'undefined') allHolidays.push(...amendment);

    const cityHolidays = data.cityHolidays.filter(h => h.city === inputs.chosenCity);
    allHolidays = allHolidays.concat(cityHolidays);

    const list = allHolidays.filter(h => h.holidayDate && h.holidayDate.trim() !== '');
    return { list };
}

function configureHolidays(inputs) {
    getHolidayList(inputs);
}

function getFullHolidayList(inputs) {
    return getHolidayList(inputs).list;
}

function renderTables(rows, dueDate, inputs) {
    let labelMarco = inputs.countTypeText;
    let labelPrazo = inputs.days + " dias";

    if (inputs.calcType === 'months') {
        labelMarco = "Data da 1ª Parcela";
        labelPrazo = inputs.days + " parcelas";
    }

    const summaryHtml = `
        <h3 class="text"><b>Prazo Final:</b></h3>
        <h2 class="heading display-3 pb-5 text-center py-3 copyable-date" id="finalDate" role="button" tabindex="0" aria-label="Copiar prazo final" title="Clique para copiar">${dueDate.format("DD/MM/YYYY")}</h2>
        <div class="table-responsive">
            <table class="table table-bordered table-hover table-condensed">
                <tbody>
                    <tr><td><b>Comarca:</b></td><td>${inputs.chosenCity}</td></tr>
                    <tr><td><b>Sistema do processo:</b></td><td>${escHtml(inputs.sistemaLabel)} <small class="text-muted">(prorrogam só indisponibilidades do ${escHtml(inputs.sistemaLabel)} ou gerais que atinjam o 1º grau de Marília)</small></td></tr>
                    <tr><td><b>Contagem:</b></td><td>${inputs.calcTypeText}</td></tr>
                    <tr><td><b>Marco Inicial (${labelMarco}):</b></td><td>${inputs.initialDate.format("DD/MM/YYYY")}</td></tr>
                    ${(inputs.countType === '1' && inputs.calcType !== 'months') ? `<tr><td><b>Data da Publicação:</b></td><td>${rows.find(r => r.class === 'start') ? rows.find(r => r.class === 'start').date : ''}</td></tr>` : ''}
                    <tr><td><b>Prazo:</b></td><td>${labelPrazo}</td></tr>
                    <tr class="table-active text-success"><td><b>Vencimento:</b></td><td><b>${dueDate.format("DD/MM/YYYY")}</b></td></tr>
                </tbody>
            </table>
        </div>`;
    $('#printResults').html(summaryHtml);
    bindFinalDateCopy();

    let listHtml = `<table class='table table-hover table-sm border'>
        <thead class='table-light'><tr>
            <th class='text-center'>#</th><th>Data</th><th>Descrição</th>
        </tr></thead><tbody>`;

    rows.forEach(row => {
        let colorClass = '';
        if (row.class === 'red') colorClass = 'text-danger';
        if (row.class === 'susp') colorClass = 'text-warning';
        if (row.class === 'end') colorClass = 'text-success fw-bold';
        if (row.class === 'start') colorClass = 'text-primary';

        listHtml += `<tr class="${row.class === 'end' ? 'table-active' : ''}">
            <td class='text-center'>${row.index}</td>
            <td class="${colorClass}">${row.date}</td>
            <td class="${colorClass}">${row.detailHtml !== undefined ? row.detailHtml : escHtml(row._type)}</td>
        </tr>`;
    });
    listHtml += "</tbody></table>";
    document.getElementById("listReport").innerHTML = listHtml;
}

function renderCalendar(rows, holidays, dueDate) {
    let events = [];

    holidays.forEach(h => {
        events.push({
            date: moment(h.holidayDate, 'DD/MM/YYYY').toDate(),
            message: h.description,
            class: 'red'
        });
    });

    rows.forEach(r => {
        let color = 'blue';
        if (r.class === 'end') color = 'green';
        if (r.class === 'susp') color = 'orange';
        if (r.class === 'start') color = 'teal';

        if (r.class !== 'red') {
            events.push({
                date: r.rawDate,
                message: r._type,
                class: color
            });
        }
    });

    $('#inlineCalendar').empty().calendar({
        type: 'date',
        initialDate: dueDate.toDate(),
        eventDates: events,
        text: {
            days: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
            months: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
            monthsShort: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
            today: 'Hoje',
            now: 'Agora'
        }
    });
}

function bindFinalDateCopy() {
    const finalDateEl = document.getElementById('finalDate');
    if (!finalDateEl) return;

    const copyText = async () => {
        const dateText = finalDateEl.textContent.trim();
        if (!dateText) return;

        try {
            await navigator.clipboard.writeText(dateText);
            finalDateEl.classList.add('copied');
            updateToastMessage('Prazo final copiado para a área de transferência.');
            if (typeof showToast === 'function') showToast();
            setTimeout(() => finalDateEl.classList.remove('copied'), 1200);
        } catch (err) {
            const tempInput = document.createElement('textarea');
            tempInput.value = dateText;
            tempInput.setAttribute('readonly', '');
            tempInput.style.position = 'absolute';
            tempInput.style.left = '-9999px';
            document.body.appendChild(tempInput);
            tempInput.select();
            document.execCommand('copy');
            document.body.removeChild(tempInput);
            finalDateEl.classList.add('copied');
            updateToastMessage('Prazo final copiado para a área de transferência.');
            if (typeof showToast === 'function') showToast();
            setTimeout(() => finalDateEl.classList.remove('copied'), 1200);
        }
    };

    finalDateEl.addEventListener('click', copyText);
    finalDateEl.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            copyText();
        }
    });
}

function updateToastMessage(message) {
    const toastEl = document.getElementById('liveToast');
    if (!toastEl) return;
    const toastBody = toastEl.querySelector('.toast-body');
    if (toastBody) toastBody.textContent = message;
}