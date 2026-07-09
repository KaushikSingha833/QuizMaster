import { auth } from './firebase-config.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const validatePassword = (password) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(password);
};

window.register = () => {
    const email = document.getElementById('email').value.trim();
    const pass = document.getElementById('password').value.trim();
    const errorEl = document.getElementById('auth-error');
    
    errorEl.style.color = "#ef4444";

    if (!email || !pass) {
        errorEl.innerText = "Please enter both email and password.";
        return;
    }

    if (!validatePassword(pass)) {
        errorEl.innerText = "Password must be at least 8 characters with 1 uppercase, 1 lowercase, 1 number, and 1 symbol.";
        return;
    }

    createUserWithEmailAndPassword(auth, email, pass)
        .then((userCredential) => {
            localStorage.setItem('currentUser', userCredential.user.email);
            window.location.href = 'index.html';
        })
        .catch((error) => {
            errorEl.innerText = error.message.replace("Firebase: ", "");
        });
};

window.login = () => {
    const email = document.getElementById('email').value.trim();
    const pass = document.getElementById('password').value.trim();
    const errorEl = document.getElementById('auth-error');
    
    errorEl.style.color = "#ef4444";

    if (!email || !pass) {
        errorEl.innerText = "Please enter both email and password.";
        return;
    }

    signInWithEmailAndPassword(auth, email, pass)
        .then((userCredential) => {
            localStorage.setItem('currentUser', userCredential.user.email);
            window.location.href = 'index.html';
        })
        .catch((error) => {
            errorEl.innerText = "Invalid credentials or user not found.";
        });
};

window.resetPassword = () => {
    const email = document.getElementById('email').value.trim();
    const errorEl = document.getElementById('auth-error');

    if (!email) {
        errorEl.style.color = "#2563eb";
        errorEl.innerText = "Enter your email above, then click Forgot Password.";
        return;
    }

    sendPasswordResetEmail(auth, email)
        .then(() => {
            errorEl.style.color = "#10b981";
            errorEl.innerText = "Password reset email sent! Check your inbox.";
        })
        .catch((error) => {
            errorEl.style.color = "#ef4444";
            errorEl.innerText = error.message.replace("Firebase: ", "");
        });
};

window.googleSignIn = () => {
    const provider = new GoogleAuthProvider();
    const errorEl = document.getElementById('auth-error');
    errorEl.style.color = "#ef4444";

    signInWithPopup(auth, provider)
        .then((result) => {
            localStorage.setItem('currentUser', result.user.email);
            window.location.href = 'index.html';
        })
        .catch((error) => {
            errorEl.innerText = error.message.replace("Firebase: ", "");
        });
};