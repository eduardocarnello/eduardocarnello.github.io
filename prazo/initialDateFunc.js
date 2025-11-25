/* ==============================================================================================
   INICIALIZAÇÃO DO CALENDÁRIO (SEMANTIC UI)
   ============================================================================================== */

function initialDateFunc() {

    // Configurações de Texto (PT-BR)
    const calendarTextConfig = {
        days: ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"],
        months: ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"],
        monthsShort: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"],
        today: "Hoje",
        now: "Agora",
        am: "AM",
        pm: "PM"
    };

    // Inicialização do Componente no Input Principal
    $("#initialDate").calendar({
        type: "date",
        monthFirst: false,
        on: "click",
        startCalendar: $("#initialDate").val() ? new Date() : null,
        centuryBreak: 90,
        currentCentury: 2022,
        today: true,
        text: calendarTextConfig,

        // CONFIGURAÇÃO DO POPUP
        // Como o CSS (.card { overflow: visible }) já trata a exibição,
        // não precisamos mais de lógica complexa de redimensionamento aqui.
        popupOptions: {
            position: "bottom left",
            lastResort: "bottom left",
            prefer: "opposite",
            hideOnScroll: false
        },

        // Ação ao selecionar uma data
        onSelect: function (date, mode) {
            const formattedDate = moment(date).format("DD/MM/YYYY");
            $(this).val(formattedDate);

            // Foca no próximo campo
            $('#days').focus();

            // Dispara recálculo
            $(this).trigger('change');
        },

        // Formatador visual
        formatter: {
            date: function (date, settings) {
                if (!date) return "";
                return moment(date).format("DD/MM/YYYY");
            }
        },

        // Parser
        parser: {
            date: function (text, settings) {
                if (!text) return null;
                return moment(text, "DD/MM/YYYY").toDate();
            }
        }
    });

    /* ==========================================================================================
       VÍNCULO DO ÍCONE COM O CALENDÁRIO PRINCIPAL
       ========================================================================================== */
    $("#button_calendar").on("click", function () {
        $("#initialDate").calendar("popup show");
    });

    /* ==========================================================================================
       NAVEGAÇÃO INTELIGENTE (TAB)
       ========================================================================================== */
    $("#initialDate").on('keydown', function (e) {
        // Se apertar TAB (código 9) sem Shift
        if (e.which === 9 && !e.shiftKey) {
            e.preventDefault();
            $('#days').focus();
            $('#days').select();
        }
    });

    /* ==========================================================================================
       AUTOCOMPLETE AO SAIR DO CAMPO (BLUR)
       ========================================================================================== */
    $("#initialDate").off('blur').on('blur', function () {
        const text = $(this).val();
        if (!text) return;

        const digits = text.replace(/[^0-9]/g, '');
        const now = moment();
        let parsedDate = null;

        if (digits.length > 0 && digits.length <= 2) {
            const day = digits.padStart(2, '0');
            parsedDate = moment(`${day}/${now.format('MM/YYYY')}`, "DD/MM/YYYY");
        }
        else if (digits.length > 2 && digits.length <= 4) {
            const day = digits.slice(0, 2);
            const month = digits.slice(2).padStart(2, '0');
            parsedDate = moment(`${day}/${month}/${now.format('YYYY')}`, "DD/MM/YYYY");
        }
        else if (digits.length >= 6) {
            parsedDate = moment(text, "DD/MM/YYYY");
        }

        if (parsedDate && parsedDate.isValid()) {
            const newVal = parsedDate.format("DD/MM/YYYY");
            if (newVal !== text) {
                $(this).val(newVal);
                $("#initialDate").calendar('set date', parsedDate.toDate(), true, false);
            }
        }
    });

    if (typeof update === 'function') {
        update();
    }
}