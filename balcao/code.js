var $inputSwitches = $(".inputSwitch"),
  $inputs = $inputSwitches.find("input"),
  $spans = $inputSwitches.find("span");
$spans.on("click", function () {
  var $this = $(this);
  $this.hide().siblings("input").show().focus().select();
}).each(function () {
  var $this = $(this);
  $this.text($this.siblings("input").val());
});
$inputs.on("blur", function () {
  var $this = $(this);
  $this.hide().siblings("span").text($this.val()).show();
}).on('keydown', function (e) {
  if (e.which == 9) {
    e.preventDefault();
    if (e.shiftKey) {
      $(this).blur().parent().prevAll($inputSwitches).first().find($spans).click();
    } else {
      $(this).blur().parent().nextAll($inputSwitches).first().find($spans).click();
    }
  }
}).hide();







//push object via ajax using type=GET, dataType=json, data=obj, url="jsonFile/index.php"



/*

var eventsholded = [];
//push to eventsholded array this "test"

eventsholded.push(obj2);
$.ajax
  ({
    type: "GET",
    dataType: 'json',
    async: false,
    url: 'jsonFile/index.php',
    data: { data: JSON.stringify(eventsholded) },
    success: function () { alert("Thanks!"); },
    failure: function () { alert("Error!"); }
  });
alert(JSON.stringify(eventsholded))
  ;
*/

// file system module to perform file operations




// json data





$("#countType").selectpicker('render');

introJsFunc(true);
//store introJs object in a variable
//var intro = introJs(false, );

//onclick .tutorial-icon, call introJsFunc
$("#tutorial-icon").click(() => {
  introJsFunc(false);
}
);




if ($(window).width() < 768) {


  $("#countType").change(function () {

    //$("#countType option:selected").text($(this).val());

    $("#selecteditem").val($(this).val())


    $("#selecteditem").attr("title", $(this).find(":selected").attr("title"));






    //show the title atribute of the selected option
    //$("#selecteditem").val($(this).find("option:selected"));
    $("#selecteditem").text($("#countType option:selected").text());
    //shot as text the title attribute of the selected option

    $("#selecteditem").text($(this).find("option:selected").attr("title"));

    $("#selecteditem").prop('selected', true);
    $("#selecteditem").show();
  })
}



//show the text of the selected option countType
$("#countType").change(function () {
  $("#selecteditem").text($(this).find("option:selected").attr("title"));
}
);

//toggle countType  ;








//jquery get second option of class "dropdown-menu inner show"
//$(".dropdown-menu.inner.show li:nth-child(2)").text();





