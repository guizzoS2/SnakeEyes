import { collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/9.16.0/firebase-firestore.js";
import { db, auth } from '../.././firebaseConfig.js';  // Caminho ajustado conforme a estrutura do projeto


console.log('Firestore instance:', db);

// Inicializa Firebase
// Função para criar campanha
async function criarCampanha() {
    const nomeCampanha = document.getElementById('nome-campanha').value;
    if (!nomeCampanha) {
        alert('Por favor, insira um nome para a campanha.');
        return;
    }

    // Pegar usuário logado
    const user = auth.currentUser;
   
    if (!user) {
        alert('Você precisa estar logado para criar uma campanha.');
        return;
    }

    try {
        await addDoc(collection(db, 'Campanha'), {
            nome: nomeCampanha,
            criador: user.uid,
            jogadores: [],
            bando: {
                recursos: {
                    bebida: 0,
                    comida: 0,
                    material: 0,
                },
                anotacaoGeral: '',
            },
            anotacoesDM: [],
            inimigos: [],
            relacoes: {
                independentes: 0,
                solari: 0,
                caes: 0,
                semLuz: 0,
                nomades: 0,
                comerciantes: 0,
            }
        });

        listarCampanhas();
    } catch (error) {
        console.error('Erro ao criar campanha:', error);
        alert('Erro ao criar campanha.');
    }
}

// Função para listar Minhas Campanhas e Meus Bandos
async function listarCampanhas() {
    const user = auth.currentUser;
    if (!user) {
        alert('Faça login para ver suas campanhas.');
        return;
    }

    const minhasCampanhasLista = document.getElementById('lista-minhas-campanhas');
    const meusBandosLista = document.getElementById('lista-meus-bandos');

    minhasCampanhasLista.innerHTML = '';
    meusBandosLista.innerHTML = '';

    try {
        // Busca todas as campanhas
        const querySnapshot = await getDocs(collection(db, 'Campanha'));

        querySnapshot.forEach(doc => {
            const campanha = doc.data();
            const item = document.createElement('li');
            item.innerText = `${campanha.nome}`;

            item.dataset.id = doc.id;
            item.addEventListener('click', () => {
                window.location.href = `meusjogos.html?id=${doc.id}`;
            });


            // Se o usuário é o criador da campanha, exibe em "Minhas Campanhas"
            if (campanha.criador === user.uid) {
                minhasCampanhasLista.appendChild(item);
            }

            // Se o usuário está em jogadores (com base no id do personagem)
            if (campanha.jogadores.some(jogador => jogador.userId === user.uid)) {
                meusBandosLista.appendChild(item.cloneNode(true));
            }
        });
    } catch (error) {
        console.error('Erro ao listar campanhas:', error);
        alert('Erro ao listar campanhas.');
    }
}

// Adiciona o event listener ao botão de criar campanha
// document.addEventListener('DOMContentLoaded', () => {
//     document.getElementById('btn-criar-campanha').addEventListener('click', criarCampanha);
//     auth.onAuthStateChanged(user => {
//         if (user) {
//             listarCampanhas();
//         }
//     });
// });

// Carrega as campanhas quando a página é carregada


// Escutar evento de clique no botão de criação de campanha
document.addEventListener('DOMContentLoaded', () => {
    const botaoCriarCampanha = document.getElementById('createBtn');
    botaoCriarCampanha.addEventListener('click', criarCampanha);
    auth.onAuthStateChanged(user => {
        if (user) {
            listarCampanhas();
        } else {
            alert('Faça login para ver suas campanhas.');
        }
    });
});


