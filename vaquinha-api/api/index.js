import { db, auth, FieldValue, SUPER_ADMIN_EMAIL } from './firebaseAdmin.js';

// ===================== HANDLER PRINCIPAL =====================

export default async function handler(req, res) {
    // CORS - necessário porque frontend (GitHub Pages) e API (Vercel) estão em domínios diferentes
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });

    try {
        const { action, payload } = req.body;
        const token = req.headers.authorization?.split('Bearer ')[1];
        if (!token) return res.status(401).json({ error: 'Token não fornecido.' });

        const decoded = await auth.verifyIdToken(token);
        const uid = decoded.uid;
        const email = decoded.email;

        // Login: verifica acesso e retorna/cria perfil
        if (action === 'user/login') {
            return await handleLogin(uid, email, res);
        }

        // Todas as outras ações exigem que o usuário exista em vaq_users
        const userSnap = await db.collection('vaq_users').doc(uid).get();
        if (!userSnap.exists && email !== SUPER_ADMIN_EMAIL) {
            return res.status(403).json({ error: 'Acesso negado. Você não está autorizado.' });
        }
        const role = userSnap.exists ? userSnap.data().role : 'admin'; // super admin

        // ===================== ROTEADOR =====================
        switch (action) {
            // --- Funcionários ---
            case 'func/listar':
                return await handleFuncListar(res);
            case 'func/salvar':
                if (role !== 'admin') return res.status(403).json({ error: 'Apenas admins.' });
                return await handleFuncSalvar(payload, res);
            case 'func/deletar':
                if (role !== 'admin') return res.status(403).json({ error: 'Apenas admins.' });
                return await handleFuncDeletar(payload, res);

            // --- Vaquinhas ---
            case 'vaq/listar':
                return await handleVaqListar(res);
            case 'vaq/detalhe':
                return await handleVaqDetalhe(payload, res);
            case 'vaq/criar':
                if (role !== 'admin') return res.status(403).json({ error: 'Apenas admins.' });
                return await handleVaqCriar(payload, uid, email, res);
            case 'vaq/editar':
                if (role !== 'admin') return res.status(403).json({ error: 'Apenas admins.' });
                return await handleVaqEditar(payload, res);
            case 'vaq/deletar':
                if (role !== 'admin') return res.status(403).json({ error: 'Apenas admins.' });
                return await handleVaqDeletar(payload, res);
            case 'vaq/toggleParticipa':
                if (role !== 'admin') return res.status(403).json({ error: 'Apenas admins.' });
                return await handleVaqToggleParticipa(payload, res);
            case 'vaq/togglePago':
                if (role !== 'admin') return res.status(403).json({ error: 'Apenas admins.' });
                return await handleVaqTogglePago(payload, res);
            case 'vaq/addComprovante':
                if (role !== 'admin') return res.status(403).json({ error: 'Apenas admins.' });
                return await handleVaqAddComprovante(payload, email, res);
            case 'vaq/delComprovante':
                if (role !== 'admin') return res.status(403).json({ error: 'Apenas admins.' });
                return await handleVaqDelComprovante(payload, res);
            case 'vaq/alterarStatus':
                if (role !== 'admin') return res.status(403).json({ error: 'Apenas admins.' });
                return await handleVaqAlterarStatus(payload, res);

            // --- Admin (Usuários) ---
            case 'admin/listarUsuarios':
                if (role !== 'admin') return res.status(403).json({ error: 'Apenas admins.' });
                return await handleAdminListarUsuarios(res);
            case 'admin/addUsuario':
                if (email !== SUPER_ADMIN_EMAIL) return res.status(403).json({ error: 'Apenas super admin.' });
                return await handleAdminAddUsuario(payload, res);
            case 'admin/editarUsuario':
                if (email !== SUPER_ADMIN_EMAIL) return res.status(403).json({ error: 'Apenas super admin.' });
                return await handleAdminEditarUsuario(payload, res);
            case 'admin/removerUsuario':
                if (email !== SUPER_ADMIN_EMAIL) return res.status(403).json({ error: 'Apenas super admin.' });
                return await handleAdminRemoverUsuario(payload, res);

            default:
                return res.status(404).json({ error: `Ação desconhecida: ${action}` });
        }
    } catch (error) {
        console.error('Erro no handler:', error);
        if (error.code === 'auth/id-token-expired') {
            return res.status(401).json({ error: 'Token expirado.' });
        }
        return res.status(500).json({ error: 'Erro interno do servidor.' });
    }
}

