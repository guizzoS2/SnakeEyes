<?php
require_once 'conn.php';

function getHabilidades() {
    global $conn;

    $result = $conn->query("SELECT id, nome, descricao, atRequisito, atValor FROM habilidades WHERE tipo = 0");

    $habilidades = [];
    while ($row = $result->fetch_assoc()) {
        $habilidades[] = $row;
    }

    return $habilidades;
}
?>
