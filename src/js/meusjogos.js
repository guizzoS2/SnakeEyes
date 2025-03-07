import { doc, getDoc, onSnapshot, updateDoc, addDoc, collection, deleteDoc } from "https://www.gstatic.com/firebasejs/9.16.0/firebase-firestore.js";
import { db, auth } from '../../firebaseConfig.js';

let deck = [];
let discardPile = [];
let hand = [];

const deckElement = document.getElementById('deck');
const discardPileElement = document.getElementById('discard-pile');
const handElement = document.getElementById('hand');
const restartButton = document.getElementById('restart-button');
const deckCountElement = document.getElementById('deck-count');

const sortBySuitButton = document.getElementById('sort-by-suit');
const sortByValueButton = document.getElementById('sort-by-value');

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

// Função para atualizar a lista no HTML
function atualizarListaMembros(membros) {
    membrosLista.innerHTML = ""; // Limpa antes de adicionar
    membros.forEach(nome => {
        const li = document.createElement("li");
        li.textContent = nome;

        // Criar botão de remover
        const removeButton = document.createElement("button");
        removeButton.textContent = "Remover";
        removeButton.classList.add("remove-member-btn");
        removeButton.onclick = () => removerMembro(nome);

        li.appendChild(removeButton);
        membrosLista.appendChild(li);
    });
}

