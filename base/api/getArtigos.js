/*
 * /api/getArtigos
 * Busca os artigos com paginação.
 * Protegido por Token.
 */
import { db, auth } from './firebaseAdmin.js';

// --- FUNÇÃO HELPER PARA CORRIGIR DATAS (TIMESTAMPS) ---
// Converte os Timestamps do Firebase (que não são JSON) para um formato serializável
const convertTimestamps = (obj) => {
    if (obj && typeof obj === 'object' && obj.toDate) { // Verifica se é um Timestamp
        return {
            seconds: obj.seconds,
            nanoseconds: obj.nanoseconds
        };
    }
    if (Array.isArray(obj)) {
        return obj.map(convertTimestamps);
    }
    if (typeof obj === 'object' && obj !== null) {
        const newObj = {};
        for (const key in obj) {
            newObj[key] = convertTimestamps(obj[key]);
        }
        return newObj;
    }
    return obj;
};
// --- FIM DA FUNÇÃO HELPER ---

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

        const snapshot = await db.collection('artigos')
            .orderBy('publishedAt', 'desc')
            .limit(limit)
            .get();

        if (snapshot.empty) {
            return res.status(200).json([]);
        }

        const articles = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            // Remove o 'content' para não enviar dados desnecessários
            const { content, ...articleSummary } = data;

            // **CORREÇÃO:** Converte os Timestamps (como 'publishedAt')
            const serializableData = convertTimestamps(articleSummary);

            articles.push({ id: doc.id, ...serializableData });
        });

        // 3. Retornar Dados
        return res.status(200).json(articles);

    } catch (error) {
        console.error('Erro em /api/getArtigos:', error);
        // Trata o erro de índice (comum nessa migração)
        if (error.code === 5 || (error.details && error.details.includes('index'))) { // 5 = FAILED_PRECONDITION
            return res.status(500).json({
                error: 'Erro no servidor: O índice do Firestore provavelmente está sendo criado. Tente novamente em alguns minutos.'
            });
        }
        return res.status(500).json({ error: 'Erro interno do servidor ao buscar artigos.' });
    }
}

