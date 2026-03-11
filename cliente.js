// Configuração inicial
let user = null;
let db = [];

// Função para verificar se o usuário está logado
async function checkLogin() {
    // Verifica sessão no Supabase
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (session) {
        // Busca dados completos do usuário
        const { data: userData, error: userError } = await supabase
            .from('usuarios')
            .select('*')
            .eq('email', session.user.email)
            .single();
            
        if (!userError && userData) {
            user = userData;
            start();
        }
    }
    
    // Verifica email lembrado no localStorage
    const remembered = localStorage.getItem('remember_email');
    if (remembered && !user) {
        document.getElementById('l-email').value = remembered;
        document.getElementById('l-remember').checked = true;
    }
}

// Função de login
async function login() {
    const email = document.getElementById('l-email').value;
    const password = document.getElementById('l-pass').value;
    const remember = document.getElementById('l-remember').checked;

    try {
        // Login no Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (authError) throw authError;

        // Busca dados do usuário na tabela 'usuarios'
        const { data: userData, error: userError } = await supabase
            .from('usuarios')
            .select('*')
            .eq('email', email)
            .single();

        if (userError) throw userError;

        // Login admin (mantido para compatibilidade)
        if (email === 'admin@admin.com' && password === 'admin') {
            return window.location.href = 'admin.html';
        }

        if (userData) {
            user = userData;
            
            // Salva no localStorage como cache
            localStorage.setItem('saas_user', JSON.stringify(user));
            if (remember) {
                localStorage.setItem('remember_email', email);
            } else {
                localStorage.removeItem('remember_email');
            }
            
            start();
        }
    } catch (error) {
        console.error('Erro no login:', error);
        alert('E-mail ou senha incorretos!');
    }
}

// Função de cadastro
async function cadastrar() {
    const nome = document.getElementById('r-nome').value;
    const email = document.getElementById('r-email').value;
    const senha = document.getElementById('r-pass').value;
    const cabelo = document.getElementById('r-cabelo').value;

    if (!nome || !email || !senha) {
        return alert('Preencha todos os campos!');
    }

    try {
        // Cria usuário no Auth do Supabase
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: email,
            password: senha,
            options: {
                data: {
                    nome: nome,
                    cabelo: cabelo
                }
            }
        });

        if (authError) throw authError;

        // Insere dados adicionais na tabela 'usuarios'
        const { error: userError } = await supabase
            .from('usuarios')
            .insert([
                {
                    email: email,
                    nome: nome,
                    cabelo: cabelo,
                    created_at: new Date()
                }
            ]);

        if (userError) throw userError;

        alert('Cadastro realizado com sucesso!');
        toggleAuth(false);
        
        // Limpa o formulário
        document.getElementById('r-nome').value = '';
        document.getElementById('r-email').value = '';
        document.getElementById('r-pass').value = '';
        
    } catch (error) {
        console.error('Erro no cadastro:', error);
        alert('Erro ao cadastrar. Tente novamente.');
    }
}

// Inicia a aplicação após login
function start() {
    document.getElementById('authScreen').style.display = 'none';
    document.getElementById('mainContent').style.display = 'block';
    document.getElementById('heroNome').innerText = 'OLÁ, ' + user.nome.split(' ')[0].toUpperCase();
    document.getElementById('menuNome').innerText = user.nome;
    document.getElementById('p-email').value = user.email;
    document.getElementById('p-nome').value = user.nome;
    document.getElementById('p-cabelo').value = user.cabelo || 'Liso';
    carregarAgendamentos();
    renderNotifs();
}

// Carrega agendamentos do Supabase
async function carregarAgendamentos() {
    try {
        const { data: agendamentos, error } = await supabase
            .from('agendamentos')
            .select('*')
            .eq('email', user.email)
            .order('data', { ascending: false });

        if (error) throw error;
        
        db = agendamentos || [];
        renderMeus();
    } catch (error) {
        console.error('Erro ao carregar agendamentos:', error);
        db = [];
    }
}