async function removerMembro(nome) {
    const campanhaRef = doc(db, "Campanha", campanhaId);
    const campanhaSnap = await getDoc(campanhaRef);

    if (!campanhaSnap.exists()) {
        alert("Campanha não encontrada.");
        return;
    }

    const campanhaData = campanhaSnap.data();
    const membros = campanhaData.membros || [];

    // Remover o membro da lista
    const novoMembros = membros.filter(membro => membro !== nome);

    // Atualizar o campo 'membros' no Firestore
    await updateDoc(campanhaRef, { membros: novoMembros });

    // Atualizar a exibição na interface
    atualizarListaMembros(novoMembros);
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
            const buttonGroup = document.createElement("div");
            buttonGroup.classList.add("button-group");

            const botaoMenos = document.createElement("button");
            botaoMenos.classList.add("adjust-button");
            botaoMenos.textContent = "−";
            botaoMenos.onclick = () => alterarValor(listaId, key, -1);

            const botaoMais = document.createElement("button");
            botaoMais.classList.add("adjust-button");
            botaoMais.textContent = "+";
            botaoMais.onclick = () => alterarValor(listaId, key, 1);

            buttonGroup.appendChild(botaoMenos);
            buttonGroup.appendChild(botaoMais);

            li.appendChild(resourceContent);
            li.appendChild(buttonGroup);

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

async function alterarValor(listaId, campo, incremento) {
    if (!campanhaId) return;

    const campanhaRef = doc(db, "Campanha", campanhaId);
    const campanhaSnap = await getDoc(campanhaRef);

    if (!campanhaSnap.exists()) return;

    const campanhaData = campanhaSnap.data();
    const categoria = listaId === "resources-list" ? "recursos" : "relacoes";

    // Se o campo ainda não existir no Firestore, cria ele com um valor inicial
    if (!campanhaData[categoria]) {
        campanhaData[categoria] = {};
    }

    // Novo valor ajustado
    const novoValor = (campanhaData[categoria][campo] || 0) + incremento;

    // Atualizar Firebase
    await updateDoc(campanhaRef, {
        [`${categoria}.${campo}`]: novoValor
    });

    // Atualizar a interface localmente sem recarregar a lista
    const valorElemento = document.getElementById(`valor-${campo}`);
    if (valorElemento) {
        valorElemento.textContent = novoValor;
    }
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

// Função para carregar inimigos
async function carregarInimigos() {
    const enemyList = document.getElementById("enemy-list");
    if (!enemyList) {
        console.error("Element with ID 'enemy-list' not found.");
        return;
    }

    enemyList.innerHTML = '<p>Carregando inimigos...</p>';

    const campanhaRef = doc(db, "Campanha", campanhaId);
    const campanhaSnap = await getDoc(campanhaRef);

    if (!campanhaSnap.exists()) {
        alert("Campanha não encontrada.");
        return;
    }

    const campanhaData = campanhaSnap.data();
    const inimigos = campanhaData.inimigos || [];

    enemyList.innerHTML = '';
    inimigos.forEach((enemy, index) => {
        const healthPercentage = (enemy.vidaAtual / enemy.vidaMaxima) * 100;
        const enemyItem = document.createElement('li');
        enemyItem.innerHTML = `
            <span>${enemy.nome}</span>
            <div class="status-bar">
                <button class="minus-btn health-minus" data-index="${index}">-</button>
                <div class="fill health-bar">
                    <div class="health-fill" style="width: ${healthPercentage}%;"></div>
                    <div class="text health-value">${enemy.vidaAtual} / ${enemy.vidaMaxima}</div>
                </div>
                <button class="plus-btn health-plus" data-index="${index}">+</button>
            </div>
            <div>
                <button class="view-button" data-index="${index}">Ver</button>
                <button class="delete-button" data-index="${index}">Remover</button>
            </div>
        `;
        enemyList.appendChild(enemyItem);
    });

    // Add event listeners to the buttons
    document.querySelectorAll('.view-button').forEach(button => {
        button.addEventListener('click', (event) => {
            const index = event.target.dataset.index;
            const enemy = inimigos[index];
            document.getElementById('view-enemy-name').value = enemy.nome;
            document.getElementById('edit-enemy-current-health').value = enemy.vidaAtual;
            document.getElementById('edit-enemy-max-health').value = enemy.vidaMaxima;
            document.getElementById('edit-enemy-damage').value = enemy.dano;
            document.getElementById('edit-enemy-defense').value = enemy.defesa;
            document.getElementById('edit-enemy-movement').value = enemy.movimento;
            document.getElementById('edit-enemy-description').value = enemy.descricao;
            document.getElementById('edit-enemy-skills').value = enemy.habilidades;

            // Update the health bar
            const healthFill = document.createElement('div');
            healthFill.className = 'health-fill';
            healthFill.style.width = `${(enemy.vidaAtual / enemy.vidaMaxima) * 100}%`;
            const healthBar = document.getElementById('view-enemy-health-bar');
            healthBar.innerHTML = '';
            healthBar.appendChild(healthFill);

            // Show the modal
            document.getElementById('view-enemy-modal').classList.add('visible');

            // Save changes
            document.getElementById('save-enemy-changes-btn').addEventListener('click', async () => {
                const updatedEnemy = {
                    nome: document.getElementById('view-enemy-name').value,
                    vidaMaxima: parseInt(document.getElementById('edit-enemy-max-health').value),
                    vidaAtual: parseInt(document.getElementById('edit-enemy-current-health').value),
                    dano: document.getElementById('edit-enemy-damage').value,
                    defesa: document.getElementById('edit-enemy-defense').value,
                    movimento: document.getElementById('edit-enemy-movement').value,
                    descricao: document.getElementById('edit-enemy-description').value,
                    habilidades: document.getElementById('edit-enemy-skills').value
                };

                inimigos[index] = updatedEnemy;

                try {
                    await updateDoc(campanhaRef, { inimigos });
                    document.getElementById('view-enemy-modal').classList.remove('visible');
                    carregarInimigos(); // Reload the enemy list
                } catch (error) {
                    console.error("Erro ao atualizar inimigo:", error);
                    alert("Erro ao atualizar inimigo.");
                }
            });
        });
    });

    document.querySelectorAll('.delete-button').forEach(button => {
        button.addEventListener('click', async (event) => {
            const index = event.target.dataset.index;
            inimigos.splice(index, 1);
            await updateDoc(campanhaRef, { inimigos });
            carregarInimigos(); // Reload the enemy list
        });
    });

    document.querySelectorAll('.health-minus').forEach(button => {
        button.addEventListener('click', async (event) => {
            const index = event.target.dataset.index;
            if (inimigos[index].vidaAtual > 0) {
                inimigos[index].vidaAtual -= 1;
                await updateDoc(campanhaRef, { inimigos });
                carregarInimigos(); // Reload the enemy list
            }
        });
    });

    document.querySelectorAll('.health-plus').forEach(button => {
        button.addEventListener('click', async (event) => {
            const index = event.target.dataset.index;
            if (inimigos[index].vidaAtual < inimigos[index].vidaMaxima) {
                inimigos[index].vidaAtual += 1;
                await updateDoc(campanhaRef, { inimigos });
                carregarInimigos(); // Reload the enemy list
            }
        });
    });
}

// Fechar o modal de visualização de inimigos
document.getElementById('close-view-enemy-modal-btn').addEventListener('click', () => {
    document.getElementById('view-enemy-modal').classList.remove('visible');
});

// Função para salvar novo inimigo
async function salvarInimigo() {
    const nome = document.getElementById("enemy-name").value;
    const vidaMaxima = parseInt(document.getElementById("enemy-max-health").value);
    const vidaAtual = parseInt(document.getElementById("enemy-current-health").value);
    const dano = document.getElementById("enemy-damage").value;
    const defesa = document.getElementById("enemy-defense").value;
    const movimento = document.getElementById("enemy-movement").value;
    const descricao = document.getElementById("enemy-description").value;
    const habilidades = document.getElementById("enemy-skills").value;

    if (isNaN(vidaMaxima) || isNaN(vidaAtual)) {
        alert("Por favor, insira valores válidos para vida.");
        return;
    }

    const campanhaRef = doc(db, "Campanha", campanhaId);
    const campanhaSnap = await getDoc(campanhaRef);

    if (!campanhaSnap.exists()) {
        alert("Campanha não encontrada.");
        return;
    }

    const campanhaData = campanhaSnap.data();
    const inimigos = campanhaData.inimigos || [];

    inimigos.push({
        nome,
        vidaMaxima,
        vidaAtual,
        dano,
        defesa,
        movimento,
        descricao,
        habilidades
    });

    try {
        await updateDoc(campanhaRef, { inimigos });
        alert("Inimigo salvo com sucesso!");
        document.getElementById('add-enemy-modal').classList.remove('visible');
        carregarInimigos(); // Recarregar a lista de inimigos
    } catch (error) {
        console.error("Erro ao salvar inimigo:", error);
        alert("Erro ao salvar inimigo.");
    }
}

// Escutar o botão de salvar inimigo
document.getElementById("save-enemy-btn").addEventListener("click", salvarInimigo);

// Abrir e fechar modal de adicionar inimigo
document.getElementById("add-enemy-btn").addEventListener("click", () => {
    document.getElementById('add-enemy-modal').classList.add('visible');
});
document.getElementById("close-enemy-modal-btn").addEventListener("click", () => {
    document.getElementById('add-enemy-modal').classList.remove('visible');
});

// Chamar a função ao carregar a página
document.addEventListener('DOMContentLoaded', carregarInimigos);

// Chamar a função ao carregar a página
document.addEventListener('DOMContentLoaded', async () => {
    if (!campanhaId) {
        console.error("campanhaId não encontrado na URL.");
        return;
    }

    // Carrega as cartas do banco e inicializa a interface
    await carregarCartasDoBanco(campanhaId);

    if (deck.length === 0 && hand.length === 0 && discardPile.length === 0) {
        initializeDeck(campanhaId);
    }

    renderDeck();
    renderHand();
    renderDiscardPile();

    // Event listeners
    handElement.addEventListener('dragover', (event) => {
        event.preventDefault(); 
    });

    handElement.addEventListener('drop', (event) => {
        event.preventDefault();

        const fromIndex = event.dataTransfer.getData('text/plain'); 
        const toElement = event.target.closest('.card'); 
        if (!toElement) return;

        const toIndex = toElement.dataset.index; 

        // Trocar as posições das cartas no array
        const [movedCard] = hand.splice(fromIndex, 1);
        hand.splice(toIndex, 0, movedCard); 

        renderHand();
    });

    discardPileElement.addEventListener('dragover', (event) => {
        event.preventDefault(); 
    });

    discardPileElement.addEventListener('drop', (event) => {
        event.preventDefault();

        const cardIndex = event.dataTransfer.getData('text/plain');
        const card = hand.splice(cardIndex, 1)[0];
        discardCard(card, campanhaId);  // Passa o campanhaId
        renderHand(); 
    });

    deckElement.addEventListener('click', () => drawCard(campanhaId));
    restartButton.addEventListener('click', () => restartGame(campanhaId));

    sortBySuitButton.addEventListener('click', sortBySuit);
    sortByValueButton.addEventListener('click', sortByValue);

    document.getElementById('discard-pile').addEventListener('click', openDiscardModal);
    document.getElementById('close-modal').addEventListener('click', closeDiscardModal);

    // Fecha o modal ao pressionar ESC
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeDiscardModal();
        }
    });

    discardPileElement.addEventListener('contextmenu', (event) => {
        event.preventDefault(); 
        if (discardPile.length > 0) {
            returnCardFromDiscard();
        }
    });
});

