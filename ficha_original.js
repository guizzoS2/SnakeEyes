import { db, auth } from '../firebaseConfig.js';
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/9.16.0/firebase-firestore.js";

let vitalidadeAtual = 0; 
let vitalidadeMaxima = 0; 
let estresseAtual = 0; 
let estresseMaxima = 0; 

const urlParams = new URLSearchParams(window.location.search);
const personagemId = urlParams.get('id');

async function carregarFichaDoFirestore() {
    if (!personagemId) {
        alert('ID do personagem não encontrado na URL!');
        window.location.href = '/perfil.html';
        return;
    }

    try {
        const docRef = doc(db, "personagens", personagemId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            carregarFichaUI(data);
            configurarEdicao(data);
        } else {
            alert('Personagem não encontrado!');
            window.location.href = '/perfil.html';
        }
    } catch (error) {
        console.error("Erro ao carregar ficha:", error);
        alert('Erro ao carregar a ficha!');
    }
}

function carregarFichaUI(data) {
    const personagem = data.dadosPersonagem;
    
    // Informações básicas
    document.getElementById('nome-personagem').textContent = personagem['nome-personagem'] || "Não informado";
    document.getElementById('nome-jogador').textContent = data.idUsuario || "Não informado"; 
    document.getElementById('recompensa').textContent = personagem.recompensa || "0";
    document.getElementById('bando').textContent = personagem.bando || "Não informado";
    document.getElementById('antecedente').textContent = personagem.antecedente || "Nenhum";
    document.getElementById('marca').textContent = personagem.marca || "Sem Marca";

    // Status
    const vitalidade = personagem.vitalidade || { atual: 0, maximo: 0 };
    const vigor = personagem.vigor || { atual: 0, maximo: 0 };

    // Inicializa corretamente os valores numéricos
    const vitalidadeAtual = parseInt(vitalidade.atual) || 0;
    const vitalidadeMaxima = parseInt(vitalidade.maximo) || 0;
    const estresseAtual = parseInt(vigor.atual) || 0;
    const estresseMaximo = parseInt(vigor.maximo) || 0;

    document.getElementById('vitalidade-atual').textContent = vitalidadeAtual;
    document.getElementById('vitalidade-maxima').textContent = vitalidadeMaxima;
    document.getElementById('estresse-atual').textContent = estresseAtual;
    document.getElementById('estresse-maximo').textContent = estresseMaximo;

    // Atualiza as barras
    atualizarBarra(vitalidadeAtual, vitalidadeMaxima, 'vitalidade-bar');
    atualizarBarra(estresseAtual, estresseMaximo, 'stress-bar');

    // Atributos
    const atributos = personagem.atributos || {};
    for (const [chave, valor] of Object.entries(atributos)) {
        const elemento = document.getElementById(`atributo-${chave}`);
        if (elemento) elemento.textContent = valor;
    }

    // Habilidades
    const habilidadesLista = document.getElementById('habilidades-lista');
    habilidadesLista.innerHTML = '';
    
    if (personagem.habilidades) {
        personagem.habilidades.forEach(habilidade => {
            const li = document.createElement('li');
            li.innerHTML = `
                <strong>${habilidade}:</strong> 
                <button class="remover-habilidade" data-nome="${habilidade}">-</button>
            `;
            habilidadesLista.appendChild(li);
        });
    }
}

// Função para atualizar a barra de vitalidade ou estresse
function atualizarBarra(atual, max, barId) {
    const barEl = document.getElementById(barId);

    if (max === 0) {
        barEl.style.width = '0%';
    } else {
        const porcentagem = (atual / max) * 100;
        barEl.style.width = `${porcentagem}%`;
    }
}


async function salvarAtributos(personagemId) {
    const updatedAtributos = {};

    document.querySelectorAll('.edit-mode').forEach(input => {
        const atributoId = input.dataset.atributo;
        const novoValor = parseInt(input.value) || 0;  // Garante que seja um número válido
        updatedAtributos[`dadosPersonagem.atributos.${atributoId}`] = novoValor;
    });

    console.log('Atributos a serem salvos:', updatedAtributos);  // Depuração

    try {
        await updateDoc(doc(db, "personagens", personagemId), updatedAtributos);
        // alert('Atributos salvos com sucesso!');
    } catch (error) {
        console.error('Erro ao salvar atributos no Firestore:', error);
        alert('Erro ao salvar atributos.');
    }
}

async function salvarInfos(personagemId) {
    const updatedInfos = {};

    document.querySelectorAll('.edit-mode2').forEach(input => {
        const spanId = input.id.replace('input-', '');
        const novoValor = input.value.trim() || '--';  // Garante que não esteja vazio
        updatedInfos[`dadosPersonagem.${spanId}`] = novoValor;
    });

    console.log('Informações a serem salvas:', updatedInfos);  // Depuração

    try {
        await updateDoc(doc(db, "personagens", personagemId), updatedInfos);
        // alert('Informações salvas com sucesso!');
    } catch (error) {
        console.error('Erro ao salvar informações no Firestore:', error);
        alert('Erro ao salvar informações.');
    }
}



function configurarEdicao(data) {
    // Configura os eventos de edição para os campos da ficha
    const editButton = document.getElementById('editar-atributos');
    const atributosSection = document.querySelector('.atributes-info');

    editButton.addEventListener('click', () => {
        const isEditing = atributosSection.classList.toggle('editing');

        if (isEditing) {
            // Entra no modo de edição
            editButton.textContent = '💾'; // Altera o ícone para "salvar"
        } else {
            // Sai do modo de edição e salva as alterações
            editButton.textContent = '✏️'; // Altera o ícone para "editar"
        }
    });
}

function alterarVitalidade(valor) {
    // Atualiza vitalidade dentro dos limites
    vitalidadeAtual = Math.max(-2, Math.min(vitalidadeMaxima, vitalidadeAtual + valor));

    // Atualiza o design da barra
    atualizarBarra('vitalidade-bar', 'vitalidade-text', vitalidadeAtual, vitalidadeMaxima);
}

function alterarEstresse(valor) {
    // Atualiza estresse dentro dos limites
    estresseAtual = Math.max(0, Math.min(estresseMaxima, estresseAtual + valor));

    // Atualiza o design da barra
    atualizarBarra('stress-bar', 'stress-text', estresseAtual, estresseMaxima);
}

function abrirModal() {
    const modal = document.getElementById('habilidades-modal');
    modal.classList.add('visible');
    modal.classList.remove('hidden');
    document.getElementById('tab-habilidades').click();
}

function fecharModal() {
    const modal = document.getElementById('habilidades-modal');
    modal.classList.add('hidden');
    modal.classList.remove('visible');
}

async function carregarJsonHabilidades(url, containerId) {
    try {
        const response = await fetch(url);
        const data = await response.json();
        const container = document.getElementById(containerId);

        container.innerHTML = '';

        data.forEach(habilidade => {
            const li = document.createElement('li');

            li.innerHTML = `
                <strong>${habilidade.Nome}:</strong> ${habilidade.Descrição}
                <button 
                    class="adicionar-btn" 
                    data-nome="${habilidade.Nome}" 
                    data-descricao="${habilidade.Descrição}">
                    +
                </button>
            `;

            container.appendChild(li);

            li.querySelector('.adicionar-btn').addEventListener('click', (event) => {
                const nome = event.target.dataset.nome;
                const descricao = event.target.dataset.descricao;

                adicionarHabilidade(nome, descricao);
            });

            atualizarBotoesModal(habilidade.Nome, false);
        });
    } catch (error) {
        console.error('Erro ao carregar JSON:', error);
    }
}

function atualizarBotoesModal(nome, adicionada) {
    const botoes = document.querySelectorAll(`[data-nome="${nome}"]`);

    botoes.forEach(botao => {
        if (adicionada) {
            botao.textContent = "-";
            botao.classList.add("remover-habilidade");
            botao.classList.remove("adicionar-btn");

            botao.replaceWith(botao.cloneNode(true));
            const novoBotao = document.querySelector(`[data-nome="${nome}"]`);
            novoBotao.addEventListener('click', () => removerHabilidade(nome));
        } 
        else {
            botao.textContent = "+";
            botao.classList.add("adicionar-btn");
            botao.classList.remove("remover-habilidade");

            botao.replaceWith(botao.cloneNode(true));
            const novoBotao = document.querySelector(`[data-nome="${nome}"]`);
            novoBotao.addEventListener('click', () => adicionarHabilidade(nome, botao.dataset.descricao));
        }
    });

    const habilidadesLista = document.getElementById('habilidades-lista');
    const habilidadesModal = document.getElementById('habilidades-lista-modal');

    if (habilidadesLista && habilidadesModal) {
        const habilidadesAdicionadas = Array.from(habilidadesLista.querySelectorAll('li'))
            .map(li => li.querySelector('strong')?.textContent.replace(':', '').trim());

        habilidadesModal.querySelectorAll('li').forEach(li => {
            const nomeHabilidade = li.querySelector('strong')?.textContent.replace(':', '').trim();
            const botao = li.querySelector('button');

            if (botao && nomeHabilidade) {
                if (habilidadesAdicionadas.includes(nomeHabilidade)) {
                    botao.textContent = "-";
                    botao.classList.add("remover-habilidade");
                    botao.classList.remove("adicionar-btn");

                    botao.replaceWith(botao.cloneNode(true));
                    const novoBotao = li.querySelector('button');
                    novoBotao.addEventListener('click', () => removerHabilidade(nomeHabilidade));
                } else {
                    botao.textContent = "+";
                    botao.classList.add("adicionar-btn");
                    botao.classList.remove("remover-habilidade");

                    botao.replaceWith(botao.cloneNode(true));
                    const novoBotao = li.querySelector('button');
                    novoBotao.addEventListener('click', () => adicionarHabilidade(nomeHabilidade, botao.dataset.descricao));
                }
            }
        });
    }
}


