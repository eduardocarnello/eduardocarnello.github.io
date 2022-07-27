const amendment = [
    { holidayDate: "22/04/2022", description: "Suspensão de expediente (Prov. CSM 2641/2021)" },
    { holidayDate: "17/06/2022", description: "Suspensão de expediente (Prov. CSM 2641/2021)" },
    { holidayDate: "14/11/2022", description: "Suspensão de expediente (Prov. CSM 2641/2021)" },

]

const sistDown = [
    { downDate: '08/07/2022', description: "Indisponibilidade no Saj", city: 'Marília' },
    { downDate: '12/07/2022', description: "Indisponibilidade no Saj", city: 'Bauru' },

]

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
function holidaysFunc(currentYear, expectedFinalYear, Easter) {
    var estado = 'SP';
    const marilia = [];
    const nationalHolidays = [];
    const SP = [];



    for (let i = currentYear; i <= expectedFinalYear; i++) {
        nationalHolidays.push(

            //RECESSO FORENSE E ART. 116, § 2º, DO RITJSP
            { holidayDate: `01/01/${i}`, description: "Recesso - Art. 116, § 2º do RITJSP" },
            { holidayDate: `02/01/${i}`, description: "Recesso - Art. 116, § 2º do RITJSP" },
            { holidayDate: `03/01/${i}`, description: "Recesso - Art. 116, § 2º do RITJSP" },
            { holidayDate: `04/01/${i}`, description: "Recesso - Art. 116, § 2º do RITJSP" },
            { holidayDate: `05/01/${i}`, description: "Recesso - Art. 116, § 2º do RITJSP" },
            { holidayDate: `06/01/${i}`, description: "Recesso - Art. 116, § 2º do RITJSP" },

            { holidayDate: `07/01/${i}`, description: "Art. 116, § 2º do RITJSP" },
            { holidayDate: `08/01/${i}`, description: "Art. 116, § 2º do RITJSP" },
            { holidayDate: `09/01/${i}`, description: "Art. 116, § 2º do RITJSP" },
            { holidayDate: `10/01/${i}`, description: "Art. 116, § 2º do RITJSP" },
            { holidayDate: `11/01/${i}`, description: "Art. 116, § 2º do RITJSP" },
            { holidayDate: `12/01/${i}`, description: "Art. 116, § 2º do RITJSP" },
            { holidayDate: `13/01/${i}`, description: "Art. 116, § 2º do RITJSP" },
            { holidayDate: `14/01/${i}`, description: "Art. 116, § 2º do RITJSP" },
            { holidayDate: `15/01/${i}`, description: "Art. 116, § 2º do RITJSP" },
            { holidayDate: `16/01/${i}`, description: "Art. 116, § 2º do RITJSP" },
            { holidayDate: `17/01/${i}`, description: "Art. 116, § 2º do RITJSP" },
            { holidayDate: `18/01/${i}`, description: "Art. 116, § 2º do RITJSP" },
            { holidayDate: `19/01/${i}`, description: "Art. 116, § 2º do RITJSP" },
            { holidayDate: `20/01/${i}`, description: "Art. 116, § 2º do RITJSP" },


            //EASTER HOLIDAYS
            { holidayDate: (Easter(i)).subtract(48, "days").format('DD/MM/YYYY'), description: "Véspera de Carnaval" },
            { holidayDate: (Easter(i)).subtract(47, "days").format('DD/MM/YYYY'), description: "Carnaval" },
            { holidayDate: (Easter(i)).subtract(3, "days").format('DD/MM/YYYY'), description: "Endoenças" },
            { holidayDate: (Easter(i)).subtract(2, "days").format('DD/MM/YYYY'), description: "Sexta-feira Santa" },
            { holidayDate: (Easter(i)).format('DD/MM/YYYY'), description: "Páscoa" },
            { holidayDate: (Easter(i)).add(60, "days").format('DD/MM/YYYY'), description: "Corpus Christi" },

            //FIXED HOLIDAYS
            { holidayDate: `01/01/${i}`, description: "Confraternização Universal" },
            { holidayDate: i >= 1965 ? `21/04/${i}` : '', description: i >= 1965 ? "Tiradentes" : '' },
            { holidayDate: `01/05/${i}`, description: "Dia do Trabalhador" },
            { holidayDate: `07/09/${i}`, description: "Independência do Brasil" },
            { holidayDate: `12/10/${i}`, description: "Nossa Senhora Aparecida, Padroeira do Brasil" },
            { holidayDate: `02/11/${i}`, description: "Finados" },
            { holidayDate: `15/11/${i}`, description: "Proclamação da República" },
            { holidayDate: `08/11/${i}`, description: "Dia da Justiça" },
            { holidayDate: `25/12/${i}`, description: "Natal" }



        );
        marilia.push(
            { holidayDate: `04/04/${i}`, description: "Aniversário do Município de Marília" },
            { holidayDate: `11/07/${i}`, description: "São Bento, Padroeiro de Marília" }
        );

        SP.push(
            { holidayDate: currentYear == 2020 ? "" : `09/07/${i}`, description: currentYear == 2020 ? '' : "Revolução Constitucionalista de São Paulo" }
        );

    }
    return { estado, SP, marilia, nationalHolidays };
}
