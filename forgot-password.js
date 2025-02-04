import { auth } from './firebaseConfig.js';
import { sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/9.16.0/firebase-auth.js";

const recoveryForm = document.getElementById('forgot-password-form');
const loadingOverlay = document.createElement('div');
loadingOverlay.className = 'loading-overlay';
loadingOverlay.innerHTML = '<div class="loading-spinner"></div>';
document.body.appendChild(loadingOverlay);

recoveryForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('recovery-email').value;

    try {
        loadingOverlay.style.display = 'flex';
        
        await sendPasswordResetEmail(auth, email);
        
        const feedback = document.createElement('div');
        feedback.className = 'feedback success';
        feedback.textContent = 'Instruções enviadas para seu telegrama eletrônico!';
        recoveryForm.prepend(feedback);
        
    } catch (error) {
        handleRecoveryError(error);
    } finally {
        loadingOverlay.style.display = 'none';
    }
});

function handleRecoveryError(error) {
    const errorMessages = {
        'auth/invalid-email': 'Email inválido',
        'auth/user-not-found': 'Pistoleiro não registrado'
    };

    const feedback = document.createElement('div');
    feedback.className = 'feedback error';
    feedback.textContent = errorMessages[error.code] || 'Erro ao enviar instruções';
    
    const existingFeedback = document.querySelector('.feedback');
    if (existingFeedback) existingFeedback.remove();
    
    recoveryForm.prepend(feedback);
}