var html = '';
function introJsFunc(a, b) {


  var intro = introJs();
  intro.setOptions(

    {
      nextLabel: 'Próximo',
      hidePrev: true,
      prevLabel: 'Voltar',
      nextToDone: true,
      stepNumbersOfLabel: '/',
      showButtons: true,
      scrollToElement: true,
      showStepNumbers: true,
      exitOnOverlayClick: false,

      showBullets: false,
      scrollTo: 'element',
      doneLabel: 'Concluir',


      dontShowAgain: a,
      dontShowAgainLabel: "Não mostrar novamente",

      steps: [
        {
          intro: "<p><b>JUSCALC - CALCULADORA DE PRAZOS</b></p><p>Este é um <b>tutorial</b> de como utilizar esta calculadora de prazos.</p><p> Siga os passos para saber como proceder em cada campo.</p>",
        },
        {
          element: document.querySelector('#divCity'),
          intro: "<p>Selecione a comarca para cálculo.</p><p> É <b>importante</b> selecionar corretamente para que o cálculo considere <b>feriados e suspensões</b> daquela comarca.",
        },
        {
          element: document.querySelector('#divCalcType'),
          intro: "Selecione entre dias <b>úteis</b> ou <b>corridos</b> conforme a forma de contagem para o processo em questão."
        },

        {
          element: document.querySelector('.form3'),
          intro: "<p>Nessa opção são exibidas os tipos de contagem.</p><p> Veja quais são no próximo passo.</p> "
        },
        {
          element: document.querySelector('.form3 :nth-child(3) :nth-child(1)'),
          intro: "<p>Selecione entre <b>'do ato</b>', <b>'da disponibilização no DJE'</b>, ou <b>'da publicação no DJE'</b>.</p><p> Veja mais detalhes no próximo passo.</p>",
        },
        {
          element: document.querySelector('.dropdown-menu :nth-child(1) li:nth-child(2)'),
          intro: "<p>Ao selecionar <b>'do ato'</b>, a contagem será feita com base na data inicial fornecida.</p><p> Selecione essa opção e, no campo de data, informe a data em que o ato de intimação/citação se efetivou (ex: <b>a data da juntada do comprovante de recebimento</b>, a data do <b>recebimento da intimação</b> etc).</p> "
        },
        {
          element: document.querySelector('ul.dropdown-menu.inner.show :nth-child(3)'),
          intro: "<p><b>Atenção:</b> Não confunda a data da <b>disponibilização</b> com a data da publicação no DJE. A forma da contagem escolhida impacta diretamente o prazo final.</p><p>Para essa opção, guie-se pelo <b>dia da disponibilização no DJE</b> (essa data encontra-se no <b>cabeçalho</b> da página do DJE).</p>"
        },
        {
          element: document.querySelector('ul.dropdown-menu.inner.show :nth-child(4)'),
          intro: "<p><b>Atenção:</b> Não confunda a data da disponibilização com a data da publicação no DJE. A forma da contagem escolhida impacta diretamente o prazo final.</p><p>Para essa opção, deve-se optar pelo <b>dia útil posterior à data da disponibilização do DJE</b> (geralmente esta data consta em certidões de publicação nos autos).</p><p> Na dúvida, selecione a opção <b>da disponibilização no DJE</b> acima e informe o dia que consta no cabeçalho do DJE.</p>"
        },
        {
          element: document.querySelector('#divInitialDate'),
          intro: "Informe a <b>data de início</b> da contagem aqui."
        },
        {
          element: document.querySelector('div#button_calendar'),
          intro: "Caso prefira, clique nesse ícone para abrir o calendário e selecione o dia clicando na data desejada.",
          position: 'top'
        },
        {
          element: document.querySelector('#divDays'),
          intro: "<p>Informe o prazo em dias.</p><p>Caso queira, utilize os botões laterais para navegar entre os principais prazos.</p>"
        },
        {
          element: document.querySelector('.tooltip-helper'),
          intro: "<p>Alguns campos possuem esse ícone para auxiliar com informações</p><p>Passe o mouse sobre ele para ver uma pequena ajuda (caso esteja utilizando um dispositivo touch, toque sobre ele por 1 segundo para exibir a ajuda).</p>"
        },
        {
          element: document.querySelector('#calcBtn'),
          intro: "<p>Clique aqui para calcular o prazo.</p><p>O resultado será exibido abaixo.</p>"
        },
        {
          element: document.querySelector('#reset1'),
          intro: "<p>Clicando aqui, você limpa os campos <b>Data</b> e <b>Dias</b> para realizar um novo cálculo. As opções dos demais campos ficam mantidas para a realização de cálculos rapidamente..</p>"
        },

      ],
    }), intro.onbeforechange(function (e) {

      if (this._currentStep == 4) {
        //$("#countType").selectpicker('render');
        if (!$(".form3").find('.dropdown-menu').is(":visible")) {

          $("#countType").selectpicker('toggle');


          $("#countType").on("hidden.bs.select", function (e) {
            $("#countType").selectpicker("toggle");

          });

        } else {
          $("#countType").selectpicker('show');
          $("#countType").on("hidden.bs.select", function (e) {
            $("#countType").selectpicker('toggle');

            $("#countType").selectpicker("toggle");


            //$('.btn').css('display', 'none')


          });


        }


      }

      if (this._currentStep == 5) {
        if (!$(".form3").find('.dropdown-menu').is(":visible")) {

          $("#countType").selectpicker('toggle');


          $("#countType").on("hidden.bs.select", function (e) {
            $("#countType").selectpicker("toggle");

          });

        } else {
          $("#countType").selectpicker('show');
          $("#countType").on("hidden.bs.select", function (e) {
            $("#countType").selectpicker('toggle');

            $("#countType").selectpicker("toggle");


            //$('.btn').css('display', 'none')


          });


        }

      } if (5 >= this._currentStep <= 7) {
        //$("#countType").selectpicker('show');

      }
      if (this._currentStep == 8) {
        //$("#countType").selectpicker('show');
        $("#countType").selectpicker('toggle');


      }






    }),

    intro.onbeforeexit(function () {
      $('#countType').selectpicker('destroy');
      $('#countType').selectpicker('render');


    }/* else {
        $("#countType").on("hidden.bs.select", function (e) {
          $('#countType').selectpicker('refresh');
          $("#countType").selectpicker("toggle");


          //$('.btn').css('display', 'none')


        });
      }*/

    ), intro.onexit(function () {

      if ($('.dropdown').find('.dropdown-menu.show').is(":visible")) {

        $('#countType').selectpicker('destroy');
        $('#countType').selectpicker('render');


      } else {
        $('#countType').selectpicker('destroy');
        $('#countType').selectpicker('render');

      }

    })

    , intro.refresh()
      .start();
}

