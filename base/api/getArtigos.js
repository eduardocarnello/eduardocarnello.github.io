/*
 * /api/getArtigos
 * Busca os artigos com paginação.
 * Protegido por Token.
 * CORRIGIDO: Agora filtra por 'categoryId' se ela for fornecida.
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

        // 2. Buscar Dados (COM LÓGICA DE FILTRO DE CATEGORIA)
        const limit = parseInt(req.query.limit || 10, 10);
        const category = req.query.category; // Pega a categoria da URL

        let query = db.collection('artigos');

        // *** A CORREÇÃO ESTÁ AQUI ***
        // Adiciona o filtro de categoria, se não for "TODOS"
        if (category && category !== 'TODOS') {
            query = query.where('categoryId', '==', category);
        }
        // **************************

        // Aplica a ordenação e o limite
        query = query.orderBy('publishedAt', 'desc').limit(limit);

        const snapshot = await query.get();

        if (snapshot.empty) {
            return res.status(200).json([]);
        }

        const articles = [];
        snapshot.forEach(doc => {
            const { content, ...articleSummary } = doc.data();
            // Converte os timestamps aninhados
            const convertedData = convertTimestamps(articleSummary);
            articles.push({ id: doc.id, ...convertedData });
        });

        // 3. Retornar Dados
        return res.status(200).json(articles);

    } catch (error) {
        console.error('Erro em /api/getArtigos:', error);
        if (error.code === 5) { // FAILED_PRECONDITION (erro de índice)
            return res.status(500).json({
                error: 'Erro no servidor: O índice do Firestore provavelmente está sendo criado. Tente novamente em alguns minutos.'
            });
        }
        return res.status(500).json({ error: 'Erro interno do servidor ao buscar artigos.' });
    }
}

