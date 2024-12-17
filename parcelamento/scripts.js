

$(document).ready(function () {
    $('#exequente_presente').change(function () {
        if ($(this).is(':checked')) {
            $('#exequente_section').removeClass('hidden');
            $('#cpf_exequente_section').removeClass('hidden');
        } else {
            $('#exequente_section').addClass('hidden');
            $('#cpf_exequente_section').addClass('hidden');
        }
    });
});
document.addEventListener('DOMContentLoaded', function () {
    var element = document.getElementById('numero_processo');
    var maskOptions = {
        mask: '0000000-00.2X00.8.26.0344',
        definitions: {
            X: {
                mask: '0',
                displayChar: '0',
                placeholderChar: '0',
            },
        },
        lazy: false,
        overwrite: 'shift',
    };

    var mask = IMask(element, maskOptions);
    document.getElementById('valor_acordo_menor').addEventListener('change', function () {
        var valorOriginalSection = document.getElementById('valor_original_section');
        if (this.value === 'sim') {
            valorOriginalSection.classList.remove('hidden');
        } else {
            valorOriginalSection.classList.add('hidden');
        }
    });


    $(function () {
        $.datepicker.setDefaults($.datepicker.regional['pt-BR'] = {
            closeText: 'Fechar',
            prevText: '&#x3C;Anterior',
            nextText: 'Próximo&#x3E;',
            currentText: 'Hoje',
            monthNames: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
            monthNamesShort: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
                'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
            dayNames: ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'],
            dayNamesShort: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
            dayNamesMin: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
            weekHeader: 'Sm',
            dateFormat: 'dd/mm/yy',
            firstDay: 0,
            isRTL: false,
            showMonthAfterYear: false,
            yearSuffix: ''
        });
        const today = new Date();
        const maxDate = new Date();
        maxDate.setDate(today.getDate() + 45);
        //ifmaxDate is a Saturday or Sunday, then jump to next business day
        if (maxDate.getDay() === 0) maxDate.setDate(today.getDate() + 0);
        if (maxDate.getDay() === 6) maxDate.setDate(today.getDate() + 0);


        $("#data_primeira_parcela").datepicker({
            dateFormat: "dd/mm/yy",
            maxDate: maxDate,
            beforeShowDay: function (date) {
                var day = date.getDay();
                return [(day != 0 && day != 6), ''];
            }
        });

        $('#havera_entrada').change(function () {
            if (this.checked) {
                $('#entrada_section').removeClass('hidden');
                $('#restante_section').removeClass('hidden');
                $('#data_entrada_section').removeClass('hidden'); // Show the date picker for entry date
            } else {
                $('#entrada_section').addClass('hidden');
                $('#restante_section').addClass('hidden');
                $('#data_entrada_section').addClass('hidden'); // Hide the date picker for entry date
                $('#valor_entrada').val('0'); // Ensure the value is set to 0
                $('#data_entrada').val(''); // Clear the entry date
                updateParcelas();
            }
        });

        // Ensure the value is set to 0 at the beginning
        $('#valor_entrada').val('0');
        //onchange valor_divida, valor_restante = valor_divida - valor_entrada
        $('#valor_divida').change(function () {
            const valorDivida = parseFloat($(this).val().replace('R$ ', '').replace(',', '.'));
            let valorEntrada = parseFloat($('#valor_entrada').val().replace('R$ ', '').replace(',', '.'));
            if (isNaN(valorEntrada)) {
                valorEntrada = 0;
            }
            const valorRestante = valorDivida - valorEntrada;
            $('#valor_restante').val(`R$ ${formatCurrency(valorRestante)}`);
            updateParcelas();
        });






        $("#data_entrada").datepicker({
            dateFormat: "dd/mm/yy"
        });

        $('#valor_entrada').change(updateParcelas);
        $('#parcelas').on('change', function () {
            $('#resto').addClass('hidden');
            $('#ultima_parcela_section').addClass('hidden');
            updateParcelasFromParcelas();
            updateDatasParcelas(parseFloat($('#valor_restante').val().replace('R$ ', '').replace(',', '.')), parseInt($('#parcelas').val()));
        });
        $('#valor_parcela_insert').change(function () {
            $('#resto').removeClass('hidden');
            updateParcelasFromValorParcela();
        });
        $('#aplicar_juros').change(updateParcelasFromValorParcela);

        $('#valor_entrada').change(function () {
            const valorDivida = parseFloat($('#valor_divida').val().replace('R$ ', '').replace(',', '.'));
            let valorEntrada = parseFloat($(this).val().replace('R$ ', '').replace(',', '.'));
            if (isNaN(valorEntrada)) {
                valorEntrada = 0;
                valorRestante = 0;
            }
            if (!isNaN(valorDivida)) {
                const valorRestante = valorDivida - valorEntrada;
                console.log('aqui');
                $('#valor_restante').val(`R$ ${formatCurrency(valorRestante)}`);
                updateParcelas();
            }
            if (valorEntrada === 0) {
                $('#valor_restante').val('nova_parcela');
                updateParcelasFromValorParcela();
            }
        });

        function updateParcelas() {
            const valorDivida = parseFloat($('#valor_divida').val().replace('R$ ', '').replace(',', '.'));
            let valorEntrada = parseFloat($('#valor_entrada').val().replace('R$ ', '').replace(',', '.'));
            if (isNaN(valorEntrada)) {
                valorEntrada = 0;
            }
            let valorRestante = valorDivida - valorEntrada;

            if (!isNaN(valorRestante)) {
                $('#valor_restante').val(`R$ ${formatCurrency(valorRestante)}`);
            } else {
                $('#valor_restante').val('');
            }

            const parcelas = parseInt($('#parcelas').val());
            if (!isNaN(parcelas) && parcelas > 0 && !isNaN(valorRestante)) {
                const valorParcela = Math.floor(valorRestante / parcelas);
                const resto = valorRestante % parcelas;
                if (!isNaN(valorParcela)) {
                    $('#valor_parcela').val(valorParcela.toFixed(2));
                    if (resto > 0) {
                        $('#ultima_parcela_info').text(`Última parcela no valor de R$ ${(valorParcela + resto).toFixed(2)}`);
                        $('#ultima_parcela_section').removeClass('hidden');
                    } else {
                        $('#ultima_parcela_info').text('');
                        $('#ultima_parcela_section').addClass('hidden');
                    }
                } else {
                    $('#valor_parcela').val('');
                }
                updateDatasParcelas(valorRestante, parcelas);
            } else {
                $('#valor_parcela').val('');
            }
        }

        function updateParcelasFromParcelas() {
            console.log('entrou na função ok')
            const valorRestante = parseFloat($('#valor_restante').val().replace('R$ ', '').replace(',', '.'));
            const parcelas = parseInt($('#parcelas').val());

            if (!isNaN(parcelas) && parcelas > 0 && !isNaN(valorRestante)) {

                valorParcela = (valorRestante / parcelas).toFixed(2);;
                //remake the above to show it in currency (reais)





                const somaParcelas = valorParcela * (parcelas - 1);

                const ultimaParcela = valorRestante - somaParcelas;
                console.log('ultima', ultimaParcela)
                console.log('soma', somaParcelas)
                console.log('valorRestante', valorRestante)
                console.log('parcelas', parcelas)
                console.log('valor parcela', valorParcela)

                const resto = valorRestante % parcelas;
                $('#valor_parcela').val(valorParcela);
                if (resto > 0) {
                    $('#ultima_parcela_info').text(`última parcela no valor de R$ ${ultimaParcela.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
                    $('#ultima_parcela_section').removeClass('hidden');
                } else {
                    $('#ultima_parcela_info').text('');
                    $('#ultima_parcela_section').addClass('hidden');
                }
                //if valor_resto value checked is nova_parcela, then add +1 to parcelas
                if ($('#valor_restante').val() === 'nova_parcela') {
                    console.log('aqui124')
                    //   parcelas = parcelas + 1;
                    $('#valor_restante').val('');
                }


                updateDatasParcelas(valorRestante, parcelas + (resto > 0 ? 1 : 0));
            }
        }

        //change resto_ultima_parcela, then updateParcelasFromValorParcela()
        $('#resto_ultima_parcela').change(function () {
            updateParcelasFromValorParcela();
        });

        $('#resto_nova_parcela').change(function () {
            console.log('nova parcela');
            handleRestoNovaParcela();
        });
        function calcularParcelas(valorTotal, valorParcela) {
            const numeroParcelas = Math.floor(valorTotal / valorParcela);
            const resto = valorTotal % valorParcela;

            const parcelas = new Array(numeroParcelas).fill(valorParcela);
            if (resto > 0) {
                parcelas.push(resto);
            }

            return parcelas;
        }

        function handleRestoNovaParcela() {
            console.log('entrou na função handleRestoNovaParcela');

            const valorDivida = parseFloat($('#valor_divida').val().replace('R$ ', '').replace(',', '.'));
            let valorEntrada = parseFloat($('#valor_entrada').val().replace('R$ ', '').replace(',', '.'));
            const valorRestanteFix = valorDivida - valorEntrada;
            document.getElementById('valor_restante').value = `R$ ${formatCurrency(valorRestanteFix)}`;

            // Obtenha o valor do campo #valor_restante e remova caracteres indesejados
            let valorRestanteStr = $('#valor_restante').val();
            if (!valorRestanteStr) {
                valorRestanteStr = '0';
            }
            valorRestanteStr = valorRestanteStr.replace('R$ ', '').replace('.', '').replace(',', '.');
            let valorRestante = parseFloat(valorRestanteStr);
            console.log('valor sem parse', valorRestante);

            // Obtenha o valor do campo #valor_parcela_insert e remova caracteres indesejados
            let valorParcelaStr = $('#valor_parcela_insert').val();
            valorParcelaStr = valorParcelaStr.replace('R$ ', '').replace('.', '').replace(',', '.');
            const valorParcela = parseFloat(valorParcelaStr);

            console.log('valorRestante', valorRestante);
            console.log('valorParcela', valorParcela);

            if (!isNaN(valorParcela) && valorParcela > 0 && !isNaN(valorRestante)) {
                console.log('if do handle');
                const parcelas = calcularParcelas(valorRestante, valorParcela);
                const numeroParcelas = parcelas.length;
                const resto = parcelas[parcelas.length - 1] !== valorParcela ? parcelas[parcelas.length - 1] : 0;

                $('#numero_parcelas').val(numeroParcelas);
                $('#valor_resto').val(`R$ ${resto.toFixed(2)}`);
                if (resto > 0) {
                    $('#resto_section').removeClass('hidden');
                } else {
                    $('#resto_section').addClass('hidden');
                }
                updateDatasParcelasFromValorParcela(valorRestante, valorParcela, numeroParcelas);
                console.log(`Total de parcelas: ${numeroParcelas}`);
            } else {
                console.log('else do handle');
                $('#valor_parcela').val('');
            }
        }


        function updateParcelasFromValorParcela() {
            console.log('entrou na função Valor Parcela');
            const restoOption = $('input[name="resto_option"]:checked').val();
            console.log('restoOption', restoOption);

            // Obtenha o valor do campo #valor_restante e remova caracteres indesejados
            let valorRestanteStr = $('#valor_restante').val();
            valorRestanteStr = valorRestanteStr.replace('R$ ', '').replace('.', '').replace(',', '.');
            const valorRestante = parseFloat(valorRestanteStr);

            // Obtenha o valor do campo #valor_parcela_insert e remova caracteres indesejados
            let valorParcelaStr = $('#valor_parcela_insert').val();
            valorParcelaStr = valorParcelaStr.replace('R$ ', '').replace('.', '').replace(',', '.');
            const valorParcela = parseFloat(valorParcelaStr);

            console.log('valorRestante', valorRestante);
            console.log('valorParcela', valorParcela);

            if (!isNaN(valorParcela) && valorParcela > 0 && !isNaN(valorRestante)) {
                let parcelas = Math.floor(valorRestante / valorParcela);
                const resto = valorRestante % valorParcela;

                if (resto > 0 && restoOption === 'nova_parcela') {
                    parcelas += 1;
                }

                $('#numero_parcelas').val(parcelas);
                $('#valor_resto').val(`R$ ${resto.toFixed(2)}`);
                if (resto > 0) {
                    $('#resto_section').removeClass('hidden');
                } else {
                    $('#resto_section').addClass('hidden');
                }
                updateDatasParcelasFromValorParcela(valorRestante, valorParcela, parcelas);
                console.log(`Total de parcelas: ${parcelas}`);
            } else {
                $('#valor_parcela').val('');
            }
        }

        function updateDatasParcelas(valorRestante, parcelas) {
            const aplicarJurosElement = document.getElementById('aplicar_juros');
            const aplicarJuros = aplicarJurosElement ? aplicarJurosElement.checked : false;
            var valorEntrada = document.getElementById('valor_entrada').value;
            if (valorEntrada === '' || valorEntrada === '0' || valorEntrada === null) {
                valorEntrada = 0;
            }

            const dataPrimeiraParcelaElement = document.getElementById('data_primeira_parcela');
            const valorParcelaElement = document.getElementById('valor_parcela');
            const datasParcelasElement = document.getElementById('datas_parcelas');

            if (!dataPrimeiraParcelaElement || !valorParcelaElement || !datasParcelasElement) {
                console.error('Um ou mais elementos necessários não foram encontrados.');
                return;
            }

            const dataPrimeiraParcela = parseDate(dataPrimeiraParcelaElement.value);
            if (isNaN(dataPrimeiraParcela)) {
                console.error('Data da primeira parcela inválida.');
                return;
            }

            function isWeekday(date) {
                const day = date.getDay();
                return day !== 0 && day !== 6; // 0 = Domingo, 6 = Sábado
            }

            datasParcelasElement.innerHTML = '';

            const container = document.createElement('div');
            container.style.display = 'flex';
            container.style.flexWrap = 'wrap';

            let table = createTable();

            for (let i = 0; i < parcelas - 1; i++) { // Adjust loop to go up to parcelas - 1
                if (i > 0 && i % 10 === 0) {
                    container.appendChild(table);
                    table = createTable();
                }

                let dataParcela = new Date(dataPrimeiraParcela);
                dataParcela.setMonth(dataParcela.getMonth() + i);

                // Ajusta a data para o próximo dia útil, se necessário
                while (!isWeekday(dataParcela)) {
                    dataParcela.setDate(dataParcela.getDate() + 1);
                }

                // Calcular o valor da parcela com juros de 1% ao mês, se aplicável
                const valorParcelaComJuros = aplicarJuros ? (valorRestante * Math.pow(1.01, i + 1)) / parcelas : valorRestante / parcelas;

                const row = document.createElement('tr');

                const cellNumber = document.createElement('td');
                cellNumber.textContent = i + 1;
                cellNumber.style.padding = '0 5px'; // Espaço lateral entre as colunas
                row.appendChild(cellNumber);

                const cellDate = document.createElement('td');
                cellDate.textContent = formatDate(dataParcela); // Formata a data corretamente
                cellDate.style.padding = '0 5px'; // Espaço lateral entre as colunas
                row.appendChild(cellDate);

                const cellValue = document.createElement('td');
                cellValue.textContent = `R$ ${valorParcelaComJuros.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                cellValue.style.padding = '0 5px'; // Espaço lateral entre as colunas
                row.appendChild(cellValue);

                table.appendChild(row);
            }

            // Adiciona a última parcela com o valor ajustado, somando o resto
            const valorParcela = parseFloat($('#valor_parcela').val());
            const somaParcelas = valorParcela * (parcelas - 1);
            const ultimaParcela = valorRestante - somaParcelas;
            let dataParcela = new Date(dataPrimeiraParcela);
            dataParcela.setMonth(dataParcela.getMonth() + (parcelas - 1));

            // Ajusta a data para o próximo dia útil, se necessário
            while (!isWeekday(dataParcela)) {
                dataParcela.setDate(dataParcela.getDate() + 1);
            }

            const row = document.createElement('tr');

            const cellNumber = document.createElement('td');
            cellNumber.textContent = parcelas;
            cellNumber.style.padding = '0 5px'; // Espaço lateral entre as colunas
            row.appendChild(cellNumber);

            const cellDate = document.createElement('td');
            cellDate.textContent = formatDate(dataParcela); // Formata a data corretamente
            cellDate.style.padding = '0 5px'; // Espaço lateral entre as colunas
            row.appendChild(cellDate);

            const cellValue = document.createElement('td');
            cellValue.textContent = `R$ ${ultimaParcela.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            cellValue.style.padding = '0 5px'; // Espaço lateral entre as colunas
            row.appendChild(cellValue);

            table.appendChild(row);

            container.appendChild(table);
            datasParcelasElement.appendChild(container);
        }

        function updateDatasParcelasFromValorParcela(valorRestante, valorParcela, parcelas) {
            const aplicarJurosElement = document.getElementById('aplicar_juros');
            const aplicarJuros = aplicarJurosElement ? aplicarJurosElement.checked : false;
            var valorEntrada = document.getElementById('valor_entrada').value;
            if (valorEntrada === '' || valorEntrada === '0' || valorEntrada === null) {
                valorEntrada = 0;
            }

            const dataPrimeiraParcelaElement = document.getElementById('data_primeira_parcela');
            const valorParcelaElement = document.getElementById('valor_parcela');
            const datasParcelasElement = document.getElementById('datas_parcelas');

            if (!dataPrimeiraParcelaElement || !valorParcelaElement || !datasParcelasElement) {
                console.error('Um ou mais elementos necessários não foram encontrados.');
                return;
            }

            const dataPrimeiraParcela = parseDate(dataPrimeiraParcelaElement.value);
            if (isNaN(dataPrimeiraParcela)) {
                console.error('Data da primeira parcela inválida.');
                return;
            }

            function isWeekday(date) {
                const day = date.getDay();
                return day !== 0 && day !== 6; // 0 = Domingo, 6 = Sábado
            }

            datasParcelasElement.innerHTML = '';

            const container = document.createElement('div');
            container.style.display = 'flex';
            container.style.flexWrap = 'wrap';

            let table = createTable();

            for (let i = 0; i < parcelas - 1; i++) { // Adjust loop to go up to parcelas - 1
                if (i > 0 && i % 10 === 0) {
                    container.appendChild(table);
                    table = createTable();
                }

                let dataParcela = new Date(dataPrimeiraParcela);
                dataParcela.setMonth(dataParcela.getMonth() + i);

                // Ajusta a data para o próximo dia útil, se necessário
                while (!isWeekday(dataParcela)) {
                    dataParcela.setDate(dataParcela.getDate() + 1);
                }

                // Calcular o valor da parcela com juros de 1% ao mês, se aplicável
                const valorParcelaComJuros = aplicarJuros ? (valorRestante * Math.pow(1.01, i + 1)) / parcelas : valorParcela;

                const row = document.createElement('tr');

                const cellNumber = document.createElement('td');
                cellNumber.textContent = i + 1;
                cellNumber.style.padding = '0 5px'; // Espaço lateral entre as colunas
                row.appendChild(cellNumber);

                const cellDate = document.createElement('td');
                cellDate.textContent = formatDate(dataParcela); // Formata a data corretamente
                cellDate.style.padding = '0 5px'; // Espaço lateral entre as colunas
                row.appendChild(cellDate);

                const cellValue = document.createElement('td');
                cellValue.textContent = `R$ ${valorParcelaComJuros.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                cellValue.style.padding = '0 5px'; // Espaço lateral entre as colunas
                row.appendChild(cellValue);

                table.appendChild(row);
            }

            // Adiciona a última parcela com o valor ajustado, somando o resto
            const somaParcelas = valorParcela * (parcelas - 1);
            const ultimaParcela = valorRestante - somaParcelas;
            let dataParcela = new Date(dataPrimeiraParcela);
            dataParcela.setMonth(dataParcela.getMonth() + (parcelas - 1));

            // Ajusta a data para o próximo dia útil, se necessário
            while (!isWeekday(dataParcela)) {
                dataParcela.setDate(dataParcela.getDate() + 1);
            }

            const row = document.createElement('tr');

            const cellNumber = document.createElement('td');
            cellNumber.textContent = parcelas;
            cellNumber.style.padding = '0 5px'; // Espaço lateral entre as colunas
            row.appendChild(cellNumber);

            const cellDate = document.createElement('td');
            cellDate.textContent = formatDate(dataParcela); // Formata a data corretamente
            cellDate.style.padding = '0 5px'; // Espaço lateral entre as colunas
            row.appendChild(cellDate);

            const cellValue = document.createElement('td');
            cellValue.textContent = `R$ ${ultimaParcela.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            cellValue.style.padding = '0 5px'; // Espaço lateral entre as colunas
            row.appendChild(cellValue);

            table.appendChild(row);

            container.appendChild(table);
            datasParcelasElement.appendChild(container);
        }

        function createTable() {
            const table = document.createElement('table');
            table.style.borderCollapse = 'collapse';
            table.style.textAlign = 'center';
            table.style.marginRight = '10px'; // Espaço entre os blocos
            table.style.height = '-webkit-fill-available';


            const headerRow = document.createElement('tr');

            const headerNumber = document.createElement('th');
            headerNumber.textContent = "#";
            headerNumber.style.padding = '0 5px'; // Espaço lateral entre as colunas
            headerRow.appendChild(headerNumber);

            const headerDate = document.createElement('th');
            headerDate.textContent = "Data da Parcela";
            headerDate.style.padding = '0 5px'; // Espaço lateral entre as colunas
            headerRow.appendChild(headerDate);

            const headerValue = document.createElement('th');
            headerValue.textContent = "Valor da Parcela";
            headerValue.style.padding = '0 5px'; // Espaço lateral entre as colunas
            headerRow.appendChild(headerValue);

            table.appendChild(headerRow);

            return table;
        }

        function formatCurrency(value) {
            return value.toFixed(2).replace('.', ',');
        }

        function formatDate(date) {
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
        }

        function parseDate(input) {
            const parts = input.split('/');
            // Note: months are 0-based in JavaScript Date objects
            return new Date(parts[2], parts[1] - 1, parts[0]);
        }

        const btnValorMaior = document.getElementById('btnValorMaior');
        if (btnValorMaior) {
            btnValorMaior.addEventListener('click', function () {
                document.getElementById('novoValorEntrada').style.display = 'inline';
                document.getElementById('novoValorEntrada').style.width = '100px';
            });
        }

        const novoValorEntrada = document.getElementById('novoValorEntrada');
        if (novoValorEntrada) {
            novoValorEntrada.addEventListener('change', function () {
                const valorDividaElement = document.getElementById('valor_divida');
                const valorEntradaElement = document.getElementById('valor_entrada');
                const percentualEntradaElement = document.getElementById('percentualEntrada');

                if (!valorDividaElement || !valorEntradaElement || !percentualEntradaElement) {
                    console.error('Um ou mais elementos necessários não foram encontrados.');
                    return;
                }
                // if the value of novoValorEntrada is 0 or null, then, make the div novoValorEntrada display none again and make percentual be 30%
                if (this.value === '' || this.value === '0') {
                    this.style.display = 'none';
                    const valorEntrada = (parseFloat(valorDividaElement.value) * 0.3).toFixed(2).replace('.', ',');
                    valorEntradaElement.value = `R$ ${valorEntrada}`;
                    percentualEntradaElement.textContent = '30%';
                    document.getElementById('valor_restante').value = `R$ ${(parseFloat(valorDividaElement.value) - parseFloat(valorEntrada.replace(',', '.'))).toFixed(2).replace('.', ',')}`;
                    updateParcelas();
                    return;
                }


                const valorDivida = parseFloat(valorDividaElement.value.replace('R$ ', '').replace(',', '.'));
                const novoValorEntrada = parseFloat(this.value);
                const valorMinimoEntrada = valorDivida * 0.30;

                if (novoValorEntrada < valorMinimoEntrada) {
                    alert(`O valor precisa ser maior que R$ ${valorMinimoEntrada.toFixed(2).replace('.', ',')}`);
                    this.value = '';
                    this.focus();
                    return;
                }

                if (novoValorEntrada >= valorMinimoEntrada) {
                    valorEntradaElement.value = `R$ ${novoValorEntrada.toFixed(2).replace('.', ',')}`;
                    const percentual = ((novoValorEntrada / valorDivida) * 100).toFixed(2);
                    percentualEntradaElement.textContent = `${percentual}%`;
                    document.getElementById('valor_restante').value = `R$ ${(valorDivida - novoValorEntrada).toFixed(2).replace('.', ',')}`;
                    updateParcelas(); // Atualiza as parcelas com o novo valor de entrada
                }
            });
        }

        document.getElementById('valor_divida').addEventListener('change', function () {
            const valorDivida = parseFloat(this.value.replace('R$ ', '').replace(',', '.'));
            if (!isNaN(valorDivida)) {
                const valorEntrada = document.getElementById('valor_entrada').value
                document.getElementById('datas_parcelas_section').classList.remove('hidden');
                updateParcelas();
            }
        });
        let executadoCount = 1;
        const maxExecutados = 4;

        const addExecutadoButton = document.getElementById('add-executado-button');
        if (addExecutadoButton) {
            addExecutadoButton.addEventListener('click', function () {

                if (executadoCount < maxExecutados) {
                    executadoCount++;
                    const executadoSection = document.createElement('div');
                    executadoSection.classList.add('executado-section');
                    executadoSection.id = `executado-${executadoCount}`;
                    executadoSection.innerHTML = `
                    ${executadoCount > 1 ? `<div class="executado-header">Executado ${executadoCount} <span class="remove-executado" data-index="${executadoCount}">Remover</span></div>` : ''}
                    <div class="inline-section">
                        <label>Nome do Executado:</label>
                        <input type="text" class="nome-executado" data-index="${executadoCount}">
                        <input type="hidden" class="genero-executado" data-index="${executadoCount}" value="">
                    </div>
                    <div class="inline-section">
                        <label class="cpf-cnpj-label" data-index="${executadoCount}">CPF/CNPJ:</label>
                        <input type="text" class="cpf-cnpj" data-index="${executadoCount}">
                        <input type="hidden" class="cpf-cnpj-type" data-index="${executadoCount}" value="">
                    </div>
                    <div class="inline-section">
                        <label>Atualizar Endereço?</label>
                        <input type="checkbox" class="atualizar-endereco" data-index="${executadoCount}">
                    </div>
                    <div class="inline-section hidden endereco-section" data-index="${executadoCount}">
                        <label>CEP:</label>
                        <input type="text" class="cep" data-index="${executadoCount}" maxlength="9" placeholder="#####-###">
                    </div>
                    <div class="inline-section hidden endereco-completo-section" data-index="${executadoCount}">
                        <label>Rua:</label>
                        <input type="text" class="rua" data-index="${executadoCount}" readonly>
                        <label class="labnumero">Nº:</label>
                        <input type="text" class="numero" data-index="${executadoCount}" maxlength="6">
                    </div>
                    <div class="inline-section hidden complemento-bairro-section" data-index="${executadoCount}">
                        <label>Complemento:</label>
                        <input type="text" class="complemento" data-index="${executadoCount}">
                        <label class="labbairro">Bairro:</label>
                        <input type="text" class="bairro" data-index="${executadoCount}" readonly>
                    </div>
                    <div class="inline-section hidden cidade-estado-section" data-index="${executadoCount}">
                        <label>Cidade:</label>
                        <input type="text" class="cidade" data-index="${executadoCount}" readonly>
                        <label class="labestado">Estado:</label>
                        <input type="text" class="estado" data-index="${executadoCount}" readonly>
                    </div>
                `;
                    document.getElementById('executados-container').appendChild(executadoSection);
                    addEventListenersToExecutado(executadoCount);

                    if (executadoCount === maxExecutados) {
                        document.getElementById('add-executado-button').style.display = 'none';
                    }
                }
            });
        }
        addEventListenersToExecutado(1);

        function addEventListenersToExecutado(index) {
            const removeButton = document.querySelector(`.remove-executado[data-index="${index}"]`);
            const atualizarEnderecoCheckbox = document.querySelector(`.atualizar-endereco[data-index="${index}"]`);
            const nomeExecutadoInput = document.querySelector(`.nome-executado[data-index="${index}"]`);
            const cepInput = document.querySelector(`.cep[data-index="${index}"]`);
            var cpfCnpjInput = document.querySelector(`.cpf-cnpj[data-index="${index}"]`);
            //cpfCNPJLabel


            if (removeButton) {
                removeButton.addEventListener('click', function () {
                    document.getElementById(`executado-${index}`).remove();
                    executadoCount--;
                    if (executadoCount < maxExecutados) {
                        document.getElementById('add-executado-button').style.display = 'block';
                    }
                });
            }

            if (atualizarEnderecoCheckbox) {
                atualizarEnderecoCheckbox.addEventListener('change', function () {
                    const enderecoSection = document.querySelector(`.endereco-section[data-index="${index}"]`);
                    const enderecoCompletoSection = document.querySelector(`.endereco-completo-section[data-index="${index}"]`);
                    const complementoBairroSection = document.querySelector(`.complemento-bairro-section[data-index="${index}"]`);
                    const cidadeEstadoSection = document.querySelector(`.cidade-estado-section[data-index="${index}"]`);

                    if (this.checked) {
                        enderecoSection.classList.remove('hidden');
                        enderecoCompletoSection.classList.remove('hidden');
                        complementoBairroSection.classList.remove('hidden');
                        cidadeEstadoSection.classList.remove('hidden');
                    } else {
                        enderecoSection.classList.add('hidden');
                        enderecoCompletoSection.classList.add('hidden');
                        complementoBairroSection.classList.add('hidden');
                        cidadeEstadoSection.classList.add('hidden');
                    }
                });
            }

            if (nomeExecutadoInput) {
                nomeExecutadoInput.addEventListener('blur', function () {
                    const nomeExecutado = this.value;
                    if (nomeExecutado) {
                        fetch(`https://api.genderize.io?name=${nomeExecutado}`)
                            .then(response => response.json())
                            .then(data => {
                                const generoExecutadoElement = document.querySelector(`.genero-executado[data-index="${index}"]`);
                                if (data.gender && data.probability >= 0.9) {
                                    generoExecutadoElement.value = data.gender;
                                } else {
                                    generoExecutadoElement.value = 'unknown';
                                }
                            })
                            .catch(error => {
                                console.error('Erro ao determinar o gênero:', error);
                                const generoExecutadoElement = document.querySelector(`.genero-executado[data-index="${index}"]`);
                                generoExecutadoElement.value = 'unknown';
                            });
                    }
                });
            }

            if (cepInput) {
                cepInput.addEventListener('input', function () {
                    const cep = this.value.replace(/\D/g, '');
                    if (cep.length === 8) {
                        fetch(`https://viacep.com.br/ws/${cep}/json/`)
                            .then(response => response.json())
                            .then(data => {
                                if (!data.erro) {
                                    document.querySelector(`.rua[data-index="${index}"]`).value = data.logradouro;
                                    document.querySelector(`.bairro[data-index="${index}"]`).value = data.bairro;
                                    document.querySelector(`.cidade[data-index="${index}"]`).value = data.localidade;
                                    document.querySelector(`.estado[data-index="${index}"]`).value = data.uf;
                                } else {
                                    alert('CEP não encontrado.');
                                }
                            })
                            .catch(error => {
                                console.error('Erro ao buscar o CEP:', error);
                                alert('Erro ao buscar o CEP.');
                            });
                    }
                });

                cepInput.addEventListener('input', function () {
                    this.value = this.value.replace(/\D/g, '').replace(/^(\d{5})(\d)/, '$1-$2');
                });
            }

            if (cpfCnpjInput) {
                IMask(cpfCnpjInput, {
                    mask: [
                        {
                            mask: '000.000.000-00',
                            startsWith: '0',
                            lazy: false,
                            maxLength: 11
                        },
                        {
                            mask: '00.000.000/0000-00',
                            startsWith: '1',
                            lazy: false,
                            maxLength: 15
                        }
                    ],
                    dispatch: function (appended, dynamicMasked) {
                        var number = (dynamicMasked.value + appended).replace(/\D/g, '');
                        var mask = dynamicMasked.compiledMasks.find(function (m) {
                            return number.length <= m.maxLength;
                        });
                        var label = document.querySelector(`.cpf-cnpj-label[data-index="${index}"]`);
                        var typeInput = document.querySelector(`.cpf-cnpj-type[data-index="${index}"]`);
                        if (mask.maxLength === 11) {
                            label.textContent = 'CPF:';
                            typeInput.value = 'CPF';
                        } else {
                            label.textContent = 'CNPJ:';
                            typeInput.value = 'CNPJ';
                        }
                        return mask;
                    }
                });
            }
        }





        const dataPrimeiraParcelaElement = document.getElementById('data_primeira_parcela');
        //const today = new Date();
        const nextMonth = new Date(today);
        nextMonth.setMonth(today.getMonth() + 1);

        if (nextMonth.getDate() !== today.getDate()) {
            nextMonth.setDate(0); // Set to last day of the previous month if the next month doesn't have the same date
        }

        dataPrimeiraParcelaElement.value = formatDate(nextMonth);

        document.getElementById('valor_divida').addEventListener('change', function () {
            const valorDivida = parseFloat(this.value);
            if (!isNaN(valorDivida)) {
                var valorEntrada = document.getElementById('valor_entrada').value// = `${formatCurrency(parseFloat(valorEntrada))}`;
                document.getElementById('datas_parcelas_section').classList.remove('hidden');
                updateParcelas();
            }
        });



        document.getElementById('data_primeira_parcela').addEventListener('change', updateDatasParcelas);

        function updateParcelas() {
            const valorDivida = parseFloat(document.getElementById('valor_divida').value.replace('R$ ', '').replace(',', '.'));
            const valorEntradaElement = document.getElementById('valor_entrada');
            const novoValorEntradaElement = document.getElementById('novoValorEntrada');
            const parcelas = parseInt(document.getElementById('parcelas').value);

            if (isNaN(parcelas) || parcelas < 1) {
                return; // Retorna se o valor das parcelas for menor ou igual a 1
            }

            let valorEntrada = parseFloat(valorEntradaElement.value.replace('R$ ', '').replace(',', '.'));

            if (novoValorEntradaElement && novoValorEntradaElement.value) {
                const novoValorEntrada = parseFloat(novoValorEntradaElement.value);
                if (!isNaN(novoValorEntrada) && novoValorEntrada > (valorDivida * 0.30)) {
                    valorEntrada = novoValorEntrada;
                } else {
                    valorEntrada = parseFloat(valorEntradaElement.value.replace('R$ ', '').replace(',', '.'));
                }
            }

            const valorRestante = valorDivida - valorEntrada;
            document.getElementById('valor_restante').value = `R$ ${formatCurrency(valorRestante)}`;

            const valorParcela = (valorRestante) / parcelas;//para corrigir defeito do campo
            document.getElementById('valor_parcela').value = valorParcela.toFixed(2);
            updateDatasParcelas(valorRestante, parcelas);

            //if valor_resto value checked is nova_parcela, then add +1 to parcelas

        }

        document.getElementById('parcelas').addEventListener('change', updateParcelas);
        document.getElementById('valor_parcela').addEventListener('change', updateParcelas);
        document.getElementById('valor_entrada').addEventListener('change', updateParcelas);
        //document.getElementById('novoValorEntrada').addEventListener('change', updateParcelas);

        function isValidCPF(cpf) {
            cpf = cpf.replace(/[^\d]+/g, '');
            if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
            let sum = 0, remainder;
            for (let i = 1; i <= 9; i++) sum += parseInt(cpf.substring(i - 1, i)) * (11 - i);
            remainder = (sum * 10) % 11;
            if (remainder === 10 || remainder === 11) remainder = 0;
            if (remainder !== parseInt(cpf.substring(9, 10))) return false;
            sum = 0;
            for (let i = 1; i <= 10; i++) sum += parseInt(cpf.substring(i - 1, i)) * (12 - i);
            remainder = (sum * 10) % 11;
            if (remainder === 10 || remainder === 11) remainder = 0;
            return remainder === parseInt(cpf.substring(10, 11));
        }

        function isValidCNPJ(cnpj) {
            cnpj = cnpj.replace(/[^\d]+/g, '');
            if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) return false;
            let length = cnpj.length - 2, numbers = cnpj.substring(0, length), digits = cnpj.substring(length);
            let sum = 0, pos = length - 7;
            for (let i = length; i >= 1; i--) {
                sum += numbers.charAt(length - i) * pos--;
                if (pos < 2) pos = 9;
            }
            let result = sum % 11 < 2 ? 0 : 11 - sum % 11;
            if (result !== parseInt(digits.charAt(0))) return false;
            length += 1;
            numbers = cnpj.substring(0, length);
            sum = 0;
            pos = length - 7;
            for (let i = length; i >= 1; i--) {
                sum += numbers.charAt(length - i) * pos--;
                if (pos < 2) pos = 9;
            }
            result = sum % 11 < 2 ? 0 : 11 - sum % 11;
            return result === parseInt(digits.charAt(1));
        }

        const printButton = document.querySelector('.print-button');
        if (printButton) {
            printButton.addEventListener('click', function () {
                const numeroProcessoElement = document.getElementById('numero_processo');
                const numeroProcesso = numeroProcessoElement.value.trim();
                const maskPlaceholder = '_______-__.20__.8.26.0344';

                if (numeroProcesso === '' || numeroProcesso === maskPlaceholder || numeroProcesso.includes('_')) {
                    alert('Por favor, preencha o campo "Nº do Processo" corretamente.');
                    numeroProcessoElement.focus();
                    return;

                }

                const valorDividaElement = document.getElementById('valor_divida');
                const valorDivida = parseFloat(valorDividaElement.value.replace('R$ ', '').replace(',', '.'));
                if (isNaN(valorDivida) || valorDivida <= 0) {
                    alert('Por favor, preencha o campo "Valor da D��vida" corretamente.');
                    valorDividaElement.focus();
                    return;
                }

                const parcelasElement = document.getElementById('parcelas');
                const parcelas = parseInt(parcelasElement.value);
                if (isNaN(parcelas) || parcelas < 1) {
                    alert('Por favor, selecione o número de parcelas.');
                    parcelasElement.focus();
                    return;
                }

                const nomeExecutadoElements = document.querySelectorAll('.nome-executado');
                for (let i = 0; i < nomeExecutadoElements.length; i++) {
                    const nomeExecutado = nomeExecutadoElements[i].value.trim();
                    if (nomeExecutado === '' || nomeExecutado.length < 10) {
                        alert('Por favor, preencha o campo "Nome do Executado" corretamente.');
                        nomeExecutadoElements[i].focus();
                        return;
                    }
                }

                const cpfCnpjElements = document.querySelectorAll('.cpf-cnpj');
                for (let i = 0; i < cpfCnpjElements.length; i++) {
                    const cpfCnpj = cpfCnpjElements[i].value.trim();
                    const cpfCnpjType = document.querySelector(`.cpf-cnpj-type[data-index="${i + 1}"]`).value;
                    if (cpfCnpj === '' || cpfCnpj.length < 14 || cpfCnpj.includes('_') ||
                        (cpfCnpjType === 'CPF' && !isValidCPF(cpfCnpj)) ||
                        (cpfCnpjType === 'CNPJ' && !isValidCNPJ(cpfCnpj))) {
                        alert('Por favor, preencha o campo "CPF/CNPJ" corretamente.');
                        cpfCnpjElements[i].focus();
                        return;
                    }
                }

                const atualizarEnderecoElements = document.querySelectorAll('.atualizar-endereco');
                for (let i = 0; i < atualizarEnderecoElements.length; i++) {
                    if (atualizarEnderecoElements[i].checked) {
                        const index = atualizarEnderecoElements[i].dataset.index;
                        const cep = document.querySelector(`.cep[data-index="${index}"]`).value.trim();
                        const rua = document.querySelector(`.rua[data-index="${index}"]`).value.trim();
                        const numero = document.querySelector(`.numero[data-index="${index}"]`).value.trim();
                        const bairro = document.querySelector(`.bairro[data-index="${index}"]`).value.trim();
                        const cidade = document.querySelector(`.cidade[data-index="${index}"]`).value.trim();
                        const estado = document.querySelector(`.estado[data-index="${index}"]`).value.trim();

                        if (cep === '' || cep.length < 9 || cep.includes('_')) {
                            alert('Por favor, preencha o campo "CEP" corretamente.');
                            document.querySelector(`.cep[data-index="${index}"]`).focus();
                            return;
                        }
                        if (rua === '') {
                            alert('Por favor, preencha o campo "Rua" corretamente.');
                            document.querySelector(`.rua[data-index="${index}"]`).focus();
                            return;
                        }
                        if (numero === '') {
                            alert('Por favor, preencha o campo "Nº" corretamente.');
                            document.querySelector(`.numero[data-index="${index}"]`).focus();
                            return;
                        }
                        if (bairro === '') {
                            alert('Por favor, preencha o campo "Bairro" corretamente.');
                            document.querySelector(`.bairro[data-index="${index}"]`).focus();
                            return;
                        }
                        if (cidade === '') {
                            alert('Por favor, preencha o campo "Cidade" corretamente.');
                            document.querySelector(`.cidade[data-index="${index}"]`).focus();
                            return;
                        }
                        if (estado === '') {
                            alert('Por favor, preencha o campo "Estado" corretamente.');
                            document.querySelector(`.estado[data-index="${index}"]`).focus();
                            return;
                        }
                    }
                }

                generatePDF();
            })
        }

        function generatePDF() {
            const numeroProcessoElement = document.getElementById('numero_processo');
            const valorDividaElement = document.getElementById('valor_divida');
            const valorEntradaElement = document.getElementById('valor_entrada');
            const parcelasElement = document.getElementById('parcelas');
            const dataPrimeiraParcelaElement = document.getElementById('data_primeira_parcela');
            const datasParcelasElement = document.getElementById('datas_parcelas');
            const outrosPedidosElement = document.getElementById('outros_pedidos');
            const novoValorEntradaElement = document.getElementById('novoValorEntrada');
            const percentualElement = document.getElementById('percentualEntrada');

            const outrosPedidos = outrosPedidosElement.value;

            if (!numeroProcessoElement || !valorDividaElement || !parcelasElement || !dataPrimeiraParcelaElement || !datasParcelasElement) {
                console.error('Um ou mais elementos necessários não foram encontrados.');
                return;
            }

            const numeroProcesso = numeroProcessoElement.value;
            const valorDivida = parseFloat(valorDividaElement.value.replace('R$ ', '').replace(',', '.'));
            const valorEntrada = parseFloat(novoValorEntradaElement.value) || parseFloat(valorEntradaElement.value.replace('R$ ', '').replace(',', '.'));
            const parcelas = parseInt(parcelasElement.value);
            const valorRestante = valorDivida - valorEntrada;
            const valorParcela = (valorRestante * Math.pow(1.01, parcelas)) / parcelas;
            const dataPrimeiraParcela = parseDate(dataPrimeiraParcelaElement.value);
            const datasParcelas = datasParcelasElement.innerHTML;
            const percentual = ((valorEntrada / valorDivida) * 100).toFixed(2);
            const hoje = new Date();
            const dataExtenso = hoje.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });

            let executadosContent = '<p style="text-align: justify">';
            let assinaturasContent = '';
            let concordancia = '';
            let concordanciaCirc = 'e';
            let concordanciaM = '';
            let concordanciaEsta = 'á';
            let concordanciaS = '';
            let concordanciaRequer = '';

            const executados = document.querySelectorAll('.executado-section');
            executados.forEach((executado, index) => {
                const nomeExecutado = executado.querySelector('.nome-executado').value;
                const generoExecutado = executado.querySelector('.genero-executado').value;
                const cpfCnpj = executado.querySelector('.cpf-cnpj').value;
                const cpfCnpjType = executado.querySelector('.cpf-cnpj-type').value;
                const atualizarEndereco = executado.querySelector('.atualizar-endereco').checked;

                let executadoTerm;
                if (generoExecutado === 'male') {
                    executadoTerm = 'executado';
                    concordancia = 'o';
                } else if (generoExecutado === 'female') {
                    executadoTerm = 'executada';
                    concordancia = 'a';
                } else {
                    executadoTerm = 'executado(a)';
                    concordancia = 'o(a)';
                }

                let enderecoSection = '';
                if (atualizarEndereco) {
                    const rua = executado.querySelector('.rua').value;
                    const numero = executado.querySelector('.numero').value;
                    const complemento = executado.querySelector('.complemento').value;
                    const bairro = executado.querySelector('.bairro').value;
                    const cep = executado.querySelector('.cep').value;
                    const cidade = executado.querySelector('.cidade').value;
                    const estado = executado.querySelector('.estado').value;

                    enderecoSection = `, <u>residente e domiciliado na ${rua}, nº ${numero}, Bairro ${bairro}`;
                    if (complemento) {
                        enderecoSection += `, Complemento ${complemento}`;
                    }
                    enderecoSection += `, CEP <span class="no-break"><u>${cep}</u></span>, ${cidade}/${estado}</u>`;
                }

                executadosContent += `<b>${nomeExecutado.toUpperCase()}</b>${enderecoSection}`;

                if (index < executados.length - 2) {
                    executadosContent += ', ';
                } else if (index === executados.length - 2) {
                    executadosContent += ' e ';
                }

                assinaturasContent += `<div style="text-align: center; margin-top: 20px;">
            ________________________________________
            <br>${nomeExecutado}
            <br>${cpfCnpjType}: ${cpfCnpj}
        </div>`;
                if ((index + 1) % 2 === 0) {
                    assinaturasContent += '</div><div class="executado-signature">';
                    console.log('sim');
                } else {
                    // ...existing code...
                }
            });

            if (executados.length > 1) {
                concordancia = 'os';
                concordanciaCirc = 'ê';
                concordanciaM = 'm';
                concordanciaEsta = 'ão';
                concordanciaS = 's';
                concordanciaRequer = 'em';
            }
            let textoParcelamento;
            if (parcelas === 1) {
                textoParcelamento = `< b > Do restante:</b > O restante, no valor de < b > R$ ${((valorDivida - valorEntrada) * Math.pow(1.01, 1)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b > será pago em < b > uma única parcela</b >, já acrescida de juros de 1 %, na data de < b > ${formatDate(dataPrimeiraParcela)}</b >.`;
            } else {
                textoParcelamento = `< b > Do parcelamento:</b > O restante, no valor de < b > R$ ${(valorDivida - valorEntrada).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b > será parcelado em < b > ${parcelas} parcelas</b > mensais, com início dos pagamentos em < b > ${formatDate(dataPrimeiraParcela)}</b >, acrescidas de juros de 1 % ao mês, conforme segue:
                    <p>${datasParcelas}</p>`;;
            }




            executadosContent += `, já qualificad${concordancia} nos autos da ação em epígrafe, v${concordanciaCirc} m, respeitosamente, à presença de Vossa Excelência requerer o</p > `

            const peticaoContent = `
                        < div style = "font-family: Arial, sans-serif; padding: 20px;" >
                        <p style="text-align: center; font-weight: bold; font-size: 20px;">EXMO. SR. JUIZ DE DIREITO DO JUIZADO ESPECIAL CÍVEL DE MARÍLIA/SP</p>
                        <p style="margin-bottom: 50px;"></p>
                        <p style="font-weight: bold; font-size: 16px; margin-bottom: 50px;">Processo nº ${numeroProcesso}</p>
                        <p></p>
                        ${executadosContent}
                        <p style="margin-bottom: 30px;"></p>
                        <p style="text-align: center; font-weight: bold; margin-bottom: 30px; font-size: 18px;">PARCELAMENTO DO DÉBITO COM SUSPENSÃO DA EXECUÇÃO (ART. 916, DO CPC)</p>
                        <p></p>
                        <p style="text-align: justify;"><b>Do reconhecimento da dívida: </b> ${executados.length > 1 ? 'Os' : 'O'} ${executados.length > 1 ? 'executados' : 'executado'} reconhece${concordanciaM} o débito em execução, no valor de <b>R$ ${valorDivida.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b>, e propõe${concordanciaM} seu parcelamento nos moldes do art. 916, do CPC, para suspensão da execução.</p>
                        <p style="text-align: justify;"><b>Da entrada: </b> ${Number.isInteger(parseFloat(percentual)) ? parseInt(percentual) : percentual.replace('.', ',')}% do valor da dívida, no importe de <b> R$ ${valorEntrada.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b>, a ser depositado judicialmente nesta data, conforme comprovante que acompanha esta petição.</p>
                        <p style="text-align: justify;">${textoParcelamento}</p>
                        <p style="text-align: justify;"><b>Da forma de pagamento e demais disposições:</b> Os pagamentos serão feitos por meio de depósito judicial, salvo outra forma a ser indicada pelo credor, devendo ${executados.length > 1 ? 'os' : 'o'} ${executados.length > 1 ? 'executados' : 'executado'} realizar${concordanciaRequer} os pagamentos das parcelas vincendas independentemente de nova intimação. Prorroga-se o pagamento da parcela para o dia útil seguinte em caso de feriado ou final de semana. <u>O descumprimento ou atraso importará no vencimento antecipado de todas as parcelas não pagas e imposição de multa de 10%, além do reinício da execução. A opção por este parcelamento importa em renúncia ao direito de opor de embargos em razão do reconhecimento do débito</u>.</p>
                        <p style="text-align: justify;">Requer${concordanciaRequer} seja o exequente intimado para ciência da presente proposta e que seja a execução suspensa pelo prazo previsto para cumprimento do parcelamento.</p>
                        <p style="text-align: justify;">${outrosPedidos}</p>
                        <p style="text-align: justify;"">Pede${concordanciaM} o deferimento.</p>
                        < p style = "margin-bottom: 50px;" > Marília, ${dataExtenso}.</p >
                            <div class="executado-signature">${assinaturasContent}</div>
                    </div >
                        `;

            // Exibir o conteúdo gerado no formato HTML para debug
            const pdfPreview = document.getElementById('pdf-preview');
            //pdfPreview.style.display = 'block';
            pdfPreview.innerHTML = peticaoContent;

            const opt = {
                margin: 1,
                filename: `Acordo${numeroProcesso}.pdf`,
                image: { type: 'jpeg', quality: 0.7 },
                html2canvas: { scale: 2 },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            html2pdf().from(peticaoContent).set(opt).save();
        }
    });

    /* $('#tipo_parcelamento').change(function () {
         if ($(this).val() === 'valor') {
             $('#parcelas_section').addClass('hidden');
             $('#valor_parcela_section').removeClass('hidden');
         } else {
             $('#parcelas_section').removeClass('hidden');
             $('#valor_parcela_section').addClass('hidden');
         }
         updateParcelas();
     });*/

    $('#tipo_parcelamento').change(function () {
        const tipoParcelamento = $(this).val();
        if (tipoParcelamento === 'valor') {
            $('#parcelas_section').addClass('hidden');
            $('#valor_parcela_section').removeClass('hidden');
            $('#resto_section').removeClass('hidden');
            $('#valor_parcela').val('');
            $('#numero_parcelas').val('');
        } else if (tipoParcelamento === 'parcelas') {
            $('#parcelas_section').removeClass('hidden');
            $('#valor_parcela_section').addClass('hidden');
            $('#resto_section').addClass('hidden');
            $('#valor_parcela_insert').val('');
        }
        updateParcelas();
    });

    $('#parcelas').change(updateParcelas);
    $('#valor_parcela_insert').change(updateParcelas);
    $('#valor_entrada').change(updateParcelas);
    $('#data_primeira_parcela').change(updateDatasParcelas);

    function updateParcelas() {
        const valorDivida = parseFloat($('#valor_divida').val().replace('R$ ', '').replace(',', '.'));
        let valorEntrada = parseFloat($('#valor_entrada').val().replace('R$ ', '').replace(',', '.'));
        if (isNaN(valorEntrada)) {
            valorEntrada = 0;
        }
        const valorRestante = valorDivida - valorEntrada;
        $('#valor_restante').val(`R$ ${formatCurrency(valorRestante)}`);

        const tipoParcelamento = $('#tipo_parcelamento').val();
        if (tipoParcelamento === 'valor') {
            const valorParcela = parseFloat($('#valor_parcela_insert').val());
            if (!isNaN(valorParcela) && valorParcela > 0) {
                const parcelas = Math.floor(valorRestante / valorParcela);
                const resto = valorRestante % valorParcela;
                $('#numero_parcelas').val(parcelas + (resto > 0 ? 1 : 0));
                $('#valor_resto').val(`R$ ${resto.toFixed(2)}`);
                if (resto > 0) {
                    $('#resto_section').removeClass('hidden');
                } else {
                    $('#resto_section').addClass('hidden');
                }
                updateDatasParcelas(valorRestante, parcelas, valorParcela, resto);
            }
        } else {
            const parcelas = parseInt($('#parcelas').val());
            if (!isNaN(parcelas) && parcelas > 0) {
                const valorParcela = Math.floor(valorRestante / parcelas);
                const resto = valorRestante - (valorParcela * (parcelas - 1));
                $('#valor_parcela').val(valorParcela.toFixed(2));
                if (resto > 0) {
                    $('#ultima_parcela_info').text(`Última parcela no valor de R$ ${resto.toFixed(2)}`);
                    $('#ultima_parcela_section').removeClass('hidden');
                } else {
                    $('#ultima_parcela_info').text('');
                    $('#ultima_parcela_section').addClass('hidden');
                }
                updateDatasParcelas(valorRestante, parcelas, valorParcela, resto);
            }
        }
    }

    function updateDatasParcelas(valorRestante, parcelas, valorParcela, resto) {
        const aplicarJurosElement = document.getElementById('aplicar_juros');
        const aplicarJuros = aplicarJurosElement ? aplicarJurosElement.checked : false;
        var valorEntrada = document.getElementById('valor_entrada').value;
        if (valorEntrada === '' || valorEntrada === '0' || valorEntrada === null) {
            valorEntrada = 0;
        }

        const dataPrimeiraParcelaElement = document.getElementById('data_primeira_parcela');
        const valorParcelaElement = document.getElementById('valor_parcela');
        const datasParcelasElement = document.getElementById('datas_parcelas');

        if (!dataPrimeiraParcelaElement || !valorParcelaElement || !datasParcelasElement) {
            console.error('Um ou mais elementos necessários não foram encontrados.');
            return;
        }

        const dataPrimeiraParcela = parseDate(dataPrimeiraParcelaElement.value);
        if (isNaN(dataPrimeiraParcela)) {
            console.error('Data da primeira parcela inválida.');
            return;
        }

        function isWeekday(date) {
            const day = date.getDay();
            return day !== 0 && day !== 6; // 0 = Domingo, 6 = Sábado
        }

        datasParcelasElement.innerHTML = '';

        const container = document.createElement('div');
        container.style.display = 'flex';
        container.style.flexWrap = 'wrap';

        let table = createTable();

        for (let i = 0; i < parcelas - 1; i++) { // Adjust loop to go up to parcelas - 1
            if (i > 0 && i % 10 === 0) {
                container.appendChild(table);
                table = createTable();
            }

            let dataParcela = new Date(dataPrimeiraParcela);
            dataParcela.setMonth(dataParcela.getMonth() + i);

            // Ajusta a data para o próximo dia útil, se necessário
            while (!isWeekday(dataParcela)) {
                dataParcela.setDate(dataParcela.getDate() + 1);
            }

            // Calcular o valor da parcela com juros de 1% ao mês, se aplicável
            const valorParcelaComJuros = aplicarJuros ? (valorRestante * Math.pow(1.01, i + 1)) / parcelas : valorParcela;

            const row = document.createElement('tr');

            const cellNumber = document.createElement('td');
            cellNumber.textContent = i + 1;
            cellNumber.style.padding = '0 5px'; // Espaço lateral entre as colunas
            row.appendChild(cellNumber);

            const cellDate = document.createElement('td');
            cellDate.textContent = formatDate(dataParcela); // Formata a data corretamente
            cellDate.style.padding = '0 5px'; // Espaço lateral entre as colunas
            row.appendChild(cellDate);

            const cellValue = document.createElement('td');
            cellValue.textContent = `R$ ${valorParcelaComJuros.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            cellValue.style.padding = '0 5px'; // Espaço lateral entre as colunas
            row.appendChild(cellValue);

            table.appendChild(row);
        }

        // Adiciona a última parcela com o valor ajustado, somando o resto
        const restoOption = $('input[name="resto_option"]:checked').val();
        console.log('restoOption', restoOption);
        //if valor_resto value checked is nova_parcela, then add +1 to parcelas
        if (restoOption === 'nova_parcela') {
            //   console.log('aqui123')
            //    parcelas = parcelas + 1;
            $('#valor_restante').val('');
        }

        let dataParcela = new Date(dataPrimeiraParcela);
        dataParcela.setMonth(dataParcela.getMonth() + (parcelas - 1));

        // Ajusta a data para o próximo dia útil, se necessário
        while (!isWeekday(dataParcela)) {
            dataParcela.setDate(dataParcela.getDate() + 1);
        }

        if (restoOption === 'ultima_parcela') {
            // Add remainder to the last parcel
            const ultimaParcela = valorParcela + resto;
            const row = document.createElement('tr');

            const cellNumber = document.createElement('td');
            cellNumber.textContent = parcelas;
            cellNumber.style.padding = '0 5px'; // Espaço lateral entre as colunas
            row.appendChild(cellNumber);

            const cellDate = document.createElement('td');
            cellDate.textContent = formatDate(dataParcela); // Formata a data corretamente
            cellDate.style.padding = '0 5px'; // Espaço lateral entre as colunas
            row.appendChild(cellDate);

            const cellValue = document.createElement('td');
            cellValue.textContent = `R$ ${ultimaParcela.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            cellValue.style.padding = '0 5px'; // Espaço lateral entre as colunas
            row.appendChild(cellValue);

            table.appendChild(row);
        } else if (restoOption === 'nova_parcela') {
            // Create a new parcel for the remainder
            const row = document.createElement('tr');

            const cellNumber = document.createElement('td');
            cellNumber.textContent = parcelas// + 1;
            cellNumber.style.padding = '0 5px'; // Espaço lateral entre as colunas
            row.appendChild(cellNumber);

            const cellDate = document.createElement('td');
            cellDate.textContent = formatDate(dataParcela); // Formata a data corretamente
            cellDate.style.padding = '0 5px'; // Espaço lateral entre as colunas
            row.appendChild(cellDate);

            const cellValue = document.createElement('td');
            cellValue.textContent = `R$ ${resto.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            cellValue.style.padding = '0 5px'; // Espaço lateral entre as colunas
            row.appendChild(cellValue);

            table.appendChild(row);
        }

        container.appendChild(table);
        datasParcelasElement.appendChild(container);
    }

    $('input[name="resto_option"]').change(function () {
        updateParcelas();
    });

    function createTable() {
        const table = document.createElement('table');
        table.style.borderCollapse = 'collapse';
        table.style.textAlign = 'center';
        table.style.marginRight = '10px'; // Espaço entre os blocos

        const headerRow = document.createElement('tr');

        const headerNumber = document.createElement('th');
        headerNumber.textContent = "#";
        headerNumber.style.padding = '0 5px'; // Espaço lateral entre as colunas
        headerRow.appendChild(headerNumber);

        const headerDate = document.createElement('th');
        headerDate.textContent = "Data da Parcela";
        headerDate.style.padding = '0 5px'; // Espaço lateral entre as colunas
        headerRow.appendChild(headerDate);

        const headerValue = document.createElement('th');
        headerValue.textContent = "Valor da Parcela";
        headerValue.style.padding = '0 5px'; // Espaço lateral entre as colunas
        headerRow.appendChild(headerValue);

        table.appendChild(headerRow);

        return table;
    }

    function formatCurrency(value) {
        return value.toFixed(2).replace('.', ',');
    }

    function formatDate(date) {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }

    function parseDate(input) {
        const parts = input.split('/');
        return new Date(parts[2], parts[1] - 1, parts[0]);
    }

    // ...existing code...
});