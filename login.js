import { auth } from './firebaseConfig.js';
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.16.0/firebase-auth.js";

const loginForm = document.getElementById('login-form');
const loadingOverlay = document.createElement('div');
loadingOverlay.className = 'loading-overlay';
loadingOverlay.innerHTML = '<div class="loading-spinner"></div>';
document.body.appendChild(loadingOverlay);

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        loadingOverlay.style.display = 'flex';
        
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        window.location.href = '/profile.html';
    } catch (error) {
        handleLoginError(error);
    } finally {
        loadingOverlay.style.display = 'none';
    }
});

function handleLoginError(error) {
    const errorMessages = {
        'auth/invalid-email': 'Email inválido',
        'auth/user-disabled': 'Conta desativada',
        'auth/user-not-found': 'Pistoleiro não registrado',
        'auth/wrong-password': 'Senha incorreta',
        'auth/too-many-requests': 'Muitas tentativas. Tente mais tarde'
    };

    const feedback = document.createElement('div');
    feedback.className = 'feedback error';
    feedback.textContent = errorMessages[error.code] || 'Erro ao fazer login';
    
    const existingFeedback = document.querySelector('.feedback');
    if (existingFeedback) existingFeedback.remove();
    
    loginForm.prepend(feedback);
}