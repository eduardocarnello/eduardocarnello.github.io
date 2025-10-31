/*
 * /api/getArtigoDetalhe
 * Busca o conteúdo completo de UM artigo.
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
        const { id } = req.query;
        if (!id) {
            return res.status(400).json({ error: 'ID do artigo não fornecido.' });
        }

        const docRef = db.collection('artigos').doc(id);
        const docSnap = await docRef.get();

        if (!docSnap.exists()) {
            return res.status(404).json({ error: 'Artigo não encontrado.' });
        }

        // 3. Retornar Dados
        return res.status(200).json({ id: docSnap.id, ...docSnap.data() });

    } catch (error) {
        console.error('Erro em /api/getArtigoDetalhe:', error);
        if (error.code === 'auth/id-token-expired') {
            return res.status(401).json({ error: 'Token expirado. Faça login novamente.' });
        }
        return res.status(500).json({ error: 'Erro interno do servidor.' });
    }
}
