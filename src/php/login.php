<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
session_start();
require_once 'conn.php';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $username = trim($_POST["username"]);
    $password = $_POST["password"];

    $stmt = $conn->prepare("SELECT id, name, passw FROM users WHERE name = ?");
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 1) {
        $user = $result->fetch_assoc();

        if (password_verify($password, $user['passw'])) {
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['username'] = $user['name'];

            header("Location: ../../criarficha.html");
            exit();
        } else {
            echo "Senha incorreta.";
        }
    } else {
        echo "Usuário não registrado.";
    }

    $stmt->close();
    $conn->close();
}
?>
