/*
 * API "Monolito"
 * Este arquivo único agora lida com TODAS as requisições de API.
 * Ele lê o campo 'action' do body para rotear a lógica.
 * IMPLEMENTA A LÓGICA DE WHITELIST.
 */
import { db, auth, getUserRole, FieldValue, Timestamp, SUPER_ADMIN_EMAIL } from './firebaseAdmin.js'; // Importa SUPER_ADMIN_EMAIL

// --- NOVO: WHITELIST (LISTA DE APROVADOS) ---
// O SUPER_ADMIN_EMAIL é sempre permitido.
const EMAIL_WHITELIST = [
    SUPER_ADMIN_EMAIL, 'eduardocarnello@gmail.com',
    'camilaps05@gmail.com',
    // Adicione outros e-mails aprovados aqui
    // 'outro.email@tjsp.jus.br',
];
// --- FIM DA WHITELIST ---

// --- ALLOWLIST DINÂMICA (Firestore: config/allowlist) ---
// Os e-mails da EMAIL_WHITELIST acima funcionam como "bootstrap" (sempre permitidos),
// para você nunca se trancar para fora. Os demais ficam no Firestore e são
// gerenciáveis pelo Painel Admin, sem precisar de novo deploy.
let allowlistCache = null;
let allowlistCacheTime = 0;
const ALLOWLIST_TTL_MS = 30 * 1000; // cache de 30s (instâncias serverless reaproveitadas)

async function getAllowedEmails(force = false) {
    const now = Date.now();
    if (!force && allowlistCache && (now - allowlistCacheTime) < ALLOWLIST_TTL_MS) {
        return allowlistCache;
    }
    const set = new Set(EMAIL_WHITELIST.map(e => e.toLowerCase()));
    try {
        const snap = await db.collection('config').doc('allowlist').get();
        if (snap.exists) {
            (snap.data().emails || []).forEach(e => { if (e) set.add(String(e).toLowerCase()); });
        }
    } catch (e) {
        console.warn('Falha ao ler allowlist do Firestore; usando apenas o bootstrap. Erro:', e.message);
    }
    allowlistCache = set;
    allowlistCacheTime = now;
    return set;
}
function invalidateAllowlistCache() { allowlistCacheTime = 0; }
// --- FIM DA ALLOWLIST DINÂMICA ---


// --- Funções Auxiliares (Copiadas das APIs antigas) ---

