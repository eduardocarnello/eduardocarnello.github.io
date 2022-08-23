moment.locale('pt-br');
var chosenCity = 0




/*
const LoadData = async () => {
    try {
        const url = 'https://cors-anywhere.herokuapp.com/https://www.tjsp.jus.br/CanaisComunicacao/Feriados/PesquisarSuspensoes?nomeMunicipio=Mar%C3%ADlia&codigoMunicipio=6830&ano=2022'

        const res = await fetch(url, {
            method: 'GET', // *GET, POST, PUT, DELETE, etc.
            mode: 'cors', // no-cors, *cors, same-origin
            cache: 'no-cache'
        });
        var data = []
        data = res.json();
        console.log(data);
        return data;
    } catch (err) {
        console.error(err)
    }
};

LoadData().then((data) => { console.log(data) })
*/





$(document).ready(function () {
    // Toggle menu on click
    //onclick #menu-toggler and screen width < 768px, add overflow: hidden to body

    //show the text inside span.link on console








    $("#menu-toggler").click(function () {
        toggleBodyClass("menu-active");
        $('body').toggleClass('overflow-hidden');
    });

    function toggleBodyClass(className) {
        document.body.classList.toggle(className);
    }

});


const calcType = 'workingDays'
const initialDate = moment()
var currentYear = 1900
var expectedFinalYear = 2099
const days = 1

var { estado, stateHolidays, cityHolidays, nationalHolidays } = holidaysFunc(currentYear, expectedFinalYear, Easter);








var estado = 'SP'
//if var estado == 'SP', then concatenate the SP array into the holidays. Else, concatenate the RJ array.











//create an array with municipalities and their respective holidays



//get all the dates of christmas for every year from the current year to the next year

//get element with class ".next.link" and show it on console
function showNext() {
    var next = document.getElementsByClassName("next.link")[0];
    console.log(next);
}



//merge nationalHolidays, marilia and SPHolidays arrays
var myHolidays = nationalHolidays.concat(cityHolidays, stateHolidays, amendment, sistDown);

console.log(myHolidays);

//check if a date is a holiday and return its description
function holidayName(date) {
    var holiday = myHolidays.find(function (holiday) {
        return holiday.holidayDate === date;
    });
    return holiday ? `${holiday.description} - ${holiday.state}` : false;
}






holidays = moment.updateLocale('pt-br', {
    format: 'DD/MM/YYYY',
    holidays: myHolidays.map(i => i.holidayDate),
    holidayFormat: 'DD/MM/YYYY',


});

var el = myHolidays.find(h => h.holidayDate.includes("17/06"));
console.log(el)

// check if the date is a holiday, then return its date and name
/*function checkHoliday(date) {
    var holiday = holidays.isHoliday(date);
    if (holiday) {
        console.log(holiday.date + ' - ' + holiday.name);
        return holiday.date + ' - ' + holiday.name;
 
    } else {
        return false;
    }
}
checkHoliday(moment().format());*/




//create an array with the holidays dates and name
//var holidays = [
//    {
//        date: '01/01/2020',
//        name: 'Ano Novo'
//    },
//    {
//        date: '01/04/2020',
//        name: 'Aniversário de Marília'
//    },
//    {
//        date: '21/04/2020',
//        name: 'Tiradentes'
//    },
//    {
//        date: '01/05/2020',
//        name: 'Dia do Trabalho'
//    },
//    {
//        date: '25/05/2020',
//        name: 'Revolução Constitucionalista'
//    },
//    {
//        date: '11/07/2020',
//        name: 'Padroeiro de Marília'
//    }
//];

//check if the date is a holiday, then return its date and name
// Calculate date
/*  if (initialDate.isBusinessDay() == true) {
      dateForCalc = initialDate
      console.log('deu true')
  } else {
      dateForCalc = moment(initialDate).businessAdd(1)
      console.log('deu false')
  }*/







/*Vai verificar se a data inicial é um dia útil
* isso e importante para que a contagem de prazo considere corretamente os dias
*/


//make a list that display every day between the initial date and the due date and inform if it is weekend or a workday
var listaDias = []
var i = 0
var isWorkingDay
var w = 0;
var currentDayList
moment
moment.defaultFormat = "DD/MM/YYYY"



