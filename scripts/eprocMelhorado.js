// ==UserScript==
// @name         Eproc - Documentos no Segundo Monitor
// @namespace    http://tampermonkey.net/
// @version     1.0
// @description  Abre documentos em janela secundária com sistema de abas agrupadas por processo e lembretes sticky. Compatível com Edge e Chrome.
// @author       Eduardo Carnello Jatobá
// @match        *://eproc.jfpr.jus.br/*
// @match        *://eproc.jfrs.jus.br/*
// @match        *://eproc.jfsc.jus.br/*
// @match        *://eproc.trf4.jus.br/*
// @match        *://eproc1g.tjsp.jus.br/*
// @match        *://eproc2g.tjsp.jus.br/
// @grant        GM_xmlhttpRequest
// @connect      eproc.jfpr.jus.br
// @connect      eproc.jfrs.jus.br
// @connect      eproc.jfsc.jus.br
// @connect      eproc.trf4.jus.br
// @connect      eproc1g.tjsp.jus.br
// @connect      eproc2g.tjsp.jus.br
// @connect      esaj.tjsp.jus.br
// @run-at       document-end
// ==/UserScript==

(function () {
    'use strict';

    // ============================================================
    // CONFIGURAÇÕES
    // ============================================================

    const CONFIG = {
        WINDOW_NAME: 'eproc_doc_viewer',
        CHANNEL_NAME: 'eproc_docs_channel',
        POSITION_KEY: 'eproc_window_position',
        ENABLED_KEY: 'eproc_second_monitor_enabled',
        COLLAPSED_KEY: 'eproc_collapsed_groups',
        SIDEBAR_WIDTH: 340,
        DEFAULT_WIDTH: 1200,
        DEFAULT_HEIGHT: 800,
        USE_PDFJS: false,
        DOCUMENT_SELECTORS: [
            'a.infraLinkDocumento',
            'a[href*="acao=acessar_documento"]',
            'a[href*="acao_documento="]',
            'a[onclick*="abrirDocumento"]',
            'a[onclick*="visualizarDocumento"]'
        ]
    };

    let docWindow = null;
    let isEnabled = localStorage.getItem(CONFIG.ENABLED_KEY) !== 'false';

    // ============================================================
    // HTML DA JANELA VISUALIZADORA (sem template literals)
    // ============================================================

    function getViewerHTML() {
        var s = '';
        s += '<!DOCTYPE html>';
        s += '<html lang="pt-BR">';
        s += '<head>';
        s += '<meta charset="UTF-8">';
        s += '<meta name="viewport" content="width=device-width, initial-scale=1.0">';
        s += '<title>Documentos - Eproc</title>';
        s += '<style>';
        s += '* { margin: 0; padding: 0; box-sizing: border-box; }';
        s += 'body { font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif; background: #0f0f1a; color: #fff; height: 100vh; display: flex; overflow: hidden; font-size: 14px; }';
        s += 'body.theme-eproc { background: #f8f9fa; color: #212529; }';
        s += '#sidebar { width: ' + CONFIG.SIDEBAR_WIDTH + 'px; background: #1a1a2e; display: flex; flex-direction: column; border-right: 2px solid #2d2d44; flex-shrink: 0; position: relative; }';
        s += 'body.theme-eproc #sidebar { background: #e9ecef; border-right: 1px solid #cbd3da; }';
        s += '#sidebar-header { padding: 12px 12px; background: #16213e; border-bottom: 1px solid #2d2d44; display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap; }';
        s += 'body.theme-eproc #sidebar-header { background-image: linear-gradient(to left, #12b1d1, #006599); border-bottom: 1px solid #0b5d7b; }';
        s += '#sidebar-header h2 { font-size: 16px; font-weight: 600; color: #e94560; }';
        s += 'body.theme-eproc #sidebar-header h2 { color: #fff; }';
        s += '#sidebar-header .controls { display: flex; gap: 6px; flex-wrap: wrap; justify-content: flex-end; }';
        s += '#sidebar-header button { background: #2d2d44; border: none; color: #a0a0a0; padding: 6px 8px; border-radius: 4px; cursor: pointer; font-size: 12px; }';
        s += '#sidebar-header button:hover { background: #3d3d54; color: #fff; }';
        s += '#sidebar-header button.active { background: #e94560; color: #fff; }';
        s += 'body.theme-eproc #sidebar-header button { background: rgba(255,255,255,0.18); color: #fff; }';
        s += 'body.theme-eproc #sidebar-header button:hover { background: rgba(255,255,255,0.3); color: #fff; }';
        s += '#tabs-container { flex: 1; overflow-y: auto; overflow-x: hidden; }';
        s += '#sidebar-resizer { position: absolute; top: 0; right: -4px; width: 8px; height: 100%; cursor: col-resize; background: transparent; }';
        s += '.process-group { border-bottom: 1px solid #2d2d44; }';
        s += 'body.theme-eproc .process-group { border-bottom: 1px solid #d2d7dc; }';
        s += '.process-header { padding: 12px 14px; background: #16213e; cursor: pointer; display: flex; flex-direction: column; gap: 8px; }';
        s += 'body.theme-eproc .process-header { background: #2e373c; color: #fff; }';
        s += '.process-header:hover { background: #1e2a4a; }';
        s += 'body.theme-eproc .process-header:hover { background: #3b454b; }';
        s += '.process-main-row { display: flex; justify-content: space-between; align-items: center; }';
        s += '.process-search-row { margin-top: 6px; }';
        s += '.process-search { width: 100%; background: #0f0f1a; border: 1px solid #2d2d44; color: #ccc; padding: 8px 10px; border-radius: 6px; font-size: 12px; outline: none; }';
        s += 'body.theme-eproc .process-search { background: #fff; border: 1px solid #cbd3da; color: #343a40; }';
        s += '.process-search:focus { border-color: #7ec8e3; box-shadow: 0 0 0 2px rgba(126,200,227,0.2); }';
        s += '.search-hit { background: #ffc107; color: #111; padding: 0 2px; border-radius: 3px; }';
        s += '.process-info { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }';
        s += '.process-partes { margin-top: 8px; display: flex; flex-direction: column; gap: 6px; font-size: 12px; color: #b7c2da; }';
        s += 'body.theme-eproc .process-partes { color: #495057; }';
        s += '.parte-group { padding: 8px 10px; border-radius: 6px; background: rgba(255,255,255,0.04); border: 1px solid #2d2d44; }';
        s += 'body.theme-eproc .parte-group { background: #f1f3f5; border: 1px solid #dee2e6; }';
        s += '.parte-group-title { font-weight: 700; font-size: 11px; letter-spacing: 0.3px; text-transform: uppercase; color: #7ec8e3; margin-bottom: 6px; }';
        s += 'body.theme-eproc .parte-group-title { color: #0b5d7b; }';
        s += '.parte-item { margin-bottom: 6px; }';
        s += '.parte-item:last-child { margin-bottom: 0; }';
        s += '.parte-nome { font-weight: 600; color: #e0e6f5; display: inline-block; padding: 2px 6px; border-radius: 6px; }';
        s += 'body.theme-eproc .parte-nome { color: #212529; }';
        s += '.parte-nome.polo-ativo { background: #0d6efd; color: #fff; }';
        s += '.parte-nome.polo-passivo { background: #dc3545; color: #fff; }';
        s += '.parte-nome.polo-outro { background: #495057; color: #fff; }';
        s += 'body.theme-eproc .parte-nome.polo-ativo { background: #0d6efd; color: #fff; }';
        s += 'body.theme-eproc .parte-nome.polo-passivo { background: #dc3545; color: #fff; }';
        s += 'body.theme-eproc .parte-nome.polo-outro { background: #6c757d; color: #fff; }';
        s += '.parte-detalhe { color: #9aa4c7; font-size: 11px; margin-top: 2px; }';
        s += 'body.theme-eproc .parte-detalhe { color: #6c757d; }';
        s += '.parte-advogado { color: #ffd166; font-weight: 600; }';
        s += 'body.theme-eproc .parte-advogado { color: #0b5d7b; }';
        s += '.collapse-icon { color: #666; font-size: 11px; }';
        s += 'body.theme-eproc .collapse-icon { color: #cfd8dc; }';
        s += '.process-num { font-size: 12px; color: #7ec8e3; font-weight: 500; }';
        s += 'body.theme-eproc .process-num { color: #e0f2ff; }';
        s += '.process-count { font-size: 11px; color: #666; }';
        s += 'body.theme-eproc .process-count { color: #dce3e7; }';
        s += '.process-close { background: transparent; border: none; color: #666; cursor: pointer; font-size: 14px; padding: 2px 6px; }';
        s += 'body.theme-eproc .process-close { color: #dce3e7; }';
        s += '.process-close:hover { color: #e94560; }';
        s += '.process-labels { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 4px; }';
        s += '.process-label { font-size: 9px; padding: 2px 6px; border-radius: 3px; background: #e94560; color: #fff; text-transform: uppercase; font-weight: 600; }';
        s += '.process-label.urgente { background: #dc3545; animation: pulse 1s infinite; }';
        s += '.process-label.litisconsorcio { background: #6f42c1; }';
        s += '.process-label.segredo { background: #495057; }';
        s += '.process-label.prioridade { background: #dc3545; }';
        s += '@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }';
        s += '.process-tabs { }';
        s += '.process-tabs.collapsed { display: none; }';
        s += '.tab-item { padding: 12px 16px 12px 28px; cursor: pointer; border-left: 3px solid transparent; display: flex; align-items: flex-start; gap: 8px; font-size: 13px; }';
        s += 'body.theme-eproc .tab-item { color: #212529; }';
        s += '.tab-item:hover { background: #252540; }';
        s += 'body.theme-eproc .tab-item:hover { background: #f1f3f5; }';
        s += '.tab-item.active { background: #2f2f55; border-left-color: #ffc107; box-shadow: inset 0 0 0 1px rgba(255,193,7,0.35); }';
        s += 'body.theme-eproc .tab-item.active { background: #f1f3f5; border-left-color: #0d6efd; box-shadow: none; }';
        s += '.tab-item.event-only { }';
        s += '.tab-item.has-docs { background: rgba(100, 149, 237, 0.1); border-left-color: #6495ed; }';
        s += 'body.theme-eproc .tab-item.has-docs { background: #eef5ff; border-left-color: #0d6efd; }';
        s += '.tab-item.event-only.active { background: #2f2f55; border-left-color: #ffc107; box-shadow: inset 0 0 0 1px rgba(255,193,7,0.35); }';
        s += 'body.theme-eproc .tab-item.event-only.active { background: #f1f3f5; border-left-color: #0d6efd; box-shadow: none; }';
        s += '.tab-item .star { background: transparent; border: none; color: #6b7280; font-size: 13px; cursor: pointer; padding: 0 2px; line-height: 1; }';
        s += '.tab-item .star.active { color: #ffc107; }';
        s += '.tab-info { flex: 1; min-width: 0; }';
        s += '.tab-evento { color: #e94560; font-weight: 600; font-size: 12px; }';
        s += 'body.theme-eproc .tab-evento { color: #006599; }';
        s += '.tab-nome { color: #ccc; font-size: 13px; margin-top: 3px; }';
        s += 'body.theme-eproc .tab-nome { color: #343a40; }';
        s += '.tab-doc { color: #7ec8e3; font-size: 12px; margin-top: 2px; }';
        s += 'body.theme-eproc .tab-doc { color: #006599; }';
        s += '.tab-doc-resumo { color: #9aa4c7; font-size: 11px; margin-top: 4px; line-height: 1.4; }';
        s += 'body.theme-eproc .tab-doc-resumo { color: #6c757d; }';
        s += '.tab-parte { color: #7ec8e3; font-size: 12px; margin-top: 3px; }';
        s += 'body.theme-eproc .tab-parte { color: #0b5d7b; }';
        s += '.tab-advogado { color: #9aa4c7; font-size: 11px; margin-top: 3px; }';
        s += '.tab-oficial { color: #9aa4c7; font-size: 11px; margin-top: 3px; }';
        s += '.tab-usuario { color: #9aa4c7; font-size: 11px; margin-top: 3px; }';
        s += 'body.theme-eproc .tab-advogado, body.theme-eproc .tab-oficial, body.theme-eproc .tab-usuario { color: #6c757d; }';
        s += '.tab-children { margin-left: 16px; margin-top: 4px; display: flex; flex-direction: column; gap: 2px; }';
        s += '.tab-child { padding: 7px 12px 7px 28px; cursor: pointer; border-left: 2px solid #3d3d54; display: flex; align-items: center; gap: 6px; font-size: 12px; color: #7ec8e3; }';
        s += '.tab-child:hover { background: #252540; }';
        s += '.tab-child .tab-doc { margin-top: 0; }';
        s += '.tab-toggle { color: #666; font-size: 12px; margin-right: 2px; cursor: pointer; }';
        s += '.tab-close { background: transparent; border: none; color: #666; cursor: pointer; font-size: 12px; padding: 0 4px; flex-shrink: 0; }';
        s += '.tab-close:hover { color: #e94560; }';
        s += '.lembrete-toggle { background: transparent !important; border: none; cursor: pointer; font-size: 12px; padding: 2px 4px; }';
        s += '.lembrete-toggle.has-lembretes { color: #ffc107; }';
        s += '.lembrete-toggle.active { background: #ffc107 !important; color: #000 !important; border-radius: 3px; }';
        s += '#sidebar-footer { padding: 12px; background: #16213e; border-top: 1px solid #2d2d44; font-size: 12px; color: #666; text-align: center; }';
        s += 'body.theme-eproc #sidebar-footer { background: #e9ecef; border-top: 1px solid #cbd3da; color: #6c757d; }';
        s += '#content-area { flex: 1; display: flex; flex-direction: column; position: relative; background: #1a1a2e; }';
        s += 'body.theme-eproc #content-area { background: #f8f9fa; }';
        s += '#welcome-screen { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #666; text-align: center; padding: 40px; }';
        s += 'body.theme-eproc #welcome-screen { color: #6c757d; }';
        s += '#welcome-screen h1 { font-size: 24px; margin-bottom: 10px; color: #e94560; }';
        s += 'body.theme-eproc #welcome-screen h1 { color: #006599; }';
        s += '#welcome-screen p { font-size: 14px; max-width: 400px; line-height: 1.6; }';
        s += '#welcome-screen .credits { margin-top: 40px; font-size: 11px; color: #444; }';
        s += 'body.theme-eproc #welcome-screen .credits { color: #6c757d; }';
        s += '#welcome-screen.hidden { display: none; }';
        s += '.doc-frame { width: 100%; height: 100%; border: none; background: #fff; }';
        s += '.event-display { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; padding: 40px; }';
        s += '.event-card { background: #252540; border-radius: 12px; padding: 30px; max-width: 900px; width: 100%; box-shadow: 0 4px 20px rgba(0,0,0,0.3); }';
        s += 'body.theme-eproc .event-card { background: #fff; box-shadow: 0 6px 18px rgba(0,0,0,0.12); }';
        s += '.event-table { width: 100%; border-collapse: collapse; }';
        s += '.event-cell { padding: 15px; vertical-align: top; }';
        s += '.event-num-cell { width: 40%; border-right: 2px solid #3d3d54; }';
        s += 'body.theme-eproc .event-num-cell { border-right: 1px solid #e1e5ea; }';
        s += '.event-num-big { font-size: 28px; font-weight: 700; color: #e94560; }';
        s += 'body.theme-eproc .event-num-big { color: #006599; }';
        s += '.event-datetime { font-size: 14px; color: #888; margin-top: 8px; }';
        s += 'body.theme-eproc .event-datetime { color: #6c757d; }';
        s += '.event-title { font-size: 20px; font-weight: 600; color: #fff; }';
        s += 'body.theme-eproc .event-title { color: #212529; }';
        s += '.infra-indicators { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }';
        s += '.infra-indicator { display: inline-flex; align-items: center; justify-content: center; font-size: 12px; padding: 2px 6px; border-radius: 10px; background: #1f2233; color: #cbd5f5; border: 1px solid #2d2d44; }';
        s += 'body.theme-eproc .infra-indicator { background: #f1f3f5; color: #495057; border: 1px solid #dee2e6; }';
        s += '.infra-indicator .icon { font-size: 13px; }';
        s += '.event-user { font-size: 14px; color: #7ec8e3; margin-top: 8px; }';
        s += 'body.theme-eproc .event-user { color: #0b5d7b; }';
        s += '.event-badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 12px; font-weight: 600; margin-left: 6px; }';
        s += '.event-badge.prazo { background: #1f2937; color: #e5e7eb; border: 1px solid #374151; }';
        s += 'body.theme-eproc .event-badge.prazo { background: #e9ecef; color: #343a40; border-color: #ced4da; }';
        s += '.event-badge.status { border: 1px solid transparent; }';
        s += '.event-badge.status-aberto { background: #1e3a8a; color: #dbeafe; border-color: #2563eb; }';
        s += 'body.theme-eproc .event-badge.status-aberto { background: #e7f1ff; color: #0d6efd; border-color: #b6d4fe; }';
        s += '.event-badge.status-fechado { background: #7f1d1d; color: #fee2e2; border-color: #ef4444; }';
        s += 'body.theme-eproc .event-badge.status-fechado { background: #f8d7da; color: #b02a37; border-color: #f5c2c7; }';
        s += '.event-badge.status-aguardando { background: #92400e; color: #fef3c7; border-color: #f59e0b; }';
        s += 'body.theme-eproc .event-badge.status-aguardando { background: #fff3cd; color: #997404; border-color: #ffecb5; }';
        s += '.infraEventoPrazoParte { display: inline-block; margin-left: 6px; padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 700; background: #2d2d44; color: #ffc107; letter-spacing: 0.3px; }';
        s += 'body.theme-eproc .infraEventoPrazoParte { background: #e9ecef; color: #343a40; }';
        s += '.infraEventoPrazoParte[data-parte="AUTOR"] { background: #1e3a8a; color: #dbeafe; }';
        s += 'body.theme-eproc .infraEventoPrazoParte[data-parte="AUTOR"] { background: #e7f1ff; color: #0d6efd; }';
        s += '.infraEventoPrazoParte[data-parte="REU"] { background: #7f1d1d; color: #fee2e2; }';
        s += 'body.theme-eproc .infraEventoPrazoParte[data-parte="REU"] { background: #f8d7da; color: #b02a37; }';
        s += '.event-full-desc { margin-top: 20px; padding-top: 20px; border-top: 1px solid #3d3d54; font-size: 14px; color: #aaa; line-height: 1.6; }';
        s += 'body.theme-eproc .event-full-desc { border-top: 1px solid #e1e5ea; color: #495057; }';
        s += '.event-relevant-badge { margin-top: 15px; display: inline-block; background: #ffc107; color: #000; padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }';
        s += 'body.theme-eproc .event-relevant-badge { background: #ffecb5; color: #664d03; }';
        s += '#pdf-container { position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: none; }';
        s += '#pdf-container.show { display: block; }';
        s += '#pdf-scroll { width: 100%; height: 100%; overflow: auto; padding: 16px; }';
        s += '.pdf-page { display: block; margin: 0 auto 16px; background: #fff; box-shadow: 0 2px 6px rgba(0,0,0,0.3); }';
        s += '.pdf-loading { color: #888; text-align: center; padding: 40px; }';
        s += '#lembretes-container { position: absolute; top: 0; right: 0; bottom: 0; width: 300px; pointer-events: none; z-index: 100; }';
        s += '.sticky-note { position: absolute; width: 250px; background: #fff3cd; color: #856404; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); opacity: 0.7; transition: opacity 0.2s; pointer-events: auto; cursor: move; }';
        s += '.sticky-note:hover { opacity: 1; }';
        s += '.sticky-note.minimized { width: 50px; height: 50px; overflow: hidden; border-radius: 50%; }';
        s += '.sticky-note.minimized .sticky-content, .sticky-note.minimized .sticky-footer { display: none; }';
        s += '.sticky-header { padding: 8px 10px; background: #ffc107; border-radius: 8px 8px 0 0; display: flex; justify-content: space-between; align-items: center; font-weight: 600; font-size: 11px; }';
        s += '.sticky-controls { display: flex; gap: 4px; }';
        s += '.sticky-controls button { background: transparent; border: none; cursor: pointer; font-size: 14px; color: #856404; padding: 0 4px; }';
        s += '.sticky-controls button:hover { color: #000; }';
        s += '.sticky-content { padding: 10px; font-size: 12px; line-height: 1.4; max-height: 150px; overflow-y: auto; }';
        s += '.sticky-footer { padding: 6px 10px; font-size: 10px; color: #997a00; border-top: 1px solid #e6c200; }';
        s += '#confirm-modal { display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); z-index: 1000; align-items: center; justify-content: center; }';
        s += '#confirm-modal.show { display: flex; }';
        s += '.modal-content { background: #252540; padding: 30px; border-radius: 12px; max-width: 400px; text-align: center; }';
        s += '.modal-content h3 { color: #e94560; margin-bottom: 15px; }';
        s += '#modal-message { color: #ccc; margin-bottom: 20px; line-height: 1.5; }';
        s += '.modal-buttons { display: flex; gap: 10px; justify-content: center; }';
        s += '.modal-buttons button { padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; }';
        s += '.btn-yes { background: #e94560; color: #fff; }';
        s += '.btn-no { background: #3d3d54; color: #fff; }';
        s += '</style>';
        s += '</head>';
        s += '<body>';
        s += '<div id="sidebar">';
        s += '<div id="sidebar-header">';
        s += '<h2>Documentos</h2>';
        s += '<div class="controls">';
        s += '<button onclick="toggleRelevantFilter()" id="btn-filter" title="Filtrar relevantes">⭐</button>';
        s += '<button onclick="toggleLembretesActive()" id="btn-lembretes" title="Lembretes do processo">📝</button>';
        s += '<button onclick="toggleSortOrder()" id="btn-sort" title="Ordenação eventos">⬆️</button>';
        s += '<button onclick="togglePanelStyle()" id="btn-theme" title="Alternar estilo">🎨</button>';
        s += '<button onclick="collapseAll()" title="Recolher todos">▼</button>';
        s += '<button onclick="closeAllTabs()" title="Fechar todos">🗑️</button>';
        s += '</div>';
        s += '</div>';
        s += '<div id="sidebar-resizer" title="Arraste para ajustar"></div>';
        s += '<div id="tabs-container"></div>';
        s += '<div id="sidebar-footer"><span id="tab-count">0 doc(s)</span></div>';
        s += '</div>';
        s += '<div id="content-area">';
        s += '<div id="welcome-screen">';
        s += '<h1>Visualizador de Documentos</h1>';
        s += '<p>Clique em um documento no eproc para visualizá-lo aqui. Os documentos serão organizados por processo.</p>';
        s += '<div class="credits">Desenvolvido por <strong>Eduardo Carnello Jatobá</strong><br>Oficial Maior do Juizado Especial Cível de Marília/SP</div>';
        s += '</div>';
        s += '<div id="pdf-container"><div id="pdf-scroll"></div></div>';
        s += '<div id="lembretes-container"></div>';
        s += '</div>';
        s += '<div id="confirm-modal">';
        s += '<div class="modal-content">';
        s += '<h3>Novo Processo</h3>';
        s += '<p id="modal-message"></p>';
        s += '<div class="modal-buttons">';
        s += '<button class="btn-no" onclick="handleModalResponse(false)">Não, manter</button>';
        s += '<button class="btn-yes" onclick="handleModalResponse(true)">Sim, fechar</button>';
        s += '</div>';
        s += '</div>';
        s += '</div>';
        s += '<script>';
        s += 'var tabs = [];';
        s += 'var activeTabId = null;';
        s += 'var channel = null;';
        s += 'var pendingDoc = null;';
        s += 'var pendingBulkDocs = null;';
        s += 'var lembretesData = {};';
        s += 'var lembretesVisible = {};';
        s += 'var hiddenLembretes = new Set();';
        s += 'var minimizedLembretes = new Set();';
        s += 'var stickyPositions = {};';
        s += 'try { stickyPositions = JSON.parse(localStorage.getItem("eproc_sticky_positions") || "{}"); } catch(e) {}';
        s += 'var labelsData = {};';
        s += 'var partesData = {};';
        s += 'var showOnlyRelevant = false;';
        s += 'var collapsedGroups = {};';
        s += 'try { collapsedGroups = JSON.parse(localStorage.getItem("eproc_collapsed_groups") || "{}"); } catch(e) {}';
        s += 'var viewerTheme = "default";';
        s += 'try { viewerTheme = localStorage.getItem("eproc_viewer_theme") || "default"; } catch(e) {}';
        s += 'var eventGroupCollapsed = {};';
        s += 'try { eventGroupCollapsed = JSON.parse(localStorage.getItem("eproc_event_group_collapsed") || "{}"); } catch(e) {}';
        s += 'var handMode = false;';
        s += 'var sortDescending = false;';
        s += 'var handDragging = false;';
        s += 'var handStartX = 0, handStartY = 0, handScrollLeft = 0, handScrollTop = 0;';
        s += 'var handDoc = null;';
        s += 'var handWarned = false;';
        s += 'var lastHandDoc = null;';
        s += 'var processSearch = {};';
        s += 'var pdfWorkerReady = false;';
        s += 'var pdfjsReady = false;';
        s += 'var pdfSearchRetry = {};';
        s += 'function init() { setupChannel(); applyViewerTheme(); setInterval(savePosition, 3000); setupEventDelegation(); setupScrollNavigation(); setupHandMode(); setupSidebarResizer(); }';
        s += 'function applyViewerTheme() {';
        s += '  var btn = document.getElementById("btn-theme");';
        s += '  if (viewerTheme === "eproc") { document.body.classList.add("theme-eproc"); if (btn) btn.classList.add("active"); }';
        s += '  else { document.body.classList.remove("theme-eproc"); if (btn) btn.classList.remove("active"); }';
        s += '}';
        s += 'function togglePanelStyle() {';
        s += '  viewerTheme = (viewerTheme === "eproc") ? "default" : "eproc";';
        s += '  try { localStorage.setItem("eproc_viewer_theme", viewerTheme); } catch(e) {}';
        s += '  applyViewerTheme();';
        s += '}';
        s += 'function isLikelyPdf(tab) {';
        s += '  if (!tab) return false;';
        s += '  var name = (tab.docNome || "").toLowerCase();';
        s += '  var url = (tab.url || "").toLowerCase();';
        s += '  if (name && name.indexOf(".pdf") >= 0) return true;';
        s += '  if (url.indexOf(".pdf") >= 0) return true;';
        s += '  if (url.indexOf("mimetype=pdf") >= 0) return true;';
        s += '  if (url.indexOf("acao=acessar_documento") >= 0) return true;';
        s += '  return false;';
        s += '}';
        s += 'function getPreferredPdfZoom() {';
        s += '  try { return localStorage.getItem("eproc_pdf_zoom") || "page-width"; } catch(e) { return "page-width"; }';
        s += '}';
        s += 'function savePreferredPdfZoom(zoom) {';
        s += '  if (!zoom) return;';
        s += '  try { localStorage.setItem("eproc_pdf_zoom", zoom); } catch(e) {}';
        s += '}';
        s += 'function parseZoomFromUrl(url) {';
        s += '  if (!url) return "";';
        s += '  var hashIndex = url.indexOf("#");';
        s += '  if (hashIndex === -1) return "";';
        s += '  var hash = url.substring(hashIndex + 1);';
        s += '  var parts = hash.split("&");';
        s += '  for (var i = 0; i < parts.length; i++) {';
        s += '    var kv = parts[i].split("=");';
        s += '    if (kv.length === 2 && kv[0].toLowerCase() === "zoom") return decodeURIComponent(kv[1]);';
        s += '  }';
        s += '  return "";';
        s += '}';
        s += 'function applyPdfFitToWidth(url) {';
        s += '  if (!url) return url;';
        s += '  var zoom = getPreferredPdfZoom();';
        s += '  var hashIndex = url.indexOf("#");';
        s += '  if (hashIndex === -1) return url + "#zoom=" + encodeURIComponent(zoom);';
        s += '  var base = url.substring(0, hashIndex);';
        s += '  var hash = url.substring(hashIndex + 1);';
        s += '  if (/zoom=/i.test(hash)) return url;';
        s += '  return base + "#" + hash + (hash ? "&" : "") + "zoom=" + encodeURIComponent(zoom);';
        s += '}';
        s += 'function attachPdfZoomPersistence(iframe) {';
        s += '  if (!iframe || iframe.__eprocPdfZoomAttached) return;';
        s += '  iframe.__eprocPdfZoomAttached = true;';
        s += '  iframe.addEventListener("load", function(){';
        s += '    try {';
        s += '      var win = iframe.contentWindow;';
        s += '      var update = function(){ var z = parseZoomFromUrl(win.location.href); if (z) savePreferredPdfZoom(z); };';
        s += '      update();';
        s += '      win.addEventListener("hashchange", update);';
        s += '    } catch(e) {}';
        s += '  });';
        s += '}';
        s += 'function setupEventDelegation() {';
        s += '  document.addEventListener("click", function(e) {';
        s += '    var btn = e.target.closest("[data-action]");';
        s += '    if (!btn) return;';
        s += '    e.stopPropagation();';
        s += '    var action = btn.getAttribute("data-action");';
        s += '    if (action === "toggleLembretes") toggleLembretes(btn.getAttribute("data-proc"));';
        s += '    else if (action === "minimizeSticky") minimizeSticky(btn.getAttribute("data-id"));';
        s += '    else if (action === "hideSticky") hideSticky(btn.getAttribute("data-id"));';
        s += '  });';
        s += '}';
        s += 'function setupChannel() {';
        s += '  channel = new BroadcastChannel("eproc_docs_channel");';
        s += '  channel.onmessage = function(e) {';
        s += '    var d = e.data;';
        s += '    if (d.type === "OPEN_DOCUMENT") handleNewDocument(d.payload);';
        s += '    else if (d.type === "OPEN_PDF_DOCUMENT") handleNewPdfDocument(d.payload);';
        s += '    else if (d.type === "OPEN_BULK_DOCUMENTS") handleBulkDocuments(d.payload);';
        s += '    else if (d.type === "UPDATE_LEMBRETES") updateLembretes(d.payload);';
        s += '    else if (d.type === "UPDATE_LABELS") updateLabels(d.payload);';
        s += '    else if (d.type === "UPDATE_PARTES") updatePartes(d.payload);';
        s += '    else if (d.type === "CHECK_VIEWER_EXISTS") channel.postMessage({type: "VIEWER_EXISTS_RESPONSE"});';
        s += '    else if (d.type === "FOCUS_VIEWER") window.focus();';
        s += '  };';
        s += '}';
        s += 'function handleNewPdfDocument(payload) {';
        s += '  if (!payload || !payload.doc) return;';
        s += '  var doc = payload.doc;';
        s += '  doc.type = "pdf";';
        s += '  doc.pdfData = payload.data;';
        s += '  handleNewDocument(doc);';
        s += '  if (doc.processNum && processSearch[doc.processNum]) triggerPdfSearchIndex(doc.processNum);';
        s += '}';
        s += 'function handleNewDocument(doc) {';
        s += '  var procNum = resolveProcessNum(doc);';
        s += '  if (procNum) doc.processNum = procNum;';
        s += '  var existing = tabs.map(function(t){return t.processNum;}).filter(function(p){return p;});';
        s += '  var isNew = procNum && existing.length > 0 && existing.indexOf(procNum) === -1;';
        s += '  if (isNew) { pendingDoc = doc; document.getElementById("modal-message").innerHTML = "Você está abrindo um documento do processo:<br><strong>" + formatProcessNum(procNum) + "</strong><br><br>Deseja fechar as abas dos outros processos?"; document.getElementById("confirm-modal").classList.add("show"); }';
        s += '  else { addDocument(doc); }';
        s += '}';
        s += 'function handleBulkDocuments(docs) {';
        s += '  if (!docs || !docs.length) return;';
        s += '  var existing = tabs.map(function(t){return t.processNum;}).filter(function(p){return p;});';
        s += '  var newProc = resolveProcessNum(docs[0]);';
        s += '  if (newProc) docs[0].processNum = newProc;';
        s += '  var isNew = newProc && existing.length > 0 && existing.indexOf(newProc) === -1;';
        s += '  if (isNew) { pendingBulkDocs = docs; document.getElementById("modal-message").innerHTML = "Você está abrindo documentos do processo:<br><strong>" + formatProcessNum(newProc) + "</strong><br><br>Deseja fechar as abas dos outros processos?"; document.getElementById("confirm-modal").classList.add("show"); }';
        s += '  else { docs.forEach(function(d){ addDocument(d); }); }';
        s += '}';
        s += 'function handleModalResponse(closeOthers) {';
        s += '  document.getElementById("confirm-modal").classList.remove("show");';
        s += '  if (closeOthers) { tabs = []; lembretesData = {}; lembretesVisible = {}; }';
        s += '  if (pendingDoc) { addDocument(pendingDoc); pendingDoc = null; }';
        s += '  if (pendingBulkDocs) { pendingBulkDocs.forEach(function(d){ addDocument(d); }); pendingBulkDocs = null; }';
        s += '  renderTabs(); renderLembretes(); updateLembreteHeaderButton();';
        s += '}';
        s += 'function addDocument(doc) {';
        s += '  var id = "tab_" + Date.now() + "_" + Math.random().toString(36).substr(2,9);';
        s += '  var exists = doc.url ? tabs.find(function(t){ return t.url === doc.url; }) : null;';
        s += '  if (exists) { activateTab(exists.id); return; }';
        s += '  tabs.push({ id: id, url: doc.url, eventoNum: doc.eventoNum, eventoNome: doc.eventoNome, docNome: doc.docNome, processNum: doc.processNum, isRelevant: doc.isRelevant, type: doc.type || "document", dataHora: doc.dataHora, usuario: doc.usuario, eventoDescricaoCompleta: doc.eventoDescricaoCompleta, pdfData: doc.pdfData, pdfText: doc.pdfText, infraClasses: doc.infraClasses || [], docResumo: doc.docResumo || "", relevanciaUrl: doc.relevanciaUrl || "", parteTipoRow: doc.parteTipoRow || "" });';
        s += '  if (doc.processNum && processSearch[doc.processNum]) triggerPdfSearchIndex(doc.processNum);';
        s += '  sortTabs();';
        s += '  activateTab(id);';
        s += '}';
        s += 'function compareTabs(a,b) {';
        s += '  var na = parseInt(a.eventoNum)||0, nb = parseInt(b.eventoNum)||0;';
        s += '  if (na !== nb) return na - nb;';
        s += '  var da = parseInt((a.docNome||"").replace(/[^0-9]/g,""))||0, db = parseInt((b.docNome||"").replace(/[^0-9]/g,""))||0;';
        s += '  return da - db;';
        s += '}';
        s += 'function sortTabs() {';
        s += '  tabs.sort(function(a,b){ var cmp = compareTabs(a,b); return sortDescending ? -cmp : cmp; });';
        s += '}';
        s += 'function toggleSortOrder() {';
        s += '  sortDescending = !sortDescending;';
        s += '  var btn = document.getElementById("btn-sort");';
        s += '  if (btn) btn.textContent = sortDescending ? "⬇️" : "⬆️";';
        s += '  sortTabs();';
        s += '  renderTabs();';
        s += '}';
        s += 'function activateTab(id) {';
        s += '  activeTabId = id;';
        s += '  var tab = tabs.find(function(t){ return t.id === id; });';
        s += '  if (!tab) return;';
        s += '  var content = document.getElementById("content-area");';
        s += '  var welcome = document.getElementById("welcome-screen");';
        s += '  var oldFrame = document.getElementById("active-frame");';
        s += '  var oldEvent = document.querySelector(".event-display");';
        s += '  if (oldFrame) oldFrame.remove();';
        s += '  if (oldEvent) oldEvent.remove();';
        s += '  if (welcome) welcome.classList.add("hidden");';
        s += '  if (tab.type === "event") {';
        s += '    var div = document.createElement("div");';
        s += '    div.className = "event-display";';
        s += '    var searchText = processSearch[tab.processNum] || "";';
        s += '    var h = "<div class=\\"event-card\\"><table class=\\"event-table\\"><tr>";';
        s += '    h += "<td class=\\"event-cell event-num-cell\\"><div class=\\"event-num-big\\">Evento " + tab.eventoNum + "</div><div class=\\"event-datetime\\">" + (tab.dataHora||"") + "</div></td>";';
        s += '    var isInt = isIntimacaoEletronica(tab);';
        s += '    var isDj = isDjEletronico(tab);';
        s += '    var info = parseIntimacaoInfo(tab.eventoDescricaoCompleta || "");';
        s += '    h += "<td class=\\"event-cell event-desc-cell\\"><div class=\\"event-title\\">" + (tab.eventoNome||"Evento") + "</div>";';
        s += '    var infraHtml = getInfraIndicators(tab.infraClasses || []);';
        s += '    if (infraHtml) h += "<div class=\\"infra-indicators\\">" + infraHtml + "</div>";';
        s += '    if (isInt || isDj) {';
        s += '      if (tab.dataHora) h += "<div class=\\"event-user\\">em " + tab.dataHora + "</div>";';
        s += '      if (isDj) {';
        s += '        if (info && info.parte) {';
        s += '          var badge = info.parteTipo ? " <span class=\\"infraEventoPrazoParte\\" data-parte=\\"" + (info.parteData || "") + "\\">" + info.parteTipo + "</span>" : "";';
        s += '          var split = splitOficialFromParte(info.parte);';
        s += '          if (split.parte) h += "<div class=\\"event-user\\">Parte: " + split.parte + badge + "</div>";';
        s += '          if (split.oficial) h += "<div class=\\"event-user\\">Oficial de Justiça: " + split.oficial + "</div>";';
        s += '        }';
        s += '        if (info && info.referencia) h += "<div class=\\"event-user\\">" + info.referencia + "</div>";';
        s += '        if (info && (info.prazo || info.status)) {';
        s += '          var linha = "";';
        s += '          if (info.prazo) linha += "Prazo: <span class=\\"event-badge prazo\\">" + info.prazo + "</span>";';
        s += '          if (info.status) linha += (linha ? " " : "") + "Status: " + formatStatusBadge(info.status);';
        s += '          h += "<div class=\\"event-user\\">" + linha + "</div>";';
        s += '        }';
        s += '        if (info && info.dataInicial) h += "<div class=\\"event-user\\">Data inicial da contagem do prazo: " + info.dataInicial + "</div>";';
        s += '        if (info && info.dataFinal) h += "<div class=\\"event-user\\">Data final: " + info.dataFinal + "</div>";';
        s += '      } else {';
        s += '        if (info && info.referencia) h += "<div class=\\"event-user\\">" + info.referencia + "</div>";';
        s += '        if (info && info.parte) {';
        s += '          var badge2 = info.parteTipo ? " <span class=\\"infraEventoPrazoParte\\" data-parte=\\"" + (info.parteData || "") + "\\">" + info.parteTipo + "</span>" : "";';
        s += '          var split2 = splitOficialFromParte(info.parte);';
        s += '          if (split2.parte) h += "<div class=\\"event-user\\">Parte: " + split2.parte + badge2 + "</div>";';
        s += '          if (split2.oficial) h += "<div class=\\"event-user\\">Oficial de Justiça: " + split2.oficial + "</div>";';
        s += '        }';
        s += '        if (info && (info.prazo || info.status)) {';
        s += '          var linha = "";';
        s += '          if (info.prazo) linha += "Prazo: <span class=\\"event-badge prazo\\">" + info.prazo + "</span>";';
        s += '          if (info.status) linha += (linha ? " " : "") + "Status: " + formatStatusBadge(info.status);';
        s += '          h += "<div class=\\"event-user\\">" + linha + "</div>";';
        s += '        }';
        s += '        if (info && info.dataInicial) h += "<div class=\\"event-user\\">Data inicial da contagem do prazo: " + info.dataInicial + "</div>";';
        s += '        if (info && info.dataFinal) h += "<div class=\\"event-user\\">Data final: " + info.dataFinal + "</div>";';
        s += '      }';
        s += '    } else {';
        s += '      var userLabel = getEventUserLabel(tab.usuario || "");';
        s += '      if (userLabel) h += "<div class=\\"event-user\\">" + userLabel + "</div>";';
        s += '      if (info && info.referencia) h += "<div class=\\"event-user\\">" + info.referencia + "</div>";';
        s += '      if (info && info.parte) {';
        s += '        var badge2 = info.parteTipo ? " <span class=\\"infraEventoPrazoParte\\" data-parte=\\"" + (info.parteData || "") + "\\">" + info.parteTipo + "</span>" : "";';
        s += '        var split3 = splitOficialFromParte(info.parte);';
        s += '        if (split3.parte) h += "<div class=\\"event-user\\">Parte: " + split3.parte + badge2 + "</div>";';
        s += '        if (split3.oficial) h += "<div class=\\"event-user\\">Oficial de Justiça: " + split3.oficial + "</div>";';
        s += '      }';
        s += '      if (info && (info.prazo || info.status)) {';
        s += '        var linha2 = "";';
        s += '        if (info.prazo) linha2 += "Prazo: <span class=\\"event-badge prazo\\">" + info.prazo + "</span>";';
        s += '        if (info.status) linha2 += (linha2 ? " " : "") + "Status: " + formatStatusBadge(info.status);';
        s += '        h += "<div class=\\"event-user\\">" + linha2 + "</div>";';
        s += '      }';
        s += '      if (info && info.dataInicial) h += "<div class=\\"event-user\\">Data inicial da contagem do prazo: " + info.dataInicial + "</div>";';
        s += '      if (info && info.dataFinal) h += "<div class=\\"event-user\\">Data final: " + info.dataFinal + "</div>";';
        s += '    }';
        s += '    h += "</td>";';
        s += '    h += "</tr></table>";';
        s += '    if (!isInt && !isDj) h += "<div class=\\"event-full-desc\\">" + formatEventDescriptionHtml((tab.eventoDescricaoCompleta||""), searchText) + "</div>";';
        s += '    if (tab.isRelevant) h += "<div class=\\"event-relevant-badge\\">⭐ Marcado como Relevante</div>";';
        s += '    h += "</div>";';
        s += '    div.innerHTML = h;';
        s += '    content.appendChild(div);';
        s += '    setPdfVisible(false);';
        s += '  } else if (tab.type === "pdf") {';
        s += '    setPdfVisible(true);';
        s += '    renderPdf(tab);';
        s += '  } else {';
        s += '    var iframe = document.createElement("iframe");';
        s += '    iframe.id = "active-frame";';
        s += '    iframe.className = "doc-frame";';
        s += '    iframe.src = getIframeSrc(tab);';
        s += '    iframe.onload = function(){ if (handMode) attachHandModeHandlers(); attachPdfZoomPersistence(iframe); };';
        s += '    content.appendChild(iframe);';
        s += '    setPdfVisible(false);';
        s += '  }';
        s += '  sortTabs();';
        s += '  renderTabs(); renderLembretes(); updateLembreteHeaderButton();';
        s += '}';
        s += 'function closeTab(id) {';
        s += '  var idx = tabs.findIndex(function(t){ return t.id === id; });';
        s += '  if (idx === -1) return;';
        s += '  tabs.splice(idx, 1);';
        s += '  if (activeTabId === id) {';
        s += '    if (tabs.length > 0) activateTab(tabs[Math.max(0, idx-1)].id);';
        s += '    else { activeTabId = null; document.getElementById("active-frame")?.remove(); document.querySelector(".event-display")?.remove(); setPdfVisible(false); document.getElementById("welcome-screen").classList.remove("hidden"); document.getElementById("lembretes-container").innerHTML = ""; }';
        s += '  }';
        s += '  renderTabs(); updateCount();';
        s += '}';
        s += 'function formatProcessNum(num) {';
        s += '  if (!num || num.length !== 20) return num;';
        s += '  return num.substr(0,7) + "-" + num.substr(7,2) + "." + num.substr(9,4) + "." + num.substr(13,1) + "." + num.substr(14,2) + "." + num.substr(16,4);';
        s += '}';
        s += 'function renderTabs() {';
        s += '  var container = document.getElementById("tabs-container");';
        s += '  container.innerHTML = "";';
        s += '  var groups = {};';
        s += '  tabs.forEach(function(t) {';
        s += '    var p = t.processNum || "sem_processo";';
        s += '    if (!groups[p]) groups[p] = [];';
        s += '    groups[p].push(t);';
        s += '  });';
        s += '  Object.keys(groups).forEach(function(proc) {';
        s += '    var allItems = groups[proc];';
        s += '    var items = allItems;';
        s += '    var rawSearch = (processSearch[proc] || "").trim();';
        s += '    var searchText = normalizeText(rawSearch);';
        s += '    if (showOnlyRelevant) items = items.filter(function(t){ return t.isRelevant; });';
        s += '    if (searchText) items = items.filter(function(t){ return matchesSearch(t, searchText); });';
        s += '    if (items.length === 0 && !searchText) return;';
        s += '    var div = document.createElement("div");';
        s += '    div.className = "process-group";';
        s += '    var isCollapsed = collapsedGroups[proc] === true;';
        s += '    var hasLembretes = lembretesData[proc] && lembretesData[proc].length > 0;';
        s += '    var lembretesOn = lembretesVisible[proc] === true;';
        s += '    var relevantCount = items.filter(function(t){ return t.isRelevant; }).length;';
        s += '    var labels = labelsData[proc] || [];';
        s += '    var header = document.createElement("div");';
        s += '    header.className = "process-header" + (isCollapsed ? " collapsed" : "");';
        s += '    var labelsHTML = "";';
        s += '    if (labels.length > 0) {';
        s += '      labelsHTML = "<div class=\\"process-labels\\">";';
        s += '      labels.forEach(function(l) {';
        s += '        var cls = "process-label";';
        s += '        if (l.toLowerCase().indexOf("urgente") >= 0) cls += " urgente";';
        s += '        else if (l.toLowerCase().indexOf("litiscons") >= 0) cls += " litisconsorcio";';
        s += '        else if (l.toLowerCase().indexOf("segredo") >= 0 || l.toLowerCase().indexOf("sigilo") >= 0) cls += " segredo";';
        s += '        else if (l.toLowerCase().indexOf("prioridade") >= 0 || l.toLowerCase().indexOf("idoso") >= 0) cls += " prioridade";';
        s += '        labelsHTML += "<span class=\\"" + cls + "\\">" + l + "</span>";';
        s += '      });';
        s += '      labelsHTML += "</div>";';
        s += '    }';
        s += '    var hHTML = labelsHTML;';
        s += '    hHTML += "<div class=\\"process-main-row\\"><div class=\\"process-info\\">";';
        s += '    hHTML += "<span class=\\"collapse-icon\\">" + (isCollapsed ? "▶" : "▼") + "</span>";';
        s += '    hHTML += "<span class=\\"process-num\\">" + formatProcessNum(proc) + "</span>";';
        s += '    hHTML += "<span class=\\"process-count\\">" + items.length + " item(s)" + (relevantCount > 0 ? " (⭐" + relevantCount + ")" : "") + "</span>";';
        s += '    hHTML += "</div><button class=\\"process-close\\" data-action=\\"closeProcess\\" data-proc=\\"" + proc + "\\" title=\\"Fechar\\">×</button></div>";';
        s += '    var partesHtml = getPartesResumoHtml(proc);';
        s += '    if (partesHtml) hHTML += partesHtml;';
        s += '    hHTML += "<div class=\\"process-search-row\\"><input class=\\"process-search\\" type=\\"text\\" placeholder=\\"Pesquisar neste processo...\\" data-proc=\\"" + proc + "\\" value=\\"" + (processSearch[proc] || "") + "\\" /></div>";';
        s += '    header.innerHTML = hHTML;';
        s += '    header.onclick = function() { toggleGroupCollapse(proc); };';
        s += '    div.appendChild(header);';
        s += '    var searchInput = header.querySelector(".process-search");';
        s += '    if (searchInput) {';
        s += '      searchInput.oninput = function(e) { updateProcessSearch(proc, e.target.value); };';
        s += '      searchInput.onclick = function(e) { e.stopPropagation(); };';
        s += '      searchInput.onmousedown = function(e) { e.stopPropagation(); };';
        s += '    }';
        s += '    var tabsDiv = document.createElement("div");';
        s += '    tabsDiv.className = "process-tabs" + (isCollapsed ? " collapsed" : "");';
        s += '    var eventGroups = [];';
        s += '    var eventMap = {};';
        s += '    items.forEach(function(tab) {';
        s += '      var key = getEventGroupKey(proc, tab.eventoNum, tab.id);';
        s += '      if (!eventMap[key]) { eventMap[key] = { key: key, tabs: [], docs: [], eventTab: null, primary: null }; eventGroups.push(eventMap[key]); }';
        s += '      var group = eventMap[key];';
        s += '      group.tabs.push(tab);';
        s += '      if (tab.type === "event") group.eventTab = tab;';
        s += '      if (tab.docNome) group.docs.push(tab);';
        s += '      if (!group.primary) group.primary = tab;';
        s += '    });';
        s += '    eventGroups.forEach(function(group) {';
        s += '      if (group.docs.length === 1) group.primary = group.docs[0];';
        s += '      else if (group.eventTab) group.primary = group.eventTab;';
        s += '    });';
        s += '    eventGroups.forEach(function(group) {';
        s += '      var tab = group.primary;';
        s += '      var isActive = group.tabs.some(function(t){ return t.id === activeTabId; });';
        s += '      var eventOnly = group.eventTab && group.docs.length === 0;';
        s += '      var item = document.createElement("div");';
        s += '      var singleDoc = group.docs.length === 1 ? group.docs[0] : null;';
        s += '      item.className = "tab-item" + (isActive ? " active" : "") + (eventOnly ? " event-only" : "") + (group.docs.length > 0 ? " has-docs" : "");';
        s += '      var iHTML = "";';
        s += '      if (group.docs.length > 1) {';
        s += '        var isCollapsedEvent = eventGroupCollapsed[group.key] === true;';
        s += '        iHTML += "<span class=\\"tab-toggle\\" data-action=\\"toggleEventGroup\\" data-eventkey=\\"" + group.key + "\\">" + (isCollapsedEvent ? "▶" : "▼") + "</span>";';
        s += '      }';
        s += '      var isRelevantGroup = group.tabs.some(function(t){ return t.isRelevant; });';
        s += '      var relUrl = getRelevanciaUrlForGroup(group);';
        s += '      iHTML += "<button class=\\"star" + (isRelevantGroup ? " active" : "") + "\\" data-action=\\"toggleRelevancia\\" data-eventkey=\\"" + group.key + "\\" title=\\"Marcar/Desmarcar relevante\\">" + (isRelevantGroup ? "⭐" : "☆") + "</button>";';
        s += '      iHTML += "<div class=\\"tab-info\\">";';
        s += '      iHTML += "<div class=\\"tab-evento\\">" + highlightText("Ev. " + (tab.eventoNum || ""), rawSearch) + "</div>";';
        s += '      var infraTab = getInfraIndicators(tab.infraClasses || []);';
        s += '      if (infraTab) iHTML += "<div class=\\"infra-indicators\\">" + infraTab + "</div>";';
        s += '      iHTML += "<div class=\\"tab-nome\\">" + highlightText((tab.eventoNome || ""), rawSearch) + "</div>";';
        s += '      if (singleDoc) {';
        s += '        iHTML += "<div class=\\"tab-doc\\">" + highlightText(singleDoc.docNome || "", rawSearch) + "</div>";';
        s += '        var resumoSingle = getDocResumoHtml(singleDoc, rawSearch);';
        s += '        if (resumoSingle) iHTML += resumoSingle;';
        s += '      }';
        s += '      var userHtml = getUsuarioHtml(tab);';
        s += '      if (userHtml) iHTML += userHtml;';
        s += '      var parteHtml = getParteHtml(tab);';
        s += '      if (parteHtml) iHTML += parteHtml;';
        s += '      iHTML += "</div>";';
        s += '      if (group.docs.length > 1) iHTML += "<button class=\\"tab-close\\" data-action=\\"closeEventGroup\\" data-eventkey=\\"" + group.key + "\\" title=\\"Fechar\\">×</button>";';
        s += '      else iHTML += "<button class=\\"tab-close\\" data-action=\\"closeTab\\" data-tabid=\\"" + (singleDoc ? singleDoc.id : tab.id) + "\\" title=\\"Fechar\\">×</button>";';
        s += '      item.innerHTML = iHTML;';
        s += '      item.onclick = function() { activateTab((singleDoc ? singleDoc.id : tab.id)); };';
        s += '      tabsDiv.appendChild(item);';
        s += '      if (group.docs.length > 1 && eventGroupCollapsed[group.key] !== true) {';
        s += '        var children = document.createElement("div");';
        s += '        children.className = "tab-children";';
        s += '        group.docs.forEach(function(docTab) {';
        s += '          var child = document.createElement("div");';
        s += '          child.className = "tab-child";';
        s += '          var cHTML = "<div class=\\"tab-doc\\">" + highlightText(docTab.docNome || "", rawSearch) + "</div>";';
        s += '          var resumoChild = getDocResumoHtml(docTab, rawSearch);';
        s += '          if (resumoChild) cHTML += resumoChild;';
        s += '          cHTML += "<button class=\\"tab-close\\" data-action=\\"closeTab\\" data-tabid=\\"" + docTab.id + "\\" title=\\"Fechar\\">×</button>";';
        s += '          child.innerHTML = cHTML;';
        s += '          child.onclick = function() { activateTab(docTab.id); };';
        s += '          children.appendChild(child);';
        s += '        });';
        s += '        tabsDiv.appendChild(children);';
        s += '      }';
        s += '    });';
        s += '    div.appendChild(tabsDiv);';
        s += '    container.appendChild(div);';
        s += '  });';
        s += '  updateCount();';
        s += '}';
        s += 'function normalizeText(str) {';
        s += '  return (str || "").toString().toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").trim();';
        s += '}';
        s += 'function escapeHtml(str) {';
        s += '  return (str || "").toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/\'/g, "&#39;");';
        s += '}';
        s += 'function highlightText(text, query) {';
        s += '  var safe = escapeHtml(text || "");';
        s += '  if (!query) return safe;';
        s += '  var q = query.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&");';
        s += '  return safe.replace(new RegExp("(" + q + ")", "ig"), "<span class=\\"search-hit\\">$1</span>");';
        s += '}';
        s += 'function normalizeSpaces(str) {';
        s += '  return (str || "").toString().replace(/\\s+/g, " ").trim();';
        s += '}';
        s += 'function resolveProcessNum(doc) {';
        s += '  if (!doc) return "";';
        s += '  if (doc.processNum) return doc.processNum;';
        s += '  var url = doc.url || "";';
        s += '  if (!url) return "";';
        s += '  try {';
        s += '    var u = new URL(url, window.location.href);';
        s += '    return u.searchParams.get("num_processo") || u.searchParams.get("numProcesso") || "";';
        s += '  } catch(e) { return ""; }';
        s += '}';
        s += 'function isLikelyPdf(tab) {';
        s += '  if (!tab) return false;';
        s += '  var name = (tab.docNome || "").toLowerCase();';
        s += '  var url = (tab.url || "").toLowerCase();';
        s += '  if (name && name.indexOf(".pdf") >= 0) return true;';
        s += '  if (url.indexOf(".pdf") >= 0) return true;';
        s += '  return false;';
        s += '}';
        s += 'function applyPdfFitToWidth(url) {';
        s += '  if (!url) return url;';
        s += '  var hashIndex = url.indexOf("#");';
        s += '  if (hashIndex === -1) return url + "#zoom=page-width";';
        s += '  var base = url.substring(0, hashIndex);';
        s += '  var hash = url.substring(hashIndex + 1);';
        s += '  if (/zoom=/i.test(hash)) return url;';
        s += '  return base + "#" + hash + "&zoom=page-width";';
        s += '}';
        s += 'function getIframeSrc(tab) {';
        s += '  var url = (tab && tab.url) ? tab.url : "";';
        s += '  if (isLikelyPdf(tab)) return applyPdfFitToWidth(url);';
        s += '  return url;';
        s += '}';
        s += 'function splitOficialFromParte(parte) {';
        s += '  var out = { parte: "", oficial: "" };';
        s += '  var p = normalizeSpaces(parte || "");';
        s += '  if (!p) return out;';
        s += '  var m = p.match(/^(.*?)\\s*Oficial de Justi[çc]a\\s*:\\s*(.+)$/i);';
        s += '  if (m) { out.parte = normalizeSpaces(m[1]); out.oficial = normalizeSpaces(m[2]); }';
        s += '  else { out.parte = p; }';
        s += '  return out;';
        s += '}';
        s += 'function formatEventDescriptionHtml(desc, query) {';
        s += '  var t = normalizeSpaces(desc || "");';
        s += '  t = t.replace(/(Refer\\.?\\s*ao Evento)/ig, "\\n$1");';
        s += '  t = t.replace(/(Destinat[aá]rio:)/ig, "\\n$1");';
        s += '  t = t.replace(/(Oficial de Justi[çc]a:)/ig, "\\n$1");';
        s += '  var h = highlightText(t, query || "");';
        s += '  return h.replace(/\\n/g, "<br>");';
        s += '}';
        s += 'function getEventUserLabel(user) {';
        s += '  var u = normalizeSpaces(user);';
        s += '  if (!u) return "";';
        s += '  var low = u.toLowerCase();';
        s += '  if (low === "secautoloc" || low === "secauteloc") return "por Automatização";';
        s += '  if (low === "secfp" || low === "secde") return "pelo Sistema";';
        s += '  return u;';
        s += '}';
        s += 'function getParteDataFromTipo(tipo) {';
        s += '  var t = normalizeSpaces(tipo).toLowerCase();';
        s += '  if (!t) return "";';
        s += '  if (t.indexOf("exequente") >= 0 || t.indexOf("autor") >= 0 || t.indexOf("requerente") >= 0) return "AUTOR";';
        s += '  if (t.indexOf("executado") >= 0 || t.indexOf("réu") >= 0 || t.indexOf("reu") >= 0 || t.indexOf("requerido") >= 0) return "REU";';
        s += '  return "";';
        s += '}';
        s += 'function parseIntimacaoInfo(desc) {';
        s += '  var text = normalizeSpaces(desc);';
        s += '  var info = { referencia: "", parte: "", parteTipo: "", parteData: "", prazo: "", status: "", dataInicial: "", dataFinal: "" };';
        s += '  var m;';
        s += '  m = text.match(/Refer\\.?\\s*ao Evento\\s*([0-9]+)/i);';
        s += '  if (m) info.referencia = "Refer. ao Evento " + m[1];';
        s += '  m = text.match(/Destinat[áa]rio:\\s*([^<\\n]+?)(?:\\(|<br>|$)/i);';
        s += '  if (m) {';
        s += '    info.parte = normalizeSpaces(m[1]);';
        s += '  } else {';
        s += '    m = text.match(/Parte:\\s*([^<\\n]+?)(?:\\(|<br>|$)/i);';
        s += '    if (m) info.parte = normalizeSpaces(m[1]);';
        s += '  }';
        s += '  m = text.match(/\\(([^\\)]+)\\)/);';
        s += '  if (m && !/Prazo\\s*:/i.test(m[1]) && !info.parte) {';
        s += '    var parts = m[1].split("-");';
        s += '    if (parts.length > 1) {';
        s += '      info.parteTipo = normalizeSpaces(parts[0]);';
        s += '      info.parte = normalizeSpaces(parts.slice(1).join("-"));';
        s += '    } else {';
        s += '      info.parte = normalizeSpaces(m[1]);';
        s += '    }';
        s += '  }';
        s += '  if (!info.parteTipo) {';
        s += '    var mt = text.match(/Prazo\\s*:[^\\-]+-\\s*([^\\)\\n]+)/i);';
        s += '    if (mt && mt[1]) info.parteTipo = normalizeSpaces(mt[1]);';
        s += '  }';
        s += '  info.parteData = getParteDataFromTipo(info.parteTipo);';
        s += '  m = text.match(/Prazo\\s*:\\s*([^\\s].*?)\\s*Status\\s*:/i);';
        s += '  if (m) info.prazo = normalizeSpaces(m[1]);';
        s += '  m = text.match(/Status\\s*:\\s*([^\\s].*?)(?:Data inicial da contagem do prazo|Data final|$)/i);';
        s += '  if (m) info.status = normalizeSpaces(m[1]);';
        s += '  m = text.match(/Data inicial da contagem do prazo\\s*:\\s*([^\\s].*?)(?:Data final|$)/i);';
        s += '  if (m) info.dataInicial = normalizeSpaces(m[1]);';
        s += '  m = text.match(/Data final\\s*:\\s*([^\\s].*)/i);';
        s += '  if (m) info.dataFinal = normalizeSpaces(m[1]);';
        s += '  return info;';
        s += '}';
        s += 'function normalizeParteTipoRow(tipo) {';
        s += '  var t = normalizeSpaces(tipo).toUpperCase();';
        s += '  if (t === "REU") return "RÉU";';
        s += '  if (t === "AUTOR") return "AUTOR";';
        s += '  return "";';
        s += '}';
        s += 'function getParteDataFromRowTipo(tipo) {';
        s += '  var t = normalizeSpaces(tipo).toUpperCase();';
        s += '  if (t === "REU") return "REU";';
        s += '  if (t === "AUTOR") return "AUTOR";';
        s += '  return "";';
        s += '}';
        s += 'function extractParteAdvogadoFromDescricao(desc) {';
        s += '  var text = normalizeSpaces(desc);';
        s += '  var out = { parte: "", advogado: "", oab: "" };';
        s += '  var m = text.match(/-\s*([^\(]+?)\s*\(([^\)]+)\)/);';
        s += '  if (m) {';
        s += '    var inner = normalizeSpaces(m[2]);';
        s += '    var oabMatch = inner.match(/([A-Z]{2}\s*\d{4,})/i);';
        s += '    if (oabMatch) {';
        s += '      out.parte = normalizeSpaces(m[1]);';
        s += '      var parts = inner.split("-");';
        s += '      if (parts.length > 1) {';
        s += '        out.oab = normalizeSpaces(parts[0]);';
        s += '        out.advogado = normalizeSpaces(parts.slice(1).join("-"));';
        s += '      } else {';
        s += '        out.advogado = inner;';
        s += '      }';
        s += '    }';
        s += '  }';
        s += '  return out;';
        s += '}';
        s += 'function formatStatusBadge(status) {';
        s += '  var s = normalizeSpaces(status);';
        s += '  if (!s) return "";';
        s += '  var low = s.toLowerCase();';
        s += '  var cls = "status";';
        s += '  if (low.indexOf("aberto") >= 0) cls += " status-aberto";';
        s += '  else if (low.indexOf("fechado") >= 0) cls += " status-fechado";';
        s += '  else if (low.indexOf("ag.") >= 0 || low.indexOf("aguard") >= 0) cls += " status-aguardando";';
        s += '  return "<span class=\\"event-badge " + cls + "\\">" + s + "</span>";';
        s += '}';
        s += 'function getDocResumoHtml(docTab, rawSearch) {';
        s += '  if (!docTab) return "";';
        s += '  var resumo = normalizeSpaces(docTab.docResumo || "");';
        s += '  if (!resumo) return "";';
        s += '  var short = resumo.length > 220 ? (resumo.substr(0, 220) + "…") : resumo;';
        s += '  return "<div class=\\"tab-doc-resumo\\" title=\\"" + escapeHtml(resumo) + "\\">" + highlightText(short, rawSearch) + "</div>";';
        s += '}';
        s += 'function getRelevanciaUrlForGroup(group) {';
        s += '  if (!group || !group.tabs) return "";';
        s += '  var tab = group.eventTab || group.tabs.find(function(t){ return t.relevanciaUrl; }) || null;';
        s += '  return tab ? (tab.relevanciaUrl || "") : "";';
        s += '}';
        s += 'function toggleRelevancia(key) {';
        s += '  if (!key) return;';
        s += '  var tabsKey = tabs.filter(function(t){ return getEventGroupKey(t.processNum, t.eventoNum, t.id) === key; });';
        s += '  if (!tabsKey.length) return;';
        s += '  var url = (tabsKey.find(function(t){ return t.relevanciaUrl; }) || {}).relevanciaUrl || "";';
        s += '  if (!url) return;';
        s += '  var nowRelevant = tabsKey.some(function(t){ return t.isRelevant; });';
        s += '  try {';
        s += '    var evNum = (tabsKey[0] && tabsKey[0].eventoNum) || "";';
        s += '    var procNum = (tabsKey[0] && tabsKey[0].processNum) || "";';
        s += '    var ch = new BroadcastChannel("eproc_docs_channel");';
        s += '    ch.postMessage({ type: "TOGGLE_RELEVANCIA_EVENTO", payload: { eventoNum: evNum, processNum: procNum, url: url } });';
        s += '    ch.close();';
        s += '  } catch(e) {}';
        s += '  tabsKey.forEach(function(t){ t.isRelevant = !nowRelevant; });';
        s += '  renderTabs(); updateCount();';
        s += '  var active = tabs.find(function(t){ return t.id === activeTabId; });';
        s += '  if (active && getEventGroupKey(active.processNum, active.eventoNum, active.id) === key && active.type === "event") {';
        s += '    activateTab(active.id);';
        s += '  }';
        s += '}';
        s += 'function getUsuarioHtml(tab) {';
        s += '  if (!tab) return "";';
        s += '  var label = getEventUserLabel(tab.usuario || "");';
        s += '  if (!label) return "";';
        s += '  var prefix = /distribu/i.test(tab.eventoNome || "") ? "Distribuído por" : "Usuário";';
        s += '  return "<div class=\\"tab-usuario\\">" + prefix + ": " + label + "</div>";';
        s += '}';
        s += 'function getParteHtml(tab) {';
        s += '  if (!tab) return "";';
        s += '  var info = parseIntimacaoInfo(tab.eventoDescricaoCompleta || "");';
        s += '  var parte = info && info.parte ? info.parte : "";';
        s += '  var tipoLabel = info && info.parteTipo ? info.parteTipo : "";';
        s += '  var tipoData = info && info.parteData ? info.parteData : "";';
        s += '  var rowTipo = normalizeSpaces(tab.parteTipoRow || "");';
        s += '  if (!tipoLabel) tipoLabel = normalizeParteTipoRow(rowTipo);';
        s += '  if (!tipoData) tipoData = getParteDataFromRowTipo(rowTipo);';
        s += '  var advInfo = extractParteAdvogadoFromDescricao(tab.eventoDescricaoCompleta || "");';
        s += '  if (!parte && advInfo.parte) parte = advInfo.parte;';
        s += '  var advogado = advInfo.advogado || "";';
        s += '  if (advogado && advInfo.oab) advogado = advogado + " (" + advInfo.oab + ")";';
        s += '  var descRaw = tab.eventoDescricaoCompleta || "";';
        s += '  var hasExplicitParte = /Destinat[áa]rio\s*:/i.test(descRaw) || /Parte\s*:/i.test(descRaw);';
        s += '  if (!hasExplicitParte && parte && tab.eventoNome) {';
        s += '    var mEvt = (tab.eventoNome || "").match(/\(([^\)]+)\)/);';
        s += '    if (mEvt) {';
        s += '      var evp = normalizeSpaces(mEvt[1]);';
        s += '      if (evp && normalizeSpaces(parte).toUpperCase() === evp.toUpperCase()) parte = "";';
        s += '    }';
        s += '  }';
        s += '  if (!hasExplicitParte && /distribu/i.test(tab.eventoNome || "")) {';
        s += '    parte = "";';
        s += '    tipoLabel = "";';
        s += '    tipoData = "";';
        s += '  }';
        s += '  if (tipoLabel && /intimaç[aã]o/i.test(tipoLabel)) tipoLabel = "";';
        s += '  var oficial = "";';
        s += '  if (parte) {';
        s += '    var mOf = parte.match(/^(.*?)\\s*Oficial de Justiça\\s*:\\s*(.+)$/i);';
        s += '    if (mOf) {';
        s += '      parte = normalizeSpaces(mOf[1]);';
        s += '      oficial = normalizeSpaces(mOf[2]);';
        s += '    }';
        s += '  }';
        s += '  if (!parte) return "";';
        s += '  var badge = tipoLabel ? " <span class=\\"infraEventoPrazoParte\\" data-parte=\\"" + (tipoData || "") + "\\">" + tipoLabel + "</span>" : "";';
        s += '  var html = "<div class=\\"tab-parte\\">Parte: " + parte + badge + "</div>";';
        s += '  if (oficial) html += "<div class=\\"tab-oficial\\">Oficial de Justiça: " + oficial + "</div>";';
        s += '  if (advogado) html += "<div class=\\"tab-advogado\\">Advogado: " + advogado + "</div>";';
        s += '  return html;';
        s += '}';
        s += 'function isIntimacaoEletronica(tab) {';
        s += '  var nome = normalizeSpaces(tab && tab.eventoNome);';
        s += '  var low = nome.toLowerCase();';
        s += '  return low === "expedida/certificada a intimação eletrônica";';
        s += '}';
        s += 'function isDjEletronico(tab) {';
        s += '  var nome = normalizeSpaces(tab && tab.eventoNome).toLowerCase();';
        s += '  return nome === "disponibilizado no dj eletrônico" || nome === "confirmada a intimação eletrônica" || nome === "publicado no dj eletrônico";';
        s += '}';
        s += 'function getInfraIndicators(classes) {';
        s += '  if (!classes || !classes.length) return "";';
        s += '  var list = classes.map(function(c){ return normalizeSpaces(c); });';
        s += '  var defs = [];';
        s += '  defs.push({ cls: "acaoExternaPendente", icon: "⏳", label: "Ação externa pendente" });';
        s += '  defs.push({ cls: "infraEventoPublicacaoExternaPendente", icon: "📰⏳", label: "Publicação/diligência externa pendente" });';
        s += '  defs.push({ cls: "infraEventoPublicacaoExternaCumprida", icon: "📰✅", label: "Publicação/diligência externa cumprida" });';
        s += '  defs.push({ cls: "infraEventoPublicacaoExternaNaoCumprida", icon: "📰⚠️", label: "Publicação/diligência externa não cumprida" });';
        s += '  defs.push({ cls: "infraEventoPrazoFechouMovimento", icon: "🔒", label: "Prazo fechado (movimento)" });';
        s += '  defs.push({ cls: "infraEventoPrazoFechouDecurso", icon: "⌛", label: "Prazo fechado (decurso)" });';
        s += '  defs.push({ cls: "infraEventoPrazoAguardando", icon: "🕒", label: "Prazo aguardando" });';
        s += '  var html = "";';
        s += '  defs.forEach(function(d){ if (list.indexOf(d.cls) >= 0) { html += "<span class=\\"infra-indicator\\" title=\\"" + d.label + "\\"><span class=\\"icon\\">" + d.icon + "</span></span>"; } });';
        s += '  return html;';
        s += '}';
        s += 'function getEventGroupKey(proc, eventoNum, tabId) {';
        s += '  var p = proc || "sem_processo";';
        s += '  var e = eventoNum || tabId || "";';
        s += '  return p + "::" + e;';
        s += '}';
        s += 'function getPartePoloClass(tipo) {';
        s += '  var t = (tipo || "").toString().toLowerCase();';
        s += '  if (t.indexOf("exequente") >= 0 || t.indexOf("autor") >= 0 || t.indexOf("requerente") >= 0) return "polo-ativo";';
        s += '  if (t.indexOf("executado") >= 0 || t.indexOf("réu") >= 0 || t.indexOf("reu") >= 0 || t.indexOf("requerido") >= 0) return "polo-passivo";';
        s += '  return "polo-outro";';
        s += '}';
        s += 'function getPartesResumoHtml(proc) {';
        s += '  var parts = partesData[proc] || [];';
        s += '  if (!parts || !parts.length) return "";';
        s += '  var byTipo = {};';
        s += '  parts.forEach(function(p){ var t = p.tipo || "OUTROS"; if (!byTipo[t]) byTipo[t] = []; byTipo[t].push(p); });';
        s += '  var html = "<div class=\\"process-partes\\">";';
        s += '  Object.keys(byTipo).forEach(function(tipo){';
        s += '    html += "<div class=\\"parte-group\\"><div class=\\"parte-group-title\\">" + escapeHtml(tipo) + "</div>";';
        s += '    byTipo[tipo].forEach(function(p){';
        s += '      var poloClass = getPartePoloClass(p.tipo || "");';
        s += '      html += "<div class=\\"parte-item\\"><div class=\\"parte-nome " + poloClass + "\\">" + escapeHtml(p.nome || "") + "</div>";';
        s += '      if (p.detalhes) html += "<div class=\\"parte-detalhe\\">" + escapeHtml(p.detalhes) + "</div>";';
        s += '      if (p.representantes && p.representantes.length) {';
        s += '        p.representantes.forEach(function(r){';
        s += '          var cls = (/^adv\s*:/i.test(r) ? "parte-detalhe parte-advogado" : "parte-detalhe");';
        s += '          html += "<div class=\\"" + cls + "\\">" + escapeHtml(r) + "</div>";';
        s += '        });';
        s += '      }';
        s += '      html += "</div>";';
        s += '    });';
        s += '    html += "</div>";';
        s += '  });';
        s += '  html += "</div>";';
        s += '  return html;';
        s += '}';
        s += 'function toggleEventGroup(key) {';
        s += '  if (!key) return;';
        s += '  eventGroupCollapsed[key] = !eventGroupCollapsed[key];';
        s += '  try { localStorage.setItem("eproc_event_group_collapsed", JSON.stringify(eventGroupCollapsed)); } catch(e) {}';
        s += '  renderTabs();';
        s += '}';
        s += 'function closeEventGroup(key) {';
        s += '  if (!key) return;';
        s += '  var toClose = tabs.filter(function(t){ return getEventGroupKey(t.processNum, t.eventoNum, t.id) === key; });';
        s += '  if (!toClose.length) return;';
        s += '  tabs = tabs.filter(function(t){ return getEventGroupKey(t.processNum, t.eventoNum, t.id) !== key; });';
        s += '  if (toClose.some(function(t){ return t.id === activeTabId; })) {';
        s += '    if (tabs.length > 0) activateTab(tabs[0].id);';
        s += '    else { activeTabId = null; document.getElementById("active-frame")?.remove(); document.querySelector(".event-display")?.remove(); setPdfVisible(false); document.getElementById("welcome-screen").classList.remove("hidden"); document.getElementById("lembretes-container").innerHTML = ""; }';
        s += '  }';
        s += '  renderTabs(); updateCount();';
        s += '}';
        s += 'function matchesSearch(tab, text) {';
        s += '  var hay = normalizeText([(tab.eventoNum||""),(tab.eventoNome||""),(tab.docNome||""),(tab.docResumo||""),(tab.usuario||""),(tab.dataHora||""),(tab.eventoDescricaoCompleta||""),(tab.pdfText||"")].join(" "));';
        s += '  if (!text) return true;';
        s += '  if (hay.indexOf(text) !== -1) return true;';
        s += '  var hayCompact = hay.replace(/[^a-z0-9]+/g, "");';
        s += '  var textCompact = text.replace(/[^a-z0-9]+/g, "");';
        s += '  return textCompact && hayCompact.indexOf(textCompact) !== -1;';
        s += '}';
        s += 'function updateProcessSearch(proc, value) {';
        s += '  var input = document.querySelector(".process-search[data-proc=\\"" + proc + "\\"]");';
        s += '  var selStart = input ? input.selectionStart : null;';
        s += '  var selEnd = input ? input.selectionEnd : null;';
        s += '  if (value) processSearch[proc] = value; else delete processSearch[proc];';
        s += '  if (value) triggerPdfSearchIndex(proc);';
        s += '  renderTabs();';
        s += '  var newInput = document.querySelector(".process-search[data-proc=\\"" + proc + "\\"]");';
        s += '  if (newInput) {';
        s += '    newInput.focus();';
        s += '    if (selStart !== null && selEnd !== null) { try { newInput.setSelectionRange(selStart, selEnd); } catch(e) {} }';
        s += '  }';
        s += '}';
        s += 'function triggerPdfSearchIndex(proc) {';
        s += '  if (!window.pdfjsLib) {';
        s += '    pdfSearchRetry[proc] = (pdfSearchRetry[proc] || 0) + 1;';
        s += '    if (pdfSearchRetry[proc] <= 10) setTimeout(function(){ triggerPdfSearchIndex(proc); }, 500);';
        s += '    return;';
        s += '  }';
        s += '  tabs.forEach(function(t){';
        s += '    if (t.processNum !== proc) return;';
        s += '    if (t.type !== "pdf") return;';
        s += '    ensurePdfTextFromData(t);';
        s += '  });';
        s += '}';
        s += 'function onPdfJsReady() {';
        s += '  pdfjsReady = true;';
        s += '  var procs = Object.keys(processSearch);';
        s += '  procs.forEach(function(p){ triggerPdfSearchIndex(p); });';
        s += '}';
        s += 'function toggleGroupCollapse(proc) {';
        s += '  collapsedGroups[proc] = !collapsedGroups[proc];';
        s += '  try { localStorage.setItem("eproc_collapsed_groups", JSON.stringify(collapsedGroups)); } catch(e) {}';
        s += '  sortTabs();';
        s += '  renderTabs();';
        s += '}';
        s += 'function toggleLembretes(proc) {';
        s += '  if (lembretesVisible[proc]) { lembretesVisible[proc] = false; }';
        s += '  else { lembretesVisible[proc] = true; hiddenLembretes.clear(); }';
        s += '  renderTabs(); renderLembretes();';
        s += '}';
        s += 'function toggleLembretesActive() {';
        s += '  if (!activeTabId) return;';
        s += '  var tab = tabs.find(function(t){ return t.id === activeTabId; });';
        s += '  if (!tab || !tab.processNum) return;';
        s += '  toggleLembretes(tab.processNum);';
        s += '  updateLembreteHeaderButton();';
        s += '}';
        s += 'function updateLembreteHeaderButton() {';
        s += '  var btn = document.getElementById("btn-lembretes");';
        s += '  if (!btn) return;';
        s += '  if (!activeTabId) { btn.classList.remove("active"); return; }';
        s += '  var tab = tabs.find(function(t){ return t.id === activeTabId; });';
        s += '  if (!tab || !tab.processNum) { btn.classList.remove("active"); return; }';
        s += '  var has = lembretesData[tab.processNum] && lembretesData[tab.processNum].length > 0;';
        s += '  btn.classList.toggle("active", has && lembretesVisible[tab.processNum] === true);';
        s += '}';
        s += 'function toggleRelevantFilter() {';
        s += '  showOnlyRelevant = !showOnlyRelevant;';
        s += '  document.getElementById("btn-filter").classList.toggle("active", showOnlyRelevant);';
        s += '  renderTabs();';
        s += '}';
        s += 'function collapseAll() {';
        s += '  var allCollapsed = Object.keys(collapsedGroups).every(function(k){ return collapsedGroups[k]; });';
        s += '  var groups = {};';
        s += '  tabs.forEach(function(t){ groups[t.processNum || "sem_processo"] = true; });';
        s += '  Object.keys(groups).forEach(function(p){ collapsedGroups[p] = !allCollapsed; });';
        s += '  try { localStorage.setItem("eproc_collapsed_groups", JSON.stringify(collapsedGroups)); } catch(e) {}';
        s += '  renderTabs();';
        s += '}';
        s += 'function closeAllTabs() {';
        s += '  if (!confirm("Fechar todas as abas?")) return;';
        s += '  tabs = []; lembretesData = {}; lembretesVisible = {};';
        s += '  activeTabId = null;';
        s += '  document.getElementById("active-frame")?.remove();';
        s += '  document.querySelector(".event-display")?.remove();';
        s += '  document.getElementById("welcome-screen").classList.remove("hidden");';
        s += '  document.getElementById("lembretes-container").innerHTML = "";';
        s += '  renderTabs();';
        s += '}';
        s += 'function closeProcessTabs(proc) {';
        s += '  var toClose = tabs.filter(function(t){ return t.processNum === proc; });';
        s += '  if (!confirm("Fechar " + toClose.length + " abas do processo " + formatProcessNum(proc) + "?")) return;';
        s += '  tabs = tabs.filter(function(t){ return t.processNum !== proc; });';
        s += '  delete lembretesData[proc]; delete lembretesVisible[proc];';
        s += '  if (toClose.some(function(t){ return t.id === activeTabId; })) {';
        s += '    if (tabs.length > 0) activateTab(tabs[0].id);';
        s += '    else { activeTabId = null; document.getElementById("active-frame")?.remove(); document.querySelector(".event-display")?.remove(); document.getElementById("welcome-screen").classList.remove("hidden"); document.getElementById("lembretes-container").innerHTML = ""; }';
        s += '  }';
        s += '  renderTabs();';
        s += '}';
        s += 'function updateLembretes(data) {';
        s += '  if (!data || !data.processNum) return;';
        s += '  lembretesData[data.processNum] = data.lembretes || [];';
        s += '  if (data.lembretes && data.lembretes.length > 0 && lembretesVisible[data.processNum] === undefined) {';
        s += '    lembretesVisible[data.processNum] = true;';
        s += '  }';
        s += '  renderTabs(); renderLembretes();';
        s += '}';
        s += 'function updateLabels(data) {';
        s += '  if (!data || !data.processNum) return;';
        s += '  labelsData[data.processNum] = data.labels || [];';
        s += '  renderTabs();';
        s += '}';
        s += 'function updatePartes(data) {';
        s += '  if (!data || !data.processNum) return;';
        s += '  partesData[data.processNum] = data.partes || [];';
        s += '  renderTabs();';
        s += '}';
        s += 'function renderLembretes() {';
        s += '  var container = document.getElementById("lembretes-container");';
        s += '  container.innerHTML = "";';
        s += '  var activeTab = tabs.find(function(t){ return t.id === activeTabId; });';
        s += '  if (!activeTab) return;';
        s += '  var proc = activeTab.processNum;';
        s += '  if (!lembretesVisible[proc]) return;';
        s += '  var lembretes = lembretesData[proc] || [];';
        s += '  lembretes.forEach(function(l, i) {';
        s += '    if (hiddenLembretes.has(l.id)) return;';
        s += '    var note = document.createElement("div");';
        s += '    var isMin = minimizedLembretes.has(l.id);';
        s += '    note.className = "sticky-note" + (isMin ? " minimized" : "");';
        s += '    note.id = "sticky_" + l.id;';
        s += '    var savedPos = stickyPositions[l.id];';
        s += '    if (savedPos) { note.style.top = savedPos.top + "px"; note.style.left = savedPos.left + "px"; note.style.right = "auto"; }';
        s += '    else { note.style.top = (10 + i * 180) + "px"; note.style.right = "10px"; }';
        s += '    var h = "<div class=\\"sticky-header\\"><span class=\\"sticky-title\\">" + (isMin ? "📝" : l.para) + "</span><div class=\\"sticky-controls\\"><button data-action=\\"minimizeSticky\\" data-id=\\"" + l.id + "\\" title=\\"" + (isMin ? "Restaurar" : "Minimizar") + "\\">" + (isMin ? "□" : "−") + "</button><button data-action=\\"hideSticky\\" data-id=\\"" + l.id + "\\" title=\\"Ocultar\\">×</button></div></div>";';
        s += '    h += "<div class=\\"sticky-content\\">" + l.descricao + "</div>";';
        s += '    h += "<div class=\\"sticky-footer\\">" + l.dataInfo + "</div>";';
        s += '    note.innerHTML = h;';
        s += '    makeDraggable(note, l.id);';
        s += '    container.appendChild(note);';
        s += '  });';
        s += '}';
        s += 'function makeDraggable(el, id) {';
        s += '  var isDragging = false, offsetX, offsetY;';
        s += '  el.onmousedown = function(e) {';
        s += '    if (e.target.tagName === "BUTTON") return;';
        s += '    isDragging = true;';
        s += '    var rect = el.getBoundingClientRect();';
        s += '    offsetX = e.clientX - rect.left;';
        s += '    offsetY = e.clientY - rect.top;';
        s += '    el.style.opacity = "1";';
        s += '  };';
        s += '  document.addEventListener("mousemove", function(e) {';
        s += '    if (!isDragging) return;';
        s += '    var container = document.getElementById("lembretes-container");';
        s += '    var cRect = container.getBoundingClientRect();';
        s += '    el.style.left = (e.clientX - cRect.left - offsetX) + "px";';
        s += '    el.style.top = (e.clientY - cRect.top - offsetY) + "px";';
        s += '    el.style.right = "auto";';
        s += '  });';
        s += '  document.addEventListener("mouseup", function() {';
        s += '    if (isDragging) {';
        s += '      isDragging = false; el.style.opacity = "";';
        s += '      stickyPositions[id] = { top: parseInt(el.style.top), left: parseInt(el.style.left) };';
        s += '      try { localStorage.setItem("eproc_sticky_positions", JSON.stringify(stickyPositions)); } catch(e) {}';
        s += '    }';
        s += '  });';
        s += '}';
        s += 'function minimizeSticky(id) {';
        s += '  if (minimizedLembretes.has(id)) minimizedLembretes.delete(id);';
        s += '  else minimizedLembretes.add(id);';
        s += '  renderLembretes();';
        s += '}';
        s += 'function hideSticky(id) {';
        s += '  hiddenLembretes.add(id);';
        s += '  renderLembretes();';
        s += '}';
        s += 'function savePosition() {';
        s += '  try { localStorage.setItem("eproc_window_position", JSON.stringify({ left: window.screenX, top: window.screenY, width: window.outerWidth, height: window.outerHeight })); } catch(e) {}';
        s += '}';
        s += 'function updateCount() {';
        s += '  var count = tabs.length;';
        s += '  var procs = [];';
        s += '  tabs.forEach(function(t){ if (procs.indexOf(t.processNum) === -1) procs.push(t.processNum); });';
        s += '  document.getElementById("tab-count").textContent = count + " doc(s) | " + procs.length + " processo(s)";';
        s += '}';
        s += 'function toggleHandMode() {';
        s += '  handMode = !handMode;';
        s += '  var btn = document.getElementById("btn-hand");';
        s += '  if (btn) btn.style.background = handMode ? "#ffc107" : "";';
        s += '  var frame = document.getElementById("active-frame");';
        s += '  if (frame) frame.style.cursor = handMode ? "grab" : "";';
        s += '  var pdfScroll = document.getElementById("pdf-scroll");';
        s += '  if (pdfScroll) pdfScroll.style.cursor = handMode ? "grab" : "";';
        s += '  if (handMode) attachHandModeHandlers();';
        s += '}';
        s += 'function setupScrollNavigation() {';
        s += '  var lastScrollTime = 0;';
        s += '  var scrollCooldown = 500;';
        s += '  window.addEventListener("wheel", function(e) {';
        s += '    if (!activeTabId) return;';
        s += '    var now = Date.now();';
        s += '    if (now - lastScrollTime < scrollCooldown) return;';
        s += '    try {';
        s += '      var info = getScrollInfo();';
        s += '      if (!info) return;';
        s += '      var atBottom = (info.scrollTop + info.clientHeight) >= (info.scrollHeight - 50);';
        s += '      var atTop = info.scrollTop <= 50;';
        s += '      if (e.deltaY > 0 && atBottom) {';
        s += '        lastScrollTime = now;';
        s += '        navigateToAdjacentTab(1);';
        s += '      } else if (e.deltaY < 0 && atTop) {';
        s += '        lastScrollTime = now;';
        s += '        navigateToAdjacentTab(-1);';
        s += '      }';
        s += '    } catch(err) {}';
        s += '  }, { passive: true });';
        s += '}';
        s += 'function navigateToAdjacentTab(direction) {';
        s += '  var idx = tabs.findIndex(function(t){ return t.id === activeTabId; });';
        s += '  if (idx === -1) return;';
        s += '  var newIdx = idx + direction;';
        s += '  if (newIdx >= 0 && newIdx < tabs.length) {';
        s += '    activateTab(tabs[newIdx].id);';
        s += '  }';
        s += '}';
        s += 'function getFrameDocument() {';
        s += '  var frame = document.getElementById("active-frame");';
        s += '  if (!frame) return null;';
        s += '  try { return frame.contentDocument || frame.contentWindow.document; } catch(e) { return null; }';
        s += '}';
        s += 'function getScrollInfo() {';
        s += '  var doc = getFrameDocument();';
        s += '  if (doc) {';
        s += '    var el = doc.documentElement;';
        s += '    return { scrollTop: el.scrollTop, scrollHeight: el.scrollHeight, clientHeight: el.clientHeight };';
        s += '  }';
        s += '  var pdfContainer = document.getElementById("pdf-container");';
        s += '  var pdfScroll = document.getElementById("pdf-scroll");';
        s += '  if (pdfContainer && pdfScroll && pdfContainer.classList.contains("show")) {';
        s += '    return { scrollTop: pdfScroll.scrollTop, scrollHeight: pdfScroll.scrollHeight, clientHeight: pdfScroll.clientHeight };';
        s += '  }';
        s += '  return null;';
        s += '}';
        s += 'function getHandScrollTarget() {';
        s += '  var pdfContainer = document.getElementById("pdf-container");';
        s += '  var pdfScroll = document.getElementById("pdf-scroll");';
        s += '  if (pdfContainer && pdfScroll && pdfContainer.classList.contains("show")) return pdfScroll;';
        s += '  var doc = getFrameDocument();';
        s += '  if (doc) return doc.documentElement;';
        s += '  return null;';
        s += '}';
        s += 'function handStart(e) {';
        s += '  if (!handMode) return;';
        s += '  var frame = document.getElementById("active-frame");';
        s += '  var target = getHandScrollTarget();';
        s += '  if (!target) {';
        s += '    if (!handWarned) { handWarned = true; showNotification("Modo arrastar indisponível para este documento"); }';
        s += '    return;';
        s += '  }';
        s += '  handDragging = true;';
        s += '  handDoc = target;';
        s += '  handStartX = e.clientX;';
        s += '  handStartY = e.clientY;';
        s += '  handScrollLeft = target.scrollLeft || 0;';
        s += '  handScrollTop = target.scrollTop || 0;';
        s += '  if (frame) frame.style.cursor = "grabbing";';
        s += '  var pdfScroll = document.getElementById("pdf-scroll");';
        s += '  if (pdfScroll) pdfScroll.style.cursor = "grabbing";';
        s += '  if (e.preventDefault) e.preventDefault();';
        s += '}';
        s += 'function handMove(e) {';
        s += '  if (!handDragging || !handMode || !handDoc) return;';
        s += '  var dx = e.clientX - handStartX;';
        s += '  var dy = e.clientY - handStartY;';
        s += '  handDoc.scrollLeft = handScrollLeft - dx;';
        s += '  handDoc.scrollTop = handScrollTop - dy;';
        s += '}';
        s += 'function handEnd() {';
        s += '  if (!handDragging) return;';
        s += '  handDragging = false;';
        s += '  var frame = document.getElementById("active-frame");';
        s += '  if (frame && handMode) frame.style.cursor = "grab";';
        s += '  var pdfScroll = document.getElementById("pdf-scroll");';
        s += '  if (pdfScroll && handMode) pdfScroll.style.cursor = "grab";';
        s += '  handDoc = null;';
        s += '}';
        s += 'function attachHandModeHandlers() {';
        s += '  var frame = document.getElementById("active-frame");';
        s += '  if (frame) frame.onmousedown = handStart;';
        s += '  var doc = getFrameDocument();';
        s += '  if (doc && doc !== lastHandDoc) {';
        s += '    lastHandDoc = doc;';
        s += '    try { doc.addEventListener("mousedown", handStart); } catch(e) {}';
        s += '  }';
        s += '  var pdfScroll = document.getElementById("pdf-scroll");';
        s += '  if (pdfScroll) pdfScroll.onmousedown = handStart;';
        s += '}';
        s += 'function setPdfVisible(show) {';
        s += '  var pdf = document.getElementById("pdf-container");';
        s += '  if (!pdf) return;';
        s += '  if (show) pdf.classList.add("show");';
        s += '  else pdf.classList.remove("show");';
        s += '}';
        s += 'function ensurePdfWorker() {';
        s += '  if (pdfWorkerReady || !window.pdfjsLib) return;';
        s += '  pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";';
        s += '  pdfWorkerReady = true;';
        s += '}';
        s += 'function renderPdf(tab) {';
        s += '  var scroll = document.getElementById("pdf-scroll");';
        s += '  if (!scroll) return;';
        s += '  scroll.innerHTML = "<div class=\\"pdf-loading\\">Carregando PDF...</div>";';
        s += '  if (!window.pdfjsLib) { scroll.innerHTML = "<div class=\\"pdf-loading\\">PDF.js não disponível.</div>"; return; }';
        s += '  ensurePdfWorker();';
        s += '  var data = tab.pdfData;';
        s += '  if (!data) { scroll.innerHTML = "<div class=\\"pdf-loading\\">PDF não encontrado.</div>"; return; }';
        s += '  var bytes = (data instanceof ArrayBuffer) ? new Uint8Array(data) : data;';
        s += '  pdfjsLib.getDocument({ data: bytes }).promise.then(function(pdf){';
        s += '    scroll.innerHTML = "";';
        s += '    ensurePdfText(tab, pdf);';
        s += '    var chain = Promise.resolve();';
        s += '    for (var i = 1; i <= pdf.numPages; i++) {';
        s += '      (function(pageNum){';
        s += '        chain = chain.then(function(){';
        s += '          return pdf.getPage(pageNum).then(function(page){';
        s += '            var viewport = page.getViewport({ scale: 1.2 });';
        s += '            var canvas = document.createElement("canvas");';
        s += '            canvas.width = viewport.width;';
        s += '            canvas.height = viewport.height;';
        s += '            canvas.className = "pdf-page";';
        s += '            scroll.appendChild(canvas);';
        s += '            var ctx = canvas.getContext("2d");';
        s += '            return page.render({ canvasContext: ctx, viewport: viewport }).promise;';
        s += '          });';
        s += '        });';
        s += '      })(i);';
        s += '    }';
        s += '  }).catch(function(){';
        s += '    scroll.innerHTML = "<div class=\\"pdf-loading\\">Falha ao carregar PDF.</div>";';
        s += '  });';
        s += '}';
        s += 'function ensurePdfTextFromData(tab) {';
        s += '  if (!tab || tab.pdfText || tab.pdfTextPromise) return;';
        s += '  if (!window.pdfjsLib) return;';
        s += '  ensurePdfWorker();';
        s += '  if (!tab.pdfData) return;';
        s += '  var bytes = (tab.pdfData instanceof ArrayBuffer) ? new Uint8Array(tab.pdfData) : tab.pdfData;';
        s += '  tab.pdfTextPromise = pdfjsLib.getDocument({ data: bytes }).promise.then(function(pdf){';
        s += '    return extractPdfText(tab, pdf);';
        s += '  }).catch(function(){ tab.pdfTextPromise = null; });';
        s += '}';
        s += 'function ensurePdfText(tab, pdf) {';
        s += '  if (!tab || tab.pdfText || tab.pdfTextPromise) return;';
        s += '  tab.pdfTextPromise = extractPdfText(tab, pdf);';
        s += '}';
        s += 'function extractPdfText(tab, pdf) {';
        s += '  var parts = [];';
        s += '  var chain = Promise.resolve();';
        s += '  for (var i = 1; i <= pdf.numPages; i++) {';
        s += '    (function(pageNum){';
        s += '      chain = chain.then(function(){';
        s += '        return pdf.getPage(pageNum).then(function(page){';
        s += '          return page.getTextContent().then(function(tc){';
        s += '            tc.items.forEach(function(it){ if (it && it.str) parts.push(it.str); });';
        s += '          });';
        s += '        });';
        s += '      });';
        s += '    })(i);';
        s += '  }';
        s += '  return chain.then(function(){';
        s += '    tab.pdfText = parts.join(" ");';
        s += '    tab.pdfTextPromise = null;';
        s += '    renderTabs();';
        s += '  }).catch(function(){ tab.pdfTextPromise = null; });';
        s += '}';
        s += 'function setupHandMode() {';
        s += '  document.addEventListener("mousemove", handMove);';
        s += '  document.addEventListener("mouseup", handEnd);';
        s += '}';
        s += 'function setupSidebarResizer() {';
        s += '  var resizer = document.getElementById("sidebar-resizer");';
        s += '  var sidebar = document.getElementById("sidebar");';
        s += '  if (!resizer || !sidebar) return;';
        s += '  var startX = 0, startW = 0, isDrag = false;';
        s += '  var minW = 260, maxW = 560;';
        s += '  resizer.addEventListener("mousedown", function(e){';
        s += '    isDrag = true; startX = e.clientX; startW = sidebar.getBoundingClientRect().width;';
        s += '    document.body.style.userSelect = "none";';
        s += '  });';
        s += '  document.addEventListener("mousemove", function(e){';
        s += '    if (!isDrag) return;';
        s += '    var w = Math.max(minW, Math.min(maxW, startW + (e.clientX - startX)));';
        s += '    sidebar.style.width = w + "px";';
        s += '  });';
        s += '  document.addEventListener("mouseup", function(){';
        s += '    if (!isDrag) return;';
        s += '    isDrag = false; document.body.style.userSelect = "";';
        s += '  });';
        s += '}';
        s += 'init();';
        s += '<';
        s += '/script>';
        s += '<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js" onload="onPdfJsReady()"></script>';
        s += '</body>';
        s += '</html>';
        return s;
    }

    // ============================================================
    // FUNÇÕES PRINCIPAIS
    // ============================================================

    function isDocumentLink(element) {
        if (!element || element.tagName !== 'A') return false;
        const href = element.getAttribute('href');
        if (!href || href.startsWith('javascript:')) return false;

        return CONFIG.DOCUMENT_SELECTORS.some(selector => {
            try { return element.matches(selector); }
            catch (e) { return false; }
        });
    }

    function getEventIdFromLink(link) {
        if (!link) return null;
        const td = link.closest('td[id^="tdEvento"]');
        if (td && td.id) {
            const mTd = td.id.match(/tdEvento(\d+)/i);
            if (mTd && mTd[1]) return mTd[1];
        }
        const href = link.getAttribute('href') || '';
        try {
            const url = new URL(href, window.location.href);
            const seq = url.searchParams.get('numSeqEvento');
            if (seq) return seq;
        } catch (e) { }
        const onclick = link.getAttribute('onclick') || '';
        const combined = href + ' ' + onclick;
        let m = combined.match(/numSeqEvento=([0-9]+)/i) || combined.match(/evento=([0-9]+)/i);
        if (m && m[1]) return m[1];
        return null;
    }

    function findEventRowForLink(link) {
        if (!link) return null;
        const ancestorEventRow = link.closest('tr[id^="trEvento"]');
        if (ancestorEventRow) return ancestorEventRow;
        const eventId = getEventIdFromLink(link);
        if (eventId) {
            const byId = document.getElementById('trEvento' + eventId);
            if (byId) return byId;
        }
        let row = link.closest('tr');
        if (!row) return null;
        if (row.id && row.id.indexOf('trEvento') === 0) return row;
        let prev = row.previousElementSibling;
        while (prev) {
            if (prev.id && prev.id.indexOf('trEvento') === 0) return prev;
            prev = prev.previousElementSibling;
        }
        return row;
    }

    function getEventoNumFromRow(row, cells) {
        if (row && row.id) {
            const mId = row.id.match(/^trEvento(\d+)$/i);
            if (mId && mId[1]) return mId[1];
        }
        const cell = cells && cells[1] ? cells[1] : null;
        if (cell) {
            const m = (cell.textContent || '').match(/^\s*(\d+)/);
            if (m && m[1]) return m[1];
        }
        return '';
    }

    function getInfraClassesFromRow(row) {
        if (!row) return [];
        const targets = [row].concat(Array.from(row.querySelectorAll('*')));
        const classSet = new Set();
        const allowed = new Set([
            'acaoExternaPendente',
            'infraEventoPublicacaoExternaNaoCumprida',
            'infraEventoPublicacaoExternaCumprida',
            'infraEventoPrazoFechouMovimento',
            'infraEventoPublicacaoExternaPendente',
            'infraEventoPrazoFechouDecurso',
            'infraEventoPrazoAguardando'
        ]);
        targets.forEach(el => {
            el.classList && el.classList.forEach(cls => {
                if (allowed.has(cls)) classSet.add(cls);
            });
        });
        return Array.from(classSet);
    }

    function getRelevanciaUrlFromRow(row) {
        if (!row) return '';
        const link = row.querySelector('a[href*="switchRelevanciaEvento"], a[onclick*="switchRelevanciaEvento"]');
        if (!link) return '';
        const raw = (link.getAttribute('href') || '') + ' ' + (link.getAttribute('onclick') || '');
        let m = raw.match(/switchRelevanciaEvento\([^,]+,\s*'[^']*'\s*,\s*'([^']+)'/i);
        if (!m) m = raw.match(/switchRelevanciaEvento\([^,]+,\s*"[^"]*"\s*,\s*"([^"]+)"/i);
        return m && m[1] ? m[1] : '';
    }

    function normalizeSpacesSimple(str) {
        return (str || '').replace(/\s+/g, ' ').trim();
    }

    function decodeHtmlEntities(str) {
        if (!str) return '';
        const textarea = document.createElement('textarea');
        textarea.innerHTML = str;
        return textarea.value;
    }

    function getDocResumoFromLink(link) {
        const td = link.closest('td');
        if (!td) return '';
        let resumo = '';
        const resumoEl = td.querySelector('span.infraTextoTooltipObservacao, span.infraTextoTooltip');
        if (resumoEl) {
            const raw = resumoEl.textContent || '';
            if (/^\s*Resumo\s*:/i.test(raw)) resumo = raw;
        }
        if (!resumo) {
            const tooltipLink = td.querySelector('a.infraDocumentoTooltip');
            if (tooltipLink) {
                const onmouseover = tooltipLink.getAttribute('onmouseover') || '';
                const m = onmouseover.match(/Resumo:\s*([^<]+?)(?:\s*\/<|<br|\s*\)|'|$)/i);
                if (m && m[1]) resumo = decodeHtmlEntities(m[1]);
            }
        }
        resumo = normalizeSpacesSimple(resumo);
        resumo = resumo.replace(/^Resumo\s*:\s*/i, '').trim();
        return resumo;
    }

    function extractDocInfo(link) {
        const row = findEventRowForLink(link);
        let eventoNum = '', eventoNome = '', docNome = '', processNum = '', isRelevant = false;
        let dataHora = '', usuario = '', eventoDescricaoCompleta = '';
        let infraClasses = [];
        let docResumo = '';
        let relevanciaUrl = '';
        let parteTipoRow = '';

        if (row) {
            infraClasses = getInfraClassesFromRow(row);
            relevanciaUrl = getRelevanciaUrlFromRow(row);
            parteTipoRow = row.getAttribute('data-parte') || '';
            const cells = row.querySelectorAll('td');
            eventoNum = getEventoNumFromRow(row, cells);
            cells.forEach((cell, index) => {
                const text = cell.textContent.trim();
                if (index === 2 && /\d{2}\/\d{2}\/\d{4}/.test(text)) {
                    dataHora = text;
                }
                if (cell.classList.contains('infraEventoDescricao')) {
                    const label = cell.querySelector('label.infraEventoDescricao');
                    eventoNome = label ? label.textContent.trim() : '';
                    eventoDescricaoCompleta = cell.textContent.trim();
                }
                if (cell.querySelector('label.infraEventoUsuario')) {
                    usuario = cell.querySelector('label.infraEventoUsuario').textContent.trim();
                }
            });

            const starImg = row.querySelector('img[src*="EstrelaAcesa"]');
            isRelevant = !!starImg;
        }

        docNome = link.textContent.trim();
        docResumo = getDocResumoFromLink(link);

        const urlParams = new URLSearchParams(window.location.search);
        processNum = urlParams.get('num_processo') || '';

        return {
            url: getDocUrlFromLink(link) || link.href,
            eventoNum,
            eventoNome,
            docNome,
            docResumo,
            processNum,
            isRelevant,
            dataHora,
            usuario,
            eventoDescricaoCompleta,
            infraClasses,
            relevanciaUrl,
            parteTipoRow,
            type: 'document'
        };
    }

    function getDocUrlFromLink(link) {
        const href = link.getAttribute('href');
        if (href && !href.startsWith('javascript:')) return link.href;
        const onclick = link.getAttribute('onclick') || '';
        let m = onclick.match(/'(https?:[^']+)'/i) || onclick.match(/"(https?:[^"]+)"/i);
        if (m && m[1]) return m[1];
        m = onclick.match(/(controlador\.php\?[^"']+acao=acessar_documento[^"']+)/i) || onclick.match(/(controlador\.php\?[^"']+acao_documento=[^"']+)/i);
        if (m && m[1]) return new URL(m[1], window.location.href).toString();
        return null;
    }

    function getDocLinksFromRow(row) {
        return Array.from(row.querySelectorAll('a.infraLinkDocumento, a[href*="acao=acessar_documento"], a[href*="acao_documento="], a[onclick*="abrirDocumento"], a[onclick*="visualizarDocumento"]'));
    }

    function extractLembretes() {
        const lembretes = [];
        document.querySelectorAll('.divLembrete').forEach((el, i) => {
            const id = el.id || 'lembrete_' + i;
            const para = el.querySelector('.divLembretePara')?.textContent?.trim()?.split('\n')[0] || 'Lembrete';
            const descricao = el.querySelector('.desLembrete')?.textContent?.trim() || '';
            const dataDiv = el.querySelector('.divLembreteData');
            let dataInfo = '';
            if (dataDiv) {
                const text = dataDiv.textContent.trim();
                const match = text.match(/([A-Z0-9]+)\s*(\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}:\d{2})/);
                if (match) {
                    dataInfo = match[1] + ' - ' + match[2];
                } else {
                    dataInfo = text;
                }
            }
            if (descricao) {
                lembretes.push({ id, para, descricao, dataInfo });
            }
        });
        return lembretes;
    }

    function extractLabels() {
        const labels = [];
        document.querySelectorAll('.lblAvisoTopolabel, .lblAvisoImportante, label.eprocLabel').forEach(el => {
            const text = el.textContent.trim();
            if (text && !labels.includes(text)) labels.push(text);
        });
        return labels;
    }

    function extractPartes() {
        const table = document.getElementById('tblPartesERepresentantes');
        if (!table) return [];
        const headerRow = table.querySelector('tr');
        const headers = headerRow ? Array.from(headerRow.querySelectorAll('th')).map(th => normalizeSpacesSimple(th.textContent)) : [];
        const rows = Array.from(table.querySelectorAll('tr')).slice(1);
        const partes = [];

        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            cells.forEach((cell, idx) => {
                const tipo = headers[idx] || '';
                const partyLinks = Array.from(cell.querySelectorAll('a.infraNomeParte'));
                if (!partyLinks.length) return;
                const reps = extractRepresentantesFromCell(cell);
                const detalhes = extractDetalhesFromCell(cell);
                partyLinks.forEach(link => {
                    const nome = normalizeSpacesSimple(link.textContent);
                    const dataParte = (link.getAttribute('data-parte') || '').toUpperCase();
                    partes.push({
                        tipo: tipo || dataParte || 'OUTROS',
                        nome,
                        detalhes,
                        representantes: reps
                    });
                });
            });
        });

        return partes;
    }

    function extractDetalhesFromCell(cell) {
        if (!cell) return '';
        const text = normalizeSpacesSimple(cell.textContent || '');
        const parts = [];
        const idade = text.match(/\((\d+)\s+anos?\)/i);
        if (idade && idade[1]) parts.push(idade[1] + ' anos');
        const cpf = text.match(/\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/);
        const cnpj = text.match(/\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b/);
        if (cpf) parts.push(cpf[0]);
        else if (cnpj) parts.push(cnpj[0]);
        const tipoPessoa = text.match(/Pessoa\s+F[ií]sica|Pessoa\s+Jur[ií]dica/i);
        if (tipoPessoa) parts.push(tipoPessoa[0]);
        return parts.join(' | ');
    }

    function extractRepresentantesFromCell(cell) {
        const reps = [];
        if (!cell) return reps;
        const links = Array.from(cell.querySelectorAll('a')).filter(a => !a.classList.contains('infraNomeParte'));
        for (let i = 0; i < links.length; i++) {
            const text = normalizeSpacesSimple(links[i].textContent || '');
            if (!text) continue;
            const over = links[i].getAttribute('onmouseover') || '';
            const next = links[i + 1] ? normalizeSpacesSimple(links[i + 1].textContent || '') : '';
            const nextOab = next.match(/[A-Z]{2}\s*\d{4,}/i);
            const nextOver = links[i + 1] ? (links[i + 1].getAttribute('onmouseover') || '') : '';
            if (nextOab && (/ADVOGADO/i.test(nextOver) || /ADVOGADO/i.test(over))) {
                reps.push('Adv: ' + text + ' (' + nextOab[0].replace(/\s+/g, '') + ')');
                i += 1;
                continue;
            }
            const curOab = text.match(/[A-Z]{2}\s*\d{4,}/i);
            if (curOab && /ADVOGADO/i.test(over)) {
                reps.push('Adv: ' + curOab[0].replace(/\s+/g, ''));
                continue;
            }
            if (/ADVOGADO/i.test(over)) {
                reps.push('Adv: ' + text);
            }
        }
        return Array.from(new Set(reps));
    }

    function collectAllEvents() {
        const events = [];
        const urlParams = new URLSearchParams(window.location.search);
        const processNum = urlParams.get('num_processo') || '';

        document.querySelectorAll('tr[id^="trEvento"]').forEach(row => {
            const cells = row.querySelectorAll('td');
            let eventoNum = '', dataHora = '', eventoNome = '', usuario = '', eventoDescricaoCompleta = '';
            let infraClasses = getInfraClassesFromRow(row);
            let isRelevant = false;
            let relevanciaUrl = getRelevanciaUrlFromRow(row);
            let parteTipoRow = row.getAttribute('data-parte') || '';

            const starImg = row.querySelector('img[src*="EstrelaAcesa"]');
            isRelevant = !!starImg;

            eventoNum = getEventoNumFromRow(row, cells);
            cells.forEach((cell, index) => {
                const text = cell.textContent.trim();
                if (index === 2 && /\d{2}\/\d{2}\/\d{4}/.test(text)) {
                    dataHora = text;
                }
                if (cell.classList.contains('infraEventoDescricao')) {
                    const label = cell.querySelector('label.infraEventoDescricao');
                    eventoNome = label ? label.textContent.trim() : '';
                    eventoDescricaoCompleta = cell.textContent.trim();
                }
                if (cell.querySelector('label.infraEventoUsuario')) {
                    usuario = cell.querySelector('label.infraEventoUsuario').textContent.trim();
                }
            });

            // Documentos do evento (no próprio row ou nas linhas seguintes até o próximo evento)
            const docs = [];
            let current = row;
            while (current) {
                if (current !== row && current.id && current.id.indexOf('trEvento') === 0) break;
                docs.push(...getDocLinksFromRow(current));
                current = current.nextElementSibling;
            }
            if (docs.length > 0) {
                let pushed = 0;
                docs.forEach(link => {
                    const url = getDocUrlFromLink(link);
                    if (!url) return;
                    pushed++;
                    events.push({
                        url,
                        eventoNum,
                        eventoNome,
                        docNome: link.textContent.trim(),
                        docResumo: getDocResumoFromLink(link),
                        processNum,
                        isRelevant,
                        dataHora,
                        usuario,
                        eventoDescricaoCompleta,
                        infraClasses,
                        relevanciaUrl,
                        parteTipoRow,
                        type: 'document'
                    });
                });
                if (pushed === 0) {
                    events.push({
                        url: '',
                        eventoNum,
                        eventoNome,
                        docNome: '',
                        processNum,
                        isRelevant,
                        dataHora,
                        usuario,
                        eventoDescricaoCompleta,
                        infraClasses,
                        relevanciaUrl,
                        parteTipoRow,
                        type: 'event'
                    });
                }
            } else {
                // Evento sem documentos
                events.push({
                    url: '',
                    eventoNum,
                    eventoNome,
                    docNome: '',
                    processNum,
                    isRelevant,
                    dataHora,
                    usuario,
                    eventoDescricaoCompleta,
                    infraClasses,
                    relevanciaUrl,
                    parteTipoRow,
                    type: 'event'
                });
            }
        });

        return events;
    }

    function sendLembretes(processNum) {
        const lembretes = extractLembretes();
        const channel = new BroadcastChannel(CONFIG.CHANNEL_NAME);
        channel.postMessage({ type: 'UPDATE_LEMBRETES', payload: { processNum, lembretes } });
        channel.close();
    }

    function sendLabels(processNum) {
        const labels = extractLabels();
        const channel = new BroadcastChannel(CONFIG.CHANNEL_NAME);
        channel.postMessage({ type: 'UPDATE_LABELS', payload: { processNum, labels } });
        channel.close();
    }

    function sendPartes(processNum) {
        const partes = extractPartes();
        const channel = new BroadcastChannel(CONFIG.CHANNEL_NAME);
        channel.postMessage({ type: 'UPDATE_PARTES', payload: { processNum, partes } });
        channel.close();
    }

    function checkViewerExists() {
        return new Promise(resolve => {
            const channel = new BroadcastChannel(CONFIG.CHANNEL_NAME);
            let resolved = false;
            channel.onmessage = e => {
                if (e.data.type === 'VIEWER_EXISTS_RESPONSE') {
                    resolved = true;
                    channel.close();
                    resolve(true);
                }
            };
            channel.postMessage({ type: 'CHECK_VIEWER_EXISTS' });
            setTimeout(() => {
                if (!resolved) {
                    channel.close();
                    resolve(false);
                }
            }, 100);
        });
    }

    function openViewerWindowSync(skipExistingCheck = true) {
        const savedPos = JSON.parse(localStorage.getItem(CONFIG.POSITION_KEY) || 'null');
        const w = savedPos?.width || CONFIG.DEFAULT_WIDTH;
        const h = savedPos?.height || CONFIG.DEFAULT_HEIGHT;
        const l = savedPos?.left || 100;
        const t = savedPos?.top || 100;

        const features = 'popup=yes,width=' + w + ',height=' + h + ',left=' + l + ',top=' + t + ',menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes';

        if (docWindow && !docWindow.closed) {
            try {
                const sidebar = docWindow.document.getElementById('sidebar');
                if (sidebar) {
                    docWindow.focus();
                    return 'exists';
                }
            } catch (e) { }
        }

        if (!skipExistingCheck) {
            return 'check_needed';
        }

        docWindow = window.open('about:blank', CONFIG.WINDOW_NAME, features);

        if (docWindow) {
            let needsContent = true;
            try {
                const sidebar = docWindow.document.getElementById('sidebar');
                const title = docWindow.document.title;
                if (sidebar || title === 'Documentos - Eproc') {
                    needsContent = false;
                }
            } catch (e) {
                try {
                    if (docWindow.location.href !== 'about:blank') {
                        needsContent = false;
                    }
                } catch (e2) { }
            }

            if (needsContent) {
                const html = getViewerHTML();
                docWindow.document.open();
                docWindow.document.write(html);
                docWindow.document.close();
            }

            docWindow.focus();
            return 'created';
        }

        return 'failed';
    }

    async function openViewerOnly() {
        let result = openViewerWindowSync(false);

        if (result === 'check_needed') {
            const exists = await checkViewerExists();
            if (exists) {
                const channel = new BroadcastChannel(CONFIG.CHANNEL_NAME);
                channel.postMessage({ type: 'FOCUS_VIEWER' });
                channel.close();
                return;
            }
            result = openViewerWindowSync(true);
        }

        if (result === 'exists' || result === 'created') {
            setTimeout(() => {
                const channel = new BroadcastChannel(CONFIG.CHANNEL_NAME);
                channel.postMessage({ type: 'FOCUS_VIEWER' });
                channel.close();
            }, result === 'created' ? 500 : 100);
        }
    }

    async function openDocument(docInfo) {
        if (CONFIG.USE_PDFJS && docInfo?.url) {
            try {
                const pdfData = await fetchPdfArrayBufferSmart(docInfo.url);
                await openPdfInViewer(docInfo, pdfData);
                return;
            } catch (e) {
                console.warn('Falha ao carregar PDF via PDF.js, usando iframe.', e);
            }
        }
        let result = openViewerWindowSync(false);

        if (result === 'check_needed') {
            const exists = await checkViewerExists();
            if (exists) {
                const channel = new BroadcastChannel(CONFIG.CHANNEL_NAME);
                channel.postMessage({ type: 'OPEN_DOCUMENT', payload: docInfo });
                channel.postMessage({ type: 'FOCUS_VIEWER' });
                channel.close();
                sendLembretes(docInfo.processNum);
                sendLabels(docInfo.processNum);
                sendPartes(docInfo.processNum);
                return;
            }
            result = openViewerWindowSync(true);
        }

        if (result === 'exists' || result === 'created') {
            setTimeout(() => {
                const channel = new BroadcastChannel(CONFIG.CHANNEL_NAME);
                channel.postMessage({ type: 'OPEN_DOCUMENT', payload: docInfo });
                channel.close();
                sendLembretes(docInfo.processNum);
                sendLabels(docInfo.processNum);
                sendPartes(docInfo.processNum);
            }, result === 'created' ? 500 : 100);
        }
    }
    function fetchPdfArrayBuffer(url) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url,
                responseType: 'arraybuffer',
                withCredentials: true,
                onload: (res) => {
                    if (res.status >= 200 && res.status < 300 && res.response) resolve(res.response);
                    else reject(new Error('Status ' + res.status));
                },
                onerror: reject
            });
        });
    }
    function fetchTextGM(url) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url,
                responseType: 'text',
                withCredentials: true,
                onload: (res) => {
                    if (res.status >= 200 && res.status < 300) resolve(res.responseText || '');
                    else reject(new Error('Status ' + res.status));
                },
                onerror: reject
            });
        });
    }
    async function fetchPdfArrayBufferFetch(url) {
        const res = await fetch(url, { credentials: 'include' });
        if (!res.ok) throw new Error('Status ' + res.status);
        return await res.arrayBuffer();
    }
    async function fetchTextFetch(url) {
        const res = await fetch(url, { credentials: 'include' });
        if (!res.ok) throw new Error('Status ' + res.status);
        return await res.text();
    }
    function isPdfData(buffer) {
        if (!buffer || !(buffer instanceof ArrayBuffer)) return false;
        const bytes = new Uint8Array(buffer.slice(0, 5));
        return bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46; // %PDF
    }
    function extractPdfUrl(html, baseUrl) {
        if (!html) return null;
        const patterns = [
            /strLinkDownload\s*[:=]\s*['"]([^'"]+)['"]/i,
            /href=['"]([^'"]+?acao=acessar_documento[^'"]+)['"]/i,
            /src=['"]([^'"]+?\.pdf[^'"]*)['"]/i
        ];
        for (let i = 0; i < patterns.length; i++) {
            const m = html.match(patterns[i]);
            if (m && m[1]) {
                try { return new URL(m[1], baseUrl).toString(); } catch (e) { return m[1]; }
            }
        }
        return null;
    }
    async function fetchPdfArrayBufferSmart(url) {
        let data = null;
        let lastError = null;
        try {
            if (typeof GM_xmlhttpRequest === 'function') data = await fetchPdfArrayBuffer(url);
        } catch (e) { lastError = e; }
        if (!data) {
            try { data = await fetchPdfArrayBufferFetch(url); } catch (e) { lastError = e; }
        }
        if (data && isPdfData(data)) return data;

        let html = null;
        try {
            html = typeof GM_xmlhttpRequest === 'function' ? await fetchTextGM(url) : await fetchTextFetch(url);
        } catch (e) { lastError = e; }

        const altUrl = extractPdfUrl(html, url);
        if (altUrl) {
            try {
                if (typeof GM_xmlhttpRequest === 'function') data = await fetchPdfArrayBuffer(altUrl);
                else data = await fetchPdfArrayBufferFetch(altUrl);
            } catch (e) { lastError = e; }
            if (data) return data;
        }

        if (data) return data;
        throw lastError || new Error('Falha ao obter PDF');
    }
    async function openPdfInViewer(docInfo, pdfData) {
        let result = openViewerWindowSync(false);

        if (result === 'check_needed') {
            const exists = await checkViewerExists();
            if (exists) {
                const channel = new BroadcastChannel(CONFIG.CHANNEL_NAME);
                channel.postMessage({ type: 'OPEN_PDF_DOCUMENT', payload: { doc: docInfo, data: pdfData } });
                channel.postMessage({ type: 'FOCUS_VIEWER' });
                channel.close();
                sendLembretes(docInfo.processNum);
                sendLabels(docInfo.processNum);
                sendPartes(docInfo.processNum);
                return;
            }
            result = openViewerWindowSync(true);
        }

        if (result === 'exists' || result === 'created') {
            setTimeout(() => {
                const channel = new BroadcastChannel(CONFIG.CHANNEL_NAME);
                channel.postMessage({ type: 'OPEN_PDF_DOCUMENT', payload: { doc: docInfo, data: pdfData } });
                channel.close();
                sendLembretes(docInfo.processNum);
                sendLabels(docInfo.processNum);
                sendPartes(docInfo.processNum);
            }, result === 'created' ? 500 : 100);
        }
    }

    async function openAllDocuments() {
        const events = collectAllEvents();
        if (events.length === 0) {
            showNotification('Nenhum evento encontrado na página');
            return;
        }

        const urlParams = new URLSearchParams(window.location.search);
        const processNum = urlParams.get('num_processo') || '';

        let result = openViewerWindowSync(false);

        if (result === 'check_needed') {
            const exists = await checkViewerExists();
            if (exists) {
                const channel = new BroadcastChannel(CONFIG.CHANNEL_NAME);
                channel.postMessage({ type: 'OPEN_BULK_DOCUMENTS', payload: events });
                channel.postMessage({ type: 'FOCUS_VIEWER' });
                channel.close();
                sendLembretes(processNum);
                sendLabels(processNum);
                sendPartes(processNum);
                showNotification('Abrindo ' + events.length + ' evento(s)...');
                return;
            }
            result = openViewerWindowSync(true);
        }

        if (result === 'exists' || result === 'created') {
            setTimeout(() => {
                const channel = new BroadcastChannel(CONFIG.CHANNEL_NAME);
                channel.postMessage({ type: 'OPEN_BULK_DOCUMENTS', payload: events });
                channel.close();
                sendLembretes(processNum);
                sendLabels(processNum);
                sendPartes(processNum);
            }, result === 'created' ? 500 : 100);
            showNotification('Abrindo ' + events.length + ' evento(s)...');
        }
    }

    function handleClick(e) {
        if (!isEnabled) return;

        const link = e.target.closest('a');
        if (!link || !isDocumentLink(link)) return;

        e.preventDefault();
        e.stopPropagation();

        const docInfo = extractDocInfo(link);
        openDocument(docInfo);
    }

    // ============================================================
    // AJUSTE POPOVER COPIAR LINK (evento 31.32 -> 31)
    // ============================================================

    const PDF_ZOOM_KEY = 'eproc_pdf_zoom';

    function getPreferredPdfZoom() {
        return localStorage.getItem(PDF_ZOOM_KEY) || 'page-width';
    }

    function savePreferredPdfZoom(zoom) {
        if (!zoom) return;
        try { localStorage.setItem(PDF_ZOOM_KEY, zoom); } catch (e) { }
    }

    function parseZoomFromUrl(url) {
        if (!url) return '';
        const hashIndex = url.indexOf('#');
        if (hashIndex === -1) return '';
        const hash = url.substring(hashIndex + 1);
        const parts = hash.split('&');
        for (let i = 0; i < parts.length; i++) {
            const kv = parts[i].split('=');
            if (kv.length === 2 && kv[0].toLowerCase() === 'zoom') return decodeURIComponent(kv[1]);
        }
        return '';
    }

    function applyZoomToUrl(url, zoom) {
        if (!url || !zoom) return url;
        const hashIndex = url.indexOf('#');
        if (hashIndex === -1) return url + '#zoom=' + encodeURIComponent(zoom);
        const base = url.substring(0, hashIndex);
        const hash = url.substring(hashIndex + 1);
        if (/zoom=/i.test(hash)) return url;
        return base + '#' + hash + (hash ? '&' : '') + 'zoom=' + encodeURIComponent(zoom);
    }

    function isLikelyPdfUrl(url) {
        if (!url) return false;
        const u = url.toLowerCase();
        if (u.indexOf('.pdf') >= 0 || /mimetype=pdf/i.test(u) || /mimetype%3dpdf/i.test(u)) return true;
        if (/acao=acessar_documento_implementacao/i.test(u) || /acao=acessar_documento\b/i.test(u)) {
            const base = extractPdfIndicatorFromDadosIconLink(url);
            if (base) return true;
        }
        return false;
    }

    function extractPdfIndicatorFromDadosIconLink(url) {
        if (!url) return false;
        try {
            const u = new URL(url, window.location.href);
            const dados = u.searchParams.get('dadosIconLink');
            if (!dados) return false;
            const decoded = decodeURIComponent(dados.replace(/\s+/g, ''));
            const raw = atob(decoded);
            return /mimetype";s:\d+:"pdf"/i.test(raw) || /MimeType";s:\d+:"pdf"/i.test(raw) || /MimeType\s*\:\s*"pdf"/i.test(raw);
        } catch (e) {
            return false;
        }
    }

    function extractDownloadUrlFromDadosIconLink(url) {
        if (!url) return '';
        try {
            const u = new URL(url, window.location.href);
            const dados = u.searchParams.get('dadosIconLink');
            if (!dados) return '';
            const decoded = decodeURIComponent(dados.replace(/\s+/g, ''));
            const raw = atob(decoded);
            const m = raw.match(/strLinkDownload";s:\d+:"([^"]+)"/i);
            if (!m || !m[1]) return '';
            return resolveUrl(m[1], u.origin + u.pathname);
        } catch (e) {
            return '';
        }
    }

    function attachPdfZoomPersistence(iframe) {
        if (!iframe || iframe.__eprocPdfZoomAttached) return;
        iframe.__eprocPdfZoomAttached = true;
        iframe.addEventListener('load', () => {
            try {
                const win = iframe.contentWindow;
                const update = () => {
                    const z = parseZoomFromUrl(win.location.href);
                    if (z) savePreferredPdfZoom(z);
                };
                update();
                win.addEventListener('hashchange', update);
            } catch (e) { }
        });
    }

    function resolveUrl(url, base) {
        if (!url) return '';
        try { return new URL(url, base || window.location.href).toString(); } catch (e) { return url; }
    }

    function normalizePdfElement(el) {
        if (!el) return;
        const tag = (el.tagName || '').toLowerCase();
        const attr = tag === 'object' ? 'data' : 'src';
        const url = el.getAttribute && el.getAttribute(attr);
        const absUrl = resolveUrl(url, el.ownerDocument && el.ownerDocument.location ? el.ownerDocument.location.href : window.location.href);
        if (!url || !isLikelyPdfUrl(absUrl)) return;
        if (/acao=acessar_documento_implementacao/i.test(absUrl)) {
            const download = extractDownloadUrlFromDadosIconLink(absUrl);
            if (download) {
                const withZoom = applyZoomToUrl(download, getPreferredPdfZoom());
                el.setAttribute(attr, withZoom);
                if (tag === 'iframe') attachPdfZoomPersistence(el);
                return;
            }
        }
        const currentZoom = parseZoomFromUrl(url);
        if (currentZoom) savePreferredPdfZoom(currentZoom);
        else el.setAttribute(attr, applyZoomToUrl(url, getPreferredPdfZoom()));
        if (tag === 'iframe') attachPdfZoomPersistence(el);
    }

    function setupDocumentPdfZoom(doc) {
        if (!doc || !doc.body || doc.__eprocPdfZoomObserver) return;
        doc.__eprocPdfZoomObserver = true;
        const scan = root => {
            if (!root || !root.querySelectorAll) return;
            root.querySelectorAll('iframe, embed, object').forEach(normalizePdfElement);
        };
        scan(doc);
        const observer = new MutationObserver(mutations => {
            mutations.forEach(m => {
                if (m.type === 'attributes') {
                    normalizePdfElement(m.target);
                    return;
                }
                m.addedNodes.forEach(node => {
                    if (!(node instanceof HTMLElement)) return;
                    if (node.matches && node.matches('iframe, embed, object')) normalizePdfElement(node);
                    if (node.querySelectorAll) scan(node);
                });
            });
        });
        observer.observe(doc.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['src', 'data'] });
    }

    function setupPdfJsZoom(doc) {
        if (!doc || doc.__eprocPdfJsZoom) return;
        doc.__eprocPdfJsZoom = true;
        const win = doc.defaultView || doc.parentWindow;
        if (!win) return;
        const preferred = getPreferredPdfZoom();
        const tryApply = () => {
            try {
                const app = win.PDFViewerApplication;
                if (!app || !app.pdfViewer) return false;
                if (app.pdfViewer.currentScaleValue !== preferred) {
                    app.pdfViewer.currentScaleValue = preferred;
                }
                if (!app.__eprocZoomBound && app.eventBus && typeof app.eventBus.on === 'function') {
                    app.__eprocZoomBound = true;
                    app.eventBus.on('scalechanging', e => {
                        if (e && e.scale) savePreferredPdfZoom(String(e.scale));
                    });
                    app.eventBus.on('scalechange', e => {
                        if (e && e.scale) savePreferredPdfZoom(String(e.scale));
                    });
                }
                return true;
            } catch (e) {
                return false;
            }
        };
        let tries = 0;
        const timer = win.setInterval(() => {
            tries += 1;
            if (tryApply() || tries > 30) {
                win.clearInterval(timer);
            }
        }, 300);
    }

    function normalizeWidgetLinkText(root) {
        if (!root) return;
        const spans = root.querySelectorAll ? root.querySelectorAll('span.widgetlinkdocumento') : [];
        spans.forEach(span => {
            const text = (span.textContent || '').trim();
            const m = text.match(/^([0-9]+)\.([0-9]+)$/);
            if (m) span.textContent = m[1];
        });
    }

    function ensureShortEventLinkInPopover(popover) {
        if (!popover || popover.getAttribute('data-eproc-shortlink') === '1') return;
        const list = popover.querySelector('ul.list-group');
        if (!list) return;
        const items = Array.from(list.querySelectorAll('li.list-group-item'));
        items.forEach(li => {
            const link = li.querySelector('a');
            if (!link) return;
            const span = link.querySelector('span');
            const text = (span ? span.textContent : link.textContent || '').trim();
            const m = text.match(/^([0-9]+)\.([0-9]+)$/);
            if (!m) return;
            const shortText = m[1];
            const next = li.nextElementSibling;
            const nextText = next ? (next.textContent || '').trim() : '';
            if (nextText === shortText) return;
            const clone = li.cloneNode(true);
            const cloneLink = clone.querySelector('a');
            const cloneSpan = cloneLink ? cloneLink.querySelector('span') : null;
            if (cloneSpan) cloneSpan.textContent = shortText;
            else if (cloneLink) cloneLink.textContent = shortText;
            clone.setAttribute('data-eproc-shortlink', '1');
            li.insertAdjacentElement('afterend', clone);
        });
        popover.setAttribute('data-eproc-shortlink', '1');
    }

    function setupCopyLinkPopoverWatcher(doc) {
        if (!doc || !doc.body || doc.__eprocShortLinkObserver) return;
        doc.__eprocShortLinkObserver = true;
        normalizeWidgetLinkText(doc);
        const observer = new MutationObserver(mutations => {
            mutations.forEach(m => {
                m.addedNodes.forEach(node => {
                    if (!(node instanceof HTMLElement)) return;
                    if (node.classList && node.classList.contains('popover-body')) {
                        ensureShortEventLinkInPopover(node);
                        normalizeWidgetLinkText(node);
                    } else {
                        const pop = node.querySelector && node.querySelector('.popover-body');
                        if (pop) ensureShortEventLinkInPopover(pop);
                        normalizeWidgetLinkText(node);
                    }
                });
            });
        });
        observer.observe(doc.body, { childList: true, subtree: true });
    }

    function setupIframeObserver(doc) {
        if (!doc || !doc.body || doc.__eprocIframeObserver) return;
        doc.__eprocIframeObserver = true;
        const attach = iframe => {
            if (!iframe) return;
            iframe.addEventListener('load', () => setupIframeDocument(iframe));
            setupIframeDocument(iframe);
        };
        doc.querySelectorAll('iframe').forEach(attach);
        const obs = new MutationObserver(mutations => {
            mutations.forEach(m => {
                m.addedNodes.forEach(node => {
                    if (!(node instanceof HTMLElement)) return;
                    if (node.tagName === 'IFRAME') attach(node);
                    else if (node.querySelectorAll) node.querySelectorAll('iframe').forEach(attach);
                });
            });
        });
        obs.observe(doc.body, { childList: true, subtree: true });
    }

    function setupIframeDocument(iframe) {
        try {
            const doc = iframe.contentDocument || iframe.contentWindow?.document;
            if (!doc || doc.__eprocShortLinkInit) return;
            doc.__eprocShortLinkInit = true;
            setupCopyLinkPopoverWatcher(doc);
            setupDocumentPdfZoom(doc);
            setupPdfJsZoom(doc);
            setupIframeObserver(doc);
        } catch (e) { }
    }

    // ============================================================
    // UI
    // ============================================================

    function createUI() {
        const container = document.createElement('div');
        container.id = 'eproc-second-monitor-ui';
        container.style.cssText = 'position: fixed; bottom: 10px; right: 10px; display: flex; gap: 8px; z-index: 99999; opacity: 0.3; transition: opacity 0.2s;';
        container.onmouseenter = () => container.style.opacity = '1';
        container.onmouseleave = () => container.style.opacity = '0.3';

        const btnMonitor = document.createElement('button');
        btnMonitor.title = '2º Monitor: ' + (isEnabled ? 'ON' : 'OFF');
        btnMonitor.style.cssText = 'background: ' + (isEnabled ? '#28a745' : '#dc3545') + '; width: 22px; height: 22px; border: none; border-radius: 50%; cursor: pointer; font-size: 0; padding: 0; box-shadow: inset 0 0 0 2px rgba(255,255,255,0.35);';
        btnMonitor.onclick = () => {
            isEnabled = !isEnabled;
            localStorage.setItem(CONFIG.ENABLED_KEY, isEnabled);
            btnMonitor.title = '2º Monitor: ' + (isEnabled ? 'ON' : 'OFF');
            btnMonitor.style.background = isEnabled ? '#28a745' : '#dc3545';
        };

        const btnAll = document.createElement('button');
        btnAll.textContent = '📑 Abrir Tudo';
        btnAll.style.cssText = 'background: #007bff; color: #fff; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600;';
        btnAll.onclick = openAllDocuments;

        const btnViewer = document.createElement('button');
        btnViewer.title = 'Abrir janela auxiliar';
        btnViewer.textContent = '🪟';
        btnViewer.style.cssText = 'background: #6c757d; color: #fff; border: none; padding: 8px 10px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600;';
        btnViewer.onclick = openViewerOnly;

        container.appendChild(btnMonitor);
        container.appendChild(btnAll);
        container.appendChild(btnViewer);
        document.body.appendChild(container);
    }

    function showNotification(message) {
        const notif = document.createElement('div');
        notif.textContent = message;
        notif.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #333; color: #fff; padding: 12px 20px; border-radius: 8px; z-index: 999999; font-size: 14px;';
        document.body.appendChild(notif);
        setTimeout(() => notif.remove(), 3000);
    }

    function setupRelevanciaSync() {
        try {
            const channel = new BroadcastChannel(CONFIG.CHANNEL_NAME);
            channel.onmessage = e => {
                const data = e.data || {};
                if (data.type !== 'TOGGLE_RELEVANCIA_EVENTO') return;
                handleRelevanciaToggleFromViewer(data.payload || {});
            };
        } catch (e) { }
    }

    function toggleStarImage(img) {
        if (!img) return;
        const src = img.getAttribute('src') || '';
        if (src.indexOf('EstrelaAcesa') >= 0) img.setAttribute('src', src.replace('EstrelaAcesa', 'EstrelaApagada'));
        else if (src.indexOf('EstrelaApagada') >= 0) img.setAttribute('src', src.replace('EstrelaApagada', 'EstrelaAcesa'));
    }

    function handleRelevanciaToggleFromViewer(payload) {
        const eventoNum = payload.eventoNum || '';
        const url = payload.url || '';
        let handled = false;

        if (eventoNum) {
            const row = document.getElementById('trEvento' + eventoNum);
            if (row) {
                const link = row.querySelector('a[href*="switchRelevanciaEvento"], a[onclick*="switchRelevanciaEvento"]');
                if (link) {
                    try { link.click(); handled = true; } catch (e) { }
                }
            }
            const treeImg = document.getElementById('evtRelevante' + eventoNum);
            if (treeImg) {
                try { treeImg.click(); handled = true; } catch (e) { }
            }
        }

        if (!handled) {
            try {
                if (typeof window.trocarRelevanciaEvento === 'function' && eventoNum) {
                    window.trocarRelevanciaEvento(String(eventoNum));
                    handled = true;
                }
            } catch (e) { }
        }

        if (!handled && url) {
            fetch(url, { credentials: 'include' }).catch(() => { });
            handled = true;
        }

        if (!handled && eventoNum) {
            const row = document.getElementById('trEvento' + eventoNum);
            if (row) {
                const starImg = row.querySelector('img[src*="EstrelaAcesa"], img[src*="EstrelaApagada"]');
                toggleStarImage(starImg);
            }
            const treeImg = document.getElementById('evtRelevante' + eventoNum);
            toggleStarImage(treeImg);
        }
    }

    // ============================================================
    // INICIALIZAÇÃO
    // ============================================================

    function init() {
        const href = window.location.href;
        const isProcessoSelecionar = /^https:\/\/eproc1g\.tjsp\.jus\.br\/eproc\/controlador\.php\?acao=processo_selecionar\b/i.test(href);
        const isDocumento = /^https:\/\/eproc1g\.tjsp\.jus\.br\/eproc\/controlador\.php\?acao=acessar_documento\b/i.test(href);
        const inIframe = window.top !== window.self;
        if (!isProcessoSelecionar && !isDocumento) return;
        if (inIframe && !isDocumento) return;

        if (isProcessoSelecionar) {
            document.addEventListener('click', handleClick, true);
            setupRelevanciaSync();
            createUI();
        }

        setupCopyLinkPopoverWatcher(document);
        setupDocumentPdfZoom(document);
        setupIframeObserver(document);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
