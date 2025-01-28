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

    // Embaralha o baralho
    function shuffleDeck() {
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
    }

    // Renderiza o baralho na tela
    function renderDeck() {
        deckElement.innerHTML = '<span id="deck-count" class="tooltip">' + deck.length + '</span>';
    }

    // Atualiza o contador de cartas no baralho
    function updateDeckCount() {
        deckCountElement.textContent = deck.length;
    }

    // Renderiza a mão do jogador
    function renderHand() {
        handElement.innerHTML = '';
        hand.forEach((card, index) => {
            const cardElement = document.createElement('div');
            cardElement.className = 'card';
            cardElement.style.backgroundImage = `url(${card.image})`;
            cardElement.draggable = true;
            cardElement.dataset.index = index; // Armazena o índice da carta
    
            // Adiciona eventos de drag
            cardElement.addEventListener('dragstart', dragStart);
            cardElement.addEventListener('dragend', dragEnd);
    
            // Adiciona eventos de hover
            cardElement.addEventListener('mouseover', () => {
                cardElement.style.transform = "translateY(-15px)";
                cardElement.style.transition = "transform 0.3s ease";
            });
            cardElement.addEventListener('mouseleave', () => {
                cardElement.style.transform = "translateY(0)";
            });
    
            // Adiciona evento de botão direito (contextmenu) para enviar ao lixo
            cardElement.addEventListener('contextmenu', (event) => {
                event.preventDefault(); // Evita o menu padrão do botão direito
                const [removedCard] = hand.splice(index, 1); // Remove a carta da mão
                discardCard(removedCard); // Envia ao lixo
                renderHand(); // Atualiza a mão
                renderDiscardPile(); // Atualiza a pilha de descarte
            });
    
            handElement.appendChild(cardElement);
        });
    }    

    // Renderiza a pilha de descarte
    function renderDiscardPile() {
        discardPileElement.innerHTML = '';
        if (discardPile.length > 0) {
            const card = discardPile[discardPile.length - 1];
            const cardElement = document.createElement('div');
            cardElement.className = 'card';
            cardElement.style.backgroundImage = `url(${card.image})`;
            discardPileElement.appendChild(cardElement);
        }
    }

    // Função para comprar uma carta
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

    // Função para descartar uma carta
    function discardCard(card) {
        discardPile.push(card);
        renderDiscardPile();
    }

    // Função para reiniciar o jogo
    function restartGame() {
        deck = [];
        discardPile = [];
        hand = [];
        initializeDeck();
        renderHand();
        renderDiscardPile();
    }

    // Evento de arrastar a carta
    function dragStart(event) {
        const cardIndex = event.target.dataset.index;
        event.dataTransfer.setData('text/plain', cardIndex);

        // Animação de arraste
        const card = event.target;
        card.style.transition = "transform 0.2s ease, box-shadow 0.2s ease";
        card.style.transform = "scale(1.1)";
        card.style.boxShadow = "0 5px 15px rgba(0, 0, 0, 0.3)";
        card.style.zIndex = "1000"; // Eleva a carta visualmente
    }

    // Evento de soltar a carta
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
    
        // Renderiza as cartas descartadas no modal
        discardedCardsElement.innerHTML = '';
        discardPile.forEach((card, index) => {
            const cardElement = document.createElement('div');
            cardElement.className = 'card';
            cardElement.style.backgroundImage = `url(${card.image})`;
    
            // Adiciona evento de botão direito (contextmenu) para mover à mão
            cardElement.addEventListener('contextmenu', (event) => {
                event.preventDefault(); // Evita o menu padrão do botão direito
                const [removedCard] = discardPile.splice(index, 1); // Remove a carta do lixo
                hand.push(removedCard); // Adiciona à mão
                renderHand(); // Atualiza a mão
                renderDiscardPile(); // Atualiza a pilha de descarte
    
                // Re-renderiza o modal ou fecha se estiver vazio
                if (discardPile.length === 0) {
                    closeDiscardModal();
                } else {
                    openDiscardModal();
                }
            });
    
            discardedCardsElement.appendChild(cardElement);
        });
    
        // Fecha o modal automaticamente se não houver cartas descartadas
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

    // Evento de soltar a carta na mão para reorganizar
    handElement.addEventListener('dragover', (event) => {
        event.preventDefault(); // Necessário para permitir drop
    });

    handElement.addEventListener('drop', (event) => {
        event.preventDefault();

        const fromIndex = event.dataTransfer.getData('text/plain'); // Índice da carta sendo arrastada
        const toElement = event.target.closest('.card'); // Carta de destino
        if (!toElement) return; // Se não for uma carta, não faça nada

        const toIndex = toElement.dataset.index; // Índice da carta de destino

        // Trocar as posições das cartas no array
        const [movedCard] = hand.splice(fromIndex, 1); // Remove a carta do índice original
        hand.splice(toIndex, 0, movedCard); // Insere no novo índice

        // Re-renderizar a mão
        renderHand();
    });

    // Evento de arrastar sobre a área de descarte
    discardPileElement.addEventListener('dragover', (event) => {
        event.preventDefault(); // Necessário para permitir drop
    });

    discardPileElement.addEventListener('drop', (event) => {
        event.preventDefault();

        const cardIndex = event.dataTransfer.getData('text/plain');
        const card = hand.splice(cardIndex, 1)[0]; // Remove a carta da mão
        discardCard(card); // Adiciona na pilha de descarte
        renderHand(); // Atualiza a mão
    });

    // Evento de comprar carta ao clicar no baralho
    deckElement.addEventListener('click', drawCard);

    // Evento de reiniciar o jogo
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
        event.preventDefault(); // Evita o menu padrão do botão direito
        if (discardPile.length > 0) {
            const card = discardPile.pop(); // Remove a última carta do lixo
            hand.push(card); // Adiciona à mão
            renderHand(); // Atualiza a mão
            renderDiscardPile(); // Atualiza a pilha de descarte
        }
    });

    // Inicializa o jogo
    initializeDeck();
});