//check if a date is a downDate and return its description
function downDateDescription(date) {
    var down = sistDown.find(function (down) {
        return down.downDate;
    });
    return down ? down.description : false;
}









//check if the dueDate is not a businessDay or is a downDate then create an array prorrogationList that contains the days that are not businessDays and theirs respective descriptions (eg: weekend, Easter, etc)
var prorrogationList = []






//while the dueDate is not a working day, add 1 day to the dueDate
//check if the dueDate is a downDate and add 1 day to the dueDate









//show the first downDate from sistDown






// make a array of objects with the date and the type of day
var listaDiasComTipo = []
for (var i = 0; i < listaDias.length; i++) {
    var currentDay = listaDias[i]
    var currentDayTypeSusp = false;
    var type;
    if (calcType == 'workingDays') {
        var currentDayType = moment(currentDay, 'DD/MM/YYYY').isBusinessDay()
    }
    else {
        var currentDayType = true
    }

    //create a var type of day and check if it is the initial date, the due date, a holiday, a downDate, a weekend or a workday
    typeOfDay();


    console.log(currentDay + ' ' + currentDayType)



    console.log(dueDate.format())




    if (calcType == 'workingDays') {
        if (currentDayType = moment(currentDay, 'DD/MM/YYYY').isBusinessDay() && currentDay != moment(dateForCalc, 'DD/MM/YYYY').format('DD/MM/YYYY') && (currentDayTypeSusp == false)) {





            w++
        }
    }
    else {
        if (currentDayType = true && currentDay != moment(dateForCalc, 'DD/MM/YYYY').format('DD/MM/YYYY')) {
            if (w < days)
                w++
        } else {
            w
        }
    }




    console.log(currentDayTypeSusp)

    // listaDiasComTipo first must display the date with a string 'Primeiro dia da contagem'


    console.log(moment(currentDay, 'DD/MM/YYYY').format('DD/MM/YYYY') + ' é ' + currentDayType)
    listaDiasComTipo.push({
        //if currentDayType is different from the first day of the list and is a workday, then index: w, else index: '-'
        index: (calcType == 'workingDays') ? (currentDayType == true && currentDayTypeSusp == false && currentDay != moment(dateForCalc, 'DD/MM/YYYY').format('DD/MM/YYYY')) ? '<b> ' + w + '</b> ' : (currentDayType == true && currentDayTypeSusp == false && currentDay != moment(dateForCalc, 'DD/MM/YYYY').format('DD/MM/YYYY')) ? '<b> ' + w + '</b> ' : ' - ' : (w <= days && currentDayType == true && currentDayTypeSusp == false && currentDay != moment(dateForCalc, 'DD/MM/YYYY').format('DD/MM/YYYY')) ? (w == days && !moment(currentDay, 'DD/MM/YYYY').isBusinessDay()) ? ' - ' : w : ' - ',
        date: currentDay,
        isWeekDay: moment(currentDay, 'DD/MM/YYYY').isBusinessDay() && currentDay != moment(dateForCalc, 'DD/MM/YYYY').format('DD/MM/YYYY') && (currentDayTypeSusp == false),
        typeofDay: type,
        _type: currentDayTypeSusp == true || currentDayTypeSusp == false ? `Prorrogação de prazo: ${downDateDescription(moment(currentDay, 'DD/MM/YYYY').format('DD/MM/YYYY'))}` : currentDay == moment(dateForCalc, 'DD/MM/YYYY').format('DD/MM/YYYY') ? 'Dia do ato (não conta)' : currentDayType == "Prazo" ? 'test' : currentDayType == "Dia Útil" ? moment(currentDay, 'DD/MM/YYYY').locale('pt-br').format('dddd') : holidayName(moment(currentDay, 'DD/MM/YYYY').format('DD/MM/YYYY')) ? holidayName(moment(currentDay, 'DD/MM/YYYY').format('DD/MM/YYYY')) : currentDay == dueDate.format() ? moment(currentDay, 'DD/MM/YYYY').locale('pt-br').format('dddd') + ' (Fim do Prazo)' : moment(currentDay, 'DD/MM/YYYY').locale('pt-br').format('dddd')
        ,



    })
}





