# Melhorias — Gerador de Atermação (`/ajuizamento`)

> Plano de implementação completo. Cada seção contém o **o quê**, **por quê** e **como**.

---

## Índice

- [1. Correção de Bugs](#1-correção-de-bugs)
- [2. Auto-save no localStorage](#2-auto-save-no-localstorage)
- [3. Comarca Dinâmica](#3-comarca-dinâmica)
- [4. Validação de CPF/CNPJ real](#4-validação-de-cpfcnpj-real)
- [5. Feedback visual na validação](#5-feedback-visual-na-validação)
- [6. Templates por Tipo de Ação](#6-templates-por-tipo-de-ação)
- [7. Loading spinner no CEP](#7-loading-spinner-no-cep)
- [8. Remover html2canvas não utilizado](#8-remover-html2canvas-não-utilizado)
- [9. Botão voltar ao portal](#9-botão-voltar-ao-portal)
- [10. Botão Copiar Texto](#10-botão-copiar-texto)
- [11. Seção de Testemunhas](#11-seção-de-testemunhas)
- [12. Exportar DOCX](#12-exportar-docx)
- [13. Separar JS em arquivo próprio](#13-separar-js-em-arquivo-próprio)

---

## 1. Correção de Bugs

### 1.1 — Validação quebra com "Não sei o CEP"

**Problema:** Se o autor marca "Não sei o CEP" e preenche o endereço manualmente, a validação em `validateForm()` ainda exige que `.party-cep` tenha valor, bloqueando o envio.

**Correção:** Ajustar a validação para verificar se a checkbox `no-cep-check` está marcada antes de exigir CEP:

```js
// ANTES (linha ~990)
!autorEl.querySelector('.party-cep').value.trim()

// DEPOIS
(!autorEl.querySelector('.party-cep').value.trim() && !autorEl.querySelector('.no-cep-check').checked)
```

### 1.2 — Comarca hardcoded "Marília/SP" no cabeçalho do PDF

**Problema:** O cabeçalho do PDF diz sempre `COMARCA DE MARÍLIA/SP`, mas o `locationStr` usa a cidade do autor. Inconsistente se o autor for de outra cidade.

**Correção:** ver item [3. Comarca Dinâmica](#3-comarca-dinâmica).

---

## 2. Auto-save no localStorage

**Por quê:** Um F5 acidental, queda de conexão ou bateria morta = perda total do formulário. Isso é frustrante demais para o cidadão que gastou 20 minutos preenchendo.

**Como:**
- A cada alteração em qualquer campo, salvar `getFormData()` serializado em `localStorage.setItem('atermacao-rascunho', JSON.stringify(data))` com debounce de 500ms.
- No `DOMContentLoaded`, verificar se existe rascunho. Se sim, mostrar um banner:
  > "Encontramos um rascunho salvo. Deseja restaurar?" [Restaurar] [Descartar]
- No botão "Limpar Tudo", também limpar o `localStorage`.
- Salvar também os estados dos checkboxes (tutela, sigilo, audiência, exclusão digital, no-cep, no-address).

---

## 3. Comarca Dinâmica

**Como:**
- Adicionar um campo `<select>` ou `<input>` de Comarca na seção "Dados da Ação".
- Valor padrão: `Marília/SP`.
- Auto-preencher com base na cidade/UF do primeiro autor (se preenchida via CEP).
- Usar esse valor no cabeçalho do PDF: `COMARCA DE ${comarca}`.

---

## 4. Validação de CPF/CNPJ real

**Como:** Implementar a validação algorítmica dos dígitos verificadores:

```js
function validarCPF(cpf) {
    cpf = cpf.replace(/\D/g, '');
    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
    let soma = 0, resto;
    for (let i = 1; i <= 9; i++) soma += parseInt(cpf[i - 1]) * (11 - i);
    resto = (soma * 10) % 11;
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
    const pesos1 = [5,4,3,2,9,8,7,6,5,4,3,2];
    const pesos2 = [6,5,4,3,2,9,8,7,6,5,4,3,2];
    let soma = pesos1.reduce((acc, p, i) => acc + parseInt(cnpj[i]) * p, 0);
    let resto = soma % 11;
    if ((resto < 2 ? 0 : 11 - resto) !== parseInt(cnpj[12])) return false;
    soma = pesos2.reduce((acc, p, i) => acc + parseInt(cnpj[i]) * p, 0);
    resto = soma % 11;
    return (resto < 2 ? 0 : 11 - resto) === parseInt(cnpj[13]);
}
```

- No `blur` do campo CPF/CNPJ, validar e aplicar borda verde (válido) ou vermelha (inválido).
- Bloquear geração de PDF se CPF do autor for inválido.

---

## 5. Feedback visual na validação

**Substituir `alert()` por:**
- Borda vermelha + ícone ⚠️ nos campos com problema.
- Mensagem de erro abaixo do campo: `<span class="text-red-500 text-xs">Campo obrigatório</span>`.
- Scroll suave até o primeiro campo com erro.
- Ao corrigir, remover o destaque automaticamente (`input` event listener).

---

## 6. Templates por Tipo de Ação

### Conceito

Quando o usuário seleciona um tipo de ação no dropdown, exibir um botão/banner:

> 💡 **Modelo disponível!** Temos um modelo pré-preenchido para este tipo de ação. [Usar modelo]
>
> ⚠️ *O modelo é apenas uma sugestão. Adapte livremente os fatos e pedidos à sua situação real.*

Ao clicar "Usar modelo", preencher os campos **Fatos** e **Pedidos** com o template correspondente. Se já houver texto nesses campos, perguntar:

> "Os campos Fatos e Pedidos já possuem texto. Deseja substituir pelo modelo?" [Substituir] [Cancelar]

### Templates

---

#### 6.1 — Indenização por Danos Morais

**Fatos:**
```
Em [DATA], o(a) requerente [DESCREVA O EVENTO QUE CAUSOU O DANO — ex: teve seu nome indevidamente inscrito nos órgãos de proteção ao crédito / foi vítima de atendimento humilhante / sofreu constrangimento público].

O(A) requerente jamais manteve qualquer relação contratual que justificasse tal situação [OU: a relação contratual já estava regularizada desde DATA].

A conduta da parte requerida causou ao(à) requerente profundo abalo emocional, constrangimento, angústia e sofrimento, pois [DESCREVA OS IMPACTOS — ex: ficou impossibilitado(a) de obter crédito / teve que passar por situação vexatória perante terceiros / perdeu noites de sono].

O(A) requerente tentou resolver a situação administrativamente [DESCREVA AS TENTATIVAS — ex: compareceu à loja / ligou para o SAC no dia DATA, protocolo nº XXXX / enviou e-mail], porém não obteve êxito, restando-lhe apenas a via judicial.
```

**Pedidos:**
```
b) A condenação da parte requerida ao pagamento de indenização por danos morais, no valor de R$ [VALOR], em razão do(s) [DESCREVA BREVEMENTE — ex: constrangimento e abalo moral sofridos pela inscrição indevida];

c) A condenação da parte requerida ao pagamento de custas processuais e honorários advocatícios, caso aplicável.
```

---

#### 6.2 — Indenização por Danos Materiais

**Fatos:**
```
Em [DATA], o(a) requerente [DESCREVA O EVENTO — ex: adquiriu o produto/serviço X da parte requerida, pelo valor de R$ VALOR / teve seu veículo danificado no estacionamento do réu / sofreu prejuízo financeiro decorrente de falha no serviço prestado].

Ocorre que [DESCREVA O PROBLEMA — ex: o produto apresentou defeito após DIAS de uso / o serviço não foi prestado conforme contratado / o bem foi danificado por culpa exclusiva da parte requerida].

Em razão do ocorrido, o(a) requerente sofreu prejuízo material no valor de R$ [VALOR], correspondente a [DETALHE — ex: o valor pago pelo produto defeituoso / o custo do reparo do veículo, conforme orçamento anexo / a diferença entre o serviço contratado e o efetivamente prestado].

O(A) requerente tentou resolver a questão diretamente com a parte requerida [DESCREVA AS TENTATIVAS — ex: compareceu ao estabelecimento / entrou em contato pelo SAC, protocolo nº XXXX], mas não obteve solução satisfatória.
```

**Pedidos:**
```
b) A condenação da parte requerida ao ressarcimento dos danos materiais sofridos, no valor de R$ [VALOR], devidamente corrigido monetariamente e acrescido de juros legais desde a data do evento danoso;

c) Subsidiariamente, caso não seja possível o ressarcimento integral, a condenação da parte requerida a reparar o bem danificado, às suas expensas, no prazo de [PRAZO] dias.
```

---

#### 6.3 — Obrigação de Fazer / Não Fazer

**Fatos:**
```
O(A) requerente mantém relação [contratual/de consumo/de vizinhança] com a parte requerida desde [DATA/PERÍODO].

Ocorre que a parte requerida [DESCREVA A OBRIGAÇÃO DESCUMPRIDA — ex: comprometeu-se a realizar o serviço de reforma até DATA e não cumpriu / está realizando obras irregulares que causam danos ao imóvel do requerente / recusa-se a fornecer o documento/produto/serviço a que está obrigada / está praticando ato que deve cessar, como cobrança indevida, barulho excessivo, etc.].

O(A) requerente já notificou a parte requerida [DESCREVA — ex: por escrito em DATA / verbalmente em DATA / por meio de protocolo nº XXXX], solicitando que [cumprisse a obrigação / cessasse a conduta], porém sem sucesso.

A manutenção dessa situação causa [DESCREVA O PREJUÍZO — ex: danos ao imóvel / impossibilidade de uso do serviço / prejuízo financeiro contínuo / perturbação do sossego], tornando urgente a intervenção judicial.
```

**Pedidos:**
```
b) A condenação da parte requerida à obrigação de [FAZER: descreva a ação — ex: realizar o reparo no prazo de X dias / entregar o documento/produto / concluir o serviço contratado] [OU NÃO FAZER: descreva a abstenção — ex: cessar imediatamente as obras irregulares / abster-se de realizar cobranças indevidas / cessar a emissão de ruídos acima do permitido], sob pena de multa diária (astreintes) de R$ [VALOR] por dia de descumprimento;

c) A condenação da parte requerida ao pagamento de eventuais danos materiais e/ou morais decorrentes do descumprimento, a serem apurados.
```

---

#### 6.4 — Rescisão de Contrato c/c Devolução do Dinheiro

**Fatos:**
```
Em [DATA], o(a) requerente celebrou contrato com a parte requerida, tendo por objeto [DESCREVA — ex: a prestação de serviço de reforma residencial / a aquisição de curso online / a compra de produto X pela internet / a contratação de pacote de viagem], pelo valor total de R$ [VALOR].

O(A) requerente efetuou o pagamento de R$ [VALOR PAGO] [à vista / em X parcelas / via PIX/cartão/boleto], conforme comprovante(s) anexo(s).

Ocorre que a parte requerida [DESCREVA O INADIMPLEMENTO — ex: não entregou o produto no prazo estipulado / não iniciou a prestação do serviço / entregou produto totalmente diferente do anunciado / prestou serviço com qualidade muito inferior à contratada / cancelou unilateralmente o serviço sem justificativa].

O(A) requerente tentou resolver a questão administrativamente [DESCREVA — ex: solicitou o cancelamento e reembolso em DATA / entrou em contato pelo SAC (protocolo nº XXXX) / compareceu à loja], mas a parte requerida [DESCREVA — ex: recusou a devolução / não respondeu / ofereceu apenas crédito em loja, o que não foi aceito].

Diante da total inexecução [ou execução defeituosa] do contrato por parte da requerida, não resta alternativa senão buscar a rescisão contratual e a restituição dos valores pagos.
```

**Pedidos:**
```
b) A declaração de rescisão do contrato celebrado entre as partes, por culpa exclusiva da parte requerida;

c) A condenação da parte requerida à restituição integral dos valores pagos, no montante de R$ [VALOR], devidamente corrigido monetariamente e acrescido de juros legais desde a data de cada desembolso;

d) A condenação da parte requerida ao pagamento de indenização por danos morais no valor de R$ [VALOR], em razão dos transtornos causados [OPCIONAL — inclua apenas se houve real abalo moral].
```

---

#### 6.5 — Rescisão de Contrato (simples)

**Fatos:**
```
Em [DATA], o(a) requerente celebrou contrato com a parte requerida referente a [DESCREVA O OBJETO — ex: prestação de serviço / locação / assinatura / plano].

Ocorre que [DESCREVA O MOTIVO DA RESCISÃO — ex: o(a) requerente solicitou o cancelamento em DATA, conforme previsto contratualmente, porém a parte requerida se recusa a efetuar a rescisão / a parte requerida alterou unilateralmente as condições do contrato / a parte requerida descumpriu a cláusula X do contrato / o(a) requerente não possui mais interesse na continuidade do contrato, estando adimplente com todas as obrigações até o momento].

O(A) requerente já solicitou formalmente a rescisão [DESCREVA — ex: por e-mail em DATA / pelo SAC em DATA, protocolo nº XXXX / por carta registrada], mas a parte requerida [DESCREVA — ex: ignorou o pedido / exigiu o pagamento de multa abusiva no valor de R$ VALOR / continua efetuando cobranças].
```

**Pedidos:**
```
b) A declaração judicial de rescisão do contrato firmado entre as partes, sem ônus para o(a) requerente [OU: com a redução proporcional da multa rescisória, nos termos do art. 413 do Código Civil];

c) A condenação da parte requerida a cessar quaisquer cobranças relacionadas ao contrato rescindido, sob pena de multa;

d) A condenação da parte requerida à restituição de valores cobrados indevidamente após o pedido de cancelamento, se houver.
```

---

#### 6.6 — Inexigibilidade de Débito

**Fatos:**
```
O(A) requerente tomou conhecimento de que a parte requerida [DESCREVA — ex: inscreveu seu nome junto aos órgãos de proteção ao crédito (SPC/Serasa) / está efetuando cobranças por telefone, SMS e e-mail / ajuizou ação de execução], em razão de suposto débito no valor de R$ [VALOR], referente a [DESCREVA — ex: contrato nº XXXX / fatura do mês de XXXX / serviço que jamais foi contratado].

Ocorre que o referido débito é totalmente inexigível, pois [DESCREVA O MOTIVO — ex:
- o(a) requerente jamais contratou qualquer serviço ou produto com a parte requerida;
- o débito já foi integralmente quitado em DATA, conforme comprovante anexo;
- o contrato que originou a dívida já foi rescindido em DATA, estando todas as parcelas anteriores pagas;
- trata-se de fraude, pois terceiro utilizou os dados do(a) requerente indevidamente;
- o valor cobrado é superior ao efetivamente devido, havendo cobrança em duplicidade].

[SE HOUVE NEGATIVAÇÃO]: A inscrição indevida nos cadastros de inadimplentes causou ao(à) requerente sérios transtornos, como [DESCREVA — ex: impossibilidade de obter crédito / constrangimento / recusa de financiamento].

O(A) requerente tentou resolver administrativamente [DESCREVA TENTATIVAS], sem êxito.
```

**Pedidos:**
```
b) A declaração de inexigibilidade do débito no valor de R$ [VALOR], referente a [DESCREVA];

c) A condenação da parte requerida a proceder à exclusão definitiva do nome do(a) requerente dos cadastros de inadimplentes (SPC, Serasa e semelhantes), no prazo de 5 (cinco) dias, sob pena de multa diária;

d) A condenação da parte requerida ao pagamento de indenização por danos morais no valor de R$ [VALOR], em decorrência da inscrição indevida e dos transtornos causados;

e) A condenação da parte requerida a abster-se de realizar novas cobranças referentes ao débito ora declarado inexigível, sob pena de multa.
```

---

#### 6.7 — Ação de Cobrança

**Fatos:**
```
Em [DATA], o(a) requerente [DESCREVA A ORIGEM DO CRÉDITO — ex: prestou serviços de XXXX para a parte requerida / vendeu o produto X à parte requerida / emprestou a quantia de R$ VALOR à parte requerida], conforme [DOCUMENTO — ex: contrato anexo / nota fiscal / mensagens de WhatsApp / recibo].

Foi acordado entre as partes que o pagamento seria efetuado [DESCREVA AS CONDIÇÕES — ex: à vista até DATA / em X parcelas mensais de R$ VALOR, com vencimento todo dia XX / mediante a entrega do serviço].

Ocorre que a parte requerida [DESCREVA O INADIMPLEMENTO — ex: efetuou o pagamento de apenas X parcelas, restando em aberto o valor de R$ VALOR / não realizou qualquer pagamento até a presente data / emitiu cheque sem fundos no valor de R$ VALOR].

O(A) requerente cobrou a parte requerida por diversas vezes [DESCREVA — ex: pessoalmente / por WhatsApp / por e-mail / por notificação extrajudicial em DATA], porém a parte requerida [DESCREVA — ex: comprometeu-se a pagar e não cumpriu / não respondeu às tentativas de contato / recusou-se expressamente a pagar].

O valor total devido atualizado é de R$ [VALOR].
```

**Pedidos:**
```
b) A condenação da parte requerida ao pagamento do valor de R$ [VALOR], devidamente corrigido monetariamente pelo índice XXXX e acrescido de juros de mora de 1% ao mês (ou conforme pactuado), contados desde a data do vencimento de cada parcela até o efetivo pagamento;

c) A condenação da parte requerida ao pagamento de custas processuais e honorários, se aplicável.
```

---

#### 6.8 — Defesa do Consumidor (Inscrição Indevida em Cadastro de Inadimplentes)

**Fatos:**
```
O(A) requerente descobriu, em [DATA], que seu nome foi inscrito nos cadastros de inadimplentes (SPC/Serasa) pela parte requerida, em razão de suposto débito no valor de R$ [VALOR].

Ocorre que tal inscrição é totalmente indevida, pois [ESCOLHA O QUE SE APLICA]:
- O(A) requerente jamais contratou qualquer produto ou serviço com a parte requerida, tratando-se possivelmente de fraude praticada por terceiros;
- O(A) requerente já havia quitado integralmente o débito em DATA, conforme comprovante anexo;
- O contrato que originou a cobrança foi regularmente cancelado/rescindido em DATA;
- O valor cobrado está incorreto, havendo cobrança em duplicidade/valor superior ao devido;
- O(A) requerente sequer foi notificado(a) previamente sobre o débito, como exige o Código de Defesa do Consumidor.

A negativação indevida causou ao(à) requerente diversos prejuízos, dentre os quais: [DESCREVA — ex: impossibilidade de obter crédito / recusa de financiamento imobiliário / constrangimento em compra no comércio / abalo emocional].

O(A) requerente entrou em contato com a parte requerida diversas vezes [DESCREVA — ex: ligou para o SAC no dia DATA, protocolo nº XXXX / compareceu à loja / enviou e-mail], porém não conseguiu a regularização.
```

**Pedidos:**
```
b) A declaração de inexistência do débito no valor de R$ [VALOR] cobrado pela parte requerida;

c) A condenação da parte requerida a proceder à imediata exclusão do nome do(a) requerente dos cadastros de proteção ao crédito (SPC, Serasa e similares), no prazo de 5 (cinco) dias, sob pena de multa diária de R$ [VALOR] por dia de descumprimento;

d) A condenação da parte requerida ao pagamento de indenização por danos morais no valor de R$ [VALOR], pela inscrição indevida e todos os transtornos decorrentes;

e) A condenação da parte requerida a abster-se de realizar novas cobranças ou inscrições relativas ao débito declarado inexistente.
```

---

#### 6.9 — Defesa do Consumidor (Produto/Serviço Defeituoso)

**Fatos:**
```
Em [DATA], o(a) requerente adquiriu [o produto XXXX / contratou o serviço de XXXX] junto à parte requerida, pelo valor de R$ [VALOR], conforme [nota fiscal / comprovante de pagamento / contrato] anexo(s).

[PARA PRODUTO]: Ocorre que, após [PRAZO — ex: apenas X dias de uso / dentro do prazo de garantia], o produto apresentou [DESCREVA O DEFEITO — ex: parou de funcionar / apresentou superaquecimento / veio com peça quebrada / não corresponde ao anunciado (propaganda enganosa)].

[PARA SERVIÇO]: Ocorre que o serviço prestado pela parte requerida [DESCREVA — ex: não atendeu às especificações contratadas / foi executado de forma incompleta / causou danos ao bem do requerente / não foi concluído no prazo combinado].

O(A) requerente, no exercício de seus direitos como consumidor(a), imediatamente contatou a parte requerida [DESCREVA — ex: compareceu à loja em DATA / acionou o SAC em DATA, protocolo nº XXXX / enviou o produto para a assistência técnica].

Transcorreu o prazo legal de 30 dias (art. 18, §1º do CDC) sem que a parte requerida solucionasse o problema [OU: a parte requerida informou que o reparo/troca não seria realizado, alegando XXXX / a parte requerida realizou reparo, mas o defeito persistiu].
```

**Pedidos:**
```
b) A condenação da parte requerida, à escolha do(a) consumidor(a), conforme art. 18, §1º do CDC, a:
   - Substituir o produto por outro da mesma espécie, em perfeitas condições de uso; OU
   - Restituir imediatamente o valor pago de R$ [VALOR], devidamente atualizado, sem prejuízo de eventuais perdas e danos; OU
   - Conceder abatimento proporcional do preço;

[PARA SERVIÇO]:
b) A condenação da parte requerida, conforme art. 20 do CDC, a:
   - Reexecutar o serviço sem custo adicional e no prazo de [X] dias; OU
   - Restituir imediatamente o valor pago de R$ [VALOR]; OU
   - Conceder abatimento proporcional do preço;

c) A condenação da parte requerida ao pagamento de indenização por danos morais no valor de R$ [VALOR], pelos transtornos e tempo perdido [INCLUA SE APLICÁVEL];

d) A condenação da parte requerida ao pagamento de eventuais danos materiais decorrentes do defeito, no valor de R$ [VALOR] [INCLUA SE HOUVE PREJUÍZO FINANCEIRO ALÉM DO VALOR DO PRODUTO].
```

---

### Implementação técnica dos templates

```js
const TEMPLATES = {
    "Indenização por Danos Morais": {
        fatos: `Em [DATA], o(a) requerente ... [veja texto acima]`,
        pedidos: `b) A condenação da parte requerida ... [veja texto acima]`
    },
    // ... um objeto para cada tipo
};

// Ao mudar a seleção no dropdown:
actionTypeOptions.addEventListener('change', () => {
    updateActionTypeDisplay();
    const selected = Array.from(actionTypeOptions.querySelectorAll('.action-type-checkbox:checked'))
        .map(cb => cb.value);
    
    // Verifica se há template disponível para algum dos tipos selecionados
    const templateKey = selected.find(s => TEMPLATES[s]);
    const templateBanner = document.getElementById('template-banner');
    
    if (templateKey && selected.length === 1) {
        templateBanner.classList.remove('hidden');
        templateBanner.dataset.templateKey = templateKey;
    } else {
        templateBanner.classList.add('hidden');
    }
});

// Botão "Usar modelo"
document.getElementById('use-template-btn').addEventListener('click', () => {
    const key = document.getElementById('template-banner').dataset.templateKey;
    const template = TEMPLATES[key];
    const fatosField = document.getElementById('fatos-content');
    const pedidoField = document.getElementById('pedido-content');
    
    if ((fatosField.value.trim() || pedidoField.value.trim()) &&
        !confirm('Os campos Fatos e Pedidos já possuem texto. Deseja substituir pelo modelo?')) {
        return;
    }
    
    fatosField.value = template.fatos;
    pedidoField.value = template.pedidos;
});
```

**HTML do banner (adicionar abaixo do dropdown de tipo de ação):**

```html
<div id="template-banner" class="hidden mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
    <div class="flex items-start gap-2">
        <span class="text-blue-500 text-lg">💡</span>
        <div class="flex-1">
            <p class="text-sm font-medium text-blue-800">Modelo disponível!</p>
            <p class="text-xs text-blue-600 mt-1">
                Temos um modelo pré-preenchido para este tipo de ação. 
                <strong>O modelo é apenas uma sugestão</strong> — adapte livremente 
                os fatos e pedidos à sua situação real. Os trechos entre [COLCHETES] 
                devem ser substituídos pelas suas informações.
            </p>
            <button type="button" id="use-template-btn"
                class="mt-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg">
                Usar modelo
            </button>
        </div>
    </div>
</div>
```

---

## 7. Loading spinner no CEP

Ao digitar 8 dígitos no CEP, mostrar um spinner dentro do campo enquanto busca a API:

```js
// Trocar o conteúdo do campo ou adicionar um ícone ao lado
input.classList.add('animate-pulse', 'bg-yellow-50');
fetch(`https://viacep.com.br/ws/${cep}/json/`)
    .then(...)
    .finally(() => input.classList.remove('animate-pulse', 'bg-yellow-50'));
```

---

## 8. Remover html2canvas não utilizado

Remover a linha:
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
```

Economia de ~40KB no carregamento.

---

## 9. Botão voltar ao portal

Adicionar no header:

```html
<a href="/jec/" class="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4">
    ← Voltar ao Portal
</a>
```

---

## 10. Botão Copiar Texto

Adicionar um botão ao lado de "Gerar PDF":

```html
<button id="copy-text-btn" type="button"
    class="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg">
    📋 Copiar Texto
</button>
```

Na lógica, gerar o texto puro (sem HTML) e copiar com `navigator.clipboard.writeText()`.

---

## 11. Seção de Testemunhas

Adicionar seção opcional abaixo dos Documentos:

- Botão "+ Adicionar Testemunha"
- Campos: Nome completo, Endereço, Telefone
- No PDF, aparece como: "ROL DE TESTEMUNHAS: 1. Nome, residente em Endereço, Tel: XXXX"

---

## 12. Exportar DOCX

Usar a biblioteca `docx` (client-side, ~200KB):

```html
<script src="https://unpkg.com/docx@8.5.0/build/index.umd.js"></script>
```

Gerar o documento com a mesma estrutura do PDF, mas em formato editável `.docx`.

---

## 13. Separar JS em arquivo próprio

Extrair todo o `<script>` (linhas ~618–1234) para `ajuizamento/script.js`.

No HTML, substituir por:
```html
<script src="script.js"></script>
```

---

## Ordem de implementação sugerida

| Prioridade | Item | Esforço |
|------------|------|---------|
| 🔴 P0 | 1.1 Bug validação CEP | 5 min |
| 🔴 P0 | 8. Remover html2canvas | 1 min |
| 🟠 P1 | 9. Botão voltar | 5 min |
| 🟠 P1 | 2. Auto-save localStorage | 30 min |
| 🟠 P1 | 3. Comarca dinâmica | 15 min |
| 🟠 P1 | 6. Templates por tipo de ação | 45 min |
| 🟡 P2 | 4. Validação CPF/CNPJ | 20 min |
| 🟡 P2 | 5. Feedback visual | 30 min |
| 🟡 P2 | 7. Loading CEP | 10 min |
| 🟡 P2 | 10. Copiar texto | 15 min |
| 🟢 P3 | 11. Testemunhas | 20 min |
| 🟢 P3 | 13. Separar JS | 15 min |
| 🟢 P3 | 12. Exportar DOCX | 1h+ |

**Tempo total estimado: ~4 horas**