// ===================== LOGIN =====================

async function handleLogin(uid, email, res) {
    const userRef = db.collection('vaq_users').doc(uid);
    const userSnap = await userRef.get();

    if (userSnap.exists) {
        const data = userSnap.data();
        await userRef.update({ lastLogin: FieldValue.serverTimestamp() });
        return res.status(200).json({ role: data.role, email: data.email, nome: data.nome || '' });
    }

    // Super admin auto-criado
    if (email === SUPER_ADMIN_EMAIL) {
        const profile = { email, role: 'admin', nome: 'Eduardo', criadoEm: FieldValue.serverTimestamp(), lastLogin: FieldValue.serverTimestamp() };
        await userRef.set(profile);
        return res.status(200).json({ role: 'admin', email, nome: 'Eduardo' });
    }

    // Verifica se o email foi pré-cadastrado (admin adicionou o email antes do primeiro login)
    const preSnap = await db.collection('vaq_users').where('email', '==', email).limit(1).get();
    if (!preSnap.empty) {
        // Migra o doc pré-cadastrado para o UID real
        const preDoc = preSnap.docs[0];
        const preData = preDoc.data();
        await userRef.set({ ...preData, lastLogin: FieldValue.serverTimestamp() });
        if (preDoc.id !== uid) await preDoc.ref.delete();
        return res.status(200).json({ role: preData.role, email: preData.email, nome: preData.nome || '' });
    }

    return res.status(403).json({ error: 'Acesso negado. Peça ao administrador para adicionar seu e-mail.' });
}

// ===================== FUNCIONÁRIOS =====================

async function handleFuncListar(res) {
    const snap = await db.collection('vaq_funcionarios').orderBy('nome').get();
    const list = [];
    snap.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
    return res.status(200).json(list);
}

async function handleFuncSalvar(payload, res) {
    const { id, nome } = payload;
    if (!nome || !nome.trim()) return res.status(400).json({ error: 'Nome é obrigatório.' });

    const data = { nome: nome.trim(), ativo: payload.ativo !== false };

    if (id) {
        await db.collection('vaq_funcionarios').doc(id).update(data);
        return res.status(200).json({ message: 'Funcionário atualizado.' });
    } else {
        data.criadoEm = FieldValue.serverTimestamp();
        const ref = await db.collection('vaq_funcionarios').add(data);
        return res.status(201).json({ message: 'Funcionário criado.', id: ref.id });
    }
}

async function handleFuncDeletar(payload, res) {
    const { id } = payload;
    if (!id) return res.status(400).json({ error: 'ID é obrigatório.' });
    await db.collection('vaq_funcionarios').doc(id).delete();
    return res.status(200).json({ message: 'Funcionário removido.' });
}

// ===================== VAQUINHAS =====================

function recalcularValores(participantes, valorPresente) {
    const qtdParticipa = Object.values(participantes).filter(p => p.participa).length;
    const valorPorPessoa = qtdParticipa > 0 ? Math.round((valorPresente / qtdParticipa) * 100) / 100 : 0;

    for (const key of Object.keys(participantes)) {
        participantes[key].valorAPagar = participantes[key].participa ? valorPorPessoa : 0;
    }
    return participantes;
}

async function handleVaqListar(res) {
    const snap = await db.collection('vaq_vaquinhas').orderBy('criadoEm', 'desc').get();
    const list = [];
    snap.forEach(doc => {
        const d = doc.data();
        const participantes = d.participantes || {};
        const totalParticipa = Object.values(participantes).filter(p => p.participa).length;
        const totalPago = Object.values(participantes).filter(p => p.participa && p.pago).length;
        list.push({
            id: doc.id,
            aniversariante: d.aniversariante,
            valorPresente: d.valorPresente,
            descricaoPresente: d.descricaoPresente || '',
            dataCobranca: d.dataCobranca || '',
            status: d.status,
            totalParticipa,
            totalPago,
            totalFuncionarios: Object.keys(participantes).length
        });
    });
    return res.status(200).json(list);
}

