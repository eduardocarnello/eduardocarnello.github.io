const amendment = [
    { holidayDate: "22/04/2022", description: "Suspensão de expediente (Prov. CSM 2641/2021)" },
    { holidayDate: "17/06/2022", description: "Suspensão de expediente (Prov. CSM 2641/2021)" },
    { holidayDate: "14/11/2022", description: "Suspensão de expediente (Prov. CSM 2641/2021)" },

]

const sistDown = [
    { downDate: '09/02/2022', description: "INSTABILIDADE DO PETICIONAMENTO DE INICIAL E INTERMEDIÁRIA DE 1º E 2º GRAU", },
    { downDate: '10/03/2022', description: "INTERMITÊNCIA NA PASTA DIGITAL DO PORTAL E-SAJ", },
    { downDate: '25/03/2022', description: "INSTABILIDADE DO PETICIONAMENTO DE INICIAL E INTERMEDIÁRIA DE 1º E 2º GRAU", },
    { downDate: '28/03/2022', description: "INSTABILIDADE DO PETICIONAMENTO DE INICIAL E INTERMEDIÁRIA DE 1º E 2º GRAU", },
    { downDate: '29/03/2022', description: "INSTABILIDADE DO PETICIONAMENTO INTERMEDIÁRIO PARA PROCESSOS INCIDENTAIS DE 1º E 2º GRAU", },
    { downDate: '30/03/2022', description: "INSTABILIDADE DO PETICIONAMENTO INTERMEDIÁRIO PARA PROCESSOS INCIDENTAIS DE 1º E 2º GRAU", },
    { downDate: '31/03/2022', description: "INSTABILIDADE DO PETICIONAMENTO INTERMEDIÁRIO PARA PROCESSOS INCIDENTAIS DE 1º E 2º GRAU", },
    { downDate: '04/04/2022', description: "INSTABILIDADE DO PETICIONAMENTO INTERMEDIÁRIO PARA PROCESSOS INCIDENTAIS DE 1º E 2º GRAU", },
    { downDate: '06/04/2022', description: "INSTABILIDADE DO PETICIONAMENTO DE INICIAL E INTERMEDIÁRIA DE 1º E 2º GRAU", },
    { downDate: '07/04/2022', description: "INSTABILIDADE DO PETICIONAMENTO DE INICIAL E INTERMEDIÁRIA DE 1º E 2º GRAU", },
    { downDate: '08/04/2022', description: "INSTABILIDADE DO PETICIONAMENTO DE INICIAL E INTERMEDIÁRIA DE 1º E 2º GRAU", },
    { downDate: '09/04/2022', description: "INSTABILIDADE DO PETICIONAMENTO DE INICIAL E INTERMEDIÁRIA DE 1º E 2º GRAU", },
    { downDate: '10/04/2022', description: "INSTABILIDADE DO PETICIONAMENTO DE INICIAL E INTERMEDIÁRIA DE 1º E 2º GRAU", },
    { downDate: '11/04/2022', description: "INSTABILIDADE DO PETICIONAMENTO DE INICIAL E INTERMEDIÁRIA DE 1º E 2º GRAU", },
    { downDate: '12/04/2022', description: "INSTABILIDADE DO PETICIONAMENTO DE INICIAL E INTERMEDIÁRIA DE 1º E 2º GRAU", },
    { downDate: '13/04/2022', description: "INSTABILIDADE DO PETICIONAMENTO DE INICIAL E INTERMEDIÁRIA DE 1º E 2º GRAU", },
    { downDate: '14/04/2022', description: "INSTABILIDADE DO PETICIONAMENTO DE INICIAL E INTERMEDIÁRIA DE 1º E 2º GRAU", },
    { downDate: '15/04/2022', description: "INSTABILIDADE DO PETICIONAMENTO DE INICIAL E INTERMEDIÁRIA DE 1º E 2º GRAU", },
    { downDate: '16/04/2022', description: "INSTABILIDADE DO PETICIONAMENTO DE INICIAL E INTERMEDIÁRIA DE 1º E 2º GRAU", },
    { downDate: '17/04/2022', description: "INSTABILIDADE DO PETICIONAMENTO DE INICIAL E INTERMEDIÁRIA DE 1º E 2º GRAU", },
    { downDate: '18/04/2022', description: "INSTABILIDADE DO PETICIONAMENTO DE INICIAL E INTERMEDIÁRIA DE 1º E 2º GRAU", },
    { downDate: '19/04/2022', description: "INSTABILIDADE DO PETICIONAMENTO DE INICIAL E INTERMEDIÁRIA DE 1º E 2º GRAU", },
    { downDate: '20/04/2022', description: "INSTABILIDADE DO PETICIONAMENTO DE INICIAL E INTERMEDIÁRIA DE 1º E 2º GRAU", },
    { downDate: '09/05/2022', description: "INDISPONIBILIDADE PARA DOWNLOAD DOS AUTOS EM 1º, 2º GRAU E COL. RECURSAL", },
    { downDate: '13/05/2022', description: "INDISPONIBILIDADE NA CONSULTA PROCESSUAL DE 1ª E 2ª INSTÂNCIAS E DO COLÉGIO RECURSAL", },
    { downDate: '13/06/2022', description: "INDISPONIBILIDADE NA CONSULTA PROCESSUAL DE 1ª INSTÂNCIA", },
    { downDate: `16/05/2022`, description: "INDISPONIBILIDADE SEVERA NA PASTA DIGITAL DO PORTAL E-SAJ" },
    { downDate: '29/06/2022', description: "INSTABILIDADE PARA VISUALIZAÇÃO E DOWNLOAD DOS AUTOS EM 1º GRAU", },
    { downDate: '01/07/2022', description: "INDISPONIBILIDADE NA CONSULTA PROCESSUAL E PETICIONAMENTO DE 1ª, 2ª INSTÂNCIA E COL. RECURSAL", },
    { downDate: '11/07/2022', description: "INDISPONIBILIDADE NA CONSULTA PROCESSUAL DOS PROCESSOS DE 1ª INSTÂNCIA", },
    { downDate: '13/07/2022', description: "INDISPONIBILIDADE NA CONSULTA PROCESSUAL E PETICIONAMENTO DE 1ª, 2ª INSTÂNCIA E COL. RECURSAL", },

    { downDate: `18/07/2022`, description: "INDISPONIBILIDADE SEVERA NA PASTA DIGITAL DO PORTAL E-SAJ" },
    { downDate: `20/07/2022`, description: "INDISPONIBILIDADE SEVERA NA PASTA DIGITAL DO PORTAL E-SAJ" },
    { downDate: `08/08/2022`, description: "MANUTENÇÃO PREVENTIVA IMPRESCINDÍVEL DO DATACENTER - INDISPONIBILIDADE DE SISTEMAS" },
    { downDate: `30/09/2022`, description: "INDISPONIBILIDADE DE AUTENTICAÇÃO NO PORTAL E-SAJ" },
    { downDate: `25/10/2022`, description: "INDISPONIBILIDADE DO PETICIONAMENTO ELETRÔNICO INICIAL E INTERMEDIÁRIO DE 1º GRAU PARA A CLASSE: 12154 - EXECUÇÃO DE TÍTULO EXTRAJUDICIAL NO PORTAL E-SAJ" },
    { downDate: `26/10/2022`, description: "INDISPONIBILIDADE DO PETICIONAMENTO ELETRÔNICO INICIAL E INTERMEDIÁRIO DE 1º GRAU PARA A CLASSE: 12154 - EXECUÇÃO DE TÍTULO EXTRAJUDICIAL NO PORTAL E-SAJ" },
    { downDate: `24/11/2022`, description: "Encerramento de expediente antecipadamente - Provimento CSM nº 2.672/2022" },
    { downDate: `24/11/2022`, description: "Encerramento de expediente antecipadamente - Provimento CSM nº 2.672/2022" },
    { downDate: `02/12/2022`, description: "Encerramento de expediente antecipadamente - Provimento CSM nº 2.672/2022" },





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
    const cityHolidays = [];
    const stateHolidays = [];
    const nationalHolidays = [];




    for (let i = currentYear; i <= expectedFinalYear; i++) {
        nationalHolidays.push(

            //RECESSO FORENSE E ART. 116, § 2º, DO RITJSP
            { holidayDate: `20/12/${i}`, description: "Recesso - Art. 116, § 2º do RITJSP" },
            { holidayDate: `21/12/${i}`, description: "Recesso - Art. 116, § 2º do RITJSP" },
            { holidayDate: `22/12/${i}`, description: "Recesso - Art. 116, § 2º do RITJSP" },
            { holidayDate: `23/12/${i}`, description: "Recesso - Art. 116, § 2º do RITJSP" },
            { holidayDate: `24/12/${i}`, description: "Recesso - Art. 116, § 2º do RITJSP" },
            { holidayDate: `25/12/${i}`, description: "Recesso - Art. 116, § 2º do RITJSP" },
            { holidayDate: `26/12/${i}`, description: "Recesso - Art. 116, § 2º do RITJSP" },
            { holidayDate: `27/12/${i}`, description: "Recesso - Art. 116, § 2º do RITJSP" },
            { holidayDate: `28/12/${i}`, description: "Recesso - Art. 116, § 2º do RITJSP" },
            { holidayDate: `29/12/${i}`, description: "Recesso - Art. 116, § 2º do RITJSP" },
            { holidayDate: `30/12/${i}`, description: "Recesso - Art. 116, § 2º do RITJSP" },
            { holidayDate: `31/12/${i}`, description: "Recesso - Art. 116, § 2º do RITJSP" },


            { holidayDate: `01/01/${i}`, description: "Recesso - Art. 116, § 2º do RITJSP" },
            { holidayDate: `02/01/${i}`, description: "Recesso - Art. 116, § 2º do RITJSP" },
            { holidayDate: `03/01/${i}`, description: "Recesso - Art. 116, § 2º do RITJSP" },
            { holidayDate: `04/01/${i}`, description: "Recesso - Art. 116, § 2º do RITJSP" },
            { holidayDate: `05/01/${i}`, description: "Recesso - Art. 116, § 2º do RITJSP" },
            { holidayDate: `06/01/${i}`, description: "Recesso - Art. 116, § 2º do RITJSP" },
            //Fix next year
            { holidayDate: `01/01/${i + 1}`, description: "Recesso - Art. 116, § 2º do RITJSP" },
            { holidayDate: `02/01/${i + 1}`, description: "Recesso - Art. 116, § 2º do RITJSP" },
            { holidayDate: `03/01/${i + 1}`, description: "Recesso - Art. 116, § 2º do RITJSP" },
            { holidayDate: `04/01/${i + 1}`, description: "Recesso - Art. 116, § 2º do RITJSP" },
            { holidayDate: `05/01/${i + 1}`, description: "Recesso - Art. 116, § 2º do RITJSP" },
            { holidayDate: `06/01/${i + 1}`, description: "Recesso - Art. 116, § 2º do RITJSP" },

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

            //Fix next year

            { holidayDate: `07/01/${i + 1}`, description: "Art. 116, § 2º do RITJSP" },
            { holidayDate: `08/01/${i + 1}`, description: "Art. 116, § 2º do RITJSP" },
            { holidayDate: `09/01/${i + 1}`, description: "Art. 116, § 2º do RITJSP" },
            { holidayDate: `10/01/${i + 1}`, description: "Art. 116, § 2º do RITJSP" },
            { holidayDate: `11/01/${i + 1}`, description: "Art. 116, § 2º do RITJSP" },
            { holidayDate: `12/01/${i + 1}`, description: "Art. 116, § 2º do RITJSP" },
            { holidayDate: `13/01/${i + 1}`, description: "Art. 116, § 2º do RITJSP" },
            { holidayDate: `14/01/${i + 1}`, description: "Art. 116, § 2º do RITJSP" },
            { holidayDate: `15/01/${i + 1}`, description: "Art. 116, § 2º do RITJSP" },
            { holidayDate: `16/01/${i + 1}`, description: "Art. 116, § 2º do RITJSP" },
            { holidayDate: `17/01/${i + 1}`, description: "Art. 116, § 2º do RITJSP" },
            { holidayDate: `18/01/${i + 1}`, description: "Art. 116, § 2º do RITJSP" },
            { holidayDate: `19/01/${i + 1}`, description: "Art. 116, § 2º do RITJSP" },
            { holidayDate: `20/01/${i + 1}`, description: "Art. 116, § 2º do RITJSP" },


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
            { holidayDate: i == 2022 ? `28/10/${i}` : `28/10/${i}`, description: i == 2022 ? "Dia do Servidor Público" : 'Dia do Servidor Público' },
            { holidayDate: i == 2022 ? `09/12/${i}` : `08/12/${i}`, description: i == 2022 ? "Dia da Justiça 2022 (PROVIMENTO CSM Nº 2677/2022)" : 'Dia da Justiça' },
            { holidayDate: `25/12/${i}`, description: "Natal" },

            //SEVERE SYSTEM DOWN




        );
        cityHolidays.push(

            /*********************5ª RAJ************************************/
            //ADAMANTINA
            { holidayDate: `13/06/${i}`, description: "Padroeiro e Fundação da Cidade", city: "Adamantina" },

            //ASSIS
            { holidayDate: `01/07/${i}`, description: "Dia do Município", city: "Assis" },
            { holidayDate: `04/10/${i}`, description: "São Franciso, Padroeiro da Cidade", city: "Assis" },

            //BASTOS
            { holidayDate: `18/06/${i}`, description: "Fundação do Município", city: "Bastos" },
            { holidayDate: `03/12/${i}`, description: "São Francisco Xavier, Padroeiro do Município", city: "Bastos" },

            //CÂNDIDO MOTA
            { holidayDate: `12/10/${i}`, description: "N. Sra. das Dores, Padroeira do Município", city: "Cândido Mota" },
            { holidayDate: `26/10/${i}`, description: "Emancipação Político-Administrativa", city: "Cândido Mota" },

            //DRACENA
            { holidayDate: `08/12/${i}`, description: "Padroeira e Fundação da Cidade", city: "Dracena" },

            //FLÓRIDA PAULISTA
            { holidayDate: `25/10/${i}`, description: "Padroeira e Fundação da Cidade", city: "Flórida Paulista" },

            //GÁLIA
            { holidayDate: `19/03/${i}`, description: "São José, Padroeiro do Município", city: "Gália" },
            { holidayDate: `14/04/${i}`, description: "Aniversário da Cidade", city: "Gália" },

            //GARÇA
            { holidayDate: `05/05/${i}`, description: "Emancipação Político-Administrativa e Dia do Menino Jesus de Aracoeli", city: "Garça" },
            { holidayDate: `29/06/${i}`, description: "Padroeiro São Pedro e Dia da Comunidade Religiosa Municipal", city: "Garça" },

            //IEPÊ
            { holidayDate: `24/06/${i}`, description: "Padroeiro São João Batista", city: "Iepê" },
            { holidayDate: `30/11/${i}`, description: "Emancipaçao Política do Município", city: "Iepê" },

            //JUNQUEIRÓPOLIS
            { holidayDate: `13/06/${i}`, description: "Padroeiro Santo Antônio", city: "Junqueirópolis" },

            //LUCÉLIA
            { holidayDate: `24/06/${i}`, description: "Padroeiro São João Batista", city: "Lucélia" },

            //MARACAÍ
            { holidayDate: `04/05/${i}`, description: "Dia da Cidade", city: "Maracaí" },
            { holidayDate: `15/08/${i}`, description: "Padroeira Nossa Senhora do Patrocínio", city: "Maracaí" },

            //MARÍLIA
            { holidayDate: `04/04/${i}`, description: "Fundação da Cidade", city: "Marília" },
            { holidayDate: `11/07/${i}`, description: "São Bento, Padroeiro da Cidade", city: "Marília" }


        );

        stateHolidays.push(
            { holidayDate: currentYear == 2020 ? "" : `09/07/${i}`, description: currentYear == 2020 ? '' : "Revolução Constitucionalista de São Paulo", state: 'SP' }
        );

    }
    return { estado, stateHolidays, cityHolidays, nationalHolidays };
}
