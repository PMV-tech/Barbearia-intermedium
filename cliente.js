let db = JSON.parse(localStorage.getItem('barbearia_db')) || [];
let user = JSON.parse(localStorage.getItem('saas_user')) || null;

function checkLogin() {
    const remembered = localStorage.getItem('remember_email');
    if(remembered && !user) {
        document.getElementById('l-email').value = remembered;
        document.getElementById('l-remember').checked = true;
    }
    if(user) start();
}

function login() {
    const e = document.getElementById('l-email').value, p = document.getElementById('l-pass').value;
    const remember = document.getElementById('l-remember').checked;

    if(e === 'admin@admin.com' && p === 'admin') return window.location.href = 'admin.html';
    
    const saved = JSON.parse(localStorage.getItem('u_' + e));
    if(saved && saved.senha === p) {
        user = saved;
        localStorage.setItem('saas_user', JSON.stringify(user));
        if(remember) localStorage.setItem('remember_email', e); 
        else localStorage.removeItem('remember_email');
        start();
    } else alert("E-mail ou senha incorretos!");
}

function start() {
    document.getElementById('authScreen').style.display = 'none';
    document.getElementById('mainContent').style.display = 'block';
    document.getElementById('heroNome').innerText = 'OLÁ, ' + user.nome.toUpperCase();
    document.getElementById('menuNome').innerText = user.nome;
    document.getElementById('p-email').value = user.email;
    document.getElementById('p-nome').value = user.nome;
    document.getElementById('p-cabelo').value = user.cabelo || 'Liso';
    renderNotifs();
}

function salvarPerfil() {
    const novoNome = document.getElementById('p-nome').value;
    const novoCabelo = document.getElementById('p-cabelo').value;
    const novaSenha = document.getElementById('p-pass').value;
    if(!novoNome) return alert("O nome não pode ser vazio!");
    user.nome = novoNome;
    user.cabelo = novoCabelo;
    if(novaSenha) user.senha = novaSenha;
    localStorage.setItem('u_' + user.email, JSON.stringify(user));
    localStorage.setItem('saas_user', JSON.stringify(user));
    alert("Perfil atualizado!");
    location.reload();
}

function renderNotifs() {
    const notifs = JSON.parse(localStorage.getItem('notifs_' + user.email)) || [];
    const div = document.getElementById('listaNotificacoes');
    const badge = document.getElementById('notifBadge');
    badge.style.display = notifs.length ? 'inline-block' : 'none';
    badge.innerText = notifs.length;
    div.innerHTML = notifs.length ? '' : '<p>Nenhuma notificação.</p>';
    notifs.forEach((n, idx) => {
        div.innerHTML += `
        <div class="notif-item">
            <input type="checkbox" class="n-check">
            <div class="notif-content">
                <strong>${n.data}</strong><br>${n.msg}
            </div>
        </div>`;
    });
}

function limparNotificacoes() {
    let notifs = JSON.parse(localStorage.getItem('notifs_' + user.email)) || [];
    const checks = document.querySelectorAll('.n-check');
    let novos = [];
    checks.forEach((c, i) => { if(!c.checked) novos.push(notifs[i]); });
    localStorage.setItem('notifs_' + user.email, JSON.stringify(novos));
    renderNotifs();
}

function openNewModal() {
    document.getElementById('ag-titulo').innerText = "Agendar";
    document.getElementById('edit-id').value = "";
    document.getElementById('data-ag').value = "";
    document.getElementById('nome-ag').value = user.nome;
    const hSel = document.getElementById('hora-ag'); hSel.innerHTML = "";
    for(let i=8; i<=19; i++) hSel.innerHTML += `<option value="${i}:00">${i}:00</option>`;
    openModal('modalAgendar');
}

