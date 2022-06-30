


$(document).ready(function () {
  var momentFormat = 'DD/MM/YYYY';
  var momentMask = IMask(document.getElementById('initialDate'), {
    mask: Date,
    pattern: momentFormat,
    lazy: false,
    min: new Date(1964, 0, 1),
    max: new Date(moment().year(), moment().month(), moment().date()),
    autofix: true,  // defaults to `false`, see details

    format: function (date) {
      return moment(date).format(momentFormat);
    },
    parse: function (str) {
      return moment(str, momentFormat);
    },

    blocks: {
      YYYY: {
        mask: IMask.MaskedRange,
        from: 1964,
        to: 2030
      },
      MM: {
        mask: IMask.MaskedRange,
        from: 1,
        to: 12
      },
      DD: {
        mask: IMask.MaskedRange,
        from: 1,
        to: 31
      },

    }
  });
})
document.querySelector("#close").addEventListener("click", (event) => {
  document.querySelector(".first").reset();
  event.preventDefault();
});

moment.locale('pt-br');

//ondocumentready




function toggleFinalDate() {
  if (document.getElementById("checkFinalDate").checked == true) {

    $('#finalDate').removeAttr("readonly")
    $('.finalDate').removeAttr("readonly")
    $("#finalDate").prop("disabled", false);
    $(".finalDate").prop("disabled", false);
    $("#finalDate").css({ "pointer-events": "visible" });
    $(".finalDate").css({ "pointer-events": "visible" });
    $("#finalDate").css({ "user-select": "text" });

  }
  else {
    $('#finalDate').attr('readonly', true);
    $('.finalDate').attr('readonly', true);
    $("#finalDate").prop("disabled", true);
    $(".finalDate").prop("disabled", true);
    $("#finalDate").css({ "pointer-events": "none " });
    $(".finalDate").css({ "pointer-events": "none " });
    $(".finalDate").css({ "user-select": "none" });




  }
};

var monthI, yearI, dayI;
var dayI;

var update = function updateDataformat() {
  dataformat = $("#initialDate").val();
}
var dataformat;
console.log('dataformat antes da função: ' + dataformat);

$('#initialDate').on('change', function () {
  update => {
    dataformat = $('#initialDate').val();
    return console.log('o da função: ' + dataformat);
  }
});


console.log('dataformat depois da função: ' + dataformat);

//updateDataformat()



//button2();
//var dataformat;
//var dataformat = document.getElementById("initialDate").value;
//$(".ui.button").click(false);
//$(".ui.button").click(false);
/*function myChange() {
  //  $(".ui.button").click();
  $(" #calendar, #example2").calendar("set date", input2);
  $(" #calendar, #example2").calendar("refresh", null);
}*/
moment.locale("pt-BR");
moment().format("L");
var number = document.getElementById("caseValue");
/*number.onkeydown = function (e) {
    if (
        !(
            (e.keyCode > 95 && e.keyCode < 106) ||
            (e.keyCode > 44 && e.keyCode < 58) ||
            e.keyCode == 9 ||
            e.keyCode == 38 ||
            e.keyCode == 40 ||
            e.keyCode == 8
        )
    ) {
        return false;
    }
};*/

mostra = "";

/*onchange input with id #data, do something
  .on('change', function () {
  $('#data').val(mostra);
  alert( this.value );
  });*/

/*$("#initialDate").on("change", function () {
  $("#initialDate").val(dataformat);
  mostra = dataformat;
});*/
$(function () {
  $(document).on("click", "input[type=tel], input[type=tel]", function () {
    this.select();
  });
});

//se não bugar, tirar isso
/*$(function () {
  $(document).on("click", "input[type=text]", function () {
    this.select();
  });
});*/

$("#caseValue").maskMoney({
  selectAllOnFocus: true,
  thousands: ".",
  decimal: ",",
  allowZero: true,
  prefix: "R$ "
});
$("#sentenceValue").maskMoney({
  selectAllOnFocus: true,
  thousands: ".",
  decimal: ",",
  allowZero: true,
  prefix: "R$ "
});

