/*
 * /api/getArtigosParaCiencia
 * API da Etapa 3.B
 * Busca todos os artigos que o usuário ATUAL ainda não deu ciência.
 * Compara a 'scienceVersion' do artigo com o registro de ciência do usuário.
 */
import { db, auth, getUserRole } from './firebaseAdmin.js';

export default async function handler(req, res) {
    try {
        // 1. Validar o Token e obter o UID do usuário
        const token = req.headers.authorization?.split('Bearer ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Nenhum token fornecido.' });
        }

        // Usamos getUserRole para validar o token e obter o UID do usuário
        // Qualquer cargo logado pode chamar esta API
        const decodedToken = await auth.verifyIdToken(token);
        const uid = decodedToken.uid;

        // 2. Buscar todos os artigos que REQUEREM ciência
        const artigosSnapshot = await db.collection('artigos')
            .where('requiresScience', '==', true)
            .get();

        if (artigosSnapshot.empty) {
            return res.status(200).json([]); // Nenhum artigo requer ciência, retorna array vazio
        }

        // 3. Buscar TODOS os registros de ciência do usuário
        const cienciaSnapshot = await db.collection('ciencia')
            .where('userId', '==', uid)
            .get();

        // 4. Mapear os registros de ciência para fácil consulta (ArticleID -> Version)
        const cienciaMap = new Map();
        cienciaSnapshot.forEach(doc => {
            const data = doc.data();
            cienciaMap.set(data.articleId, data.scienceVersion);
        });

        // 5. Filtrar os artigos pendentes
        const artigosPendentes = [];
        artigosSnapshot.forEach(doc => {
            const artigo = doc.data();
            const artigoId = doc.id;
            const versaoArtigo = artigo.scienceVersion || 1; // Padrão é 1

            // Verifica se o usuário já deu ciência DESTA versão
            const versaoCienciaUsuario = cienciaMap.get(artigoId);

            // Se o usuário nunca deu ciência (undefined) OU 
            // se a versão que ele deu ciência é MENOR que a versão atual do artigo
            if (!versaoCienciaUsuario || versaoCienciaUsuario < versaoArtigo) {
                artigosPendentes.push({
                    id: artigoId,
                    title: artigo.title, // Só precisamos do título e ID para o modal
                    scienceVersion: versaoArtigo
                });
            }
        });

        // Ordena por data de publicação (mais recentes primeiro)
        // (Nota: Isso pode ser lento se houver muitos artigos pendentes, 
        // mas `publishedAt` não está no objeto `artigo` aqui, teríamos que buscá-lo)
        // Por enquanto, apenas retornamos a lista.

        // 6. Retornar a lista de artigos pendentes
        return res.status(200).json(artigosPendentes);

    } catch (error) {
        console.error('Erro em /api/getArtigosParaCiencia:', error);

        // ERRO DE ÍNDICE: Isso vai falhar se os índices não existirem!
        if (error.code === 5) { // FAILED_PRECONDITION (Erro de índice)
            console.error('ERRO DE ÍNDICE NO FIRESTORE!');
            console.error('Por favor, crie os seguintes índices compostos no Firebase:');
            console.error("1. Coleção 'artigos', Campo 'requiresScience' (Ascendente)");
            console.error("2. Coleção 'ciencia', Campo 'userId' (Ascendente), Campo 'articleId' (Ascendente)");
            return res.status(500).json({ error: 'Erro de configuração do banco de dados (Índice ausente). Verifique os logs do servidor.' });
        }

        if (error.code === 'auth/id-token-expired' || error.message.includes('Token')) {
            return res.status(401).json({ error: 'Token expirado. Faça login novamente.' });
        }
        return res.status(500).json({ error: 'Erro interno do servidor.' });
    }
}