function adicionarHabilidade(nome, descricao) {
    const habilidadesLista = document.getElementById('habilidades-lista');

    const habilidadeExistente = Array.from(habilidadesLista.querySelectorAll('li'))
        .find(li => li.querySelector('strong')?.textContent.includes(nome));


        if (habilidadeExistente) {
            alert('Essa habilidade já foi adicionada!');
            return;
        }

    const li = document.createElement('li');
    li.innerHTML = `
        <strong>${nome}:</strong> ${descricao}
        <button class="remover-habilidade" data-nome="${nome}">-</button>
    `;
    habilidadesLista.appendChild(li);

    li.querySelector('.remover-habilidade').addEventListener('click', () => removerHabilidade(nome));

    atualizarBotoesModal(nome, true);
}


function removerHabilidade(nome) {
    const habilidadesLista = document.getElementById('habilidades-lista');

    Array.from(habilidadesLista.querySelectorAll('li')).forEach(li => {
        if (li.querySelector('strong')?.textContent.includes(nome)) {
            li.remove();
        }
    });

    atualizarBotoesModal(nome, false);
}

let currentRotation = 0;
let isSpinning = false;

function spin() {
    if (isSpinning) return;
    isSpinning = true;

    const randomNumber = Math.floor(Math.random() * 6) + 1;
    const targetDegree = (randomNumber - 1) * 60;
    const currentDegree = currentRotation % 360;

    let delta = (targetDegree - currentDegree + 360) % 360;
    const totalRotation = currentRotation + 360 * 2 + delta;

    const rotatingContainer = document.querySelector('.rotating-container');

    rotatingContainer.style.transition = 'transform 3s cubic-bezier(0.25, 0.1, 0.25, 1)';
    rotatingContainer.style.transform = `rotate(${totalRotation}deg)`;

    currentRotation = totalRotation;

    setTimeout(() => {
        isSpinning = false;
        rotatingContainer.style.transition = 'none';
    }, 3000);
}


