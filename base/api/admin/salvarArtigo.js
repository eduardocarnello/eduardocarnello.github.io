/*
 * /api/admin/salvarArtigo
 * Cria ou atualiza um artigo.
 * Protegido por Token E por lista de Admin.
 */
import { db, auth, admin } from '../firebaseAdmin.js'; // Note o '../'

// Lista de e-mails de administradores
const ADMIN_EMAILS = ['eduardocarnello@gmail.com', 'mariliajec@tjsp.jus.br'];

export default async function handler(req, res) {
    // 1. Somente método POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    try {
        // 2. Validar o Token do usuário
        const token = req.headers.authorization?.split('Bearer ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Nenhum token fornecido.' });
        }
        const decodedToken = await auth.verifyIdToken(token);

        // 3. VERIFICAR SE É ADMIN
        if (!ADMIN_EMAILS.includes(decodedToken.email)) {
            return res.status(403).json({ error: 'Acesso negado. Você não é um administrador.' });
        }

        // 4. Processar os dados do artigo
        const { id, ...articleData } = req.body;

        // Converte a string de data (se existir) para Timestamp do Firebase
        if (articleData.publishedAt) {
            articleData.publishedAt = admin.firestore.Timestamp.fromDate(new Date(articleData.publishedAt));
        }

        // Adiciona timestamps do servidor
        articleData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

        if (id) {
            // Atualizar
            const articleRef = db.collection('artigos').doc(id);
            await articleRef.set(articleData, { merge: true });
            return res.status(200).json({ message: 'Artigo atualizado com sucesso!' });
        } else {
            // Criar
            articleData.createdAt = admin.firestore.FieldValue.serverTimestamp();
            // Se publishedAt não foi definido, usa o timestamp do servidor
            if (!articleData.publishedAt) {
                articleData.publishedAt = admin.firestore.FieldValue.serverTimestamp();
            }
            const newDoc = await db.collection('artigos').add(articleData);
            return res.status(201).json({ message: 'Artigo salvo com sucesso!', id: newDoc.id });
        }

    } catch (error) {
        console.error('Erro em /api/admin/salvarArtigo:', error);
        if (error.code === 'auth/id-token-expired') {
            return res.status(401).json({ error: 'Token expirado. Faça login novamente.' });
        }
        return res.status(500).json({ error: 'Erro interno do servidor.' });
    }
}
