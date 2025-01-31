<?php
require_once 'src/php/get_antecedentes.php';
require_once 'src/php/get_habilidades.php';

$antecedentes = getAntecedentes();
$habilidades = getHabilidades();
$marcas = ['Sombra', 'Luz', 'Aço', 'Natureza'];
?>

<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Criação de Personagem</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <form action="createOc.php" method="post">
        <div class="creation-div">
            <h1>Infos Gerais</h1>
            <label for="ocName">Nome do Personagem</label>
            <input type="text" name="ocName" required>

            <label for="reward">Recompensa</label>
            <input type="number" name="reward" required>

            <label for="group">Bando</label>
            <input type="text" name="group">
        </div>

        <div class="creation-div">
            <h1>Antecedente</h1>
            <?php foreach ($antecedentes as $antecedente): ?>
                <label>
                    <input type="radio" name="idAntecedente" value="<?= $antecedente['id'] ?>" required>
                    <?= $antecedente['nome'] ?> - <?= $antecedente['descricao'] ?>
                </label>
            <?php endforeach; ?>
        </div>

        <div class="creation-div">
            <h1>Marca</h1>
            <?php foreach ($marcas as $marca): ?>
                <label>
                    <input type="radio" name="marca" value="<?= $marca ?>" required>
                    <?= $marca ?>
                </label>
            <?php endforeach; ?>
        </div>

        <div class="creation-div" id="habilidades-div">
            <h1>Habilidades</h1>
            <?php foreach ($habilidades as $habilidade): ?>
                <div class="habilidade">
                    <h3><?= $habilidade['nome'] ?></h3>
                    <p>Requisito: <?= $habilidade['atRequisito'] ?> <?= $habilidade['atValor'] ?></p>
                    <p><?= $habilidade['descricao'] ?></p>
                    
                    <?php 
                    // Simulando os valores dos atributos para verificar os pré-requisitos
                    // No ambiente real, esses valores seriam puxados da ficha do personagem
                    $atributoAtual = rand(0, 5); // Supondo valores simulados, ajuste conforme necessário
                    $requisitoAtendido = $atributoAtual >= $habilidade['atValor'];
                    ?>

                    <label class="<?= $requisitoAtendido ? '' : 'label-disabled' ?>">
                        <input 
                            type="checkbox" 
                            name="habilidades[]" 
                            value="<?= $habilidade['id'] ?>" 
                            <?= !$requisitoAtendido ? 'disabled' : '' ?>
                            data-requisito="<?= $habilidade['atRequisito'] ?>"
                        >
                        <?= $requisitoAtendido ? 'Selecionar' : 'Pré-requisito não atendido' ?>
                    </label>
                </div>
            <?php endforeach; ?>
        </div>

        <div class="creation-div">
            <button type="submit">Criar Ficha</button>
        </div>
    </form>
</body>
</html>