document.addEventListener('DOMContentLoaded', () => {
    const inputFile = document.createElement('input');
    inputFile.type = 'file';
    inputFile.accept = '.json';

    inputFile.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (file) {
            try {
                const fileContent = await file.text();
                const ficha = JSON.parse(fileContent);

                carregarFicha(ficha);
            } catch (error) {
                console.error('Erro ao processar o arquivo JSON:', error);
                alert('Erro ao carregar o arquivo da ficha. Certifique-se de que é um JSON válido.');
            }
        }

        document.getElementById('vitalidade-minus').addEventListener('click', () => alterarVitalidade(-1));
        document.getElementById('vitalidade-plus').addEventListener('click', () => alterarVitalidade(1));
        document.getElementById('stress-minus').addEventListener('click', () => alterarEstresse(-1));
        document.getElementById('stress-plus').addEventListener('click', () => alterarEstresse(1));
        
    });

    const abrirFichaBtn = document.createElement('button');
    abrirFichaBtn.textContent = 'Abrir Ficha';
    abrirFichaBtn.addEventListener('click', () => {
        inputFile.click();
    });

    document.body.appendChild(abrirFichaBtn);

    document.getElementById('gerenciar-habilidades').addEventListener('click', abrirModal);
    document.getElementById('fechar-modal').addEventListener('click', fecharModal);

    // Fechar com tecla ESC
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            fecharModal();
        }
    });

    document.getElementById('tab-habilidades').addEventListener('click', () => {
        document.getElementById('modal-habilidades').classList.add('visible');
        document.getElementById('modal-habilidades').classList.remove('hidden');
        document.getElementById('modal-marcas').classList.add('hidden');
        document.getElementById('modal-marcas').classList.remove('visible');
    
        document.getElementById('tab-habilidades').classList.add('active');
        document.getElementById('tab-marcas').classList.remove('active');
    });
    
    document.getElementById('tab-marcas').addEventListener('click', () => {
        document.getElementById('modal-marcas').classList.add('visible');
        document.getElementById('modal-marcas').classList.remove('hidden');
        document.getElementById('modal-habilidades').classList.add('hidden');
        document.getElementById('modal-habilidades').classList.remove('visible');
    
        document.getElementById('tab-marcas').classList.add('active');
        document.getElementById('tab-habilidades').classList.remove('active');
    });

    // Função para carregar habilidades e marcas
    document.getElementById('tab-marcas').addEventListener('click', () => {
        carregarJsonHabilidades('../json/habilidadesMarcas.json', 'marcas-lista-modal');
    });

    document.getElementById('tab-habilidades').addEventListener('click', () => {
        carregarJsonHabilidades('../json/habilidades.json', 'habilidades-lista-modal');
    });

    const editButtonAtributos = document.getElementById('editar-atributos');
    let isEditingAtributos = false;

    // Evento de clique para alternar entre edição e visualização dos atributos
    editButtonAtributos.addEventListener('click', async () => {
        isEditingAtributos = !isEditingAtributos;

        const atributosSection = document.querySelector('.atributos-area');

        if (isEditingAtributos) {
            // Preenche os inputs com os valores atuais dos spans
            atributosSection.querySelectorAll('.edit-mode').forEach(input => {
                const atributoId = input.dataset.atributo;
                const span = document.getElementById(`atributo-${atributoId}`);

                if (span) {
                    const valorSpan = span.textContent.trim();
                    input.value = valorSpan !== '--' ? parseInt(valorSpan) || 0 : 0;  // Preenche os inputs corretamente
                }
            });

            // Alterna o modo de edição
            atributosSection.querySelectorAll('.view-mode').forEach(span => span.style.display = 'none');
            atributosSection.querySelectorAll('.edit-mode').forEach(input => input.style.display = 'inline-block');
            editButtonAtributos.textContent = '💾';  // Muda o botão para salvar
        } else {
            // Salva as alterações locais nos spans
            atributosSection.querySelectorAll('.edit-mode').forEach(input => {
                const atributoId = input.dataset.atributo;
                const span = document.getElementById(`atributo-${atributoId}`);

                if (span) {
                    span.textContent = input.value.trim() || '0';  // Atualiza os spans localmente
                }
            });

            // Sai do modo de edição
            atributosSection.querySelectorAll('.view-mode').forEach(span => span.style.display = 'inline');
            atributosSection.querySelectorAll('.edit-mode').forEach(input => input.style.display = 'none');
            editButtonAtributos.textContent = '✏️';  // Volta para o botão de edição
        }
    });

   

    carregarFichaDoFirestore();

    // Mantenha os event listeners de UI
    document.getElementById('vitalidade-minus').addEventListener('click', () => alterarVitalidade(-1));
    document.getElementById('vitalidade-plus').addEventListener('click', () => alterarVitalidade(1));
    document.getElementById('stress-minus').addEventListener('click', () => alterarEstresse(-1));
    document.getElementById('stress-plus').addEventListener('click', () => alterarEstresse(1));

    // Atualize o listener de edição para salvar no Firestore
    document.getElementById('editar-atributos').addEventListener('click', async () => {
        const isEditingAtributos = document.querySelector('.atributos-area').classList.toggle('editing');
    
        if (isEditingAtributos) {
            document.getElementById('editar-atributos').textContent = '💾';  // Entra no modo edição
        } else {
            await salvarAtributos(personagemId);  // Salva apenas os atributos
            document.getElementById('editar-atributos').textContent = '✏️';  // Sai do modo edição
        }
    });


    document.getElementById('editar-informacoes2').addEventListener('click', async () => {
        const isEditingInfo = document.querySelector('.social-info').classList.toggle('editing');
    
        if (isEditingInfo) {
            document.getElementById('editar-informacoes2').textContent = '💾';  // Entra no modo edição
        } else {
            await salvarInfos(personagemId);  // Salva apenas as informações sociais
            document.getElementById('editar-informacoes2').textContent = '✏️';  // Sai do modo edição
        }
    });
    


    const editButton = document.getElementById('editar-informacoes2');
    let isEditingInfo = false;
    
    // Evento de clique para alternar entre edição e visualização
    editButton.addEventListener('click', async () => {
        isEditingInfo = !isEditingInfo;
    
        const infoSection = document.querySelector('.social-info');
    
        if (isEditingInfo) {
            // Entra no modo de edição
            infoSection.querySelectorAll('.edit-mode2').forEach(input => {
                const spanId = input.id.replace('input-', '');
                const span = document.getElementById(spanId);
    
                if (span) {
                    input.value = span.textContent.trim();  // Preenche os inputs com os valores dos spans
                }
            });
    
            infoSection.querySelectorAll('.view-mode').forEach(span => span.style.display = 'none');
            infoSection.querySelectorAll('.edit-mode2').forEach(input => input.style.display = 'inline-block');
            editButton.textContent = '💾';  // Muda o botão para salvar
        } else {    
            // Volta ao modo de visualização
            infoSection.querySelectorAll('.view-mode').forEach(span => span.style.display = 'inline');
            infoSection.querySelectorAll('.edit-mode2').forEach(input => input.style.display = 'none');
            editButton.textContent = '✏️';  // Volta para o botão de edição
        }
    });
    



    
});

