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

        // Feedback visual imediato (esconde abas anteriores)
        $('#collapseReport').collapse('hide');
        $('#collapseCalendar').collapse('hide');

        // Pequeno delay para garantir a renderização da UI e animação
        const timeout = ($('#results').is(':visible')) ? 0 : 500;
        setTimeout(calculateResults, timeout);
    });

    // 2. Botão de scroll suave para resultados (caso clicado fora do fluxo normal)
    $('#calcBtn').click(function (e) {
        if ($('#results').is(':visible')) {
            $('html,body').animate({
                scrollTop: $("#results").offset().top - 20
            }, 500);
        }
    });

    // 3. Auto-scroll ao abrir as abas de Relatório e Calendário
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
    if (!initialDateInput) return; // Sai se estiver vazio

    const inputs = {
        initialDate: moment(initialDateInput, 'DD/MM/YYYY'),
        days: parseInt($('#days').val()) || 0,
        calcType: $('#calcType').val(), // 'workingDays', 'calendarDays', 'months'
        calcTypeText: $('#calcType option:selected').text(),
        countType: $('#countType').val(), // '0', '1', '2', '3'
        countTypeText: $('#countType option:selected').text(),
        chosenCity: 'Marília'
    };

    if (!inputs.initialDate.isValid()) {
        alert("Data inválida. Por favor verifique.");
        return;
    }

    // 2. Configuração de Feriados (Moment + Plugin)
    configureHolidays(inputs);

    // 3. Helpers de Verificação (Feriados e Indisponibilidades)
    const checkSystemDown = (dateStr) => {
        if (typeof sistDown === 'undefined') return false;
        const d = sistDown.find(down => down.downDate === dateStr);
        return d ? d.description : false;
    };

    // Recria lista completa para uso visual (descrições)
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
        // Intimação tácita
        const dateAfterGap = dispDate.clone().businessAdd(5);
        dateForCalc = dateAfterGap.clone();
        // Gap para renderização
        iPortal = dateForCalc.diff(dispDate, 'days');
    }

    // 5. Cálculo do Prazo Final (Due Date Logic)
    let dueDate = dateForCalc.clone();

    if (inputs.calcType === 'workingDays') {
        // LÓGICA MANUAL SEGURA: Soma dias úteis um a um
        let daysToAdd = inputs.days;
        while (daysToAdd > 0) {
            dueDate.add(1, 'days');
            if (dueDate.isBusinessDay()) {
                daysToAdd--;
            }
        }

        // Prorrogação por Indisponibilidade (no vencimento)
        while (checkSystemDown(dueDate.format('DD/MM/YYYY'))) {
            dueDate.add(1, 'days');
            while (!dueDate.isBusinessDay()) {
                dueDate.add(1, 'days');
            }
        }
    }
    else if (inputs.calcType === 'months') {
        // Meses
        dueDate.add(inputs.days, 'months');

        // Prorroga se cair em indisponibilidade ou dia não útil
        while (checkSystemDown(dueDate.format('DD/MM/YYYY'))) {
            dueDate.businessAdd(1);
        }
        while (!dueDate.isBusinessDay()) {
            dueDate.add(1, 'days');
        }
    }
    else { // calendarDays (Dias Corridos)
        dueDate.add(inputs.days, 'days');

        // Prorroga se cair em dia não útil OU indisponibilidade
        while (!dueDate.isBusinessDay() || checkSystemDown(dueDate.format('DD/MM/YYYY'))) {
            dueDate.add(1, 'days');
        }
    }

    // 6. Geração dos Dados do Relatório
    // Montamos a lista visual dia-a-dia
    let listaDiasComTipo = [];
    let w = 0; // Contador visual de dias

    // (A) Cabeçalhos de Disponibilização (se houver)
    if (dispDate) {
        listaDiasComTipo.push({
            index: '-',
            date: dispDate.format('DD/MM/YYYY'),
            _type: inputs.countType === '3' ? 'Data da Confirmação da Citação' : 'Data da Disponibilização no DJE',
            class: 'susp'
        });

        // Se for Portal, mostra o gap de carência
        if (inputs.countType === '3') {
            let tempD = dispDate.clone();
            while (tempD.add(1, 'days').isBefore(dateForCalc, 'day')) {
                if (tempD.isBusinessDay()) {
                    listaDiasComTipo.push({
                        index: '-',
                        date: tempD.format('DD/MM/YYYY'),
                        _type: `Aguardando leitura tácita`,
                        class: 'susp'
                    });
                }
            }
            // Marca o início real
            listaDiasComTipo.push({
                index: '<b>-</b>',
                date: dateForCalc.format('DD/MM/YYYY'),
                _type: 'Início do Prazo (art. 231, IX, do CPC)',
                class: 'susp'
            });
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
            // CORREÇÃO APRIMORADA: Verifica palavras-chave (recesso, suspensão, indisponibilidade, ritjsp)
            const lowerDesc = holDesc.toLowerCase();
            if (lowerDesc.includes('recesso') ||
                lowerDesc.includes('suspensão') ||
                lowerDesc.includes('indisponibilidade') ||
                lowerDesc.includes('ritjsp')) { // Adicionado RITJSP para pegar "Art. 116..."
                row._type = holDesc;
            } else {
                row._type = `Feriado: ${holDesc}`;
            }
            row.class = 'red';
        } else if (!isBiz) {
            row._type = 'Fim de Semana';
            row.class = 'susp';
        } else if (isStart) {
            row._type = 'Dia do Início (não conta)';
            row.class = 'start';
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
        workingWeekdays: [1, 2, 3, 4, 5] // CRÍTICO: Força dias úteis (Seg-Sex)
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
                    ${(inputs.countType === '1') ? `<tr><td><b>Data da Publicação:</b></td><td>${rows[0] && rows[0].date ? rows[0].date : ''}</td></tr>` : ''}
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