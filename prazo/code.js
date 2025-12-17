/* ==============================================================================================
   CONFIGURAÇÕES GERAIS E VARIÁVEIS GLOBAIS
   ============================================================================================== */
moment.locale('pt-br'); // Define localidade do Moment.js

// Passos de prazo padrão para os botões de +/- (Atalhos comuns no direito)
const STANDARD_DEADLINES = [1, 2, 3, 5, 10, 15, 30, 60, 90, 180, 365];

// Configuração da Máscara de Data (IMask)
const DATE_MASK_OPTIONS = {
  mask: Date,
  pattern: 'DD/MM/YYYY',
  lazy: true,
  autofix: true,
  format: date => moment(date).format('DD/MM/YYYY'),
  parse: str => moment(str, 'DD/MM/YYYY'),
  blocks: {
    YYYY: { mask: IMask.MaskedRange, from: 1900, to: 2050 },
    MM: { mask: IMask.MaskedRange, from: 1, to: 12 },
    DD: { mask: IMask.MaskedRange, from: 1, to: 31 }
  }
};

/* ==============================================================================================
   INICIALIZAÇÃO (DOCUMENT READY)
   ============================================================================================== */
$(document).ready(function () {

  // 1. Inicializa componentes de UI
  initTooltips();
  initDateMask();
  initCalendar();
  $("#countType").selectpicker('refresh');

  // 2. Configura Eventos de Botões e Inputs
  setupNavigationEvents();
  setupInputEvents();
  setupCalcEvents();
  setupActionButtons(); // Copiar, Imprimir, Limpar

  // 3. Inicializa Tutorial (Evento de Clique)
  $("#tutorial-icon").click(() => startIntroTutorial());

  // 4. Tratamento Responsivo Inicial
  handleResponsiveLayout();
});

/* ==============================================================================================
   FUNÇÕES DE LÓGICA DE NEGÓCIO
   ============================================================================================== */

/**
 * Configura a máscara de input para o campo de data
 */
let dateMask;
function initDateMask() {
  const dateInput = document.getElementById('initialDate');
  if (dateInput) {
    dateMask = IMask(dateInput, DATE_MASK_OPTIONS);

    // Garante atualização das opções ao focar
    dateInput.addEventListener('focus', () => {
      dateMask.updateOptions(DATE_MASK_OPTIONS);
    });

    // Sincroniza variável global (se necessário por scripts legados)
    $('#initialDate').on('change', function () {
      // Lógica adicional se necessário ao mudar data manualmente
      console.log('Data alterada:', $(this).val());
    });
  }
}

/**
 * Inicializa o calendário (Semantic UI Calendar)
 */
function initCalendar() {
  $("#button_calendar").calendar({
    type: "date",
    monthFirst: false,
    today: true,
    closable: true,
    text: {
      days: ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"],
      months: ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"],
      monthsShort: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"],
      today: "Hoje",
      now: "Agora"
    },
    onSelect: function (date) {
      const formattedDate = moment(date).format("DD/MM/YYYY");
      $("#initialDate").val(formattedDate).trigger('change');
      if (dateMask) dateMask.value = formattedDate; // Atualiza máscara

      $('#days').focus(); // Foco no próximo campo

      // Chama função global se existir (de initialDateFunc.js)
      if (typeof initialDateFunc === 'function') {
        initialDateFunc();
      }
    }
  });
}

/**
 * Inicializa Tooltips do Bootstrap
 */
function initTooltips() {
  var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });
}

/**
 * Lógica dos botões de +/- para adicionar dias predefinidos
 */
function setupInputEvents() {

  // Validação de entrada numérica no campo dias
  $("#days").keydown(function (e) {
    // Permite: backspace, delete, tab, escape, enter, ponto, Ctrl+A, setas
    if ($.inArray(e.keyCode, [46, 8, 9, 27, 13, 190]) !== -1 ||
      (e.keyCode == 65 && e.ctrlKey === true) ||
      (e.keyCode >= 35 && e.keyCode <= 39)) {
      return;
    }
    // Bloqueia se não for número
    if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
      e.preventDefault();
    }
  });

  // Controle de estado dos botões +/- baseados nos limites min/max
  $('#days').change(function () {
    const min = parseInt($(this).attr('min')) || 1;
    const max = parseInt($(this).attr('max')) || 999;
    const val = parseInt($(this).val()) || 0;

    $(".btn-number[data-type='minus']").prop('disabled', val <= min);
    $(".btn-number[data-type='plus']").prop('disabled', val >= max);
  });

  // Ação do clique nos botões +/-
  $('.btn-number').click(function (e) {
    e.preventDefault();
    const type = $(this).attr('data-type');
    const input = $("#days");
    let currentVal = parseInt(input.val());

    if (isNaN(currentVal)) currentVal = 0;

    let newVal = currentVal;

    if (type === 'minus') {
      // Encontra o valor padrão anterior ou decrementa 1
      const prevStep = [...STANDARD_DEADLINES].reverse().find(step => step < currentVal);
      newVal = prevStep !== undefined ? prevStep : (currentVal > 1 ? currentVal - 1 : 1);
    } else if (type === 'plus') {
      // Encontra o próximo valor padrão ou incrementa 1
      const nextStep = STANDARD_DEADLINES.find(step => step > currentVal);
      newVal = nextStep !== undefined ? nextStep : currentVal + 1;
    }

    // Respeita limites
    const min = parseInt(input.attr('min')) || 1;
    const max = parseInt(input.attr('max')) || 999;

    if (newVal >= min && newVal <= max) {
      input.val(newVal).trigger('change');
    }
  });
}