async function handleVaqDetalhe(payload, res) {
    const { id } = payload;
    if (!id) return res.status(400).json({ error: 'ID é obrigatório.' });
    const doc = await db.collection('vaq_vaquinhas').doc(id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Vaquinha não encontrada.' });
    return res.status(200).json({ id: doc.id, ...doc.data() });
}

async function handleVaqCriar(payload, uid, email, res) {
    const { aniversariante, valorPresente, descricaoPresente, dataCobranca } = payload;
    if (!aniversariante || !valorPresente) return res.status(400).json({ error: 'Aniversariante e valor são obrigatórios.' });

    const valor = parseFloat(valorPresente);
    if (isNaN(valor) || valor <= 0) return res.status(400).json({ error: 'Valor inválido.' });

    // Busca todos os funcionários ativos
    const funcSnap = await db.collection('vaq_funcionarios').where('ativo', '==', true).get();
    const participantes = {};
    funcSnap.forEach(doc => {
        const f = doc.data();
        // O aniversariante não participa (não paga o próprio presente)
        const ehAniversariante = f.nome.toLowerCase().trim() === aniversariante.toLowerCase().trim();
        participantes[doc.id] = {
            nome: f.nome,
            participa: !ehAniversariante,
            pago: false,
            valorAPagar: 0
        };
    });

    recalcularValores(participantes, valor);

    const vaquinha = {
        aniversariante: aniversariante.trim(),
        valorPresente: valor,
        descricaoPresente: (descricaoPresente || '').trim(),
        dataCobranca: dataCobranca || '',
        status: 'aberta',
        criadoPor: uid,
        criadoPorEmail: email,
        criadoEm: FieldValue.serverTimestamp(),
        participantes,
        comprovantes: []
    };

    const ref = await db.collection('vaq_vaquinhas').add(vaquinha);
    return res.status(201).json({ message: 'Vaquinha criada!', id: ref.id });
}

async function handleVaqEditar(payload, res) {
    const { id, aniversariante, valorPresente, descricaoPresente, dataCobranca } = payload;
    if (!id) return res.status(400).json({ error: 'ID é obrigatório.' });

    const docRef = db.collection('vaq_vaquinhas').doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ error: 'Vaquinha não encontrada.' });

    const updates = {};
    if (aniversariante !== undefined) updates.aniversariante = aniversariante.trim();
    if (descricaoPresente !== undefined) updates.descricaoPresente = descricaoPresente.trim();
    if (dataCobranca !== undefined) updates.dataCobranca = dataCobranca;

    if (valorPresente !== undefined) {
        const valor = parseFloat(valorPresente);
        if (isNaN(valor) || valor <= 0) return res.status(400).json({ error: 'Valor inválido.' });
        updates.valorPresente = valor;

        // Recalcula valores com novo preço
        const data = doc.data();
        const participantes = data.participantes || {};
        recalcularValores(participantes, valor);
        updates.participantes = participantes;
    }

    await docRef.update(updates);
    return res.status(200).json({ message: 'Vaquinha atualizada.' });
}

async function handleVaqDeletar(payload, res) {
    const { id } = payload;
    if (!id) return res.status(400).json({ error: 'ID é obrigatório.' });
    await db.collection('vaq_vaquinhas').doc(id).delete();
    return res.status(200).json({ message: 'Vaquinha removida.' });
}

async function handleVaqToggleParticipa(payload, res) {
    const { vaquinhaId, funcionarioId } = payload;
    if (!vaquinhaId || !funcionarioId) return res.status(400).json({ error: 'IDs obrigatórios.' });

    const docRef = db.collection('vaq_vaquinhas').doc(vaquinhaId);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ error: 'Vaquinha não encontrada.' });

    const data = doc.data();
    const p = data.participantes || {};
    if (!p[funcionarioId]) return res.status(404).json({ error: 'Funcionário não encontrado nesta vaquinha.' });

    p[funcionarioId].participa = !p[funcionarioId].participa;
    if (!p[funcionarioId].participa) p[funcionarioId].pago = false;

    recalcularValores(p, data.valorPresente);
    await docRef.update({ participantes: p });

    return res.status(200).json({ message: 'Participação atualizada.', participantes: p });
}