// Função de agendamento
async function agendar() {
    const data = document.getElementById('data-ag').value;
    const hora = document.getElementById('hora-ag').value;
    const servicoSelect = document.getElementById('servico-ag');
    const servico = servicoSelect.options[servicoSelect.selectedIndex].text;
    const preco = parseFloat(servicoSelect.value);
    const editId = document.getElementById('edit-id').value;

    if (data.length < 10) {
        return alert('Por favor, selecione uma data!');
    }

    const agendamento = {
        cliente: user.nome,
        email: user.email,
        data: data,
        hora: hora,
        servico: servico,
        preco: preco,
        status: 'pendente',
        created_at: new Date()
    };

    try {
        if (editId) {
            // Atualiza agendamento existente
            const { error } = await supabase
                .from('agendamentos')
                .update(agendamento)
                .eq('id', parseInt(editId));

            if (error) throw error;
        } else {
            // Cria novo agendamento
            const { error } = await supabase
                .from('agendamentos')
                .insert([agendamento]);

            if (error) throw error;
        }

        alert('Horário agendado com sucesso!');
        closeModal('modalAgendar');
        carregarAgendamentos();
    } catch (error) {
        console.error('Erro ao agendar:', error);
        alert('Erro ao agendar. Tente novamente.');
    }
}

// Editar agendamento
async function editarAgendamento(id) {
    const agendamento = db.find(a => a.id === id);
    if (agendamento) {
        document.getElementById('ag-titulo').innerText = "Editar Agendamento";
        document.getElementById('edit-id').value = id;
        document.getElementById('data-ag').value = agendamento.data;
        document.getElementById('nome-ag').value = user.nome;
        
        // Preenche a hora
        const hSel = document.getElementById('hora-ag');
        hSel.innerHTML = "";
        for (let i = 8; i <= 19; i++) {
            const option = document.createElement('option');
            option.value = `${i}:00`;
            option.text = `${i}:00`;
            if (agendamento.hora === `${i}:00`) {
                option.selected = true;
            }
            hSel.appendChild(option);
        }
        
        // Preenche o serviço
        const servicoSelect = document.getElementById('servico-ag');
        for (let i = 0; i < servicoSelect.options.length; i++) {
            if (servicoSelect.options[i].text === agendamento.servico) {
                servicoSelect.selectedIndex = i;
                break;
            }
        }
        
        openModal('modalAgendar');
    }
}

// Excluir agendamento
async function excluirCorte(id) {
    if (confirm('Tem certeza que deseja cancelar este agendamento?')) {
        try {
            const { error } = await supabase
                .from('agendamentos')
                .delete()
                .eq('id', id);

            if (error) throw error;

            alert('Agendamento cancelado com sucesso!');
            carregarAgendamentos();
        } catch (error) {
            console.error('Erro ao cancelar:', error);
            alert('Erro ao cancelar agendamento.');
        }
    }
}

// Renderiza lista de agendamentos do usuário
function renderMeus() {
    const div = document.getElementById('listaMeusCortes');
    const meus = db || [];
    
    div.innerHTML = meus.length ? '' : '<p style="text-align:center; color:#666">Você ainda não tem agendamentos.</p>';
    
    meus.forEach(i => {
        div.innerHTML += `
        <div style="background:#222; padding:15px; border-radius:10px; margin-bottom:12px; border-left:4px solid var(--gold)">
            <div style="display:flex; justify-content:space-between; align-items:flex-start">
                <div>
                    <strong>${i.data} às ${i.hora}</strong><br>
                    <small style="color:#999">${i.servico}</small>
                </div>
                <span style="font-size:0.7rem; background:#333; padding:2px 6px; border-radius:4px">${i.status.toUpperCase()}</span>
            </div>
            ${i.status === 'pendente' ? `
            <div style="margin-top:15px; display:flex; gap:20px">
                <button onclick="editarAgendamento(${i.id})" style="color:var(--gold); background:none; border:none; font-size:0.9rem">EDITAR</button>
                <button onclick="excluirCorte(${i.id})" style="color:var(--danger); background:none; border:none; font-size:0.9rem">CANCELAR</button>
            </div>` : ''}
        </div>`;
    });
}

// Notificações
async function renderNotifs() {
    try {
        const { data: notifs, error } = await supabase
            .from('notificacoes')
            .select('*')
            .eq('email', user.email)
            .order('data', { ascending: false });

        if (error) throw error;

        const div = document.getElementById('listaNotificacoes');
        const badge = document.getElementById('notifBadge');
        
        badge.style.display = notifs?.length ? 'inline-block' : 'none';
        badge.innerText = notifs?.length || 0;
        
        div.innerHTML = notifs?.length ? '' : '<p style="text-align:center; color:#666">Nenhuma notificação nova.</p>';
        
        notifs?.forEach((n, idx) => {
            div.innerHTML += `
            <div class="notif-item">
                <input type="checkbox" class="n-check" data-id="${n.id}">
                <div class="notif-content">
                    <small style="color:var(--gold)">${new Date(n.data).toLocaleDateString()}</small><br>${n.msg}
                </div>
            </div>`;
        });
    } catch (error) {
        console.error('Erro ao carregar notificações:', error);
    }
}

