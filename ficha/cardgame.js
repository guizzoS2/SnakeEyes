document.addEventListener('DOMContentLoaded', () => {
    const deckElement = document.getElementById('deck');
    const discardPileElement = document.getElementById('discard-pile');
    const handElement = document.getElementById('hand');
    const restartButton = document.getElementById('restart-button');
    const deckCountElement = document.getElementById('deck-count');

    let deck = [];
    let discardPile = [];
    let hand = [];

    // Inicializa o baralho com 52 cartas + 2 curingas
    function initializeDeck() {
        const suits = ['S', 'H', 'D', 'C']; // Espadas, Copas, Ouros, Paus
        const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        deck = [];
        for (let suit of suits) {
            for (let value of values) {
                deck.push({ value, suit, image: `cards/${value}-${suit}.png` });
            }
        }
        // Adiciona os curingas
        deck.push({ value: 'J', suit: 'B', image: 'cards/J-B.png' }); // Curinga Preto
        deck.push({ value: 'J', suit: 'R', image: 'cards/J-R.png' }); // Curinga Vermelho
        shuffleDeck();
        renderDeck();
        updateDeckCount();
    }

    function shuffleDeck() {
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
    }

    function renderDeck() {
        deckElement.innerHTML = '<span id="deck-count" class="tooltip">' + deck.length + '</span>';
    }

    function updateDeckCount() {
        deckCountElement.textContent = deck.length;
    }

    function renderHand() {
        handElement.innerHTML = '';
        hand.forEach((card, index) => {
            const cardElement = document.createElement('div');
            cardElement.className = 'card';
            cardElement.style.backgroundImage = `url(../images/${card.image})`;
            cardElement.draggable = true;
            cardElement.dataset.index = index; 
    
            cardElement.addEventListener('dragstart', dragStart);
            cardElement.addEventListener('dragend', dragEnd);
    
            cardElement.addEventListener('mouseover', () => {
                cardElement.style.transform = "translateY(-15px)";
                cardElement.style.transition = "transform 0.3s ease";
            });
            cardElement.addEventListener('mouseleave', () => {
                cardElement.style.transform = "translateY(0)";
            });
    
            cardElement.addEventListener('contextmenu', (event) => {
                event.preventDefault(); 
                const [removedCard] = hand.splice(index, 1);
                discardCard(removedCard); 
                renderHand(); 
                renderDiscardPile(); 
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
            cardElement.style.backgroundImage = `url(../images/${card.image})`;
            discardPileElement.appendChild(cardElement);
        }
    }

    function drawCard() {
        if (deck.length > 0) {
            const card = deck.pop();
            hand.push(card);
            renderHand();
            renderDeck();
            updateDeckCount();
        } else {
            alert('O baralho está vazio!');
        }
    }

    function discardCard(card) {
        discardPile.push(card);
        renderDiscardPile();
    }

    function restartGame() {
        deck = [];
        discardPile = [];
        hand = [];
        initializeDeck();
        renderHand();
        renderDiscardPile();
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
        const suitOrder = { 'C': 4, 'H': 3, 'S': 2, 'D': 1 }; // Paus > Copas > Espadas > Ouros
        const valueOrder = { 'J': 11, 'Q': 12, 'K': 13, 'A': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'B': 15, 'R': 15 }; // Jokers maiores
    
        hand.sort((a, b) => {
            // Primeiro compara pelo naipe
            const suitDifference = suitOrder[b.suit] - suitOrder[a.suit];
            if (suitDifference !== 0) return suitDifference;
    
            // Depois compara pelo valor
            return valueOrder[b.value] - valueOrder[a.value];
        });
    
        renderHand();
    }
    
    function sortByValue() {
        const valueOrder = { 'J': 11, 'Q': 12, 'K': 13, 'A': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'B': 15, 'R': 15 }; // Jokers maiores
        const suitOrder = { 'C': 4, 'H': 3, 'S': 2, 'D': 1 }; // Paus > Copas > Espadas > Ouros
    
        hand.sort((a, b) => {
            // Primeiro compara pelo valor
            const valueDifference = valueOrder[b.value] - valueOrder[a.value];
            if (valueDifference !== 0) return valueDifference;
    
            // Depois compara pelo naipe
            return suitOrder[b.suit] - suitOrder[a.suit];
        });
    
        renderHand();
    }

    function openDiscardModal() {
        const modal = document.getElementById('discard-modal');
        const discardedCardsElement = document.getElementById('discarded-cards');
    
        discardedCardsElement.innerHTML = '';
        discardPile.forEach((card, index) => {
            const cardElement = document.createElement('div');
            cardElement.className = 'card';
            cardElement.style.backgroundImage = `url(../images/${card.image})`;
    

            cardElement.addEventListener('contextmenu', (event) => {
                event.preventDefault(); 
                const [removedCard] = discardPile.splice(index, 1); 
                hand.push(removedCard);
                renderHand(); 
                renderDiscardPile(); 
    
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
        discardCard(card); 
        renderHand(); 
    });

    deckElement.addEventListener('click', drawCard);
    restartButton.addEventListener('click', restartGame);

    const sortBySuitButton = document.getElementById('sort-by-suit');
    const sortByValueButton = document.getElementById('sort-by-value');

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
        }
    });

    initializeDeck();
});