//jquery alert value from id="#bs-select-2-2"
;

function appendRow(id, input) {
  var html = '<div id="inputFormRow"><div class="input-group mb-3"><input id="' + id + '"type="text" name="title[]" class="form-control m-input" placeholder="Enter title" autocomplete="off"><div class="input-group-append"><button id="removeRow" type="button" class="btn btn-danger">Remove</button></div></div>';
  $('#newRow').append(html);

}
var id = 0
$(document).ready(function () {
  $("#addRow").click(function () {

    appendRow(id++);


  });
});

// remove row
$(document).on('click', '#removeRow', function () {
  $(this).closest('#inputFormRow').remove();
  id--
});

function myFunction() {
  var x = document.getElementById("myTopnav");
  if (x.className === "topnav") {
    x.className += " responsive";
  } else {
    x.className = "topnav";
  }
}


$(document).on('keydown', 'input[type="search"]', function (e) {
  if (e.which == 13) {
    $('#days').focus();
    $('.selectpicker').selectpicker('toggle');
  }
}
);
var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
  return new bootstrap.Tooltip(tooltipTriggerEl)
})



//on click input with class "dropdown bootstrap-select", add class "show" to div class="dropdown-menu"







moment.locale('pt-br');
moment().format("DD/MM/YYYY");

var currentVal = 1

var update = function updateDataformat() {
  dataformat = $("#initialDate").val();

}
var dataformat;

$('#initialDate').on('change', function () {
  dataformat = $('#initialDate').val();
  console.log(dataformat);
});

var mostra,
  simpleStart,
  pegames;

//get variable newValue from initialDateFunc.js
var newValue = $("#initialDate").val();
console.log('here newValue ' + newValue);





$("#button_calendar").calendar({
  type: "date",
  monthFirst: false,
  on: "click",
  centuryBreak: 90,
  currentCentury: 2022,
  today: true,
  closabe: true,

  onSelect: function (date) {
    newValue = moment(date).format("DD/MM/YYYY");
    var div1 = newValue.split(",");
    $("#initialDate").val(div1);
    $("#initialDate").select().val(div1);
    $('#days').focus();

    initialDateFunc()
    //fix:  when inputing direct in the input, the calendar dont auto update

  },


  text: {
    days: ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"],
    months: [
      "Janeiro",
      "Fevereiro",
      "Março",
      "Abril",
      "Maio",
      "Junho",
      "Julho",
      "Agosto",
      "Setembro",
      "Outubro",
      "Novembro",
      "Dezembro"
    ],
    monthsShort: [
      "Jan",
      "Fev",
      "Mar",
      "Abr",
      "Mai",
      "Jun",
      "Jul",
      "Ago",
      "Set",
      "Out",
      "Nov",
      "Dez"
    ],
    today: "Hoje",
    now: "Agora",
    am: "AM",
    pm: "PM"
  },

  pegames: $("#initialDate").val(),
});

console.log('dataformat fora: ' + dataformat);

pegames = $("#initialDate").val();

//onchange the value from the #initialDate, update the value from var newValue


$(document).ready(function () {

  $(function () {
    $(document).on("click", "input[type=tel], input[type=tel]", function () {
      this.select();
    });
  });


});




/*
$('#calcCust').click(function () {
    var initialDate = $('#initialDate').val();
    var finalDate = $('#finalDate').val();
    var caseValue = $('#caseValue').val();
    var sentenceValue = $('#sentenceValue').val();
 
    //get the numbers of caseValue with the last two digits being the decimal
    var caseValueNumber = caseValue.replace(/[^0-9]+/g, '');
    //make the two last digits the decimal
    var caseValueNumberDecimal = caseValueNumber.slice(0, -2) + '.' + caseValueNumber.slice(-2);
    //get the numbers of sentenceValue with the last two digits being the decimal
    var sentenceValueNumber = sentenceValue.replace(/[^0-9]+/g, '');
    //make the two last digits the decimal
    var sentenceValueNumberDecimal = sentenceValueNumber.slice(0, -2) + '.' + sentenceValueNumber.slice(-2);
 
 
 
    alert(` ${initialDate} - ${finalDate},  ${caseValueNumberDecimal} ${sentenceValueNumberDecimal}`);
});*/