//check if listacomtipo item _type is a weekend or holiday


//// código para criar tabela. arrumar

var html = "<table class='table table-hover' border='1|1'><thead class='table-light'><tr><th scope='col' class='text-center'>#</th><th scope='col'>Data</th><th scope='col'>Descrição</th></tr></thead>";
for (var i = 0; i < listaDiasComTipo.length; i++) {
    if (i == listaDiasComTipo.length - 1) {
        html += "<b><tr class='table-active'>";
    } else (html += "<tr>");
    if (moment(listaDiasComTipo[i].date, 'DD/MM/YYYY').isBusinessDay() == false) {
        html += "<b><tr class=''>";
    }


    html += "<td class='text-center'>" + listaDiasComTipo[i].index + "</td>";

    html += "<td>" + listaDiasComTipo[i].date + "</td>";
    html += "<td>" + listaDiasComTipo[i]._type + "</td>";

    html += "</tr></b>";

}
html += "</table>";


document.getElementById("listReport").innerHTML = html;

//sort myHolidays holidayDate by ascending order
myHolidays.sort(function (a, b) {
    return moment(a.holidayDate, 'DD/MM/YYYY').diff(moment(b.holidayDate, 'DD/MM/YYYY'), 'days');
}
);
//remove blank items from myHolidays
myHolidays = myHolidays.filter(function (holiday) {
    return holiday.holidayDate != '';
}
);



//create a list of holidays


//create a array of objects with the date and the type of day




//create a table with the all the holidays dates and descriptions
var html = "<table class='table table-hover' border='1|1'><thead class='table-light'><tr><th scope='col' class='text-center'>#</th><th scope='col'>Data</th></tr></thead>";
for (var i = 0; i < myHolidays.length; i++) {
    html += "<tr>";

    html += "<td>" + myHolidays[i].holidayDate + "</td>";
    html += "<td>" + myHolidays[i].description + "</td>";
    html += "</tr>";
}
html += "</table>";
//sort the holidays by date

//display an inline calendar from semantic ui with the holidays

//make the eventDates use the myHolidays array


//change item name holidayDate from myHolidays to date


//create an array called eventDates with the holidays dates and their descriptions. Also convert the date to a Date object
var eventDates = [];
for (var i = 0; i < myHolidays.length; i++) {
    //show all the holidays that have no city and those that city='Marília'
    if (chosenCity == 0) {
        eventDates.push({
            date: moment(myHolidays[i].holidayDate, 'DD/MM/YYYY').toDate(),
            message: myHolidays[i].city != undefined ? `${myHolidays[i].description}  - ${myHolidays[i].city}` : `${myHolidays[i].description}`,

        });
    } else if (myHolidays[i].city == undefined || myHolidays[i].city == chosenCity) {
        eventDates.push({
            date: moment(myHolidays[i].holidayDate, 'DD/MM/YYYY').toDate(),
            message: myHolidays[i].state != undefined ? `${myHolidays[i].description} - ${myHolidays[i].state}` : `${myHolidays[i].description}`,

        });
    }
}

//get all the dates from sistDown array and push them to eventDates only if city is Marília

