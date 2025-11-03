/*
 * API "Monolito"
 * Este arquivo único agora lida com TODAS as requisições de API.
 * Ele lê o campo 'action' do body para rotear a lógica.
 * Isso resolve o limite de 12 funções do Vercel.
 */
// A importação do 'firebaseAdmin.js' agora é o nosso helper central
import { db, auth, getUserRole, FieldValue, Timestamp, SUPER_ADMIN_EMAIL } from './firebaseAdmin.js';

// --- Funções Auxiliares (Copiadas das APIs antigas) ---

function convertTimestamps(data) {
    if (data && typeof data === 'object') {
        // Esta é a versão recursiva e segura
        const secondsKey = data.hasOwnProperty('_seconds') ? '_seconds' : 'seconds';
        const nanosKey = data.hasOwnProperty('_nanoseconds') ? '_nanoseconds' : 'nanoseconds';

        if (data.hasOwnProperty(secondsKey) && data.hasOwnProperty(nanosKey)) {
            return { seconds: data[secondsKey], nanoseconds: data[nanosKey] };
        }

        // Trata Timestamps do Firestore { seconds, nanoseconds }
        if (data.hasOwnProperty('seconds') && data.hasOwnProperty('nanoseconds')) {
            return { seconds: data.seconds, nanoseconds: data.nanoseconds };
        }

        for (const key in data) {
            data[key] = convertTimestamps(data[key]);
        }
    }
    return data;
}

function stripHtml(html) {
    return html ? html.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ') : '';
}

// --- Handler Principal (O Roteador) ---

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido (apenas POST)' });
    }

    if (!db || !auth) {
        console.error("ERRO FATAL: O Firebase Admin não foi inicializado. A API não pode funcionar.");
        return res.status(500).json({ error: 'Erro interno do servidor (Falha na inicialização do Admin)' });
    }

    try {
        const { action, payload } = req.body;
        const token = req.headers.authorization?.split('Bearer ')[1];

        if (!token) {
            return res.status(401).json({ error: 'Nenhum token fornecido.' });
        }

        // Ação de login/upsert é a única que não precisa de um 'role' prévio
        if (action === 'user/upsert') {
            const decodedToken = await auth.verifyIdToken(token);
            const { role, email } = await handleUpsert(decodedToken);
            return res.status(200).json({ role, email });
        }

        // Todas as outras ações exigem um cargo (role)
        const role = await getUserRole(token);
        if (!role) {
            return res.status(401).json({ error: 'Token inválido ou usuário sem cargo.' });
        }

        const decodedToken = await auth.verifyIdToken(token);

        // --- ROTEADOR DE AÇÕES ---
        switch (action) {
            // -- Ações de Leitura (Qualquer cargo logado) --
            case 'getArtigos':
                return await handleGetArtigos(payload, res);
            case 'getArtigoDetalhe':
                return await handleGetArtigoDetalhe(payload, res);
            case 'getCategorias':
                return await handleGetCategorias(res);
            case 'searchArtigos':
                return await handleSearchArtigos(payload, res);

            // -- Etapa 3.B: Ações de Ciência --
            case 'getArtigosParaCiencia':
                return await handleGetArtigosParaCiencia(decodedToken.uid, res);
            case 'user/declararCiencia':
                return await handleDeclararCiencia(payload, decodedToken.uid, decodedToken.email, res);

            // -- Ações de Admin (Requerem verificação de cargo interna) --
            case 'admin/salvarArtigo':
                return await handleSalvarArtigo(payload, role, decodedToken.uid, res);
            case 'admin/deletarArtigo':
                return await handleDeletarArtigo(payload, role, res);
            case 'admin/salvarCategoria':
                return await handleSalvarCategoria(payload, role, res);
            case 'admin/deletarCategoria':
                return await handleDeletarCategoria(payload, role, res);
            case 'admin/getUsers':
                return await handleGetUsers(decodedToken.uid, role, res);
            case 'admin/updateUserRole':
                return await handleUpdateUserRole(payload, decodedToken.uid, role, res);

            // -- ETAPA 3.C (NOVA) --
            case 'admin/getScienceLog':
                return await handleGetScienceLog(payload, role, res);

            default:
                return res.status(404).json({ error: `Ação desconhecida: ${action}` });
        }
    } catch (error) {
        console.error(`Erro fatal no handler principal (ação: ${req.body?.action}):`, error);
        if (error.code === 'auth/id-token-expired' || error.message.includes('Token')) {
            return res.status(401).json({ error: 'Token expirado. Faça login novamente.' });
        }
        return res.status(500).json({ error: 'Erro interno do servidor.' });
    }
}

