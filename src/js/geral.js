import {collection, getDocs, addDoc, serverTimestamp, query, where, getDoc, doc } from "https://www.gstatic.com/firebasejs/9.16.0/firebase-firestore.js";
import { db, auth } from '../../firebaseConfig.js';

let antecedenteAtual = null;

async function carregarAntecedentes() {
    const antecedentesSnapshot = await getDocs(collection(db, "antecedentes"));
    const originDiv = document.getElementById('origin-div');

    for (const antecedenteDoc of antecedentesSnapshot.docs) {
        const antecedente = antecedenteDoc.data();

        // Buscar habilidade correspondente
        const habilidadesSnapshot = await getDocs(
            query(collection(db, "habilidades"), where("Nome", "==", antecedente.habilidade))
        );

        let habilidade = null;
        habilidadesSnapshot.forEach(doc => {
            habilidade = doc.data();
        });

        // Renderização do antecedente e seus detalhes
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
        desHabilidade.textContent = antecedente.descricao;
        divAntecedente.appendChild(desHabilidade);

        if (habilidade) {
            const descricaoHabilidade = document.createElement('p');
            descricaoHabilidade.textContent = `Descrição da Habilidade: ${habilidade.Descrição}`;
            divAntecedente.appendChild(descricaoHabilidade);
        }

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
    }

    // Evento de mudança para os checkboxes
    originDiv.addEventListener('change', (event) => {
        if (event.target.type === 'checkbox') {
            const checkboxes = document.querySelectorAll('input[name="antecedente"]');
            checkboxes.forEach(checkbox => {
                if (checkbox !== event.target) {
                    checkbox.checked = false;
                }
            });
            aplicarBonus(event.target);  // Chama a função original de aplicar bônus
        }
    });
}

