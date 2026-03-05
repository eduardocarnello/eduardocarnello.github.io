// ========================================================
// Gerador de Atermação — Script completo
// Melhorias: templates, auto-save, validação CPF/CNPJ,
// feedback visual, comarca dinâmica, testemunhas,
// copiar texto, exportar DOCX, loading CEP
// ========================================================

// ===== TEMPLATES POR TIPO DE AÇÃO =====
const TEMPLATES = {
    "Indenização por Danos Morais": {
        fatos: `Em [DATA], o(a) requerente [DESCREVA O EVENTO QUE CAUSOU O DANO — ex: teve seu nome indevidamente inscrito nos órgãos de proteção ao crédito / foi vítima de atendimento humilhante / sofreu constrangimento público].\n\nO(A) requerente jamais manteve qualquer relação contratual que justificasse tal situação [OU: a relação contratual já estava regularizada desde DATA].\n\nA conduta da parte requerida causou ao(à) requerente profundo abalo emocional, constrangimento, angústia e sofrimento, pois [DESCREVA OS IMPACTOS — ex: ficou impossibilitado(a) de obter crédito / teve que passar por situação vexatória perante terceiros / perdeu noites de sono].\n\nO(A) requerente tentou resolver a situação administrativamente [DESCREVA AS TENTATIVAS — ex: compareceu à loja / ligou para o SAC no dia DATA, protocolo nº XXXX / enviou e-mail], porém não obteve êxito, restando-lhe apenas a via judicial.`,
        pedidos: `b) A condenação da parte requerida ao pagamento de indenização por danos morais, no valor de R$ [VALOR], em razão do(s) [DESCREVA BREVEMENTE — ex: constrangimento e abalo moral sofridos pela inscrição indevida];\n\nc) A condenação da parte requerida ao pagamento de custas processuais e honorários advocatícios, caso aplicável.`
    },
    "Indenização por Danos Materiais": {
        fatos: `Em [DATA], o(a) requerente [DESCREVA O EVENTO — ex: adquiriu o produto/serviço X da parte requerida, pelo valor de R$ VALOR / teve seu veículo danificado no estacionamento do réu / sofreu prejuízo financeiro decorrente de falha no serviço prestado].\n\nOcorre que [DESCREVA O PROBLEMA — ex: o produto apresentou defeito após DIAS de uso / o serviço não foi prestado conforme contratado / o bem foi danificado por culpa exclusiva da parte requerida].\n\nEm razão do ocorrido, o(a) requerente sofreu prejuízo material no valor de R$ [VALOR], correspondente a [DETALHE — ex: o valor pago pelo produto defeituoso / o custo do reparo do veículo, conforme orçamento anexo / a diferença entre o serviço contratado e o efetivamente prestado].\n\nO(A) requerente tentou resolver a questão diretamente com a parte requerida [DESCREVA AS TENTATIVAS — ex: compareceu ao estabelecimento / entrou em contato pelo SAC, protocolo nº XXXX], mas não obteve solução satisfatória.`,
        pedidos: `b) A condenação da parte requerida ao ressarcimento dos danos materiais sofridos, no valor de R$ [VALOR], devidamente corrigido monetariamente e acrescido de juros legais desde a data do evento danoso;\n\nc) Subsidiariamente, caso não seja possível o ressarcimento integral, a condenação da parte requerida a reparar o bem danificado, às suas expensas, no prazo de [PRAZO] dias.`
    },
    "Obrigação de Fazer/Não Fazer": {
        fatos: `O(A) requerente mantém relação [contratual/de consumo/de vizinhança] com a parte requerida desde [DATA/PERÍODO].\n\nOcorre que a parte requerida [DESCREVA A OBRIGAÇÃO DESCUMPRIDA — ex: comprometeu-se a realizar o serviço de reforma até DATA e não cumpriu / está realizando obras irregulares que causam danos ao imóvel do requerente / recusa-se a fornecer o documento/produto/serviço a que está obrigada / está praticando ato que deve cessar, como cobrança indevida, barulho excessivo, etc.].\n\nO(A) requerente já notificou a parte requerida [DESCREVA — ex: por escrito em DATA / verbalmente em DATA / por meio de protocolo nº XXXX], solicitando que [cumprisse a obrigação / cessasse a conduta], porém sem sucesso.\n\nA manutenção dessa situação causa [DESCREVA O PREJUÍZO — ex: danos ao imóvel / impossibilidade de uso do serviço / prejuízo financeiro contínuo / perturbação do sossego], tornando urgente a intervenção judicial.`,
        pedidos: `b) A condenação da parte requerida à obrigação de [FAZER: descreva a ação — ex: realizar o reparo no prazo de X dias / entregar o documento/produto / concluir o serviço contratado] [OU NÃO FAZER: descreva a abstenção — ex: cessar imediatamente as obras irregulares / abster-se de realizar cobranças indevidas / cessar a emissão de ruídos acima do permitido], sob pena de multa diária (astreintes) de R$ [VALOR] por dia de descumprimento;\n\nc) A condenação da parte requerida ao pagamento de eventuais danos materiais e/ou morais decorrentes do descumprimento, a serem apurados.`
    },
    "Rescisão de Contrato c/c Devolução do Dinheiro": {
        fatos: `Em [DATA], o(a) requerente celebrou contrato com a parte requerida, tendo por objeto [DESCREVA — ex: a prestação de serviço de reforma residencial / a aquisição de curso online / a compra de produto X pela internet / a contratação de pacote de viagem], pelo valor total de R$ [VALOR].\n\nO(A) requerente efetuou o pagamento de R$ [VALOR PAGO] [à vista / em X parcelas / via PIX/cartão/boleto], conforme comprovante(s) anexo(s).\n\nOcorre que a parte requerida [DESCREVA O INADIMPLEMENTO — ex: não entregou o produto no prazo estipulado / não iniciou a prestação do serviço / entregou produto totalmente diferente do anunciado / prestou serviço com qualidade muito inferior à contratada / cancelou unilateralmente o serviço sem justificativa].\n\nO(A) requerente tentou resolver a questão administrativamente [DESCREVA — ex: solicitou o cancelamento e reembolso em DATA / entrou em contato pelo SAC (protocolo nº XXXX) / compareceu à loja], mas a parte requerida [DESCREVA — ex: recusou a devolução / não respondeu / ofereceu apenas crédito em loja, o que não foi aceito].\n\nDiante da total inexecução [ou execução defeituosa] do contrato por parte da requerida, não resta alternativa senão buscar a rescisão contratual e a restituição dos valores pagos.`,
        pedidos: `b) A declaração de rescisão do contrato celebrado entre as partes, por culpa exclusiva da parte requerida;\n\nc) A condenação da parte requerida à restituição integral dos valores pagos, no montante de R$ [VALOR], devidamente corrigido monetariamente e acrescido de juros legais desde a data de cada desembolso;\n\nd) A condenação da parte requerida ao pagamento de indenização por danos morais no valor de R$ [VALOR], em razão dos transtornos causados [OPCIONAL — inclua apenas se houve real abalo moral].`
    },
    "Rescisão de Contrato": {
        fatos: `Em [DATA], o(a) requerente celebrou contrato com a parte requerida referente a [DESCREVA O OBJETO — ex: prestação de serviço / locação / assinatura / plano].\n\nOcorre que [DESCREVA O MOTIVO DA RESCISÃO — ex: o(a) requerente solicitou o cancelamento em DATA, conforme previsto contratualmente, porém a parte requerida se recusa a efetuar a rescisão / a parte requerida alterou unilateralmente as condições do contrato / a parte requerida descumpriu a cláusula X do contrato / o(a) requerente não possui mais interesse na continuidade do contrato, estando adimplente com todas as obrigações até o momento].\n\nO(A) requerente já solicitou formalmente a rescisão [DESCREVA — ex: por e-mail em DATA / pelo SAC em DATA, protocolo nº XXXX / por carta registrada], mas a parte requerida [DESCREVA — ex: ignorou o pedido / exigiu o pagamento de multa abusiva no valor de R$ VALOR / continua efetuando cobranças].`,
        pedidos: `b) A declaração judicial de rescisão do contrato firmado entre as partes, sem ônus para o(a) requerente [OU: com a redução proporcional da multa rescisória, nos termos do art. 413 do Código Civil];\n\nc) A condenação da parte requerida a cessar quaisquer cobranças relacionadas ao contrato rescindido, sob pena de multa;\n\nd) A condenação da parte requerida à restituição de valores cobrados indevidamente após o pedido de cancelamento, se houver.`
    },
    "Inexigibilidade de Débito": {
        fatos: `O(A) requerente tomou conhecimento de que a parte requerida [DESCREVA — ex: inscreveu seu nome junto aos órgãos de proteção ao crédito (SPC/Serasa) / está efetuando cobranças por telefone, SMS e e-mail / ajuizou ação de execução], em razão de suposto débito no valor de R$ [VALOR], referente a [DESCREVA — ex: contrato nº XXXX / fatura do mês de XXXX / serviço que jamais foi contratado].\n\nOcorre que o referido débito é totalmente inexigível, pois [DESCREVA O MOTIVO — ex: o(a) requerente jamais contratou qualquer serviço ou produto com a parte requerida / o débito já foi integralmente quitado em DATA, conforme comprovante anexo / o contrato que originou a dívida já foi rescindido em DATA / trata-se de fraude, pois terceiro utilizou os dados do(a) requerente indevidamente / o valor cobrado é superior ao efetivamente devido, havendo cobrança em duplicidade].\n\n[SE HOUVE NEGATIVAÇÃO]: A inscrição indevida nos cadastros de inadimplentes causou ao(à) requerente sérios transtornos, como [DESCREVA — ex: impossibilidade de obter crédito / constrangimento / recusa de financiamento].\n\nO(A) requerente tentou resolver administrativamente [DESCREVA TENTATIVAS], sem êxito.`,
        pedidos: `b) A declaração de inexigibilidade do débito no valor de R$ [VALOR], referente a [DESCREVA];\n\nc) A condenação da parte requerida a proceder à exclusão definitiva do nome do(a) requerente dos cadastros de inadimplentes (SPC, Serasa e semelhantes), no prazo de 5 (cinco) dias, sob pena de multa diária;\n\nd) A condenação da parte requerida ao pagamento de indenização por danos morais no valor de R$ [VALOR], em decorrência da inscrição indevida e dos transtornos causados;\n\ne) A condenação da parte requerida a abster-se de realizar novas cobranças referentes ao débito ora declarado inexigível, sob pena de multa.`
    },
    "Ação de Cobrança": {
        fatos: `Em [DATA], o(a) requerente [DESCREVA A ORIGEM DO CRÉDITO — ex: prestou serviços de XXXX para a parte requerida / vendeu o produto X à parte requerida / emprestou a quantia de R$ VALOR à parte requerida], conforme [DOCUMENTO — ex: contrato anexo / nota fiscal / mensagens de WhatsApp / recibo].\n\nFoi acordado entre as partes que o pagamento seria efetuado [DESCREVA AS CONDIÇÕES — ex: à vista até DATA / em X parcelas mensais de R$ VALOR, com vencimento todo dia XX / mediante a entrega do serviço].\n\nOcorre que a parte requerida [DESCREVA O INADIMPLEMENTO — ex: efetuou o pagamento de apenas X parcelas, restando em aberto o valor de R$ VALOR / não realizou qualquer pagamento até a presente data / emitiu cheque sem fundos no valor de R$ VALOR].\n\nO(A) requerente cobrou a parte requerida por diversas vezes [DESCREVA — ex: pessoalmente / por WhatsApp / por e-mail / por notificação extrajudicial em DATA], porém a parte requerida [DESCREVA — ex: comprometeu-se a pagar e não cumpriu / não respondeu às tentativas de contato / recusou-se expressamente a pagar].\n\nO valor total devido atualizado é de R$ [VALOR].`,
        pedidos: `b) A condenação da parte requerida ao pagamento do valor de R$ [VALOR], devidamente corrigido monetariamente e acrescido de juros de mora de 1% ao mês (ou conforme pactuado), contados desde a data do vencimento de cada parcela até o efetivo pagamento;\n\nc) A condenação da parte requerida ao pagamento de custas processuais e honorários, se aplicável.`
    },
    "Defesa do Consumidor (Inscrição Indevida)": {
        fatos: `O(A) requerente descobriu, em [DATA], que seu nome foi inscrito nos cadastros de inadimplentes (SPC/Serasa) pela parte requerida, em razão de suposto débito no valor de R$ [VALOR].\n\nOcorre que tal inscrição é totalmente indevida, pois [ESCOLHA O QUE SE APLICA]:\n- O(A) requerente jamais contratou qualquer produto ou serviço com a parte requerida, tratando-se possivelmente de fraude praticada por terceiros;\n- O(A) requerente já havia quitado integralmente o débito em DATA, conforme comprovante anexo;\n- O contrato que originou a cobrança foi regularmente cancelado/rescindido em DATA;\n- O valor cobrado está incorreto, havendo cobrança em duplicidade/valor superior ao devido;\n- O(A) requerente sequer foi notificado(a) previamente sobre o débito, como exige o Código de Defesa do Consumidor.\n\nA negativação indevida causou ao(à) requerente diversos prejuízos, dentre os quais: [DESCREVA — ex: impossibilidade de obter crédito / recusa de financiamento imobiliário / constrangimento em compra no comércio / abalo emocional].\n\nO(A) requerente entrou em contato com a parte requerida diversas vezes [DESCREVA — ex: ligou para o SAC no dia DATA, protocolo nº XXXX / compareceu à loja / enviou e-mail], porém não conseguiu a regularização.`,
        pedidos: `b) A declaração de inexistência do débito no valor de R$ [VALOR] cobrado pela parte requerida;\n\nc) A condenação da parte requerida a proceder à imediata exclusão do nome do(a) requerente dos cadastros de proteção ao crédito (SPC, Serasa e similares), no prazo de 5 (cinco) dias, sob pena de multa diária de R$ [VALOR] por dia de descumprimento;\n\nd) A condenação da parte requerida ao pagamento de indenização por danos morais no valor de R$ [VALOR], pela inscrição indevida e todos os transtornos decorrentes;\n\ne) A condenação da parte requerida a abster-se de realizar novas cobranças ou inscrições relativas ao débito declarado inexistente.`
    },
    "Defesa do Consumidor (Produto/Serviço Defeituoso)": {
        fatos: `Em [DATA], o(a) requerente adquiriu [o produto XXXX / contratou o serviço de XXXX] junto à parte requerida, pelo valor de R$ [VALOR], conforme [nota fiscal / comprovante de pagamento / contrato] anexo(s).\n\n[PARA PRODUTO]: Ocorre que, após [PRAZO — ex: apenas X dias de uso / dentro do prazo de garantia], o produto apresentou [DESCREVA O DEFEITO — ex: parou de funcionar / apresentou superaquecimento / veio com peça quebrada / não corresponde ao anunciado (propaganda enganosa)].\n\n[PARA SERVIÇO]: Ocorre que o serviço prestado pela parte requerida [DESCREVA — ex: não atendeu às especificações contratadas / foi executado de forma incompleta / causou danos ao bem do requerente / não foi concluído no prazo combinado].\n\nO(A) requerente, no exercício de seus direitos como consumidor(a), imediatamente contatou a parte requerida [DESCREVA — ex: compareceu à loja em DATA / acionou o SAC em DATA, protocolo nº XXXX / enviou o produto para a assistência técnica].\n\nTranscorreu o prazo legal de 30 dias (art. 18, §1º do CDC) sem que a parte requerida solucionasse o problema [OU: a parte requerida informou que o reparo/troca não seria realizado, alegando XXXX / a parte requerida realizou reparo, mas o defeito persistiu].`,
        pedidos: `b) A condenação da parte requerida, à escolha do(a) consumidor(a), conforme art. 18, §1º do CDC, a:\n   - Substituir o produto por outro da mesma espécie, em perfeitas condições de uso; OU\n   - Restituir imediatamente o valor pago de R$ [VALOR], devidamente atualizado, sem prejuízo de eventuais perdas e danos; OU\n   - Conceder abatimento proporcional do preço;\n\n[PARA SERVIÇO — art. 20 do CDC]:\n   - Reexecutar o serviço sem custo adicional e no prazo de [X] dias; OU\n   - Restituir imediatamente o valor pago de R$ [VALOR]; OU\n   - Conceder abatimento proporcional do preço;\n\nc) A condenação da parte requerida ao pagamento de indenização por danos morais no valor de R$ [VALOR], pelos transtornos e tempo perdido [INCLUA SE APLICÁVEL];\n\nd) A condenação da parte requerida ao pagamento de eventuais danos materiais decorrentes do defeito, no valor de R$ [VALOR] [INCLUA SE HOUVE PREJUÍZO FINANCEIRO ALÉM DO VALOR DO PRODUTO].`
    },
    "Acidente de Trânsito": {
        hasDynamicFields: true,
        fatos: `Em [DATA DO ACIDENTE], por volta das [HORÁRIO], na [LOCAL DO ACIDENTE], ocorreu uma colisão envolvendo o veículo da parte autora, [MODELO/MARCA], cor [COR], placa [PLACA], e o veículo da parte ré, [MODELO/MARCA], cor [COR], placa [PLACA].\n\n[DESCREVA COMO OCORREU O ACIDENTE — ex: O veículo da parte ré colidiu na traseira do veículo da parte autora, que se encontrava parado aguardando o semáforo abrir].\n\nFoi lavrado Boletim de Ocorrência nº [NÚMERO DO BO], que acompanha esta petição.\n\nEm decorrência do acidente, o veículo da parte autora sofreu avarias, sendo que o orçamento para reparo é de R$ [VALOR DO REPARO].\n\nA parte autora tentou resolver a questão amigavelmente com a parte ré, porém não obteve êxito, restando-lhe apenas a via judicial.`,
        pedidos: `b) A condenação da parte ré ao pagamento de R$ [VALOR] a título de danos materiais, referente ao reparo do veículo da parte autora;\n\nc) A condenação da parte ré ao pagamento de indenização por danos morais no valor de R$ [VALOR], em razão dos transtornos causados pelo acidente.`
    }
};