// --- Funções Lógicas (Handlers) ---

// (Lógica de api/user/upsert.js)
async function handleUpsert(decodedToken) {
    const uid = decodedToken.uid;
    const email = decodedToken.email;
    const userRef = db.collection('users').doc(uid);
    const userSnap = await userRef.get();

    if (userSnap.exists) {
        return { role: userSnap.data().role, email: userSnap.data().email };
    } else {
        const newRole = (email === SUPER_ADMIN_EMAIL) ? 'Admin' : 'Leitor';
        const newUserProfile = {
            email: email,
            role: newRole,
            createdAt: FieldValue.serverTimestamp()
        };
        await userRef.set(newUserProfile);
        try {
            await auth.setCustomUserClaims(uid, { role: newRole });
        } catch (claimsError) {
            console.warn(`AVISO: Falha ao definir Custom Claim para ${uid}. Erro: ${claimsError.message}`);
        }
        console.log(`Novo perfil criado para ${email} com cargo: ${newRole}`);
        return { role: newRole, email: email };
    }
}

// (Lógica de api/getArtigos.js)
async function handleGetArtigos(payload, res) {
    const limit = parseInt(payload.limit || 10, 10);
    const category = payload.category;
    let query = db.collection('artigos').orderBy('publishedAt', 'desc');
    const snapshot = await query.get();
    if (snapshot.empty) return res.status(200).json([]);
    const articles = [];
    snapshot.forEach(doc => {
        const article = doc.data();
        const categoryMatch = (!category || category === 'TODOS' || article.categoryId === category);
        if (categoryMatch) {
            const { content, ...articleSummary } = article;
            const convertedData = convertTimestamps(articleSummary);
            articles.push({ id: doc.id, ...convertedData });
        }
    });
    const limitedArticles = articles.slice(0, limit);
    return res.status(200).json(limitedArticles);
}

// (Lógica de api/getArtigoDetalhe.js)
async function handleGetArtigoDetalhe(payload, res) {
    const { id } = payload;
    if (!id) return res.status(400).json({ error: 'ID do artigo é obrigatório.' });
    const docRef = db.collection('artigos').doc(id);
    const docSnap = await docRef.get();
    if (!docSnap.exists) return res.status(404).json({ error: 'Artigo não encontrado.' });
    const data = docSnap.data();
    const serializableData = convertTimestamps(data);
    return res.status(200).json(serializableData);
}

// (Lógica de api/getCategorias.js)
async function handleGetCategorias(res) {
    const snapshot = await db.collection('categorias').get(); // Removido o orderBy('name')
    if (snapshot.empty) return res.status(200).json([]);
    const categories = [];
    snapshot.forEach(doc => {
        categories.push({ id: doc.id, ...doc.data() });
    });
    categories.sort((a, b) => a.name.localeCompare(b.name));
    return res.status(200).json(categories);
}

