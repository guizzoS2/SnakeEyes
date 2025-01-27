let antecedentes = [];
let antecedenteAtual = null;
let habilidades = [];

function carregarAntecedentes() {
    const originDiv = document.getElementById('origin-div');

    antecedentes.forEach(antecedente => {
        const divAntecedente = document.createElement('div');
        divAntecedente.classList.add('antecedente');

        const titulo = document.createElement('h3');
        titulo.textContent = antecedente.nome;
        divAntecedente.appendChild(titulo);

        const bonusAtributo = document.createElement('p');
        bonusAtributo.textContent = `Bônus de Atributo: ${antecedente.bonus}`;
        divAntecedente.appendChild(bonusAtributo);

        const bonusHabilidade = document.createElement('p');
        bonusHabilidade.textContent = `Habilidade: ${antecedente.habilidade}`;
        divAntecedente.appendChild(bonusHabilidade);

        const desHabilidade = document.createElement('p');
        desHabilidade.textContent = `${antecedente.descricao}`;
        divAntecedente.appendChild(desHabilidade);

        const labelCheckbox = document.createElement('label');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.name = 'antecedente';
        checkbox.dataset.bonus = antecedente.bonus.split(" ")[0].toLowerCase(); 
        checkbox.dataset.valor = parseInt(antecedente.bonus.split(" ")[1]); 
        checkbox.dataset.habilidade = antecedente.habilidade;
        labelCheckbox.appendChild(checkbox);
        labelCheckbox.appendChild(document.createTextNode(' Selecionar'));
        divAntecedente.appendChild(labelCheckbox);

        originDiv.appendChild(divAntecedente);
    });

    originDiv.addEventListener('change', (event) => {
        if (event.target.type === 'checkbox') {
            const checkboxes = document.querySelectorAll('input[name="antecedente"]');
            checkboxes.forEach(checkbox => {
                if (checkbox !== event.target) {
                    checkbox.checked = false; 
                }
            });
            aplicarBonus(event.target); 
        }
    });
}

function aplicarBonus(selecionado) {
    const atributos = document.querySelectorAll('.atribute-value');
    antecedenteAtual = null;

    const botoes = document.querySelectorAll('.atribute-btn');
    botoes.forEach(botao => botao.disabled = false);

    atributos.forEach(atributo => {
        atributo.textContent = 0;
    });

    // Reativa todos os checkboxes de habilidades e redefine os textos para "Selecionar"
    const habilidadeCheckboxes = document.querySelectorAll('.habilidade input[type="checkbox"]');
    habilidadeCheckboxes.forEach(checkbox => {
        checkbox.disabled = false; 
        checkbox.checked = false; 
        const label = checkbox.parentElement;
        label.lastChild.textContent = " Selecionar"; 
    });

    // Aplica o bônus do antecedente selecionado e desabilita os botões correspondentes
    if (selecionado.checked) {
        const atributo = document.getElementById(selecionado.dataset.bonus);
        atributo.textContent = selecionado.dataset.valor;

        // Desabilita os botões do atributo relacionado ao antecedente
        const botoesAtributo = document.querySelectorAll(`[data-atribute="${selecionado.dataset.bonus}"]`);
        botoesAtributo.forEach(botao => botao.disabled = true);

        antecedenteAtual = {
            atributo: selecionado.dataset.bonus,
            valor: parseInt(selecionado.dataset.valor),
            habilidade: selecionado.dataset.habilidade 
        };

        // Marca e desabilita o checkbox da habilidade relacionada ao antecedente
        const habilidadeRelacionada = [...habilidadeCheckboxes].find(
            checkbox => checkbox.dataset.nome === antecedenteAtual.habilidade
        );

        if (habilidadeRelacionada) {
            habilidadeRelacionada.checked = true; 
            habilidadeRelacionada.disabled = true;
            const label = habilidadeRelacionada.parentElement;
            label.lastChild.textContent = " Selecionado (Antecedente)";
        }
    }

    atualizarPontosRestantes(); 
}



function atualizarPontosRestantes() {
    const pontosRestantesEl = document.querySelector('.pontos-restantes');
    const atributos = document.querySelectorAll('.atribute-value');
    let soma = 0;

    atributos.forEach(atributo => {
        const valorAtual = parseInt(atributo.textContent, 10) || 0;
        if (antecedenteAtual && antecedenteAtual.atributo === atributo.id) {
            soma += valorAtual - antecedenteAtual.valor; 
        } else {
            soma += valorAtual;
        }
    });

    const pontosRestantes = 4 - soma;
    pontosRestantesEl.textContent = pontosRestantes;
    return pontosRestantes;
}


function alterarValor(atributo, operacao) {
    const valorEl = document.getElementById(atributo);
    let valorAtual = parseInt(valorEl.textContent, 10);
    const pontosRestantes = atualizarPontosRestantes();

    if (operacao === 'increment' && valorAtual < 2 && pontosRestantes > 0) {
        valorAtual++;
    } else if (operacao === 'decrement' && valorAtual > 0) {
        valorAtual--;
    }

    valorEl.textContent = valorAtual;
    atualizarPontosRestantes();
}


function configurarBotoes() {
    const botoes = document.querySelectorAll('.atribute-btn');
    botoes.forEach(botao => {
        botao.addEventListener('click', () => {
            const atributo = botao.dataset.atribute;
            const operacao = botao.classList.contains('increment') ? 'increment' : 'decrement';
            alterarValor(atributo, operacao);
        });
    });
}


function carregarHabilidades() {
    const habilidadesDiv = document.getElementById('habilidades-div');

    habilidades.forEach(habilidade => {
        const divHabilidade = document.createElement('div');
        divHabilidade.classList.add('habilidade');

        const titulo = document.createElement('h3');
        titulo.textContent = habilidade.Nome;
        divHabilidade.appendChild(titulo);

        const requisito = document.createElement('p');
        requisito.textContent = `Requisito: ${habilidade.Requisito}`;
        divHabilidade.appendChild(requisito);

        const descricao = document.createElement('p');
        descricao.textContent = habilidade.Descrição;
        divHabilidade.appendChild(descricao);

        const labelCheckbox = document.createElement('label');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.name = 'habilidade';
        checkbox.dataset.nome = habilidade.Nome; 
        labelCheckbox.appendChild(checkbox);
        labelCheckbox.appendChild(document.createTextNode(' Selecionar'));
        divHabilidade.appendChild(labelCheckbox);

        habilidadesDiv.appendChild(divHabilidade);
    });

    // Evento para garantir apenas uma checkbox marcada
    habilidadesDiv.addEventListener('change', (event) => {
        if (event.target.type === 'checkbox') {
            const checkboxes = document.querySelectorAll('input[name="habilidade"]');
    
            // Verifica se o checkbox clicado está associado a um antecedente
            const antecedenteSelecionado = [...checkboxes].some(
                checkbox => checkbox.checked && checkbox.disabled
            );
    
            checkboxes.forEach(checkbox => {
                if (checkbox !== event.target) {
                    if (antecedenteSelecionado && checkbox.disabled) {
                        return; 
                    }
                    checkbox.checked = false; 
                }
            });
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // carregar antecedentes e habilidades
    fetch('antecedentes.json')
        .then(response => response.json())
        .then(data => {
            antecedentes = data; 
            carregarAntecedentes(); 
        })
        .catch(error => console.error('Erro ao carregar o JSON:', error));

    fetch('habilidades.json')
        .then(response => response.json())
        .then(data => {
            habilidades = data; 
            carregarHabilidades(); 
        })
        .catch(error => console.error('Erro ao carregar o JSON:', error));

    configurarBotoes(); 
});

