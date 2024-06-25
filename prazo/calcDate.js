
moment.locale('pt-br');
moment.updateLocale('pt-br', {
    weekdays: [
        "Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"
    ]
});




document.getElementById('deadlineCalc').addEventListener('submit', function (e) {

    e.preventDefault();
    $('#collapseReport').collapse('hide');
    $('#collapseCalendar').collapse('hide');
    // Hide results
    if (document.querySelector('#results').style.display == '' || document.querySelector('#results').style.display == 'none') {
        console.log('yes')

        setTimeout(calculateResults, 500)









        //after the setTimeout, scroll to #finalDate



    } else {

        console.log('no')

        setTimeout(calculateResults, 0);
    }

})
//scroll to #finalDate


$('#calcBtn').click(function (e) {
    $('html,body').animate({
        scrollTop: $("#results").offset().top
    },
        100);

});

function calculateResults() {


    // UI Vars
    let initialDate = moment($('#initialDate').val(), 'DD/MM/YYYY');   //dia do ato
    const days = $('#days').val();                                              //prazo
    let dateForCalc = moment(initialDate, 'DD/MM/YYYY').format('DD/MM/YYYY');
    //  let isCaclWorkDay = false;                                                  //conta por dia útil ou 
    //    let startDay                                                                //dia de início do prazo
    //data final do prazo
    const calcType = $('#calcType').val();
    const calcTypeText = $('#calcType option:selected').text();
    const countType = $('#countType').val();
    const countTypeText = $('#countType option:selected').text();
    const finalDate = document.getElementById('finalDate');                     //input do dia final do prazo
    const printInitialDate = document.getElementById('printInitialDate');       //input do dia inicial do prazo

    const printDays = document.getElementById('printDays');                     //input do dia final do prazo
    const printCountType = document.getElementById('printCountType');           //input do dia final do prazo
    const printCalcType = document.getElementById('printCalcType');             //input do dia final do prazo
    const printCity = document.getElementById('printCity');                     //input do dia final do prazo

    var currentYear = moment(initialDate).year();
    //excpected final year
    const expectedFinalYear = moment(initialDate).businessAdd(days).year();
    console.log(expectedFinalYear);
    const chosenCity = 'Marília'
    //if the initialDate year is less than the dueyear




    var { estado, stateHolidays, cityHolidays, nationalHolidays } = holidaysFunc(currentYear, expectedFinalYear, Easter);











    //if var estado == 'SP', then concatenate the SP array into the holidays. Else, concatenate the RJ array.











    //create an array with municipalities and their respective holidays



    //get all the dates of christmas for every year from the current year to the next year




    //merge nationalHolidays, stateHolidays, amendment into one array
    var myHolidays = nationalHolidays.concat(stateHolidays, amendment);

    //merge the days from cityHolidays that the city is the same as chosenCity into myHolidays
    for (let i = 0; i < cityHolidays.length; i++) {
        if (cityHolidays[i].city == chosenCity) {
            myHolidays = myHolidays.concat(cityHolidays[i]);
        }
    }




    console.log(myHolidays);

    //check if a date is a holiday and return its description
    function holidayName(date) {
        var holiday = myHolidays.find(function (holiday) {
            return holiday.holidayDate === date;
        });
        return holiday ? holiday.description : false;
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




    console.log(initialDate)
    if (countType == '1') {
        var dispDate = moment(dateForCalc, 'DD/MM/YYYY').format('DD/MM/YYYY');
        dateForCalc = moment(dateForCalc, 'DD/MM/YYYY').businessAdd(1);
        console.log('dentro do countType 1')
    }
    console.log(initialDate)


    /*Vai verificar se a data inicial é um dia útil
    * isso e importante para que a contagem de prazo considere corretamente os dias
    */
    if (initialDate.isBusinessDay() == true) {
        diaUtil = initialDate
        console.log("o business day")
    }
    else (initialDate = moment(initialDate).businessAdd(1)) //preciso arrumar isso usando o While //erro aqui e ver com cuidado era initialDate
    var tipoContagem
    // Atribuindo o primeiro dia da contagem com base na opção escolhida
    if (tipoContagem == "DJE") {
        diaUtil = initialDate.businessAdd(1)
        
    }
    //primeiroDiaContagem = diaUtil
    /*Essa parte tem que ser tirada
    // Verifica se o primeiro dia da contagem é um dia que o prazo foi suspenso e joga para o próximo dia útil
    while (indisponibilidades.hasOwnProperty(diaUtil.businessAdd(i).format())) {
    i++,
    primeiroDiaContagem = diaUtil.businessAdd(i),
    suspInicio.push(diaUtil.format())
    }
    */
    console.log(days)

    //make a list that display every day between the initial date and the due date and inform if it is weekend or a workday
    var listaDias = []
    var i = 0
    var isWorkingDay
    var w = 0;
    var currentDayList
    moment
    moment.defaultFormat = "DD/MM/YYYY"
    dateForCalc = moment(dateForCalc, 'DD/MM/YYYY')



    //check if a date is a downDate and return its description
    function downDateDescription(date) {
        var down = sistDown.find(function (down) {
            return down.downDate === date;
        });
        return down ? down.description : false;
    }






    if (calcType == 'workingDays') {


        var originalDueDate = moment(dateForCalc).businessAdd(days)
        var dueDate = moment(dateForCalc).businessAdd(days)

        //while the due date is a downDate, add 1 day to the due date
        while (sistDown.find(function (down) {
            return down.downDate === dueDate.format();
        }
        )) {
            dueDate = moment(dueDate).businessAdd(1)
        }
    } else {
        var originalDueDate = moment(dateForCalc).add(days, 'days')
        var dueDate = moment(dateForCalc).add(days, 'days')
        //check if the dueDate is not a businessDay or is a downDate then create an array prorrogationList that contains the days that are not businessDays and theirs respective descriptions (eg: weekend, Easter, etc)
        var prorrogationList = []
        while (dueDate.isBusinessDay() == false && dueDate == !sistDown.find(function (down) {
            return down.downDate === dueDate.format();
        }
        )) {
            prorrogationList.push({
                date: dueDate.format(),
                description: holidayName(dueDate.format())
            })
            dueDate = moment(dueDate).add(1, 'days')
        }




        if (!dueDate.isBusinessDay()) {
            dueDate = moment(dueDate).businessAdd(1)
        }

        //while the dueDate is not a working day, add 1 day to the dueDate
        //check if the dueDate is a downDate and add 1 day to the dueDate




        while (sistDown.find(function (down) {
            return down.downDate === dueDate.format();
        }
        )) {
            dueDate = moment(dueDate).businessAdd(1)
        }

    }




    console.log('DateFor Calc ' + dateForCalc + 'e dueDate ' + dueDate)
    if (dispDate != undefined) {
        j = 1
        while (moment(dispDate, 'DD/MM/YYYY').add(j, 'days') < (moment(dateForCalc))) {
            listaDias.push(moment(dispDate, 'DD/MM/YYYY').add(j, 'days').format())
            currentDayList = moment(dispDate, 'DD/MM/YYYY').add(j, 'days').format()
            j++
        }
    }


    while (moment(dateForCalc).add(i, 'days') <= (dueDate)) {
        listaDias.push(moment(dateForCalc).add(i, 'days').format())
        currentDayList = moment(dateForCalc).add(i, 'days').format()
        i++

    }

    console.log(listaDias)

    //show the first downDate from sistDown






    // make a array of objects with the date and the type of day
    var listaDiasComTipo = []
    if (dispDate != undefined) {
        listaDiasComTipo.push({
            index: '-',
            date: dispDate,
            _type: 'Data da Disponibilização',
            description: 'Data da Disponibilização no DJE',
            //isWeekDay: false,
            class: 'susp'



        }
        )
    }
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
        //if dispDate exists, do something




        console.log(moment(currentDay, 'DD/MM/YYYY').format('DD/MM/YYYY') + ' é ' + currentDayType)
        listaDiasComTipo.push({
            //if currentDayType is different from the first day of the list and is a workday, then index: w, else index: '-'
            index: (calcType == 'workingDays') ? (currentDayType == true && currentDayTypeSusp == false && currentDay != moment(dateForCalc, 'DD/MM/YYYY').format('DD/MM/YYYY')) ? '<b> ' + w + '</b> ' : (currentDayType == true && currentDayTypeSusp == false && currentDay != moment(dateForCalc, 'DD/MM/YYYY').format('DD/MM/YYYY')) ? '<b> ' + w + '</b> ' : ' - ' : (w <= days && currentDayType == true && currentDayTypeSusp == false && currentDay != moment(dateForCalc, 'DD/MM/YYYY').format('DD/MM/YYYY')) ? (w == days && !moment(currentDay, 'DD/MM/YYYY').isBusinessDay()) ? ' - ' : w : ' - ',
            date: currentDay,
            isWeekDay: moment(currentDay, 'DD/MM/YYYY').isBusinessDay() && currentDay != moment(dateForCalc, 'DD/MM/YYYY').format('DD/MM/YYYY') && (currentDayTypeSusp == false),
            typeofDay: type,
            _type: currentDayTypeSusp == true ? `${moment(currentDay, 'DD/MM/YYYY').locale('pt-br').format('dddd')} (Prorrogação de prazo: ${downDateDescription(moment(currentDay, 'DD/MM/YYYY').format('DD/MM/YYYY'))})` : currentDay == moment(dateForCalc, 'DD/MM/YYYY').format('DD/MM/YYYY') ? dispDate != undefined ? 'Data da Publicação no DJE (não conta)' : countType == 2 ? 'Data da Publicação no DJE (não conta)' : 'Dia do ato (não conta)' : currentDayType == "Prazo" ? 'test' : currentDayType == "Dia Útil" ? moment(currentDay, 'DD/MM/YYYY').locale('pt-br').format('dddd') : holidayName(moment(currentDay, 'DD/MM/YYYY').format('DD/MM/YYYY')) ? holidayName(moment(currentDay, 'DD/MM/YYYY').format('DD/MM/YYYY')) : currentDay == dueDate.format() ? moment(currentDay, 'DD/MM/YYYY').locale('pt-br').format('dddd') + ' (Fim do Prazo)' : moment(currentDay, 'DD/MM/YYYY').locale('pt-br').format('dddd')
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

    //sort the holidays by date

    //display an inline calendar from semantic ui with the holidays

    //make the eventDates use the myHolidays array


    //change item name holidayDate from myHolidays to date


    //create an array called eventDates with the holidays dates and their descriptions. Also convert the date to a Date object
    var eventDates = [];
    if (calcType == 'workingDays') {
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
    }

    var html = "<table class='table table-hover' border='1|1'><thead class='table-light'><tr><th scope='col' class='text-center'>#</th><th scope='col'>Data</th></tr></thead>";
    for (var i = 0; i < eventDates.length; i++) {
        html += "<tr>";

        html += "<td>" + moment(eventDates[i].date).format() + "</td>";
        html += "<td>" + eventDates[i].message + "</td>";
        html += "</tr>";
    }
    html += "</table>";

    console.log(listaDiasComTipo)
    //create an array with all the dates of the listaDiasComTipo with the type of day
    var daysList = [];

    if (calcType == 'workingDays') {
        for (var i = 0; i < listaDiasComTipo.length; i++) {
            daysList.push({
                date: moment(listaDiasComTipo[i].date, 'DD/MM/YYYY').toDate(),
                message: (listaDiasComTipo[i].isWeekDay == true && listaDiasComTipo[i]._type.includes('Fim do Prazo') == false) || (listaDiasComTipo[i]._type == "sábado" || listaDiasComTipo[i]._type == "domingo") ? '' : listaDiasComTipo[i]._type,
                class: listaDiasComTipo[i]._type == 'Feriado' ? 'green' : listaDiasComTipo[i]._type.includes('não conta') ? "start" : listaDiasComTipo[i]._type.includes('Prorrogação de prazo') ? "susp" : listaDiasComTipo[i]._type.includes('Fim do Prazo') ? "end" : listaDiasComTipo[i].isWeekDay == true ? "blue" : 'red',
            });
        }
    } else {
        for (var i = 0; i < listaDiasComTipo.length; i++) {
            daysList.push({
                date: moment(listaDiasComTipo[i].date, 'DD/MM/YYYY').toDate(),
                message: (listaDiasComTipo[i].isWeekDay == true && listaDiasComTipo[i]._type.includes('Fim do Prazo') == false) || (listaDiasComTipo[i]._type == "sábado" || listaDiasComTipo[i]._type == "domingo") ? '' : listaDiasComTipo[i]._type,
                class: listaDiasComTipo[i]._type == "Dia do ato (não conta)" ? "start" : listaDiasComTipo[i]._type.includes('Prorrogação de prazo') ? "susp" : listaDiasComTipo[i]._type.includes('Fim do Prazo') ? "end" : (i > days) ? listaDiasComTipo[i].typeofDay == 'Feriado' ? 'red' : 'susp' : 'blue',
            });
        }
    }



    //concatenate the two arrays
    var eventDates = eventDates.concat(daysList);
    console.log(listaDiasComTipo)






    var holidaysDate = myHolidays.map(function (item) {
        return new Date(moment(item.holidayDate, 'DD/MM/YYYY').format('YYYY-M-D'));
    }
    );
    console.log(holidaysDate)



    //use the myHolidays array to create a list of events
    var events = [
        { date: new Date(moment().format('YYYY-M-DD')), message: 'hi' }]

    $('#collapseReport').on('shown.bs.collapse', function () {
        this.scrollIntoView({ behavior: "smooth" });
    });


    $('#collapseCalendar').on('shown.bs.collapse', function () {
        this.scrollIntoView({ behavior: "smooth" });
    });




    // into the 
    function displayInline() {
        //clear the calendar before setting it up
        $('#inlineCalendar').html('');
        $('.link').click(function () { return false; });

        $('#inlineCalendar').calendar({
            refresh: true,
            //minDate: new Date(moment(dateForCalc, 'DD/MM/YYYY').format('MM/DD/YYYY')),
            maxDate: new Date(moment(dueDate, 'DD/MM/YYYY').format('MM/DD/YYYY')),
            type: 'date',
            eventClass: 'darkred',
            //eventsDates should return the array of holidays
            //eventDates should be a function that get the dates of the holidays
            eventDates: eventDates,
            initialDate: dueDate,


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


    $('#consultInline').calendar({
        refresh: true,


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



    displayInline()

    //if element has data-tooltip="Data da Disponibilização", change its background color to blue
    $('[data-tooltip="Data da Disponibilização"]').css('background-color', '#fffded');
    $('[data-tooltip="Data da Disponibilização"]').css('color', 'darkblue');









    //    document.getElementById("table-holidays").innerHTML = html;


    //print a table in id=results with the results of the calculation (chosenCity, initialDate, dueDate, days, caclType, countType)  
    function printResults(chosenCity, initialDate, dueDate, days, caclType, countType) {
        var html = '<table class="table table-bordered table-striped table-hover">';
        html += '<thead><tr><th>Cidade</th><th>Data Inicial</th><th>Data Final</th><th>Dias</th><th>Tipo de Cálculo</th><th>Tipo de Contagem</th></tr></thead>';
        html += '<tbody><tr><td>' + chosenCity + '</td><td>' + initialDate + '</td><td>' + dueDate + '</td><td>' + days + '</td><td>' + caclType + '</td><td>' + countType + '</td></tr></tbody>';
        html += '</table>';
        $('#results').html(html);
    }


    //print a table in id=results with the results of the calculation (chosenCity, initialDate, dueDate, days, caclType, countType)







    var html = '<table class="table  table-bordered table-hover table-condensed">';


    //display the above results in the table with two columns like this, but I need that finalDate be outside the table, first and with h2 tag
    //Dados | Informados pelo Usuário
    html += '<h3 class="text"><b>Prazo:</b>'

    html += '<h2 class="heading display-3 pb-5 text-center py-3" id="finalDate"> ' + moment(dueDate).format("DD/MM/YYYY") + '</h>';
    html += '<h4 class="text-center"><b>Dados da Contagem</b>'
    html += '<tbody><tr><td>Comarca do Cálculo:</td><td>' + chosenCity + '</td></tr>';
    html += '<tr><td>Forma da Contagem:</td><td>' + calcTypeText + '</td ></tr > ';

    html += '<tr><td>Data ' + countTypeText + ':</td><td>' + moment(initialDate).format("DD/MM/YYYY") + '</td></tr > ';
    if (countType == '1') {
        html += '<tr><td>Data da Publicação::</td><td>' + moment(dateForCalc).format("DD/MM/YYYY") + '</td></tr > ';
    }
    html += '<tr><td>Dias: </td><td>' + days + '</td></tr>';
    html += '<tr class="table-active"><td>Prazo: </td><td>' + moment(dueDate).format("DD/MM/YYYY") + '</td></tr></tbody>';

    html += '</table>';
    $('#printResults').html(html);






    //append div #results
    //$('#results').append(html);
    document.querySelector('#results').style.display = 'block';
    //scroll to results


    document.querySelector('#results').scrollIntoView({ behavior: 'smooth' })





    //document.querySelector('#loading').style.display = 'none';
    console.log('ok aqui.');

    console.log('Please check your numbers.');

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
            return down.downDate === currentDay;
        }
        ) && currentDay >= originalDueDate.format() && currentDay <= dueDate.format()) {
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

}





// Clear error