// (Lógica de api/searchArtigos.js)
async function handleSearchArtigos(payload, res) {
    const { term, scope, category } = payload;
    if (!term) return res.status(400).json({ error: 'Termo de busca é obrigatório.' });
    const searchTerm = term.toLowerCase();
    const snapshot = await db.collection('artigos').orderBy('publishedAt', 'desc').get();
    if (snapshot.empty) return res.status(200).json([]);
    const searchResults = [];
    snapshot.forEach(doc => {
        const article = doc.data();
        const categoryMatch = (category === 'TODOS' || !category || article.categoryId === category);
        if (!categoryMatch) return;
        let textMatch = false;
        const title = article.title?.toLowerCase() || '';
        const summary = article.summary?.toLowerCase() || '';
        const content = stripHtml(article.content?.toLowerCase() || '');
        const tags = (article.tags || []).join(' ').toLowerCase();
        switch (scope) {
            case 'title': textMatch = title.includes(searchTerm); break;
            case 'summary': textMatch = summary.includes(searchTerm); break;
            case 'tags': textMatch = tags.includes(searchTerm); break;
            case 'content': textMatch = content.includes(searchTerm); break;
            default: // 'all'
                textMatch = title.includes(searchTerm) || summary.includes(searchTerm) || content.includes(searchTerm) || tags.includes(searchTerm);
        }
        if (textMatch) {
            const { content, ...articleSummary } = article;
            const convertedData = convertTimestamps(articleSummary);
            searchResults.push({ id: doc.id, ...convertedData });
        }
    });
    return res.status(200).json(searchResults);
}

// --- ETAPA 3.B (Artigos para Ciência) ---

// (Lógica de api/getArtigosParaCiencia.js)
async function handleGetArtigosParaCiencia(uid, res) {
    const artigosSnapshot = await db.collection('artigos')
        .where('requiresScience', '==', true)
        .get();
    if (artigosSnapshot.empty) return res.status(200).json([]);

    const cienciaSnapshot = await db.collection('ciencia')
        .where('userId', '==', uid)
        .get();
    const cienciaMap = new Map();
    cienciaSnapshot.forEach(doc => {
        const data = doc.data();
        cienciaMap.set(data.articleId, data.scienceVersion);
    });

    const artigosPendentes = [];
    artigosSnapshot.forEach(doc => {
        const artigo = doc.data();
        const artigoId = doc.id;
        const versaoArtigo = artigo.scienceVersion || 1;
        const versaoCienciaUsuario = cienciaMap.get(artigoId);

        if (!versaoCienciaUsuario || versaoCienciaUsuario < versaoArtigo) {
            artigosPendentes.push({
                id: artigoId,
                title: artigo.title,
                publishedAt: artigo.publishedAt, // Adiciona data para ordenação
                scienceVersion: versaoArtigo
            });
        }
    });

    artigosPendentes.sort((a, b) => {
        const aDate = convertTimestamps(a.publishedAt)?.seconds || 0;
        const bDate = convertTimestamps(b.publishedAt)?.seconds || 0;
        return bDate - aDate;
    });

    return res.status(200).json(artigosPendentes);
}

// (Lógica de api/user/declararCiencia.js)
async function handleDeclararCiencia(payload, uid, email, res) {
    const { artigos } = payload;
    if (!artigos || !Array.isArray(artigos) || artigos.length === 0) {
        return res.status(400).json({ error: 'Lista de artigos para ciência é obrigatória.' });
    }
    const batch = db.batch();
    const cienciaRef = db.collection('ciencia');
    artigos.forEach(artigo => {
        const { articleId, scienceVersion } = artigo;
        if (!articleId || !scienceVersion) return;

        const docId = `${uid}_${articleId}`;
        const docRef = cienciaRef.doc(docId);
        const dadosCiencia = {
            userId: uid,
            userEmail: email,
            articleId: articleId,
            scienceVersion: scienceVersion,
            declaredAt: FieldValue.serverTimestamp()
        };
        batch.set(docRef, dadosCiencia, { merge: true });
    });
    await batch.commit();
    return res.status(200).json({ message: 'Ciência declarada com sucesso.' });
}

// --- Funções de Admin (com verificação de cargo) ---

