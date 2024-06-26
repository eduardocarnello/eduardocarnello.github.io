document.getElementById('finalDate').value = new Date().toISOString().split('T')[0];

async function fetchINPC(date) {
    const year = new Date(date).getFullYear();
    const month = ('0' + (new Date(date).getMonth() + 1)).slice(-2);
    const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.433/dados?formato=json&dataInicial=${year}${month}01&dataFinal=${year}${month}31`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.length > 0) {
        return parseFloat(data[0].valor);
    } else {
        throw new Error(`No INPC data available for ${date}`);
    }
}

function calculateInterest(initialAmount, startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    let months = (end.getFullYear() - start.getFullYear()) * 12;
    months -= start.getMonth();
    months += end.getMonth();
    const interestRate = 0.01;
    return initialAmount * Math.pow((1 + interestRate), months) - initialAmount;
}

async function calculateDebt() {
    const debtValue = parseFloat(document.getElementById('debtValue').value);
    const initialDate = document.getElementById('initialDate').value;
    const interestStartDate = document.getElementById('interestStartDate').value;
    const finalDate = document.getElementById('finalDate').value;

    try {
        const initialINPC = await fetchINPC(initialDate);
        const finalINPC = await fetchINPC(finalDate);
        const correction = debtValue * (finalINPC / initialINPC) - debtValue;
        const debtWithCorrection = debtValue + correction;
        const interest = calculateInterest(debtWithCorrection, interestStartDate, finalDate);
        const total = debtWithCorrection + interest;

        document.getElementById('result').innerHTML = `
            Valor Atualizado: R$ ${total.toFixed(2)}<br>
            Correção Monetária: R$ ${correction.toFixed(2)}<br>
            Juros: R$ ${interest.toFixed(2)}<br>
            Índice INPC Inicial: ${initialINPC.toFixed(2)}<br>
            Índice INPC Final: ${finalINPC.toFixed(2)}
        `;
    } catch (error) {
        document.getElementById('result').innerHTML = `Erro ao calcular a dívida: ${error.message}`;
    }
}