for (var i = 0; i < sistDown.length; i++) {
    //push only if city is Marília
    if (chosenCity == 0) {
        eventDates.push({
            date: moment(sistDown[i].downDate, 'DD/MM/YYYY').toDate(),
            //message: `${sistDown[i].description}`,
            message: sistDown[i].city == undefined ? `${sistDown[i].description}` : `${sistDown[i].description} - ${sistDown[i].city}`,
            class: 'susp'
        });

    } else if (sistDown[i].city == undefined || sistDown[i].city == chosenCity) {
        eventDates.push({
            date: moment(sistDown[i].downDate, 'DD/MM/YYYY').toDate(),
            //message: `${sistDown[i].description}`,
            message: sistDown[i].city == undefined ? `${sistDown[i].description}` : `${sistDown[i].description} - ${sistDown[i].city}`,
            class: 'susp'
        });
    }
}
//jquery onchange #chosenCity value, do the following
$('select').on('change', function () {

    var chosenCity = $('#chosenCity').val();
    var eventDates = [];
    //render $('#consultInline')
    $('#consultInline').empty();





    for (var i = 0; i < myHolidays.length; i++) {
        //show all the holidays that have no city and those that city='Marília'
        if (chosenCity == 0) {
            eventDates.push({
                date: moment(myHolidays[i].holidayDate, 'DD/MM/YYYY').toDate(),
                message: myHolidays[i].city != undefined ? `${myHolidays[i].description}  - ${myHolidays[i].city}` : `${myHolidays[i].description}`,


            });
        } else if (myHolidays[i].city == undefined || myHolidays[i].city == chosenCity) {
            eventDates.push({
                date: moment(myHolidays[i].holidayDate, 'DD/MM/YYYY').toDate(),
                message: myHolidays[i].city != undefined ? `${myHolidays[i].description}  - ${myHolidays[i].city}` : `${myHolidays[i].description}`,


            });
        }
    }

    //get all the dates from sistDown array and push them to eventDates only if city is Marília

    for (var i = 0; i < sistDown.length; i++) {
        //push only if city is Marília
        if (chosenCity == 0) {
            eventDates.push({
                date: moment(sistDown[i].downDate, 'DD/MM/YYYY').toDate(),
                //message: `${sistDown[i].description}`,
                message: sistDown[i].city == undefined ? `${sistDown[i].description} - ${sistDown[i].city}` : `${sistDown[i].description} `,
                class: 'susp'
            });

        } else if (sistDown[i].city == undefined || sistDown[i].city == chosenCity) {
            eventDates.push({
                date: moment(sistDown[i].downDate, 'DD/MM/YYYY').toDate(),
                //message: `${sistDown[i].description}`,
                message: sistDown[i].city == undefined ? `${sistDown[i].description}` : `${sistDown[i].description} - ${sistDown[i].city}`,
                class: 'susp'
            });
        }
    }

    //onclick span.next.link, do the following



    function consultInline() {

        $('#consultInline').calendar({
            refresh: false,


            type: 'date',
            eventClass: 'darkred',
            //eventsDates should return the array of holidays
            //eventDates should be a function that get the dates of the holidays
            eventDates: eventDates,
            onBeforeChange: function (newDate) {
                var oldDate = $(this).calendar('get focusDate');
                if (!oldDate || oldDate.getFullYear() != newDate.getFullYear()) {
                    console.log('Year has changed!');
                }
            },
            //need to show on console when displayed month is changed





            //use the myHolidays array to create a list of events




            text: {
                days: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
                months: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
                monthsShort: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
                today: 'Hoje',
                now: 'Agora',
                am: 'AM',
                pm: 'PM'
            },


        });


    }
    consultInline()
});


console.log(listaDiasComTipo)
//create an array with all the dates of the listaDiasComTipo with the type of day
var daysList = [];
if (calcType == 'workingDays') {
    for (var i = 0; i < listaDiasComTipo.length; i++) {
        daysList.push({
            date: moment(listaDiasComTipo[i].date, 'DD/MM/YYYY').toDate(),
            message: (listaDiasComTipo[i].isWeekDay == true && listaDiasComTipo[i]._type.includes('Fim do Prazo') == false) || (listaDiasComTipo[i]._type == "sábado" || listaDiasComTipo[i]._type == "domingo") ? '' : listaDiasComTipo[i]._type,
            class: listaDiasComTipo[i]._type == 'Feriado' ? 'green' : listaDiasComTipo[i]._type == "Dia do ato (não conta)" ? "start" : listaDiasComTipo[i]._type.includes('Prorrogação de prazo') ? "susp" : listaDiasComTipo[i]._type.includes('Fim do Prazo') ? "end" : listaDiasComTipo[i].isWeekDay == true ? "blue" : 'red',
        });
    }
} else {
    for (var i = 0; i < listaDiasComTipo.length; i++) {
        daysList.push({
            date: moment(listaDiasComTipo[i].date, 'DD/MM/YYYY').toDate(),
            message: (listaDiasComTipo[i].isWeekDay == true && listaDiasComTipo[i]._type.includes('Fim do Prazo') == false) || (listaDiasComTipo[i]._type == "sábado" || listaDiasComTipo[i]._type == "domingo") ? '' : listaDiasComTipo[i]._type,
            class: listaDiasComTipo[i]._type == "Dia do ato (não conta)" ? "start" : listaDiasComTipo[i]._type.includes('Indisponibilidade') ? "susp" : listaDiasComTipo[i]._type.includes('Fim do Prazo') ? "end" : (i > days) ? listaDiasComTipo[i].typeofDay == 'Feriado' ? 'red' : 'susp' : 'blue',
        });
    }
}


