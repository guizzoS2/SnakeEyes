let antecedentes = [];
let antecedenteAtual = null;
let habilidades = [];
let marcas = [];

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

    const habilidadeCheckboxes = document.querySelectorAll('.habilidade input[type="checkbox"]');
    habilidadeCheckboxes.forEach(checkbox => {
        checkbox.disabled = false;
        checkbox.checked = false;
        const label = checkbox.parentElement;
        label.lastChild.textContent = " Selecionar";
    });

    if (selecionado.checked) {
        const atributo = document.getElementById(selecionado.dataset.bonus);
        atributo.textContent = selecionado.dataset.valor;

        const botoesAtributo = document.querySelectorAll(`[data-atribute="${selecionado.dataset.bonus}"]`);
        botoesAtributo.forEach(botao => botao.disabled = true);

        antecedenteAtual = {
            nome: antecedentes.find(a => a.habilidade === selecionado.dataset.habilidade)?.nome || "Sem Antecedente",
            atributo: selecionado.dataset.bonus,
            valor: parseInt(selecionado.dataset.valor),
            habilidade: selecionado.dataset.habilidade
        };

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

    atualizarDivMarca(); 
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

    // Reavaliar pré-requisitos das habilidades
    const habilidadeCheckboxes = document.querySelectorAll('.habilidade input[type="checkbox"]');
    habilidadeCheckboxes.forEach(checkbox => {
        const requisito = JSON.parse(checkbox.dataset.requisito);
        const atributoAtual = document.getElementById(requisito.atributo).textContent;
        const label = checkbox.parentElement;
        // Verifica se a habilidade está associada ao antecedente selecionado
        if (antecedenteAtual && checkbox.dataset.nome === antecedenteAtual.habilidade) {
            checkbox.disabled = true; 
            checkbox.checked = true; 
            label.classList.remove('label-disabled');
            label.lastChild.textContent = ' Selecionada (Antecedente)';
        } else if (parseInt(atributoAtual, 10) < requisito.valor) {
            checkbox.disabled = true; 
            checkbox.checked = false; 
            label.classList.add('label-disabled');
            label.lastChild.textContent = ' Pré-requisito não atendido';
        } else {
            checkbox.disabled = false;
            label.classList.remove('label-disabled');
            label.lastChild.textContent = ' Selecionar';
        }
    });

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
        requisito.textContent = `Requisito: ${habilidade.Requisito.atributo} ${habilidade.Requisito.valor}`;
        divHabilidade.appendChild(requisito);

        const descricao = document.createElement('p');
        descricao.textContent = habilidade.Descrição;
        divHabilidade.appendChild(descricao);

        const labelCheckbox = document.createElement('label');
        labelCheckbox.classList.add('label-disabled');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.name = 'habilidade';
        checkbox.dataset.nome = habilidade.Nome;
        checkbox.dataset.requisito = JSON.stringify(habilidade.Requisito);

        // Verifica se o jogador atende ao pré-requisito
        const atributoAtual = document.getElementById(habilidade.Requisito.atributo).textContent;
        if (parseInt(atributoAtual, 10) < habilidade.Requisito.valor) {
            checkbox.disabled = true; // Desabilita se o requisito não for atendido
            labelCheckbox.appendChild(checkbox);
            labelCheckbox.appendChild(document.createTextNode(' Pré-requisito não atendido'));
        } else {
            labelCheckbox.appendChild(checkbox);
            labelCheckbox.appendChild(document.createTextNode(' Selecionar'));
        }

        divHabilidade.appendChild(labelCheckbox);
        habilidadesDiv.appendChild(divHabilidade);
    });

    habilidadesDiv.addEventListener('change', (event) => {
        if (event.target.type === 'checkbox') {
            const checkboxes = document.querySelectorAll('input[name="habilidade"]');
    
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

function criarFicha() {
    const nomePersonagem = document.querySelector('input[name="ocName"]').value || "Sem Nome";
    const nomeJogador = document.querySelector('input[name="plName"]').value || "Jogador";
    const recompensa = parseInt(document.querySelector('input[name="reward"]').value, 10) || 0;
    const bando = document.querySelector('input[name="group"]').value || "Sem Bando";

    // Capturar a marca selecionada
    const marcaCheckbox = document.querySelector('.marca-div input[type="checkbox"]:checked');
    const marca = marcaCheckbox ? marcaCheckbox.value : "Sem Marca";

    const atributos = {
        força: parseInt(document.getElementById('força').textContent, 10),
        sagacidade: parseInt(document.getElementById('sagacidade').textContent, 10),
        mente: parseInt(document.getElementById('mente').textContent, 10),
        resiliência: parseInt(document.getElementById('resiliência').textContent, 10),
        sabedoria: parseInt(document.getElementById('sabedoria').textContent, 10),
        celeridade: parseInt(document.getElementById('celeridade').textContent, 10),
    };

    // Calc de vitalidade com resiliência
    const rolarD6 = () => Math.floor(Math.random() * 6) + 1;
    let vitalidadeBonus = 0;

    for (let i = 0; i < atributos.resiliência; i++) {
        const dadoRolado = rolarD6();
        const bonusPorResiliencia = Math.floor((dadoRolado + 1) / 2);
        vitalidadeBonus += bonusPorResiliencia;
    }

    const vitalidadeMaxima = 6 + vitalidadeBonus;

    // Habilidades com Nome e Descrição
    const habilidadesSelecionadas = Array.from(document.querySelectorAll('.habilidade input[type="checkbox"]'))
        .filter(checkbox => checkbox.checked)
        .map(checkbox => {
            const nome = checkbox.dataset.nome;
            const habilidadeEncontrada = habilidades.find(habilidade => habilidade.Nome === nome);

            if (habilidadeEncontrada) {
                return {
                    Nome: habilidadeEncontrada.Nome,
                    Descrição: habilidadeEncontrada.Descrição
                };
            } else {
                console.error(`Habilidade "${nome}" não encontrada no JSON de habilidades.`);
                return { Nome: nome, Descrição: "Descrição não encontrada." };
            }
        });

    const antecedenteSelecionado = antecedenteAtual
        ? {
            nome: antecedentes.find(a => a.habilidade === antecedenteAtual.habilidade)?.nome || "Sem Antecedente",
            atributo: antecedenteAtual.atributo,
            valor: antecedenteAtual.valor,
            habilidade: antecedenteAtual.habilidade
        }
        : null;

    // Construindo o JSON da ficha
    const ficha = {
        nomePersonagem,
        nomeJogador,
        recompensa,
        bando,
        marca,
        atributos,
        habilidadesSelecionadas,
        antecedenteSelecionado,
        vitalidade: {
            maximo: vitalidadeMaxima,
            atual: vitalidadeMaxima,
        },
        estresse: {
            maximo: 6,
            atual: 0,
        }
    };

    const fichaJSON = JSON.stringify(ficha, null, 2);

    const blob = new Blob([fichaJSON], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${nomePersonagem || 'ficha'}.json`;
    link.click();
    URL.revokeObjectURL(url);

    alert(`Vitalidade máxima calculada: ${vitalidadeMaxima}`);
}


function abrirFicha() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';

    input.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) {
            alert('Nenhum arquivo selecionado!');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const ficha = JSON.parse(e.target.result);

                const novaJanela = window.open('ficha.html', '_blank');

                novaJanela.onload = () => {
                    novaJanela.carregarFicha(ficha); 
                };
            } catch (error) {
                alert('Erro ao ler o arquivo JSON. Certifique-se de que o formato está correto.');
            }
        };

        reader.readAsText(file);
    });

    input.click();
}

function carregarMarcas() {
    const marcaDiv = document.getElementById('marca-div');


    marcas.forEach(marca => {
        const divMarca = document.createElement('div');
        divMarca.classList.add('marca');

        const titulo = document.createElement('h3');
        titulo.textContent = marca.nome;
        divMarca.appendChild(titulo);

        const descricao = document.createElement('p');
        descricao.textContent = marca.descricao;
        divMarca.appendChild(descricao);

        const labelCheckbox = document.createElement('label');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.name = 'marca';
        checkbox.value = marca.nome;
        labelCheckbox.appendChild(checkbox);
        labelCheckbox.appendChild(document.createTextNode(' Selecionar'));
        divMarca.appendChild(labelCheckbox);

        marcaDiv.appendChild(divMarca);
    });

    // Lógica para garantir que apenas um checkbox seja marcado
    marcaDiv.addEventListener('change', (event) => {
        if (event.target.type === 'checkbox') {
            const checkboxes = document.querySelectorAll('input[name="marca"]');
            checkboxes.forEach(checkbox => {
                if (checkbox !== event.target) {
                    checkbox.checked = false;
                }
            });
        }
    });
}

function atualizarDivMarca() {
    const marcaDiv = document.getElementById('marca-div');
    const antecedenteSelecionado = antecedenteAtual?.nome === "Marcada";

    if (antecedenteSelecionado) {
        marcaDiv.style.display = 'block';

    } else {
        marcaDiv.style.display = 'none'; 
        const checkboxes = document.querySelectorAll('input[name="marca"]');
        checkboxes.forEach(checkbox => checkbox.checked = false);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    fetch('antecedentes.json')
        .then(response => response.json())
        .then(data => {
            antecedentes = data;
            carregarAntecedentes();
        })
        .catch(error => console.error('Erro ao carregar antecedentes.json:', error));

    fetch('habilidades.json')
        .then(response => response.json())
        .then(data => {
            habilidades = data;
            carregarHabilidades();
        })
        .catch(error => console.error('Erro ao carregar habilidades.json:', error));

    fetch('marcas.json')
        .then(response => response.json())
        .then(data => {
            marcas = data;
            carregarMarcas();
        })
        .catch(error => console.error('Erro ao carregar marcas.json:', error));

    configurarBotoes();

    const botaoCriarFicha = document.getElementById('criar-ficha');
    if (botaoCriarFicha) {
        botaoCriarFicha.addEventListener('click', criarFicha);
    }

    const botaoAbrirFicha = document.getElementById('abrir-ficha');
    if (botaoAbrirFicha) {
        botaoAbrirFicha.addEventListener('click', abrirFicha);
    }
});