// (Lógica de api/admin/salvarArtigo.js)
async function handleSalvarArtigo(payload, role, uid, res) {
    const { id, ...articleData } = payload;

    if (id) { // Edição
        if (role !== 'Editor' && role !== 'Admin') {
            return res.status(403).json({ error: 'Acesso negado. Você não tem permissão para editar artigos.' });
        }
    } else { // Criação
        if (role !== 'Redator' && role !== 'Editor' && role !== 'Admin') {
            return res.status(403).json({ error: 'Acesso negado. Você não tem permissão para criar artigos.' });
        }
    }

    if (articleData.links && (!Array.isArray(articleData.links) || articleData.links.length > 5)) {
        return res.status(400).json({ error: 'Formato de links inválido ou limite de 5 excedido.' });
    }

    if (articleData.publishedAt) {
        articleData.publishedAt = Timestamp.fromDate(new Date(articleData.publishedAt + 'T12:00:00Z'));
    }

    articleData.updatedAt = FieldValue.serverTimestamp();

    if (role === 'Admin') {
        const { isScienceReset, requiresScience } = payload;
        articleData.requiresScience = requiresScience;
        if (id && requiresScience && isScienceReset) {
            articleData.scienceVersion = FieldValue.increment(1);
        } else if (!id && requiresScience) {
            articleData.scienceVersion = 1;
        }
    }
    delete articleData.isScienceReset;

    if (id) {
        const articleRef = db.collection('artigos').doc(id);
        await articleRef.set(articleData, { merge: true });
        return res.status(200).json({ message: 'Artigo atualizado com sucesso!' });
    } else {
        articleData.authorUid = uid;
        articleData.createdAt = FieldValue.serverTimestamp();
        if (!articleData.publishedAt) {
            articleData.publishedAt = FieldValue.serverTimestamp();
        }
        if (articleData.requiresScience && !articleData.scienceVersion) {
            articleData.scienceVersion = 1;
        }
        const newDoc = await db.collection('artigos').add(articleData);
        return res.status(201).json({ message: 'Artigo salvo com sucesso!', id: newDoc.id });
    }
}

// (Lógica de api/admin/deletarArtigo.js)
async function handleDeletarArtigo(payload, role, res) {
    if (role !== 'Admin') {
        return res.status(403).json({ error: 'Acesso negado. Você não é um administrador.' });
    }
    const { id } = payload;
    if (!id) return res.status(400).json({ error: 'ID do artigo não fornecido.' });

    // TODO: Deletar registros de ciência associados

    await db.collection('artigos').doc(id).delete();
    return res.status(200).json({ message: 'Artigo deletado com sucesso.' });
}

// (Lógica de api/admin/salvarCategoria.js)
async function handleSalvarCategoria(payload, role, res) {
    if (role !== 'Admin') {
        return res.status(403).json({ error: 'Acesso negado. Você não é um administrador.' });
    }
    const { id, ...categoryData } = payload;
    if (!categoryData.name) return res.status(400).json({ error: 'Nome da categoria é obrigatório.' });

    if (id) {
        const catRef = db.collection('categorias').doc(id);
        await catRef.set(categoryData);
        return res.status(200).json({ message: 'Categoria atualizada com sucesso.' });
    } else {
        await db.collection('categorias').add(categoryData);
        return res.status(201).json({ message: 'Categoria salva com sucesso.' });
    }
}

// (Lógica de api/admin/deletarCategoria.js)
async function handleDeletarCategoria(payload, role, res) {
    if (role !== 'Admin') {
        return res.status(403).json({ error: 'Acesso negado. Você não é um administrador.' });
    }
    const { id } = payload;
    if (!id) return res.status(400).json({ error: 'ID da categoria não fornecido.' });
    await db.collection('categorias').doc(id).delete();
    return res.status(200).json({ message: 'Categoria deletada com sucesso.' });
}

// (Lógica de api/admin/getUsers.js)
async function handleGetUsers(adminUid, role, res) {
    if (role !== 'Admin') {
        return res.status(403).json({ error: 'Acesso negado. Você não tem permissão para ver usuários.' });
    }
    const snapshot = await db.collection('users').get();
    if (snapshot.empty) return res.status(200).json([]);

    const users = [];
    snapshot.forEach(doc => {
        if (doc.id !== adminUid) { // Não inclui o próprio admin
            const data = doc.data();
            users.push({ uid: doc.id, email: data.email, role: data.role });
        }
    });
    return res.status(200).json(users);
}

