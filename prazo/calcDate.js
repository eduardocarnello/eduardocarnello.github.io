




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
    // Show loader
    //document.querySelector('#loading').style.display = 'block';
    // Set timer




});

/*document.getElementById('reset1').addEventListener('click', function (e) {
    e.preventDefault();
    // Hide results
    var obj = document.getElementById("results");
    obj.style.backgroundColor = "lightgray";

    document.querySelector('#results').style.display = 'none !important';
    // Show loader
    document.getElementById('deadlineCalc').reset();
    //document.querySelector('#loading').style.display = 'block';
    // Set timer

});*/


function calculateResults(e) {

    // UI Vars
    const initialDate = moment($('#initialDate').val()).format('DD/MM/YYYY');   //dia do ato
    const days = $('#days').val();                                              //prazo
    let dateForCalc;                                                            //data para cálculo
    let isCaclWorkDay = false;                                                  //conta por dia útil ou corrido
    let startDay                                                                //dia de início do prazo
    let dueDate;                                                                //data final do prazo
    const finalDate = document.getElementById('finalDate');                     //input do dia final do prazo

    // Calculate date
    if (moment(moment($('#initialDate').val()).format('DD/MM/YYYY')).isBusinessDay() == true) {
        dateForCalc = initialDate
    } else dateForCalc = moment(initialDate).businessAdd(1)



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
    const AnoEscolhido = moment().year();

    var
        EmendaCarnaval = (Easter(AnoEscolhido)).subtract(48, "days").format(),
        Carnaval = (Easter(AnoEscolhido)).subtract(47, "days").format(),
        Endoencas = (Easter(AnoEscolhido)).subtract(3, "days").format(),
        SextaSanta = (Easter(AnoEscolhido)).subtract(2, "days").format(),
        Pascoa = (Easter(AnoEscolhido)).format(),
        CorpusChirsti = (Easter(AnoEscolhido)).add(60, "days").format();



    moment.updateLocale('', {
        holidays: [
            '01/01/' + AnoEscolhido, //Ano Novo
            EmendaCarnaval,
            Carnaval,
            Endoencas,
            SextaSanta,
            Pascoa,
            CorpusChirsti,
            '04/04/' + AnoEscolhido, //Aniversário de Marília
            '21/04/' + AnoEscolhido, //Tiradentes
            '01/05/' + AnoEscolhido, //Dia do Trabalho
            '25/05/' + AnoEscolhido, //Revolução Constitucionalista
            '11/07/' + AnoEscolhido, //Padroeiro de Marília
            '07/09/' + AnoEscolhido, //Independência
            '12/10/' + AnoEscolhido, //Nossa Senhora Aparecida
            '28/10/' + AnoEscolhido, //Dia do Funcionário Público
            '02/11/' + AnoEscolhido, //Finados
            '15/11/' + AnoEscolhido, //Proclamação da República
            '12/12/' + AnoEscolhido, //Dia da Justiça
            '20/04/2020',          //Emenda de 2020
            '12/06/2020',          //Emenda de 2020
            '07/12/2020'           //Emenda de 2020

            //TODO: INCLUIR INTERRUPÇÕES DE PRAZOS E RECESSOS





        ],
        holidayFormat: 'DD/MM/YYYY'
    });

    const indisponibilidades = {
        '29/01/2020': "Indisponibilidade no Saj",
        '17/02/2020': "Indisponibilidade no Saj",
        '18/02/2020': "Indisponibilidade no Saj",
        '19/02/2020': "Indisponibilidade no Saj",
        '28/02/2020': "Indisponibilidade no Saj",
        '11/05/2020': "Indisponibilidade no Saj",
        '18/05/2020': "Indisponibilidade no Saj",
        '19/05/2020': "Indisponibilidade no Saj",
        '09/06/2020': "Indisponibilidade no Saj", //teste apenas, excluir depois
    }

    /*Vai verificar se a data inicial é um dia útil
    * isso e importante para que a contagem de prazo considere corretamente os dias
    */
    if (moment().isBusinessDay() == true) {
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

    dueDate = moment(dateForCalc).businessAdd(days) //subtrai 1 porque é já foi contado para fins de ver o primeiro dia da contagem

    const principal = 1;
    const calculatedInterest = 1;
    const calculatedPayments = 1;

    // Compute monthly payments


    if (isFinite(days)) {
        finalDate.innerHTML = moment(dueDate).format("DD/MM/YYYY");

        document.querySelector('#results').style.display = 'block';
        //document.querySelector('#loading').style.display = 'none';
        console.log('ok aqui.');
    } else {
        console.log('Please check your numbers.');
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
        AnoEscolhido,
        RevolucaoConst;



    //Lista de Feriados cujo cálculo depende da Páscoa


    // Verifica se houve indisponibilidade de peticionamento no dia final e, enquanto for uma data com indisponibilidade, prorroga o prazo final para o primeiro dia útil subsequente
    //while (indisponibilidades.hasOwnProperty(dataFinal.format())) {
    //dataFinal = dataFinal.nextBusinessDay()
    //}

    //onclick button type reset, do this



}