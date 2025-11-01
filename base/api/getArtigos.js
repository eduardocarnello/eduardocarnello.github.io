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
        // Converte os Timestamps do Firebase (que não são JSON) para um formato serializável
        const data = docSnap.data();
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

        const serializableData = convertTimestamps(data);
        serializableData.id = docSnap.id; // Adiciona o ID ao objeto final
        // --- FIM DA CORREÇÃO ---

        // Envia os dados convertidos
        res.status(200).json(serializableData);

    } catch (error) {
        // Trata erros de token
        if (error.code === 'auth/id-token-expired' || error.code === 'auth/argument-error') {
            return res.status(401).json({ error: 'Não autorizado: Token inválido ou expirado.' });
        }
        // Trata erros internos
        console.error('Erro em getArtigoDetalhe:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

