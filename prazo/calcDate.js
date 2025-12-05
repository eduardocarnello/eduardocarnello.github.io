/* ==============================================================================================
   CONFIGURAÇÃO INICIAL E LOCALIZAÇÃO
   ============================================================================================== */
moment.locale('pt-br');

/* ==============================================================================================
   EVENT LISTENERS (Garantido pelo document.ready)
   ============================================================================================== */
$(document).ready(function () {

    // 1. Listener do Formulário (Submit)
    $('#deadlineCalc').on('submit', function (e) {
        e.preventDefault();

        // Feedback visual imediato
        $('#collapseReport').collapse('hide');
        $('#collapseCalendar').collapse('hide');

        // Pequeno delay para garantir a renderização da UI
        const timeout = ($('#results').is(':visible')) ? 0 : 500;
        setTimeout(calculateResults, timeout);
    });

    // 2. Botão de scroll
    $('#calcBtn').click(function (e) {
        if ($('#results').is(':visible')) {
            $('html,body').animate({
                scrollTop: $("#results").offset().top - 20
            }, 500);
        }
    });

    // 3. Auto-scroll
    $('#collapseReport, #collapseCalendar').on('shown.bs.collapse', function () {
        this.scrollIntoView({ behavior: "smooth" });
    });

});

/* ==============================================================================================
   LÓGICA PRINCIPAL (CALCULATE RESULTS)
   ============================================================================================== */

