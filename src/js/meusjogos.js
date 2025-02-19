import { doc, getDoc, onSnapshot, updateDoc  } from "https://www.gstatic.com/firebasejs/9.16.0/firebase-firestore.js";
import { db, auth } from '../../firebaseConfig.js';

// Pegar o ID da campanha da URL
const urlParams = new URLSearchParams(window.location.search);
const campanhaId = urlParams.get('id');

async function verificarAcesso() {
    const user = auth.currentUser;
    if (!user) {
        alert('Você precisa estar logado para acessar esta página.');
        window.location.href = "campanhas.html"; // Redireciona para campanhas se não estiver logado
        return;
    }

    try {
        const campanhaRef = doc(db, 'Campanha', campanhaId);
        const campanhaSnap = await getDoc(campanhaRef);

        if (!campanhaSnap.exists()) {
            alert('Campanha não encontrada.');
            window.location.href = "campanhas.html";
            return;
        }

        const campanha = campanhaSnap.data();

        if (campanha.criador !== user.uid) {
            alert('Apenas o mestre pode acessar esta página.');
            window.location.href = "campanhas.html";
        }
    } catch (error) {
        console.error('Erro ao verificar acesso:', error);
        alert('Erro ao acessar a página.');
        window.location.href = "campanhas.html";
    }
}

// Atualizar o link de convite
document.getElementById('invite-link').value = window.location.href;

// Função para copiar o link
// function copyInviteLink() {
//     const inviteInput = document.getElementById('invite-link');
//     inviteInput.select();
//     document.execCommand("copy");
//     alert("Link copiado!");
// }

function gerarLinkConvite() {
    const inviteLink = `${window.location.origin}/campanhas/meusbandos.html?id=${campanhaId}`;
    document.getElementById('invite-link').value = inviteLink;
}

// Função para carregar personagens em tempo real
async function carregarPersonagens() {
    const personagensLista = document.getElementById("lista-personagens");
    personagensLista.innerHTML = '<p>Carregando personagens...</p>';

    const campanhaRef = doc(db, "Campanha", campanhaId);
    const campanhaSnap = await getDoc(campanhaRef);

    if (!campanhaSnap.exists()) {
        alert("Campanha não encontrada.");
        return;
    }

    const campanhaData = campanhaSnap.data();
    personagensLista.innerHTML = '';

    campanhaData.jogadores.forEach(personagemId => {
        const personagemRef = doc(db, "personagens", personagemId);

        // Monitorar alterações em tempo real no personagem
        onSnapshot(personagemRef, (personagemSnap) => {
            if (!personagemSnap.exists()) return;

            const personagem = personagemSnap.data();
            const { vitalidade, vigor, mao } = personagem.dadosPersonagem || {};

            // Se o personagem já está na tela, apenas atualiza os dados
            let personagemDiv = document.getElementById(`personagem-${personagemId}`);
            if (!personagemDiv) {
                personagemDiv = document.createElement('div');
                personagemDiv.id = `personagem-${personagemId}`;
                personagemDiv.classList.add('character-card');
                personagensLista.appendChild(personagemDiv);
            }

            // Atualizar os dados do personagem
            personagemDiv.innerHTML = `
                <strong>${personagem.dadosPersonagem.nome}</strong>
                <div class="stats">
                    <p>Vida: ${vitalidade?.atual ?? 0} / ${vitalidade?.maximo ?? 0}</p>
                    <p>Estresse: ${vigor?.atual ?? 0} / ${vigor?.maximo ?? 0}</p>
                </div>
                <div class="hand-container">
                    ${mao ? mao.map(carta => `<img src="../src/images/${carta.image}" class="card">`).join('') : '<p>Sem cartas</p>'}
                </div>
            `;
        });
    });
}


// Chamar a função ao carregar a página
auth.onAuthStateChanged(user => {
    if (user) {
        console.log("Usuário autenticado:", user.uid);
        verificarAcesso(user);
        carregarPersonagens();
    } else {
        console.log("Nenhum usuário logado.");
        window.location.href = "campanhas.html";
    }
});

document.addEventListener('DOMContentLoaded', gerarLinkConvite);

// Alternar entre abas
document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', () => {
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));

        button.classList.add('active');
        document.getElementById(button.dataset.tab).classList.add('active');
    });
});

async function carregarRecursosBando() {
    const campanhaRef = doc(db, "Campanha", campanhaId);

    onSnapshot(campanhaRef, (campanhaSnap) => {
        if (!campanhaSnap.exists()) {
            alert("Campanha não encontrada.");
            return;
        }

        const campanha = campanhaSnap.data();

        document.getElementById("bando-nome").textContent = campanha.nome || "Sem nome";
        document.getElementById("bando-bebida").textContent = campanha.bando.recursos.bebida ?? 0;
        document.getElementById("bando-comida").textContent = campanha.bando.recursos.comida ?? 0;
        document.getElementById("bando-material").textContent = campanha.bando.recursos.material ?? 0;

        document.getElementById("bando-caes").textContent = campanha.relacoes.caes ?? 0;
        document.getElementById("bando-comerciantes").textContent = campanha.relacoes.comerciantes ?? 0;
        document.getElementById("bando-independentes").textContent = campanha.relacoes.independentes ?? 0;
        document.getElementById("bando-nomades").textContent = campanha.relacoes.nomades ?? 0;

        // Atualizar lista de membros
        const membrosLista = document.getElementById("bando-membros");
        membrosLista.innerHTML = "";
        campanha.jogadores.forEach(id => {
            const membroItem = document.createElement("li");
            membroItem.textContent = id;  // Aqui você pode buscar mais detalhes do jogador
            membrosLista.appendChild(membroItem);
        });

        // Anotações Gerais
        document.getElementById("bando-anotacoes").value = campanha.bando.anotacaoGeral || "";
    });
}

// Função para salvar anotações gerais
async function salvarAnotacoes() {
    const anotacaoTexto = document.getElementById("bando-anotacoes").value;
    const campanhaRef = doc(db, "Campanha", campanhaId);

    try {
        await updateDoc(campanhaRef, {
            "bando.anotacaoGeral": anotacaoTexto
        });
        alert("Anotações salvas!");
    } catch (error) {
        console.error("Erro ao salvar anotações:", error);
        alert("Erro ao salvar.");
    }
}

// Escutar o botão de salvar anotações
document.getElementById("salvar-anotacoes").addEventListener("click", salvarAnotacoes);

// Monitorar mudanças nos recursos do bando
auth.onAuthStateChanged(user => {
    if (user) {
        carregarRecursosBando();
    } else {
        alert("Você precisa estar logado.");
        window.location.href = "campanhas.html";
    }
});

// Copiar o link para a área de transferência
document.getElementById('copy-invite-btn').addEventListener('click', () => {
    const inviteInput = document.getElementById('invite-link');
    inviteInput.select();
    document.execCommand("copy");
    alert("Link copiado para a área de transferência!");
});

// Chamar a função para exibir o link ao carregar a página
document.addEventListener('DOMContentLoaded', gerarLinkConvite);