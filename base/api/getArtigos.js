/*
 * /api/getArtigos
 * Busca os artigos com paginação.
 * Protegido por Token.
 */
import { db, auth } from './firebaseAdmin.js';

// Lista de e-mails de administradores
const ADMIN_EMAILS = ['eduardocarnello@gmail.com', 'mariliajec@tjsp.jus.br'];

export default async function handler(req, res) {
    try {
        // 1. Validar o Token do usuário
        const token = req.headers.authorization?.split('Bearer ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Nenhum token fornecido. Acesso não autorizado.' });
        }

        // Verifica se o token é válido
        // O Admin SDK (que bypassa regras) verifica a validade do token do *usuário*
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
            const { content, ...articleSummary } = doc.data();
            articles.push({ id: doc.id, ...articleSummary });
        });

        // 3. Retornar Dados
        return res.status(200).json(articles);

    } catch (error) {
        console.error('Erro em /api/getArtigos:', error);
        // Trata o erro de índice (comum nessa migração)
        if (error.code === 5) { // 5 = FAILED_PRECONDITION (normalmente erro de índice)
            return res.status(500).json({
                error: 'Erro no servidor: O índice do Firestore provavelmente está sendo criado. Tente novamente em alguns minutos.'
            });
        }
        return res.status(500).json({ error: 'Erro interno do servidor ao buscar artigos.' });
    }
}
