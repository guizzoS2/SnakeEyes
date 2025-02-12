import { doc, getDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/9.16.0/firebase-firestore.js";
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
function copyInviteLink() {
    const inviteInput = document.getElementById('invite-link');
    inviteInput.select();
    document.execCommand("copy");
    alert("Link copiado!");
}

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
