/*
 * /api/getArtigos
 * Busca os artigos com paginação.
 * Protegido por Token.
 * CORRIGIDO: Removida a consulta de índice composto.
 * O filtro de categoria agora é feito no servidor (em JS).
 */
import { db, auth } from './firebaseAdmin.js';

// Converte Timestamps do Firebase para JSON
function convertTimestamps(data) {
    if (data && typeof data === 'object') {
        if (data.hasOwnProperty('_seconds') && data.hasOwnProperty('_nanoseconds')) {
            return { seconds: data._seconds, nanoseconds: data._nanoseconds };
        }
        for (const key in data) {
            data[key] = convertTimestamps(data[key]);
        }
    }
    return data;
}

export default async function handler(req, res) {
    try {
        // 1. Validar o Token do usuário
        const token = req.headers.authorization?.split('Bearer ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Nenhum token fornecido. Acesso não autorizado.' });
        }

        let decodedToken;
        try {
            decodedToken = await auth.verifyIdToken(token);
        } catch (error) {
            return res.status(401).json({ error: 'Token inválido ou expirado. Faça login novamente.' });
        }

        // 2. Buscar Dados
        const limit = parseInt(req.query.limit || 10, 10);
        const category = req.query.category; // Pega a categoria da URL

        // --- CORREÇÃO DO ERRO 500 ---
        // 1. Buscamos TODOS os artigos, ordenados por data.
        //    (Não filtramos por categoria no 'where' para evitar o índice composto)
        let query = db.collection('artigos').orderBy('publishedAt', 'desc');

        const snapshot = await query.get();

        if (snapshot.empty) {
            return res.status(200).json([]);
        }

        const articles = [];
        snapshot.forEach(doc => {
            const article = doc.data();

            // 2. Filtramos a categoria AQUI (no JavaScript), se necessário
            const categoryMatch = (!category || category === 'TODOS' || article.categoryId === category);

            if (categoryMatch) {
                const { content, ...articleSummary } = article;
                const convertedData = convertTimestamps(articleSummary);
                articles.push({ id: doc.id, ...convertedData });
            }
        });

        // 3. Aplicamos o limite DEPOIS de filtrar
        const limitedArticles = articles.slice(0, limit);
        // --- FIM DA CORREÇÃO ---


        // 4. Retornar Dados
        return res.status(200).json(limitedArticles); // Retorna os artigos com limite

    } catch (error) {
        console.error('Erro em /api/getArtigos:', error);
        // O erro de índice não deve mais acontecer, mas mantemos o 'catch'
        if (error.code === 5) {
            return res.status(500).json({
                error: 'Erro no servidor: O índice do Firestore provavelmente está sendo criado. Tente novamente em alguns minutos.'
            });
        }
        return res.status(500).json({ error: 'Erro interno do servidor ao buscar artigos.' });
    }
}

