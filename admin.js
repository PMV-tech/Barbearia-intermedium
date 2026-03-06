let db = JSON.parse(localStorage.getItem('barbearia_db')) || [];
let filterDate = null;
let currentTab = 'agenda';

function render() {
    const lista = document.getElementById('lista-admin');
    const sel = document.getElementById('msg-destino');
    lista.innerHTML = "";
    if(sel) sel.innerHTML = '<option value="todos">Todos os Clientes</option>';
    let p = 0, c = 0;
    let emailsVistos = [];

    db.forEach(item => {
        if(item.status === 'pendente') p += item.preco; else c += item.preco;
        if(sel && !emailsVistos.includes(item.email)) {
            sel.innerHTML += `<option value="${item.email}">${item.cliente}</option>`;
            emailsVistos.push(item.email);
        }
        const dataBate = filterDate ? item.data === filterDate : true;
        const abaBate = (currentTab === 'agenda' && item.status === 'pendente') || (currentTab === 'historico' && item.status === 'concluido');

        if(dataBate && abaBate) {
            lista.innerHTML += `
            <div class="admin-item">
                <div class="admin-item-header">
                    <div>
                        <strong style="font-size:1.1rem">${item.cliente}</strong><br>
                        <span style="color:var(--gold)">${item.data} - ${item.hora}</span><br>
                        <small style="color:#999">${item.servico}</small>
                    </div>
                    <div style="text-align:right">
                        <span style="font-weight:bold">R$ ${item.preco}</span>
                    </div>
                </div>
                <div class="admin-actions">
                    ${item.status === 'pendente' ? `<button onclick="setStatus(${item.id}, 'concluido')" style="color:var(--success); background:none; border:none; font-weight:bold">Concluir ✓</button>` : ''}
                    <button onclick="excluirAdmin(${item.id})" style="color:var(--danger); background:none; border:none">Remover</button>
                </div>
            </div>`;
        }
    });
    document.getElementById('totalP').innerText = "R$ " + p;
    document.getElementById('totalC').innerText = "R$ " + c;
    renderCalAdmin();
}

function setTab(t) { currentTab = t; document.getElementById('tab-agenda').className = t==='agenda'?'tab-btn active':'tab-btn'; document.getElementById('tab-his').className = t==='historico'?'tab-btn active':'tab-btn'; render(); }
function toggleCalAdmin() { const a = document.getElementById('cal-admin'); a.style.display = a.style.display==='none'?'block':'none'; }
function renderCalAdmin() {
    const g = document.getElementById('grid-admin'); g.innerHTML = "";
    for(let i=1; i<=31; i++) {
        const d = (i<10?'0'+i:i)+'/03/2026';
        g.innerHTML += `<div class="cal-day ${filterDate===d?'selected':''}" onclick="pickDate('${d}')">${i}</div>`;
    }
}
function pickDate(d) { filterDate = filterDate === d ? null : d; render(); }
function setStatus(id, s) { db = db.map(i => i.id === id ? {...i, status:s} : i); localStorage.setItem('barbearia_db', JSON.stringify(db)); render(); }
function excluirAdmin(id) { if(confirm("Deseja apagar este registro?")) { db = db.filter(i => i.id !== id); localStorage.setItem('barbearia_db', JSON.stringify(db)); render(); } }
function openModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }
function closeOutside(e, id) { if(e.target.id === id) closeModal(id); }
function toggleMenu() { document.getElementById('sideMenu').classList.toggle('active'); document.getElementById('menuOverlay').style.display = (document.getElementById('sideMenu').classList.contains('active') ? 'block' : 'none'); }

function baixarRelatorioCSV() {
    let csv = "Cliente;Data;Hora;Servico;Preco;Status\n";
    db.forEach(i => { csv += `${i.cliente};${i.data};${i.hora};${i.servico};${i.preco};${i.status}\n`; });
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "relatorio_barbearia.csv";
    link.click();
}

function enviarNotif() {
    const t = document.getElementById('msg-texto').value;
    const para = document.getElementById('msg-destino').value;
    if(!t) return alert("Digite uma mensagem!");
    const nova = { msg: t, data: new Date().toLocaleDateString() };
    if(para === 'todos') {
        for(let key in localStorage) {
            if(key.startsWith('u_')) {
                let e = key.replace('u_', '');
                let n = JSON.parse(localStorage.getItem('notifs_' + e)) || [];
                n.push(nova);
                localStorage.setItem('notifs_' + e, JSON.stringify(n));
            }
        }
    } else {
        let n = JSON.parse(localStorage.getItem('notifs_' + para)) || [];
        n.push(nova);
        localStorage.setItem('notifs_' + para, JSON.stringify(n));
    }
    alert("Notificação enviada!");
    document.getElementById('msg-texto').value = "";
    closeModal('modalMsg');
}

render();

