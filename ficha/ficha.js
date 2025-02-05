import { db, auth } from '../firebaseConfig.js';
import { query, collection, where, getDocs, doc, getDoc, updateDoc, arrayUnion, arrayRemove } from "https://www.gstatic.com/firebasejs/9.16.0/firebase-firestore.js";

let vitalidadeAtual = 0, vitalidadeMaxima = 0;
let estresseAtual = 0, estresseMaxima = 0;


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

async function carregarFichaUI(data) {
    const personagem = data.dadosPersonagem;

    // Informações básicas
    document.getElementById('nome-personagem').textContent = personagem['nome-personagem'] || "Não informado";
    document.getElementById('nome-jogador').textContent = data.idUsuario || "Não informado"; 
    document.getElementById('recompensa').textContent = personagem.recompensa || "0";
    document.getElementById('bando').textContent = personagem.bando || "Não informado";
    document.getElementById('antecedente').textContent = personagem.antecedente || "Nenhum";
    document.getElementById('marca').textContent = personagem.marca || "Sem Marca";

    // Inicializa os valores de vitalidade e estresse nas variáveis globais
    vitalidadeAtual = parseInt(personagem.vitalidade?.atual) || 0;
    vitalidadeMaxima = parseInt(personagem.vitalidade?.maximo) || 0;
    estresseAtual = parseInt(personagem.vigor?.atual) || 0;
    estresseMaxima = parseInt(personagem.vigor?.maximo) || 0;

    // Atualiza o DOM com os valores iniciais
    document.getElementById('vitalidade-atual').textContent = vitalidadeAtual;
    document.getElementById('vitalidade-maxima').textContent = vitalidadeMaxima;
    document.getElementById('estresse-atual').textContent = estresseAtual;
    document.getElementById('estresse-maximo').textContent = estresseMaxima;

    // Atualiza as barras
    atualizarBarra(vitalidadeAtual, vitalidadeMaxima, 'vitalidade-bar');
    atualizarBarra(estresseAtual, estresseMaxima, 'stress-bar');

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
        for (const habilidadeNome of personagem.habilidades) {
            try {
                // Faz a consulta no Firestore pelo campo "nome"
                const q = query(collection(db, "habilidades"), where("nome", "==", habilidadeNome));
                const querySnapshot = await getDocs(q);
    
                if (!querySnapshot.empty) {
                    querySnapshot.forEach((doc) => {
                        const habilidadeData = doc.data();
                        const li = document.createElement('li');
                        let nomeHabilidade = habilidadeData.nome 
                        li.innerHTML = `
                            <strong>${habilidadeData.nome}:</strong> ${habilidadeData.descricao}
                            <button class="remover-habilidade" data-nome="${habilidadeData.nome}">-</button>
                        `;
                        habilidadesLista.appendChild(li);
                        li.querySelector('.remover-habilidade').addEventListener('click', () => {
                            removerHabilidade(nomeHabilidade);
                        });
                    });
                } else {
                    console.warn(`Habilidade "${habilidadeNome}" não encontrada no banco.`);
                }
            } catch (error) {
                console.error(`Erro ao buscar habilidade "${habilidadeNome}":`, error);
            }
        }
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

async function alterarVitalidade(valor) {
    if (!personagemId) {
        console.error("personagemId não encontrado. Verifique a URL.");
        return;
    }

    // Atualiza vitalidade dentro dos limites
    vitalidadeAtual = Math.max(0, Math.min(vitalidadeMaxima, vitalidadeAtual + valor));

    // Atualiza o DOM e a barra de status
    document.getElementById('vitalidade-atual').textContent = vitalidadeAtual;
    atualizarBarra(vitalidadeAtual, vitalidadeMaxima, 'vitalidade-bar');

    // Atualiza o valor no Firestore
    try {
        const personagemRef = doc(db, "personagens", personagemId);
        await updateDoc(personagemRef, {
            "dadosPersonagem.vitalidade.atual": vitalidadeAtual
        });
        console.log("Vitalidade atualizada no banco com sucesso!");
    } catch (error) {
        console.error("Erro ao atualizar vitalidade no Firestore:", error);
    }
}

async function alterarEstresse(valor) {
    if (!personagemId) {
        console.error("personagemId não encontrado. Verifique a URL.");
        return;
    }

    // Atualiza estresse dentro dos limites
    estresseAtual = Math.max(0, Math.min(estresseMaxima, estresseAtual + valor));

    // Atualiza o DOM e a barra de status
    document.getElementById('estresse-atual').textContent = estresseAtual;
    atualizarBarra(estresseAtual, estresseMaxima, 'stress-bar');

    // Atualiza o valor no Firestore
    try {
        const personagemRef = doc(db, "personagens", personagemId);
        await updateDoc(personagemRef, {
            "dadosPersonagem.vigor.atual": estresseAtual
        });
        console.log("Estresse atualizado no banco com sucesso!");
    } catch (error) {
        console.error("Erro ao atualizar estresse no Firestore:", error);
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

async function carregarHabilidadesDoBanco(tipo, containerId) {
    try {
        // Cria uma query para buscar habilidades com o tipo especificado
        const habilidadesRef = collection(db, 'habilidades');
        const habilidadesQuery = query(habilidadesRef, where('tipo', '==', tipo));

        const querySnapshot = await getDocs(habilidadesQuery);
        const container = document.getElementById(containerId);
        container.innerHTML = '';

        // Itera sobre os documentos retornados e preenche a lista
        querySnapshot.forEach(doc => {
            const habilidade = doc.data();
            const li = document.createElement('li');
            li.innerHTML = `
                <strong>${habilidade.nome}:</strong> ${habilidade.descricao}
                <button 
                    class="adicionar-btn" 
                    data-nome="${habilidade.nome}" 
                    data-descricao="${habilidade.descricao}">
                    +
                </button>
            `;

            container.appendChild(li);

            // Adiciona o evento de clique no botão
            const botao = li.querySelector('button');
            botao.addEventListener('click', () => {
                const habilidadesAdicionadas = Array.from(document.getElementById('habilidades-lista').children)
                    .map(li => li.querySelector('strong').textContent.trim());
                
                if (habilidadesAdicionadas.includes(habilidade.nome)) {
                    removerHabilidade(habilidade.nome);
                } else {
                    adicionarHabilidade(habilidade.nome, habilidade.descricao);
                }
            });
        });

        atualizarBotoesModal();
    } catch (error) {
        console.error('Erro ao carregar habilidades do Firestore:', error);
    }
}


function atualizarBotoesModal() {
    const habilidadesAdicionadas = Array.from(document.getElementById('habilidades-lista').querySelectorAll('li'))
        .map(li => li.querySelector('strong')?.textContent.trim());

    const habilidadesModal = document.getElementById('habilidades-lista-modal');

    habilidadesModal.querySelectorAll('li').forEach(li => {
        const nomeHabilidade = li.querySelector('strong')?.textContent.trim();
        const botao = li.querySelector('button');

        if (botao && nomeHabilidade) {
            // Atualiza o estado do botão
            if (habilidadesAdicionadas.includes(nomeHabilidade)) {
                botao.textContent = "-";
                botao.classList.add("remover-habilidade");
                botao.classList.remove("adicionar-btn");
            } else {
                botao.textContent = "+";
                botao.classList.add("adicionar-btn");
                botao.classList.remove("remover-habilidade");
            }
        }
    });

    // Configura os eventos dos botões no modal corretamente
    configurarEventosModal();
}

async function atualizarHabilidadesFirestore(novaHabilidade, operacao) {
    const personagemRef = doc(db, "personagens", personagemId);

    try {
        if (operacao === 'adicionar') {
            await updateDoc(personagemRef, {
                'dadosPersonagem.habilidades': arrayUnion(novaHabilidade)
            });
            console.log(`Habilidade "${novaHabilidade}" adicionada ao Firestore.`);
        } else if (operacao === 'remover') {
            await updateDoc(personagemRef, {
                'dadosPersonagem.habilidades': arrayRemove(novaHabilidade)
            });
            console.log(`Habilidade "${novaHabilidade}" removida do Firestore.`);
        }
    } catch (error) {
        console.error('Erro ao atualizar habilidades no Firestore:', error);
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

    // Adiciona evento de clique para remoção direta
    li.querySelector('.remover-habilidade').addEventListener('click', () => {
        removerHabilidade(nome);
    });

    // Atualiza o Firestore para adicionar a habilidade no array
    atualizarHabilidadesFirestore(nome, 'adicionar'); // Atualiza no Firestore no campo correto

    // Atualiza os botões no modal após adicionar uma nova habilidade
    atualizarBotoesModal();
}



function removerHabilidade(nome) {
    const habilidadesLista = document.getElementById('habilidades-lista');

    Array.from(habilidadesLista.querySelectorAll('li')).forEach(li => {
        if (li.querySelector('strong')?.textContent.includes(nome)) {
            li.remove();
        }
    });

    // Atualiza o Firestore para remover a habilidade do array
    atualizarHabilidadesFirestore(nome, 'remover'); // Atualiza no Firestore no campo correto

    // Atualiza os botões no modal após a remoção
    atualizarBotoesModal();
}



function configurarEventosModal() {
    const habilidadesModal = document.getElementById('habilidades-lista-modal');

    habilidadesModal.querySelectorAll('li button').forEach(botao => {
        const nomeHabilidade = botao.dataset.nome;
        const descricaoHabilidade = botao.dataset.descricao;

        // Remove eventos antigos de forma segura
        const novoBotao = botao.cloneNode(true);
        botao.replaceWith(novoBotao);

        // Adiciona o evento correto ao botão
        novoBotao.addEventListener('click', () => {
            if (novoBotao.classList.contains('remover-habilidade')) {
                removerHabilidade(nomeHabilidade);
            } else {
                adicionarHabilidade(nomeHabilidade, descricaoHabilidade);
            }
        });
    });
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

        document.getElementById('vitalidade-plus').addEventListener('click', () => alterarVitalidade(+1));
        document.getElementById('vitalidade-minus').addEventListener('click', () => alterarVitalidade(-1));
        document.getElementById('stress-plus').addEventListener('click', () => alterarEstresse(+1));
        document.getElementById('stress-minus').addEventListener('click', () => alterarEstresse(-1));
         
        
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
        carregarHabilidadesDoBanco(1, 'marcas-lista-modal');
    });

    document.getElementById('tab-habilidades').addEventListener('click', () => {
        carregarHabilidadesDoBanco(0, 'habilidades-lista-modal');
    });

    const editButtonAtributos = document.getElementById('editar-atributos');
    let isEditingAtributos = false;
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

    const editButtonInformacoes = document.getElementById('editar-informacoes2');
    let isEditingInformacoes = false;
    editButtonInformacoes.addEventListener('click', async () => {
        isEditingInformacoes = !isEditingInformacoes;

        const informacoesSection = document.querySelector('.social-info');

        if (isEditingInformacoes) {
            // Preenche os inputs com os valores atuais dos spans
            informacoesSection.querySelectorAll('.edit-mode2').forEach(input => {
                const spanId = input.id.replace('input-', '');
                const span = document.getElementById(spanId);

                if (span) {
                    input.value = span.textContent.trim() || '';  // Preenche o input com o valor do span
                }
            });

            // Alterna o modo de edição
            informacoesSection.querySelectorAll('.view-mode').forEach(span => span.style.display = 'none');
            informacoesSection.querySelectorAll('.edit-mode2').forEach(input => input.style.display = 'inline-block');
            editButtonInformacoes.textContent = '💾';  // Muda o botão para salvar
        } else {
            // Salva os dados no banco
            informacoesSection.querySelectorAll('.edit-mode2').forEach(input => {
                const spanId = input.id.replace('input-', '');
                const novoValor = input.value.trim() || '--';
                const span = document.getElementById(spanId);
                if (span) {
                    span.textContent = novoValor;
                }
            });

            // Sai do modo de edição
            informacoesSection.querySelectorAll('.view-mode').forEach(span => span.style.display = 'inline');
            informacoesSection.querySelectorAll('.edit-mode2').forEach(input => input.style.display = 'none');
            editButtonInformacoes.textContent = '✏️';  // Volta para o botão de edição
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


    document.getElementById('gerenciar-habilidades').addEventListener('click', abrirModal);
    document.getElementById('fechar-modal').addEventListener('click', fecharModal);
    
});

