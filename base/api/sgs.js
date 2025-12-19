export default async function handler(req, res) {
    const { method } = req;
    // Libere os domínios que você quer permitir
    const allowOrigin = '*'; // ou liste explicitamente
    res.setHeader('Access-Control-Allow-Origin', allowOrigin);
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { serie, de, ate } = req.query;
    if (!serie || !de || !ate) return res.status(400).json({ error: 'faltam params' });

    const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${serie}/dados?formato=json&dataInicial=${de}&dataFinal=${ate}`;
    const upstream = await fetch(url);
    if (!upstream.ok) return res.status(upstream.status).json({ error: 'BCB upstream' });
    const data = await upstream.json();

    return res.status(200).json(data);
}