/*
 * /api/admin/salvarArtigo
 * Cria ou atualiza um artigo.
 * Protegido por Token E por Role (Admin, Editor, Redator).
 * ATUALIZADO: Adicionada lógica de "Ciência" (Etapa 3.A)
 */
import { db, auth, getUserRole, FieldValue, Timestamp } from '../firebaseAdmin.js'; // Importa FieldValue e Timestamp

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

        // 3. VERIFICAR PERMISSÃO
        const { id } = req.body; // Pega o ID para saber se é edição
        if (id) {
            // É uma EDIÇÃO
            if (role !== 'Editor' && role !== 'Admin') {
                return res.status(403).json({ error: 'Acesso negado. Você não tem permissão para editar artigos.' });
            }
        } else {
            // É uma CRIAÇÃO
            if (role !== 'Redator' && role !== 'Editor' && role !== 'Admin') {
                return res.status(403).json({ error: 'Acesso negado. Você não tem permissão para criar artigos.' });
            }
        }

        // 4. Processar os dados do artigo
        // ETAPA 3.A: Captura os novos campos de ciência
        const { id: articleId, isScienceReset, ...articleData } = req.body;


        // Validação de Links Múltiplos (já estava correta)
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
            articleData.publishedAt = Timestamp.fromDate(new Date(articleData.publishedAt + 'T12:00:00Z'));
        }

        // Adiciona timestamps do servidor
        articleData.updatedAt = FieldValue.serverTimestamp();

        // 5. LÓGICA DE SALVAR
        if (id) {
            // ATUALIZAR
            const articleRef = db.collection('artigos').doc(id);

            // ETAPA 3.A: Lógica de Ciência (Edição)
            if (articleData.requiresScience) {
                if (isScienceReset) {
                    // "Resetar" - Incrementa a versão
                    articleData.scienceVersion = FieldValue.increment(1);
                } else {
                    // Apenas marcando, verifica se já existe
                    const docSnap = await articleRef.get();
                    const existingData = docSnap.data();
                    if (!existingData.scienceVersion || existingData.scienceVersion === 0) {
                        articleData.scienceVersion = 1; // Define para 1 na primeira vez
                    }
                    // Se já existe, não faz nada (mantém a versão atual)
                }
            } else {
                // Se desmarcou a caixa, zera a versão (ou define como 0)
                articleData.scienceVersion = 0;
            }
            // FIM ETAPA 3.A

            await articleRef.set(articleData, { merge: true });
            return res.status(200).json({ message: 'Artigo atualizado com sucesso!' });

        } else {
            // CRIAR
            articleData.createdAt = FieldValue.serverTimestamp();
            // Se publishedAt não foi definido, usa o timestamp do servidor
            if (!articleData.publishedAt) {
                articleData.publishedAt = FieldValue.serverTimestamp();
            }

            // ETAPA 3.A: Lógica de Ciência (Criação)
            if (articleData.requiresScience) {
                articleData.scienceVersion = 1; // Novo artigo começa na v1
            } else {
                articleData.scienceVersion = 0;
            }
            // FIM ETAPA 3.A

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

