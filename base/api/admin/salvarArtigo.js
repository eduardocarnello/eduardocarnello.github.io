/*
 * /api/admin/salvarArtigo
 * Cria ou atualiza um artigo.
 * Protegido por Token E por Cargo (Redator, Editor, Admin).
 */
// CORREÇÃO: Importa Timestamp e FieldValue (e remove 'admin')
import { db, auth, Timestamp, FieldValue, getUserRole } from '../firebaseAdmin.js'; // Note o '../'

export default async function handler(req, res) {
    // 1. Somente método POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    try {
        // 2. Validar o Token do usuário e obter cargo
        const token = req.headers.authorization?.split('Bearer ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Nenhum token fornecido.' });
        }
        const role = await getUserRole(token);

        // 3. Processar os dados do artigo
        const { id, ...articleData } = req.body;

        // 4. VERIFICAR PERMISSÕES (CARGOS)
        if (id) {
            // É uma ATUALIZAÇÃO (edição)
            if (role !== 'Editor' && role !== 'Admin') {
                return res.status(403).json({ error: 'Acesso negado. Você não tem permissão para editar artigos.' });
            }
        } else {
            // É uma CRIAÇÃO
            if (role !== 'Redator' && role !== 'Editor' && role !== 'Admin') {
                return res.status(403).json({ error: 'Acesso negado. Você não tem permissão para criar artigos.' });
            }
            // Redator não pode definir categoria, então forçamos para nulo se não for Editor/Admin
            if (role === 'Redator') {
                articleData.categoryId = null; // Ou um ID de categoria "Rascunho" padrão
            }
        }

        // 5. Processar dados
        if (articleData.links && (!Array.isArray(articleData.links) || articleData.links.length > 5)) {
            return res.status(400).json({ error: 'Formato de links inválido ou limite de 5 excedido.' });
        }
        if (articleData.link) { // Remove 'link' antigo
            delete articleData.link;
        }

        // Converte a string de data (se existir) para Timestamp do Firebase
        if (articleData.publishedAt) {
            // CORREÇÃO: Usa o 'Timestamp' importado
            articleData.publishedAt = Timestamp.fromDate(new Date(articleData.publishedAt + 'T12:00:00Z'));
        }

        // Adiciona timestamps do servidor
        // CORREÇÃO: Usa o 'FieldValue' importado
        articleData.updatedAt = FieldValue.serverTimestamp();

        if (id) {
            // Atualizar
            const articleRef = db.collection('artigos').doc(id);
            await articleRef.set(articleData, { merge: true });
            return res.status(200).json({ message: 'Artigo atualizado com sucesso!' });
        } else {
            // Criar
            // CORREÇÃO: Usa o 'FieldValue' importado
            articleData.createdAt = FieldValue.serverTimestamp();
            // Se publishedAt não foi definido, usa o timestamp do servidor
            if (!articleData.publishedAt) {
                // CORREÇÃO: Usa o 'FieldValue' importado
                articleData.publishedAt = FieldValue.serverTimestamp();
            }
            const newDoc = await db.collection('artigos').add(articleData);
            return res.status(201).json({ message: 'Artigo salvo com sucesso!', id: newDoc.id });
        }

    } catch (error) {
        console.error('Erro em /api/admin/salvarArtigo:', error);
        if (error.code === 'auth/id-token-expired' || error.message.includes('Token')) {
            return res.status(401).json({ error: 'Token expirado. Faça login novamente.' });
        }
        return res.status(500).json({ error: 'Erro interno do servidor.' });
    }
}

