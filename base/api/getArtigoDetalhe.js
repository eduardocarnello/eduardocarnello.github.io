import { db, auth } from './firebaseAdmin.js';

export default async (req, res) => {
    try {
        // 1. Autenticação: Verifica o token do usuário
        const { authorization } = req.headers;
        if (!authorization || !authorization.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Não autorizado: Token não fornecido.' });
        }
        const token = authorization.split('Bearer ')[1];
        // Verifica se o token é válido
        await auth.verifyIdToken(token);

        // 2. Lógica da API: Buscar o artigo
        const { id } = req.query;
        if (!id) {
            return res.status(400).json({ error: 'ID do artigo é obrigatório.' });
        }

        const docRef = db.collection('artigos').doc(id);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            return res.status(404).json({ error: 'Artigo não encontrado.' });
        }

        // --- INÍCIO DA CORREÇÃO (Erro 500) ---
        // O crash (Erro 500) acontece porque Vercel não sabe como "serializar"
        // (converter para JSON) os objetos de Timestamp do Firebase.
        // Precisamos convertê-los manualmente para um formato JSON simples.

        const data = docSnap.data();

        // Converte qualquer campo de Timestamp (como publishedAt, createdAt, updatedAt)
        // para um objeto simples que pode ser enviado como JSON.
        const convertTimestamps = (obj) => {
            if (obj && typeof obj === 'object' && obj.toDate) { // Verifica se é um Timestamp
                return {
                    seconds: obj.seconds,
                    nanoseconds: obj.nanoseconds
                };
            }
            return obj;
        };

        const serializableData = {
            ...data,
            publishedAt: convertTimestamps(data.publishedAt),
            createdAt: convertTimestamps(data.createdAt),
            updatedAt: convertTimestamps(data.updatedAt)
        };

        // --- FIM DA CORREÇÃO ---

        // Envia os dados convertidos (serializáveis)
        res.status(200).json(serializableData);

    } catch (error) {
        // Trata erros de token expirado/inválido
        if (error.code === 'auth/id-token-expired' || error.code === 'auth/argument-error') {
            return res.status(401).json({ error: 'Não autorizado: Token inválido ou expirado.' });
        }
        // Trata erros internos
        console.error('Erro em getArtigoDetalhe:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

