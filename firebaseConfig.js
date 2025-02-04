import { initializeApp } from "https://www.gstatic.com/firebasejs/9.16.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.16.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.16.0/firebase-auth.js";

// Configuração do Firebase (insira a correta)
const firebaseConfig = {
    apiKey: "AIzaSyD3-oTFAdmgSJEtgIlXizR5fJavf6MiEFs",
    authDomain: "snake-eyes-55814.firebaseapp.com",
    projectId: "snake-eyes-55814",
    storageBucket: "snake-eyes-55814.firebasestorage.app",
    messagingSenderId: "625256423067",
    appId: "1:625256423067:web:f8263617f6b0cd8f9af03e",
    measurementId: "G-TP9GGXZ91T"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };