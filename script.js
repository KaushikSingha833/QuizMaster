function goToLogin() {
    window.location.href = 'auth.html';
}

function goToRegister() {
    window.location.href = 'auth.html';
}

function goToCreateQuiz() {
    window.location.href = 'create.html';
}

function goToTakeQuiz() {
    window.location.href = 'result.html';
}
function getUsers() {
    return JSON.parse(localStorage.getItem('quizUsers')) || [];
}

function register() {
    const user = document.getElementById('username').value.trim();
    const pass = document.getElementById('password').value.trim();
    const errorEl = document.getElementById('auth-error');

    if (!user || !pass) {
        errorEl.innerText = "Please enter both username and password.";
        return;
    }

    const users = getUsers();
    if (users.find(u => u.username === user)) {
        errorEl.innerText = "Username already exists.";
        return;
    }

    users.push({ username: user, password: pass });
    localStorage.setItem('quizUsers', JSON.stringify(users));
    localStorage.setItem('currentUser', user);
    window.location.href = 'index.html';
}

function login() {
    const user = document.getElementById('username').value.trim();
    const pass = document.getElementById('password').value.trim();
    const errorEl = document.getElementById('auth-error');

    const users = getUsers();
    const found = users.find(u => u.username === user && u.password === pass);

    if (found) {
        localStorage.setItem('currentUser', user);
        window.location.href = 'index.html';
    } else {
        errorEl.innerText = "Invalid credentials.";
    }
}