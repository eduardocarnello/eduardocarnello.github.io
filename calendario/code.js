
var html = '';
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

  closabe: false,

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
  $('span.next.link').click(function () {
    console.log('hi')
  })

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
