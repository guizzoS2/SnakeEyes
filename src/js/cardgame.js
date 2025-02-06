import { db } from '../../firebaseConfig.js';
import { doc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.16.0/firebase-firestore.js";

let deck = [];
let discardPile = [];
let hand = [];

// const suitOrder = { 'C': 4, 'H': 3, 'S': 2, 'D': 1 };  // Paus > Copas > Espadas > Ouros
// const valueOrder = { 'J': 11, 'Q': 12, 'K': 13, 'A': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'JO': 15 };


const deckElement = document.getElementById('deck');
const discardPileElement = document.getElementById('discard-pile');
const handElement = document.getElementById('hand');
const restartButton = document.getElementById('restart-button');
const deckCountElement = document.getElementById('deck-count');

const sortBySuitButton = document.getElementById('sort-by-suit');
const sortByValueButton = document.getElementById('sort-by-value');

const urlParams = new URLSearchParams(window.location.search);
const personagemId = urlParams.get('id');

document.addEventListener('DOMContentLoaded', async () => {
    if (!personagemId) {
        console.error("personagemId não encontrado na URL.");
        return;
    }

    // Carrega as cartas do banco e inicializa a interface
    await carregarCartasDoBanco(personagemId);

    if (deck.length === 0 && hand.length === 0 && discardPile.length === 0) {
        initializeDeck(personagemId);
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
        discardCard(card, personagemId);  // Passa o personagemId
        renderHand(); 
    });

    deckElement.addEventListener('click', () => drawCard(personagemId));
    restartButton.addEventListener('click', () => restartGame(personagemId));

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
            const card = discardPile.pop();
            hand.push(card); 
            renderHand(); 
            renderDiscardPile();
            atualizarCartasNoBanco(personagemId);  // Atualiza o banco ao mover carta de volta para a mão
        }
    });
});


// Função para carregar as cartas do banco
async function carregarCartasDoBanco(personagemId) {
    try {
        const personagemRef = doc(db, "personagens", personagemId);
        const personagemSnapshot = await getDoc(personagemRef);

        if (personagemSnapshot.exists()) {
            const dadosPersonagem = personagemSnapshot.data().dadosPersonagem;
            deck = dadosPersonagem.deck || [];
            discardPile = dadosPersonagem.descarte || [];
            hand = dadosPersonagem.mao || [];
        } else {
            console.error("Personagem não encontrado.");
        }
    } catch (error) {
        console.error("Erro ao carregar cartas do banco:", error);
    }
}

// Função para atualizar no Firestore
async function atualizarCartasNoBanco(personagemId) {
    try {
        const personagemRef = doc(db, "personagens", personagemId);
        await updateDoc(personagemRef, {
            'dadosPersonagem.deck': deck,
            'dadosPersonagem.descarte': discardPile,
            'dadosPersonagem.mao': hand
        });
        console.log("Cartas atualizadas no banco com sucesso.");
    } catch (error) {
        console.error("Erro ao atualizar as cartas no banco:", error);
    }
}

function initializeDeck(personagemId) {
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
    atualizarCartasNoBanco(personagemId);  // Salva no banco
}

function shuffleDeck() {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
}

function drawCard(personagemId) {
    if (deck.length > 0) {
        const card = deck.pop();
        hand.push(card);
        renderHand();
        renderDeck();
        updateDeckCount();
        atualizarCartasNoBanco(personagemId);  // Atualiza no banco
    } else {
        alert('O baralho está vazio!');
    }
}

function discardCard(card, personagemId) {
    const cardIndex = hand.indexOf(card);
    if (cardIndex > -1) {
        hand.splice(cardIndex, 1);
        discardPile.push(card);
        atualizarCartasNoBanco(personagemId);  // Atualiza no banco
    }
    renderDiscardPile();
    renderHand();
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
            const [removedCard] = hand.splice(index, 1);  // Remove a carta da mão
            discardPile.push(removedCard);  // Adiciona ao descarte
            renderHand();  // Atualiza a mão
            renderDiscardPile();  // Atualiza o descarte
            atualizarCartasNoBanco(personagemId);  // Atualiza no banco
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
        
        cardElement.addEventListener('contextmenu', (event) => {
            event.preventDefault();
            discardPile.pop();
            hand.push(card);
            renderHand();
            renderDiscardPile();
            atualizarCartasNoBanco(personagemId);  // Atualiza no banco
        });
        
        discardPileElement.appendChild(cardElement);
    }
}

