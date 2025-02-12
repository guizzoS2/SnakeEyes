// Aqui podemos adicionar mais funcionalidades no futuro para carregar informações da campanha
import { collection, getDocs, doc, getDoc, updateDoc, arrayUnion, onSnapshot } from "https://www.gstatic.com/firebasejs/9.16.0/firebase-firestore.js";
import { db, auth } from '../../firebaseConfig.js';

// Pegar o ID da campanha da URL
const urlParams = new URLSearchParams(window.location.search);
const campanhaId = urlParams.get('id');

// document.getElementById('campanha-id').innerText = `ID da Campanha: ${campanhaId}`;

// Modal e botão de adicionar personagem
const modal = document.getElementById("character-modal");
const btnAddCharacter = document.getElementById("btn-add-character");
const closeModal = document.querySelector(".close");

// Abrir e fechar modal
btnAddCharacter.onclick = () => modal.style.display = "block";
closeModal.onclick = () => modal.style.display = "none";

// Carregar os personagens disponíveis do usuário
async function carregarPersonagensUsuario() {
    const user = auth.currentUser;
    if (!user) {
        alert("Você precisa estar logado para adicionar um personagem.");
        return;
    }

    const characterList = document.getElementById("character-list");
    characterList.innerHTML = '<p>Carregando personagens...</p>';

    try {
        const querySnapshot = await getDocs(collection(db, "personagens"));
        characterList.innerHTML = '';

        querySnapshot.forEach((doc) => {
            const personagem = doc.data();
            
            if (personagem.userId === user.uid) {
                const listItem = document.createElement("li");
                listItem.textContent = personagem.dadosPersonagem.nome;
                listItem.onclick = () => adicionarPersonagemCampanha(doc.id);
                characterList.appendChild(listItem);
            }
        });

    } catch (error) {
        console.error("Erro ao carregar personagens:", error);
    }
}

// Adicionar personagem à campanha
async function adicionarPersonagemCampanha(personagemId) {
    try {
        const campanhaRef = doc(db, "Campanha", campanhaId);
        await updateDoc(campanhaRef, {
            jogadores: arrayUnion(personagemId)
        });

        alert("Personagem adicionado com sucesso!");
        modal.style.display = "none";
        carregarPersonagensCampanha();

    } catch (error) {
        console.error("Erro ao adicionar personagem à campanha:", error);
        alert("Erro ao adicionar personagem.");
    }
}

// Carregar os personagens da campanha
async function carregarPersonagensCampanha() {
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

// Aguarda autenticação antes de carregar os personagens
auth.onAuthStateChanged(user => {
    if (user) {
        carregarPersonagensUsuario();
        carregarPersonagensCampanha();
    } else {
        alert("Você precisa estar logado.");
        window.location.href = "login.html";
    }
});
