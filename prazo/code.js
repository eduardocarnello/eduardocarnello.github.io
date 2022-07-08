
moment.locale('pt-br');


//onclick button with class "reset", hide the div results











//var monthI, yearI, dayI;
//var dayI;

var update = function updateDataformat() {
  dataformat = $("#initialDate").val();

}
var dataformat;

$('#initialDate').on('change', function () {
  update => {
    dataformat = $('#initialDate').val();
    return console.log('o da função: ' + dataformat);
  }
});


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

  centuryBreak: 90,




  currentCentury: 2022,
  today: true,
  closabe: true,

  onSelect: function (date, mode) {
    simpleStart = date
    newValue = moment(date).format("DD/MM/YYYY");
    console.log("newValue = " + newValue);
    var div1 = newValue.split(",");
    //div1 = $("#initialDate").val();
    //   $(div1).val = newValue;
    //change the value of #calendar to newValue
    $("#initialDate").val(div1);

    //addValue.val = newValue;
    //  console.log("até aqui " + div1.val);
    pegames = div1;
    //console.log("pegames do select " + pegames);
    $("#initialDate").select().val(div1);
    //document element id initialValue is the id of the input
    initialDateFunc()
    //button2()
    //dateI = moment(div1).format('DD')




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
const dateInput = document.querySelector('#initialDate');

const updateOptions = {
  mask: Date,
  pattern: momentFormat,
  lazy: true,

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
      from: 0001,
      to: 2050
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
}


const mask = IMask(dateInput, updateOptions);





$(document).ready(function () {
  document.getElementById('reset1').addEventListener('click', function (e) {
    e.preventDefault();
    // Hide results

    var obj = document.getElementById("results");
    obj.style.display = "none";

    document.querySelector('#results').style.display = 'none !important';
    // Show loader
    document.getElementById('deadlineCalc').reset();
    //document.querySelector('#loading').style.display = 'block';
    // Set timer
    document.getElementById('initialDate').value = '';
    mask.updateOptions({
      mask: '',
      commit: (value, masked) => {
        value = '';
        masked._value = '';
      },
    });
    dateInput.blur();

  });


})




dateInput.addEventListener('focus', () => {
  // Update options "mask" after focused
  mask.updateOptions({
    mask: Date,
    pattern: momentFormat,
    lazy: true,

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
        from: 0001,
        to: 2050
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
});


///botões
$('.btn-number').click(function (e) {
  e.preventDefault();

  fieldName = $(this).attr('data-field');
  type = $(this).attr('data-type');
  var input = $("#days");
  var currentVal = parseInt(input.val());
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
$('#days').focusin(function () {
  $(this).data('oldValue', $(this).val());
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