// ===== VALIDAÇÃO DE CPF/CNPJ =====
function validarCPF(cpf) {
    cpf = cpf.replace(/\D/g, '');
    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
    let soma = 0;
    for (let i = 1; i <= 9; i++) soma += parseInt(cpf[i - 1]) * (11 - i);
    let resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf[9])) return false;
    soma = 0;
    for (let i = 1; i <= 10; i++) soma += parseInt(cpf[i - 1]) * (12 - i);
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    return resto === parseInt(cpf[10]);
}

function validarCNPJ(cnpj) {
    cnpj = cnpj.replace(/\D/g, '');
    if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) return false;
    const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let soma = pesos1.reduce((acc, p, i) => acc + parseInt(cnpj[i]) * p, 0);
    let resto = soma % 11;
    if ((resto < 2 ? 0 : 11 - resto) !== parseInt(cnpj[12])) return false;
    soma = pesos2.reduce((acc, p, i) => acc + parseInt(cnpj[i]) * p, 0);
    resto = soma % 11;
    return (resto < 2 ? 0 : 11 - resto) === parseInt(cnpj[13]);
}

function validarCpfCnpj(value) {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 11) return validarCPF(digits);
    return validarCNPJ(digits);
}

// ===== TOAST NOTIFICATION =====
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 z-[100] px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium transition-opacity duration-300 ${type === 'success' ? 'bg-green-600' : 'bg-red-600'}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 3000);
}

