<?php
$servername = "localhost";
$username = "u675720223_ambervc";
$password = 'B14:$i>~t';
$dbname = "u675720223_snakeyes_db";

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    die("Falha na conexão: " . $conn->connect_error);
}

$conn->set_charset("utf8");
?>