//concatenate the two arrays








var holidaysDate = myHolidays.map(function (item) {
    return new Date(moment(item.holidayDate, 'DD/MM/YYYY').format('YYYY-M-D'));
}
);




//use the myHolidays array to create a list of events
var events = [
    { date: new Date(moment().format('YYYY-M-DD')), message: 'hi' }]






// into the 


function consultInline() {

    $('#consultInline').calendar({
        refresh: true,

        //make the initialDate be the first day of the current year being displayed
        type: 'date',
        eventClass: 'darkred',

        //eventsDates should return the array of holidays
        //eventDates should be a function that get the dates of the holidays
        eventDates: eventDates,




        //use the myHolidays array to create a list of events




        text: {
            days: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
            months: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
            monthsShort: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
            today: 'Hoje',
            now: 'Agora',
            am: 'AM',
            pm: 'PM'
        },

    });

}
consultInline()


//LISTA DE FERIADOS - ARRUMAR PARA MOSTRAR APENAS ANO DO CALENDÁRIO
/*var html = "<table class='table table-hover' border='1|1'><thead class='table-light'><tr><th scope='col' class='text-center'>#</th><th scope='col'>Data</th></tr></thead>";
for (var i = 0; i < eventDates.length; i++) {
    html += "<tr>";

    html += "<td>" + moment(eventDates[i].date).format() + "</td>";
    html += "<td>" + eventDates[i].message + "</td>";
    html += "</tr>";
}
html += "</table>";*/


$('[data-tooltip="Indisponibilidade no Saj"]').css('background-color', '#fffded !important');

//






function typeOfDay() {
    if (currentDay == initialDate.format()) {
        currentDayType = 'Início do Prazo';
        type = 'Início do Prazo';
    }
    else if (currentDay == dueDate.format()) {
        currentDayType = 'Fim do Prazo';
        type = 'Fim do Prazo';
    }
    else if (moment(currentDay, 'DD/MM/YYYY').isHoliday()) {
        currentDayType = 'Feriado';
        type = 'Feriado';
    }
    else if (sistDown.find(function (down) {
        return down.downDate;
    }
    )) {
        //é uma suspensão
        currentDayTypeSusp = true;
        currentDayType = "Indisponibilidade";
        type = "Indisponibilidade";
    }

    else if (moment(currentDay, 'DD/MM/YYYY').isBusinessDay() == false) {
        currentDayType = 'Fim de Semana';
        type = 'Fim de Semana';
    }
    else {
        currentDayType = 'Dia Útil';
        type = 'Dia Útil';
    }
}



// Clear error
function clearError() {
    document.querySelector('.alert').remove();
}
function calcDate() {


    //ondocumentready




    //$('#calcDate').click(() => {





    //var resultModal = new bootstrap.Modal(document.getElementById('exampleModal'))

    //declare variables, getting the values from the inputs

    //const contForm = $('#contForm').va();

    //const workDay = $('#workDay').val();,
    var
        primeiroDiaContagem,
        diaAto = moment('01/07/2022', 'DD/MM/YYYY'),
        prazoPessoal,
        dataFinal,
        prazoDJE,
        mostrar,
        i = 0,
        suspInicio = [],
        suspFinal = [],
        currentYear,
        RevolucaoConst;



    //Lista de Feriados cujo cálculo depende da Páscoa


    // Verifica se houve indisponibilidade de peticionamento no dia final e, enquanto for uma data com indisponibilidade, prorroga o prazo final para o primeiro dia útil subsequente
    //while (indisponibilidades.hasOwnProperty(dataFinal.format())) {
    //dataFinal = dataFinal.nextBusinessDay()
    //}

    //onclick button type reset, do this





}