//oninput id initialDate change, do some function




//$('#finalDate').val(hoje);})


//clicking button with id reset, hide the result

const form = document.querySelector('#contForm');
const momentFormat = 'DD/MM/YYYY';
var dateInput = document.querySelector('#procNumber');
const cpfInput = document.querySelector('#cpf');

var updateOptions = {
  mask: '0000000-00.0000.8.26.0000',
  lazy: true,  // make placeholder always visible
  placeholderChar: '#',    // defaults to '_'
  autofix: false,  // defaults to `false`, see details

}

mask = IMask(dateInput, updateOptions);

/* on checkbox with id "flexCheckDefault" checked, change the var updateOptions to this
$('#flexCheckDefault').on('change', function () {
  if ($(this).is(':checked')) {
    //clear dateInput
    dateInput.value = '';
    updateOptions = {
      mask: '0000000-00.0000.8.26.0000',
      lazy: false,  // make placeholder always visible
      placeholderChar: '_',    // defaults to '_'
      autofix: false,  // defaults to `false`, see details
    }
    var mask = IMask(dateInput, updateOptions);


  }
  else {
    dateInput.value = '';
    var updateOptions = {

      mask: '0000000-00.0000{.8.26.}\\0{344}',
      lazy: false,  // make placeholder always visible
      placeholderChar: '#',    // defaults to '_'
      autofix: false,  // defaults to `false`, see details

    }
    mask = IMask(dateInput, updateOptions);

  }
});

*///on input with id procNumber change, do some function


//mask.updateValue as input field changes



const updateOptions2 = {
  mask: '000.000.000-00',

  lazy: true,

  autofix: true,  // defaults to `false`, see details




}



const mask2 = IMask(cpfInput, updateOptions2);






$(document).ready(function () {
  document.getElementById('reset1').addEventListener('click', function (e) {
    e.preventDefault();
    // Hide results

    var obj = document.getElementById("results");
    obj.style.display = "none";

    document.querySelector('#results').style.display = 'none !important';
    // Show loader
    //reset all fields but the floatingSelect calcType and countType
    $('#initialDate').val('');
    $('#days').val('');
    $('#collapseReport').collapse('hide');
    $('#collapseCalendar').collapse('hide');

    //document.querySelector('#loading').style.display = 'block';
    // Set timer



  });


})





// Update options "mask" after focused
mask.updateValue()

mask2.updateOptions({

  pattern: '0000000-00.2\\000.8.26.0000',
  lazy: false,

});



