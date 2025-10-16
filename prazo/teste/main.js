// Aguarda o carregamento completo do DOM para executar o script
document.addEventListener('DOMContentLoaded', () => {

    // #region INICIALIZAÇÃO E CONFIGURAÇÃO DE PLUGINS
    // =================================================

    // Configura o Moment.js para o local 'pt-br'
    moment.locale('pt-br');

    // Inicializa o plugin Bootstrap Select nos selects que o necessitam
    $('#floatingSelect, #countType').selectpicker();

    // Inicializa os tooltips do Bootstrap
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));

    // Configura a máscara de data para o campo de data inicial
    const dateInput = document.getElementById('initialDate');
    const dateMask = IMask(dateInput, {
        mask: Date,
        pattern: 'd/`m/`Y',
        lazy: false,
        autofix: true,
        blocks: {
            d: { mask: IMask.MaskedRange, from: 1, to: 31, maxLength: 2 },
            m: { mask: IMask.MaskedRange, from: 1, to: 12, maxLength: 2 },
            Y: { mask: IMask.MaskedRange, from: 1900, to: 2100, maxLength: 4 }
        },
        format: date => moment(date).format('DD/MM/YYYY'),
        parse: str => moment(str, 'DD/MM/YYYY')
    });

    // Configura o Datepicker para o campo de data
    const datepicker = new Datepicker(dateInput, {
        buttonClass: 'btn',
        autohide: true,
        format: 'dd/mm/yyyy',
        language: 'pt-BR',
    });
    // #endregion

    // #region ELEMENTOS DO DOM
    // =================================================
    const deadlineForm = document.getElementById('deadlineCalc');
    const resultsDiv = document.getElementById('results');
    const daysInput = document.getElementById('days');
    const countTypeSelect = document.getElementById('countType');
    const initialDateInput = document.getElementById('initialDate');
    const calcTypeSelect = document.getElementById('calcType');
    const countFormatLabel = document.getElementById('countFormatLabel');
    // #endregion

    // #region EVENT LISTENERS (Ações do Usuário)
    // =================================================

    // Aciona o Datepicker ao clicar no ícone do calendário
    document.getElementById('calendar-icon').addEventListener('click', () => {
        datepicker.show();
    });

    // Lógica para os botões de incremento/decremento de dias
    document.getElementById('minus-btn').addEventListener('click', () => updateDays(-1));
    document.getElementById('plus-btn').addEventListener('click', () => updateDays(1));

    // Atualiza o label da data inicial quando o tipo de contagem muda
    countTypeSelect.addEventListener('change', updateInitialDateLabel);

    // Lida com a submissão do formulário
    deadlineForm.addEventListener('submit', (e) => {
        e.preventDefault();
        // Esconde resultados antigos antes de calcular
        $('#collapseReport').collapse('hide');
        $('#collapseCalendar').collapse('hide');

        setTimeout(() => {
            calculateResults();
            // Rola a tela suavemente para os resultados
            resultsDiv.scrollIntoView({ behavior: 'smooth' });
        }, 100); // Pequeno delay para a UI responder
    });

    // Limpa o formulário e os resultados
    document.getElementById('reset1').addEventListener('click', () => {
        deadlineForm.reset();
        dateMask.value = '';
        resultsDiv.style.display = 'none';
        $('#countType').selectpicker('render'); // Atualiza o selectpicker
    });

    // Associa funções aos botões de cópia e impressão
    document.getElementById('printBtn').addEventListener('click', printDivs);
    document.getElementById('copyAllBtn').addEventListener('click', () => copyContentToImage(['#printResults', '#listReport']));
    document.getElementById('copyListBtn').addEventListener('click', () => copyContentToImage(['#listReport']));

    // Inicia o tutorial
    document.getElementById('tutorial-icon').addEventListener('click', () => introJsFunc());

    // Ajusta o valor do campo "dias" para 15 se a Citação no Portal for selecionada
    countTypeSelect.addEventListener('change', () => {
        if (countTypeSelect.value === '3') {
            daysInput.value = 15;
        }
    });

    // #endregion

    // #region LÓGICA DE MANIPULAÇÃO DO FORMULÁRIO
    // =================================================

    /**
     * Atualiza o campo de dias com base em passos predefinidos.
     * @param {number} direction - 1 para aumentar, -1 para diminuir.
     */
    function updateDays(direction) {
        const steps = [1, 2, 3, 5, 10, 15, 30, 60, 90, 180, 365];
        let currentValue = parseInt(daysInput.value) || 0;

        if (direction === 1) { // Aumentar
            let nextStep = steps.find(step => step > currentValue);
            daysInput.value = nextStep || (currentValue + 1);
        } else { // Diminuir
            let prevStep = [...steps].reverse().find(step => step < currentValue);
            daysInput.value = prevStep || 1;
        }
    }

    /**
     * Atualiza o texto do label da data inicial.
     */
    function updateInitialDateLabel() {
        const selectedOption = countTypeSelect.options[countTypeSelect.selectedIndex];
        const selectedText = selectedOption.textContent;
        countFormatLabel.textContent = `Data ${selectedText}`;
    }

    // #endregion

    // #region LÓGICA DE CÁLCULO DE PRAZOS (O CORAÇÃO DA APLICAÇÃO)
    // =================================================================

    let myHolidays = [];

    function calculateResults() {
        // 1. Coleta de dados do formulário
        const initialDate = moment(initialDateInput.value, 'DD/MM/YYYY');
        const days = parseInt(daysInput.value);
        const calcType = calcTypeSelect.value;
        const countType = countTypeSelect.value;
        const chosenCity = 'Marília';

        if (!initialDate.isValid() || isNaN(days)) {
            alert('Por favor, preencha a data inicial e os dias corretamente.');
            return;
        }

        // 2. Configuração de feriados
        const currentYear = initialDate.year();
        const expectedFinalYear = moment(initialDate).add(days * 2, 'days').year();
        const { stateHolidays, cityHolidays, nationalHolidays } = holidaysFunc(currentYear, expectedFinalYear);

        myHolidays = [...nationalHolidays, ...stateHolidays, ...amendment];
        const specificCityHolidays = cityHolidays.filter(h => h.city === chosenCity);
        myHolidays.push(...specificCityHolidays);

        moment.updateLocale('pt-br', {
            holidays: myHolidays.map(h => h.holidayDate).filter(Boolean),
            holidayFormat: 'DD/MM/YYYY'
        });

        // 3. Ajuste da data de início do cálculo
        let dateForCalc = moment(initialDate);
        let dispDate = null;

        if (countType === '1') {
            dispDate = moment(dateForCalc);
            dateForCalc = dateForCalc.businessAdd(1);
        } else if (countType === '3') {
            dispDate = moment(dateForCalc);
            dateForCalc = dateForCalc.businessAdd(5);
        }

        // 4. Cálculo da data final
        let dueDate;
        if (calcType === 'workingDays') {
            dueDate = moment(dateForCalc).businessAdd(days);
        } else if (calcType === 'months') {
            dueDate = moment(dateForCalc).add(days, 'months');
        } else {
            dueDate = moment(dateForCalc).add(days, 'days');
        }

        // 5. Ajuste da data final (prorrogação)
        if (calcType !== 'workingDays' && !dueDate.isBusinessDay()) {
            dueDate.businessAdd(1);
        }

        while (isSystemDown(dueDate)) {
            dueDate.businessAdd(1);
        }

        // 6. Geração do relatório
        const reportDays = generateReportDays(initialDate, dateForCalc, dueDate, dispDate, days, calcType, countType);

        // 7. Renderização dos resultados
        renderSummary(initialDate, dueDate, days, calcType, countType, chosenCity, dispDate);
        renderReportTable(reportDays);
        renderInlineCalendar(reportDays, dueDate);

        resultsDiv.style.display = 'block';
    }

    /**
     * Gera a lista detalhada de cada dia no período de contagem.
     */
    function generateReportDays(initialDate, startDate, finalDate, dispDate, totalDays, calcType, countType) {
        const daysList = [];
        let dayCounter = 0;

        if (dispDate) {
            if (countType === '1') {
                daysList.push({ date: dispDate.format('DD/MM/YYYY'), index: '-', description: 'Data da Disponibilização no DJE (não conta)', class: 'start' });
            }
            if (countType === '3') {
                daysList.push({ date: dispDate.format('DD/MM/YYYY'), index: '-', description: 'Data da Confirmação da Citação', class: 'start' });
                for (let i = 1; i < 5; i++) {
                    let nonCountingDay = moment(dispDate).businessAdd(i);
                    daysList.push({ date: nonCountingDay.format('DD/MM/YYYY'), index: '-', description: `${i}º dia útil (não conta)`, class: 'start' });
                }
            }
        }

        let initialDayDesc = 'Dia do ato (não conta)';
        if (countType === '1' || countType === '2') initialDayDesc = 'Data da Publicação no DJE (não conta)';
        if (countType === '3') initialDayDesc = 'Início do Prazo (art. 231, IX, do CPC)';
        daysList.push({ date: startDate.format('DD/MM/YYYY'), index: '-', description: initialDayDesc, class: 'start' });

        let currentDate = moment(startDate).add(1, 'day');

        while (currentDate.isSameOrBefore(finalDate)) {
            let dayClass = 'count';
            let description = currentDate.format('dddd');
            let index = '-';

            const isHoliday = currentDate.isHoliday();
            const isWeekend = !currentDate.isBusinessDay() && !isHoliday;
            const isDown = isSystemDown(currentDate);

            let counts = (calcType === 'workingDays') ? (currentDate.isBusinessDay() && !isDown) : true;

            if (isHoliday) {
                description = holidayName(currentDate);
                dayClass = 'holiday';
            } else if (isWeekend) {
                dayClass = 'weekend';
            } else if (isDown && currentDate.isSameOrAfter(startDate)) {
                description = downDateDescription(currentDate);
                dayClass = 'prorogation';
                if (calcType !== 'workingDays') counts = false;
            }

            if (counts && dayCounter < totalDays) {
                dayCounter++;
                index = `<b>${dayCounter}</b>`;
            }

            if (currentDate.isSame(finalDate, 'day')) {
                description += ' (Fim do Prazo)';
                dayClass = 'end';
                if (dayCounter < totalDays) index = `<b>${totalDays}</b>`;
            }

            daysList.push({ date: currentDate.format('DD/MM/YYYY'), index, description, class: dayClass });
            currentDate.add(1, 'day');
        }

        return daysList;
    }

    // #endregion

    // #region FUNÇÕES DE RENDERIZAÇÃO
    // =================================================================

    function renderSummary(initial, final, days, calcT, countT, city, dispD) {
        const calcTypeText = $(calcTypeSelect).find('option:selected').text();
        const countTypeText = $(countTypeSelect).find('option:selected').text();

        let extraRow = '';
        if (countT === '1') {
            extraRow = '<tr><td>Data da Publicação:</td><td>' + moment(initial).businessAdd(1).format("DD/MM/YYYY") + '</td></tr>';
        } else if (countT === '3') {
            extraRow = '<tr><td>Início do Prazo (art. 231, IX, do CPC):</td><td>' + moment(dispD).businessAdd(5).format('DD/MM/YYYY') + '</td></tr>';
        }

        const html = '<h3 class="text-muted">Prazo Final:</h3>' +
            '<h2 class="display-4">' + final.format("DD/MM/YYYY") + '</h2>' +
            '<h5 class="mt-4 text-center">Dados da Contagem</h5>' +
            '<table class="table table-sm table-bordered mt-3 text-start">' +
            '<tbody>' +
            '<tr><td>Comarca:</td><td>' + city + '</td></tr>' +
            '<tr><td>Forma da Contagem:</td><td>' + calcTypeText + '</td></tr>' +
            '<tr><td>Data ' + countTypeText + ':</td><td>' + initial.format("DD/MM/YYYY") + '</td></tr>' +
            extraRow +
            '<tr><td>Dias de Prazo:</td><td>' + days + '</td></tr>' +
            '<tr class="table-primary"><td><strong>Prazo Final:</strong></td><td><strong>' + final.format("DD/MM/YYYY") + '</strong></td></tr>' +
            '</tbody>' +
            '</table>';
        document.getElementById('printResults').innerHTML = html;
    }

    function renderReportTable(reportDays) {
        let rowsHtml = reportDays.map(day => {
            return '<tr class="' + (day.class === 'end' ? 'table-info' : '') + '">' +
                '<td class="text-center">' + day.index + '</td>' +
                '<td>' + day.date + '</td>' +
                '<td>' + day.description + '</td>' +
                '</tr>';
        }).join('');

        const tableHtml = '<table class="table table-hover table-sm">' +
            '<thead class="table-light">' +
            '<tr>' +
            '<th class="text-center" scope="col">#</th>' +
            '<th scope="col">Data</th>' +
            '<th scope="col">Descrição</th>' +
            '</tr>' +
            '</thead>' +
            '<tbody>' +
            rowsHtml +
            '</tbody>' +
            '</table>';
        document.getElementById('listReport').innerHTML = tableHtml;
    }

    function renderInlineCalendar(reportDays, finalDate) {
        const calendarEl = document.getElementById('inlineCalendar');
        if (calendarEl.datepicker) {
            calendarEl.datepicker.destroy();
        }

        new Datepicker(calendarEl, {
            autohide: false,
            format: 'dd/mm/yyyy',
            language: 'pt-BR',
            defaultViewDate: finalDate.toDate(),
            daysOfWeekHighlighted: [0, 6],
            beforeShowDay: (date) => {
                const dateStr = moment(date).format('DD/MM/YYYY');
                const dayInfo = reportDays.find(d => d.date === dateStr);

                if (dayInfo) {
                    return {
                        classes: `cal-${dayInfo.class}`,
                        tooltip: dayInfo.description,
                    };
                }
                if (date.getDay() === 0 || date.getDay() === 6) {
                    return { classes: 'cal-weekend' };
                }
            }
        });
    }

    // #endregion

    // #region FUNÇÕES UTILITÁRIAS
    // =================================================================

    function showToast(message = 'Ação concluída com sucesso.') {
        const toastEl = document.getElementById('liveToast');
        const toastBody = toastEl.querySelector('.toast-body');
        if (toastBody) toastBody.textContent = message;
        new bootstrap.Toast(toastEl).show();
    }

    function printDivs() {
        const printContent = document.getElementById('printResults').innerHTML + document.getElementById('listReport').innerHTML;
        const printWindow = window.open('', '', 'height=800,width=1200');
        const htmlParts = [
            '<html><head><title>Relatório de Prazo</title>',
            '<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">',
            '<style>body{padding:1rem}table{font-size:.9rem}h2{font-size:1.5rem}h3,h5{font-size:1.2rem;text-align:center}</style>',
            '</head><body onafterprint="window.close()">',
            printContent,
            '</body></html>'
        ];
        printWindow.document.write(htmlParts.join(''));
        printWindow.document.close();
        printWindow.print();
    }

    async function copyContentToImage(selectors) {
        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'absolute';
        tempContainer.style.left = '-9999px';
        tempContainer.style.padding = '1rem';
        tempContainer.style.backgroundColor = 'white';

        selectors.forEach(selector => {
            const element = document.querySelector(selector);
            if (element) tempContainer.innerHTML += element.innerHTML;
        });

        document.body.appendChild(tempContainer);

        try {
            const canvas = await html2canvas(tempContainer, { scale: 2 });
            const imageUrl = canvas.toDataURL('image/png');

            const newWindow = window.open();
            const htmlParts = [
                '<html><head><title>Copiar Imagem do Relatório</title></head>',
                '<body style="margin:0; text-align:center; background-color:#f0f0f0; padding: 1rem;">',
                '<p style="font-family:sans-serif;">Clique com o botão direito na imagem e selecione "Copiar Imagem".</p>',
                '<img src="', imageUrl, '" alt="Relatório de Prazo" style="max-width:95%; border:1px solid #ccc;"/>',
                '</body></html>'
            ];
            newWindow.document.write(htmlParts.join(''));
            newWindow.document.close();
            showToast('A imagem foi aberta em uma nova aba para cópia.');

        } catch (err) {
            console.error('Erro ao gerar imagem:', err);
            alert('Ocorreu um erro ao tentar gerar a imagem.');
        } finally {
            document.body.removeChild(tempContainer);
        }
    }

    function holidayName(date) {
        const holiday = myHolidays.find(h => h.holidayDate === date.format('DD/MM/YYYY'));
        return holiday ? holiday.description : 'Feriado';
    }

    function isSystemDown(date) {
        return sistDown.some(down => down.downDate === date.format('DD/MM/YYYY'));
    }

    function downDateDescription(date) {
        const down = sistDown.find(d => d.downDate === date.format('DD/MM/YYYY'));
        return down ? down.description : 'Indisponibilidade do Sistema';
    }

    // #endregion

    // #region DADOS (Feriados e Indisponibilidades)
    // =================================================
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
        { holidayDate: "02/05/2025", description: "Suspensão de expediente (Prov. CSM 2765/2024)" },
        { holidayDate: "20/06/2025", description: "Suspensão de expediente (Prov. CSM 2765/2024)" },
        { holidayDate: "21/11/2025", description: "Suspensão de expediente (Prov. CSM 2765/2024)" },
    ];

    const sistDown = [
        { downDate: '09/02/2022', description: "INSTABILIDADE DO PETICIONAMENTO DE INICIAL E INTERMEDIÁRIA DE 1º E 2º GRAU" },
        { downDate: '10/03/2022', description: "INTERMITÊNCIA NA PASTA DIGITAL DO PORTAL E-SAJ" },
        { downDate: '25/03/2022', description: "INSTABILIDADE DO PETICIONAMENTO DE INICIAL E INTERMEDIÁRIA DE 1º E 2º GRAU" },
        { downDate: '28/03/2022', description: "INSTABILIDADE DO PETICIONAMENTO DE INICIAL E INTERMEDIÁRIA DE 1º E 2º GRAU" },
        { downDate: '29/03/2022', description: "INSTABILIDADE DO PETICIONAMENTO INTERMEDIÁRIO PARA PROCESSOS INCIDENTAIS DE 1º E 2º GRAU" },
        { downDate: '30/03/2022', description: "INSTABILIDADE DO PETICIONAMENTO INTERMEDIÁRIO PARA PROCESSOS INCIDENTAIS DE 1º E 2º GRAU" },
        { downDate: '31/03/2022', description: "INSTABILIDADE DO PETICIONAMENTO INTERMEDIÁRIO PARA PROCESSOS INCIDENTAIS DE 1º E 2º GRAU" },
        { downDate: '04/04/2022', description: "INSTABILIDADE DO PETICIONAMENTO INTERMEDIÁRIO PARA PROCESSOS INCIDENTAIS DE 1º E 2º GRAU" },
        { downDate: '06/04/2022', description: "INSTABILIDADE DO PETICIONAMENTO DE INICIAL E INTERMEDIÁRIA DE 1º E 2º GRAU" },
        { downDate: '07/04/2022', description: "INSTABILIDADE DO PETICIONAMENTO DE INICIAL E INTERMEDIÁRIA DE 1º E 2º GRAU" },
        { downDate: '08/04/2022', description: "INSTABILIDADE DO PETICIONAMENTO DE INICIAL E INTERMEDIÁRIA DE 1º E 2º GRAU" },
        { downDate: '09/04/2022', description: "INSTABILIDADE DO PETICIONAMENTO DE INICIAL E INTERMEDIÁRIA DE 1º E 2º GRAU" },
        { downDate: '10/04/2022', description: "INSTABILIDADE DO PETICIONAMENTO DE INICIAL E INTERMEDIÁRIA DE 1º E 2º GRAU" },
        { downDate: '11/04/2022', description: "INSTABILIDADE DO PETICIONAMENTO DE INICIAL E INTERMEDIÁRIA DE 1º E 2º GRAU" },
        { downDate: '12/04/2022', description: "INSTABILIDADE DO PETICIONAMENTO DE INICIAL E INTERMEDIÁRIA DE 1º E 2º GRAU" },
        { downDate: '13/04/2022', description: "INSTABILIDADE DO PETICIONAMENTO DE INICIAL E INTERMEDIÁRIA DE 1º E 2º GRAU" },
        { downDate: '14/04/2022', description: "INSTABILIDADE DO PETICIONAMENTO DE INICIAL E INTERMEDIÁRIA DE 1º E 2º GRAU" },
        { downDate: '15/04/2022', description: "INSTABILIDADE DO PETICIONAMENTO DE INICIAL E INTERMEDIÁRIA DE 1º E 2º GRAU" },
        { downDate: '16/04/2022', description: "INSTABILIDADE DO PETICIONAMENTO DE INICIAL E INTERMEDIÁRIA DE 1º E 2º GRAU" },
        { downDate: '17/04/2022', description: "INSTABILIDADE DO PETICIONAMENTO DE INICIAL E INTERMEDIÁRIA DE 1º E 2º GRAU" },
        { downDate: '18/04/2022', description: "INSTABILIDADE DO PETICIONAMENTO DE INICIAL E INTERMEDIÁRIA DE 1º E 2º GRAU" },
        { downDate: '19/04/2022', description: "INSTABILIDADE DO PETICIONAMENTO DE INICIAL E INTERMEDIÁRIA DE 1º E 2º GRAU" },
        { downDate: '20/04/2022', description: "INSTABILIDADE DO PETICIONAMENTO DE INICIAL E INTERMEDIÁRIA DE 1º E 2º GRAU" },
        { downDate: '09/05/2022', description: "INDISPONIBILIDADE PARA DOWNLOAD DOS AUTOS EM 1º, 2º GRAU E COL. RECURSAL" },
        { downDate: '13/05/2022', description: "INDISPONIBILIDADE NA CONSULTA PROCESSUAL DE 1ª E 2ª INSTÂNCIAS E DO COLÉGIO RECURSAL" },
        { downDate: '13/06/2022', description: "INDISPONIBILIDADE NA CONSULTA PROCESSUAL DE 1ª INSTÂNCIA" },
        { downDate: `16/05/2022`, description: "INDISPONIBILIDADE SEVERA NA PASTA DIGITAL DO PORTAL E-SAJ" },
        { downDate: '29/06/2022', description: "INSTABILIDADE PARA VISUALIZAÇÃO E DOWNLOAD DOS AUTOS EM 1º GRAU" },
        { downDate: '01/07/2022', description: "INDISPONIBILIDADE NA CONSULTA PROCESSUAL E PETICIONAMENTO DE 1ª, 2ª INSTÂNCIA E COL. RECURSAL" },
        { downDate: '11/07/2022', description: "INDISPONIBILIDADE NA CONSULTA PROCESSUAL DOS PROCESSOS DE 1ª INSTÂNCIA" },
        { downDate: '13/07/2022', description: "INDISPONIBILIDADE NA CONSULTA PROCESSUAL E PETICIONAMENTO DE 1ª, 2ª INSTÂNCIA E COL. RECURSAL" },
        { downDate: `18/07/2022`, description: "INDISPONIBILIDADE SEVERA NA PASTA DIGITAL DO PORTAL E-SAJ" },
        { downDate: `20/07/2022`, description: "INDISPONIBILIDADE SEVERA NA PASTA DIGITAL DO PORTAL E-SAJ" },
        { downDate: `08/08/2022`, description: "MANUTENÇÃO PREVENTIVA IMPRESCINDÍVEL DO DATACENTER - INDISPONIBILIDADE DE SISTEMAS" },
        { downDate: `30/09/2022`, description: "INDISPONIBILIDADE DE AUTENTICAÇÃO NO PORTAL E-SAJ" },
        { downDate: `25/10/2022`, description: "INDISPONIBILIDADE DO PETICIONAMENTO ELETRÔNICO INICIAL E INTERMEDIÁRIO DE 1º GRAU" },
        { downDate: `26/10/2022`, description: "INDISPONIBILIDADE DO PETICIONAMENTO ELETRÔNICO INICIAL E INTERMEDIÁRIO DE 1º GRAU" },
        { downDate: `24/11/2022`, description: "Encerramento de expediente antecipado - Provimento CSM nº 2.672/2022" },
        { downDate: `28/11/2022`, description: "INDISPONIBILIDADE NA CONSULTA PROCESSUAL 1ª INSTÂNCIA" },
        { downDate: `02/12/2022`, description: "Encerramento de expediente antecipado - Provimento CSM nº 2.672/2022" },
        { downDate: `05/12/2022`, description: "Encerramento de expediente antecipado - Provimento CSM nº 2.672/2022" },
        { downDate: `19/01/2023`, description: "INDISPONIBILIDADE NA CONSULTA PROCESSUAL DE 1ª INSTÂNCIA" },
        { downDate: `27/01/2023`, description: "INSTABILIDADE DO PETICIONAMENTO DE 1º E 2º GRAU" },
        { downDate: `13/02/2023`, description: "INSTABILIDADE DO PETICIONAMENTO DE 1º GRAU" },
        { downDate: `15/02/2023`, description: "INDISPONIBILIDADE DOS SERVIÇOS DO PORTAL E-SAJ" },
        { downDate: `07/03/2023`, description: "INDISPONIBILIDADE NA CONSULTA PROCESSUAL 1ª INSTÂNCIA" },
        { downDate: `16/03/2023`, description: "INDISPONIBILIDADE NA CONSULTA PROCESSUAL DE 1ª E 2ª INSTÂNCIA" },
        { downDate: `28/03/2023`, description: "INDISPONIBILIDADE PARA AUTENTICAÇÃO NO PORTAL E-SAJ" },
        { downDate: `13/04/2023`, description: "INSTABILIDADE DOS SERVIÇOS DO PORTAL E-SAJ" },
        { downDate: `02/05/2023`, description: "INDISPONIBILIDADE DO PETICIONAMENTO ELETRONICO" },
        { downDate: `25/05/2023`, description: "INSTABILIDADE DO PETICIONAMENTO" },
        { downDate: `26/05/2023`, description: "INSTABILIDADE DO PETICIONAMENTO" },
        { downDate: `12/06/2023`, description: "INDISPONIBILIDADE DOS SERVIÇOS DO PORTAL E-SAJ" },
        { downDate: `28/07/2023`, description: "INDISPONIBILIDADE NA CONSULTA PROCESSUAL 1ª INSTÂNCIA" },
        { downDate: `16/08/2023`, description: "INDISPONIBILIDADE NA CONSULTA PROCESSUAL 1ª INSTÂNCIA" },
        { downDate: `18/08/2023`, description: "INDISPONIBILIDADE NA CONSULTA PROCESSUAL 1ª INSTÂNCIA" },
        { downDate: `28/08/2023`, description: "INDISPONIBILIDADE NA CONSULTA PROCESSUAL 1ª INSTÂNCIA" },
        { downDate: `09/10/2023`, description: "INDISPONIBILIDADE NA CONSULTA PROCESSUAL 1ª INSTÂNCIA" },
        { downDate: `10/10/2023`, description: "INDISPONIBILIDADE NA CONSULTA PROCESSUAL 1ª INSTÂNCIA" },
        { downDate: `06/11/2023`, description: "Comunicado nº 435/2023" },
        { downDate: `07/11/2023`, description: "Comunicado nº 435/2023" },
        { downDate: `08/11/2023`, description: "INDISPONIBILIDADE DO PETICIONAMENTO ELETRONICO" },
        { downDate: `21/11/2023`, description: "INDISPONIBILIDADE NA CONSULTA PROCESSUAL DE 1º GRAU" },
        { downDate: `29/01/2024`, description: "INDISPONIBILIDADE DOS SERVIÇOS DO PORTAL E-SAJ" },
        { downDate: `15/03/2024`, description: "INDISPONIBILIDADE SEVERA - 1º DIA (Comunicado Conjunto 239/2024)" },
        { downDate: `10/04/2024`, description: "INDISPONIBILIDADE NA CONSULTA DE 1º GRAU" },
        { downDate: `11/04/2024`, description: "INDISPONIBILIDADE NA CONSULTA DE 1º GRAU" },
        { downDate: `07/05/2024`, description: "INDISPONIBILIDADE DO PETICIONAMENTO ELETRÔNICO DE 1º GRAU" },
        { downDate: `13/05/2024`, description: "INDISPONIBILIDADE DOS SERVIÇOS DO PORTAL E-SAJ" },
        { downDate: `12/06/2024`, description: "INDISPONIBILIDADE DO PETICIONAMENTO ELETRÔNICO" },
        { downDate: `20/06/2024`, description: "INDISPONIBILIDADE DE IDENTIFICAÇÃO COM CERTIFICADO DIGITAL" },
        { downDate: `10/07/2024`, description: "INDISPONIBILIDADE DOS SERVIÇOS DO PORTAL E-SAJ" },
        { downDate: `11/07/2024`, description: "INDISPONIBILIDADE DOS SERVIÇOS DO PORTAL E-SAJ" },
        { downDate: `12/07/2024`, description: "INDISPONIBILIDADE DOS SERVIÇOS DO PORTAL E-SAJ" },
        { downDate: `30/07/2024`, description: "INDISPONIBILIDADE DOS SERVIÇOS DO PORTAL E-SAJ" },
        { downDate: `31/07/2024`, description: "INDISPONIBILIDADE DOS SERVIÇOS DO PORTAL E-SAJ" },
        { downDate: `04/09/2024`, description: "INDISPONIBILIDADE NA CONSULTA PROCESSUAL DE 1º GRAU" },
        { downDate: `16/09/2024`, description: "INDISPONIBILIDADE DOS SERVIÇOS DO PORTAL E-SAJ - INTEGRADOR CNA (OAB)" },
        { downDate: `17/09/2024`, description: "INDISPONIBILIDADE DA CONSULTA PROCESSUAL" },
        { downDate: `03/10/2024`, description: "INDISPONIBILIDADE DOS SERVIÇOS DO PORTAL E-SAJ" },
        { downDate: `07/10/2024`, description: "INDISPONIBILIDADE DOS SERVIÇOS DO PORTAL E-SAJ" },
        { downDate: `07/11/2024`, description: "INDISPONIBILIDADE DA CONSULTA PROCESSUAL DE 1º GRAU" },
        { downDate: `21/11/2024`, description: "INDISPONIBILIDADE DOS SERVIÇOS DO PORTAL E-SAJ - INTEGRADOR CNA (OAB)" },
        { downDate: `22/11/2024`, description: "INDISPONIBILIDADE NOS SERVIÇOS DO PORTAL E-SAJ" },
        { downDate: `23/11/2024`, description: "INDISPONIBILIDADE NOS SERVIÇOS DO PORTAL E-SAJ" },
        { downDate: `24/11/2024`, description: "INDISPONIBILIDADE NOS SERVIÇOS DO PORTAL E-SAJ" },
        { downDate: `25/11/2024`, description: "INDISPONIBILIDADE NOS SERVIÇOS DO PORTAL E-SAJ" },
        { downDate: `26/11/2024`, description: "INDISPONIBILIDADE NOS SERVIÇOS DO PORTAL E-SAJ" },
        { downDate: `09/12/2024`, description: "INDISPONIBILIDADE DOS SERVIÇOS DE CONSULTA PROCESSUAL" },
        { downDate: `12/12/2024`, description: "INDISPONIBILIDADE NOS SERVIÇOS DO PORTAL E-SAJ" },
    ];

    /**
     * Calcula a data da Páscoa para um determinado ano.
     */
    function Easter(Y) {
        const C = Math.floor(Y / 100);
        const N = Y - 19 * Math.floor(Y / 19);
        const K = Math.floor((C - 17) / 25);
        let I = C - Math.floor(C / 4) - Math.floor((C - K) / 3) + 19 * N + 15;
        I = I - 30 * Math.floor(I / 30);
        I = I - Math.floor(I / 28) * (1 - Math.floor(I / 28) * Math.floor(29 / (I + 1)) * Math.floor((21 - N) / 11));
        let J = Y + Math.floor(Y / 4) + I + 2 - C + Math.floor(C / 4);
        J = J - 7 * Math.floor(J / 7);
        const L = I - J;
        const M = 3 + Math.floor((L + 40) / 44);
        const D = L + 28 - 31 * Math.floor(M / 4);
        return moment([Y, M - 1, D]);
    }

    /**
     * Gera listas de feriados para um intervalo de anos.
     */
    function holidaysFunc(startYear, endYear) {
        const cityHolidays = [], stateHolidays = [], nationalHolidays = [];

        for (let i = startYear; i <= endYear; i++) {
            const easterDate = Easter(i);
            // Feriados Nacionais (incluindo Recesso Forense)
            nationalHolidays.push(
                ...Array.from({ length: 12 }, (_, d) => ({ holidayDate: `${d + 20}/12/${i}`, description: "Recesso Forense" })),
                ...Array.from({ length: 6 }, (_, d) => ({ holidayDate: `0${d + 1}/01/${i}`, description: "Recesso Forense" })),
                ...Array.from({ length: 14 }, (_, d) => ({ holidayDate: `${String(d + 7).padStart(2, '0')}/01/${i}`, description: "Suspensão CPC (art. 220)" })),
                { holidayDate: `01/01/${i}`, description: "Confraternização Universal" },
                { holidayDate: easterDate.clone().subtract(47, "days").format('DD/MM/YYYY'), description: "Carnaval" },
                { holidayDate: easterDate.clone().subtract(48, "days").format('DD/MM/YYYY'), description: "Véspera de Carnaval" },
                { holidayDate: easterDate.clone().subtract(2, "days").format('DD/MM/YYYY'), description: "Sexta-feira Santa" },
                { holidayDate: easterDate.clone().add(60, "days").format('DD/MM/YYYY'), description: "Corpus Christi" },
                { holidayDate: `21/04/${i}`, description: "Tiradentes" },
                { holidayDate: `01/05/${i}`, description: "Dia do Trabalhador" },
                { holidayDate: `07/09/${i}`, description: "Independência do Brasil" },
                { holidayDate: `12/10/${i}`, description: "Nossa Senhora Aparecida" },
                { holidayDate: `02/11/${i}`, description: "Finados" },
                { holidayDate: `15/11/${i}`, description: "Proclamação da República" },
                { holidayDate: i >= 2023 ? `20/11/${i}` : '', description: i >= 2023 ? "Consciência Negra" : '' },
                { holidayDate: `25/12/${i}`, description: "Natal" },
                { holidayDate: `28/10/${i}`, description: 'Dia do Servidor Público' },
                { holidayDate: `08/12/${i}`, description: 'Dia da Justiça' },
            );
            // Feriados Estaduais (SP)
            stateHolidays.push({ holidayDate: `09/07/${i}`, description: "Revolução Constitucionalista", state: 'SP' });

            // Feriados Municipais (Marília)
            cityHolidays.push(
                { holidayDate: `04/04/${i}`, description: "Aniversário de Marília", city: "Marília" },
                {
                    holidayDate: i === 2023 ? "10/07/2023" : i === 2024 ? "08/07/2024" : `11/07/${i}`,
                    description: "São Bento, Padroeiro da Cidade",
                    city: 'Marília'
                }
            );
        }
        return { stateHolidays, cityHolidays, nationalHolidays };
    }

    // #endregion

    // #region TUTORIAL (Intro.js)
    // =================================================

    function introJsFunc() {
        introJs().setOptions({
            nextLabel: 'Próximo >',
            prevLabel: '< Voltar',
            doneLabel: 'Concluir',
            steps: [
                { title: 'Bem-vindo!', intro: 'Este é um rápido tutorial sobre como usar a Calculadora de Prazos.' },
                { element: '#divCity', title: 'Comarca', intro: 'Selecione a comarca para que feriados e suspensões locais sejam considerados no cálculo.' },
                { element: '#divCalcType', title: 'Formato do Prazo', intro: 'Escolha se o prazo deve ser contado em dias úteis, corridos ou meses.' },
                { element: '#divCountType', title: 'Início da Contagem', intro: 'Selecione o marco inicial para a contagem, como a data do ato, da juntada ou da publicação no DJE.' },
                { element: '#divInitialDate', title: 'Data Inicial', intro: 'Informe a data correspondente à sua escolha no passo anterior. Você pode digitar ou usar o ícone de calendário.' },
                { element: '#divDays', title: 'Dias do Prazo', intro: 'Informe a quantidade de dias do prazo. Use os botões "+" e "-" para navegar rapidamente entre os prazos mais comuns.' },
                { element: '#calcBtn', title: 'Calcular', intro: 'Clique aqui para ver o resultado. O prazo final e um relatório detalhado aparecerão abaixo.' }
            ]
        }).start();
    }

    // #endregion

}); // Fim do 'DOMContentLoaded'