// ========================================================
// MAIN
// ========================================================
document.addEventListener('DOMContentLoaded', () => {

    // --- REFERÊNCIAS GERAIS ---
    const disclaimerModal = document.getElementById('disclaimer-modal');
    const disclaimerChecks = document.querySelectorAll('.disclaimer-check');
    const disclaimerAgreeBtn = document.getElementById('disclaimer-agree-btn');
    const mainFormContainer = document.getElementById('main-form-container');
    const atermacaoForm = document.getElementById('atermacao-form');
    const autoresList = document.getElementById('autores-list');
    const reusList = document.getElementById('reus-list');
    const addAutorBtn = document.getElementById('add-autor-btn');
    const addReuBtn = document.getElementById('add-reu-btn');
    const partyTemplate = document.querySelector('.party-item-template');
    const actionTypeContainer = document.getElementById('action-type-container');
    const actionTypeButton = document.getElementById('action-type-button');
    const actionTypeOptions = document.getElementById('action-type-options');
    const actionTypeText = document.getElementById('action-type-text');
    const actionTypeOtherInput = document.getElementById('action-type-other');
    const tutelaCheck = document.getElementById('tutela-antecipada-check');
    const tutelaJustificativaContainer = document.getElementById('tutela-justificativa-container');
    const sigiloCheck = document.getElementById('segredo-justica-check');
    const sigiloJustificativaContainer = document.getElementById('sigilo-justificativa-container');
    const audienciaRadios = document.querySelectorAll('input[name="audiencia"]');
    const audienciaJustificativaContainer = document.getElementById('audiencia-justificativa-container');
    const documentList = document.getElementById('document-list');
    const addDocumentBtn = document.getElementById('add-document-btn');
    const witnessList = document.getElementById('witness-list');
    const addWitnessBtn = document.getElementById('add-witness-btn');
    const clearFormBtn = document.getElementById('clear-form-btn');
    const generatePdfBtn = document.getElementById('generate-pdf-btn');
    const previewBtn = document.getElementById('preview-btn');
    const previewModal = document.getElementById('preview-modal');
    const closePreviewBtn = document.getElementById('close-preview-btn');
    const previewContent = document.getElementById('preview-content');
    const copyTextBtn = document.getElementById('copy-text-btn');
    const generateDocxBtn = document.getElementById('generate-docx-btn');

    let autoSaveEnabled = false;

    // --- VALIDAÇÃO VISUAL ---
    const showFieldError = (inputEl, msg) => {
        inputEl.classList.add('border-red-500', 'bg-red-50');
        inputEl.classList.remove('border-gray-300', 'cpf-valid', 'cpf-invalid');
        let errSpan = inputEl.parentElement.querySelector('.field-error-msg');
        if (!errSpan) {
            errSpan = document.createElement('span');
            errSpan.className = 'field-error-msg';
            inputEl.parentElement.appendChild(errSpan);
        }
        errSpan.textContent = msg;
    };

    const clearFieldError = (inputEl) => {
        inputEl.classList.remove('border-red-500', 'bg-red-50');
        inputEl.classList.add('border-gray-300');
        const errSpan = inputEl.parentElement.querySelector('.field-error-msg');
        if (errSpan) errSpan.remove();
    };

    const clearAllErrors = () => {
        document.querySelectorAll('.border-red-500').forEach(el => {
            el.classList.remove('border-red-500', 'bg-red-50');
            el.classList.add('border-gray-300');
        });
        document.querySelectorAll('.field-error-msg').forEach(el => el.remove());
    };

    // Auto-clear errors on input
    document.addEventListener('input', (e) => {
        if (e.target.classList.contains('border-red-500')) clearFieldError(e.target);
    });

    // --- DISCLAIMER ---
    const checkDisclaimer = () => {
        disclaimerAgreeBtn.disabled = !Array.from(disclaimerChecks).every(c => c.checked);
    };
    disclaimerAgreeBtn.addEventListener('click', () => {
        disclaimerModal.classList.add('hidden');
        mainFormContainer.classList.remove('blurred');
    });

    // --- FORMATAÇÃO ---
    const formatCpfCnpj = (value) => {
        value = value.replace(/\D/g, '').slice(0, 14);
        if (value.length <= 11) value = value.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        else value = value.replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d)/, '$1-$2');
        return value;
    };

    const formatPhone = (value) => {
        value = value.replace(/\D/g, '').slice(0, 11);
        if (value.length > 10) value = value.replace(/^(\d\d)(\d{5})(\d{4}).*/, "($1) $2-$3");
        else if (value.length > 5) value = value.replace(/^(\d\d)(\d{4})(\d{0,4}).*/, "($1) $2-$3");
        else if (value.length > 2) value = value.replace(/^(\d\d)(\d{0,5}).*/, "($1) $2");
        else value = value.replace(/^(\d*)/, "($1");
        return value;
    };

    const formatDate = (value) => value.replace(/\D/g, '').slice(0, 8).replace(/(\d{2})(\d)/, '$1/$2').replace(/(\d{2})\/(\d{2})(\d)/, '$1/$2/$3');

    const formatValueOnBlur = (e) => {
        let value = e.target.value.replace(/[^\d,]/g, '').replace(',', '.');
        e.target.value = !isNaN(parseFloat(value)) ? parseFloat(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '';
    };

    // --- GERENCIAMENTO DE PARTES ---
    const createPartyElement = (isAuthor) => {
        const newParty = partyTemplate.firstElementChild.cloneNode(true);
        if (isAuthor) {
            newParty.querySelector('.party-digital-exclusion-field').classList.remove('hidden');
        } else {
            newParty.querySelector('.party-dob-field').style.display = 'none';
            newParty.querySelector('.party-cpf-required').style.display = 'none';
            newParty.querySelector('.no-address-option').style.display = 'flex';
        }
        return newParty;
    };

    const updateRemoveButtons = () => {
        [autoresList, reusList].forEach(list => {
            const items = list.querySelectorAll('.party-item');
            items.forEach(item => {
                const removeBtn = item.querySelector('.remove-party-btn');
                if (removeBtn) removeBtn.style.display = items.length > 1 ? 'flex' : 'none';
            });
        });
    };

    const addParty = (listElement, isAuthor) => {
        const newParty = createPartyElement(isAuthor);
        listElement.appendChild(newParty);
        addInputBehaviors(newParty);
        updateRemoveButtons();
    };

    const addInputBehaviors = (container) => {
        // CPF/CNPJ: formatação + validação no blur
        container.querySelectorAll('.party-cpf').forEach(input => {
            input.addEventListener('input', (e) => e.target.value = formatCpfCnpj(e.target.value));
            input.addEventListener('blur', (e) => {
                const value = e.target.value.replace(/\D/g, '');
                e.target.classList.remove('cpf-valid', 'cpf-invalid');
                if (!value) { e.target.classList.add('border-gray-300'); return; }
                const isValid = validarCpfCnpj(value);
                e.target.classList.remove('border-gray-300');
                e.target.classList.add(isValid ? 'cpf-valid' : 'cpf-invalid');
            });
        });

        container.querySelectorAll('.party-phone').forEach(input => input.addEventListener('input', (e) => e.target.value = formatPhone(e.target.value)));
        container.querySelectorAll('.party-dob').forEach(input => input.addEventListener('input', (e) => e.target.value = formatDate(e.target.value)));

        // CEP checkbox: preencher manualmente
        const noCepCheck = container.querySelector('.no-cep-check');
        noCepCheck.addEventListener('change', (e) => {
            const isChecked = e.target.checked;
            const addressContainer = container.querySelector('.address-container');
            addressContainer.querySelectorAll('input:not(.party-cep)').forEach(input => {
                input.readOnly = !isChecked;
                input.classList.toggle('bg-gray-100', !isChecked);
                if (isChecked) input.value = '';
            });
            addressContainer.querySelector('.party-cep').disabled = isChecked;
        });

        // Sem endereço checkbox
        const noAddressCheck = container.querySelector('.no-address-check');
        noAddressCheck.addEventListener('change', (e) => {
            const isChecked = e.target.checked;
            container.querySelector('.address-container').style.display = isChecked ? 'none' : 'block';
            container.querySelector('.no-cep-option').style.display = isChecked ? 'none' : 'flex';
            container.querySelector('.no-address-justification-field').classList.toggle('hidden', !isChecked);
        });

        // CEP auto-fetch com loading
        container.querySelectorAll('.party-cep').forEach(input => {
            input.addEventListener('input', function () {
                if (container.querySelector('.no-cep-check').checked) return;
                this.value = this.value.replace(/\D/g, '').replace(/^(\d{5})(\d)/, '$1-$2');
                const cep = this.value.replace(/\D/g, '');
                if (cep.length === 8) {
                    const parent = this.closest('.party-item');
                    const cepInput = this;
                    // Loading indicator
                    cepInput.classList.add('animate-pulse', 'bg-yellow-50');
                    fetch(`https://viacep.com.br/ws/${cep}/json/`)
                        .then(response => response.json())
                        .then(data => {
                            if (!data.erro) {
                                parent.querySelector('.party-street').value = data.logradouro;
                                parent.querySelector('.party-district').value = data.bairro;
                                parent.querySelector('.party-city').value = data.localidade;
                                parent.querySelector('.party-state').value = data.uf;
                                parent.querySelector('.party-number').focus();
                                // Auto-update comarca a partir do primeiro autor
                                if (parent.closest('#autores-list') && parent === autoresList.querySelector('.party-item')) {
                                    const comarcaInput = document.getElementById('comarca-input');
                                    if (comarcaInput.value === 'Marília/SP' || !comarcaInput.value) {
                                        comarcaInput.value = `${data.localidade}/${data.uf}`;
                                    }
                                }
                                scheduleAutoSave();
                            } else {
                                showToast('CEP não encontrado.', 'error');
                            }
                        })
                        .catch(error => console.error('Erro ao buscar o CEP:', error))
                        .finally(() => cepInput.classList.remove('animate-pulse', 'bg-yellow-50'));
                }
            });
        });

        // Auto-save on any input within party
        container.addEventListener('input', () => scheduleAutoSave());
        container.addEventListener('change', () => scheduleAutoSave());
    };

    // --- DROPDOWN TIPO DE AÇÃO ---
    const actionTypes = [
        { value: "Indenização por Danos Morais", text: "Indenização por Danos Morais" },
        { value: "Indenização por Danos Materiais", text: "Indenização por Danos Materiais" },
        { value: "Obrigação de Fazer/Não Fazer", text: "Obrigação de Fazer/Não Fazer" },
        { value: "Rescisão de Contrato c/c Devolução do Dinheiro", text: "Rescisão de Contrato c/c Devolução do Dinheiro" },
        { value: "Rescisão de Contrato", text: "Rescisão de Contrato" },
        { value: "Inexigibilidade de Débito", text: "Inexigibilidade de Débito" },
        { value: "Ação de Cobrança", text: "Ação de Cobrança" },
        { value: "Defesa do Consumidor (Inscrição Indevida)", text: "Defesa do Consumidor (Inscrição Indevida)" },
        { value: "Defesa do Consumidor (Produto/Serviço Defeituoso)", text: "Defesa do Consumidor (Produto/Serviço)" },
        { value: "Acidente de Trânsito", text: "Acidente de Trânsito" },
        { value: "Outros", text: "Outros (especificar)" },
    ];

    actionTypes.forEach(action => {
        const optionLabel = document.createElement('label');
        optionLabel.className = 'flex items-center p-2 cursor-pointer';
        optionLabel.innerHTML = `<input type="checkbox" class="h-4 w-4 text-indigo-600 border-gray-300 rounded action-type-checkbox" value="${action.value}"><span class="ml-2 text-gray-700">${action.text}</span>`;
        actionTypeOptions.appendChild(optionLabel);
    });

    const updateActionTypeDisplay = () => {
        const selected = Array.from(actionTypeOptions.querySelectorAll('.action-type-checkbox:checked'))
            .map(cb => cb.parentElement.querySelector('span').textContent);
        if (selected.length === 0) {
            actionTypeText.textContent = 'Selecione...';
            actionTypeText.classList.add('text-gray-500');
        } else {
            actionTypeText.textContent = selected.join(', ');
            actionTypeText.classList.remove('text-gray-500');
        }
        actionTypeOtherInput.classList.toggle('hidden', !selected.some(s => s.includes('Outros')));
    };

    actionTypeButton.addEventListener('click', (e) => { e.stopPropagation(); actionTypeOptions.classList.toggle('hidden'); });
    document.addEventListener('click', (e) => { if (!actionTypeContainer.contains(e.target)) actionTypeOptions.classList.add('hidden'); });

    actionTypeOptions.addEventListener('change', () => {
        updateActionTypeDisplay();
        updateTemplateBanner();
        updateAccidentFields();
        scheduleAutoSave();
    });

    // --- CAMPOS DINÂMICOS ACIDENTE DE TRÂNSITO ---
    function updateAccidentFields() {
        const selected = Array.from(actionTypeOptions.querySelectorAll('.action-type-checkbox:checked')).map(cb => cb.value);
        const accFields = document.getElementById('accident-dynamic-fields');
        if (accFields) accFields.classList.toggle('hidden', !selected.includes('Acidente de Trânsito'));
    }

    // Formatar data DD/MM/AAAA para formato extenso em português
    function formatDatePtBr(dateStr) {
        if (!dateStr) return '';
        const months = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
        const digits = dateStr.replace(/\D/g, '');
        if (digits.length < 8) return dateStr;
        const day = parseInt(digits.substring(0, 2), 10);
        const month = parseInt(digits.substring(2, 4), 10) - 1;
        const year = digits.substring(4, 8);
        if (month < 0 || month > 11) return dateStr;
        return `${day} de ${months[month]} de ${year}`;
    }

    function generateAccidentTemplate() {
        const v = (id) => (document.getElementById(id)?.value || '').trim();
        const c = (id) => document.getElementById(id)?.checked || false;
        const repairType = v('acc-repair-type'); // 'cobranca' ou 'reparacao'

        // Build fatos
        const dataExtenso = formatDatePtBr(v('acc-date'));
        let fatos = `No dia ${dataExtenso || '[DATA DO ACIDENTE]'}`;
        if (v('acc-time')) fatos += `, por volta das ${v('acc-time')}`;
        fatos += `, na ${v('acc-location') || '[LOCAL DO ACIDENTE]'}`;
        if (v('acc-road-type')) fatos += ` (${v('acc-road-type')})`;
        fatos += `, ocorreu ${v('acc-collision-type') || 'uma colisão'} envolvendo o veículo da parte autora`;
        fatos += `, ${v('acc-author-model') || '[MODELO/MARCA]'}`;
        if (v('acc-author-color')) fatos += `, cor ${v('acc-author-color')}`;
        if (v('acc-author-year')) fatos += `, ano ${v('acc-author-year')}`;
        fatos += `, placa ${v('acc-author-plate') || '[PLACA]'}`;
        fatos += `, e o veículo da parte ré`;
        fatos += `, ${v('acc-defendant-model') || '[MODELO/MARCA]'}`;
        if (v('acc-defendant-color')) fatos += `, cor ${v('acc-defendant-color')}`;
        if (v('acc-defendant-year')) fatos += `, ano ${v('acc-defendant-year')}`;
        fatos += `, placa ${v('acc-defendant-plate') || '[PLACA]'}`;
        fatos += '.';

        if (v('acc-description')) fatos += `\n\n${v('acc-description')}`;
        if (c('acc-bo-check')) fatos += `\n\nFoi lavrado Boletim de Ocorrência nº ${v('acc-bo-number') || '[NÚMERO DO BO]'}, que acompanha esta petição.`;

        // Danos materiais - texto dos fatos
        if (repairType === 'cobranca') {
            const quotes = [v('acc-quote-1'), v('acc-quote-2'), v('acc-quote-3')].filter(Boolean);
            fatos += '\n\nEm decorrência do acidente, o veículo da parte autora sofreu avarias.';
            if (quotes.length > 0) {
                const qtdTexto = quotes.length === 1 ? 'Foi obtido 1 orçamento' : `Foram obtidos ${quotes.length} orçamentos`;
                fatos += ` ${qtdTexto} para reparo: ${quotes.map((q, i) => `orçamento ${i + 1}: R$ ${q}`).join('; ')}.`;
            }
            if (v('acc-repair-value')) {
                // Identificar a qual orçamento corresponde o valor escolhido
                const select = document.getElementById('acc-repair-value-select');
                const selectedOption = select?.options[select.selectedIndex];
                const quoteRef = selectedOption?.dataset?.quoteLabel;
                if (quoteRef) {
                    fatos += ` A parte autora pleiteia o valor de R$ ${v('acc-repair-value')} a título de danos materiais, referente ao ${quoteRef}.`;
                } else {
                    fatos += ` A parte autora pleiteia o valor de R$ ${v('acc-repair-value')} a título de danos materiais.`;
                }
            }
        } else if (repairType === 'reparacao') {
            if (v('acc-reparacao-value')) {
                fatos += `\n\nEm decorrência do acidente, o veículo da parte autora sofreu avarias, tendo sido reparado ao custo de R$ ${v('acc-reparacao-value')}, conforme nota fiscal/recibo anexo.`;
            } else {
                fatos += '\n\nEm decorrência do acidente, o veículo da parte autora sofreu avarias, tendo já sido reparado.';
            }
        } else {
            fatos += '\n\nEm decorrência do acidente, o veículo da parte autora sofreu avarias.';
        }

        // Danos morais - fatos
        if (c('acc-moral-check')) {
            const moralDesc = v('acc-moral-desc');
            if (moralDesc) {
                fatos += `\n\n${moralDesc}`;
            } else {
                fatos += '\n\nAlém dos danos materiais, a parte autora sofreu intenso abalo moral em decorrência do acidente, experimentando sofrimento, angústia e transtornos que ultrapassam o mero aborrecimento.';
            }
        }

        // Danos estéticos - fatos
        if (c('acc-aesthetic-check')) {
            const aestheticDesc = v('acc-aesthetic-desc');
            if (aestheticDesc) {
                fatos += `\n\n${aestheticDesc}`;
            } else {
                fatos += '\n\nO acidente causou à parte autora lesões que resultaram em dano estético permanente, afetando sua aparência física e causando constrangimento.';
            }
        }

        // Lucros cessantes - fatos
        if (c('acc-lost-income-check')) {
            const lostIncomeDesc = v('acc-lost-income-desc');
            if (lostIncomeDesc) {
                fatos += `\n\n${lostIncomeDesc}`;
            } else {
                fatos += '\n\nEm razão do acidente, a parte autora ficou impossibilitada de exercer suas atividades laborais, deixando de auferir renda durante o período de recuperação.';
            }
        }

        fatos += '\n\nA parte autora tentou resolver a questão amigavelmente com a parte ré, porém não obteve êxito, restando-lhe apenas a via judicial.';

        // Build pedidos
        let pedidos = '';
        let charCode = 'b'.charCodeAt(0);
        const next = () => { const l = String.fromCharCode(charCode); charCode++; return l; };

        // Dano material - pedido
        if (repairType === 'cobranca') {
            const valorCobrar = v('acc-repair-value');
            if (valorCobrar) {
                pedidos += `${next()}) A condenação da parte ré ao pagamento de R$ ${valorCobrar} a título de danos materiais, referente ao reparo do veículo da parte autora, conforme orçamento(s) anexo(s);\n\n`;
            } else {
                pedidos += `${next()}) A condenação da parte ré ao pagamento dos danos materiais causados ao veículo da parte autora, conforme orçamento(s) a ser(em) juntado(s);\n\n`;
            }
        } else if (repairType === 'reparacao') {
            const valorReparo = v('acc-reparacao-value');
            if (valorReparo) {
                pedidos += `${next()}) A condenação da parte ré ao ressarcimento de R$ ${valorReparo} a título de danos materiais, referente ao valor despendido no reparo do veículo da parte autora;\n\n`;
            } else {
                pedidos += `${next()}) A condenação da parte ré ao ressarcimento dos danos materiais já despendidos pela parte autora no reparo do veículo;\n\n`;
            }
        } else {
            pedidos += `${next()}) A condenação da parte ré ao pagamento dos danos materiais causados ao veículo da parte autora;\n\n`;
        }

        if (c('acc-moral-check')) {
            pedidos += `${next()}) A condenação da parte ré ao pagamento de indenização por danos morais no valor de R$ ${v('acc-moral-value') || '[VALOR]'}, em razão do abalo emocional e sofrimento causados pelo acidente;\n\n`;
        }
        if (c('acc-aesthetic-check')) {
            pedidos += `${next()}) A condenação da parte ré ao pagamento de indenização por danos estéticos no valor de R$ ${v('acc-aesthetic-value') || '[VALOR]'}, em razão das lesões permanentes à aparência física da parte autora;\n\n`;
        }
        if (c('acc-lost-income-check')) {
            pedidos += `${next()}) A condenação da parte ré ao pagamento de lucros cessantes no valor de R$ ${v('acc-lost-income-value') || '[VALOR]'}, correspondente à renda que a parte autora deixou de auferir durante o período de impossibilidade de trabalho;\n\n`;
        }
        return { fatos, pedidos: pedidos.trim() };
    }

    // Checkbox toggles dos campos de acidente (agora com containers expandidos)
    const accTogglePairs = [
        ['acc-bo-check', 'acc-bo-number'],
        ['acc-moral-check', 'acc-moral-fields'],
        ['acc-aesthetic-check', 'acc-aesthetic-fields'],
        ['acc-lost-income-check', 'acc-lost-income-fields'],
    ];
    accTogglePairs.forEach(([checkId, containerId]) => {
        const check = document.getElementById(checkId);
        const container = document.getElementById(containerId);
        if (check && container) {
            check.addEventListener('change', () => container.classList.toggle('hidden', !check.checked));
        }
    });

    // Toggle tipo de dano material (cobrança vs reparação)
    const accRepairType = document.getElementById('acc-repair-type');
    if (accRepairType) {
        accRepairType.addEventListener('change', () => {
            const val = accRepairType.value;
            document.getElementById('acc-cobranca-fields')?.classList.toggle('hidden', val !== 'cobranca');
            document.getElementById('acc-reparacao-fields')?.classList.toggle('hidden', val !== 'reparacao');
        });
    }

    // Máscara de valor em todos os campos monetários do acidente (delegação de eventos)
    const accFieldsForMask = document.getElementById('accident-dynamic-fields');
    if (accFieldsForMask) {
        accFieldsForMask.addEventListener('blur', (e) => {
            if (e.target.classList.contains('acc-value-input')) {
                formatValueOnBlur(e);
                // Atualizar dropdown se for um campo de orçamento
                if (['acc-quote-1', 'acc-quote-2', 'acc-quote-3'].includes(e.target.id)) {
                    updateRepairValueDropdown();
                }
            }
        }, true); // capture=true para pegar blur em delegação
    }

    // --- Dropdown dinâmico: valor a cobrar baseado nos orçamentos ---
    function updateRepairValueDropdown() {
        const select = document.getElementById('acc-repair-value-select');
        const hiddenInput = document.getElementById('acc-repair-value');
        const label = document.getElementById('acc-repair-value-label');
        if (!select) return;

        const quoteInputs = [
            { el: document.getElementById('acc-quote-1'), label: 'Orçamento 1' },
            { el: document.getElementById('acc-quote-2'), label: 'Orçamento 2' },
            { el: document.getElementById('acc-quote-3'), label: 'Orçamento 3' },
        ];

        const previousValue = select.value;
        select.innerHTML = '<option value="">Selecione o valor...</option>';

        const filledQuotes = quoteInputs.filter(q => q.el && q.el.value.trim());
        filledQuotes.forEach(q => {
            const opt = document.createElement('option');
            opt.value = q.el.value.trim();
            opt.textContent = `${q.label}: R$ ${q.el.value.trim()}`;
            opt.dataset.quoteLabel = q.label;
            select.appendChild(opt);
        });

        // Calcular menor, maior e média
        const numericValues = filledQuotes.map(q => parseFloat(q.el.value.replace(/\./g, '').replace(',', '.'))).filter(v => !isNaN(v));
        if (numericValues.length >= 2) {
            const menor = Math.min(...numericValues);
            const maior = Math.max(...numericValues);
            const media = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
            const fmt = (v) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

            const optMenor = document.createElement('option');
            optMenor.value = fmt(menor);
            optMenor.textContent = `Menor valor: R$ ${fmt(menor)}`;
            optMenor.dataset.quoteLabel = 'menor orçamento';
            select.appendChild(optMenor);

            const optMedia = document.createElement('option');
            optMedia.value = fmt(media);
            optMedia.textContent = `Média dos orçamentos: R$ ${fmt(media)}`;
            optMedia.dataset.quoteLabel = 'média dos orçamentos';
            select.appendChild(optMedia);

            const optMaior = document.createElement('option');
            optMaior.value = fmt(maior);
            optMaior.textContent = `Maior valor: R$ ${fmt(maior)}`;
            optMaior.dataset.quoteLabel = 'maior orçamento';
            select.appendChild(optMaior);
        }

        // Restaurar seleção se possível
        if (previousValue) {
            const match = Array.from(select.options).find(o => o.value === previousValue);
            if (match) select.value = previousValue;
        }

        // Atualizar hidden value e label
        updateRepairHiddenValue();
    }

    function updateRepairHiddenValue() {
        const select = document.getElementById('acc-repair-value-select');
        const hiddenInput = document.getElementById('acc-repair-value');
        const label = document.getElementById('acc-repair-value-label');
        if (!select || !hiddenInput) return;

        const selectedOption = select.options[select.selectedIndex];
        hiddenInput.value = select.value;

        if (select.value && label) {
            label.textContent = `Valor selecionado: R$ ${select.value}`;
            label.classList.remove('hidden');
        } else if (label) {
            label.classList.add('hidden');
        }
    }

    const repairSelect = document.getElementById('acc-repair-value-select');
    if (repairSelect) repairSelect.addEventListener('change', updateRepairHiddenValue);

    // Formatar data do acidente
    const accDateInput = document.getElementById('acc-date');
    if (accDateInput) accDateInput.addEventListener('input', (e) => e.target.value = formatDate(e.target.value));

    // --- AUTO-POPULATE: gerar texto automaticamente a partir dos campos do acidente ---
    const accFieldsContainer = document.getElementById('accident-dynamic-fields');
    if (accFieldsContainer) {
        const autoPopulateFromAccident = () => {
            const selected = Array.from(actionTypeOptions.querySelectorAll('.action-type-checkbox:checked')).map(cb => cb.value);
            if (!selected.includes('Acidente de Trânsito')) return;

            const fatosField = document.getElementById('fatos-content');
            const pedidoField = document.getElementById('pedido-content');

            // Só auto-preenche se vazio ou se o conteúdo foi gerado automaticamente
            const fatosEmpty = !fatosField.value.trim();
            const pedidoEmpty = !pedidoField.value.trim();
            const fatosAutoGen = fatosField.dataset.autoGenerated === 'accident';
            const pedidoAutoGen = pedidoField.dataset.autoGenerated === 'accident';

            if (!fatosEmpty && !fatosAutoGen && !pedidoEmpty && !pedidoAutoGen) return;

            const generated = generateAccidentTemplate();
            if (fatosEmpty || fatosAutoGen) {
                fatosField.value = generated.fatos;
                fatosField.dataset.autoGenerated = 'accident';
            }
            if (pedidoEmpty || pedidoAutoGen) {
                pedidoField.value = generated.pedidos;
                pedidoField.dataset.autoGenerated = 'accident';
            }
            scheduleAutoSave();
        };

        accFieldsContainer.addEventListener('input', autoPopulateFromAccident);
        accFieldsContainer.addEventListener('change', autoPopulateFromAccident);
    }

    // Limpar flag de auto-geração quando o usuário digitar manualmente nos campos fatos/pedidos
    ['fatos-content', 'pedido-content'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', function () {
            if (this.dataset.autoGenerated) delete this.dataset.autoGenerated;
        });
    });

    // --- SISTEMA DE TEMPLATES ---
    const updateTemplateBanner = () => {
        const selected = Array.from(actionTypeOptions.querySelectorAll('.action-type-checkbox:checked')).map(cb => cb.value);
        const available = selected.filter(s => TEMPLATES[s]);
        const banner = document.getElementById('template-banner');
        const selectEl = document.getElementById('template-select');

        if (available.length === 0) { banner.classList.add('hidden'); return; }

        banner.classList.remove('hidden');

        if (available.length === 1) {
            selectEl.classList.add('hidden');
            banner.dataset.templateKey = available[0];
        } else {
            selectEl.classList.remove('hidden');
            selectEl.innerHTML = '';
            available.forEach(key => {
                const opt = document.createElement('option');
                opt.value = key; opt.textContent = key;
                selectEl.appendChild(opt);
            });
            banner.dataset.templateKey = available[0];
        }
    };

    document.getElementById('use-template-btn').addEventListener('click', () => {
        const selectEl = document.getElementById('template-select');
        const key = selectEl.classList.contains('hidden') ? document.getElementById('template-banner').dataset.templateKey : selectEl.value;
        const template = TEMPLATES[key];
        if (!template) return;

        const fatosField = document.getElementById('fatos-content');
        const pedidoField = document.getElementById('pedido-content');

        if ((fatosField.value.trim() || pedidoField.value.trim()) &&
            !confirm('Os campos Fatos e Pedidos já possuem texto. Deseja substituir pelo modelo?')) return;

        if (template.hasDynamicFields && key === 'Acidente de Trânsito') {
            const generated = generateAccidentTemplate();
            fatosField.value = generated.fatos;
            pedidoField.value = generated.pedidos;
            fatosField.dataset.autoGenerated = 'accident';
            pedidoField.dataset.autoGenerated = 'accident';
            showToast('Modelo gerado a partir dos dados do acidente! Revise e ajuste conforme necessário.');
        } else {
            fatosField.value = template.fatos;
            pedidoField.value = template.pedidos;
            showToast('Modelo aplicado! Adapte os trechos entre [COLCHETES].');
        }
        scheduleAutoSave();
    });

    // --- TESTEMUNHAS ---
    const addWitness = () => {
        const item = document.createElement('div');
        item.className = 'witness-item p-3 border rounded-lg bg-white relative space-y-3';
        item.innerHTML = `
            <button type="button" class="remove-witness-btn absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white font-bold h-6 w-6 rounded-full text-xs flex items-center justify-center" title="Remover Testemunha">&times;</button>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div><label class="block text-sm font-medium text-gray-700">Nome Completo</label><input type="text" class="witness-name w-full mt-1 p-2 border border-gray-300 rounded-lg shadow-sm"></div>
                <div><label class="block text-sm font-medium text-gray-700">Endereço</label><input type="text" class="witness-address w-full mt-1 p-2 border border-gray-300 rounded-lg shadow-sm"></div>
                <div><label class="block text-sm font-medium text-gray-700">Telefone</label><input type="text" class="witness-phone w-full mt-1 p-2 border border-gray-300 rounded-lg shadow-sm" placeholder="(XX) XXXXX-XXXX"></div>
            </div>`;
        witnessList.appendChild(item);
        item.querySelector('.witness-phone').addEventListener('input', (e) => e.target.value = formatPhone(e.target.value));
        item.addEventListener('input', () => scheduleAutoSave());
    };

    witnessList.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-witness-btn')) { e.target.closest('.witness-item').remove(); scheduleAutoSave(); }
    });

    // --- DOCUMENTOS ---
    const addDocument = () => {
        const newItem = document.createElement('div');
        newItem.className = 'document-item grid grid-cols-1 md:grid-cols-2 gap-4 items-center';
        newItem.innerHTML = `
            <div class="flex items-center gap-2">
                <select class="document-type w-full p-2 border border-gray-300 rounded-lg bg-white">
                    <option value="RG/CPF">RG/CPF</option>
                    <option value="Comprovante de Residência">Comprovante de Residência</option>
                    <option value="Nota Fiscal">Nota Fiscal</option>
                    <option value="Extrato Bancário">Extrato Bancário</option>
                    <option value="Comprovante de Transferência/PIX">Comprovante de Transferência/PIX</option>
                    <option value="Comprovante de Pagamento">Comprovante de Pagamento</option>
                    <option value="Conversas em WhatsApp">Conversas em WhatsApp</option>
                    <option value="Foto/Print">Foto/Print</option>
                    <option value="Contrato/Termo de Adesão">Contrato/Termo de Adesão</option>
                    <option value="Laudo/Atestado Médico">Laudo/Atestado Médico</option>
                    <option value="Boletim de Ocorrência">Boletim de Ocorrência</option>
                    <option value="Outro">Outro</option>
                </select>
                <button type="button" class="remove-document-btn bg-red-500 hover:bg-red-600 text-white font-bold h-8 w-8 rounded-lg flex-shrink-0 flex items-center justify-center" title="Remover Documento">&times;</button>
            </div>
            <input type="text" class="document-other-type w-full p-2 border border-gray-300 rounded-lg hidden" placeholder="Especifique o tipo de documento">`;
        documentList.appendChild(newItem);
        newItem.querySelector('.document-type').addEventListener('change', (e) => {
            e.target.parentElement.parentElement.querySelector('.document-other-type').classList.toggle('hidden', e.target.value !== 'Outro');
            scheduleAutoSave();
        });
        newItem.addEventListener('input', () => scheduleAutoSave());
    };

    documentList.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-document-btn')) { e.target.closest('.document-item').remove(); scheduleAutoSave(); }
    });

    // --- EXTRAÇÃO DE DADOS ---
    const getFormData = () => {
        const getPartyData = (listElement, isAuthor) => {
            return Array.from(listElement.querySelectorAll('.party-item')).map(item => ({
                name: item.querySelector('.party-name').value.trim(),
                maritalStatus: item.querySelector('.party-marital-status').value,
                profession: item.querySelector('.party-profession').value.trim(),
                cpf: item.querySelector('.party-cpf').value.trim(),
                dob: isAuthor ? item.querySelector('.party-dob').value.trim() : null,
                rg: item.querySelector('.party-rg').value.trim(),
                emitter: item.querySelector('.party-emitter').value.trim(),
                phone: item.querySelector('.party-phone').value.trim(),
                email: item.querySelector('.party-email').value.trim(),
                address: (() => {
                    if (item.querySelector('.no-address-check').checked) return null;
                    const cep = item.querySelector('.party-cep').value.trim();
                    return `${item.querySelector('.party-street').value}, nº ${item.querySelector('.party-number').value}, ${item.querySelector('.party-complement').value || ''}`.trim() +
                        ` - ${item.querySelector('.party-district').value}${cep ? `, CEP: ${cep}` : ''}, ${item.querySelector('.party-city').value}/${item.querySelector('.party-state').value}`;
                })(),
                noAddressJustification: item.querySelector('.no-address-check').checked ? item.querySelector('.no-address-justification').value.trim() : null,
                isExcluded: isAuthor ? item.querySelector('.party-excluded').checked : false,
                city: item.querySelector('.party-city').value,
                state: item.querySelector('.party-state').value,
            })).filter(p => p.name);
        };

        const getDocuments = () => Array.from(documentList.querySelectorAll('.document-item')).map(item => {
            const type = item.querySelector('.document-type').value;
            return type === 'Outro' ? item.querySelector('.document-other-type').value.trim() : type;
        }).filter(Boolean);

        const getWitnesses = () => Array.from(witnessList.querySelectorAll('.witness-item')).map(item => ({
            name: item.querySelector('.witness-name').value.trim(),
            address: item.querySelector('.witness-address').value.trim(),
            phone: item.querySelector('.witness-phone').value.trim(),
        })).filter(w => w.name);

        const selectedActions = Array.from(actionTypeOptions.querySelectorAll('.action-type-checkbox:checked')).map(cb => cb.value);
        const otherIndex = selectedActions.indexOf('Outros');
        if (otherIndex > -1) selectedActions[otherIndex] = actionTypeOtherInput.value.trim();

        // Construir nome dinâmico do tipo de ação para Acidente de Trânsito
        let actionType;
        if (selectedActions.includes('Acidente de Trânsito')) {
            let accBase = 'Reparação de Danos Materiais Decorrente de Acidente de Trânsito';
            const extras = [];
            if (document.getElementById('acc-moral-check')?.checked) extras.push('Danos Morais');
            if (document.getElementById('acc-aesthetic-check')?.checked) extras.push('Danos Estéticos');
            if (document.getElementById('acc-lost-income-check')?.checked) extras.push('Lucros Cessantes');
            if (extras.length > 0) accBase += ' e ' + extras.join(' e ');
            // Replace "Acidente de Trânsito" with the full dynamic name
            const filteredActions = selectedActions.filter(a => a !== 'Acidente de Trânsito').filter(Boolean);
            filteredActions.unshift(accBase);
            actionType = filteredActions.join(' c/c ');
        } else {
            actionType = selectedActions.filter(Boolean).join(' c/c ');
        }

        let fatos = document.getElementById('fatos-content').value.trim();
        let pedido = document.getElementById('pedido-content').value.trim();

        // Rede de segurança: se Acidente de Trânsito selecionado e campos vazios, gerar automaticamente
        if (selectedActions.includes('Acidente de Trânsito') && (!fatos || !pedido)) {
            const generated = generateAccidentTemplate();
            if (!fatos) fatos = generated.fatos;
            if (!pedido) pedido = generated.pedidos;
        }

        return {
            autores: getPartyData(autoresList, true),
            reus: getPartyData(reusList, false),
            actionType,
            actionValue: document.getElementById('action-value').value.trim(),
            comarca: document.getElementById('comarca-input').value.trim() || 'Marília/SP',
            fatos,
            pedido,
            documents: getDocuments(),
            witnesses: getWitnesses(),
            tutela: tutelaCheck.checked,
            tutelaJustificativa: document.getElementById('tutela-justificativa').value.trim(),
            sigilo: sigiloCheck.checked,
            sigiloJustificativa: document.getElementById('sigilo-justificativa').value.trim(),
            audiencia: document.querySelector('input[name="audiencia"]:checked')?.value || null,
            audienciaJustificativa: document.getElementById('audiencia-justificativa').value.trim(),
        };
    };

    // --- VALIDAÇÃO COM FEEDBACK VISUAL ---
    const validateForm = (data) => {
        clearAllErrors();
        let hasError = false;
        let firstErrorEl = null;

        const markError = (el, msg) => {
            if (!el) return;
            showFieldError(el, msg);
            hasError = true;
            if (!firstErrorEl) firstErrorEl = el;
        };

        // Autores
        if (data.autores.length === 0) {
            markError(autoresList.querySelector('.party-name') || addAutorBtn, 'Adicione pelo menos um autor.');
        }

        const autorElements = autoresList.querySelectorAll('.party-item');
        for (const autorEl of autorElements) {
            const nameF = autorEl.querySelector('.party-name');
            const cpfF = autorEl.querySelector('.party-cpf');
            const dobF = autorEl.querySelector('.party-dob');
            const streetF = autorEl.querySelector('.party-street');
            const numberF = autorEl.querySelector('.party-number');
            const cepF = autorEl.querySelector('.party-cep');
            const noCep = autorEl.querySelector('.no-cep-check').checked;

            if (!nameF.value.trim()) markError(nameF, 'Nome é obrigatório');
            if (!cpfF.value.trim()) markError(cpfF, 'CPF é obrigatório');
            else if (!validarCpfCnpj(cpfF.value)) markError(cpfF, 'CPF/CNPJ inválido');
            if (!dobF.value.trim() || dobF.value.trim().length < 10) markError(dobF, 'Data de nascimento é obrigatória');
            if (!streetF.value.trim()) markError(streetF, 'Logradouro é obrigatório');
            if (!numberF.value.trim()) markError(numberF, 'Número é obrigatório');
            if (!noCep && !cepF.value.trim()) markError(cepF, 'CEP é obrigatório');
        }

        // Réus
        if (data.reus.length === 0) {
            const reuName = reusList.querySelector('.party-name');
            markError(reuName || addReuBtn, 'Adicione pelo menos um réu com Nome.');
        }

        // Campos gerais
        if (!data.actionType) markError(actionTypeButton, 'Selecione o tipo de ação');
        if (!data.fatos) markError(document.getElementById('fatos-content'), 'O campo DOS FATOS é obrigatório');
        if (!data.pedido) markError(document.getElementById('pedido-content'), 'O campo PEDIDOS é obrigatório');
        if (!data.actionValue) markError(document.getElementById('action-value'), 'Valor da causa é obrigatório');
        if (data.tutela && !data.tutelaJustificativa) markError(document.getElementById('tutela-justificativa'), 'Justifique a tutela de urgência');
        if (data.sigilo && !data.sigiloJustificativa) markError(document.getElementById('sigilo-justificativa'), 'Justifique o segredo de justiça');

        if (hasError && firstErrorEl) {
            firstErrorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return !hasError;
    };

    // --- FUNÇÕES AUXILIARES DE CONTEÚDO ---
    const calculateAge = (dobString) => {
        if (!dobString || dobString.length < 10) return null;
        const [day, month, year] = dobString.split('/');
        const birthDate = new Date(+year, +month - 1, +day);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
        return age;
    };

    const buildPartyText = (party, isAuthor) => {
        const age = calculateAge(party.dob);
        const isMinor = isAuthor && age !== null && age < 18;
        let text = party.name.toUpperCase();
        if (isMinor) text += ', menor';
        if (party.maritalStatus) text += `, ${party.maritalStatus}`;
        if (party.profession) text += `, ${party.profession}`;
        if (party.rg) text += `, portador(a) do RG nº ${party.rg}` + (party.emitter ? ` - ${party.emitter}` : '');
        if (party.cpf) text += `, inscrito(a) no CPF/CNPJ sob o nº ${party.cpf}`;
        if (party.address) text += `, residente e domiciliado(a) no endereço: ${party.address}`;
        else text += `, em lugar incerto e não sabido, requerendo-se a pesquisa do seu endereço`;
        if (!isAuthor && !party.cpf && !party.rg) text += ', demais dados desconhecidos';
        if (party.phone) text += `, Telefone: ${party.phone}`;
        if (party.email) text += `, E-mail: ${party.email}`;
        return text;
    };

    const buildPedidoFinal = (data) => {
        let citacao = data.audiencia === 'sim'
            ? 'a) A citação e intimação da parte ré para comparecer à audiência de conciliação a ser designada, sob pena de revelia;'
            : 'a) A citação da parte ré para, querendo, apresentar defesa, sob pena de revelia;';

        let pf = `${citacao}\n\n${data.pedido}`;

        // Determinar próxima alínea com base nas letras já usadas
        const matches = pf.match(/^([a-z])\)/gm);
        let nextCharCode = 'b'.charCodeAt(0);
        if (matches && matches.length > 0) {
            const lastLetter = matches[matches.length - 1].charAt(0);
            nextCharCode = lastLetter.charCodeAt(0) + 1;
        }
        const getNextLetter = () => { const l = String.fromCharCode(nextCharCode); nextCharCode++; return l; };

        if (data.tutela) pf += `\n\n${getNextLetter()}) A concessão da tutela de urgência para ${data.tutelaJustificativa};`;
        if (data.autores.some(a => a.isExcluded)) pf += `\n\n${getNextLetter()}) A designação de eventuais audiências na modalidade presencial, em razão da declarada exclusão digital da parte autora;`;
        if (data.sigilo) pf += `\n\n${getNextLetter()}) A tramitação do feito em segredo de justiça, pois ${data.sigiloJustificativa};`;
        data.reus.forEach(reu => {
            if (reu.noAddressJustification) pf += `\n\n${getNextLetter()}) A localização do endereço do(a) réu(ré) ${reu.name}, uma vez que ${reu.noAddressJustification};`;
        });
        pf += `\n\n${getNextLetter()}) Havendo relação de consumo, a parte autora, desde logo, postula pela inversão do ônus da prova.`;
        if (data.audiencia === 'nao' && data.audienciaJustificativa) pf += `\n\n${getNextLetter()}) A parte autora manifesta o desinteresse na designação de audiência de conciliação, pela seguinte razão: ${data.audienciaJustificativa}.`;
        else if (data.audiencia === 'nao') pf += `\n\n${getNextLetter()}) A parte autora manifesta o desinteresse na designação de audiência de conciliação.`;
        return pf;
    };

    // --- GERAÇÃO DO HTML DO CONTEÚDO ---
    const generateContentHTML = (data) => {
        const today = new Date();
        const dateStr = today.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
        const comarca = data.comarca || 'Marília/SP';

        const generatePartyHTML = (party, isAuthor) => {
            const nameHTML = `<span style="font-weight: bold;">${party.name.toUpperCase()}</span>`;
            const age = calculateAge(party.dob);
            const isMinor = isAuthor && age !== null && age < 18;
            let details = '';
            if (isMinor) details += ', menor';
            if (party.maritalStatus) details += `, ${party.maritalStatus}`;
            if (party.profession) details += `, ${party.profession}`;
            if (party.rg) details += `, portador(a) do RG nº ${party.rg}` + (party.emitter ? ` - ${party.emitter}` : '');
            if (party.cpf) details += `, inscrito(a) no CPF/CNPJ sob o nº ${party.cpf}`;
            if (party.address) details += `, residente e domiciliado(a) no endereço: ${party.address}`;
            else details += `, em lugar incerto e não sabido, requerendo-se a pesquisa do seu endereço`;
            if (!isAuthor && !party.cpf && !party.rg) details += ', demais dados desconhecidos';
            if (party.phone) details += `, Telefone: ${party.phone}`;
            if (party.email) details += `, E-mail: ${party.email}`;
            return `<p>${nameHTML}<span>${details}</span></p>`;
        };

        const fatosHTML = data.fatos.split('\n').map(p => `<p style="text-indent: 4em;">${p}</p>`).join('');
        const pedidoFinal = buildPedidoFinal(data);
        const pedidoHTML = pedidoFinal.split('\n').filter(p => p.trim() !== '').map(p => `<p style="text-indent: 4em;">${p}</p>`).join('');
        const documentsHTML = data.documents.length > 0 ? `<p style="text-indent: 4em;">Acompanham a presente petição os seguintes documentos: ${data.documents.join(', ')}.</p>` : '';

        let witnessesHTML = '';
        if (data.witnesses && data.witnesses.length > 0) {
            witnessesHTML = `<p style="text-align: left; font-weight: bold; margin-top: 1cm;">ROL DE TESTEMUNHAS</p>`;
            data.witnesses.forEach((w, i) => {
                let t = `${i + 1}. ${w.name}`;
                if (w.address) t += `, residente em ${w.address}`;
                if (w.phone) t += `, Telefone: ${w.phone}`;
                witnessesHTML += `<p style="text-indent: 4em;">${t}</p>`;
            });
        }

        const signaturesHTML = data.autores.map(autor => `<div style="text-align: center; margin-top: 60px; page-break-inside: avoid;"><p style="border-top: 1px solid black; width: 75%; margin: 0 auto; padding-top: 5px;">${autor.name.toUpperCase()}</p><p style="margin:0; font-size: 10pt;">${autor.cpf}</p></div>`).join('');
        const actionName = data.actionType.toUpperCase() + (data.tutela ? " COM PEDIDO DE TUTELA DE URGÊNCIA" : "");

        // Labels dinâmicos singular/plural
        const requerenteLabel = data.autores.length > 1 ? 'REQUERENTES' : 'REQUERENTE';
        const requeridoLabel = data.reus.length > 1 ? 'REQUERIDOS' : 'REQUERIDO';

        let headersHTML = '';
        if (data.tutela) headersHTML += '<p style="text-align: right; font-weight: bold; color: red;">URGENTE - PEDIDO DE TUTELA DE URGÊNCIA</p>';
        if (data.sigilo) headersHTML += '<p style="text-align: right; font-weight: bold;">TRAMITAÇÃO EM SEGREDO DE JUSTIÇA</p>';
        if (data.autores.some(a => a.isExcluded)) headersHTML += '<p style="text-align: right; font-weight: bold;">PARTE AUTORA EXCLUÍDA DIGITAL</p>';
        if (data.autores.some(a => calculateAge(a.dob) < 18)) headersHTML += '<p style="text-align: right; font-weight: bold; color: blue;">PARTE AUTORA MENOR DE IDADE</p>';

        const orientacoesHTML = `
            <div style="margin-top: 2cm; padding: 10px; border: 2px solid #e5e7eb; background-color: #f9fafb; page-break-inside: avoid;">
                <h3 style="text-align: center; font-weight: bold; font-size: 11pt; margin: 0 0 10px 0;">ORIENTAÇÕES IMPORTANTES</h3>
                <ul style="font-size: 10pt; line-height: 1.5; margin: 0; padding-left: 20px;">
                    <li style="margin-bottom: 5px;"><strong>Responsabilidade:</strong> Os fatos, fundamentos e pedidos contidos nesta atermação são de sua inteira responsabilidade.</li>
                    <li style="margin-bottom: 5px;"><strong>Envio de Documentos:</strong> Os documentos devem ser enviados junto com esta manifestação. Tamanho máximo por arquivo: 10MB. Formatos aceitos: PDF, JPG, PNG, MP3, MP4, etc. <strong>Atenção:</strong> o nome dos arquivos <strong>NÃO</strong> deve conter os caracteres: \\ / : * ? " &lt; &gt; |</li>
                    <li style="margin-bottom: 5px;"><strong>Mudança de Endereço:</strong> Comunique ao Juizado qualquer mudança de endereço durante o processo. Intimações enviadas ao endereço antigo serão consideradas válidas.</li>
                    <li style="margin-bottom: 5px;"><strong>Limite de Valor:</strong> A escolha pelo Juizado Especial implica na renúncia de valores que ultrapassem 40 salários mínimos, salvo em caso de acordo.</li>
                    <li style="margin-bottom: 5px;"><strong>Testemunhas:</strong> Não é necessário levar testemunhas na audiência de conciliação. O pedido para ouvi-las em audiência de instrução deve ser feito separadamente, com a qualificação completa (nome e endereço).</li>
                </ul>
            </div>`;

        return `
            <div style="font-size: 12pt; line-height: 1.5; text-align: justify;">
                <p style="text-align: justify; font-weight: bold; font-size: 13pt;">EXCELENTÍSSIMO(A) SENHOR(A) DOUTOR(A) JUIZ(A) DE DIREITO DO JUIZADO ESPECIAL CÍVEL DA COMARCA DE ${comarca.toUpperCase()}</p>
                <div style="margin-top: 0.8cm;">${headersHTML}</div>
                <div style="margin-top: 0.8cm;"><p><strong>${requerenteLabel}:</strong><br>${data.autores.map(p => generatePartyHTML(p, true)).join(' ')}</p></div>
                <div style="margin-top: 0.8cm;"><p><strong>${requeridoLabel}:</strong><br>${data.reus.map(p => generatePartyHTML(p, false)).join(' ')}</p></div>
                <p style="text-align: center; font-weight: bold; font-size: 14pt; margin-top: 1cm; margin-bottom: 0.5cm;">AÇÃO DE ${actionName}</p>
                <p style="text-align: left; font-weight: bold; margin-top: 1cm; margin-bottom: 0.5cm;">DOS FATOS</p>
                ${fatosHTML}
                <p style="text-align: left; font-weight: bold; margin-top: 1cm; margin-bottom: 0.5cm;">PEDIDOS</p>
                <p style="text-indent: 4em;">Diante do exposto, requer a Vossa Excelência:</p>
                ${pedidoHTML}
                <p style="margin-top: 1cm;">${documentsHTML}</p>
                ${witnessesHTML}
                <p>&nbsp;</p>
                <p style="white-space: nowrap;">Dá-se à causa o valor de <span style="font-weight: bold;">R$ ${data.actionValue}</span>.</p>
                <div style="margin-top: 2cm; page-break-inside: avoid; text-align: left;">
                     <p>Nestes termos, pede deferimento.</p>
                     <p style="margin-top: 1cm;">${comarca}, ${dateStr}.</p>
                     ${orientacoesHTML}
                     ${signaturesHTML}
                </div>
            </div>`;
    };

    // --- PRÉ-VISUALIZAÇÃO ---
    function showPreview() {
        const data = getFormData();
        if (!validateForm(data)) return;
        previewContent.innerHTML = generateContentHTML(data);
        previewModal.classList.remove('hidden');
    }

    // --- GERAR PDF ---
    function generatePDF() {
        const data = getFormData();
        if (!validateForm(data)) return;
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        const content = document.createElement('div');
        content.innerHTML = generateContentHTML(data);
        content.style.width = '210mm';
        content.style.padding = '15mm';
        content.style.boxSizing = 'border-box';
        content.style.fontFamily = 'Times New Roman, Times, serif';
        content.style.color = '#111827';
        document.body.appendChild(content);
        pdf.html(content, {
            callback: function (doc) {
                document.body.removeChild(content);
                doc.save(`Atermacao_${data.autores[0].name.split(' ')[0]}.pdf`);
            },
            margin: [15, 15, 15, 15],
            autoPaging: 'text',
            width: 180,
            windowWidth: 794
        });
    }

    // --- COPIAR TEXTO ---
    function copyText() {
        const data = getFormData();
        if (!validateForm(data)) return;
        const comarca = data.comarca || 'Marília/SP';
        const today = new Date();
        const dateStr = today.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

        let text = `EXCELENTÍSSIMO(A) SENHOR(A) DOUTOR(A) JUIZ(A) DE DIREITO DO JUIZADO ESPECIAL CÍVEL DA COMARCA DE ${comarca.toUpperCase()}\n\n`;
        if (data.tutela) text += 'URGENTE - PEDIDO DE TUTELA DE URGÊNCIA\n';
        if (data.sigilo) text += 'TRAMITAÇÃO EM SEGREDO DE JUSTIÇA\n';
        if (data.autores.some(a => a.isExcluded)) text += 'PARTE AUTORA EXCLUÍDA DIGITAL\n';
        const requerenteLabelTxt = data.autores.length > 1 ? 'REQUERENTES' : 'REQUERENTE';
        const requeridoLabelTxt = data.reus.length > 1 ? 'REQUERIDOS' : 'REQUERIDO';
        text += `\n${requerenteLabelTxt}:\n`;
        data.autores.forEach(a => { text += buildPartyText(a, true) + '\n\n'; });
        text += `${requeridoLabelTxt}:\n`;
        data.reus.forEach(r => { text += buildPartyText(r, false) + '\n\n'; });

        const actionName = data.actionType.toUpperCase() + (data.tutela ? " COM PEDIDO DE TUTELA DE URGÊNCIA" : "");
        text += `AÇÃO DE ${actionName}\n\nDOS FATOS\n\n${data.fatos}\n\n`;
        text += `PEDIDOS\n\nDiante do exposto, requer a Vossa Excelência:\n\n${buildPedidoFinal(data)}\n\n`;
        if (data.documents.length > 0) text += `Acompanham a presente petição os seguintes documentos: ${data.documents.join(', ')}.\n\n`;
        if (data.witnesses && data.witnesses.length > 0) {
            text += 'ROL DE TESTEMUNHAS:\n';
            data.witnesses.forEach((w, i) => {
                text += `${i + 1}. ${w.name}`;
                if (w.address) text += `, residente em ${w.address}`;
                if (w.phone) text += `, Tel: ${w.phone}`;
                text += '\n';
            });
            text += '\n';
        }
        text += `Dá-se à causa o valor de R$ ${data.actionValue}.\n\nNestes termos, pede deferimento.\n\n${comarca}, ${dateStr}.\n\n`;
        data.autores.forEach(a => { text += `________________________\n${a.name.toUpperCase()}\n${a.cpf}\n\n`; });

        navigator.clipboard.writeText(text)
            .then(() => showToast('Texto copiado para a área de transferência!'))
            .catch(() => showToast('Não foi possível copiar o texto.', 'error'));
    }

    // --- GERAR DOCX ---
    function generateDOCX() {
        const data = getFormData();
        if (!validateForm(data)) return;

        if (typeof docx === 'undefined') {
            showToast('Biblioteca DOCX não carregada. Recarregue a página.', 'error');
            return;
        }

        const D = docx;
        const comarca = data.comarca || 'Marília/SP';
        const today = new Date();
        const dateStr = today.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

        const tr = (text, opts = {}) => new D.TextRun({
            text, bold: opts.bold || false, font: 'Times New Roman',
            size: opts.size || 24, color: opts.color || '000000',
        });

        const p = (runs, opts = {}) => new D.Paragraph({
            alignment: opts.center ? D.AlignmentType.CENTER : opts.right ? D.AlignmentType.RIGHT : D.AlignmentType.JUSTIFIED,
            indent: opts.indent ? { firstLine: 1134 } : undefined,
            spacing: { line: 360, after: opts.after !== undefined ? opts.after : 100 },
            children: Array.isArray(runs) ? runs : [tr(runs, opts)],
        });

        const children = [];

        // Cabeçalho (justificado, fonte levemente maior)
        children.push(new D.Paragraph({
            alignment: D.AlignmentType.JUSTIFIED,
            spacing: { line: 360, after: 100 },
            children: [new D.TextRun({ text: `EXCELENTÍSSIMO(A) SENHOR(A) DOUTOR(A) JUIZ(A) DE DIREITO DO JUIZADO ESPECIAL CÍVEL DA COMARCA DE ${comarca.toUpperCase()}`, bold: true, font: 'Times New Roman', size: 26 })]
        }));

        // Flags
        if (data.tutela) children.push(p('URGENTE - PEDIDO DE TUTELA DE URGÊNCIA', { bold: true, right: true, color: 'FF0000' }));
        if (data.sigilo) children.push(p('TRAMITAÇÃO EM SEGREDO DE JUSTIÇA', { bold: true, right: true }));
        if (data.autores.some(a => a.isExcluded)) children.push(p('PARTE AUTORA EXCLUÍDA DIGITAL', { bold: true, right: true }));
        if (data.autores.some(a => calculateAge(a.dob) < 18)) children.push(p('PARTE AUTORA MENOR DE IDADE', { bold: true, right: true, color: '0000FF' }));

        // Requerentes
        const requerenteLabelDocx = data.autores.length > 1 ? 'REQUERENTES:' : 'REQUERENTE:';
        children.push(p([tr(requerenteLabelDocx, { bold: true })], { after: 50 }));
        data.autores.forEach(a => children.push(p([tr(a.name.toUpperCase(), { bold: true }), tr(buildPartyText(a, true).slice(a.name.toUpperCase().length))])));

        // Requeridos
        const requeridoLabelDocx = data.reus.length > 1 ? 'REQUERIDOS:' : 'REQUERIDO:';
        children.push(p([tr(requeridoLabelDocx, { bold: true })], { after: 50 }));
        data.reus.forEach(r => children.push(p([tr(r.name.toUpperCase(), { bold: true }), tr(buildPartyText(r, false).slice(r.name.toUpperCase().length))])));

        // Título (fonte levemente maior)
        const actionName = data.actionType.toUpperCase() + (data.tutela ? " COM PEDIDO DE TUTELA DE URGÊNCIA" : "");
        children.push(new D.Paragraph({
            alignment: D.AlignmentType.CENTER,
            spacing: { line: 360, after: 200 },
            children: [new D.TextRun({ text: `AÇÃO DE ${actionName}`, bold: true, font: 'Times New Roman', size: 28 })]
        }));

        // Fatos
        children.push(p('DOS FATOS', { bold: true, after: 100 }));
        data.fatos.split('\n').forEach(line => { if (line.trim()) children.push(p(line, { indent: true })); });

        // Pedidos
        children.push(p('PEDIDOS', { bold: true, after: 100 }));
        children.push(p('Diante do exposto, requer a Vossa Excelência:', { indent: true }));
        buildPedidoFinal(data).split('\n').forEach(line => { if (line.trim()) children.push(p(line, { indent: true })); });

        // Documentos
        if (data.documents.length > 0) {
            children.push(p(`Acompanham a presente petição os seguintes documentos: ${data.documents.join(', ')}.`, { indent: true }));
        }

        // Testemunhas
        if (data.witnesses && data.witnesses.length > 0) {
            children.push(p('ROL DE TESTEMUNHAS', { bold: true }));
            data.witnesses.forEach((w, i) => {
                let t = `${i + 1}. ${w.name}`;
                if (w.address) t += `, residente em ${w.address}`;
                if (w.phone) t += `, Telefone: ${w.phone}`;
                children.push(p(t, { indent: true }));
            });
        }

        // Valor e encerramento
        children.push(p([tr('Dá-se à causa o valor de '), tr(`R$ ${data.actionValue}`, { bold: true }), tr('.')]));
        children.push(p(''));
        children.push(p('Nestes termos, pede deferimento.'));
        children.push(p(`${comarca}, ${dateStr}.`));
        children.push(p(''));

        // Assinaturas
        data.autores.forEach(a => {
            children.push(p(''));
            children.push(p('________________________', { center: true }));
            children.push(p(a.name.toUpperCase(), { center: true, bold: true, after: 0 }));
            children.push(p(a.cpf, { center: true, size: 20, after: 200 }));
        });

        const doc = new D.Document({
            sections: [{
                properties: { page: { margin: { top: 850, bottom: 850, left: 1134, right: 1134 } } },
                children
            }]
        });

        D.Packer.toBlob(doc).then(blob => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Atermacao_${data.autores[0].name.split(' ')[0]}.docx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    }

    // --- AUTO-SAVE ---
    let saveTimeout;
    const STORAGE_KEY = 'atermacao-rascunho';

    function scheduleAutoSave() {
        if (!autoSaveEnabled) return;
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            try {
                const state = captureFormState();
                localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
            } catch (e) { console.warn('Auto-save falhou:', e); }
        }, 500);
    }

    function captureFormState() {
        const captureParties = (listEl, isAuthor) => Array.from(listEl.querySelectorAll('.party-item')).map(item => ({
            name: item.querySelector('.party-name').value,
            maritalStatus: item.querySelector('.party-marital-status').value,
            profession: item.querySelector('.party-profession').value,
            dob: isAuthor ? (item.querySelector('.party-dob')?.value || '') : '',
            cpf: item.querySelector('.party-cpf').value,
            rg: item.querySelector('.party-rg').value,
            emitter: item.querySelector('.party-emitter').value,
            phone: item.querySelector('.party-phone').value,
            email: item.querySelector('.party-email').value,
            cep: item.querySelector('.party-cep').value,
            street: item.querySelector('.party-street').value,
            number: item.querySelector('.party-number').value,
            complement: item.querySelector('.party-complement').value,
            district: item.querySelector('.party-district').value,
            city: item.querySelector('.party-city').value,
            state: item.querySelector('.party-state').value,
            noCep: item.querySelector('.no-cep-check').checked,
            noAddress: item.querySelector('.no-address-check').checked,
            noAddressJustification: item.querySelector('.no-address-justification').value,
            excluded: isAuthor ? item.querySelector('.party-excluded').checked : false,
        }));

        return {
            autores: captureParties(autoresList, true),
            reus: captureParties(reusList, false),
            actionTypes: Array.from(actionTypeOptions.querySelectorAll('.action-type-checkbox:checked')).map(cb => cb.value),
            actionTypeOther: actionTypeOtherInput.value,
            actionValue: document.getElementById('action-value').value,
            comarca: document.getElementById('comarca-input').value,
            tutela: tutelaCheck.checked,
            tutelaJustificativa: document.getElementById('tutela-justificativa').value,
            sigilo: sigiloCheck.checked,
            sigiloJustificativa: document.getElementById('sigilo-justificativa').value,
            audiencia: document.querySelector('input[name="audiencia"]:checked')?.value || null,
            audienciaJustificativa: document.getElementById('audiencia-justificativa').value,
            fatos: document.getElementById('fatos-content').value,
            pedido: document.getElementById('pedido-content').value,
            documents: Array.from(documentList.querySelectorAll('.document-item')).map(item => ({
                type: item.querySelector('.document-type').value,
                otherType: item.querySelector('.document-other-type').value,
            })),
            witnesses: Array.from(witnessList.querySelectorAll('.witness-item')).map(item => ({
                name: item.querySelector('.witness-name').value,
                address: item.querySelector('.witness-address').value,
                phone: item.querySelector('.witness-phone').value,
            })),
            savedAt: Date.now(),
        };
    }

    function restoreFormState(state) {
        autoresList.innerHTML = '';
        reusList.innerHTML = '';
        documentList.innerHTML = '';
        witnessList.innerHTML = '';
        atermacaoForm.reset();

        // Restaurar autores
        (state.autores || []).forEach((d) => {
            addParty(autoresList, true);
            const el = autoresList.lastElementChild;
            el.querySelector('.party-name').value = d.name || '';
            el.querySelector('.party-marital-status').value = d.maritalStatus || '';
            el.querySelector('.party-profession').value = d.profession || '';
            if (el.querySelector('.party-dob')) el.querySelector('.party-dob').value = d.dob || '';
            el.querySelector('.party-cpf').value = d.cpf || '';
            el.querySelector('.party-rg').value = d.rg || '';
            el.querySelector('.party-emitter').value = d.emitter || '';
            el.querySelector('.party-phone').value = d.phone || '';
            el.querySelector('.party-email').value = d.email || '';
            if (d.noCep) {
                el.querySelector('.no-cep-check').checked = true;
                el.querySelector('.no-cep-check').dispatchEvent(new Event('change'));
            }
            el.querySelector('.party-cep').value = d.cep || '';
            el.querySelector('.party-street').value = d.street || '';
            el.querySelector('.party-number').value = d.number || '';
            el.querySelector('.party-complement').value = d.complement || '';
            el.querySelector('.party-district').value = d.district || '';
            el.querySelector('.party-city').value = d.city || '';
            el.querySelector('.party-state').value = d.state || '';
            if (d.excluded) el.querySelector('.party-excluded').checked = true;
        });
        if (!state.autores || state.autores.length === 0) addParty(autoresList, true);

        // Restaurar réus
        (state.reus || []).forEach((d) => {
            addParty(reusList, false);
            const el = reusList.lastElementChild;
            el.querySelector('.party-name').value = d.name || '';
            el.querySelector('.party-marital-status').value = d.maritalStatus || '';
            el.querySelector('.party-profession').value = d.profession || '';
            el.querySelector('.party-cpf').value = d.cpf || '';
            el.querySelector('.party-rg').value = d.rg || '';
            el.querySelector('.party-emitter').value = d.emitter || '';
            el.querySelector('.party-phone').value = d.phone || '';
            el.querySelector('.party-email').value = d.email || '';
            if (d.noAddress) {
                el.querySelector('.no-address-check').checked = true;
                el.querySelector('.no-address-check').dispatchEvent(new Event('change'));
                el.querySelector('.no-address-justification').value = d.noAddressJustification || '';
            } else if (d.noCep) {
                el.querySelector('.no-cep-check').checked = true;
                el.querySelector('.no-cep-check').dispatchEvent(new Event('change'));
            }
            el.querySelector('.party-cep').value = d.cep || '';
            el.querySelector('.party-street').value = d.street || '';
            el.querySelector('.party-number').value = d.number || '';
            el.querySelector('.party-complement').value = d.complement || '';
            el.querySelector('.party-district').value = d.district || '';
            el.querySelector('.party-city').value = d.city || '';
            el.querySelector('.party-state').value = d.state || '';
        });
        if (!state.reus || state.reus.length === 0) addParty(reusList, false);

        // Restaurar tipo de ação
        actionTypeOptions.querySelectorAll('.action-type-checkbox').forEach(cb => {
            cb.checked = (state.actionTypes || []).includes(cb.value);
        });
        updateActionTypeDisplay();
        updateTemplateBanner();
        actionTypeOtherInput.value = state.actionTypeOther || '';

        // Restaurar campos
        document.getElementById('action-value').value = state.actionValue || '';
        document.getElementById('comarca-input').value = state.comarca || 'Marília/SP';
        tutelaCheck.checked = state.tutela || false;
        tutelaJustificativaContainer.classList.toggle('hidden', !state.tutela);
        document.getElementById('tutela-justificativa').value = state.tutelaJustificativa || '';
        sigiloCheck.checked = state.sigilo || false;
        sigiloJustificativaContainer.classList.toggle('hidden', !state.sigilo);
        document.getElementById('sigilo-justificativa').value = state.sigiloJustificativa || '';
        if (state.audiencia) {
            const radio = document.querySelector(`input[name="audiencia"][value="${state.audiencia}"]`);
            if (radio) radio.checked = true;
            audienciaJustificativaContainer.classList.toggle('hidden', state.audiencia !== 'nao');
        }
        document.getElementById('audiencia-justificativa').value = state.audienciaJustificativa || '';
        document.getElementById('fatos-content').value = state.fatos || '';
        document.getElementById('pedido-content').value = state.pedido || '';

        // Restaurar documentos
        (state.documents || []).forEach(doc => {
            addDocument();
            const lastDoc = documentList.lastElementChild;
            lastDoc.querySelector('.document-type').value = doc.type;
            if (doc.type === 'Outro') {
                lastDoc.querySelector('.document-other-type').classList.remove('hidden');
                lastDoc.querySelector('.document-other-type').value = doc.otherType || '';
            }
        });

        // Restaurar testemunhas
        (state.witnesses || []).forEach(wit => {
            addWitness();
            const lastWit = witnessList.lastElementChild;
            lastWit.querySelector('.witness-name').value = wit.name || '';
            lastWit.querySelector('.witness-address').value = wit.address || '';
            lastWit.querySelector('.witness-phone').value = wit.phone || '';
        });

        updateRemoveButtons();
    }

    // --- EVENT LISTENERS ---
    disclaimerChecks.forEach(c => c.addEventListener('change', checkDisclaimer));

    // --- MODAL ASSINATURA ELETRÔNICA ---
    const signingGuideModal = document.getElementById('signing-guide-modal');
    const openSigningGuideBtn = document.getElementById('open-signing-guide-btn');
    const closeSigningGuideBtn = document.getElementById('close-signing-guide-btn');
    const closeSigningGuideBtn2 = document.getElementById('close-signing-guide-btn-2');
    if (openSigningGuideBtn) openSigningGuideBtn.addEventListener('click', () => signingGuideModal.classList.remove('hidden'));
    if (closeSigningGuideBtn) closeSigningGuideBtn.addEventListener('click', () => signingGuideModal.classList.add('hidden'));
    if (closeSigningGuideBtn2) closeSigningGuideBtn2.addEventListener('click', () => signingGuideModal.classList.add('hidden'));
    if (signingGuideModal) signingGuideModal.addEventListener('click', (e) => { if (e.target === signingGuideModal) signingGuideModal.classList.add('hidden'); });

    addAutorBtn.addEventListener('click', () => { addParty(autoresList, true); scheduleAutoSave(); });
    addReuBtn.addEventListener('click', () => { addParty(reusList, false); scheduleAutoSave(); });
    addWitnessBtn.addEventListener('click', () => { addWitness(); scheduleAutoSave(); });
    addDocumentBtn.addEventListener('click', () => { addDocument(); scheduleAutoSave(); });

    document.getElementById('action-value').addEventListener('blur', formatValueOnBlur);

    document.getElementById('atermacao-app-container').addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-party-btn')) {
            e.target.closest('.party-item').remove();
            updateRemoveButtons();
            scheduleAutoSave();
        }
    });

    tutelaCheck.addEventListener('change', () => { tutelaJustificativaContainer.classList.toggle('hidden', !tutelaCheck.checked); scheduleAutoSave(); });
    sigiloCheck.addEventListener('change', () => { sigiloJustificativaContainer.classList.toggle('hidden', !sigiloCheck.checked); scheduleAutoSave(); });
    audienciaRadios.forEach(radio => radio.addEventListener('change', () => { audienciaJustificativaContainer.classList.toggle('hidden', radio.value !== 'nao'); scheduleAutoSave(); }));

    // Auto-save em campos de texto
    ['fatos-content', 'pedido-content', 'action-value', 'tutela-justificativa', 'sigilo-justificativa', 'audiencia-justificativa', 'action-type-other', 'comarca-input'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', () => scheduleAutoSave());
    });

    clearFormBtn.addEventListener('click', () => {
        if (confirm("Tem certeza que deseja limpar todos os campos?")) {
            atermacaoForm.reset();
            autoresList.innerHTML = ''; reusList.innerHTML = ''; documentList.innerHTML = ''; witnessList.innerHTML = '';
            addParty(autoresList, true); addParty(reusList, false);
            actionTypeOtherInput.classList.add('hidden');
            tutelaJustificativaContainer.classList.add('hidden');
            sigiloJustificativaContainer.classList.add('hidden');
            audienciaJustificativaContainer.classList.add('hidden');
            actionTypeOptions.querySelectorAll('.action-type-checkbox').forEach(cb => cb.checked = false);
            updateActionTypeDisplay();
            updateTemplateBanner();
            document.getElementById('comarca-input').value = 'Marília/SP';
            document.getElementById('template-banner').classList.add('hidden');
            localStorage.removeItem(STORAGE_KEY);
            clearAllErrors();
        }
    });

    // --- PREENCHER PARA TESTE ---
    const testFillBtn = document.getElementById('test-fill-btn');
    function fillWithTestData() {
        // Limpar tudo primeiro
        autoresList.innerHTML = ''; reusList.innerHTML = ''; documentList.innerHTML = ''; witnessList.innerHTML = '';
        actionTypeOptions.querySelectorAll('.action-type-checkbox').forEach(cb => cb.checked = false);

        // Autor
        addParty(autoresList, true);
        const autor = autoresList.querySelector('.party-item');
        autor.querySelector('.party-name').value = 'Maria da Silva Santos';
        autor.querySelector('.party-marital-status').value = 'solteiro(a)';
        autor.querySelector('.party-profession').value = 'Professora';
        autor.querySelector('.party-dob').value = '15/03/1990';
        autor.querySelector('.party-cpf').value = '529.982.247-25';
        autor.querySelector('.party-rg').value = '12.345.678-9';
        autor.querySelector('.party-emitter').value = 'SSP/SP';
        autor.querySelector('.party-phone').value = '(14) 99876-5432';
        autor.querySelector('.party-email').value = 'maria.silva@email.com';
        autor.querySelector('.party-cep').value = '17501-050';
        autor.querySelector('.party-street').value = 'Rua Gonçalves Dias';
        autor.querySelector('.party-number').value = '250';
        autor.querySelector('.party-complement').value = 'Apto 12';
        autor.querySelector('.party-district').value = 'Centro';
        autor.querySelector('.party-city').value = 'Marília';
        autor.querySelector('.party-state').value = 'SP';

        // Réu
        addParty(reusList, false);
        const reu = reusList.querySelector('.party-item');
        reu.querySelector('.party-name').value = 'Empresa Telefonia XYZ Ltda';
        reu.querySelector('.party-cpf').value = '12.345.678/0001-95';
        reu.querySelector('.party-cep').value = '01310-100';
        reu.querySelector('.party-street').value = 'Avenida Paulista';
        reu.querySelector('.party-number').value = '1000';
        reu.querySelector('.party-complement').value = '10º andar';
        reu.querySelector('.party-district').value = 'Bela Vista';
        reu.querySelector('.party-city').value = 'São Paulo';
        reu.querySelector('.party-state').value = 'SP';

        // Tipo de ação
        const checkbox = actionTypeOptions.querySelector('.action-type-checkbox[value="Inexigibilidade de Débito"]');
        if (checkbox) checkbox.checked = true;
        updateActionTypeDisplay();
        updateTemplateBanner();

        // Valor
        document.getElementById('action-value').value = '15.000,00';

        // Comarca
        document.getElementById('comarca-input').value = 'Marília/SP';

        // Fatos
        document.getElementById('fatos-content').value = 'Em janeiro de 2026, a requerente tomou conhecimento de que a empresa ré inscreveu indevidamente seu nome nos órgãos de proteção ao crédito (SPC/Serasa), por suposto débito no valor de R$ 350,00, referente a uma linha telefônica que jamais contratou.\n\nA requerente nunca manteve qualquer relação contratual com a empresa requerida, tratando-se possivelmente de fraude praticada por terceiros.\n\nA negativação indevida causou à requerente diversos transtornos, como impossibilidade de obter crédito e constrangimento ao realizar compras no comércio.\n\nA requerente tentou resolver a situação administrativamente, entrando em contato com o SAC da empresa em 10/01/2026 (protocolo nº 2026012345), porém não obteve solução.';

        // Pedidos
        document.getElementById('pedido-content').value = 'b) A declaração de inexigibilidade do débito no valor de R$ 350,00, referente à linha telefônica nunca contratada;\n\nc) A condenação da parte requerida a proceder à exclusão definitiva do nome da requerente dos cadastros de inadimplentes (SPC, Serasa e semelhantes), no prazo de 5 (cinco) dias, sob pena de multa diária de R$ 200,00;\n\nd) A condenação da parte requerida ao pagamento de indenização por danos morais no valor de R$ 15.000,00, em decorrência da inscrição indevida e dos transtornos causados;\n\ne) A condenação da parte requerida a abster-se de realizar novas cobranças referentes ao débito ora declarado inexigível, sob pena de multa.';

        // Audiência
        const radioSim = document.querySelector('input[name="audiencia"][value="sim"]');
        if (radioSim) radioSim.checked = true;

        // Documentos
        addDocument();
        const doc1 = documentList.querySelector('.document-item:last-child');
        doc1.querySelector('.document-type').value = 'RG/CPF';

        addDocument();
        const doc2 = documentList.querySelector('.document-item:last-child');
        doc2.querySelector('.document-type').value = 'Comprovante de Residência';

        addDocument();
        const doc3 = documentList.querySelector('.document-item:last-child');
        doc3.querySelector('.document-type').value = 'Foto/Print';

        // Testemunha
        addWitness();
        const wit = witnessList.querySelector('.witness-item');
        wit.querySelector('.witness-name').value = 'João Carlos Pereira';
        wit.querySelector('.witness-address').value = 'Rua XV de Novembro, 300, Centro, Marília/SP';
        wit.querySelector('.witness-phone').value = '(14) 99765-4321';

        updateRemoveButtons();
        showToast('Formulário preenchido com dados de teste!');
    }

    if (testFillBtn) testFillBtn.addEventListener('click', fillWithTestData);

    previewBtn.addEventListener('click', showPreview);
    generatePdfBtn.addEventListener('click', generatePDF);
    copyTextBtn.addEventListener('click', copyText);
    generateDocxBtn.addEventListener('click', generateDOCX);
    closePreviewBtn.addEventListener('click', () => previewModal.classList.add('hidden'));
    previewModal.addEventListener('click', (e) => { if (e.target === previewModal) previewModal.classList.add('hidden'); });

    // --- INICIALIZAÇÃO ---
    // Verificar rascunho salvo
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState) {
        try {
            const state = JSON.parse(savedState);
            const savedDate = state.savedAt ? new Date(state.savedAt).toLocaleString('pt-BR') : '';
            const banner = document.getElementById('autosave-banner');
            if (banner) {
                banner.querySelector('.autosave-date').textContent = savedDate ? ` (salvo em ${savedDate})` : '';
                banner.classList.remove('hidden');
                document.getElementById('autosave-restore-btn').addEventListener('click', () => {
                    restoreFormState(state);
                    banner.classList.add('hidden');
                    autoSaveEnabled = true;
                    showToast('Rascunho restaurado com sucesso!');
                });
                document.getElementById('autosave-discard-btn').addEventListener('click', () => {
                    localStorage.removeItem(STORAGE_KEY);
                    banner.classList.add('hidden');
                    addParty(autoresList, true);
                    addParty(reusList, false);
                    updateRemoveButtons();
                    autoSaveEnabled = true;
                });
            } else {
                addParty(autoresList, true);
                addParty(reusList, false);
                updateRemoveButtons();
                autoSaveEnabled = true;
            }
        } catch (e) {
            console.warn('Erro ao ler rascunho:', e);
            localStorage.removeItem(STORAGE_KEY);
            addParty(autoresList, true);
            addParty(reusList, false);
            updateRemoveButtons();
            autoSaveEnabled = true;
        }
    } else {
        addParty(autoresList, true);
        addParty(reusList, false);
        updateRemoveButtons();
        autoSaveEnabled = true;
    }

    // --- WIZARD / MODO DE PREENCHIMENTO ---
    const TOTAL_WIZARD_STEPS = 4;
    let currentWizardStep = 1;
    let isWizardMode = true;

    const modeGuidedBtn = document.getElementById('mode-guided-btn');
    const modeFullBtn = document.getElementById('mode-full-btn');
    const wizardProgressEl = document.getElementById('wizard-progress');
    const wizardNavEl = document.getElementById('wizard-nav');
    const wizardPrevBtn = document.getElementById('wizard-prev-btn');
    const wizardNextBtn = document.getElementById('wizard-next-btn');
    const wizardProgressBar = document.getElementById('wizard-progress-bar');
    const formHrDivider = document.querySelector('#atermacao-form > hr');

    function setFormMode(wizard) {
        isWizardMode = wizard;
        localStorage.setItem('atermacao-mode', wizard ? 'wizard' : 'full');

        modeGuidedBtn.className = wizard
            ? 'mode-btn-active px-4 py-2 rounded-md text-sm font-medium transition-all duration-200'
            : 'mode-btn-inactive px-4 py-2 rounded-md text-sm font-medium transition-all duration-200';
        modeFullBtn.className = !wizard
            ? 'mode-btn-active px-4 py-2 rounded-md text-sm font-medium transition-all duration-200'
            : 'mode-btn-inactive px-4 py-2 rounded-md text-sm font-medium transition-all duration-200';

        if (wizard) {
            wizardProgressEl.classList.remove('hidden');
            if (formHrDivider) formHrDivider.style.display = 'none';
            goToWizardStep(currentWizardStep);
        } else {
            wizardProgressEl.classList.add('hidden');
            wizardNavEl.classList.add('hidden');
            if (formHrDivider) formHrDivider.style.display = '';
            document.querySelectorAll('[data-wizard-step]').forEach(el => el.classList.remove('wizard-hidden'));
            const inlineBack = document.getElementById('wizard-back-inline');
            if (inlineBack) inlineBack.style.display = 'none';
        }
    }

    function goToWizardStep(step) {
        if (step < 1 || step > TOTAL_WIZARD_STEPS) return;
        currentWizardStep = step;

        document.querySelectorAll('[data-wizard-step]').forEach(el => {
            const s = parseInt(el.dataset.wizardStep);
            if (s === step) {
                el.classList.remove('wizard-hidden');
                el.classList.add('wizard-step-enter');
                setTimeout(() => el.classList.remove('wizard-step-enter'), 350);
            } else {
                el.classList.add('wizard-hidden');
            }
        });

        // Progress bar
        wizardProgressBar.style.width = ((step - 1) / (TOTAL_WIZARD_STEPS - 1) * 100) + '%';

        // Step indicators
        document.querySelectorAll('.wizard-step-indicator').forEach(ind => {
            const s = parseInt(ind.dataset.forStep);
            const circle = ind.querySelector('.step-circle');
            ind.classList.remove('active', 'completed');
            if (s === step) {
                ind.classList.add('active');
                circle.textContent = s;
            } else if (s < step) {
                ind.classList.add('completed');
                circle.innerHTML = '✓';
            } else {
                circle.textContent = s;
            }
        });

        // Navigation buttons
        if (step === TOTAL_WIZARD_STEPS) {
            wizardNavEl.classList.add('hidden');
            let backBtn = document.getElementById('wizard-back-inline');
            if (!backBtn) {
                backBtn = document.createElement('button');
                backBtn.id = 'wizard-back-inline';
                backBtn.type = 'button';
                backBtn.className = 'bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-lg shadow';
                backBtn.textContent = '← Anterior';
                backBtn.addEventListener('click', () => goToWizardStep(currentWizardStep - 1));
            }
            document.getElementById('action-buttons-container').prepend(backBtn);
            backBtn.style.display = '';
        } else {
            wizardNavEl.classList.remove('hidden');
            wizardPrevBtn.classList.toggle('hidden', step === 1);
            wizardNextBtn.textContent = 'Próximo →';
            const inlineBack = document.getElementById('wizard-back-inline');
            if (inlineBack) inlineBack.style.display = 'none';
        }

        // Scroll to top
        const mainEl = document.querySelector('#main-form-container main');
        if (mainEl) mainEl.scrollTop = 0;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    if (modeGuidedBtn) modeGuidedBtn.addEventListener('click', () => setFormMode(true));
    if (modeFullBtn) modeFullBtn.addEventListener('click', () => setFormMode(false));
    if (wizardPrevBtn) wizardPrevBtn.addEventListener('click', () => goToWizardStep(currentWizardStep - 1));
    if (wizardNextBtn) wizardNextBtn.addEventListener('click', () => goToWizardStep(currentWizardStep + 1));

    // Clickable step indicators
    document.querySelectorAll('.wizard-step-indicator').forEach(ind => {
        ind.addEventListener('click', () => {
            if (isWizardMode) goToWizardStep(parseInt(ind.dataset.forStep));
        });
    });

    // Reset wizard on clear
    clearFormBtn.addEventListener('click', () => {
        setTimeout(() => {
            if (isWizardMode && !document.getElementById('fatos-content').value) goToWizardStep(1);
        }, 50);
    });

    // Initialize mode from saved preference
    const savedFormMode = localStorage.getItem('atermacao-mode');
    setFormMode(savedFormMode !== 'full');
});
