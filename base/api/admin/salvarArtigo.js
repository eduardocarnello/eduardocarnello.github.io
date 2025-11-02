/*
 * /api/admin/salvarArtigo
 * Cria ou atualiza um artigo.
 * ATUALIZADO P/ ETAPA 1: Usa o novo helper getUserRole e checa os cargos.
 */
import { db, admin, getUserRole } from '../firebaseAdmin.js'; // Note o '../'

export default async function handler(req, res) {
    // 1. Somente método POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    try {
        // 2. Validar o Token e obter o Cargo
        const token = req.headers.authorization?.split('Bearer ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Nenhum token fornecido.' });
        }
        const role = await getUserRole(token);

        // 3. Processar os dados do artigo
        const { id, ...articleData } = req.body;

        // 4. VERIFICAR PERMISSÕES COM BASE NO CARGO
        if (id) {
            // É UMA ATUALIZAÇÃO (EDITAR)
            if (role !== 'Admin' && role !== 'Editor') {
                return res.status(403).json({ error: 'Acesso negado. Apenas Admins ou Editores podem editar artigos.' });
            }
        } else {
            // É UMA CRIAÇÃO (PUBLICAR)
            if (role !== 'Admin' && role !== 'Editor' && role !== 'Redator') {
                return res.status(403).json({ error: 'Acesso negado. Apenas Admins, Editores ou Redatores podem publicar artigos.' });
            }
        }

        // 5. Lógica de Negócio (O código abaixo permanece o mesmo)

        // **MÚLTIPLOS LINKS: Validação**
        if (articleData.links && (!Array.isArray(articleData.links) || articleData.links.length > 5)) {
            return res.status(400).json({ error: 'Formato de links inválido ou limite de 5 excedido.' });
        }
        // Remove o 'link' antigo (do formulário antigo) se ele ainda estiver sendo enviado
        if (articleData.link) {
            delete articleData.link;
        }

        // Converte a string de data (se existir) para Timestamp do Firebase
        if (articleData.publishedAt) {
            // A data vem como 'YYYY-MM-DD'. Adicionamos T12:00:00 para evitar problemas de fuso.
            articleData.publishedAt = admin.firestore.Timestamp.fromDate(new Date(articleData.publishedAt + 'T12:00:00Z'));
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
                section
            }
            const newDoc = await db.collection('artigos').add(articleData);
            return res.status(201).json({ message: 'Artigo salvo com sucesso!', id: newDoc.id });
        }

    } catch (error) {
        console.error('Erro em /api/admin/salvarArtigo:', error);
        // O helper getUserRole já lida com 'auth/id-token-expired'
        return res.status(500).json({ error: error.message || 'Erro interno do servidor.' });
    }
}

