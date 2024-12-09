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

        $("#data_entrada").datepicker({
            dateFormat: "dd/mm/yy"
        });

        $('#valor_entrada').change(updateParcelas);
        $('#parcelas').on('input', function () {
            $('#ultima_parcela_section').addClass('hidden');
            updateParcelasFromParcelas();
        });
        $('#valor_parcela').change(updateParcelasFromValorParcela);
        $('#resto_opcao').change(updateParcelasFromValorParcela);

        $('#valor_entrada').change(function () {
            $('#resto_opcao option[value="somar"]').prop('disabled', false);
            const valorDivida = parseFloat($('#valor_divida').val().replace('R$ ', '').replace(',', '.'));
            let valorEntrada = parseFloat($(this).val().replace('R$ ', '').replace(',', '.'));
            if (isNaN(valorEntrada)) {
                valorEntrada = 0;
            }
            if (!isNaN(valorDivida)) {
                const valorRestante = valorDivida - valorEntrada;
                $('#valor_restante').val(`R$ ${formatCurrency(valorRestante)}`);
                updateParcelas();
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
                const valorParcela = valorRestante / parcelas;
                if (!isNaN(valorParcela)) {
                    $('#valor_parcela').val(valorParcela.toFixed(2));
                } else {
                    $('#valor_parcela').val('');
                }
                updateDatasParcelas(valorRestante, parcelas);
            } else {
                $('#valor_parcela').val('');
            }
        }

        function updateParcelasFromParcelas() {
            const valorRestante = parseFloat($('#valor_restante').val().replace('R$ ', '').replace(',', '.'));
            const parcelas = parseInt($('#parcelas').val());

            if (!isNaN(parcelas) && parcelas > 0 && !isNaN(valorRestante)) {
                const valorParcela = valorRestante / parcelas;
                $('#valor_parcela').val(valorParcela.toFixed(2));
                updateDatasParcelas(valorRestante, parcelas);
            }
        }

        function updateParcelasFromValorParcela() {
            const valorRestante = parseFloat($('#valor_restante').val().replace('R$ ', '').replace(',', '.'));
            const valorParcela = parseFloat($('#valor_parcela').val());
            const restoOpcao = $('#resto_opcao').val();

            if (!isNaN(valorParcela) && valorParcela > 0 && !isNaN(valorRestante)) {
                const parcelas = Math.floor(valorRestante / valorParcela);
                const resto = valorRestante % valorParcela;

                if (restoOpcao === 'somar') {
                    $('#parcelas').val(parcelas); // Não adiciona uma nova parcela
                    if (resto > 0) {
                        $('#valor_parcela').val(valorParcela.toFixed(2));
                        $('#ultima_parcela_info').text(`${parcelas} parcelas, sendo ${parcelas - 1} de R$ ${valorParcela.toFixed(2)} e a última no valor de R$ ${(valorParcela + resto).toFixed(2)}`);
                        $('#ultima_parcela_section').removeClass('hidden');
                        $('#resto').removeClass('hidden');
                    } else {
                        $('#valor_parcela').val(valorParcela.toFixed(2));
                        $('#ultima_parcela_info').text('');
                        $('#ultima_parcela_section').addClass('hidden');
                        $('#resto').addClass('hidden');
                    }
                } else if (restoOpcao === 'nova') {
                    $('#parcelas').val(parcelas + (resto > 0 ? 1 : 0)); // Adiciona uma nova parcela se houver resto
                    if (resto > 0) {
                        $('#valor_parcela').val(valorParcela.toFixed(2));
                        $('#ultima_parcela_info').text(`${parcelas + 1} parcelas, sendo ${parcelas} no valor de R$ ${valorParcela.toFixed(2)} e a última  parcela no valor de R$ ${resto.toFixed(2)}`);
                        $('#ultima_parcela_section').removeClass('hidden');
                    } else {
                        $('#valor_parcela').val(valorParcela.toFixed(2));
                        $('#ultima_parcela_info').text('');
                        $('#ultima_parcela_section').addClass('hidden');
                    }
                }

                updateDatasParcelas(valorRestante, parcelas);
            } else {
                $('#valor_parcela').val('');
            }
        }

        $('#valor_parcela').change(function () {
            const valorRestante = parseFloat($('#valor_restante').val().replace('R$ ', '').replace(',', '.'));
            const valorParcela = parseFloat($(this).val());
            if (!isNaN(valorRestante) && !isNaN(valorParcela)) {
                const parcelas = Math.floor(valorRestante / valorParcela);
                const resto = valorRestante % valorParcela;

                if (parcelas === 1 && resto > 0) {
                    $('#resto_opcao').val('nova');
                    $('#resto_opcao option[value="somar"]').prop('disabled', true);
                } else {
                    $('#resto_opcao.option[value="somar"]').prop('disabled', false);
                }

                updateParcelasFromValorParcela();
            }
        });

        $('#parcelas').change(function () {
            $('#resto_opcao option[value="somar"]').prop('disabled', false);
            updateParcelas();
        });

        function updateDatasParcelas(valorRestante, parcelas) {
            const aplicarJuros = document.getElementById('aplicar_juros').checked;
            const valorEntrada = document.getElementById('valor_entrada').value;
            if (valorEntrada === '') {
                return;
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

            const table = document.createElement('table');
            table.style.borderCollapse = 'collapse';
            table.style.textAlign = 'center';
            // Mantém o espaço entre as linhas o menor possível

            const headerRow = document.createElement('tr');

            const headerNumber = document.createElement('th');
            headerNumber.textContent = "#";
            headerNumber.style.padding = '0 15px'; // Espaço lateral entre as colunas
            headerRow.appendChild(headerNumber);

            const headerDate = document.createElement('th');
            headerDate.textContent = "Data da Parcela";
            headerDate.style.padding = '0 15px'; // Espaço lateral entre as colunas
            headerRow.appendChild(headerDate);

            const headerValue = document.createElement('th');
            headerValue.textContent = "Valor da Parcela";
            headerValue.style.padding = '0 15px'; // Espaço lateral entre as colunas
            headerRow.appendChild(headerValue);

            table.appendChild(headerRow);

            for (let i = 0; i < parcelas; i++) {
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
                cellNumber.style.padding = '0 15px'; // Espaço lateral entre as colunas
                row.appendChild(cellNumber);

                const cellDate = document.createElement('td');
                cellDate.textContent = formatDate(dataParcela); // Formata a data corretamente
                cellDate.style.padding = '0 15px'; // Espaço lateral entre as colunas
                row.appendChild(cellDate);

                const cellValue = document.createElement('td');
                cellValue.textContent = `R$ ${valorParcelaComJuros.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                cellValue.style.padding = '0 15px'; // Espaço lateral entre as colunas
                row.appendChild(cellValue);

                table.appendChild(row);
            }

            // Adiciona a última parcela com o valor ajustado, se houver resto
            const resto = valorRestante % (valorRestante / parcelas);
            const restoOpcao = $('#resto_opcao').val();
            if (resto > 0) {
                let dataParcela = new Date(dataPrimeiraParcela);
                dataParcela.setMonth(dataParcela.getMonth() + parcelas);

                // Ajusta a data para o próximo dia útil, se necessário
                while (!isWeekday(dataParcela)) {
                    dataParcela.setDate(dataParcela.getDate() + 1);
                }

                const row = document.createElement('tr');

                const cellNumber = document.createElement('td');
                cellNumber.textContent = parcelas + 1;
                cellNumber.style.padding = '0 15px'; // Espaço lateral entre as colunas
                row.appendChild(cellNumber);

                const cellDate = document.createElement('td');
                cellDate.textContent = formatDate(dataParcela); // Formata a data corretamente
                cellDate.style.padding = '0 15px'; // Espaço lateral entre as colunas
                row.appendChild(cellDate);

                const cellValue = document.createElement('td');
                if (restoOpcao === 'somar') {
                    cellValue.textContent = `R$ ${(valorRestante / parcelas + resto).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                } else if (restoOpcao === 'nova') {
                    cellValue.textContent = `R$ ${resto.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                }
                cellValue.style.padding = '0 15px'; // Espaço lateral entre as colunas
                row.appendChild(cellValue);

                table.appendChild(row);
            }

            datasParcelasElement.appendChild(table);
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
        /*const today = new Date();

        //const minDate = new Date(today);
        //const maxDate = new Date(today);



        //minDate.setDate(today.getDate() + 30);
        //add 1 month to minDate
        minDate.setMonth(minDate.getMonth() + 1);



        if (minDate.getDay() === 0) minDate.setDate(today.getDate() + 0);
        if (minDate.getDay() === 6) minDate.setDate(today.getDate() + 0);

        maxDate.setDate(today.getDate() + 30);
        if (minDate.getDay() === 0) minDate.setDate(today.getDate() + 1);
        if (minDate.getDay() === 6) minDate.setDate(today.getDate() + 2);

        const formatDate = (date) => {
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
        };

        dataPrimeiraParcelaElement.min = formatDate(today);
        dataPrimeiraParcelaElement.max = formatDate(maxDate);
        dataPrimeiraParcelaElement.value = formatDate(minDate);*/

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

            const valorParcela = (valorRestante) / parcelas;
            document.getElementById('valor_parcela').value = `R$ ${formatCurrency(parseFloat(valorParcela))}`;
            updateDatasParcelas(valorRestante, parcelas);
        }

        document.getElementById('parcelas').addEventListener('change', updateParcelas);
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
                    alert('Por favor, preencha o campo "Valor da Dívida" corretamente.');
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
});