async function handleVaqTogglePago(payload, res) {
    const { vaquinhaId, funcionarioId } = payload;
    if (!vaquinhaId || !funcionarioId) return res.status(400).json({ error: 'IDs obrigatórios.' });

    const docRef = db.collection('vaq_vaquinhas').doc(vaquinhaId);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ error: 'Vaquinha não encontrada.' });

    const data = doc.data();
    const p = data.participantes || {};
    if (!p[funcionarioId]) return res.status(404).json({ error: 'Funcionário não encontrado nesta vaquinha.' });
    if (!p[funcionarioId].participa) return res.status(400).json({ error: 'Funcionário não participa desta vaquinha.' });

    p[funcionarioId].pago = !p[funcionarioId].pago;
    await docRef.update({ participantes: p });

    return res.status(200).json({ message: 'Pagamento atualizado.', participantes: p });
}

async function handleVaqAddComprovante(payload, email, res) {
    const { vaquinhaId, url, nome } = payload;
    if (!vaquinhaId || !url) return res.status(400).json({ error: 'ID e URL são obrigatórios.' });

    const docRef = db.collection('vaq_vaquinhas').doc(vaquinhaId);
    const comprovante = {
        url,
        nome: nome || 'Comprovante',
        uploadadoEm: new Date().toISOString(),
        uploadadoPor: email
    };

    await docRef.update({ comprovantes: FieldValue.arrayUnion(comprovante) });
    return res.status(200).json({ message: 'Comprovante adicionado.' });
}

async function handleVaqDelComprovante(payload, res) {
    const { vaquinhaId, comprovante } = payload;
    if (!vaquinhaId || !comprovante) return res.status(400).json({ error: 'Dados obrigatórios.' });

    const docRef = db.collection('vaq_vaquinhas').doc(vaquinhaId);
    await docRef.update({ comprovantes: FieldValue.arrayRemove(comprovante) });
    return res.status(200).json({ message: 'Comprovante removido.' });
}

async function handleVaqAlterarStatus(payload, res) {
    const { id, status } = payload;
    if (!id || !['aberta', 'fechada'].includes(status)) return res.status(400).json({ error: 'ID e status válido são obrigatórios.' });
    await db.collection('vaq_vaquinhas').doc(id).update({ status });
    return res.status(200).json({ message: `Vaquinha ${status === 'fechada' ? 'fechada' : 'reaberta'}.` });
}

// ===================== ADMIN - USUÁRIOS =====================

async function handleAdminListarUsuarios(res) {
    const snap = await db.collection('vaq_users').get();
    const list = [];
    snap.forEach(doc => {
        const d = doc.data();
        list.push({ id: doc.id, email: d.email, role: d.role, nome: d.nome || '' });
    });
    return res.status(200).json(list);
}

async function handleAdminAddUsuario(payload, res) {
    const { email, role, nome } = payload;
    if (!email) return res.status(400).json({ error: 'E-mail é obrigatório.' });

    // Verifica se já existe
    const existing = await db.collection('vaq_users').where('email', '==', email).limit(1).get();
    if (!existing.empty) return res.status(400).json({ error: 'Usuário já cadastrado.' });

    const data = {
        email: email.trim().toLowerCase(),
        role: role || 'user',
        nome: (nome || '').trim(),
        criadoEm: FieldValue.serverTimestamp()
    };

    // Tenta encontrar o UID no Firebase Auth
    try {
        const userRecord = await auth.getUserByEmail(email.trim().toLowerCase());
        await db.collection('vaq_users').doc(userRecord.uid).set(data);
    } catch {
        // Usuário ainda não logou no Firebase Auth - cria com ID temporário
        await db.collection('vaq_users').add(data);
    }

    return res.status(201).json({ message: 'Usuário adicionado.' });
}

async function handleAdminEditarUsuario(payload, res) {
    const { id, role, nome } = payload;
    if (!id) return res.status(400).json({ error: 'ID é obrigatório.' });

    const updates = {};
    if (role !== undefined) updates.role = role;
    if (nome !== undefined) updates.nome = nome.trim();

    await db.collection('vaq_users').doc(id).update(updates);
    return res.status(200).json({ message: 'Usuário atualizado.' });
}

async function handleAdminRemoverUsuario(payload, res) {
    const { id } = payload;
    if (!id) return res.status(400).json({ error: 'ID é obrigatório.' });

    // Não permite remover o super admin
    const doc = await db.collection('vaq_users').doc(id).get();
    if (doc.exists && doc.data().email === SUPER_ADMIN_EMAIL) {
        return res.status(400).json({ error: 'Não é possível remover o super admin.' });
    }

    await db.collection('vaq_users').doc(id).delete();
    return res.status(200).json({ message: 'Usuário removido.' });
}