/**
 * Configura eventos relacionados ao formulário e navegação
 */
function setupNavigationEvents() {
  // Responsividade do Menu Topo
  window.myFunction = function () { // Função global necessária para o onclick no HTML
    var x = document.getElementById("myTopnav");
    if (x.className.includes("topnav")) {
      x.classList.toggle("responsive");
    }
  };

  // Enter no campo de busca foca em dias
  $(document).on('keydown', 'input[type="search"]', function (e) {
    if (e.which == 13) {
      $('#days').focus();
      $('.selectpicker').selectpicker('toggle');
    }
  });
}

/**
 * Eventos específicos de cálculo e lógica de formulário
 */
function setupCalcEvents() {

  // Mudança no Formato da Contagem (Dias Úteis, Corridos, Meses)
  $('#calcType').change(function () {
    const val = $(this).val();
    const countTypeSelect = $('#countType');
    const daysLabel = $('label[for="days"]');

    if (val === 'months') {
      // Bloqueia seleção de "do ato/da juntada"
      countTypeSelect.prop('disabled', true);
      countTypeSelect.selectpicker('refresh');

      // Altera labels
      $("#countFormatLabel").html('Data da 1ª Parcela');
      daysLabel.text('Número de parcelas');
    } else {
      // Desbloqueia
      countTypeSelect.prop('disabled', false);
      countTypeSelect.selectpicker('refresh');

      // Restaura labels
      updateCountTypeLabel(countTypeSelect);
      daysLabel.text('Dias:');
    }
  });

  // Mudança no Tipo de Contagem (Ex: Citação no Portal muda dias p/ 15 auto)
  $('#countType').change(function () {
    const val = $(this).val();
    const daysInput = document.getElementById('days');

    // Atualiza label com tooltip explicativo
    updateCountTypeLabel($(this));

    // Regra de negócio: Citação Portal (3) sugere 15 dias
    if (val === '3') {
      daysInput.value = 15;
      $(daysInput).trigger('change');
    } else {
      // Opcional: limpar ou manter valor anterior? O original limpava.
      // daysInput.value = ''; 
    }

    // Ajuste responsivo para mobile
    if ($(window).width() < 768) {
      $("#selecteditem").val(val)
        .text($(this).find("option:selected").attr("title"))
        .show();
    }
  });
}

/**
 * Atualiza o texto e tooltip do Label baseado na seleção do Tipo de Contagem
 */
function updateCountTypeLabel(selectElement) {
  const selectedText = selectElement.children("option:selected").text();
  const val = selectElement.val();
  let tooltipText = "";

  switch (val) {
    case "0":
      tooltipText = '<p>A data do ato pode ser a data da <b>juntada do comprovante de intimação</b> nos autos ou a data em que o ato se efetivou.</p>';
      break;
    case "1":
      tooltipText = '<p><b>Atenção:</b> Guie-se pelo <b>dia da disponibilização no DJE</b> (data no cabeçalho do diário).</p>';
      break;
    case "2":
      tooltipText = '<p><b>Atenção:</b> Opte pelo <b>dia útil posterior à data da disponibilização</b> (data da publicação).</p>';
      break;
    case "3":
      tooltipText = "Data da confirmação da citação no portal eletrônico.";
      break;
  }

  $("#countFormatLabel").html(
    `Data ${selectedText}: <i data-bs-toggle='tooltip' data-bs-html='true' data-bs-placement='top' class='fas fa-info-circle fa-sm tooltip-helper' title='${tooltipText}'></i>`
  );

  // Reinicia tooltips para o novo elemento HTML inserido
  initTooltips();
}

/* ==============================================================================================
   AÇÕES: LIMPAR, IMPRIMIR, COPIAR
   ============================================================================================== */
