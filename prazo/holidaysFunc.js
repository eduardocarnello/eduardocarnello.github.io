const amendment = [
    { holidayDate: "22/04/2022", description: "Suspensão de expediente (Prov. CSM 2641/2021)" },
    { holidayDate: "17/06/2022", description: "Suspensão de expediente (Prov. CSM 2641/2021)" },
    { holidayDate: "14/11/2022", description: "Suspensão de expediente (Prov. CSM 2641/2021)" },
    { holidayDate: "09/06/2023", description: "Suspensão de expediente (Prov. CSM 2678/2022)" },
    { holidayDate: "08/09/2023", description: "Suspensão de expediente (Prov. CSM 2678/2022)" },
    { holidayDate: "13/10/2023", description: "Suspensão de expediente (Prov. CSM 2678/2022)" },
    { holidayDate: "03/11/2023", description: "Suspensão de expediente (Prov. CSM 2678/2022)" },
    { holidayDate: "31/05/2024", description: "Suspensão de expediente (Prov. CSM 2728/2023)" },
    { holidayDate: "08/07/2024", description: "Suspensão de expediente (Prov. CSM 2728/2023)" },


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
    { downDate: `28/11/2022`, description: "INDISPONIBILIDADE NA CONSULTA PROCESSUAL 1ª INSTÂNCIA" },
    { downDate: `24/11/2022`, description: "Encerramento de expediente antecipadamente - Provimento CSM nº 2.672/2022" },
    { downDate: `02/12/2022`, description: "Encerramento de expediente antecipadamente - Provimento CSM nº 2.672/2022" },
    { downDate: `05/12/2022`, description: "Encerramento de expediente antecipadamente - Provimento CSM nº 2.672/2022" },
    { downDate: `19/01/2023`, description: "INDISPONIBILIDADE NA CONSULTA PROCESSUAL DE 1ª INSTÂNCIA DA BASE JM DO SAJ" },
    { downDate: `27/01/2023`, description: "INSTABILIDADE DO PETICIONAMENTO DE INICIAL E INTERMEDIÁRIA DE 1º E 2º GRAU E DO COLÉGIO RECURSAL" },
    { downDate: `13/02/2023`, description: "INSTABILIDADE DO PETICIONAMENTO DE INICIAL E INTERMEDIÁRIA DE 1º GRAU" },
    { downDate: `15/02/2023`, description: "INDISPONIBILIDADE DOS SERVIÇOS DO PORTAL E-SAJ" },
    { downDate: `07/03/2023`, description: "INDISPONIBILIDADE NA CONSULTA PROCESSUAL 1ª INSTÂNCIA" },
    { downDate: `16/03/2023`, description: "INDISPONIBILIDADE NA CONSULTA PROCESSUAL DE 1ª E 2ª INSTÂNCIA DO PORTAL E-SAJ" },
    { downDate: `28/03/2023`, description: "INDISPONIBILIDADE PARA AUTENTICAÇÃO NO PORTAL E-SAJ" },
    { downDate: `13/04/2023`, description: "INSTABILIDADE DOS SERVIÇOS DO PORTAL E-SAJ" },
    { downDate: `02/05/2023`, description: "INDISPONIBILIDADE DO PETICIONAMENTO ELETRONICO INICIAL E INTERMEDIÁRIA DE 1º E 2º GRAU E DO COLÉGIO RECURSAL – ERRO CMS.TSP.72." },
    { downDate: `25/05/2023`, description: "INSTABILIDADE DO PETICIONAMENTO DE INICIAL E INTERMEDIÁRIA DE 1º E 2º GRAU E DO COLÉGIO RECURSAL" },
    { downDate: `26/05/2023`, description: "INSTABILIDADE DO PETICIONAMENTO DE INICIAL E INTERMEDIÁRIA DE 1º E 2º GRAU E DO COLÉGIO RECURSAL" },
    { downDate: `12/06/2023`, description: "INDISPONIBILIDADE DOS SERVIÇOS DO PORTAL E-SAJ – ERRO CMS.TSP.72." },
    { downDate: `28/07/2023`, description: "INDISPONIBILIDADE NA CONSULTA PROCESSUAL 1ª INSTÂNCIA" },
    { downDate: `16/08/2023`, description: "INDISPONIBILIDADE NA CONSULTA PROCESSUAL 1ª INSTÂNCIA" },
    { downDate: `18/08/2023`, description: "INDISPONIBILIDADE NA CONSULTA PROCESSUAL 1ª INSTÂNCIA" },
    { downDate: `28/08/2023`, description: "INDISPONIBILIDADE NA CONSULTA PROCESSUAL 1ª INSTÂNCIA" },
    { downDate: `09/10/2023`, description: "INDISPONIBILIDADE NA CONSULTA PROCESSUAL 1ª INSTÂNCIA" },
    { downDate: `10/10/2023`, description: "INDISPONIBILIDADE NA CONSULTA PROCESSUAL 1ª INSTÂNCIA" },
    { downDate: `06/11/2023`, description: "Comunicado nº 435/2023" },
    { downDate: `07/11/2023`, description: "Comunicado nº 435/2023" },
    { downDate: `08/11/2023`, description: "INDISPONIBILIDADE DO PETICIONAMENTO ELETRONICO INICIAL E INTERMEDIÁRIA DE 1º E 2º GRAU E DO COLÉGIO RECURSAL – ERRO CMS.TSP.72." },
    { downDate: `21/11/2023`, description: "INDISPONIBILIDADE NA CONSULTA PROCESSUAL DE 1º GRAU NO PORTAL E-SAJ PARA OS PROCESSOS ALOCADOS NAS BASES PG5EF, PG5REG E PG5PP." },
    { downDate: `29/01/2024`, description: "INDISPONIBILIDADE DOS SERVIÇOS DO PORTAL E-SAJ." },
    { downDate: `15/03/2024`, description: "INDISPONIBILIDADE SEVERA - 1º DIA (Comunicado Conjunto 239/2024)." },
    { downDate: `10/04/2024`, description: "INDISPONIBILIDADE NA CONSULTA DE 1º GRAU" },
    { downDate: `11/04/2024`, description: "INDISPONIBILIDADE NA CONSULTA DE 1º GRAU" },
    { downDate: `07/05/2024`, description: "INDISPONIBILIDADE DO PETICIONAMENTO ELETRÔNICO DE 1º GRAU - ERRO: PETPG - 99" },
    { downDate: `13/05/2024`, description: "INDISPONIBILIDADE DOS SERVIÇOS DO PORTAL E-SAJ" },
    { downDate: `12/06/2024`, description: "12/06/2024 – INDISPONIBILIDADE DO PETICIONAMENTO ELETRÔNICO INICIAL E INTERMEDIÁRIO DE 1º, 2º GRAU E COL RECURSAL - ERRO: PETPG – 70 E 99" },
    { downDate: `20/06/2024`, description: "INDISPONIBILIDADE DE IDENTIFICAÇÃO COM O CERTIFICADO DIGITAL AO PORTAL E-SAJ - ERRO: CERT.CLT.2" },
    { downDate: `10/07/2024`, description: "INDISPONIBILIDADE DOS SERVIÇOS DO PORTAL E-SAJ" },
    { downDate: `11/07/2024`, description: "INDISPONIBILIDADE DOS SERVIÇOS DO PORTAL E-SAJ" },
    { downDate: `12/07/2024`, description: "INDISPONIBILIDADE DOS SERVIÇOS DO PORTAL E-SAJ" },
    { downDate: `30/07/2024`, description: "INDISPONIBILIDADE DOS SERVIÇOS DO PORTAL E-SAJ" },
    { downDate: `31/07/2024`, description: "INDISPONIBILIDADE DOS SERVIÇOS DO PORTAL E-SAJ" },
    { downDate: `04/09/2024`, description: "INDISPONIBILIDADE NA CONSULTA PROCESSUAL DE 1º GRAU DO PORTAL E-SAJ (BASE: JM E BF)" },
    { downDate: `16/09/2024`, description: "INDISPONIBILIDADE DOS SERVIÇOS DO PORTAL E-SAJ - INTEGRADOR CNA (OAB) x e-SAJ (TJSP)" },
    { downDate: `17/09/2024`, description: "INDISPONIBILIDADE DA CONSULTA PROCESSUAL DE 1º E 2º GRAU E DO COLÉGIO RECURSAL" },
    { downDate: `03/10/2024`, description: "INDISPONIBILIDADE DOS SERVIÇOS DO PORTAL E-SAJ" },
    { downDate: `07/10/2024`, description: "INDISPONIBILIDADE DOS SERVIÇOS DO PORTAL E-SAJ" },
    { downDate: `07/11/2024`, description: "INDISPONIBILIDADE DA CONSULTA PROCESSUAL DE 1º GRAU DO PORTAL E-SAJ" },














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



    ''
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

            //fix for previous year
            { holidayDate: `20/12/${i - 1}`, description: "Recesso - Art. 116, § 2º do RITJSP" },
            { holidayDate: `21/12/${i - 1}`, description: "Recesso - Art. 116, § 2º do RITJSP" },
            { holidayDate: `22/12/${i - 1}`, description: "Recesso - Art. 116, § 2º do RITJSP" },
            { holidayDate: `23/12/${i - 1}`, description: "Recesso - Art. 116, § 2º do RITJSP" },
            { holidayDate: `24/12/${i - 1}`, description: "Recesso - Art. 116, § 2º do RITJSP" },
            { holidayDate: `25/12/${i - 1}`, description: "Recesso - Art. 116, § 2º do RITJSP" },
            { holidayDate: `26/12/${i - 1}`, description: "Recesso - Art. 116, § 2º do RITJSP" },
            { holidayDate: `27/12/${i - 1}`, description: "Recesso - Art. 116, § 2º do RITJSP" },
            { holidayDate: `28/12/${i - 1}`, description: "Recesso - Art. 116, § 2º do RITJSP" },
            { holidayDate: `29/12/${i - 1}`, description: "Recesso - Art. 116, § 2º do RITJSP" },
            { holidayDate: `30/12/${i - 1}`, description: "Recesso - Art. 116, § 2º do RITJSP" },
            { holidayDate: `31/12/${i - 1}`, description: "Recesso - Art. 116, § 2º do RITJSP" },


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
            { holidayDate: (Easter(i)).add(61, "days").format('DD/MM/YYYY'), description: "Emenda de Corpus Christi" },

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
            { holidayDate: i >= 2023 ? `20/11/${i}` : ``, description: i >= 2023 ? "Consciência Negra" : '' },
            { holidayDate: `25/12/${i}`, description: "Natal" },

            //SEVERE SYSTEM DOWN
            { holidayDate: `06/11/2023`, description: "Suspensão de Prazo - Comunicado nº 435/2023 (DJE de 07/11/2023, Caderno Administrativo, pág. 1)" },
            { holidayDate: `07/11/2023`, description: "Suspensão de Prazo - Comunicado nº 435/2023 (DJE de 07/11/2023, Caderno Administrativo, pág. 1)" },
            { holidayDate: `18/03/2024`, description: "Suspensão de Prazo - Comunicado Conjunto nº 293/2024 (DJE de 03/04/2024, Caderno Administrativo, pág. 4)" },
            { holidayDate: `19/03/2024`, description: "Suspensão de Prazo - Comunicado Conjunto nº 293/2024 (DJE de 03/04/2024, Caderno Administrativo, pág. 4)" },
            { holidayDate: `20/03/2024`, description: "Suspensão de Prazo - Comunicado Conjunto nº 293/2024 (DJE de 03/04/2024, Caderno Administrativo, pág. 4)" },
            { holidayDate: `21/03/2024`, description: "Suspensão de Prazo - Comunicado Conjunto nº 293/2024 (DJE de 03/04/2024, Caderno Administrativo, pág. 4)" },
            { holidayDate: `22/03/2024`, description: "Suspensão de Prazo - Comunicado Conjunto nº 293/2024 (DJE de 03/04/2024, Caderno Administrativo, pág. 4)" },



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
            //alterado por conta da mudança da data do feriado em 2023 { holidayDate: `11/07/${i}`, description: "São Bento, Padroeiro da Cidade", city: "Marília" }




        );
        //Update - Dia do Padroeiro 2023
        cityHolidays.push(
            {
                holidayDate: currentYear == 2023 ? "10/07/2023" : currentYear == 2024 ? "08/07/2024" : `11/07/${currentYear}`,
                description: currentYear == 2023 ? 'São Bento, Padroeiro da Cidade (2023)- Decreto Municipal nº 14.066/2023 ' : currentYear == 2024 ? 'São Bento, Padroeiro da Cidade (2024)- Decreto Municipal nº 14.381/2024' : "São Bento, Padroeiro da Cidade",
                city: 'Marília'
            }
        );


        stateHolidays.push(
            { holidayDate: currentYear == 2020 ? "" : `09/07/${i}`, description: currentYear == 2020 ? '' : "Revolução Constitucionalista de São Paulo", state: 'SP' }
        );

    }
    return { estado, stateHolidays, cityHolidays, nationalHolidays };
}
