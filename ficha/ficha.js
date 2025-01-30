let vitalidadeAtual = 0; 
let vitalidadeMaxima = 0; 
let estresseAtual = 0; 
let estresseMaxima = 0; 

function carregarFicha(ficha) {
    // Carrega informações básicas
    document.getElementById('nome-personagem').textContent = ficha.nomePersonagem || "Não informado";
    document.getElementById('nome-jogador').textContent = ficha.nomeJogador || "Não informado";
    document.getElementById('recompensa').textContent = ficha.recompensa || "0";
    document.getElementById('bando').textContent = ficha.bando || "Não informado";
    document.getElementById('antecedente').textContent = ficha.antecedenteSelecionado?.nome || "Nenhum";
    document.getElementById('marca').textContent = ficha.marca || "Sem Marca";

    vitalidadeAtual = ficha.vitalidade?.atual || 0;
    vitalidadeMaxima = ficha.vitalidade?.maximo || 0;
    estresseAtual = ficha.estresse?.atual || 0;
    estresseMaxima = ficha.estresse?.maximo || 6;

    const habilidadesSelecionadas = ficha.habilidadesSelecionadas || [];
    habilidadesSelecionadas.forEach(habilidade => {
        adicionarHabilidade(habilidade.Nome, habilidade.Descrição, true);
    });

    habilidadesSelecionadas.forEach(habilidade => {
        atualizarBotoesModal(habilidade.Nome, true);
    });

    document.getElementById('vitalidade-atual').textContent = vitalidadeAtual;
    document.getElementById('vitalidade-maxima').textContent = vitalidadeMaxima;

    atualizarBarra('vitalidade-bar', 'vitalidade-text', vitalidadeAtual, vitalidadeMaxima);

    document.getElementById('estresse-atual').textContent = estresseAtual;
    document.getElementById('estresse-maximo').textContent = estresseMaxima;

    atualizarBarra('stress-bar', 'stress-text', estresseAtual, estresseMaxima);

    for (const atributo in ficha.atributos) {
        const elemento = document.getElementById(`atributo-${atributo}`);
        if (elemento) {
            elemento.textContent = ficha.atributos[atributo];
        } else {
            console.warn(`Atributo "${atributo}" não encontrado no HTML.`);
        }
    }

    // Carrega habilidades
    const habilidadesLista = document.getElementById('habilidades-lista');
    habilidadesLista.innerHTML = ''; 

    ficha.habilidadesSelecionadas.forEach(habilidade => {
        const li = document.createElement('li');
        li.innerHTML = `
            <strong>${habilidade.Nome}:</strong> ${habilidade.Descrição}
            <button class="remover-habilidade" data-nome="${habilidade.Nome}">-</button>
        `;
        habilidadesLista.appendChild(li);

        li.querySelector('.remover-habilidade').addEventListener('click', () => removerHabilidade(habilidade.Nome));
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


function atualizarBarra(idBarra, idTexto, valorAtual, valorMaximo) {
    const percentual = valorMaximo > 0 ? (valorAtual / valorMaximo) * 100 : 0;

    const barra = document.getElementById(idBarra);
    if (barra) {
        barra.style.width = `${percentual}%`;
    }

    const texto = document.getElementById(idTexto);
    if (texto) {
        texto.textContent = `${valorAtual} / ${valorMaximo}`;
    }
}


function atualizarBarra(idBarra, idTexto, valorAtual, valorMaximo) {
    const percentual = valorMaximo > 0 ? (valorAtual / valorMaximo) * 100 : 0;
    const barra = document.getElementById(idBarra);

    if (barra) {
        barra.style.width = `${percentual}%`;
    } else {
        console.warn(`Barra com ID "${idBarra}" não encontrada.`);
    }

    const texto = document.getElementById(idTexto);
    if (texto) {
        texto.textContent = `${valorAtual} / ${valorMaximo}`;
    } else {
        console.warn(`Texto com ID "${idTexto}" não encontrado.`);
    }
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
        // else {
        //     botao.textContent = "+";
        //     botao.classList.add("adicionar-btn");
        //     botao.classList.remove("remover-habilidade");

        //     botao.replaceWith(botao.cloneNode(true));
        //     const novoBotao = document.querySelector(`[data-nome="${nome}"]`);
        //     novoBotao.addEventListener('click', () => adicionarHabilidade(nome, botao.dataset.descricao));
        // }
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


    const editButton = document.getElementById('editar-atributos');
    const atributosSection = document.querySelector('.atributes-info');
    let isEditing = false;

    // Função para preencher os inputs com os valores atuais
    const preencherInputs = () => {
        document.querySelectorAll('.edit-mode').forEach(input => {
            const atributoId = input.dataset.atributo;
            const span = document.getElementById(`atributo-${atributoId}`);
            
            if(span && span.textContent !== '--') {
                input.value = span.textContent.trim();
            } else {
                input.value = '0';
            }
        });
    };

    editButton.addEventListener('click', () => {
        isEditing = !isEditing;
        
        if(isEditing) {
            atributosSection.classList.add('editing');
            editButton.textContent = '💾';
            preencherInputs(); 
            
        } else {

            atributosSection.classList.remove('editing');
            editButton.textContent = '✏️';
            
            document.querySelectorAll('.edit-mode').forEach(input => {
                const atributoId = input.dataset.atributo;
                const span = document.getElementById(`atributo-${atributoId}`);
                span.textContent = input.value;
                
            });
        }
    });

    document.getElementById('editar-informacoes').addEventListener('click', () => {
        const editMode = document.querySelectorAll('.social-info .edit-mode');
        const viewMode = document.querySelectorAll('.social-info .view-mode');
        const isEditing = document.querySelector('.social-info').classList.toggle('editing');
    
        if (isEditing) {
            // Modo de edição: carregar os valores atuais dos spans para os inputs
            document.getElementById('input-nome-personagem').value = document.getElementById('nome-personagem').textContent.trim();
            document.getElementById('input-nome-jogador').value = document.getElementById('nome-jogador').textContent.trim();
            document.getElementById('input-recompensa').value = document.getElementById('recompensa').textContent.trim();
            document.getElementById('input-bando').value = document.getElementById('bando').textContent.trim();
            document.getElementById('input-antecedente').value = document.getElementById('antecedente').textContent.trim();
            document.getElementById('input-marca').value = document.getElementById('marca').textContent.trim();

            const newbtn = document.getElementById('editar-informacoes');
            newbtn.textContent = '💾';

    
            // Mostrar inputs e esconder spans
            editMode.forEach(input => input.style.display = 'block');
            viewMode.forEach(span => span.style.display = 'none');

            
        } else {
            // Salvar os novos valores e atualizar os spans
            document.getElementById('nome-personagem').textContent = document.getElementById('input-nome-personagem').value.trim();
            document.getElementById('nome-jogador').textContent = document.getElementById('input-nome-jogador').value.trim();
            document.getElementById('recompensa').textContent = document.getElementById('input-recompensa').value.trim();
            document.getElementById('bando').textContent = document.getElementById('input-bando').value.trim();
            document.getElementById('antecedente').textContent = document.getElementById('input-antecedente').value.trim();
            document.getElementById('marca').textContent = document.getElementById('input-marca').value.trim();
            const newbtn = document.getElementById('editar-informacoes');
            newbtn.textContent = '✏️';
    
            // Voltar ao modo de visualização
            editMode.forEach(input => input.style.display = 'none');
            viewMode.forEach(span => span.style.display = 'block');
        }
    });    
    
});