// Função para carregar as cartas do banco
async function carregarCartasDoBanco(campanhaId) {
    try {
        const campanhaRef = doc(db, "Campanha", campanhaId);
        const campanhaSnapshot = await getDoc(campanhaRef);

        if (campanhaSnapshot.exists()) {
            const campanhaData = campanhaSnapshot.data();
            deck = campanhaData.deck || [];
            discardPile = campanhaData.descarte || [];
            hand = campanhaData.mao || [];
        } else {
            console.error("Campanha não encontrada.");
        }
    } catch (error) {
        console.error("Erro ao carregar cartas do banco:", error);
    }
}

// Função para atualizar no Firestore
async function atualizarCartasNoBanco(campanhaId) {
    try {
        const campanhaRef = doc(db, "Campanha", campanhaId);
        await updateDoc(campanhaRef, {
            deck: deck,
            descarte: discardPile,
            mao: hand
        });
        console.log("Cartas atualizadas no banco com sucesso.");
    } catch (error) {
        console.error("Erro ao atualizar as cartas no banco:", error);
    }
}

function initializeDeck(campanhaId) {
    const suits = ['S', 'H', 'D', 'C'];  // Espadas, Copas, Ouros, Paus
    const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

    deck = [];
    for (let suit of suits) {
        for (let value of values) {
            deck.push({ value, suit, image: `cards/${value}-${suit}.png` });
        }
    }

    // Adiciona os curingas
    deck.push({ value: 'JO', suit: 'B', image: 'cards/J-B.png' });
    deck.push({ value: 'JO', suit: 'R', image: 'cards/J-R.png' });

    shuffleDeck();  // Embaralha o deck inicial
    renderDeck();  // Renderiza no DOM
    atualizarCartasNoBanco(campanhaId);  // Salva no banco
}

