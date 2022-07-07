//$(" #calendar").calendar("refresh", null);
function initialDateFunc() {
    $("#initialDate").calendar({
        type: "date",
        monthFirst: false,
        on: "click",
        startCalendar: "",

        centuryBreak: 90,
        initialDate: moment(),
        currentCentury: 2022,
        today: true,
        popupOptions: {
            position: "bottom left"
        },


        //onBeforeChange: function(){},
        //onSelect get the value
        //after the change, clear the input
        formatter: {
            date: function (date, settings) {
                simpleStart = date;

                //console.log('here newValue ' + newValue);
                //pegames = "";
                //pegames = newValue
                pegames = $("#initialDate").val();
                //if pegames is null or empty, then pegames = moment().format("DD/MM/YYYY");
                if (pegames == null || pegames == "") {
                    pegames = moment().format("DD/MM/YYYY");
                }


                //moment locale to pt-br
                //clear day, month and year variables
                moment.locale("pt-BR");
                moment().format("L");

                //var day should be the 2 first characters of the pegames
                var day = pegames.substring(0, 2);
                if (day > 31) {
                    day = 31;
                }

                //var month should be the 3rd and 4th characters of the pegames
                var month = pegames.substring(3, 5);
                if (month > 12) {
                    month = 12;
                }
                if (month == "__" || month.includes("0_") || month.includes("0_")) {
                    month = moment().format("MM");
                }
                //var year should be the 5th and 6th characters of the pegames
                var year = pegames.substring(6, 12);
                if (year < 1964) {
                    year = 1964;
                }
                if (year.includes("202_") && month < moment().month() - 1 || (year.includes("____") && month.includes("__"))) {
                    console.log(year)
                    year = moment().year()
                    $("#initialDate").val(day + "/" + month + "/" + year);
                    //make
                    console.log('deu certo!!' + year)
                }
                if (year.includes("202_") && (year.includes("____") && month.includes("__"))) {
                    console.log(year)
                    year = moment().year()
                    month = moment().format("MM");
                    $("#initialDate").val(day + "/" + month + "/" + year);
                    //make
                    console.log('deu certo!!' + year + " " + month)
                }
                if (year.includes("202_") && month > moment().month() + 1) {
                    console.log(year)
                    month = moment().format("MM");
                    $("#initialDate").val(day + "/" + month + "/" + year);
                    //make
                    console.log('deu certo3!!' + year)
                }

                if (year.includes("201_")) {
                    year = 2019
                }





                if ((month > moment().month()) && (year >= moment().year() || year == "202_")) {
                    month = moment().format("MM");
                    console.log("istrue")
                }
                if ((month > moment().month()) && year >= moment().year() || year == "202_" || year == "____") {
                    year = moment().format("YYYY");
                    //month = moment().month() + 1;
                    console.log("valid : " + month)
                }
                if ((month > moment().month() + 1) && (year >= moment().year() || year == "____" || year == "202_")) {
                    year = moment().year();
                    month = moment().month() + 1;
                    console.log("istru3")
                }


                if (month >= moment().month() && day > moment().date() && (year >= moment().year() || year.includes("202_"))) {
                    month = month - 1;
                }
                // var day = date.getDate();
                //var month = date.getMonth() + 1;
                //var year = date.getFullYear();
                monthfix = month;
                //if date is null, then use the if below
                if (!date)
                    return moment().format("DD/MM/YYYY");

                //if pegames is null, then use the if below
                var numero = $("#initialDate").val();
                var numerotam = numero.toString().length;
                if (numero.toString().length < 10) {
                    date.setYear(moment().year());
                    var year = moment().format("YYYY");

                    //var month = moment().format('MM');
                }
                if (numero.toString().length < 3) {
                    //var year = moment().format('YYYY');
                    date.setMonth(moment().month());
                    var month = moment().format("MM");
                }
                //var day = pegames.substring(0, 2);
                //var month = pegames.substring(3, 5);
                //var year = pegames.substring(6, 10);
                var monthfix = month;

                var datacomp = moment(day + "/" + monthfix + "/" + year, "DD/MM/YYYY");
                //  date = moment(day + '/' + monthfix + '/' + year, 'DD/MM/YYYY')
                console.log(
                    "olhe aqui: " + day + "/" + monthfix + "/" + year,
                    "DD/MM/YYYY"
                );
                var dataformat = datacomp.format("DD/MM/YYYY");
                console.log("month: " + month);
                $("#initialDate").on("change", function () {
                    // 2nd (A)
                    $("#initialDate").val(dataformat);

                    // It will specifically called on change of your element
                });

                var datacomp = moment(day + "/" + monthfix + "/" + year, "DD/MM/YYYY");
                date = moment(day + "/" + monthfix + "/" + year, "DD/MM/YYYY");

                console.log(
                    "olhe aqui: " + day + "/" + monthfix + "/" + year,
                    "DD/MM/YYYY"
                );
                dataformat = datacomp.format("DD/MM/YYYY");
                console.log("month: " + month);
                console.log("year: " + year);
                console.log("data cod: " + datacomp.format("DD/MM/YYYY"));
                diaAto = dataformat;
                $("#initialDate").on("change", function () {
                    // 2nd (A)
                    $("#initialDate").val(dataformat);

                    // It will specifically called on change of your element
                });
                dayI = moment(day, "DD");
                monthI = moment(monthfix, "MM");
                yearI = moment(year, "YYYY");

                $("#initialDate").on("5");

                date = dataformat;
                console.log("shown: " + mostra);
                console.log("dataformat: " + dataformat);
                console.log("valor do date pre: " + date);



                console.log("date final :" + date);
                date1 = date.value;
                //button2()
                //myTeste()

                /////////
                //todo::  changing R$ to the past currency utilized in Brazil
                /////////

                if (year.includes("202_") || (year == "____" && month == "__")) {

                    year = moment().year()
                    console.log(year)
                    //$("#initialDate").val(dataformat)
                    //make
                    console.log('deu certo!!')
                }


                function updateDataformat() {
                    dataformat = dataformat
                }

                return dataformat;

                // return day + '/' + month + '/' + year
                //clear pegames
                pegames = "";
            }
            //return day + '/' + month + '/' + year;
        },

        /*get: {date: function (date, settings) {
            dataformat
          }},*/
        /* onChange: function(newDate){
            var oldDate = $(this).calendar('get date');
            if(!oldDate || oldDate.getFullYear() != newDate.getFullYear()) {
              console.log('Year has changed!');
              mostra = $('#initialDate').val();
              diaAto = mostra;
            }},*/
        //onchange input with id #initialDate, do something
        /*onChange: function (date, text) {
          var newValue = text;
          diaAto = dataformat;
          mostra = $('#initialDate').val();
          
          //alert('dia ato é ' +diaAto);
        },
        /*onClose: function (date, text) {
          $(this).focus();
          alert('ok');
        },
        onChange: function (date, text) {
          var newValue = text;
          $(this).focus();
         //alert(newValue);
        },*/
        eventClass: "inverted red",
        /*eventDates: [
          new Date('2019-4-20'), //no message tooltip
          {
            date: new Date('2019-4-21'),
            message: 'I got the default color (light red)'
          }, {
            date: new Date('2019-4-22'),
            message: 'Me too'
          }
        ],*/
        text: {
            days: ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"],
            months: [
                "Janeiro",
                "Fevereiro",
                "Março",
                "Abril",
                "Maio",
                "Junho",
                "Julho",
                "Agosto",
                "Setembro",
                "Outubro",
                "Novembro",
                "Dezembro"
            ],
            monthsShort: [
                "Jan",
                "Fev",
                "Mar",
                "Abr",
                "Mai",
                "Jun",
                "Jul",
                "Ago",
                "Set",
                "Out",
                "Nov",
                "Dez"
            ],
            today: "Hoje",
            now: "Agora",
            am: "AM",
            pm: "PM"
        }

    });

    update();

}
