import { collection, getDocs, doc, getDoc, updateDoc, arrayUnion, onSnapshot, arrayRemove } from "https://www.gstatic.com/firebasejs/9.16.0/firebase-firestore.js";
import { db, auth } from '../../firebaseConfig.js';

// Pegar o ID da campanha da URL
const urlParams = new URLSearchParams(window.location.search);
const campanhaId = urlParams.get('id');
const membrosLista = document.getElementById("bando-membros");
const nomesFormatados = {
    bebida: "Bebida",
    comida: "Comida",
    material: "Material",
    caes: "Cães",
    comerciantes: "Comerciantes",
    independentes: "Independentes",
    nomades: "Nômades",
    solari: "Solari",
    semluz: "Sem Luz",
    cacadores: "Caçadores"
};

// Modal e botão de adicionar personagem
const modal = document.getElementById("character-modal");
const btnAddCharacter = document.getElementById("btn-add-character");
const closeModal = document.querySelector(".close");

// Abrir e fechar modal
btnAddCharacter.onclick = () => {
    console.log("Botão de adicionar personagem clicado"); // Log para depuração
    carregarPersonagensUsuario(); // Carregar personagens ao abrir o modal
    modal.classList.add("visible");
};
closeModal.onclick = () => {
    console.log("Fechando modal"); // Log para depuração
    modal.classList.remove("visible");
};

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
                // listItem.onclick = () => adicionarPersonagemCampanha(doc.id);
                characterList.appendChild(listItem);


                const buttonM = document.createElement("button");
                buttonM.textContent = "-";
                buttonM.classList.add("adjust-button");
                buttonM.onclick = () => removerPersonagemCampanha(doc.id);

                const buttonP = document.createElement("button");
                buttonP.textContent = "+";
                buttonP.classList.add("adjust-button");
                buttonP.onclick = () => adicionarPersonagemCampanha(doc.id);
        


                listItem.appendChild(buttonP);
                listItem.appendChild(buttonM);
                
                

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

        // alert("Personagem adicionado com sucesso!");
        // modal.style.display = "none";
        carregarPersonagensCampanha();

    } catch (error) {
        console.error("Erro ao adicionar personagem à campanha:", error);
        alert("Erro ao adicionar personagem.");
    }
    modal.classList.remove("visible");
}

async function removerPersonagemCampanha(personagemId) {
    try {
        const campanhaRef = doc(db, "Campanha", campanhaId);
        await updateDoc(campanhaRef, {
            jogadores: arrayRemove(personagemId)
        });

        // alert("Personagem adicionado com sucesso!");
        // modal.style.display = "none";
        carregarPersonagensCampanha();

    } catch (error) {
        console.error("Erro ao remover personagem à campanha:", error);
        alert("Erro ao remover personagem.");
    }
    modal.classList.remove("visible");
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

// Funções para manipular a mão na mesa
let hand = [];

const handElement = document.getElementById('hand');
const sortBySuitButton = document.getElementById('sort-by-suit');
const sortByValueButton = document.getElementById('sort-by-value');

function renderHand() {
    handElement.innerHTML = '';
    hand.forEach((card, index) => {
        console.log(`Renderizando carta: ${card.image}`); // Log para depuração
        const cardElement = document.createElement('div');
        cardElement.className = 'card';
        cardElement.style.backgroundImage = `url(../src/images/${card.image})`;
        cardElement.dataset.index = index;

        handElement.appendChild(cardElement);
    });
}

function sortBySuit() {
    const suitOrder = { 'C': 4, 'H': 3, 'S': 2, 'D': 1 };
    const valueOrder = { 'J': 11, 'Q': 12, 'K': 13, 'A': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'JO': 15 };

    hand.sort((a, b) => {
        if (suitOrder[a.suit] === suitOrder[b.suit]) {
            return valueOrder[a.value] - valueOrder[b.value];
        }
        return suitOrder[a.suit] - suitOrder[b.suit];
    });

    renderHand();
}

function sortByValue() {
    const valueOrder = { 'J': 11, 'Q': 12, 'K': 13, 'A': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'JO': 15 };
    const suitOrder = { 'C': 4, 'H': 3, 'S': 2, 'D': 1 };

    hand.sort((a, b) => {
        if (valueOrder[a.value] === valueOrder[b.value]) {
            return suitOrder[a.suit] - suitOrder[b.suit];
        }
        return valueOrder[a.value] - valueOrder[b.value];
    });

    renderHand();
}

sortBySuitButton.addEventListener('click', sortBySuit);
sortByValueButton.addEventListener('click', sortByValue);

// Aguarda autenticação antes de carregar os personagens e a mão
auth.onAuthStateChanged(user => {
    if (user) {
        carregarPersonagensUsuario();
        carregarPersonagensCampanha();
        // Carregar a mão na mesa
        carregarMaoNaMesa();
    } else {
        alert("Você precisa estar logado.");
        window.location.href = "login.html";
    }
});

function carregarMaoNaMesa() {
    const campanhaRef = doc(db, "Campanha", campanhaId);

    // Monitorar alterações em tempo real na mão da mesa
    onSnapshot(campanhaRef, (campanhaSnap) => {
        if (!campanhaSnap.exists()) {
            alert("Campanha não encontrada.");
            return;
        }

        const campanhaData = campanhaSnap.data();
        hand = campanhaData.mao || [];
        console.log('Mão carregada:', hand); // Log para depuração
        renderHand();
    });
}

// Alternar entre abas
document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', () => {
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));

        button.classList.add('active');
        document.getElementById(button.dataset.tab).classList.add('active');
    });
});

