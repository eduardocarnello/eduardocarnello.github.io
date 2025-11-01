/*
 * /api/admin/salvarArtigo
 * Cria ou atualiza um artigo.
 * Protegido para Admins.
 */
import { db, auth, FieldValue } from '../firebaseAdmin.js';

// Lista de e-mails de administradores
const ADMIN_EMAILS = ['eduardocarnello@gmail.com', 'mariliajec@tjsp.jus.br'];

// Função helper para validar o token de admin
async function validateAdmin(token) {
    if (!token) {
        throw new Error('Nenhum token fornecido.');
    }
    const decodedToken = await auth.verifyIdToken(token);
    if (!ADMIN_EMAILS.includes(decodedToken.email)) {
        throw new Error('Permissão negada. Usuário não é administrador.');
    }
    return decodedToken;
}

export default async function handler(req, res) {

    // API aceita apenas POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido.' });
    }

    try {
        const token = req.headers.authorization?.split('Bearer ')[1];
        await validateAdmin(token);

        const { id, articleData, publishedAt } = req.body;

        if (!articleData || !articleData.title) {
            return res.status(400).json({ error: 'Dados do artigo inválidos.' });
        }

        // **MÚLTIPLOS LINKS: Validação**
        if (articleData.links && (!Array.isArray(articleData.links) || articleData.links.length > 5)) {
            return res.status(400).json({ error: 'Formato de links inválido ou limite de 5 excedido.' });
        }

        // Gera o slug (mesma lógica do admin.html)
        articleData.slug = articleData.title.toString().toLowerCase().trim()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-');

        // Sempre atualiza a data de modificação
        articleData.updatedAt = FieldValue.serverTimestamp();

        // Lógica da Data de Publicação
        if (publishedAt === 'keep') {
            // Não faz nada, mantém a data existente (só em edição)
        } else if (publishedAt) {
            // Converte a string ISO enviada pelo admin.html para um Timestamp
            articleData.publishedAt = new Date(publishedAt);
        } else if (!id) {
            // Se é um NOVO artigo e a data está VAZIA, usa a data atual
            articleData.publishedAt = FieldValue.serverTimestamp();
        }

        if (id) {
            // --- Atualizar Artigo ---
            const articleRef = db.collection('artigos').doc(id);
            await articleRef.set(articleData, { merge: true });
            return res.status(200).json({ id });

        } else {
            // --- Criar Novo Artigo ---
            articleData.createdAt = FieldValue.serverTimestamp(); // Adiciona data de criação
            const newArticleRef = await db.collection('artigos').add(articleData);
            return res.status(201).json({ id: newArticleRef.id });
        }

    } catch (error) {
        console.error('Erro em /api/admin/salvarArtigo:', error);
        if (error.message.includes('Permissão negada')) {
            return res.status(403).json({ error: error.message });
        }
        return res.status(500).json({ error: 'Erro interno do servidor.' });
    }
}