function convertTimestamps(data) {
    if (data && typeof data === 'object') {
        const secondsKey = data.hasOwnProperty('_seconds') ? '_seconds' : 'seconds';
        const nanosKey = data.hasOwnProperty('_nanoseconds') ? '_nanoseconds' : 'nanoseconds';

        if (data.hasOwnProperty(secondsKey) && data.hasOwnProperty(nanosKey)) {
            return { seconds: data[secondsKey], nanoseconds: data[nanosKey] };
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

// Normaliza texto para busca: minúsculas + remove acentos (NFD)
function normalizeText(s) {
    return (s == null ? '' : String(s))
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

// Verdadeiro se a distância de edição (Levenshtein) entre a e b for <= 1.
// Usado para tolerância a erro de digitação na busca.
function editDistanceAtMost1(a, b) {
    const la = a.length, lb = b.length;
    if (Math.abs(la - lb) > 1) return false;
    let i = 0, j = 0, edits = 0;
    while (i < la && j < lb) {
        if (a[i] === b[j]) { i++; j++; continue; }
        if (++edits > 1) return false;
        if (la > lb) i++;            // deleção em a
        else if (lb > la) j++;       // inserção em a
        else { i++; j++; }           // substituição
    }
    if (i < la || j < lb) edits++;   // sobrou 1 caractere no fim
    return edits <= 1;
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

        const decodedToken = await auth.verifyIdToken(token);

        // --- LÓGICA DA WHITELIST (allowlist dinâmica + bootstrap) ---
        // Verifica se o e-mail está autorizado ANTES de qualquer ação
        const userEmail = decodedToken.email;
        const allowedEmails = await getAllowedEmails();
        if (!userEmail || !allowedEmails.has(userEmail.toLowerCase())) {
            console.warn(`ACESSO NEGADO (Whitelist): E-mail ${userEmail} tentou acessar.`);
            // Retorna um erro 403 (Proibido) com uma mensagem clara.
            // O front-end (index.html/admin.html) deve tratar este erro.
            return res.status(403).json({ error: 'ACESSO_NEGADO: Seu e-mail não está autorizado a usar este sistema.' });
        }
        // --- FIM DA LÓGICA DA WHITELIST ---

        // Ação de login/upsert
        if (action === 'user/upsert') {
            const { role, email } = await handleUpsert(decodedToken);
            return res.status(200).json({ role, email });
        }

        // Todas as outras ações exigem um cargo (role)
        const role = await getUserRole(token); // Agora é seguro chamar, pois o usuário está na whitelist
        if (!role) {
            return res.status(401).json({ error: 'Token inválido ou usuário sem cargo.' });
        }

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

            // -- ETAPA 3.C (Auditoria) --
            case 'admin/getScienceLog':
                return await handleGetScienceLog(payload, role, res);
            case 'admin/getCienciaPendencias':
                return await handleGetCienciaPendencias(role, res);

            // -- Gerenciamento da Allowlist (Whitelist) --
            case 'admin/getWhitelist':
                return await handleGetWhitelist(role, res);
            case 'admin/addWhitelist':
                return await handleAddWhitelist(payload, role, res);
            case 'admin/removeWhitelist':
                return await handleRemoveWhitelist(payload, role, res);

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

// --- Funções Lógicas (Copiadas das APIs antigas) ---

// (Lógica de api/user/upsert.js)
async function handleUpsert(decodedToken) {
    const uid = decodedToken.uid;
    const email = decodedToken.email;
    const userRef = db.collection('users').doc(uid);
    const userSnap = await userRef.get();

    if (userSnap.exists) {
        return { role: userSnap.data().role, email: userSnap.data().email };
    } else {
        // (A verificação de Whitelist já foi feita acima)
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
// OTIMIZADO: aplica o limite no próprio Firestore (caso "TODOS"), reduzindo leituras.
// Para uma categoria específica, lê apenas os documentos daquela categoria
// (evita exigir índice composto no Firestore).
async function handleGetArtigos(payload, res) {
    const limit = parseInt(payload.limit || 10, 10);
    const category = payload.category;
    const articles = [];

    if (!category || category === 'TODOS') {
        const snapshot = await db.collection('artigos')
            .orderBy('publishedAt', 'desc')
            .limit(limit)
            .get();
        snapshot.forEach(doc => {
            const { content, ...articleSummary } = doc.data();
            articles.push({ id: doc.id, ...convertTimestamps(articleSummary) });
        });
        return res.status(200).json(articles);
    }

    // Categoria específica: filtra no servidor, ordena/limita em memória
    const snapshot = await db.collection('artigos')
        .where('categoryId', '==', category)
        .get();
    const all = [];
    snapshot.forEach(doc => {
        const { content, ...articleSummary } = doc.data();
        all.push({ id: doc.id, ...convertTimestamps(articleSummary) });
    });
    all.sort((a, b) => (b.publishedAt?.seconds || 0) - (a.publishedAt?.seconds || 0));
    return res.status(200).json(all.slice(0, limit));
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
// MELHORADO: busca sem distinção de acento, com múltiplos termos (todos precisam casar)
// e tolerância a 1 erro de digitação por termo (distância de edição <= 1).
async function handleSearchArtigos(payload, res) {
    const { term, scope, category } = payload;
    if (!term) return res.status(400).json({ error: 'Termo de busca é obrigatório.' });

    const tokens = normalizeText(term).split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return res.status(200).json([]);

    const snapshot = await db.collection('artigos').orderBy('publishedAt', 'desc').get();
    if (snapshot.empty) return res.status(200).json([]);

    const searchResults = [];
    snapshot.forEach(doc => {
        const article = doc.data();
        const categoryMatch = (category === 'TODOS' || !category || article.categoryId === category);
        if (!categoryMatch) return;

        const title = normalizeText(article.title);
        const summary = normalizeText(article.summary);
        const content = normalizeText(stripHtml(article.content || ''));
        const tags = normalizeText((article.tags || []).join(' '));

        let haystack;
        switch (scope) {
            case 'title': haystack = title; break;
            case 'summary': haystack = summary; break;
            case 'tags': haystack = tags; break;
            case 'content': haystack = content; break;
            default: haystack = [title, summary, tags, content].join(' ');
        }

        // Lista de palavras só é calculada se algum termo falhar no "includes" (fuzzy)
        let haystackWords = null;
        const getWords = () => {
            if (haystackWords === null) haystackWords = haystack.split(/[^a-z0-9]+/).filter(Boolean);
            return haystackWords;
        };

        const allMatch = tokens.every(tok => {
            if (haystack.includes(tok)) return true;
            if (tok.length >= 4) {
                return getWords().some(w => editDistanceAtMost1(w, tok));
            }
            return false;
        });

        if (allMatch) {
            const { content: _omit, ...articleSummary } = article;
            searchResults.push({ id: doc.id, ...convertTimestamps(articleSummary) });
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
                scienceVersion: versaoArtigo,
                publishedAt: artigo.publishedAt // Passa a data para ordenação
            });
        }
    });

    artigosPendentes.sort((a, b) => {
        const aDate = convertTimestamps(a.publishedAt)?.seconds || 0;
        const bDate = convertTimestamps(b.publishedAt)?.seconds || 0;
        return bDate - aDate;
    });

    // Remove o publishedAt antes de enviar, já que o front-end não precisa dele
    const artigosFinais = artigosPendentes.map(art => ({
        id: art.id,
        title: art.title,
        scienceVersion: art.scienceVersion
    }));

    return res.status(200).json(artigosFinais);
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
        } else if (requiresScience && (!id || !articleData.scienceVersion)) {
            // Se for novo ou se a ciência foi recém-marcada
            articleData.scienceVersion = 1;
        }
    }
    delete articleData.isScienceReset; // Remove o campo temporário

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

    await db.collection('artigos').doc(id).delete();

    // Deleta os registros de ciência associados (evita "ciências órfãs")
    try {
        const cienciaSnap = await db.collection('ciencia').where('articleId', '==', id).get();
        if (!cienciaSnap.empty) {
            // Batches do Firestore suportam até 500 operações; fatiamos por segurança.
            const docs = cienciaSnap.docs;
            for (let i = 0; i < docs.length; i += 450) {
                const batch = db.batch();
                docs.slice(i, i + 450).forEach(d => batch.delete(d.ref));
                await batch.commit();
            }
        }
    } catch (e) {
        console.warn(`Falha ao limpar registros de ciência do artigo ${id}:`, e.message);
    }

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
        return res.status(200).json({ message: 'Categoria atualizada!' });
    } else {
        await db.collection('categorias').add(categoryData);
        return res.status(201).json({ message: 'Categoria salva!' });
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
        return res.status(403).json({ error: 'Acesso negado.' });
    }
    const usersSnapshot = await db.collection('users').get();
    const users = [];
    usersSnapshot.forEach(doc => {
        // Não inclui o próprio admin na lista de gerenciamento
        if (doc.id !== adminUid) {
            users.push({ uid: doc.id, ...doc.data() });
        }
    });
    return res.status(200).json(users);
}

// (Lógica de api/admin/updateUserRole.js)
async function handleUpdateUserRole(payload, adminUid, role, res) {
    if (role !== 'Admin') {
        return res.status(403).json({ error: 'Acesso negado.' });
    }
    const { uid, role: newRole } = payload;
    if (!uid || !newRole) {
        return res.status(400).json({ error: 'UID do usuário e novo cargo são obrigatórios.' });
    }
    if (uid === adminUid) {
        return res.status(400).json({ error: 'Você não pode alterar seu próprio cargo.' });
    }
    const validRoles = ['Leitor', 'Redator', 'Editor', 'Admin'];
    if (!validRoles.includes(newRole)) {
        return res.status(400).json({ error: 'Cargo inválido.' });
    }

    try {
        await auth.setCustomUserClaims(uid, { role: newRole });
        await db.collection('users').doc(uid).update({ role: newRole });
        return res.status(200).json({ message: 'Cargo atualizado com sucesso.' });
    } catch (error) {
        console.error("Erro ao atualizar cargo:", error);
        return res.status(500).json({ error: 'Erro ao definir permissões.' });
    }
}

// --- ETAPA 3.C (Auditoria de Ciência) ---
async function handleGetScienceLog(payload, role, res) {
    if (role !== 'Editor' && role !== 'Admin') {
        return res.status(403).json({ error: 'Acesso negado. Permissão de Editor ou Admin necessária.' });
    }

    const { articleId } = payload;
    if (!articleId) {
        return res.status(400).json({ error: 'ID do artigo é obrigatório.' });
    }

    // 1. Busca o artigo para saber a versão atual
    const articleRef = db.collection('artigos').doc(articleId);
    const articleSnap = await articleRef.get();
    if (!articleSnap.exists) {
        return res.status(404).json({ error: 'Artigo não encontrado.' });
    }
    const currentScienceVersion = articleSnap.data().scienceVersion || 1;

    // 2. Busca todos os usuários
    const usersSnapshot = await db.collection('users').get();

    // 3. Busca todos os registros de ciência para este artigo
    const cienciaSnapshot = await db.collection('ciencia')
        .where('articleId', '==', articleId)
        .get();

    const cienciaMap = new Map();
    cienciaSnapshot.forEach(doc => {
        const data = doc.data();
        cienciaMap.set(data.userId, {
            version: data.scienceVersion,
            declaredAt: convertTimestamps(data.declaredAt)
        });
    });

    const completed = [];
    const pending = [];

    // 4. Compara as listas
    usersSnapshot.forEach(doc => {
        const user = doc.data();
        const userId = doc.id;
        const cienciaInfo = cienciaMap.get(userId);

        if (cienciaInfo && cienciaInfo.version >= currentScienceVersion) {
            // Usuário deu ciência da versão atual ou mais recente
            // CORREÇÃO BUG 4: Inclui Admins na lista de "Completos"
            completed.push({
                email: user.email,
                declaredAt: cienciaInfo.declaredAt
            });
        } else {
            // Usuário está pendente
            // CORREÇÃO BUG 4: Admins não ficam "pendentes"
            if (user.role !== 'Admin') {
                pending.push({
                    email: user.email
                });
            }
        }
    });

    return res.status(200).json({ completed, pending });
}

// --- Painel de Pendências de Ciência (visão consolidada para o chefe) ---
async function handleGetCienciaPendencias(role, res) {
    if (role !== 'Editor' && role !== 'Admin') {
        return res.status(403).json({ error: 'Acesso negado. Permissão de Editor ou Admin necessária.' });
    }

    const [artigosSnap, usersSnap, cienciaSnap] = await Promise.all([
        db.collection('artigos').where('requiresScience', '==', true).get(),
        db.collection('users').get(),
        db.collection('ciencia').get()
    ]);

    // Usuários que contam como "leitores" (Admins não entram nas pendências)
    const readers = [];
    usersSnap.forEach(d => {
        const u = d.data();
        if (u.role !== 'Admin') readers.push({ uid: d.id, email: u.email });
    });
    const totalReaders = readers.length;

    // Mapa: articleId -> Map(userId -> scienceVersion)
    const cienciaByArticle = new Map();
    cienciaSnap.forEach(d => {
        const c = d.data();
        if (!cienciaByArticle.has(c.articleId)) cienciaByArticle.set(c.articleId, new Map());
        cienciaByArticle.get(c.articleId).set(c.userId, c.scienceVersion);
    });

    // Acumulador por pessoa
    const byUser = {};
    readers.forEach(u => { byUser[u.email] = { email: u.email, pending: [] }; });

    const docs = [];
    artigosSnap.forEach(doc => {
        const art = doc.data();
        const version = art.scienceVersion || 1;
        const userMap = cienciaByArticle.get(doc.id) || new Map();
        const pendingEmails = [];
        readers.forEach(u => {
            const v = userMap.get(u.uid);
            if (!v || v < version) {
                pendingEmails.push(u.email);
                if (byUser[u.email]) byUser[u.email].pending.push(art.title);
            }
        });
        docs.push({
            articleId: doc.id,
            title: art.title,
            scienceVersion: version,
            pendingCount: pendingEmails.length,
            readCount: totalReaders - pendingEmails.length,
            pendingEmails
        });
    });

    docs.sort((a, b) => b.pendingCount - a.pendingCount);
    const byUserList = Object.values(byUser)
        .filter(u => u.pending.length > 0)
        .sort((a, b) => b.pending.length - a.pending.length);

    return res.status(200).json({ totalReaders, docs, byUser: byUserList });
}

// --- Gerenciamento da Allowlist (Whitelist) — Admin ---
async function handleGetWhitelist(role, res) {
    if (role !== 'Admin') return res.status(403).json({ error: 'Acesso negado.' });
    const snap = await db.collection('config').doc('allowlist').get();
    const emails = (snap.exists && snap.data().emails) ? snap.data().emails : [];
    // 'bootstrap' são os e-mails fixos do código (sempre permitidos, não removíveis aqui)
    return res.status(200).json({ emails, bootstrap: EMAIL_WHITELIST.map(e => e.toLowerCase()) });
}

async function handleAddWhitelist(payload, role, res) {
    if (role !== 'Admin') return res.status(403).json({ error: 'Acesso negado.' });
    const email = (payload.email || '').trim().toLowerCase();
    if (!email || !email.includes('@')) return res.status(400).json({ error: 'E-mail inválido.' });
    await db.collection('config').doc('allowlist').set(
        { emails: FieldValue.arrayUnion(email) }, { merge: true }
    );
    invalidateAllowlistCache();
    return res.status(200).json({ message: 'E-mail autorizado.' });
}

async function handleRemoveWhitelist(payload, role, res) {
    if (role !== 'Admin') return res.status(403).json({ error: 'Acesso negado.' });
    const email = (payload.email || '').trim().toLowerCase();
    if (!email) return res.status(400).json({ error: 'E-mail é obrigatório.' });
    await db.collection('config').doc('allowlist').set(
        { emails: FieldValue.arrayRemove(email) }, { merge: true }
    );
    invalidateAllowlistCache();
    return res.status(200).json({ message: 'E-mail removido.' });
}