function calculateResults() {
    // 1. Captura e Validação de Inputs
    const initialDateInput = $('#initialDate').val();
    if (!initialDateInput) return;

    const inputs = {
        initialDate: moment(initialDateInput, 'DD/MM/YYYY'),
        days: parseInt($('#days').val()) || 0,
        calcType: $('#calcType').val(),
        calcTypeText: $('#calcType option:selected').text(),
        countType: $('#countType').val(),
        countTypeText: $('#countType option:selected').text(),
        chosenCity: 'Marília'
    };

    if (!inputs.initialDate.isValid()) {
        alert("Data inválida. Por favor verifique.");
        return;
    }

    // 2. Recuperação de Listas de Datas (Feriados e Indisponibilidades)
    const holidayData = getHolidayList(inputs);
    const allHolidaysList = holidayData.list;

    // Configura o plugin apenas para fins visuais/calendário
    moment.updateLocale('pt-br', {
        holidays: allHolidaysList.map(h => h.holidayDate),
        holidayFormat: 'DD/MM/YYYY',
        workingWeekdays: [1, 2, 3, 4, 5]
    });

    /* ==========================================================================================
       3. HELPERS DE VERIFICAÇÃO LÓGICA (O CORAÇÃO DO CÁLCULO)
       ========================================================================================== */

    // Verifica se é Feriado (Feriado, Recesso, Suspensão) -> SUSPENDE O PRAZO
    const isHolidayExplicit = (dateMoment) => {
        const dateStr = dateMoment.format('DD/MM/YYYY');
        return allHolidaysList.some(h => h.holidayDate === dateStr);
    };

    // Verifica se é Fim de Semana -> SUSPENDE O PRAZO
    const isWeekend = (dateMoment) => {
        const day = dateMoment.day();
        return day === 0 || day === 6;
    };

    // Busca informações de Indisponibilidade no array 'sistDown'
    const getSystemDownInfo = (dateStr) => {
        if (typeof sistDown === 'undefined') return null;
        return sistDown.find(down => down.downDate === dateStr);
    };

    // Verifica se é Indisponibilidade SEVERA -> SUSPENDE O PRAZO (Igual Feriado)
    const isSevereDowntime = (dateMoment) => {
        const info = getSystemDownInfo(dateMoment.format('DD/MM/YYYY'));
        if (!info) return false;
        // Verifica se a descrição contém a palavra "SEVERA" (case insensitive)
        return info.description.toUpperCase().includes("SEVERA");
    };

    // Verifica se é Indisponibilidade NORMAL -> APENAS PRORROGA (Não suspende contagem)
    const isNormalDowntime = (dateMoment) => {
        const info = getSystemDownInfo(dateMoment.format('DD/MM/YYYY'));
        if (!info) return false;
        // É normal se existe e NÃO é severa
        return !info.description.toUpperCase().includes("SEVERA");
    };

    // DEFINIÇÃO DE "DIA ÚTIL PARA CONTAGEM" (WORKING DAY)
    const isCountableDay = (dateMoment) => {
        return !isWeekend(dateMoment) && !isHolidayExplicit(dateMoment) && !isSevereDowntime(dateMoment);
    };

    // DEFINIÇÃO DE "DIA ÚTIL PARA VENCIMENTO" (DUE DATE CHECK)
    const isValidDueDate = (dateMoment) => {
        return isCountableDay(dateMoment) && !isNormalDowntime(dateMoment);
    };

    const getHolidayDescription = (dateStr) => {
        const h = allHolidaysList.find(item => item.holidayDate === dateStr);
        return h ? h.description : false;
    };

    /* ==========================================================================================
       4. CÁLCULO (MARCO INICIAL E PRAZO)
       ========================================================================================== */

    // --- Data Inicial ---
    let dateForCalc = inputs.initialDate.clone();
    let dispDate = undefined;
    let iPortal = 0;

    if (inputs.countType === '1') { // DJE
        dispDate = dateForCalc.clone();
        dateForCalc.add(1, 'days');
        while (!isCountableDay(dateForCalc)) {
            dateForCalc.add(1, 'days');
        }
    }
    else if (inputs.countType === '3') { // Portal
        dispDate = dateForCalc.clone();
        let gapDays = 5;
        let tempDate = dispDate.clone();
        while (gapDays > 0) {
            tempDate.add(1, 'days');
            if (isCountableDay(tempDate)) gapDays--;
        }
        dateForCalc = tempDate.clone();
        iPortal = dateForCalc.diff(dispDate, 'days');
    }

    // --- Data Final (Loop de Contagem) ---
    let dueDate = dateForCalc.clone();

    if (inputs.calcType === 'workingDays') {
        let daysToAdd = inputs.days;
        while (daysToAdd > 0) {
            dueDate.add(1, 'days');
            if (isCountableDay(dueDate)) {
                daysToAdd--;
            }
        }

        // Prorrogação
        while (checkSystemDown(dueDate.format('DD/MM/YYYY'))) {
            dueDate.add(1, 'days');
            while (!isWorkingDayManual(dueDate)) { // isWorkingDayManual usado abaixo, mas aqui podemos usar isCountableDay? Não, isCountableDay permite normal down.
                // Correção: Para sair de FDS/Feriado após prorrogar, usamos isCountableDay que já checa isso.
                // Mas isCountableDay retorna TRUE para dia com indisponibilidade normal.
                // Então precisamos checar isValidDueDate.
                if (!isCountableDay(dueDate)) dueDate.add(1, 'days');
                else break;
            }
        }
    }
    else if (inputs.calcType === 'months') {
        dueDate.add(inputs.days, 'months');
        while (checkSystemDown(dueDate.format('DD/MM/YYYY'))) {
            dueDate.add(1, 'days');
        }
        while (!isCountableDay(dueDate)) { // Usando lógica manual equivalente
            dueDate.add(1, 'days');
        }
    }
    else { // Dias Corridos
        dueDate.add(inputs.days, 'days');
        while (!isValidDueDate(dueDate)) { // Usa check completo de vencimento
            dueDate.add(1, 'days');
        }
    }

    // Garantia final de prorrogação (Loop seguro)
    while (!isValidDueDate(dueDate)) {
        dueDate.add(1, 'days');
    }

    /* ==========================================================================================
       6. GERAÇÃO DO RELATÓRIO VISUAL
       ========================================================================================== */
    let listaDiasComTipo = [];
    let w = 0; // Contador visual

    // (A) Cabeçalhos de Disponibilização
    if (dispDate) {
        listaDiasComTipo.push({
            index: '-',
            date: dispDate.format('DD/MM/YYYY'),
            _type: inputs.countType === '3' ? 'Data da Confirmação da Citação' : 'Data da Disponibilização no DJE',
            class: 'susp'
        });

        let tempD = dispDate.clone().add(1, 'days');
        while (tempD.isBefore(dateForCalc, 'day')) {
            let desc = '';
            let classe = 'susp';

            if (inputs.countType === '3') {
                desc = isCountableDay(tempD) ? 'Aguardando leitura tácita' : 'Fim de Semana / Feriado / Suspensão (Gap Portal)';
            } else {
                desc = isCountableDay(tempD) ? 'Dia de intervalo' : 'Fim de Semana / Feriado / Suspensão';
            }

            listaDiasComTipo.push({
                index: '-',
                date: tempD.format('DD/MM/YYYY'),
                _type: desc,
                class: classe
            });
            tempD.add(1, 'days');
        }
    }

    // (B) Loop de Dias do Prazo
    let currentDate = dateForCalc.clone();
    let safety = 0;

    while (currentDate.isSameOrBefore(dueDate) && safety < 2000) {
        safety++;

        const dateStr = currentDate.format('DD/MM/YYYY');

        // Status do dia para classificação VISUAL
        const isBiz = isCountableDay(currentDate);
        const severeInfo = isSevereDowntime(currentDate) ? getSystemDownInfo(dateStr) : null;
        const normalInfo = isNormalDowntime(currentDate) ? getSystemDownInfo(dateStr) : null;
        const holDesc = getHolidayDescription(dateStr);
        const isWknd = isWeekend(currentDate);
        const isStart = (dateStr === dateForCalc.format('DD/MM/YYYY'));
        const isEnd = (dateStr === dueDate.format('DD/MM/YYYY'));

        let row = {
            index: '-',
            date: dateStr,
            _type: '',
            class: '',
            rawDate: currentDate.toDate()
        };

        // PRIORIDADE VISUAL: INÍCIO > SEVERA > FERIADO > FDS > NORMAL > FIM > DIA ÚTIL
        if (isStart) {
            // Configuração base do texto de início
            if (inputs.countType === '1') row._type = 'Data da Publicação no DJE (não conta)';
            else if (inputs.countType === '3') row._type = 'Início do Prazo (art. 231, IX, do CPC)';
            else row._type = 'Dia do Início (não conta)';

            // Adiciona motivo se for dia não útil (Feriado ou Fim de Semana), ignorando indisponibilidade
            if (holDesc) {
                row._type += ` - ${holDesc}`;
            } else if (isWknd) {
                row._type += ' - Fim de Semana';
            }

            row.class = 'start'; // Sempre azul (text-primary)
            row.index = '-';
        }
        else if (severeInfo) {
            row._type = `Indisponibilidade SEVERA: ${severeInfo.description}`;
            row.class = 'red';
        } else if (holDesc) {
            const lowerDesc = holDesc.toLowerCase();
            if (lowerDesc.includes('recesso') ||
                lowerDesc.includes('suspensão') ||
                lowerDesc.includes('indisponibilidade') ||
                lowerDesc.includes('ritjsp')) {
                row._type = holDesc;
            } else {
                row._type = `Feriado: ${holDesc}`;
            }
            row.class = 'red';
        } else if (isWknd) {
            row._type = 'Fim de Semana';
            row.class = 'susp';
        } else if (normalInfo) {
            row._type = `Indisponibilidade: ${normalInfo.description}`;
            row.class = 'susp';
        } else if (isEnd) {
            row._type = `${currentDate.format('dddd')} (Fim do Prazo)`;
            row.class = 'end';
        } else {
            row._type = currentDate.format('dddd');
            row.class = 'blue';
        }

        // Lógica de Numeração VISUAL (Index)
        let countThisDay = false;
        if (inputs.calcType === 'workingDays') {
            // Conta se é "Countable" (Útil ou Normal Down) E não é Início
            if (isBiz && !isStart) {
                countThisDay = true;
            }
        } else {
            // Dias Corridos
            if (!isStart) {
                if (w < inputs.days) {
                    countThisDay = true;
                }
            }
        }

        if (countThisDay) {
            w++;
            row.index = `<b>${w}</b>`;
        }

        listaDiasComTipo.push(row);
        currentDate.add(1, 'days');
    }

    // 7. Renderização
    renderTables(listaDiasComTipo, dueDate, inputs);
    renderCalendar(listaDiasComTipo, allHolidaysList, dueDate);

    // Exibe e Scrolla
    $('#results').show();
    $('html,body').animate({ scrollTop: $("#results").offset().top - 20 }, 500);
}

