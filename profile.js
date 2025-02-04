import { db, auth } from './firebaseConfig.js';
import { collection, query, where, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/9.16.0/firebase-firestore.js";

// Função principal que carrega os dados do perfil
async function carregarPerfil() {
    const usuario = auth.currentUser;
    
    if (!usuario) {
        window.location.href = '/login.html';
        return;
    }

    // Carrega informações do usuário
    document.getElementById('player-name').textContent = usuario.displayName || "Não informado";
    document.getElementById('player-email').textContent = usuario.email;
    document.getElementById('registration-date').textContent = new Date(usuario.metadata.creationTime).toLocaleDateString();

    // Carrega personagens do usuário
    const tbody = document.querySelector('#characters-table tbody');
    tbody.innerHTML = '<tr><td colspan="3">Carregando personagens...</td></tr>';

    try {
        const q = query(
            collection(db, "personagens"),
            where("idUsuario", "==", usuario.uid)
        );

        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            tbody.innerHTML = '<tr><td colspan="3">Nenhum personagem encontrado.</td></tr>';
            return;
        }

        tbody.innerHTML = '';
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const personagem = data.dadosPersonagem;
            
            const tr = document.createElement('tr');
            
            // Coluna Nome
            const tdNome = document.createElement('td');
            tdNome.textContent = personagem.nome;
            
            // Coluna Atributos
            const tdAtributos = document.createElement('td');
            tdAtributos.innerHTML = `
                <strong>Vitalidade:</strong> ${personagem.vitalidade.atual}/${personagem.vitalidade.maximo}<br>
                <strong>Estresse:</strong> ${personagem.vigor.atual}/${personagem.vigor.maximo}<br>
                <strong>Recompensa:</strong> $${personagem.recompensa}
            `;
            
            // Coluna Ações
            const tdAcoes = document.createElement('td');
            const btnVer = document.createElement('button');
            btnVer.className = 'btn-ver';
            btnVer.textContent = 'Ver Ficha';
            btnVer.onclick = () => verFicha(doc.id);

            const btnExcluir = document.createElement('button');
            btnExcluir.className = 'btn-excluir';
            btnExcluir.textContent = 'Excluir';
            btnExcluir.onclick = () => excluirPersonagem(doc.id);

            tdAcoes.appendChild(btnVer);
            tdAcoes.appendChild(btnExcluir);

            tr.appendChild(tdNome);
            tr.appendChild(tdAtributos);
            tr.appendChild(tdAcoes);
            
            tbody.appendChild(tr);
        });

    } catch (error) {
        console.error("Erro ao carregar personagens:", error);
        tbody.innerHTML = '<tr><td colspan="3">Erro ao carregar personagens.</td></tr>';
    }
}

// Função para abrir a ficha em uma nova janela
function verFicha(personagemId) {
    window.open(`ficha/ficha.html?id=${personagemId}`, '_blank');
}

// Função para excluir personagem
async function excluirPersonagem(personagemId) {
    if (!confirm('Tem certeza que deseja excluir este personagem permanentemente?')) return;

    try {
        await deleteDoc(doc(db, "personagens", personagemId));
        carregarPerfil(); // Recarrega a lista
        alert('Personagem excluído com sucesso!');
    } catch (error) {
        console.error("Erro ao excluir personagem:", error);
        alert('Erro ao excluir personagem!');
    }
}

// Verifica autenticação e carrega dados quando a página carrega
auth.onAuthStateChanged((usuario) => {
    if (usuario) {
        carregarPerfil();
    } else {
        window.location.href = '/login.html';
    }
});

// Adiciona logout se necessário
document.getElementById('btn-logout').addEventListener('click', () => {
    auth.signOut().then(() => {
        window.location.href = '/login.html';
    });
});