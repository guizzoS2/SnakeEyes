import { auth, db } from '../../firebaseConfig.js';
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.16.0/firebase-auth.js";
import { doc, setDoc, getDocs, collection, query, where } from "https://www.gstatic.com/firebasejs/9.16.0/firebase-firestore.js";

const signupForm = document.getElementById('signup-form');
const usernameInput = document.getElementById('username');
const usernameFeedback = document.getElementById('username-feedback');

// Validação de Username
usernameInput.addEventListener('input', async (e) => {
    const username = e.target.value.trim();
    usernameFeedback.textContent = '';
    
    if (username.length < 3) {
        showFeedback('Mínimo 3 caracteres', 'error');
        return;
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        showFeedback('Apenas letras, números e _', 'error');
        return;
    }

    try {
        const usernameQuery = await getDocs(
            query(collection(db, "users"), where("username", "==", username))
        );
        
        if (usernameQuery.empty) {
            showFeedback('✅ Nome disponível', 'success');
        } else {
            showFeedback('❌ Nome já está em uso', 'error');
        }
    } catch (error) {
        showFeedback('Erro na verificação', 'error');
    }
});

// Submit do Formulário
signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = usernameInput.value.trim();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (!validateForm(username, email, password)) return;

    try {
        // Criar usuário no Authentication
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Salvar dados no Firestore
        await setDoc(doc(db, "users", user.uid), {
            username,
            email,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        window.location.href = '../index.html';
        
    } catch (error) {
        handleSignupError(error);
    }
});

// Funções Auxiliares
function validateForm(username, email, password) {
    if (username.length < 3) {
        showFeedback('Nome de usuário inválido', 'error');
        return false;
    }
    
    if (!/\S+@\S+\.\S+/.test(email)) {
        showFeedback('Email inválido', 'error');
        return false;
    }
    
    if (password.length < 6) {
        showFeedback('Senha deve ter pelo menos 6 caracteres', 'error');
        return false;
    }
    
    return true;
}

function showFeedback(message, type) {
    usernameFeedback.textContent = message;
    usernameFeedback.className = `feedback ${type}`;
}

function handleSignupError(error) {
    console.error('Erro no cadastro:', error);
    
    switch (error.code) {
        case 'auth/email-already-in-use':
            showFeedback('Este email já está em uso', 'error');
            break;
        case 'auth/invalid-email':
            showFeedback('Email inválido', 'error');
            break;
        case 'auth/weak-password':
            showFeedback('Senha muito fraca', 'error');
            break;
        default:
            showFeedback('Erro ao criar conta. Tente novamente.', 'error');
    }
}