// (Lógica de api/admin/updateUserRole.js)
async function handleUpdateUserRole(payload, adminUid, role, res) {
    if (role !== 'Admin') {
        return res.status(403).json({ error: 'Acesso negado. Você não tem permissão para alterar cargos.' });
    }
    const { uid, role: newRole } = payload;
    const VALID_ROLES = ['Leitor', 'Redator', 'Editor', 'Admin'];
    if (!uid || !newRole) return res.status(400).json({ error: 'UID do usuário e novo cargo são obrigatórios.' });
    if (!VALID_ROLES.includes(newRole)) return res.status(400).json({ error: 'Cargo inválido.' });
    if (adminUid === uid) return res.status(400).json({ error: 'Você não pode alterar seu próprio cargo.' });

    const userRef = db.collection('users').doc(uid);
    await userRef.update({ role: newRole });

    try {
        await auth.setCustomUserClaims(uid, { role: newRole });
    } catch (claimsError) {
        console.warn(`AVISO: Falha ao definir Custom Claim para ${uid}. Erro: ${claimsError.message}`);
    }

    return res.status(200).json({ message: 'Cargo do usuário atualizado com sucesso.' });
}

// --- ETAPA 3.C (LOG DE CIÊNCIA - CORRIGIDO) ---
async function handleGetScienceLog(payload, role, res) {
    // Permissão: Editor ou Admin podem ver o log
    if (role !== 'Editor' && role !== 'Admin') {
        return res.status(403).json({ error: 'Acesso negado. Permissão insuficiente.' });
    }

    const { articleId } = payload;
    if (!articleId) return res.status(400).json({ error: 'ID do artigo é obrigatório.' });

    // 1. Busca a versão atual do artigo
    const articleRef = db.collection('artigos').doc(articleId);
    const articleSnap = await articleRef.get();
    if (!articleSnap.exists) return res.status(404).json({ error: 'Artigo não encontrado.' });
    const currentScienceVersion = articleSnap.data().scienceVersion || 1;

    // 2. Busca todos os usuários
    const usersSnapshot = await db.collection('users').get();
    const allUsers = new Map();
    usersSnapshot.forEach(doc => {
        // **CORREÇÃO BUG 4**: Pega TODOS os usuários, incluindo Admins
        const user = doc.data();
        allUsers.set(doc.id, { email: user.email, uid: doc.id, role: user.role });
    });

    // 3. Busca todos os registros de ciência para este artigo
    const cienciaSnapshot = await db.collection('ciencia')
        .where('articleId', '==', articleId)
        .get();

    const completed = [];
    const pending = [];

    // 4. Compara as listas
    cienciaSnapshot.forEach(doc => {
        const cienciaData = doc.data();
        const userId = cienciaData.userId;

        if (allUsers.has(userId)) {
            const user = allUsers.get(userId);

            if (cienciaData.scienceVersion >= currentScienceVersion) {
                // Usuário deu ciência da versão atual
                completed.push({
                    email: cienciaData.userEmail,
                    declaredAt: convertTimestamps(cienciaData.declaredAt)
                });
            } else {
                // Usuário deu ciência de uma versão antiga, ele está pendente
                // **CORREÇÃO BUG 4**: Só adiciona a pendente se não for Admin
                if (user.role !== 'Admin') {
                    pending.push(user);
                }
            }
            // Remove o usuário do map para sabermos quem sobrou (pendente)
            allUsers.delete(userId);
        }
    });

    // 5. Adiciona os usuários restantes (que NUNCA deram ciência) à lista de pendentes
    allUsers.forEach(user => {
        // **CORREÇÃO BUG 4**: Só adiciona a pendente se não for Admin
        if (user.role !== 'Admin') {
            pending.push(user);
        }
    });

    // Ordena as listas por e-mail
    completed.sort((a, b) => a.email.localeCompare(b.email));
    pending.sort((a, b) => a.email.localeCompare(b.email));

    return res.status(200).json({ completed, pending });
}

