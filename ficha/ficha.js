function carregarFicha(ficha) {
    document.getElementById('nome-personagem').textContent = ficha.nomePersonagem || "Não informado";
    document.getElementById('nome-jogador').textContent = ficha.nomeJogador || "Não informado";
    document.getElementById('recompensa').textContent = ficha.recompensa || "0";
    document.getElementById('bando').textContent = ficha.bando || "Não informado";
    document.getElementById('antecedente').textContent = ficha.antecedenteSelecionado?.nome || "Nenhum";
    document.getElementById('marca').textContent = ficha.marca || "Sem Marca";

    const vitalidadeAtual = ficha.vitalidade?.atual || 0;
    const vitalidadeMaxima = ficha.vitalidade?.maximo || 0;
    const stressAtual = ficha.estresse?.atual || 0;
    const stressMaxima = ficha.estresse?.maximo || 6;

    document.getElementById('vitalidade-atual').textContent = vitalidadeAtual;
    document.getElementById('vitalidade-maxima').textContent = vitalidadeMaxima;
    document.getElementById('estresse-atual').textContent = stressAtual;
    document.getElementById('estresse-maximo').textContent = stressMaxima;

    atualizarBarra('vitalidade-bar', 'vitalidade-text', vitalidadeAtual, vitalidadeMaxima);
    atualizarBarra('stress-bar', 'stress-text', stressAtual, stressMaxima);

    for (const atributo in ficha.atributos) {
        const elemento = document.getElementById(`atributo-${atributo}`);
        if (elemento) {
            elemento.textContent = ficha.atributos[atributo];
        }
    }

    const habilidadesLista = document.getElementById('habilidades-lista');
    habilidadesLista.innerHTML = ''; 

    ficha.habilidadesSelecionadas.forEach(habilidade => {
        const li = document.createElement('li');
        li.innerHTML = `<strong>${habilidade.Nome}:</strong> ${habilidade.Descrição}`;
        habilidadesLista.appendChild(li);
    });
}

function atualizarBarra(idBarra, idTexto, valorAtual, valorMaximo) {
    const percentual = valorMaximo > 0 ? (valorAtual / valorMaximo) * 100 : 0;
    document.getElementById(idBarra).style.width = `${percentual}%`;
    document.getElementById(idTexto).textContent = `${valorAtual} / ${valorMaximo}`;
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
    });

    const abrirFichaBtn = document.createElement('button');
    abrirFichaBtn.textContent = 'Abrir Ficha';
    abrirFichaBtn.addEventListener('click', () => {
        inputFile.click();
    });

    document.body.appendChild(abrirFichaBtn);
});

function atualizarBarras(vitalidadeAtual, vitalidadeMaxima, stress, stress) {
    // Atualiza a barra de vitalidade
    let vitalidadePercentual = (vitalidadeAtual / vitalidadeMaxima) * 100;
    document.getElementById('vitalidade-bar').style.width = vitalidadePercentual + "%";
    document.getElementById('vitalidade-text').textContent = `${vitalidadeAtual} / ${vitalidadeMaxima}`;

    // Atualiza a barra de essência
    let stressPercentual = (stressAtual / stressMaxima) * 100;
    document.getElementById('stress-bar').style.width = stressPercentual + "%";
    document.getElementById('stress-text').textContent = `${stressAtual} / ${stressMaxima}`;
}