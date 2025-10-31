/*
 * /api/getCategorias
 * Busca todas as categorias.
 * Protegido por Token.
 */
import { db, auth } from './firebaseAdmin.js';

export default async function handler(req, res) {
    try {
        // 1. Validar o Token do usuário
        const token = req.headers.authorization?.split('Bearer ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Nenhum token fornecido.' });
        }
        await auth.verifyIdToken(token);

        // 2. Buscar Dados
        const snapshot = await db.collection('categorias').orderBy('name').get();

        if (snapshot.empty) {
            return res.status(200).json([]);
        }

        const categories = [];
        snapshot.forEach(doc => {
            categories.push({ id: doc.id, ...doc.data() });
        });

        // 3. Retornar Dados
        return res.status(200).json(categories);

    } catch (error) {
        console.error('Erro em /api/getCategorias:', error);
        if (error.code === 'auth/id-token-expired') {
            return res.status(401).json({ error: 'Token expirado. Faça login novamente.' });
        }
        return res.status(500).json({ error: 'Erro interno do servidor.' });
    }
}