// Função para salvar anotações gerais
async function salvarAnotacoes() {
    const anotacaoTexto = document.getElementById("bando-anotacoes").value;
    const campanhaRef = doc(db, "Campanha", campanhaId);

    try {
        await updateDoc(campanhaRef, {
            "bando.anotacaoGeral": anotacaoTexto
        });
        // alert("Anotações salvas!");
    } catch (error) {
        console.error("Erro ao salvar anotações:", error);
        alert("Erro ao salvar.");
    }
}

async function carregarRecursosReputacoes() {
    if (!campanhaId) {
        console.error("ID da campanha não encontrado na URL.");
        return;
    }

    const campanhaRef = doc(db, "Campanha", campanhaId);



    // Monitorar mudanças em tempo real
    onSnapshot(campanhaRef, (campanhaSnap) => {
        if (!campanhaSnap.exists()) return;
        
        const campanhaData = campanhaSnap.data();

        atualizarLista("resources-list", campanhaData.recursos);
        atualizarLista("relations-list", campanhaData.relacoes);
        document.getElementById("bando-anotacoes").value = campanhaData.bando.anotacaoGeral
        document.getElementById("bando-nome").textContent = campanhaData.nome || "Sem nome";
    });

    
}

function atualizarLista(listaId, dados) {
    const lista = document.getElementById(listaId);
    if (!lista || !dados) return;

    // Ordenar as entradas dos dados com base nas chaves
    const entradasOrdenadas = Object.entries(dados).sort(([keyA], [keyB]) => {
        const nomeA = nomesFormatados[keyA] || keyA;
        const nomeB = nomesFormatados[keyB] || keyB;
        return nomeA.localeCompare(nomeB);
    });

    entradasOrdenadas.forEach(([key, value]) => {
        const nomeExibicao = nomesFormatados[key] || key; // Garantir que usa o nome formatado

        let li = document.getElementById(`item-${key}`);
        if (!li) {
            li = document.createElement("li");
            li.id = `item-${key}`;
            li.classList.add(listaId === "resources-list" ? "resource-item" : "relation-item");

            // Criando os elementos necessários
            const resourceContent = document.createElement("div");
            resourceContent.classList.add("resource-content");

            // Criar o nome do recurso separadamente para manter a formatação
            const nomeElemento = document.createElement("span");
            nomeElemento.classList.add("resource-name");
            nomeElemento.innerHTML = `<strong>${nomeExibicao}</strong>`; // Aqui preservamos a formatação

            const valorElemento = document.createElement("span");
            valorElemento.id = `valor-${key}`;
            valorElemento.textContent = value;

            resourceContent.appendChild(nomeElemento);
            resourceContent.appendChild(document.createTextNode(": ")); // Adiciona separação textual
            resourceContent.appendChild(valorElemento);

            // Criar os botões
            // const buttonGroup = document.createElement("div");
            // buttonGroup.classList.add("button-group");

            // const botaoMenos = document.createElement("button");
            // botaoMenos.classList.add("adjust-button");
            // botaoMenos.textContent = "−";
            // botaoMenos.onclick = () => alterarValor(listaId, key, -1);

            // const botaoMais = document.createElement("button");
            // botaoMais.classList.add("adjust-button");
            // botaoMais.textContent = "+";
            // botaoMais.onclick = () => alterarValor(listaId, key, 1);

            // buttonGroup.appendChild(botaoMenos);
            // buttonGroup.appendChild(botaoMais);

            li.appendChild(resourceContent);
            // li.appendChild(buttonGroup);

            lista.appendChild(li);
        } else {
            // Apenas atualiza o valor sem recriar o item
            const valorElemento = li.querySelector(`#valor-${key}`);
            if (valorElemento && valorElemento.textContent !== value.toString()) {
                valorElemento.textContent = value;
            }

            // Atualizar o nome formatado caso tenha sido alterado
            const nomeElemento = li.querySelector(".resource-name");
            if (nomeElemento && nomeElemento.innerHTML !== `<strong>${nomeExibicao}</strong>`) {
                nomeElemento.innerHTML = `<strong>${nomeExibicao}</strong>`;
            }
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    carregarRecursosReputacoes();
});

function atualizarListaMembros(membros) {
    membrosLista.innerHTML = ""; // Limpa antes de adicionar
    membros.forEach(nome => {
        const li = document.createElement("li");
        li.textContent = nome;

        // Criar botão de remover
        // const removeButton = document.createElement("button");
        // removeButton.textContent = "Remover";
        // removeButton.classList.add("remove-member-btn");
        // removeButton.onclick = () => removerMembro(nome);

        // li.appendChild(removeButton);
        membrosLista.appendChild(li);
    });
}

async function carregarMembros() {
    if (!campanhaId) {
        console.error("ID da campanha não encontrado na URL.");
        return;
    }

    const campanhaRef = doc(db, "Campanha", campanhaId);
    const campanhaSnap = await getDoc(campanhaRef);

    if (!campanhaSnap.exists()) {
        alert("Campanha não encontrada.");
        return;
    }

    const campanhaData = campanhaSnap.data();

    // Se o campo "membros" não existir, buscar os nomes reais e salvar
    if (!campanhaData.membros || campanhaData.membros.length === 0) {
        console.log("Campo 'membros' não encontrado. Criando...");

        // Pegamos os IDs dos jogadores
        const jogadoresIds = campanhaData.jogadores || [];

        if (jogadoresIds.length === 0) {
            console.warn("Nenhum jogador encontrado para adicionar como membro.");
            return;
        }

        // Buscar os nomes reais no Firestore
        const nomesMembros = [];

        for (const personagemId of jogadoresIds) {
            const personagemRef = doc(db, "personagens", personagemId);
            const personagemSnap = await getDoc(personagemRef);

            if (personagemSnap.exists()) {
                const personagemData = personagemSnap.data();
                const nomePersonagem = personagemData.dadosPersonagem?.nome || "Nome Desconhecido";
                nomesMembros.push(nomePersonagem);
            }
        }

        // Criar o campo 'membros' com os nomes reais dos personagens
        await updateDoc(campanhaRef, { membros: nomesMembros });

        // Atualizar a exibição na interface
        atualizarListaMembros(nomesMembros);
        return;
    }

    // Se o campo "membros" já existe, apenas exibir os dados
    atualizarListaMembros(campanhaData.membros);
}

document.addEventListener('DOMContentLoaded', carregarMembros);
document.getElementById("salvar-anotacoes").addEventListener("click", salvarAnotacoes);