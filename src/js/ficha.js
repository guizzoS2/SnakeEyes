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

    // Carrega status
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

    // Atualiza os spans de vitalidade
    document.getElementById('vitalidade-atual').textContent = vitalidadeAtual;
    document.getElementById('vitalidade-maxima').textContent = vitalidadeMaxima;

    // Atualiza a barra de vitalidade
    atualizarBarra('vitalidade-bar', 'vitalidade-text', vitalidadeAtual, vitalidadeMaxima);

    // Atualiza os spans de estresse
    document.getElementById('estresse-atual').textContent = estresseAtual;
    document.getElementById('estresse-maximo').textContent = estresseMaxima;

    // Atualiza a barra de estresse
    atualizarBarra('stress-bar', 'stress-text', estresseAtual, estresseMaxima);

    // Carrega atributos
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
    habilidadesLista.innerHTML = ''; // Limpa a lista

    ficha.habilidadesSelecionadas.forEach(habilidade => {
        const li = document.createElement('li');
        li.innerHTML = `<strong>${habilidade.Nome}:</strong> ${habilidade.Descrição}`;
        habilidadesLista.appendChild(li);
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

        // Limpa a lista anterior no modal
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

            // Adiciona o evento ao botão para adicionar a habilidade
            li.querySelector('.adicionar-btn').addEventListener('click', (event) => {
                const nome = event.target.dataset.nome;
                const descricao = event.target.dataset.descricao;

                adicionarHabilidade(nome, descricao);
            });
        });
    } catch (error) {
        console.error('Erro ao carregar JSON:', error);
    }
}

function atualizarBotoesModal(nome, adicionada) {
    const botoes = document.querySelectorAll(`.adicionar-btn, .remover-habilidade`);

    botoes.forEach(botao => {
        if (botao.dataset.nome === nome) {
            if (adicionada) {
                botao.textContent = "-";
                botao.classList.add("remover-habilidade");
                botao.classList.remove("adicionar-btn");

                botao.replaceWith(botao.cloneNode(true));
                botao = document.querySelector(`[data-nome="${nome}"]`);
                botao.addEventListener('click', () => removerHabilidade(nome));
            } else {
                botao.textContent = "+";
                botao.classList.add("adicionar-btn");
                botao.classList.remove("remover-habilidade");

                botao.replaceWith(botao.cloneNode(true));
                botao = document.querySelector(`[data-nome="${nome}"]`);
                botao.addEventListener('click', () => adicionarHabilidade(nome, botao.dataset.descricao));
            }
        }
    });
}


function adicionarHabilidade(nome, descricao) {
    const habilidadesLista = document.getElementById('habilidades-lista');

    const habilidadeExistente = Array.from(habilidadesLista.querySelectorAll('li'))
        .find(li => li.querySelector('strong')?.textContent.includes(nome));

    if (habilidadeExistente) {
        if (!inicial) {
            alert('Essa habilidade já foi adicionada!');
        }
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
        carregarJsonHabilidades('src/json/habilidadesMarcas.json', 'marcas-lista-modal');
    });

    document.getElementById('tab-habilidades').addEventListener('click', () => {
        carregarJsonHabilidades('src/json/habilidades.json', 'habilidades-lista-modal');
    });
    
});