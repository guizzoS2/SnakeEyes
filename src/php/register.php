<?php
require_once 'conn.php'; 

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $name = trim($_POST["username"]);
    $email = trim($_POST["email"]);
    $password = $_POST["password"];
    $confirm_password = $_POST["confirm-password"];
    $invite_code = trim($_POST["code"]);

    if ($password !== $confirm_password) {
        die("As senhas não coincidem!");
    }

    if (strlen($password) < 6) {
        die("A senha precisa ter pelo menos 6 caracteres.");
    }

    $stmt = $conn->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $stmt->store_result();
    if ($stmt->num_rows > 0) {
        die("Esse e-mail já está registrado. <a href='../../index.html'>Clique aqui para fazer login</a>");
    }
    $stmt->close();

    $password_hash = password_hash($password, PASSWORD_DEFAULT);

    $stmt = $conn->prepare("INSERT INTO users (name, email, passw) VALUES (?, ?, ?)");
    $stmt->bind_param("sss", $name, $email, $password_hash);

    if ($stmt->execute()) {
        echo "Registro concluído com sucesso! <a href='../../index.html'>Clique aqui para fazer login</a>";
    } else {
        echo "Erro ao registrar: " . $stmt->error;
    }

    $stmt->close();
    $conn->close();
}
?>