async function limparNotificacoes() {
    const checks = document.querySelectorAll('.n-check:checked');
    const idsParaRemover = [];
    
    checks.forEach(c => {
        if (c.dataset.id) {
            idsParaRemover.push(parseInt(c.dataset.id));
        }
    });

    if (idsParaRemover.length === 0) {
        return alert('Selecione as notificações para apagar.');
    }

    try {
        const { error } = await supabase
            .from('notificacoes')
            .delete()
            .in('id', idsParaRemover);

        if (error) throw error;

        renderNotifs();
    } catch (error) {
        console.error('Erro ao apagar notificações:', error);
        alert('Erro ao apagar notificações.');
    }
}

// Atualizar perfil
async function salvarPerfil() {
    const novoNome = document.getElementById('p-nome').value;
    const novaSenha = document.getElementById('p-pass').value;
    const tipoCabelo = document.getElementById('p-cabelo').value;

    if (!novoNome) {
        return alert('O nome é obrigatório!');
    }

    try {
        // Atualiza dados na tabela usuarios
        const { error: userError } = await supabase
            .from('usuarios')
            .update({ 
                nome: novoNome,
                cabelo: tipoCabelo
            })
            .eq('email', user.email);

        if (userError) throw userError;

        // Atualiza senha se fornecida
        if (novaSenha) {
            const { error: passError } = await supabase.auth.updateUser({
                password: novaSenha
            });

            if (passError) throw passError;
        }

        // Atualiza objeto local
        user.nome = novoNome;
        user.cabelo = tipoCabelo;
        
        localStorage.setItem('saas_user', JSON.stringify(user));
        
        alert('Perfil atualizado com sucesso!');
        closeModal('modalPerfil');
        location.reload();
        
    } catch (error) {
        console.error('Erro ao atualizar perfil:', error);
        alert('Erro ao atualizar perfil. Tente novamente.');
    }
}

// Logout
async function logout() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        
        localStorage.removeItem('saas_user');
        location.reload();
    } catch (error) {
        console.error('Erro ao fazer logout:', error);
    }
}

// Funções auxiliares
function openNewModal() {
    document.getElementById('ag-titulo').innerText = "Agendar Horário";
    document.getElementById('edit-id').value = "";
    document.getElementById('data-ag').value = "";
    document.getElementById('nome-ag').value = user.nome;
    
    const hSel = document.getElementById('hora-ag');
    hSel.innerHTML = "";
    for (let i = 8; i <= 19; i++) {
        hSel.innerHTML += `<option value="${i}:00">${i}:00</option>`;
    }
    
    openModal('modalAgendar');
}

function toggleMenu() { 
    const m = document.getElementById('sideMenu');
    m.classList.toggle('active');
    document.getElementById('menuOverlay').style.display = m.classList.contains('active') ? 'block' : 'none';
}

function toggleCalCliente() {
    const p = document.getElementById('pop-cal-cliente');
    p.style.display = p.style.display === 'none' ? 'block' : 'none';
    
    const g = document.getElementById('grid-cliente');
    g.innerHTML = "";
    
    // Calendário simplificado para março 2026
    for (let i = 1; i <= 31; i++) {
        const d = (i < 10 ? '0' + i : i) + '/03/2026';
        g.innerHTML += `<div class="cal-day" onclick="document.getElementById('data-ag').value='${d}'; toggleCalCliente()">${i}</div>`;
    }
}

function openModal(id) { 
    document.getElementById(id).style.display = 'flex'; 
    if (id === 'modalMeusCortes') carregarAgendamentos();
}

function closeModal(id) { 
    document.getElementById(id).style.display = 'none'; 
}

function closeOutside(e, id) { 
    if (e.target.id === id) closeModal(id); 
}

function toggleAuth(showReg) { 
    document.getElementById('loginBox').style.display = showReg ? 'none' : 'block';
    document.getElementById('regBox').style.display = showReg ? 'block' : 'none';
}

function toggleView(id, el) { 
    const input = document.getElementById(id); 
    input.type = input.type === 'password' ? 'text' : 'password'; 
    el.classList.toggle('fa-eye-slash'); 
}

// Formatação da data
document.getElementById('data-ag').addEventListener('input', (e) => {
    let v = e.target.value.replace(/\D/g, '');
    if (v.length > 2) v = v.substring(0,2) + '/' + v.substring(2);
    if (v.length > 5) v = v.substring(0,5) + '/' + v.substring(5,9);
    e.target.value = v;
});