function shuffleDeck() {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
}

function drawCard(campanhaId) {
    if (deck.length > 0) {
        const card = deck.pop();
        hand.push(card);
        renderHand();
        renderDeck();
        updateDeckCount();
        atualizarCartasNoBanco(campanhaId);  // Atualiza no banco
    } else {
        alert('O baralho está vazio!');
    }
}

function discardCard(card, campanhaId) {
    const cardIndex = hand.indexOf(card);
    if (cardIndex > -1) {
        hand.splice(cardIndex, 1);
        discardPile.push(card);
        atualizarCartasNoBanco(campanhaId);  // Atualiza no banco
    }
    renderDiscardPile();
    renderHand();
}

function returnCardFromDiscard() {
    if (discardPile.length > 0) {
        const card = discardPile.pop();
        hand.push(card);
        renderDiscardPile();
        renderHand();
        atualizarCartasNoBanco(campanhaId);  // Atualiza no banco
    }
}

function renderDeck() {
    deckElement.innerHTML = `<span id="deck-count" class="tooltip">${deck.length}</span>`;
}

function renderHand() {
    handElement.innerHTML = '';
    hand.forEach((card, index) => {
        const cardElement = document.createElement('div');
        cardElement.className = 'card';
        cardElement.style.backgroundImage = `url(../src/images/${card.image})`;
        cardElement.dataset.index = index;

        // Evento de clique com o botão direito do mouse para descartar a carta
        cardElement.addEventListener('contextmenu', (event) => {
            event.preventDefault();
            discardCard(card, campanhaId);
        });

        handElement.appendChild(cardElement);
    });
}

function renderDiscardPile() {
    discardPileElement.innerHTML = '';
    if (discardPile.length > 0) {
        const card = discardPile[discardPile.length - 1];
        const cardElement = document.createElement('div');
        cardElement.className = 'card';
        cardElement.style.backgroundImage = `url(../src/images/${card.image})`;
        discardPileElement.appendChild(cardElement);
    }
}

function updateDeckCount() {
    deckCountElement.textContent = deck.length;
}

function restartGame(campanhaId) {
    deck = [];
    discardPile = [];
    hand = [];
    initializeDeck(campanhaId);
    renderHand();
    renderDiscardPile();
    atualizarCartasNoBanco(campanhaId);  // Atualiza no banco
}

function sortBySuit() {
    const suitOrder = { 'C': 4, 'H': 3, 'S': 2, 'D': 1 };  // Paus > Copas > Espadas > Ouros
    const valueOrder = { 'J': 11, 'Q': 12, 'K': 13, 'A': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'JO': 15 };

    hand.sort((a, b) => {
        if (suitOrder[a.suit] === suitOrder[b.suit]) {
            return valueOrder[a.value] - valueOrder[b.value];
        }
        return suitOrder[a.suit] - suitOrder[b.suit];
    });

    renderHand();  // Atualiza a interface com as cartas ordenadas
}