function updateDeckCount() {
    deckCountElement.textContent = deck.length;
}

function restartGame(personagemId) {
    deck = [];
    discardPile = [];
    hand = [];
    initializeDeck(personagemId);
    renderHand();
    renderDiscardPile();
    atualizarCartasNoBanco(personagemId);  // Atualiza no banco
}

function dragStart(event) {
    const cardIndex = event.target.dataset.index;
    event.dataTransfer.setData('text/plain', cardIndex);
    const card = event.target;
    card.style.transition = "transform 0.2s ease, box-shadow 0.2s ease";
    card.style.transform = "scale(1.1)";
    card.style.boxShadow = "0 5px 15px rgba(0, 0, 0, 0.3)";
    card.style.zIndex = "1000"; 
}

function dragEnd(event) {
    const card = event.target;
    card.style.transform = "scale(1)";
    card.style.boxShadow = "none";
    card.style.zIndex = "0";
    card.style.transition = "";
}

function sortBySuit() {
    const suitOrder = { 'C': 4, 'H': 3, 'S': 2, 'D': 1 };  // Paus > Copas > Espadas > Ouros
    const valueOrder = { 'J': 11, 'Q': 12, 'K': 13, 'A': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'JO': 15 };

    hand.sort((a, b) => {
        // Curingas têm prioridade máxima
        if (a.value === 'JO' && b.value !== 'JO') return -1; // Curinga vem antes
        if (b.value === 'JO' && a.value !== 'JO') return 1;  // Curinga vem antes

        // Se ambos são curingas, ordena preto (B) antes de vermelho (R)
        if (a.value === 'JO' && b.value === 'JO') {
            if (a.suit === 'B') return -1; // Curinga preto vem antes
            if (b.suit === 'B') return 1;  // Curinga preto vem antes
        }

        // Para cartas normais, ordena primeiro por naipe, depois por valor
        const suitDifference = suitOrder[b.suit] - suitOrder[a.suit];
        if (suitDifference !== 0) return suitDifference;

        return valueOrder[b.value] - valueOrder[a.value];
    });

    renderHand();  // Atualiza a interface com as cartas ordenadas
}

function sortByValue() {
    const valueOrder = { 'J': 11, 'Q': 12, 'K': 13, 'A': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'JO': 15 };
    const suitOrder = { 'C': 4, 'H': 3, 'S': 2, 'D': 1 };  // Paus > Copas > Espadas > Ouros

    hand.sort((a, b) => {
        // Curingas têm prioridade máxima
        if (a.value === 'JO' && b.value !== 'JO') return -1; // Curinga vem antes
        if (b.value === 'JO' && a.value !== 'JO') return 1;  // Curinga vem antes

        // Se ambos são curingas, ordena preto (B) antes de vermelho (R)
        if (a.value === 'JO' && b.value === 'JO') {
            if (a.suit === 'B') return -1; // Curinga preto vem antes
            if (b.suit === 'B') return 1;  // Curinga preto vem antes
        }

        // Para cartas normais, ordena primeiro por valor, depois por naipe
        const valueDifference = valueOrder[b.value] - valueOrder[a.value];
        if (valueDifference !== 0) return valueDifference;

        return suitOrder[b.suit] - suitOrder[a.suit];
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


        cardElement.addEventListener('contextmenu', (event) => {
            event.preventDefault(); 
            const [removedCard] = discardPile.splice(index, 1); 
            hand.push(removedCard);
            renderHand(); 
            renderDiscardPile(); 
            atualizarCartasNoBanco(personagemId);  // Atualiza no banco

            if (discardPile.length === 0) {
                closeDiscardModal();
            } else {
                openDiscardModal();
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
