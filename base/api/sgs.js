export default {
    async fetch(req) {
        const url = new URL(req.url);
        const serie = url.searchParams.get("serie");
        const de = url.searchParams.get("de");
        const ate = url.searchParams.get("ate");
        if (!serie || !de || !ate) return new Response("faltam params", { status: 400 });

        const upstream = await fetch(
            `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${serie}/dados?formato=json&dataInicial=${de}&dataFinal=${ate}`
        );
        if (!upstream.ok) return new Response("erro upstream", { status: upstream.status });
        const data = await upstream.text();
        return new Response(data, {
            status: 200,
            headers: {
                "content-type": "application/json",
                "access-control-allow-origin": "*"
            }
        });
    }
}