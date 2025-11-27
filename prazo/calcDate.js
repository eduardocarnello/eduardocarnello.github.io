/* ==============================================================================================
   CONFIGURAÇÃO INICIAL E LOCALIZAÇÃO
   ============================================================================================== */
// Define o locale globalmente ao carregar
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

    // 2. Configuração de Feriados
    configureHolidays(inputs);

    // 3. Helpers de Verificação
    const checkSystemDown = (dateStr) => {
        if (typeof sistDown === 'undefined') return false;
        const d = sistDown.find(down => down.downDate === dateStr);
        return d ? d.description : false;
    };

    const holidayListVisual = getFullHolidayList(inputs);
    const getHolidayDescription = (dateStr) => {
        const h = holidayListVisual.find(item => item.holidayDate === dateStr);
        return h ? h.description : false;
    };

    // 4. Definição do Marco Inicial (Start Date Logic)
    let dateForCalc = inputs.initialDate.clone();
    let dispDate = undefined;
    let iPortal = 0;

    // Lógica de Contagem (DJE / Portal)
    if (inputs.countType === '1') { // DJE: Disponibilização
        dispDate = dateForCalc.clone();
        dateForCalc = dateForCalc.businessAdd(1); // Publicação = Próximo dia útil
    }
    else if (inputs.countType === '3') { // Portal Eletrônico
        dispDate = dateForCalc.clone();
        const dateAfterGap = dispDate.clone().businessAdd(5);
        dateForCalc = dateAfterGap.clone();
        iPortal = dateForCalc.diff(dispDate, 'days');
    }

    // 5. Cálculo do Prazo Final (Due Date Logic)
    let dueDate = dateForCalc.clone();

    if (inputs.calcType === 'workingDays') {
        let daysToAdd = inputs.days;
        while (daysToAdd > 0) {
            dueDate.add(1, 'days');
            if (dueDate.isBusinessDay()) {
                daysToAdd--;
            }
        }
        // Prorrogação por Indisponibilidade
        while (checkSystemDown(dueDate.format('DD/MM/YYYY'))) {
            dueDate.add(1, 'days');
            while (!dueDate.isBusinessDay()) {
                dueDate.add(1, 'days');
            }
        }
    }
    else if (inputs.calcType === 'months') {
        dueDate.add(inputs.days, 'months');
        while (checkSystemDown(dueDate.format('DD/MM/YYYY'))) {
            dueDate.businessAdd(1);
        }
        while (!dueDate.isBusinessDay()) {
            dueDate.add(1, 'days');
        }
    }
    else { // Dias Corridos
        dueDate.add(inputs.days, 'days');
        while (!dueDate.isBusinessDay() || checkSystemDown(dueDate.format('DD/MM/YYYY'))) {
            dueDate.add(1, 'days');
        }
    }

    // 6. Geração dos Dados do Relatório
    let listaDiasComTipo = [];
    let w = 0; // Contador visual de dias

    // (A) Cabeçalhos de Disponibilização (DJE e Portal)
    if (dispDate) {
        // Linha 1: Data da Disponibilização
        listaDiasComTipo.push({
            index: '-',
            date: dispDate.format('DD/MM/YYYY'),
            _type: inputs.countType === '3' ? 'Data da Confirmação da Citação' : 'Data da Disponibilização no DJE',
            class: 'susp'
        });

        // RESTAURADO: Loop para preencher o GAP entre Disponibilização e Publicação
        // Isso cobre fins de semana ou feriados entre a disp e a pub
        let tempD = dispDate.clone().add(1, 'days');
        while (tempD.isBefore(dateForCalc, 'day')) {
            let desc = '';
            let classe = 'susp';

            // Se for Portal, lógica específica
            if (inputs.countType === '3') {
                if (tempD.isBusinessDay()) {
                    desc = 'Aguardando leitura tácita';
                } else {
                    desc = 'Fim de Semana / Feriado (Gap Portal)';
                }
            } else {
                // Se for DJE, são dias não úteis entre Disp e Pub
                desc = tempD.isBusinessDay() ? 'Dia de intervalo' : 'Fim de Semana / Feriado';
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

    // (B) Loop de Dias do Prazo (De dateForCalc até dueDate)
    let currentDate = dateForCalc.clone();
    let safety = 0;

    while (currentDate.isSameOrBefore(dueDate) && safety < 2000) {
        safety++;

        const dateStr = currentDate.format('DD/MM/YYYY');
        const isBiz = currentDate.isBusinessDay();
        const sysDesc = checkSystemDown(dateStr);
        const holDesc = getHolidayDescription(dateStr);

        let row = {
            index: '-',
            date: dateStr,
            _type: '',
            class: '',
            rawDate: currentDate.toDate()
        };

        const isStart = (dateStr === dateForCalc.format('DD/MM/YYYY'));
        const isEnd = (dateStr === dueDate.format('DD/MM/YYYY'));

        // Definição de Tipos e Classes
        if (sysDesc) {
            row._type = `Indisponibilidade: ${sysDesc}`;
            row.class = 'susp';
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
        } else if (!isBiz) {
            row._type = 'Fim de Semana';
            row.class = 'susp';
        } else if (isStart) {
            // CORREÇÃO: Descrição específica para o dia da Publicação
            if (inputs.countType === '1') {
                row._type = 'Data da Publicação no DJE (não conta)';
            } else if (inputs.countType === '3') {
                row._type = 'Início do Prazo (art. 231, IX, do CPC)';
            } else {
                row._type = 'Dia do Início (não conta)';
            }
            row.class = 'start';
            row.index = '-';
        } else if (isEnd) {
            row._type = `${currentDate.format('dddd')} (Fim do Prazo)`;
            row.class = 'end';
        } else {
            row._type = currentDate.format('dddd');
            row.class = 'blue';
        }

        // Lógica de Numeração (Index)
        let countThisDay = false;
        if (inputs.calcType === 'workingDays') {
            if (isBiz && !sysDesc && !isStart) {
                countThisDay = true;
            }
        } else {
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
    renderCalendar(listaDiasComTipo, holidayListVisual, dueDate);

    // Exibe e Scrolla
    $('#results').show();
    $('html,body').animate({ scrollTop: $("#results").offset().top - 20 }, 500);
}

/* ==============================================================================================
   FUNÇÕES AUXILIARES
   ============================================================================================== */

function configureHolidays(inputs) {
    const currentYear = inputs.initialDate.year();
    const finalYear = moment(inputs.initialDate).add(inputs.days + 120, 'days').year();

    if (typeof holidaysFunc === 'undefined') return;

    const data = holidaysFunc(currentYear, finalYear, Easter);

    let allHolidays = [...data.nationalHolidays, ...data.stateHolidays];
    if (typeof amendment !== 'undefined') allHolidays.push(...amendment);

    const cityHolidays = data.cityHolidays.filter(h => h.city === inputs.chosenCity);
    allHolidays = allHolidays.concat(cityHolidays);

    const validHolidays = allHolidays.filter(h => h.holidayDate && h.holidayDate.trim() !== '');

    moment.updateLocale('pt-br', {
        holidays: validHolidays.map(h => h.holidayDate),
        holidayFormat: 'DD/MM/YYYY',
        workingWeekdays: [1, 2, 3, 4, 5]
    });
}

function getFullHolidayList(inputs) {
    const currentYear = inputs.initialDate.year();
    const finalYear = moment(inputs.initialDate).add(inputs.days + 120, 'days').year();
    const data = holidaysFunc(currentYear, finalYear, Easter);
    let list = [...data.nationalHolidays, ...data.stateHolidays, ...amendment];
    list = list.concat(data.cityHolidays.filter(h => h.city === inputs.chosenCity));
    return list.filter(h => h.holidayDate && h.holidayDate.trim() !== '');
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