///botões
$('.btn-number').click(function (e) {
  e.preventDefault();

  $('.plus').focusin(function () {
    $(this).data('oldValue', $(this).val());
  });


  fieldName = $(this).attr('data-field');
  type = $(this).attr('data-type');
  var input = $("#days");
  if (input.val() == '') {
    currentVal = 0;
  } else {
    currentVal = parseInt(input.val());
  }

  console.log(currentVal)
  if (!isNaN(currentVal)) {
    if (type == 'minus') {

      if (parseInt(input.val()) == input.attr('min') || input.val() == '' || input.val() == '0' || input.val() == null) {
        $(this).attr('disabled', true);
        console.log('disabled');
      } else if (currentVal >= input.attr('min') && currentVal <= 2) {
        input.val(1);
      } else if (currentVal <= 3) {
        input.val(2);

      }

      else if (currentVal <= 5) {
        input.val(3);

      }
      else if (currentVal <= 10) {
        input.val(5);
      }
      else if (currentVal <= 15) {
        input.val(10);
      }
      else if (currentVal <= 30) {
        input.val(15);

      }
      else if (currentVal > 30) {
        input.val(30);


      }
    } else if (type == 'plus') {


      switch (currentVal) {
        case null: { input.val(1).change(); break; }
        case 0: { input.val(1).change(); break; }
        case NaN: { input.val(1).change(); break; }
        case 1: { input.val(2).change(); break; }
        case 2: { input.val(3).change(); break; }
        case 3: { input.val(5).change(); break; }
        case 5: { input.val(10).change(); break; }
        case 10: { input.val(15).change(); break; }
        case 15: { input.val(30).change(); break; }
        case 30: { input.val(60).change(); break; }
        case 60: { input.val(90).change(); break; }
        case 90: { input.val(180).change(); break; }
        case 180: { input.val(365).change(); break; }

        default: { input.val(currentVal + 1).change(); break; }
      }



      if (parseInt(input.val()) == input.attr('max')) {
        $(this).attr('disabled', true);
      }

    }
  } else {
    input.val(0);
  }
});
$('.plus').focusin(function () {
  $('#days').data('oldValue', $('#days').val());
});
$('#days').change(function () {

  minValue = parseInt($(this).attr('min'));
  maxValue = parseInt($(this).attr('max'));
  valueCurrent = parseInt($(this).val());

  name = $(this).attr('name');
  if (valueCurrent >= minValue) {
    $(".btn-number[data-type='minus']").removeAttr('disabled')
  } else {

    $(this).val($(this).data('oldValue'));
  }
  if (valueCurrent <= maxValue) {
    $(".btn-number[data-type='plus'][data-field='" + name + "']").removeAttr('disabled')
  } else {

    $(this).val($(this).data('oldValue'));
  }


});
$("#days").keydown(function (e) {
  // Allow: backspace, delete, tab, escape, enter and .
  if ($.inArray(e.keyCode, [46, 8, 9, 27, 13, 190]) !== -1 ||
    // Allow: Ctrl+A
    (e.keyCode == 65 && e.ctrlKey === true) ||
    // Allow: home, end, left, right
    (e.keyCode >= 35 && e.keyCode <= 39)) {
    // let it happen, don't do anything
    return;
  }
  // Ensure that it is a number and stop the keypress
  if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
    e.preventDefault();
  }
});

//on document ready

//on form submit #calcBtn scroll to #finalDate div





//get the text from selected option from countType and show it as label for initialDate
$(document).ready(function () {
  $("#countType").change(function () {
    var selected = $(this).children("option:selected").text();

    //$("[aria-owns=bs-select-2]:nth-child(2)").text(newText);
    //get the value from selected option
    var tooltip;
    //case the selected option value is 0, create a var for tooltip
    if ($(this).val() == "0") {
      tooltip = '<p>A data do ato pode ser a data da <b>juntada do comprovante de intimação</b> nos autos, a data do <b>recebimento da intimação</b> (quando aplicável; ex: ações do JEC) ou mesmo a data em que o ato se efetivou para o início da contagem do prazo (por exemplo, a data da publicação no DJE).</p>';
    }
    //case the selected option value is 1, create a var for tooltip
    else if ($(this).val() == "1") {
      tooltip = '<p><b>Atenção:</b> Não confunda a data da disponibilização com a data da publicação no DJE. A forma da contagem escolhida impacta diretamente o prazo final.</p><p>Para essa opção, guie-se pelo <b>dia da disponibilização no DJE</b> (essa data encontra-se no <b>cabeçalho</b> da página do DJE).</p>';
    }
    //case the selected option value is 2, create a var for tooltip
    else if ($(this).val() == "2") {
      tooltip = "<p><b>Atenção:</b> Não confunda a data da disponibilização com a data da publicação no DJE. A forma da contagem escolhida impacta diretamente o prazo final.</p><p>Para essa opção, deve-se optar pelo <b>dia útil posterior à data da disponibilização do DJE</b> (geralmente esta data consta em certidões de publicação nos autos).</p><p> Na dúvida, selecione a opção <b>da disponibilização no DJE</b> acima e informe o dia que consta no cabeçalho do DJE.</p>";
    }
    //case the selected option value is 3, create a var for tooltip
    else if ($(this).val() == "3") {
      tooltip = "Intimação no Portal";
    }



    //show the selected inside #countFormatLabel but without deleting the previous text and without stacking the text on every change
    $("#countFormatLabel").html("Data " + selected + ": " + "<i data-bs-toggle='tooltip' data-bs-html='true' data-bs-placement='top' class='fas fa-info-circle fa-sm tooltip-helper' aria-hidden='true' title='" + tooltip + "' aria-label='" + tooltip + "' class='fas fa-info-circle fa-sm tooltip-helper'></i>");
    $('[data-bs-toggle="tooltip"]').tooltip();






  });
}
);
