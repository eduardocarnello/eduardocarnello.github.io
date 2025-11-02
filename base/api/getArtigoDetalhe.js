import { db, auth, getUserRole } from './firebaseAdmin.js'; // Importa o getUserRole

// Converte Timestamps do Firebase para JSON (versão recursiva)
function convertTimestamps(data) {
    if (data && typeof data === 'object') {
        // Verifica se é um Timestamp do Firestore (pode vir como _seconds ou seconds)
        const secondsKey = data.hasOwnProperty('_seconds') ? '_seconds' : 'seconds';
        const nanosKey = data.hasOwnProperty('_nanoseconds') ? '_nanoseconds' : 'nanoseconds';

        if (data.hasOwnProperty(secondsKey) && data.hasOwnProperty(nanosKey)) {
            return { seconds: data[secondsKey], nanoseconds: data[nanosKey] };
        }

        // Recursivamente para outros campos
        for (const key in data) {
            data[key] = convertTimestamps(data[key]);
        }
    }
    return data;
}

export default async (req, res) => {
    try {
        // 1. Autenticação: Verifica o token e o cargo do usuário
        const { authorization } = req.headers;
        if (!authorization || !authorization.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Não autorizado: Token não fornecido.' });
        }
        const token = authorization.split('Bearer ')[1];

        // USA A NOVA FUNÇÃO DE VERIFICAÇÃO DE CARGO
        const role = await getUserRole(token);
        if (!role) {
            // getUserRole já trata erros de token inválido/expirado
            return res.status(401).json({ error: 'Token inválido ou expirado. Faça login novamente.' });
        }
        // Se temos um cargo (Leitor, Redator, Editor, Admin), o usuário está autenticado e pode ler.

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

        // Converte os Timestamps de forma recursiva
        const data = docSnap.data();
        const serializableData = convertTimestamps(data);

        // Envia os dados convertidos (serializáveis)
        res.status(200).json(serializableData);

    } catch (error) {
        // Trata erros de token (que o getUserRole pode lançar)
        if (error.code === 'auth/id-token-expired' || error.message.includes('Token')) {
            return res.status(401).json({ error: 'Não autorizado: Token inválido ou expirado.' });
        }
        // Trata erros internos
        console.error('Erro em getArtigoDetalhe:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

