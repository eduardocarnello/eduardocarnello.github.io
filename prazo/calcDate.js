moment.locale('pt-br');

document.getElementById('deadlineCalc').addEventListener('submit', function (e) {
    e.preventDefault();
    // Hide results
    if (document.querySelector('#results').style.display == '' || document.querySelector('#results').style.display == 'none') {
        console.log('yes')
        setTimeout(calculateResults, 500);
    } else {
        document.querySelector('#results').style.display = 'none';
        console.log('no')
        setTimeout(calculateResults, 0);
    }

});


function calculateResults(e) {

    // UI Vars
    let initialDate = moment($('#initialDate').val(), 'DD/MM/YYYY');   //dia do ato
    const days = $('#days').val();                                              //prazo
    let dateForCalc = moment(initialDate, 'DD/MM/YYYY').format('DD/MM/YYYY');
    //  let isCaclWorkDay = false;                                                  //conta por dia útil ou 
    //    let startDay                                                                //dia de início do prazo
    //data final do prazo
    const finalDate = document.getElementById('finalDate');                     //input do dia final do prazo
    var currentYear = moment(initialDate).year();
    //excpected final year
    const expectedFinalYear = moment(initialDate).businessAdd(days + 10).year();
    console.log(expectedFinalYear);
    //if the initialDate year is less than the dueyear


    function Easter(Y) {
        var C = Math.floor(Y / 100);
        var N = Y - 19 * Math.floor(Y / 19);
        var K = Math.floor((C - 17) / 25);
        var I = C - Math.floor(C / 4) - Math.floor((C - K) / 3) + 19 * N + 15;
        I = I - 30 * Math.floor((I / 30));
        I = I - Math.floor(I / 28) * (1 - Math.floor(I / 28) * Math.floor(29 / (I + 1)) * Math.floor((21 - N) / 11));
        var J = Y + Math.floor(Y / 4) + I + 2 - C + Math.floor(C / 4);
        J = J - 7 * Math.floor(J / 7);
        var L = I - J;
        var M = 3 + Math.floor((L + 40) / 44);
        var D = L + 28 - 31 * Math.floor(M / 4);

        return moment([Y, (M - 1), D]);
    }

    const nationalHolidays = [];
    for (let i = currentYear; i <= currentYear + 3; i++) {
        nationalHolidays.push(
            //EASTER HOLIDAYS
            { holidayDate: (Easter(i)).subtract(48, "days").format('DD/MM/YYYY'), description: "Emenda de Carnaval" },
            { holidayDate: (Easter(i)).subtract(47, "days").format('DD/MM/YYYY'), description: "Carnaval" },
            { holidayDate: (Easter(i)).subtract(3, "days").format('DD/MM/YYYY'), description: "Endoenças" },
            { holidayDate: (Easter(i)).subtract(2, "days").format('DD/MM/YYYY'), description: "Paixão de Cristo" },
            { holidayDate: (Easter(i)).format('DD/MM/YYYY'), description: "Páscoa" },
            { holidayDate: (Easter(i)).add(60, "days").format('DD/MM/YYYY'), description: "Corpus Christi" },

            //FIXED HOLIDAYS
            { holidayDate: `01/01/${i}`, description: "Confraternização Universal" },
            { holidayDate: `21/04/${i}`, description: "Tiradentes" },
            { holidayDate: `01/05/${i}`, description: "Dia do Trabalhador" },
            { holidayDate: `07/09/${i}`, description: "Independência do Brasil" },
            { holidayDate: `12/10/${i}`, description: "Nossa Senhora Aparecida, Padroeira do Brasil" },
            { holidayDate: `02/11/${i}`, description: "Finados" },
            { holidayDate: `15/11/${i}`, description: "Proclamação da República" },
            { holidayDate: `25/12/${i}`, description: "Natal" },

        );
    }

    const amendment = [
        { holidayDate: "17/06/2022", description: "Emenda de Corpus Christi 2022" },

    ]

    const mobileHolidays = [
        { holidayDate: "08/12", description: "Dia da Justiça" },
    ]


    const sistDown = [
        { downDate: '04/07/2022', description: "Indisponibilidade no Saj" },

    ]

    const SP = [
        { holidayDate: estado == 'SP' ? "09/07" : '', description: "Revolução Constitucionalista de São Paulo" },
        //ver como tirar o feriado de 09/07 do ano de 2020, quando foi suspenso
    ]


    var estado = 'SP'
    //if var estado == 'SP', then concatenate the SP array into the holidays. Else, concatenate the RJ array.









    console.log(estado == SP)

    //create an array with municipalities and their respective holidays

    const marilia = []
    for (let i = currentYear; i <= currentYear + 3; i++) {
        marilia.push(
            { holidayDate: `04/07/${i}`, description: "Aniversário do Município de Marília" },
            { holidayDate: `11/07/${i}`, description: "São Bento, Padroeiro de Marília" },
        );
    }
    console.log(marilia);
    //get all the dates of christmas for every year from the current year to the next year
    const christmas = [];
    for (let i = currentYear; i <= currentYear + 3; i++) {
        christmas.push(moment(`25/12/${i}`, 'DD/MM/YYYY').format('DD/MM/YYYY'));
    }
    console.log(christmas);


    //merge nationalHolidays, marilia and SPHolidays arrays
    const myHolidays = nationalHolidays.concat(nationalHolidays, marilia, SP);

    console.log(myHolidays);

    //check if a date is a holiday and return its description
    function holidayName(date) {
        var holiday = myHolidays.find(function (holiday) {
            return holiday.holidayDate === date;
        });
        return holiday ? holiday.description : false;
    }

    console.log('é feriado no padroeiro? ' + holidayName('11/07'));


    holidays = moment.updateLocale('pt-br', {
        format: 'DD/MM/YYYY',
        holidays: myHolidays.map(i => i.holidayDate),
        /*
            '01/01/' + currentYear, //Ano Novo
            EmendaCarnaval,
            Carnaval,
            Endoencas,
            SextaSanta,
            Pascoa,
            CorpusChirsti,
            '04/04/' + currentYear, //Aniversário de Marília
            '21/04/' + currentYear, //Tiradentes
            '01/05/' + currentYear, //Dia do Trabalho
            '25/05/' + currentYear, //Revolução Constitucionalista
            '11/07/' + currentYear, //Padroeiro de Marília
            '07/09/' + currentYear, //Independência
            '12/10/' + currentYear, //Nossa Senhora Aparecida
            '28/10/' + currentYear, //Dia do Funcionário Público
            '02/11/' + currentYear, //Finados
            '15/11/' + currentYear, //Proclamação da República
            '12/12/' + currentYear, //Dia da Justiça
            '20/04/2020',          //Emenda de 2020
            '12/06/2020',          //Emenda de 2020
            '07/12/2020',           //Emenda de 2020
    */
        //TODO: INCLUIR INTERRUPÇÕES DE PRAZOS E RECESSOS
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
    if (initialDate.isBusinessDay() == true) {
        diaUtil = initialDate
    }
    else (initialDate = moment(diaAto).businessAdd(1)) //preciso arrumar isso usando o While
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
    var dueDate = moment(dateForCalc).businessAdd(days)
    console.log('DateFor Calc ' + dateForCalc + 'e dueDate ' + dueDate)
    while (moment(dateForCalc).add(i, 'days') <= (dueDate)) {
        listaDias.push(moment(dateForCalc).add(i, 'days').format())
        currentDayList = moment(dateForCalc).add(i, 'days').format()
        i++

    }
    console.log(listaDias + '  ' + moment(dateForCalc).format('DD/MM/YYYY') + ' e dueDate ' + moment(dueDate).format('DD/MM/YYYY'))



    // make a array of objects with the date and the type of day
    var listaDiasComTipo = []
    for (var i = 0; i < listaDias.length; i++) {
        var currentDay = listaDias[i]
        var currentDayType = moment(currentDay, 'DD/MM/YYYY').isBusinessDay()
        if (currentDayType == true && currentDayType == true && currentDay != moment(dateForCalc, 'DD/MM/YYYY').format('DD/MM/YYYY')) {
            w++
            console.log(+ ' é um dia útil')
        }

        // listaDiasComTipo first must display the date with a string 'Primeiro dia da contagem'


        console.log(moment(currentDay, 'DD/MM/YYYY').format('DD/MM/YYYY') + ' é ' + currentDayType)
        listaDiasComTipo.push({
            //if currentDayType is different from the first day of the list and is a workday, then index: w, else index: '-'
            index: (currentDayType == true && currentDay != moment(dateForCalc, 'DD/MM/YYYY').format('DD/MM/YYYY')) ? w : '-',
            cal: (currentDayType == true && currentDay != moment(dateForCalc, 'DD/MM/YYYY').format('DD/MM/YYYY')) ? '<i class="fa-regular fa-calendar-check"></i>' : '',
            date: currentDay,
            _type: currentDay == moment(dateForCalc, 'DD/MM/YYYY').format('DD/MM/YYYY') ? 'Dia do ato (não conta)' : currentDayType ? moment(currentDay, 'DD/MM/YYYY').locale('pt-br').format('dddd') : holidayName(moment(currentDay, 'DD/MM/YYYY').format('DD/MM/YYYY')) ? holidayName(moment(currentDay, 'DD/MM/YYYY').format('DD/MM/YYYY')) : moment(currentDay, 'DD/MM/YYYY').locale('pt-br').format('dddd'),
            get type() {
                return this._type;
            },
            set type(value) {
                this._type = value;
            },
        })
    }


    //check if listacomtipo item _type is a weekend or holiday
    console.log(currentYear);

    //// código para criar tabela. arrumar

    var html = "<table class='table table-hover' border='1|1'><thead class='table-light'><tr><th scope='col'>#</th><th scope='col'></th><th scope='col'>Data</th><th scope='col'>Descrição</th></tr></thead>";
    for (var i = 0; i < listaDiasComTipo.length; i++) {
        if (i == listaDiasComTipo.length - 1) {
            html += "<b><tr class='table-active'>";
        } else (html += "<tr>");
        if (moment(listaDiasComTipo[i].date, 'DD/MM/YYYY').isBusinessDay() == false) {
            html += "<b><tr class=''>";
        }


        html += "<td><b>" + listaDiasComTipo[i].index + "</b></td>";
        html += "<td>" + listaDiasComTipo[i].cal + "</td>";
        html += "<td>" + listaDiasComTipo[i].date + "</td>";
        html += "<td>" + listaDiasComTipo[i].type + "</td>";

        html += "</tr></b>";

    }
    html += "</table>";
    document.getElementById("table-responsive").innerHTML = html;



    // Compute monthly payments



    finalDate.innerHTML = moment(dueDate).format("DD/MM/YYYY");

    document.querySelector('#results').style.display = 'block';
    //document.querySelector('#loading').style.display = 'none';
    console.log('ok aqui.');

    console.log('Please check your numbers.');
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