function sortByValue() {
    const valueOrder = { 'J': 11, 'Q': 12, 'K': 13, 'A': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'JO': 15 };
    const suitOrder = { 'C': 4, 'H': 3, 'S': 2, 'D': 1 };  // Paus > Copas > Espadas > Ouros

    hand.sort((a, b) => {
        if (valueOrder[a.value] === valueOrder[b.value]) {
            return suitOrder[a.suit] - suitOrder[b.suit];
        }
        return valueOrder[a.value] - valueOrder[b.value];
    });

    renderHand();  // Atualiza a interface com as cartas ordenadas
}

function openDiscardModal() {
    const modal = document.getElementById('discard-modal');
    const discardedCardsElement = document.getElementById('discarded-cards');

    discardedCardsElement.innerHTML = '';
    discardPile.forEach((card, index) => {
        const cardElement = document.createElement('div');
        cardElement.className = 'card';
        cardElement.style.backgroundImage = `url(../src/images/${card.image})`;

        // Evento de clique com o botão direito do mouse para retornar a carta à mão
        cardElement.addEventListener('contextmenu', (event) => {
            event.preventDefault();
            returnCardFromDiscard();
            if (discardPile.length === 0) {
                closeDiscardModal();
            }
        });

        discardedCardsElement.appendChild(cardElement);
    });

    // Fechar o modal automaticamente se não tiver cartas
    if (discardPile.length === 0) {
        closeDiscardModal();
        return;
    }

    // Exibe o modal
    modal.classList.remove('hidden');
    modal.classList.add('visible');
}

function closeDiscardModal() {
    const modal = document.getElementById('discard-modal');
    modal.classList.remove('visible');
    modal.classList.add('hidden');
}

document.addEventListener('DOMContentLoaded', gerarLinkConvite);
document.addEventListener('DOMContentLoaded', carregarMembros);
document.addEventListener('DOMContentLoaded', carregarRecursosReputacoes);

document.getElementById('add-member-btn').addEventListener('click', () => {
    document.getElementById('add-member-modal').classList.add('visible');
});

document.getElementById('close-modal-btn').addEventListener('click', () => {
    document.getElementById('add-member-modal').classList.remove('visible');
});

document.getElementById('save-member-btn').addEventListener('click', async () => {
    const newMemberName = document.getElementById('new-member-name').value.trim();
    if (!newMemberName) {
        alert('Por favor, insira um nome.');
        return;
    }

    const campanhaRef = doc(db, "Campanha", campanhaId);
    const campanhaSnap = await getDoc(campanhaRef);

    if (!campanhaSnap.exists()) {
        alert("Campanha não encontrada.");
        return;
    }

    const campanhaData = campanhaSnap.data();
    const membros = campanhaData.membros || [];

    // Adicionar o novo membro à lista
    membros.push(newMemberName);

    // Atualizar o campo 'membros' no Firestore
    await updateDoc(campanhaRef, { membros });

    // Atualizar a exibição na interface
    atualizarListaMembros(membros);

    // Fechar o modal e limpar o campo de entrada
    document.getElementById('add-member-modal').classList.remove('visible');
    document.getElementById('new-member-name').value = '';
});

document.getElementById('editar-nome-bando').addEventListener('click', async () => {
    const bandoNomeElement = document.getElementById('bando-nome');
    const inputNomeBando = document.getElementById('input-nome-bando');
    const editButton = document.getElementById('editar-nome-bando');

    if (inputNomeBando.style.display === 'none') {
        // Entrar no modo de edição
        inputNomeBando.value = bandoNomeElement.textContent;
        bandoNomeElement.style.display = 'none';
        inputNomeBando.style.display = 'inline-block';
        editButton.textContent = '💾';
    } else {
        // Salvar o novo nome do bando
        const novoNomeBando = inputNomeBando.value.trim();
        if (novoNomeBando) {
            const campanhaRef = doc(db, "Campanha", campanhaId);
            try {
                await updateDoc(campanhaRef, { nome: novoNomeBando });
                bandoNomeElement.textContent = novoNomeBando;
                alert('Nome do bando atualizado com sucesso!');
            } catch (error) {
                console.error('Erro ao atualizar o nome do bando:', error);
                alert('Erro ao atualizar o nome do bando.');
            }
        }

        // Sair do modo de edição
        bandoNomeElement.style.display = 'inline';
        inputNomeBando.style.display = 'none';
        editButton.textContent = '✏️';
    }
});

window.alterarValor = alterarValor;
document.getElementById("salvar-anotacoes").addEventListener("click", salvarAnotacoes);