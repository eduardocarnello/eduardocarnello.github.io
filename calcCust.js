moment.locale('pt-br');

//ondocumentready




$('#calcCust').click(() => {





    var resultModal = new bootstrap.Modal(document.getElementById('exampleModal'))

    //declare variables, getting the values from the inputs
    var initialDate = $('#initialDate').val();
    var finalDate = $('#finalDate').val();
    var caseValue = $('#caseValue').val();
    var sentenceValue = $('#sentenceValue').val();
    const UFESP = 31.97;

    if (sentenceValue == null || sentenceValue == "") {
        sentenceValue = 'R$ 0,00';
    }

    if (initialDate.includes('_')) {
        console.log('entrou')
    }

    //formating the values to be used in the calculation
    var caseValueNumber = caseValue.replace(/[^0-9]+/g, '');
    var caseValueNumberDecimal = caseValueNumber.slice(0, -2) + '.' + caseValueNumber.slice(-2);
    var sentenceValueNumber = sentenceValue.replace(/[^0-9]+/g, '');
    var sentenceValueNumberDecimal = sentenceValueNumber.slice(0, -2) + '.' + sentenceValueNumber.slice(-2);


    //check if any of the above variables are empty or undefined and alert the user with a message that shows the input that is empty

    if ((initialDate == "" || initialDate == undefined || initialDate.includes('_')) && (caseValueNumberDecimal == "" || caseValueNumberDecimal == undefined || caseValueNumberDecimal == "0.00" || isNaN(caseValueNumberDecimal))) {
        alert("Informe o valor inicial e a data da distribuição");
    } else if (caseValueNumberDecimal == "" || caseValueNumberDecimal == undefined || caseValueNumberDecimal == "0.00" || isNaN(caseValueNumberDecimal)) {
        alert("Informe o valor inicial");
    } else if (initialDate == "" || initialDate == undefined || initialDate.includes('_')) {
        alert("Informe a data da distribuição");
    }
    else {
        resultModal.toggle()

    }



    //fixing finalDate and sentenceValue; if finalDate is empty, then we will use today date; if sentenceValue is empty, then it will consider the caseValue
    if (finalDate == "" || finalDate == undefined) {
        finalDate = moment().format('DD/MM/YYYY');
    }
    



    //object that has the years and months from 2000 to 2022 with each of their months and a value to 
    const calcIndex = {
        1964: [{
            10: 10000.00,
            11: 10000.00,
            12: 10000.00,

        }],
        1965: [{
            01: 11300.00,
            02: 11300.00,
            03: 11300.00,
            04: 13400.00,
            05: 13400.00,
            06: 13400.00,
            07: 15200.00,
            08: 15200.00,
            09: 15700.00,
            10: 15900.00,
            11: 16050.00,
            12: 16300.00,
        }],
        1966: [{
            01: 16600.00,
            02: 17050.00,
            03: 17300.00,
            04: 17600.00,
            05: 18280.00,
            06: 19090.00,
            07: 19870.00,
            08: 20430.00,
            09: 21010.00,
            10: 21610.00,
            11: 22180.00,
            12: 22690.00,
        }],
        1967: [{
            01: 23230.00,
            02: 23.78,
            03: 24.28,
            04: 24.64,
            05: 25.01,
            06: 25.46,
            07: 26.18,
            08: 26.84,
            09: 27.25,
            10: 27.38,
            11: 27.57,
            12: 27.96,
        }],
        1968: [{
            01: 28.48,
            02: 28.98,
            03: 29.40,
            04: 29.83,
            05: 30.39,
            06: 31.20,
            07: 32.09,
            08: 32.81,
            09: 33.41,
            10: 33.88,
            11: 34.39,
            12: 34.35,

        }],
        1969: [{
            01: 35.62,
            02: 36.27,
            03: 36.91,
            04: 37.43,
            05: 38.01,
            06: 38.48,
            07: 39.00,
            08: 39.27,
            09: 39.56,
            10: 39.92,
            11: 40.57,
            12: 41.42,

        }],
        1970: [{
            01: 42.35,
            02: 43.30,
            03: 44.17,
            04: 44.67,
            05: 45.08,
            06: 45.50,
            07: 46.20,
            08: 46.61,
            09: 47.05,
            10: 47.61,
            11: 48.51,
            12: 49.54,

        }],
        1971: [{
            01: 50.51,
            02: 51.44,
            03: 52.12,
            04: 52.64,
            05: 53.25,
            06: 54.01,
            07: 55.08,
            08: 56.18,
            09: 57.36,
            10: 58.61,
            11: 59.79,
            12: 60.77,

        }],
        1972: [{
            01: 61.52,
            02: 62.26,
            03: 63.09,
            04: 63.81,
            05: 64.66,
            06: 65.75,
            07: 66.93,
            08: 67.89,
            09: 68.46,
            10: 68.95,
            11: 69.61,
            12: 70.07,

        }],
        1973: [{
            01: 70.87,
            02: 71.57,
            03: 72.32,
            04: 73.19,
            05: 74.03,
            06: 74.97,
            07: 75.80,
            08: 76.48,
            09: 77.12,
            10: 77.87,
            11: 78.40,
            12: 79.07,

        }],
        1974: [{
            01: 80.62,
            02: 81.47,
            03: 82.69,
            04: 83.73,
            05: 85.10,
            06: 86.91,
            07: 89.80,
            08: 93.75,
            09: 98.22,
            10: 101.90,
            11: 104.10,
            12: 105.41,

        }],
        1975: [{
            01: 106.76,
            02: 108.38,
            03: 110.18,
            04: 112.25,
            05: 114.49,
            06: 117.13,
            07: 119.27,
            08: 121.31,
            09: 123.20,
            10: 125.70,
            11: 128.43,
            12: 130.93,

        }],
        1976: [{
            01: 133.34,
            02: 135.90,
            03: 138.94,
            04: 142.24,
            05: 145.83,
            06: 150.17,
            07: 154.60,
            08: 158.55,
            09: 162.97,
            10: 168.33,
            11: 174.40,
            12: 179.68,

        }],
        1977: [{
            01: 183.65,
            02: 186.83,
            03: 190.51,
            04: 194.83,
            05: 200.45,
            06: 206.90,
            07: 213.80,
            08: 219.51,
            09: 224.01,
            10: 227.15,
            11: 230.30,
            12: 233.74,

        }],
        1967: [{
            01: 120,
            02: 1545,
            03: 1545,
            04: 1545,
            05: 1545,
            06: 1545,
            07: 1545,
            08: 1545,
            09: 1545,
            10: 1545,
            11: 1545,
            12: 1545,
        }],
        1978: [{
            01: 238.32,
            02: 243.35,
            03: 248.99,
            04: 255.41,
            05: 262.87,
            06: 270.88,
            07: 279.04,
            08: 287.58,
            09: 295.57,
            10: 303.29,
            11: 310.49,
            12: 318.44,

        }],
        1979: [{
            01: 326.82,
            02: 334.20,
            03: 341.97,
            04: 350.51,
            05: 363.64,
            06: 377.54,
            07: 390.10,
            08: 400.71,
            09: 412.24,
            10: 428.80,
            11: 448.47,
            12: 468.71,

        }],
        1980: [{
            01: 487.83,
            02: 508.33,
            03: 527.14,
            04: 546.64,
            05: 566.86,
            06: 586.13,
            07: 604.89,
            08: 624.25,
            09: 644.23,
            10: 663.56,
            11: 684.79,
            12: 706.70,

        }],
        1981: [{
            01: 738.50,
            02: 775.43,
            03: 825.83,
            04: 877.86,
            05: 930.53,
            06: 986.36,
            07: 1045.54,
            08: 1108.27,
            09: 1172.55,
            10: 1239.39,
            11: 1310.04,
            12: 1382.09,

        }],
        1982: [{
            01: 1453.96,
            02: 1526.66,
            03: 1602.99,
            04: 1683.14,
            05: 1775.71,
            06: 1873.37,
            07: 1976.41,
            08: 2094.99,
            09: 2241.64,
            10: 2398.55,
            11: 2566.45,
            12: 2733.27,

        }],
        1983: [{
            01: 2910.93,
            02: 3085.59,
            03: 3292.32,
            04: 3588.63,
            05: 3911.61,
            06: 4224.54,
            07: 4554.05,
            08: 4963.91,
            09: 5385.84,
            10: 5897.49,
            11: 6469.55,
            12: 7012.99,

        }],
        1984: [{
            01: 7545.98,
            02: 8285.49,
            03: 9304.61,
            04: 10235.07,
            05: 11145.99,
            06: 12137.98,
            07: 13254.67,
            08: 14619.90,
            09: 16169.61,
            10: 17867.42,
            11: 20118.71,
            12: 22110.46,

        }],
        1985: [{
            01: 24432.06,
            02: 27510.50,
            03: 30316.57,
            04: 34166.77,
            05: 38208.46,
            06: 42031.56,
            07: 45901.91,
            08: 49396.88,
            09: 53437.40,
            10: 58300.20,
            11: 63547.22,
            12: 70613.67,

        }],
        1986: [{
            01: 80047.66,
            02: 93039.40,
            03: 106.40,
            04: 106.28,
            05: 107.12,
            06: 108.61,
            07: 109.99,
            08: 111.31,
            09: 113.18,
            10: 115.13,
            11: 117.32,
            12: 121.17,

        }],
        1987: [{
            01: 129.98,
            02: 151.85,
            03: 181.61,
            04: 207.97,
            05: 251.56,
            06: 310.53,
            07: 366.49,
            08: 377.67,
            09: 401.69,
            10: 424.51,
            11: 463.48,
            12: 522.99,

        }],
        1988: [{
            01: 596.94,
            02: 695.50,
            03: 820.42,
            04: 951.77,
            05: 1135.27,
            06: 1337.12,
            07: 1598.26,
            08: 1982.48,
            09: 2392.06,
            10: 2966.39,
            11: 3774.73,
            12: 4790.89,

        }],
        1989: [{
            01: 6.170000,
            02: 8.805824,
            03: 9.698734,
            04: 10.289386,
            05: 11.041540,
            06: 12.139069,
            07: 15.153199,
            08: 19.511259,
            09: 25.235862,
            10: 34.308154,
            11: 47.214881,
            12: 66.771284,
        }],
        1990: [{
            01: 102.527306,
            02: 160.055377,
            03: 276.543680,
            04: 509.725310,
            05: 738.082248,
            06: 796.169320,
            07: 872.203490,
            08: 984.892180,
            09: 1103.374709,
            10: 1244.165321,
            11: 1420.836796,
            12: 1642.203168,

        }],
        1991: [{
            01: 1942.726347,
            02: 2329.523162,
            03: 2838.989877,
            04: 3173.706783,
            05: 3332.709492,
            06: 3555.334486,
            07: 3940.377210,
            08: 4418.739003,
            09: 5108.946035,
            10: 5906.963405,
            11: 7152.151290,
            12: 9046.040951,

        }],
        1992: [{
            01: 1123.659840,
            02: 14141.646870,
            03: 17603.522023,
            04: 21409.403484,
            05: 25871.123170,
            06: 32209.548346,
            07: 38925.239176,
            08: 47519.931986,
            09: 58154.892764,
            10: 72100.436048,
            11: 90897.019725,
            12: 111703.347540,


        }],
        1993: [{
            01: 140277.063840,
            02: 180634.775106,
            03: 225414.135854,
            04: 287583.354522,
            05: 369170.752199,
            06: 468034.679637,
            07: 610176.811842,
            08: 799.392641,
            09: 1065.910147,
            10: 1445.693932,
            11: 1938.964701,
            12: 2636.991993,

        }],
        1994: [{
            01: 3631.929071,
            02: 5132.642163,
            03: 7214.955088,
            04: 10323.157739,
            05: 14747.663145,
            06: 21049.339606,
            07: 11.346741,
            08: 12.036622,
            09: 12.693821,
            10: 12.885497,
            11: 13.125167,
            12: 13.554359,

        }],
        1995: [{
            01: 13.851199,
            02: 14.082514,
            03: 14.221930,
            04: 14.422459,
            05: 14.699370,
            06: 15.077143,
            07: 15.351547,
            08: 15.729195,
            09: 15.889632,
            10: 16.075540,
            11: 16.300597,
            12: 16.546736,

        }],
        1996: [{
            01: 16.819757,
            02: 17.065325,
            03: 17.186488,
            04: 17.236328,
            05: 17.396625,
            06: 17.619301,
            07: 17.853637,
            08: 18.067880,
            09: 18.158219,
            10: 18.161850,
            11: 18.230865,
            12: 18.292849,

        }],
        1997: [{
            01: 18.353215,
            02: 18.501876,
            03: 18.585134,
            04: 18.711512,
            05: 18.823781,
            06: 18.844487,
            07: 18.910442,
            08: 18.944480,
            09: 18.938796,
            10: 18.957734,
            11: 19.012711,
            12: 19.041230,

        }],
        1998: [{
            01: 19.149765,
            02: 19.312538,
            03: 19.416825,
            04: 19.511967,
            05: 19.599770,
            06: 19.740888,
            07: 19.770499,
            08: 19.715141,
            09: 19.618536,
            10: 19.557718,
            11: 19.579231,
            12: 19.543988,

        }],
        1999: [{
            01: 19.626072,
            02: 19.753641,
            03: 20.008462,
            04: 20.264570,
            05: 20.359813,
            06: 20.369992,
            07: 20.384250,
            08: 20.535093,
            09: 20.648036,
            10: 20.728563,
            11: 20.927557,
            12: 21.124276,

        }],
        2000: [{
            01: 21.280595,
            02: 21.410406,
            03: 21.421111,
            04: 21.448958,
            05: 21.468262,
            06: 21.457527,
            07: 21.521899,
            08: 21.821053,
            09: 22.085087,
            10: 22.180052,
            11: 22.215540,
            12: 22.279965,

        }],
        2001: [{
            01: 22.402504,
            02: 22.575003,
            03: 22.685620,
            04: 22.794510,
            05: 22.985983,
            06: 23.117003,
            07: 23.255705,
            08: 23.513843,
            09: 23.699602,
            10: 23.803880,
            11: 24.027636,
            12: 24.337592,

        }],
        2002: [{
            01: 24.517690,
            02: 24.780029,
            03: 24.856847,
            04: 25.010959,
            05: 25.181033,
            06: 25.203695,
            07: 25.357437,
            08: 25.649047,
            09: 25.869628,
            10: 26.084345,
            11: 26.493869,
            12: 27.392011,

        }],
        2003: [{
            01: 28.131595,
            02: 28.826445,
            03: 29.247311,
            04: 29.647999,
            05: 30.057141,
            06: 30.354706,
            07: 30.336493,
            08: 30.348627,
            09: 30.403254,
            10: 30.652560,
            11: 30.772104,
            12: 30.885960,

        }],
        2004: [{
            01: 31.052744,
            02: 31.310481,
            03: 31.432591,
            04: 31.611756,
            05: 31.741364,
            06: 31.868329,
            07: 32.027670,
            08: 32.261471,
            09: 32.422778,
            10: 32.477896,
            11: 32.533108,
            12: 32.676253,

        }],
        2005: [{
            01: 32.957268,
            02: 33.145124,
            03: 33.290962,
            04: 33.533986,
            05: 33.839145,
            06: 34.076019,
            07: 34.038535,
            08: 34.048746,
            09: 34.048746,
            10: 34.099819,
            11: 34.297597,
            12: 34.482804,

        }],
        2006: [{
            01: 34.620735,
            02: 34.752293,
            03: 34.832223,
            04: 34.926270,
            05: 34.968181,
            06: 35.013639,
            07: 34.989129,
            08: 35.027617,
            09: 35.020611,
            10: 35.076643,
            11: 35.227472,
            12: 35.375427,

        }],
        2007: [{
            01: 35.594754,
            02: 35.769168,
            03: 35.919398,
            04: 36.077443,
            05: 36.171244,
            06: 36.265289,
            07: 36.377711,
            08: 36.494119,
            09: 36.709434,
            10: 36.801207,
            11: 36.911610,
            12: 37.070329,

        }],
        2008: [{
            01: 37.429911,
            02: 37.688177,
            03: 37.869080,
            04: 38.062212,
            05: 38.305810,
            06: 38.673545,
            07: 39.025474,
            08: 39.251821,
            09: 39.334249,
            10: 39.393250,
            11: 39.590216,
            12: 39.740658,

        }],
        2009: [{
            01: 39.855905,
            02: 40.110982,
            03: 40.235326,
            04: 40.315796,
            05: 40.537532,
            06: 40.780757,
            07: 40.952036,
            08: 41.046225,
            09: 41.079061,
            10: 41.144787,
            11: 41.243534,
            12: 41.396135,

        }],
        2010: [{
            01: 41.495485,
            02: 41.860645,
            03: 42.153669,
            04: 42.452960,
            05: 42.762866,
            06: 42.946746,
            07: 42.899504,
            08: 42.869474,
            09: 42.839465,
            10: 43.070798,
            11: 43.467049,
            12: 43.914759,

        }],
        2011: [{
            01: 44.178247,
            02: 44.593522,
            03: 44.834327,
            04: 45.130233,
            05: 45.455170,
            06: 45.714264,
            07: 45.814835,
            08: 45.814835,
            09: 46.007257,
            10: 46.214289,
            11: 46.362174,
            12: 46.626438,

        }],
        2012: [{
            01: 46.864232,
            02: 47.103239,
            03: 47.286941,
            04: 47.372057,
            05: 47.675238,
            06: 47.937451,
            07: 48.062088,
            08: 48.268754,
            09: 48.485963,
            10: 48.791424,
            11: 49.137843,
            12: 49.403187,

        }],
        2013: [{
            01: 49.768770,
            02: 50.226642,
            03: 50.487820,
            04: 50.790746,
            05: 51.090411,
            06: 51.269227,
            07: 51.412780,
            08: 51.345943,
            09: 51.428096,
            10: 51.566951,
            11: 51.881509,
            12: 52.161669,

        }],
        2014: [{
            01: 52.537233,
            02: 52.868217,
            03: 53.206573,
            04: 53.642866,
            05: 54.061280,
            06: 54.385647,
            07: 54.527049,
            08: 54.597934,
            09: 54.696210,
            10: 54.964221,
            11: 55.173085,
            12: 55.465502,

        }],
        2015: [{
            01: 55.809388,
            02: 56.635366,
            03: 57.292336,
            04: 58.157450,
            05: 58.570367,
            06: 59.150213,
            07: 59.605669,
            08: 59.951381,
            09: 60.101259,
            10: 60.407775,
            11: 60.872914,
            12: 61.548603,

        }],
        2016: [{
            01: 62.102540,
            02: 63.040288,
            03: 63.639170,
            04: 63.919182,
            05: 64.328264,
            06: 64.958680,
            07: 65.263985,
            08: 65.681674,
            09: 65.885287,
            10: 65.937995,
            11: 66.050089,
            12: 66.096324,

        }],
        2017: [{
            01: 66.188858,
            02: 66.466851,
            03: 66.626371,
            04: 66.839575,
            05: 66.893046,
            06: 67.133860,
            07: 66.932458,
            08: 67.046243,
            09: 67.026129,
            10: 67.012723,
            11: 67.260670,
            12: 67.381739,

        }],
        2018: [{
            01: 67.556931,
            02: 67.712311,
            03: 67.834193,
            04: 67.881676,
            05: 68.024227,
            06: 68.316731,
            07: 69.293660,
            08: 69.466894,
            09: 69.466894,
            10: 69.675294,
            11: 69.953995,
            12: 69.779110,

        }],
        2019: [{
            01: 69.876800,
            02: 70.128356,
            03: 70.507049,
            04: 71.049953,
            05: 71.476252,
            06: 71.583466,
            07: 71.590624,
            08: 71.662214,
            09: 71.748208,
            10: 71.712333,
            11: 71.741017,
            12: 72.128418,

        }],
        2020: [{
            01: 73.008384,
            02: 73.147099,
            03: 73.271449,
            04: 73.403337,
            05: 73.234509,
            06: 73.051422,
            07: 73.270576,
            08: 73.592966,
            09: 73.857900,
            10: 74.500463,
            11: 75.163517,
            12: 75.877570,

        }],
        2021: [{
            01: 76.985382,
            02: 77.193242,
            03: 77.826226,
            04: 78.495531,
            05: 78.793814,
            06: 79.550234,
            07: 80.027535,
            08: 80.843815,
            09: 81.555240,
            10: 82.533902,
            11: 83.491295,
            12: 84.192621,
        }],

        2022: [{
            01: 84.807227,
            02: 85.375435,
            03: 86.229189,
            04: 87.703708,
            05: 88.615826,
            06: 89.014597,
            07: 89.566487,
            08: 89.029088,
            09: null,
            10: null,
            11: null,
            12: null,
        }],

    }

    //    moment.locale('pt-BR')
    //get month and year, transform them to number; these variables will be used to get the respective indexes
    var initialMonthIndex = parseInt(moment(initialDate, "DD/MM/YYYY").format("MM"));
    var initialYearIndex = parseInt(moment(initialDate, "DD/MM/YYYY").format("YYYY"));
    var finalMonthIndex = parseInt(moment(finalDate, "DD/MM/YYYY").format("MM"));
    var finalMonthIndexA = moment(finalDate, "DD/MM/YYYY").format("MMMM")
    var finalYearIndex = parseInt(moment(finalDate, "DD/MM/YYYY").format("YYYY"));
    var finalYearIndexA = moment(finalDate, "DD/MM/YYYY").format("YYYY")



    //check if the chosen year is in the future; if it is, we will use the current year and month
    if (initialYearIndex > moment().year()) {  //if the year is in the future 
        initialYearIndex = parseInt(moment().format('YYYY'));
        initialMonthIndex = parseInt(moment().format('MM'));

    }
    if (finalYearIndex > moment().year()) {  //if the year is in the future
        finalYearIndex = parseInt(moment().format('YYYY'));
        finalMonthIndex = parseInt(moment().format('MM'));
    }

    //now we will check if we are in the current year, but using a future month; if this happen, we will set the month to the current one
    if (initialYearIndex == moment().year() && initialMonthIndex > moment().month()) {
        initialMonthIndex = parseInt(moment().format('MM'));
    }
    if (finalYearIndex == moment().year() && finalMonthIndex > moment().month()) {
        finalMonthIndex = parseInt(moment().format('MM'));
    }


    //setting the initial and final indexes when they are blank to use today date
    if (isNaN(initialMonthIndex) || isNaN(initialYearIndex)) {
        initialYearIndex = parseInt(moment().format('YYYY'));
        initialMonthIndex = parseInt(moment().format('MM'));
    }
    if (isNaN(finalMonthIndex) || isNaN(finalYearIndex)) {
        finalYearIndex = parseInt(moment().format('YYYY'));
        finalMonthIndex = parseInt(moment().format('MM'));
    }

    //setting the finalMonthIndex to use this month if the finalMonthIndex is in the future
    /*   if (finalMonthIndex == null) {
           finalMonthIndex = parseInt(moment().subtract(1, 'months').format('MM'))
       }*/

    //getting the indexes
    var initialIndex = calcIndex[initialYearIndex][0][initialMonthIndex]
    var finalIndex = calcIndex[finalYearIndex][0][finalMonthIndex]

    //adjusting the indexes if they are null to use the current month index

    //while finalIndex == null, subtract 1 month from the finalMonthIndex
    let notCurrentMonthIndex = false;
    while (finalIndex == null) {
        finalMonthIndex = finalMonthIndex - 1;
        finalIndex = calcIndex[finalYearIndex][0][finalMonthIndex];
        notCurrentMonthIndex = true;
        finalMonthIndexA = moment().subtract(1, 'months').format('MMMM')

    }

    //while initialIndex == null, add 1 month to the initialMonthIndex
    while (initialIndex == null) {
        initialMonthIndex = initialMonthIndex - 1;
        initialIndex = calcIndex[initialYearIndex][0][initialMonthIndex];
    }


    /*    if (initialIndex == null) {
            initialMonthIndex = parseInt(moment().subtract(1, 'months').format('MM'))
            initialIndex = calcIndex[parseInt(moment().format('YYYY'))][0][(initialMonthIndex)]
            //alert('Usando índice de ' + initialMonthIndex + '/' + parseInt(moment().format('YYYY')));
        }*/

    //calculating the updated caseValue using the indexes; the calculation is done using the formula:
    //caseValue divided by the initialIndex, times the finalIndex; then we round it to 2 decimals
    let caseValueUpdated = parseFloat((caseValueNumberDecimal / initialIndex) * finalIndex).toFixed(2)

    //create a let for the caseValueUpdated that show it with the correct currency
    let caseValueUpdatedCurrency = caseValueUpdated.toString().replace(".", ",")
    caseValueUpdatedCurrency = 'R$ ' + caseValueUpdatedCurrency

    //add dot to every thousand and millions
    caseValueUpdatedCurrency = caseValueUpdatedCurrency.replace(/\B(?=(\d{3})+(?!\d))/g, ".");



    //caseCosts are 1% of caseValueUpdated; appeal costs are 4¨% of senteceValue
    let caseCosts = parseFloat(caseValueUpdated * 0.01).toFixed(2)
    if (sentenceValueNumberDecimal == "" || sentenceValueNumberDecimal == 0 || sentenceValueNumberDecimal == undefined || isNaN(sentenceValueNumberDecimal)) {
        sentenceValueNumberDecimal = caseValueUpdated;
    }
    
    let appealCosts = parseFloat(sentenceValueNumberDecimal * 0.04).toFixed(2)




    //now we will check if the caseValueUpdate and sentenceValue are less than 5 UFESPs; if it is, then it will assume the value of 5 UFESP
    if (caseCosts < (5 * UFESP)) {
        caseCosts = (5 * UFESP)
    }
    if (appealCosts < (5 * UFESP)) {
        appealCosts = (5 * UFESP)
    }

    //convert UFESP dots to comma

    UFESPCurrency = UFESP.toString().replace(".", ",")
    UFESPCurrency = 'R$ ' + UFESPCurrency


    //let totalCosts is the sum of caseCosts and appealCosts

    //sum caseCosts and appealCosts


    //turn caseCosts and appealCosts to number and sum them
    let totalCosts = parseFloat(caseCosts) + parseFloat(appealCosts)
    totalCosts = totalCosts.toFixed(2)


    caseCosts = caseCosts.toString().replace(".", ",")
    appealCosts = appealCosts.toString().replace(".", ",")
    totalCosts = totalCosts.toString().replace(".", ",")

    if ($(window).width() > 860) {
        var pre = '<small>Índice: ';
        var pos = ' </small>'
    }
    else {
        pre = ''
        pos = ''
    }
    //convert dots from initialIndex and finalIndex into comma
    initialIndex = initialIndex.toString().replace(".", ",")
    finalIndex = finalIndex.toString().replace(".", ",")


    document.getElementById("resultCaseValue").innerHTML = caseValue
    document.getElementById("resultInitialDate").innerHTML = initialDate
    document.getElementById("resultFinalDate").innerHTML = finalDate
    $(".resultCaseValueUpdated").html(caseValueUpdatedCurrency)
    $(".resultSentenceValue").html(sentenceValue)
    document.getElementById("UFESPValue").innerHTML = UFESPCurrency
    $(".resultInitialIndex").html(pre + initialIndex + pos)
    $(".resultFinalIndex").html(pre + finalIndex + pos)


    /*$('#table3').bootstrapTable({
        columns: [{
            field: 'valor',
            title: 'Valor da Causa:'
        }, {
            field: 'dataInicial',
            title: 'Data Inicial:'
        }, {
            field: 'dataFinal',
            title: 'Data Final:'
        }, {
            field: 'valorAtualizado',
            title: 'Valor Atualizado:'
        }],
        data: [{
            valor: caseValue,
            dataInicial: initialDate,
            dataFinal: finalDate,
            valorAtualizado: caseValueUpdatedCurrency,
        }, {
 
            valor: '',
            name: 'Item 2',
            price: '$2'
        }]
    })
    $('#table3').bootstrapTable({
        columns: [{
            field: 'valor',
            title: 'Valor da Causa:'
        }, {
            field: 'dataInicial',
            title: 'Data Inicial:'
        }, {
            field: 'dataFinal',
            title: 'Data Final:'
        }, {
            field: 'valorAtualizado',
            title: 'Valor Atualizado:'
        }],
        data: [{
            valor: caseValue,
            dataInicial: initialDate,
            dataFinal: finalDate,
            valorAtualizado: casev
        }]
    })*/
    //$('#table').bootstrapTable()
    //$(".resultCaseValueUpdated").html('111')


    if (notCurrentMonthIndex == true) {
        $(".resultFinalIndex").append('*')
        $("#obs").html('*Utilizando índice de ' + '<b>' + finalMonthIndexA + '/' + finalYearIndexA + '</b>' + ' uma vez que o índice do mês atual ainda não foi divulgado')
        console.log('deu certo')
    }
    var appealToUse = '';

    if (sentenceValue == 0 || sentenceValue == null || sentenceValue == 'R$ 0,00') {
        var appealToUse = 'Causa Atualizado'
        switch (notCurrentMonthIndex) {
            case true:
                $("[class=resultSentenceValue]").append('**')
                $("#obs2").html('** Valor da sentença não informado. Utilizando o valor da causa.')
                break
            case false:
                $("[class=resultSentenceValue]").append('*')
                $("#obs2").html('* Valor da sentença não informado. Utilizando o valor da causa.')

        }

    }
    else { appealToUse = 'Sentença' }




    String.prototype.extenso = function (c) {
        var ex = [
            ["zero", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove", "dez", "onze", "doze", "treze", "catorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"],
            ["dez", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"],
            ["cem", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"],
            ["mil", "milhão", "bilhão", "trilhão", "quadrilhão", "quintilhão", "sextilhão", "setilhão", "octilhão", "nonilhão", "decilhão", "undecilhão", "dodecilhão", "tredecilhão", "quatrodecilhão", "quindecilhão", "sedecilhão", "septendecilhão", "octencilhão", "nonencilhão"]
        ];
        var a, n, v, i, n = this.replace(c ? /[^,\d]/g : /\D/g, "").split(","), e = " e ", $ = "real", d = "centavo", sl;
        for (var f = n.length - 1, l, j = -1, r = [], s = [], t = ""; ++j <= f; s = []) {
            j && (n[j] = (("." + n[j]) * 1).toFixed(2).slice(2));
            if (!(a = (v = n[j]).slice((l = v.length) % 3).match(/\d{3}/g), v = l % 3 ? [v.slice(0, l % 3)] : [], v = a ? v.concat(a) : v).length) continue;
            for (a = -1, l = v.length; ++a < l; t = "") {
                if (!(i = v[a] * 1)) continue;
                i % 100 < 20 && (t += ex[0][i % 100]) ||
                    i % 100 + 1 && (t += ex[1][(i % 100 / 10 >> 0) - 1] + (i % 10 ? e + ex[0][i % 10] : ""));
                s.push((i < 100 ? t : !(i % 100) ? ex[2][i == 100 ? 0 : i / 100 >> 0] : (ex[2][i / 100 >> 0] + e + t)) +
                    ((t = l - a - 2) > -1 ? " " + (i > 1 && t > 0 ? ex[3][t].replace("ão", "ões") : ex[3][t]) : ""));
            }
            a = ((sl = s.length) > 1 ? (a = s.pop(), s.join(" ") + e + a) : s.join("") || ((!j && (n[j + 1] * 1 > 0) || r.length) ? "" : ex[0][0]));
            a && r.push(a + (c ? (" " + (v.join("") * 1 > 1 ? j ? d + "s" : (/0{6,}$/.test(n[0]) ? "de " : "") + $.replace("l", "is") : j ? d : $)) : ""));
        }
        return r.join(e);
    }

    //totalCosts convert dot to comma and add R$ to the begin
    totalCosts = totalCosts.toString().replace(".", ",")

    totalCosts = 'R$ ' + totalCosts
    totalCosts = totalCosts.replace(/\B(?=(\d{3})+(?!\d))/g, ".")


    // the same to caseCosts
    caseCosts = caseCosts.toString().replace(".", ",")
    caseCosts = 'R$ ' + caseCosts
    caseCosts = caseCosts.replace(/\B(?=(\d{3})+(?!\d))/g, ".")

    //the same to appealCosts
    appealCosts = appealCosts.toString().replace(".", ",")
    appealCosts = 'R$ ' + appealCosts
    appealCosts = appealCosts.replace(/\B(?=(\d{3})+(?!\d))/g, ".")







    var arrumatotalCosts = totalCosts.extenso(true)


    const re = / e .* e .* e .* e /.test(arrumatotalCosts);


    //re = new RegExp(/ e .* e /)
    if (re == true && arrumatotalCosts.includes('mil') && (arrumatotalCosts.includes('real') || arrumatotalCosts.includes('reais'))) {
        //    console.log()
        arrumatotalCosts = arrumatotalCosts.replace(' e', ',');
    }


    $("#resultCaseCosts").html(caseCosts)
    $("#resultAppealCosts").html(appealCosts)
    $(".resultTotalCosts").html('<span id="txtCopy" data-clipboard-text="' + totalCosts + '">' + totalCosts + ' (' + (arrumatotalCosts) + ')' + '</span>')
    $(".resultTotalCosts").html()
    $(".appealToUse").html(appealToUse + '<sup>1</sup>: ')


    $("#btnCopy").attr("data-clipboard-text", totalCosts + ' (' + (totalCosts.extenso(true)) + ')')




    console.log('Custas 1% :' + caseCosts);
    console.log('Custas 5%: ' + appealCosts);
    console.log('Total das Custas ' + totalCosts);
    console.log('Índice Final: ' + finalIndex);
    console.log('Índice Inicial: ' + initialIndex);
    console.log('appealToUse: ' + appealToUse);





    //caseValueUpdate should have two decimal






    console.log(initialDate, initialMonthIndex, initialYearIndex);







    //calcIndex[2023][0][05];


    const data = {
        years:
            [{ //0 2000
                01: '86.5054'
            }, { //1 2001
                01: '85.5054'
            }, { //2 2002
                01: '86.5054'
            }]

    };

    const item_name = data['years'][01][01];

    //show the value of month: '03' in year: '2020'
    //console.log(item_name);






    //show the value of year 2022 and month '01' from const monthIndex




    var clipboard = new ClipboardJS('#btnCopy', { container: document.getElementById('txtCopy') })
    clipboard.on('success', function (e) {
        e.clearSelection();
        new bootstrap.Toast(document.querySelector('#basicToast')).show();
    });



    document.querySelector("#basicToastBtn").onclick = function () {

    }
    //clicK on button with id btn-close remove all inputs values


    document.getElementById('close').addEventListener('click', function () {
        document.getElementById('first').reset();
        //initialDate value must be reset
        document.getElementById('initialDate').value = '          ';
        // If you are using jQuery then: $('#new_customer')[0].reset();

    });



})