function setupActionButtons() {

  // Botão Limpar
  $('#reset1').click(function (e) {
    e.preventDefault();

    // Esconde resultados
    $('#results').hide();
    $('#collapseReport').collapse('hide');
    $('#collapseCalendar').collapse('hide');

    // Limpa campos
    $('#initialDate').val('');
    $('#days').val('').trigger('change');

    // Limpa máscara
    if (dateMask) {
      dateMask.updateOptions({
        mask: '',
        commit: (value, masked) => { masked._value = ''; }
      });
      dateMask.updateOptions(DATE_MASK_OPTIONS); // Restaura configurações
    }
  });
}

// Função global para Toast (usada nos callbacks de cópia)
window.showToast = function () {
  var toastEl = document.getElementById('liveToast');
  if (toastEl) {
    var toast = new bootstrap.Toast(toastEl);
    toast.show();
  }
};

// Imprimir Relatório
window.printDivs = function () {
  const content = document.getElementById('printResults').innerHTML +
    document.getElementById('listReport').innerHTML;

  const printWindow = window.open('', '', 'height=800,width=1000');

  printWindow.document.write(`
        <html>
            <head>
                <title>Relatório de Prazo</title>
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.1.3/css/bootstrap.min.css">
                <style>
                    body { font-family: sans-serif; padding: 20px; }
                    .table-responsive { width: 100%; overflow: visible; }
                    h3, h2 { text-align: center; }
                    @media print { .no-print { display: none; } }
                </style>
            </head>
            <body onload="window.print(); window.close();">
                ${content}
            </body>
        </html>
    `);
  printWindow.document.close();
};

// Copiar Tudo (Imagem)
window.copyAll = function () {
  captureAndCopy(document.getElementById('printResults').innerHTML + document.getElementById('listReport').innerHTML);
};

// Copiar Apenas Lista (Imagem)
window.copyListReport = function () {
  const element = document.getElementById('listReport');
  html2canvas(element).then(processCanvasToClipboard);
};

// Auxiliar para capturar HTML composto e copiar
function captureAndCopy(htmlContent) {
  const tempContainer = document.createElement('div');
  tempContainer.style.position = 'fixed';
  tempContainer.style.top = '-9999px';
  tempContainer.style.backgroundColor = '#fff'; // Garante fundo branco na imagem
  tempContainer.style.padding = '20px';
  tempContainer.style.width = '800px'; // Largura fixa para boa formatação
  tempContainer.innerHTML = htmlContent;

  document.body.appendChild(tempContainer);

  html2canvas(tempContainer).then(canvas => {
    processCanvasToClipboard(canvas);
    document.body.removeChild(tempContainer);
  });
}

// Auxiliar para processar canvas e jogar no clipboard
function processCanvasToClipboard(canvas) {
  canvas.toBlob(blob => {
    try {
      const item = new ClipboardItem({ 'image/png': blob });
      navigator.clipboard.write([item]).then(() => {
        showToast();
      }).catch(err => {
        console.error('Erro ao copiar:', err);
        alert("Não foi possível copiar automaticamente. Verifique as permissões do navegador.");
      });
    } catch (e) {
      console.error(e);
    }
  });
}

/* ==============================================================================================
   TUTORIAL (INTRO.JS)
   ============================================================================================== */
function startIntroTutorial(dontShowAgain = false) {
  const intro = introJs();

  intro.setOptions({
    nextLabel: 'Próximo',
    prevLabel: 'Voltar',
    doneLabel: 'Concluir',
    dontShowAgain: dontShowAgain,
    dontShowAgainLabel: "Não mostrar novamente",
    showStepNumbers: true,
    steps: [
      {
        intro: "<p><b>JUSCALC - CALCULADORA DE PRAZOS</b></p><p>Bem-vindo ao tutorial rápido.</p>",
      },
      {
        element: '#divCity',
        intro: "<p>Selecione a comarca. Isso carrega os <b>feriados municipais</b> corretos.</p>",
      },
      {
        element: '#divCalcType',
        intro: "Escolha entre dias <b>úteis</b> ou <b>corridos</b>."
      },
      {
        element: '.form3',
        intro: "Aqui você define o marco inicial da contagem (Juntada, DJE, etc)."
      },
      {
        element: '#divInitialDate',
        intro: "Informe a data do ato ou clique no calendário."
      },
      {
        element: '#divDays',
        intro: "Digite o prazo em dias ou use os botões +/- para atalhos."
      },
      {
        element: '#calcBtn',
        intro: "Clique para processar o resultado."
      }
    ]
  });

  // Lógica para abrir dropdowns durante o tutorial se necessário
  intro.onbeforechange(function (targetElement) {
    // Exemplo simplificado: se o passo for sobre o tipo de contagem, tenta focar
    if (targetElement.id === 'countType' || targetElement.classList.contains('form3')) {
      // Apenas garante que está visível, sem lógica complexa de toggle que quebrava
      // $("#countType").selectpicker('show'); 
    }
  });

  intro.start();
}

function handleResponsiveLayout() {
  if ($(window).width() < 768) {
    // Ajustes específicos para mobile se necessário
  }
}