async function carregarHabilidades() {
    const habilidadesDiv = document.getElementById('habilidades-div');

    // Busca todas as habilidades no Firestore
    const querySnapshot = await getDocs(collection(db, "habilidades"));

    querySnapshot.forEach(doc => {
        const habilidade = doc.data();

        // Criação do container da habilidade
        const divHabilidade = document.createElement('div');
        divHabilidade.classList.add('habilidade');

        const titulo = document.createElement('h3');
        titulo.textContent = habilidade.nome;
        divHabilidade.appendChild(titulo);

        const requisito = document.createElement('p');
        requisito.textContent = `Requisito: ${habilidade.requiAt} ${habilidade.requiVal}`;
        divHabilidade.appendChild(requisito);

        const descricao = document.createElement('p');
        descricao.textContent = habilidade.descricao;
        divHabilidade.appendChild(descricao);

        const labelCheckbox = document.createElement('label');
        labelCheckbox.classList.add('label-disabled');

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.name = 'habilidade';
        checkbox.dataset.nome = habilidade.nome;
        checkbox.dataset.requisito = JSON.stringify({ atributo: habilidade.requiAt, valor: habilidade.requiVal });

        // Verifica se o jogador atende ao pré-requisito
        const atributoAtual = document.getElementById(habilidade.requiAt)?.textContent || "0";
        if (parseInt(atributoAtual, 10) < habilidade.requiVal) {
            checkbox.disabled = true;  // Desabilita o checkbox se o requisito não for atendido
            labelCheckbox.appendChild(checkbox);
            labelCheckbox.appendChild(document.createTextNode(' Pré-requisito não atendido'));
        } else {
            labelCheckbox.appendChild(checkbox);
            labelCheckbox.appendChild(document.createTextNode(' Selecionar'));
        }

        divHabilidade.appendChild(labelCheckbox);
        habilidadesDiv.appendChild(divHabilidade);
    });

    // Evento para gerenciar a seleção de checkboxes
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

async function carregarMarcas() {
    const marcaDiv = document.getElementById('marca-div');
    
    // Busca todas as marcas no Firestore
    const querySnapshot = await getDocs(collection(db, "marcas"));

    querySnapshot.forEach((doc) => {
        const marca = doc.data();

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

    // Mantém a lógica de seleção única
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

    marcaDiv.style.display = antecedenteSelecionado ? 'block' : 'none';
    
    if (!antecedenteSelecionado) {
        const checkboxes = document.querySelectorAll('input[name="marca"]');
        checkboxes.forEach(checkbox => checkbox.checked = false);
    }
}

function aplicarBonus(selecionado) {
    const atributos = document.querySelectorAll('.atribute-value');
    const botoes = document.querySelectorAll('.atribute-btn');
    const habilidadeCheckboxes = document.querySelectorAll('.habilidade input[type="checkbox"]');

    // Resetar estados
    antecedenteAtual = null;
    botoes.forEach(botao => botao.disabled = false);
    atributos.forEach(atributo => atributo.textContent = 0);
    
    habilidadeCheckboxes.forEach(checkbox => {
        checkbox.disabled = false;
        checkbox.checked = false;
        checkbox.parentElement.lastChild.textContent = " Selecionar";
    });

    if (selecionado.checked) {
        const atributoId = selecionado.dataset.bonus.toLowerCase();
        const atributo = document.getElementById(atributoId);

        if (!atributo) {
            console.warn(`Atributo "${atributoId}" não encontrado.`);
            return;
        }

        // Aplicar bônus
        atributo.textContent = selecionado.dataset.valor;
        document.querySelectorAll(`[data-atribute="${atributoId}"]`).forEach(botao => botao.disabled = true);

        // Definir antecedente atual com dados do Firestore
        antecedenteAtual = {
            nome: selecionado.closest('.antecedente').querySelector('h3').textContent,
            atributo: atributoId,
            valor: parseInt(selecionado.dataset.valor),
            habilidade: selecionado.dataset.habilidade
        };

        // Gerenciar habilidade relacionada
        const habilidadeRelacionada = Array.from(habilidadeCheckboxes).find(
            checkbox => checkbox.dataset.nome === selecionado.dataset.habilidade
        );

        if (habilidadeRelacionada) {
            habilidadeRelacionada.checked = true;
            habilidadeRelacionada.disabled = true;
            habilidadeRelacionada.parentElement.lastChild.textContent = " Selecionado (Antecedente)";
        }
    }

    atualizarDivMarca();
    atualizarPontosRestantes();
}

function atualizarPontosRestantes() {
    const pontosRestantesEl = document.querySelector('.pontos-restantes');
    if (!pontosRestantesEl) {
        console.warn('Elemento ".pontos-restantes" não encontrado.');
        return 0;
    }

    const atributos = document.querySelectorAll('.atribute-value');
    let soma = 0;

    atributos.forEach(atributo => {
        const valorAtual = parseInt(atributo.textContent, 10) || 0;
        if (antecedenteAtual && antecedenteAtual.atributo === atributo.id.toLowerCase()) {
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
        const atributoAtualEl = document.getElementById(requisito.atributo.toLowerCase());

        if (!atributoAtualEl) {
            console.warn(`Atributo "${requisito.atributo.toLowerCase()}" não encontrado.`);
            return;
        }

        const atributoAtual = parseInt(atributoAtualEl.textContent, 10) || 0;
        const label = checkbox.parentElement;

        // Verifica se a habilidade está associada ao antecedente selecionado
        if (antecedenteAtual && checkbox.dataset.nome === antecedenteAtual.habilidade) {
            checkbox.disabled = true;
            checkbox.checked = true;
            label.classList.remove('label-disabled');
            label.lastChild.textContent = ' Selecionada (Antecedente)';
        } else if (atributoAtual < requisito.valor) {
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
    const atributoId = atributo.toLowerCase();
    const valorEl = document.getElementById(atributoId);

    if (!valorEl) {
        console.warn(`Elemento de atributo "${atributoId}" não encontrado.`);
        return;
    }

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

async function criarFicha() {
    // Verifica se o usuário está logado
    if (!auth.currentUser) {
        alert("Você precisa estar logado para criar uma ficha!");
        return;
    }


    const userId = auth.currentUser.uid;
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.data();

 

    // Coleta dos dados do formulário
    const nomePersonagem = document.querySelector('input[name="ocName"]').value || "Sem Nome";
    const recompensa = parseInt(document.querySelector('input[name="reward"]').value, 10) || 0;
    const bando = document.querySelector('input[name="group"]').value || "Sem Bando";
    const username = userData.username || "Não informado";

    console.log(username);
    // Captura a marca selecionada
    const marcaCheckbox = document.querySelector('.marca-div input[type="checkbox"]:checked');
    const marca = marcaCheckbox ? marcaCheckbox.value : "Sem Marca";

    // Captura os atributos
    const atributos = {
        forca: parseInt(document.getElementById('força').textContent, 10),
        sagacidade: parseInt(document.getElementById('sagacidade').textContent, 10),
        mente: parseInt(document.getElementById('mente').textContent, 10),
        resiliencia: parseInt(document.getElementById('resiliência').textContent, 10),
        sabedoria: parseInt(document.getElementById('sabedoria').textContent, 10),
        celeridade: parseInt(document.getElementById('celeridade').textContent, 10),
    };

    // Cálculo de vitalidade
    const rolarD6 = () => Math.floor(Math.random() * 6) + 1;
    let vitalidadeBonus = 0;

    for (let i = 0; i < atributos.resiliencia; i++) {
        const dadoRolado = rolarD6();
        const bonusPorResiliencia = Math.floor((dadoRolado + 1) / 2);
        vitalidadeBonus += bonusPorResiliencia;
    }

    const vitalidadeMaxima = 6 + vitalidadeBonus;

    // Captura das habilidades selecionadas
    const habilidadesSelecionadas = Array.from(
        document.querySelectorAll('.habilidade input[type="checkbox"]:checked')
    ).map(checkbox => checkbox.dataset.nome);

    // Captura do antecedente selecionado
    const antecedenteSelecionado = antecedenteAtual
        ? {
            nome: antecedenteAtual.nome,
            atributo: antecedenteAtual.atributo,
            valor: antecedenteAtual.valor,
            habilidade: antecedenteAtual.habilidade
        }
        : null;

    try {
        // Cria o documento no Firestore
        const docRef = await addDoc(collection(db, "personagens"), {
            dataCriacao: serverTimestamp(),
            dataAtualizacao: serverTimestamp(),
            userId: userId,
            dadosPersonagem: {
                nome: nomePersonagem,
                nomeUsuario: username,
                recompensa: recompensa,
                bando: bando,
                antecedente: antecedenteSelecionado?.nome || "Sem Antecedente",
                marca: marca,
                atributos: atributos,
                habilidades: habilidadesSelecionadas,
                vitalidade: {
                    maximo: vitalidadeMaxima,
                    atual: vitalidadeMaxima
                },
                vigor: {
                    maximo: 6,
                    atual: 6
                },
                deck: [],
                mao: [],
                descarte: []
            }
        });

        alert(`Ficha criada com sucesso! ID: ${docRef.id}`);
        window.location.href = "../profile/profile.html";  // Redireciona ou atualiza a interface conforme necessário
        // Redireciona ou atualiza a interface conforme necessário
    } catch (error) {
        console.error("Erro ao criar ficha:", error);
        alert("Erro ao criar ficha. Tente novamente.");
    }
}
// function criarFicha() {
//     const nomePersonagem = document.querySelector('input[name="ocName"]').value || "Sem Nome";
//     const nomeJogador = document.querySelector('input[name="plName"]').value || "Jogador";
//     const recompensa = parseInt(document.querySelector('input[name="reward"]').value, 10) || 0;
//     const bando = document.querySelector('input[name="group"]').value || "Sem Bando";

//     // Capturar a marca selecionada
//     const marcaCheckbox = document.querySelector('.marca-div input[type="checkbox"]:checked');
//     const marca = marcaCheckbox ? marcaCheckbox.value : "Sem Marca";

//     const atributos = {
//         força: parseInt(document.getElementById('força').textContent, 10),
//         sagacidade: parseInt(document.getElementById('sagacidade').textContent, 10),
//         mente: parseInt(document.getElementById('mente').textContent, 10),
//         resiliência: parseInt(document.getElementById('resiliência').textContent, 10),
//         sabedoria: parseInt(document.getElementById('sabedoria').textContent, 10),
//         celeridade: parseInt(document.getElementById('celeridade').textContent, 10),
//     };

//     // Calc de vitalidade com resiliência
//     const rolarD6 = () => Math.floor(Math.random() * 6) + 1;
//     let vitalidadeBonus = 0;

//     for (let i = 0; i < atributos.resiliência; i++) {
//         const dadoRolado = rolarD6();
//         const bonusPorResiliencia = Math.floor((dadoRolado + 1) / 2);
//         vitalidadeBonus += bonusPorResiliencia;
//     }

//     const vitalidadeMaxima = 6 + vitalidadeBonus;

//     // Habilidades com Nome e Descrição
//     const habilidadesSelecionadas = Array.from(document.querySelectorAll('.habilidade input[type="checkbox"]'))
//         .filter(checkbox => checkbox.checked)
//         .map(checkbox => {
//             const nome = checkbox.dataset.nome;
//             const habilidadeEncontrada = habilidades.find(habilidade => habilidade.Nome === nome);

//             if (habilidadeEncontrada) {
//                 return {
//                     Nome: habilidadeEncontrada.Nome,
//                     Descrição: habilidadeEncontrada.Descrição
//                 };
//             } else {
//                 console.error(`Habilidade "${nome}" não encontrada no JSON de habilidades.`);
//                 return { Nome: nome, Descrição: "Descrição não encontrada." };
//             }
//         });

//     const antecedenteSelecionado = antecedenteAtual
//         ? {
//             nome: antecedentes.find(a => a.habilidade === antecedenteAtual.habilidade)?.nome || "Sem Antecedente",
//             atributo: antecedenteAtual.atributo,
//             valor: antecedenteAtual.valor,
//             habilidade: antecedenteAtual.habilidade
//         }
//         : null;

//     // Construindo o JSON da ficha
//     const ficha = {
//         nomePersonagem,
//         nomeJogador,
//         recompensa,
//         bando,
//         marca,
//         atributos,
//         habilidadesSelecionadas,
//         antecedenteSelecionado,
//         vitalidade: {
//             maximo: vitalidadeMaxima,
//             atual: vitalidadeMaxima,
//         },
//         estresse: {
//             maximo: 6,
//             atual: 0,
//         }
//     };

//     const fichaJSON = JSON.stringify(ficha, null, 2);

//     const blob = new Blob([fichaJSON], { type: 'application/json' });
//     const url = URL.createObjectURL(blob);
//     const link = document.createElement('a');
//     link.href = url;
//     link.download = `${nomePersonagem || 'ficha'}.json`;
//     link.click();
//     URL.revokeObjectURL(url);

//     alert(`Vitalidade máxima calculada: ${vitalidadeMaxima}`);
// }

// function abrirFicha() {
//     const input = document.createElement('input');
//     input.type = 'file';
//     input.accept = 'application/json';

//     input.addEventListener('change', (event) => {
//         const file = event.target.files[0];
//         if (!file) {
//             alert('Nenhum arquivo selecionado!');
//             return;
//         }

//         const reader = new FileReader();
//         reader.onload = (e) => {
//             try {
//                 const ficha = JSON.parse(e.target.result);

//                 const novaJanela = window.open('ficha/ficha.html', '_blank');

//                 novaJanela.onload = () => {
//                     novaJanela.carregarFicha(ficha); 
//                 };
//             } catch (error) {
//                 alert('Erro ao ler o arquivo JSON. Certifique-se de que o formato está correto.');
//             }
//         };

//         reader.readAsText(file);
//     });

//     input.click();
// }



document.addEventListener('DOMContentLoaded', () => {
    configurarBotoes();
    carregarHabilidades();
    carregarAntecedentes();
    carregarMarcas();

    const botaoCriarFicha = document.getElementById('criar-ficha');
    if (botaoCriarFicha) {
        botaoCriarFicha.addEventListener('click', criarFicha);
    }

    const botaoAbrirFicha = document.getElementById('abrir-ficha');
    if (botaoAbrirFicha) {
        botaoAbrirFicha.addEventListener('click', abrirFicha);
    }

    
});