/* ==============================================================================================
   FUNÇÕES AUXILIARES
   ============================================================================================== */

function getHolidayList(inputs) {
    const currentYear = inputs.initialDate.year();
    const finalYear = moment(inputs.initialDate).add(inputs.days + 365, 'days').year();

    if (typeof holidaysFunc === 'undefined') return { list: [] };

    const data = holidaysFunc(currentYear, finalYear, Easter);

    let allHolidays = [...data.nationalHolidays, ...data.stateHolidays];
    if (typeof amendment !== 'undefined') allHolidays.push(...amendment);

    const cityHolidays = data.cityHolidays.filter(h => h.city === inputs.chosenCity);
    allHolidays = allHolidays.concat(cityHolidays);

    const list = allHolidays.filter(h => h.holidayDate && h.holidayDate.trim() !== '');
    return { list };
}

function configureHolidays(inputs) {
    getHolidayList(inputs);
}

function getFullHolidayList(inputs) {
    return getHolidayList(inputs).list;
}

function renderTables(rows, dueDate, inputs) {
    const summaryHtml = `
        <h3 class="text"><b>Prazo Final:</b></h3>
        <h2 class="heading display-3 pb-5 text-center py-3" id="finalDate">${dueDate.format("DD/MM/YYYY")}</h2>
        <div class="table-responsive">
            <table class="table table-bordered table-hover table-condensed">
                <tbody>
                    <tr><td><b>Comarca:</b></td><td>${inputs.chosenCity}</td></tr>
                    <tr><td><b>Contagem:</b></td><td>${inputs.calcTypeText}</td></tr>
                    <tr><td><b>Marco Inicial (${inputs.countTypeText}):</b></td><td>${inputs.initialDate.format("DD/MM/YYYY")}</td></tr>
                    ${(inputs.countType === '1') ? `<tr><td><b>Data da Publicação:</b></td><td>${rows.find(r => r.class === 'start') ? rows.find(r => r.class === 'start').date : ''}</td></tr>` : ''}
                    <tr><td><b>Prazo:</b></td><td>${inputs.days} dias</td></tr>
                    <tr class="table-active text-success"><td><b>Vencimento:</b></td><td><b>${dueDate.format("DD/MM/YYYY")}</b></td></tr>
                </tbody>
            </table>
        </div>`;
    $('#printResults').html(summaryHtml);

    let listHtml = `<table class='table table-hover table-sm border'>
        <thead class='table-light'><tr>
            <th class='text-center'>#</th><th>Data</th><th>Descrição</th>
        </tr></thead><tbody>`;

    rows.forEach(row => {
        let colorClass = '';
        if (row.class === 'red') colorClass = 'text-danger';
        if (row.class === 'susp') colorClass = 'text-warning';
        if (row.class === 'end') colorClass = 'text-success fw-bold';
        if (row.class === 'start') colorClass = 'text-primary';

        listHtml += `<tr class="${row.class === 'end' ? 'table-active' : ''}">
            <td class='text-center'>${row.index}</td>
            <td class="${colorClass}">${row.date}</td>
            <td class="${colorClass}">${row._type}</td>
        </tr>`;
    });
    listHtml += "</tbody></table>";
    document.getElementById("listReport").innerHTML = listHtml;
}

function renderCalendar(rows, holidays, dueDate) {
    let events = [];

    holidays.forEach(h => {
        events.push({
            date: moment(h.holidayDate, 'DD/MM/YYYY').toDate(),
            message: h.description,
            class: 'red'
        });
    });

    rows.forEach(r => {
        let color = 'blue';
        if (r.class === 'end') color = 'green';
        if (r.class === 'susp') color = 'orange';
        if (r.class === 'start') color = 'teal';

        if (r.class !== 'red') {
            events.push({
                date: r.rawDate,
                message: r._type,
                class: color
            });
        }
    });

    $('#inlineCalendar').empty().calendar({
        type: 'date',
        initialDate: dueDate.toDate(),
        eventDates: events,
        text: {
            days: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
            months: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
            monthsShort: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
            today: 'Hoje',
            now: 'Agora'
        }
    });
}