function agendar() {
    const d = document.getElementById('data-ag').value;
    const eid = document.getElementById('edit-id').value;
    if(d.length < 10) return alert("Data inválida!");
    const ag = {
        id: eid ? parseInt(eid) : Date.now(),
        cliente: user.nome, email: user.email,
        data: d, hora: document.getElementById('hora-ag').value,
        servico: document.getElementById('servico-ag').options[document.getElementById('servico-ag').selectedIndex].text,
        preco: parseFloat(document.getElementById('servico-ag').value),
        status: 'pendente'
    };
    if(eid) db = db.map(i => i.id === ag.id ? ag : i); else db.push(ag);
    localStorage.setItem('barbearia_db', JSON.stringify(db));
    alert("Confirmado!");
    closeModal('modalAgendar');
    renderMeus();
}

function renderMeus() {
    const div = document.getElementById('listaMeusCortes');
    const meus = db.filter(i => i.email === user.email);
    div.innerHTML = meus.length ? '' : '<p>Sem agendamentos.</p>';
    meus.reverse().forEach(i => {
        div.innerHTML += `
        <div style="background:#222; padding:12px; border-radius:8px; margin-bottom:8px; border-left:4px solid var(--gold)">
            <strong>${i.data} - ${i.hora}</strong><br>${i.servico}<br>
            <div style="margin-top:10px">
                <button onclick="editarAgendamento(${i.id})" style="color:var(--gold); background:none; border:none; cursor:pointer">EDITAR</button>
                <button onclick="excluirCorte(${i.id})" style="color:var(--danger); background:none; border:none; cursor:pointer; margin-left:15px">EXCLUIR</button>
            </div>
        </div>`;
    });
}

function editarAgendamento(id) {
    const item = db.find(x => x.id === id);
    if(!item) return;
    openNewModal();
    document.getElementById('ag-titulo').innerText = "Editar Horário";
    document.getElementById('edit-id').value = item.id;
    document.getElementById('data-ag').value = item.data;
    document.getElementById('hora-ag').value = item.hora;
    closeModal('modalMeusCortes');
}

function excluirCorte(id) {
    if(!confirm("Excluir?")) return;
    db = db.filter(i => i.id !== id);
    localStorage.setItem('barbearia_db', JSON.stringify(db));
    renderMeus();
}

function toggleMenu() { 
    const m = document.getElementById('sideMenu');
    m.classList.toggle('active');
    document.getElementById('menuOverlay').style.display = m.classList.contains('active') ? 'block' : 'none';
}

function toggleCalCliente() {
    const p = document.getElementById('pop-cal-cliente');
    p.style.display = p.style.display === 'none' ? 'block' : 'none';
    const g = document.getElementById('grid-cliente'); g.innerHTML = "";
    for(let i=1; i<=31; i++) {
        const d = (i<10?'0'+i:i)+'/03/2026';
        g.innerHTML += `<div class="cal-day" onclick="document.getElementById('data-ag').value='${d}'; toggleCalCliente()">${i}</div>`;
    }
}

function cadastrar() {
    const n = document.getElementById('r-nome').value, e = document.getElementById('r-email').value, p = document.getElementById('r-pass').value, c = document.getElementById('r-cabelo').value;
    if(!n || !e || !p) return alert("Erro!");
    localStorage.setItem('u_' + e, JSON.stringify({ nome: n, email: e, senha: p, cabelo: c }));
    alert("Cadastrado!");
    toggleAuth(false);
}

function openModal(id) { document.getElementById(id).style.display = 'flex'; if(id==='modalMeusCortes') renderMeus(); }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }
function closeOutside(e, id) { if(e.target.id === id) closeModal(id); }
function toggleAuth(r) { document.getElementById('loginBox').style.display = r?'none':'block'; document.getElementById('regBox').style.display = r?'block':'none'; }
function logout() { localStorage.removeItem('saas_user'); location.reload(); }
function toggleView(id, el) { const i = document.getElementById(id); i.type = i.type==='password'?'text':'password'; el.classList.toggle('fa-eye-slash'); }

document.getElementById('data-ag').addEventListener('input', (e) => {
    let v = e.target.value.replace(/\D/g, '');
    if (v.length > 2) v = v.substring(0,2) + '/' + v.substring(2);
    if (v.length > 5) v = v.substring(0,5) + '/' + v.substring(5,9);
    e.target.value = v;
});