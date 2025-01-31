<?php
require_once 'conn.php';

function getAntecedentes() {
    global $conn;
    $result = $conn->query("SELECT id, nome, descricao FROM antecedentes");
    $antecedentes = [];

    while ($row = $result->fetch_assoc()) {
        $antecedentes[] = $row;
    }

    return $antecedentes;
}
?>