//configs para mobile
/*var ua = navigator.userAgent;
var isAndroid = /Android/i.test(ua);
var isChrome = /Chrome/i.test(ua);
 
// Fix masking on Chrome for mobile devices
if (isAndroid && isChrome) {
  $(".form-control").attr("type", "tel");
}*/

/*$("#initialDate").on("change", function () {
  $("#initialDate").val = dataformat;
  mostra = dataformat;
});*/
var simpleStart
var pegames;
var newValue;
$("#button_calendar").calendar({
  type: "date",
  monthFirst: false,
  on: "click",
  startCalendar: "",
  centuryBreak: 90,
  endCalendar: $("#finalDate").val(),
  initialDate: mostra,
  minDate: new Date(1964, 9, 1),
  maxDate: new Date(moment().year(), moment().month(), moment().date()),
  currentCentury: 2022,
  today: true,
  closabe: true,

  onSelect: function (date, mode) {
    simpleStart = date
    newValue = moment(date).format("DD/MM/YYYY");
    console.log("newValue = " + newValue);
    var div1 = newValue.split(",");
    //div1 = $("#initialDate").val();
    $(div1).val = newValue;
    //change the value of #calendar to newValue
    $("#initialDate").val(div1);

    //addValue.val = newValue;
    //  console.log("até aqui " + div1.val);
    pegames = div1;
    //console.log("pegames do select " + pegames);
    $("#initialDate").select();
    //document element id initialValue is the id of the input
    initialDateFunc()
    //button2()
    dateI = moment(div1).format('DD')




    // return newValue

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

//

//on document read, do the function bellow


console.log('dataformat fora: ' + dataformat);

pegames = $("#initialDate").val();

//after $("#button_calendar").calendar run, I need the newValue to be in the input
//so I need to run the function myChange()  after the calendar is run







//document.getElementById("initialDate").value() = moment(dataformat).format(  "DD/MM/YYYY");
/*$(" #calendar, #button_calendar").calendar(
  {
    type: "date",
    monthFirst: false,
    on: "click",
    //startCalendar: "",
    centuryBreak: 90,
    //initialDate: mostra,
    currentCentury: 2022,
    today: true,
    closabe: true,
    popupOptions: {
      position: "none"
    }
  },
  "refresh",
  "clear",
  null
);*/

/*$(" #button_calendar").calendar(
  {
    popupOptions: {
      position: "none"
    },
    touchReadonly: false
  },
  "refresh"
);*/

/*$(" #calendar").calendar(
  {
    popupOptions: {
      position: "none"
    },
    touchReadonly: false
  },
  "refresh",
  
);*/
console.log(
  "initialDate fora dos loops " + document.getElementById("initialDate").value
);
/*
function dateFix(date, settings) {
    console.log(date);
    pegames = "";
    var pegames = $("#initialDate").val();
    //moment locale to pt-br
    //clear day, month and year variables
    moment.locale("pt-BR");
    moment().format("L");
 
    //var day should be the 2 first characters of the pegames
    var day = pegames.substring(0, 2);
    //var month should be the 3rd and 4th characters of the pegames
    var month = pegames.substring(3, 5);
    //var year should be the 5th and 6th characters of the pegames
    var year = pegames.substring(6, 8);
 
    var date = new Date();
 
    var day = date.getDate();
    var month = date.getMonth() + 1;
    var year = date.getFullYear();
 
    //monthfix = month
    //if date is null, then use the if below
    if (!date) return moment().format("DD/MM/YYYY");
 
    //if pegames is null, then use the if below
 
    var numero = $("#initialDate").val();
    var numerotam = numero.toString().length;
    if (numero.toString().length < 7) {
        date.setYear(moment().year());
        var year = moment().format("YYYY");
 
        //var month = moment().format('MM');
    }
    if (numero.toString().length < 3) {
        //var year = moment().format('YYYY');
        date.setMonth(moment().month());
        var month = moment().format("MM");
    }
    //var day = pegames.substring(0, 2);
    //var month = pegames.substring(3, 5);
    //var year = pegames.substring(6, 10);
    var monthfix = month;
 
    var datacomp = moment(day + "/" + monthfix + "/" + year, "DD/MM/YYYY");
    //  date = moment(day + '/' + monthfix + '/' + year, 'DD/MM/YYYY')
 
    console.log("olhe aqui: " + day + "/" + monthfix + "/" + year, "DD/MM/YYYY");
    dataformat = datacomp.format("DD/MM/YYYY");
    console.log("month: " + month);
    $("#initialDate").on("change", function () {
        // 2nd (A)
        $("#initialDate").val(dataformat);
 
        // It will specifically called on change of your element
    });
 
    var datacomp = moment(day + "/" + monthfix + "/" + year, "DD/MM/YYYY");
    date = moment(day + "/" + monthfix + "/" + year, "DD/MM/YYYY");
 
    console.log("olhe aqui: " + day + "/" + monthfix + "/" + year, "DD/MM/YYYY");
    dataformat = datacomp.format("DD/MM/YYYY");
    console.log("month: " + month);
    console.log("year: " + year);
    console.log("data cod: " + datacomp.format("DD/MM/YYYY"));
    diaAto = dataformat;
    $("#initialDate").on("change", function () {
        // 2nd (A)
        $("#initialDate").val(dataformat);
 
        // It will specifically called on change of your element
    });
 
    $("#initialDate").on("5");
 
    date = dataformat;
    console.log("shown: " + mostra);
    console.log("dataformat: " + dataformat);
    console.log("valor do date pre: " + date);
 
    console.log("date final :" + date);
    date1 = date.value;
    return dataformat;
 
    // return day + '/' + month + '/' + year
 
    //clear pegames
    pegames = "";
}
 
function focusNext() {
    $("#initialDate").select();
}
 
function handleChange() {
    dateFix();
    focusNext();
}*/

/*function mychange() {
  //$(' #calendar, #example2').calendar('set date', input2)
  $(" #calendar, #example2").calendar("refresh", null);
}*/
//get the value from

//$(' #calendar, #example2').calendar('get date', document.getElementById('calendar').value);

$(document).ready(function () {
  //codigo para completar ano
  /*
  $(function () {
    $('#example2').change(function () {
      $('#log').val(this.value);
    });
    $('#days').click(function () {
      $(this).select();
    });
  });*/

  //$("#calendar").onChange(function () {
  //  $("#example2").val($(this).val());
  // });
  $(".date").mask("00/00/0000", { placeholder: "__/__/____" });
  $(".time").mask("00:00:00");
  $(".date_time").mask("00/00/0000 00:00:00");
  $(".cep").mask("00000-000");
  $(".phone").mask("0000-0000");
  $(".phone_with_ddd").mask("(00) 0000-0000");
  $(".phone_us").mask("(000) 000-0000");
  $(".mixed").mask("AAA 000-S0S");
  $(".cpf").mask("000.000.000-00", { reverse: true });
  $(".cnpj").mask("00.000.000/0000-00", { reverse: true });
  $(".money").mask("000.000.000.000.000,00", {
    reverse: true,
    selectOnFocus: true
  });
  $(".money2").mask("#.##0,00", { reverse: true });
  $(".ip_address").mask("0ZZ.0ZZ.0ZZ.0ZZ", {
    translation: {
      Z: {
        pattern: /[0-9]/,
        optional: true
      }
    }
  });
  $(".ip_address").mask("099.099.099.099");
  $(".percent").mask("##0,00%", { reverse: true });
  $(".clear-if-not-match").mask("00/00/0000", { clearIfNotMatch: true });
  $(".placeholder").mask("00/00/0000", { placeholder: "__/__/____" });
  $(".example123").mask("00/00/####", {
    translation: {
      "": {
        pattern: /[\/]/,
        fallback: "2021"
      },
      placeholder: "__/__/____"
    }
  });


});

$("#name").prop("readonly", false);

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



let hoje = moment().format('DD/MM/YYYY');
//$('#finalDate').val(hoje);})
caseValueUpdatedCurrency
$(".resultCaseValueUpdated").html(caseValueUpdatedCurrency)
