import { db, auth } from './firebase-config.js';
import { collection, addDoc, getDocs, doc, getDoc, deleteDoc, query, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

window.customAlert = (message, callback) => {
    const overlay = document.createElement('div');
    overlay.className = 'custom-modal-overlay';
    overlay.innerHTML = `
        <div class="custom-modal">
            <h3>Notice</h3>
            <p>${message}</p>
            <button class="btn primary-btn" id="modal-ok-btn">OK</button>
        </div>
    `;
    document.body.appendChild(overlay);
    document.getElementById('modal-ok-btn').onclick = () => {
        document.body.removeChild(overlay);
        if (callback) callback();
    };
};

window.customConfirm = (message, onConfirm) => {
    const overlay = document.createElement('div');
    overlay.className = 'custom-modal-overlay';
    overlay.innerHTML = `
        <div class="custom-modal">
            <h3>Warning</h3>
            <p>${message}</p>
            <div class="custom-modal-buttons">
                <button class="btn outline-btn" id="modal-cancel-btn">Cancel</button>
                <button class="btn primary-btn" style="background-color: #ef4444;" id="modal-confirm-btn">Delete</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    document.getElementById('modal-cancel-btn').onclick = () => {
        document.body.removeChild(overlay);
    };
    document.getElementById('modal-confirm-btn').onclick = () => {
        document.body.removeChild(overlay);
        if (onConfirm) onConfirm();
    };
};

window.customPrompt = (message, inputValue, callback) => {
    const overlay = document.createElement('div');
    overlay.className = 'custom-modal-overlay';
    overlay.innerHTML = `
        <div class="custom-modal">
            <h3>Success!</h3>
            <p>${message}</p>
            <input type="text" class="auth-input" value="${inputValue}" id="modal-prompt-input" readonly style="text-align:center;">
            <div class="custom-modal-buttons">
                <button class="btn primary-btn" id="modal-copy-btn">Copy & Close</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    document.getElementById('modal-copy-btn').onclick = () => {
        const input = document.getElementById('modal-prompt-input');
        input.select();
        document.execCommand('copy');
        document.body.removeChild(overlay);
        if (callback) callback();
    };
};

const checkDomainAccess = (userEmail, allowedDomain) => {
    if (!allowedDomain) return true;
    const email = (userEmail || "").trim().toLowerCase();
    let domain = allowedDomain.trim().toLowerCase();
    
    if (domain.startsWith('*')) {
        domain = domain.substring(1);
    }
    if (!domain.startsWith('@')) {
        domain = '@' + domain;
    }
    
    return email.endsWith(domain);
};

onAuthStateChanged(auth, (user) => {
    if (user) {
        localStorage.setItem('currentUser', user.email);
        if (typeof window.renderNav === "function") window.renderNav();
    } else {
        localStorage.removeItem('currentUser');
        if (!window.location.pathname.endsWith('auth.html') && !window.location.pathname.endsWith('index.html') && !window.location.pathname.endsWith('/')) {
            window.location.href = 'auth.html';
        }
    }
});

window.logout = () => {
    signOut(auth).then(() => {
        localStorage.removeItem('currentUser');
        window.location.href = 'auth.html';
    });
};

window.toggleMenu = () => {
    const navLinks = document.getElementById('nav-links-menu');
    if(navLinks) navLinks.classList.toggle('active');
};

window.renderNav = () => {
    const nav = document.getElementById('navbar');
    const currentUser = localStorage.getItem('currentUser');
    const path = window.location.pathname;

    if (nav) {
        const logoHtml = `<div class="logo" onclick="window.location.href='index.html'" style="cursor: pointer;">QuizMaster</div>`;
        const hamburgerHtml = `<button class="hamburger-btn" onclick="window.toggleMenu()"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg></button>`;
        
        if (currentUser) {
            nav.innerHTML = `
                ${logoHtml}
                ${hamburgerHtml}
                <div class="nav-links" id="nav-links-menu">
                    <span id="welcome-msg" class="user-email" title="${currentUser}">${currentUser}</span>
                    <button onclick="window.logout()" class="logout-btn">Logout</button>
                </div>
            `;
        } else if (path.endsWith('index.html') || path === '/') {
            nav.innerHTML = `
                ${logoHtml}
                ${hamburgerHtml}
                <div class="nav-links" id="nav-links-menu">
                    <button class="nav-btn login-btn" onclick="window.location.href='auth.html'">Log In</button>
                    <button class="nav-btn register-btn" onclick="window.location.href='auth.html'">Register</button>
                </div>
            `;
        }
    }
};

window.addQuestionField = () => {
    const container = document.getElementById('questions-container');
    if (!container) return;
    const qCount = container.children.length;

    const div = document.createElement('div');
    div.className = 'q-block';
    div.innerHTML = `
        <input type="text" class="q-text full-width" placeholder="Question ${qCount + 1}">
        <div class="option-row">
            <input type="radio" name="correct-${qCount}" value="0" checked>
            <input type="text" class="opt-text" placeholder="Option A">
        </div>
        <div class="option-row">
            <input type="radio" name="correct-${qCount}" value="1">
            <input type="text" class="opt-text" placeholder="Option B">
        </div>
        <div class="option-row">
            <input type="radio" name="correct-${qCount}" value="2">
            <input type="text" class="opt-text" placeholder="Option C">
        </div>
        <div class="option-row">
            <input type="radio" name="correct-${qCount}" value="3">
            <input type="text" class="opt-text" placeholder="Option D">
        </div>
    `;
    container.appendChild(div);
};

window.saveQuiz = async () => {
    const title = document.getElementById('quiz-title').value.trim();
    const allowedDomain = document.getElementById('allowed-domain') ? document.getElementById('allowed-domain').value.trim() : '';
    const timeLimit = document.getElementById('time-limit') ? document.getElementById('time-limit').value : '';
    const expiryDate = document.getElementById('expiry-date') ? document.getElementById('expiry-date').value : '';
    const allowReattempt = document.getElementById('allow-reattempt') ? document.getElementById('allow-reattempt').value === 'true' : true;

    if (!title) {
        window.customAlert("Quiz title is required");
        return;
    }

    const qBlocks = document.querySelectorAll('.q-block');
    if (qBlocks.length === 0) {
        window.customAlert("Add at least one question");
        return;
    }

    const questions = [];
    let valid = true;

    qBlocks.forEach((block, index) => {
        const qText = block.querySelector('.q-text').value.trim();
        const opts = Array.from(block.querySelectorAll('.opt-text')).map(inp => inp.value.trim());
        const correctRadio = block.querySelector(`input[name="correct-${index}"]:checked`);

        if (!qText || opts.some(o => !o)) {
            valid = false;
        }

        questions.push({
            question: qText,
            options: opts,
            correctIndex: parseInt(correctRadio.value)
        });
    });

    if (!valid) {
        window.customAlert("Please fill all questions and options");
        return;
    }

    const currentUser = localStorage.getItem('currentUser');
    try {
        const docRef = await addDoc(collection(db, "quizzes"), {
            title: title,
            creator: currentUser,
            allowedDomain: allowedDomain,
            timeLimit: timeLimit ? parseInt(timeLimit) : null,
            expiryDate: expiryDate || null,
            allowReattempt: allowReattempt,
            questions: questions,
            createdAt: new Date()
        });

        const basePath = window.location.href.substring(0, window.location.href.lastIndexOf('/'));
        const shareableLink = `${basePath}/take.html?id=${docRef.id}`;
        
        window.customPrompt("Quiz saved! Share this link:", shareableLink, () => {
            window.location.href = 'index.html';
        });
    } catch (e) {
        window.customAlert("Error saving quiz: " + e.message);
    }
};

window.loadQuizzes = async () => {
    const list = document.getElementById('quiz-list');
    if (!list) return;
    list.innerHTML = '<p style="text-align:center;">Loading quizzes...</p>';

    const currentUser = localStorage.getItem('currentUser') || '';

    try {
        const querySnapshot = await getDocs(collection(db, "quizzes"));
        list.innerHTML = '';
        let hasVisibleQuizzes = false;

        querySnapshot.forEach((docSnap) => {
            const q = docSnap.data();
            let canAccess = true;

            if (q.expiryDate && new Date(q.expiryDate) < new Date()) {
                canAccess = false;
            }

            if (canAccess && q.allowedDomain && q.creator !== currentUser) {
                if (!checkDomainAccess(currentUser, q.allowedDomain)) {
                    canAccess = false;
                }
            }

            if (canAccess) {
                hasVisibleQuizzes = true;
                const div = document.createElement('div');
                div.className = 'quiz-item';
                div.innerHTML = `
                    <span><strong>${q.title}</strong> (by ${q.creator})</span>
                    <button class="btn primary-btn" onclick="window.startQuiz('${docSnap.id}')">Start</button>
                `;
                list.appendChild(div);
            }
        });

        if (!hasVisibleQuizzes) {
            list.innerHTML = '<p style="text-align:center;">No quizzes available for your account.</p>';
        }
    } catch (e) {
        list.innerHTML = '<p style="text-align:center; color:#ef4444;">Error loading quizzes.</p>';
    }
};

window.startQuiz = (id) => {
    window.location.href = `take.html?id=${id}`;
};

let currentQIndex = 0;
let userAnswers = [];
let activeQuiz = null;
let activeQuizId = null;
let quizTimerInterval = null;

window.initTakeQuiz = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    activeQuizId = urlParams.get('id');

    if (!activeQuizId) {
        window.location.href = 'list.html';
        return;
    }

    const currentUser = localStorage.getItem('currentUser') || '';

    try {
        const docRef = doc(db, "quizzes", activeQuizId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            activeQuiz = docSnap.data();

            if (activeQuiz.expiryDate && new Date(activeQuiz.expiryDate) < new Date()) {
                window.customAlert("This quiz has expired and is no longer accepting responses.", () => {
                    window.location.href = 'list.html';
                });
                return;
            }
            
            if (activeQuiz.allowedDomain && activeQuiz.creator !== currentUser) {
                if (!checkDomainAccess(currentUser, activeQuiz.allowedDomain)) {
                    window.customAlert("Unauthorized: This quiz is restricted to the " + activeQuiz.allowedDomain + " organization.", () => {
                        window.location.href = 'list.html';
                    });
                    return;
                }
            }
            
            if (activeQuiz.allowReattempt === false) {
                const q = query(collection(db, "responses"), where("quizId", "==", activeQuizId), where("taker", "==", currentUser));
                const responseSnap = await getDocs(q);
                if (!responseSnap.empty) {
                    window.customAlert("You have already completed this quiz. Multiple attempts are not allowed.", () => {
                        window.location.href = 'list.html';
                    });
                    return;
                }
            }
            
            activeQuiz.questions.sort(() => Math.random() - 0.5);
            
            activeQuiz.questions.forEach(q => {
                const correctAnswerText = q.options[q.correctIndex];
                q.options.sort(() => Math.random() - 0.5);
                q.correctIndex = q.options.indexOf(correctAnswerText);
            });

            document.getElementById('take-quiz-title').innerText = activeQuiz.title;
            window.renderQuestion();

            if (activeQuiz.timeLimit && activeQuiz.timeLimit > 0) {
                window.startTimer(activeQuiz.timeLimit);
            }

        } else {
            window.customAlert("Quiz not found.", () => {
                window.location.href = 'list.html';
            });
        }
    } catch (e) {
        window.customAlert("Error loading quiz.", () => {
            window.location.href = 'list.html';
        });
    }
};

window.startTimer = (minutes) => {
    let timeRemaining = minutes * 60;
    const display = document.getElementById('timer-display');
    display.style.display = 'block';

    quizTimerInterval = setInterval(() => {
        if (timeRemaining <= 0) {
            clearInterval(quizTimerInterval);
            window.customAlert("Time is up! Your quiz will now be submitted automatically.", () => {
                window.submitQuizAction();
            });
        } else {
            const mins = Math.floor(timeRemaining / 60);
            const secs = timeRemaining % 60;
            display.innerText = `Time Left: ${mins}:${secs < 10 ? '0' : ''}${secs}`;
            timeRemaining--;
        }
    }, 1000);
};

window.renderQuestion = () => {
    const q = activeQuiz.questions[currentQIndex];
    const display = document.getElementById('question-display');
    const btn = document.getElementById('next-btn');
    const progText = document.getElementById('progress-text');
    const progBar = document.getElementById('progress-bar');

    if (progText) {
        progText.innerText = `Question ${currentQIndex + 1} of ${activeQuiz.questions.length}`;
    }
    
    if (progBar) {
        const percentage = ((currentQIndex + 1) / activeQuiz.questions.length) * 100;
        progBar.style.width = percentage + '%';
    }

    let html = `<h3>${q.question}</h3><div style="margin-top:15px">`;
    q.options.forEach((opt, idx) => {
        html += `<button class="take-option" onclick="window.selectOption(this, ${idx})">${opt}</button>`;
    });
    html += `</div>`;
    display.innerHTML = html;

    if (currentQIndex === activeQuiz.questions.length - 1) {
        btn.innerText = "Submit Quiz";
    } else {
        btn.innerText = "Next";
    }
};

window.selectOption = (btnElement, index) => {
    const options = document.querySelectorAll('.take-option');
    options.forEach(opt => opt.classList.remove('selected'));
    btnElement.classList.add('selected');
    userAnswers[currentQIndex] = index;
};

window.nextQuestion = () => {
    if (userAnswers[currentQIndex] === undefined) {
        window.customAlert("Please select an answer before continuing.");
        return;
    }

    if (currentQIndex < activeQuiz.questions.length - 1) {
        currentQIndex++;
        window.renderQuestion();
    } else {
        if (quizTimerInterval) clearInterval(quizTimerInterval);
        window.submitQuizAction();
    }
};

window.submitQuizAction = async () => {
    let score = 0;
    let detailedAnswers = [];

    activeQuiz.questions.forEach((q, idx) => {
        const uAns = userAnswers[idx];
        const isCorrect = uAns === q.correctIndex;
        if (isCorrect) score++;

        detailedAnswers.push({
            questionText: q.question,
            userAnswerText: uAns !== undefined ? q.options[uAns] : "No Answer Provided",
            correctAnswerText: q.options[q.correctIndex],
            isCorrect: isCorrect
        });
    });

    const currentUser = localStorage.getItem('currentUser') || "Anonymous Guest";

    try {
        await addDoc(collection(db, "responses"), {
            quizId: activeQuizId,
            quizTitle: activeQuiz.title,
            creator: activeQuiz.creator,
            taker: currentUser,
            score: score,
            totalQuestions: activeQuiz.questions.length,
            details: detailedAnswers,
            timestamp: new Date()
        });
    } catch (e) {
        console.error("Failed to save response", e);
    }

    localStorage.setItem('recentAnswers', JSON.stringify(userAnswers));
    localStorage.setItem('recentQuizData', JSON.stringify(activeQuiz));
    window.location.href = 'result.html';
};

window.showResultsPage = () => {
    const answersStr = localStorage.getItem('recentAnswers');
    const quizStr = localStorage.getItem('recentQuizData');

    if (!answersStr || !quizStr) {
        window.location.href = 'index.html';
        return;
    }

    const quiz = JSON.parse(quizStr);
    const ans = JSON.parse(answersStr);

    let score = 0;
    const reviewBox = document.getElementById('review-display');
    reviewBox.innerHTML = '';

    quiz.questions.forEach((q, idx) => {
        const uAns = ans[idx];
        const isCorrect = uAns === q.correctIndex;
        if (isCorrect) score++;

        const div = document.createElement('div');
        div.className = 'review-item';
        div.innerHTML = `
            <p><strong>Q: ${q.question}</strong></p>
            <p>Your Answer: <span class="${isCorrect ? 'correct-text' : 'wrong-text'}">${uAns !== null && uAns !== undefined ? q.options[uAns] : 'None'}</span></p>
            ${!isCorrect ? `<p>Correct Answer: <span class="correct-text">${q.options[q.correctIndex]}</span></p>` : ''}
        `;
        reviewBox.appendChild(div);
    });

    document.getElementById('score-display').innerText = `You scored ${score} out of ${quiz.questions.length}`;
};

window.dashboardResponses = [];
window.userQuizzesList = [];

window.loadDashboard = async () => {
    const list = document.getElementById('responses-list');
    const filterDropdown = document.getElementById('quiz-filter');
    if (!list || !filterDropdown) return;
    
    list.innerHTML = '<p style="text-align:center;">Loading data...</p>';
    const currentUser = localStorage.getItem('currentUser');

    try {
        const qQuery = query(collection(db, "quizzes"), where("creator", "==", currentUser));
        const quizzesSnap = await getDocs(qQuery);
        
        const userQuizzes = [];
        quizzesSnap.forEach(doc => {
            userQuizzes.push({ id: doc.id, ...doc.data() });
        });

        window.userQuizzesList = userQuizzes;

        if (userQuizzes.length === 0) {
            list.innerHTML = '<p style="text-align:center;">You have not created any quizzes yet.</p>';
            filterDropdown.style.display = 'none';
            return;
        }

        filterDropdown.innerHTML = '<option value="">-- Select a Quiz --</option>';
        userQuizzes.forEach(q => {
            const opt = document.createElement('option');
            opt.value = q.id;
            opt.textContent = q.title;
            filterDropdown.appendChild(opt);
        });
        filterDropdown.style.display = 'block';

        const rQuery = query(collection(db, "responses"), where("creator", "==", currentUser));
        const responsesSnap = await getDocs(rQuery);
        
        window.dashboardResponses = [];
        responsesSnap.forEach(doc => {
            window.dashboardResponses.push({ docId: doc.id, ...doc.data() });
        });

        list.innerHTML = '<p style="text-align:center; color:#64748b;">Please select a quiz from the dropdown above to view results.</p>';

    } catch (e) {
        console.error("Dashboard Error:", e);
        list.innerHTML = '<p style="text-align:center; color:#ef4444;">Error: Check your Firebase rules and internet connection.</p>';
    }
};

window.filterResponses = () => {
    const filterId = document.getElementById('quiz-filter').value;
    const list = document.getElementById('responses-list');
    const linkContainer = document.getElementById('quiz-link-container');
    const linkInput = document.getElementById('shareable-link-input');
    const copyBtn = document.getElementById('dash-copy-btn');
    
    list.innerHTML = '';

    if (!filterId) {
        linkContainer.style.display = 'none';
        list.innerHTML = '<p style="text-align:center; color:#64748b;">Please select a quiz from the dropdown above to view results.</p>';
        return;
    }

    const selectedQuiz = window.userQuizzesList.find(q => q.id === filterId);

    if (selectedQuiz && selectedQuiz.expiryDate && new Date(selectedQuiz.expiryDate) < new Date()) {
        linkInput.value = "❌ This quiz has expired.";
        copyBtn.disabled = true;
        copyBtn.style.opacity = '0.5';
        copyBtn.style.cursor = 'not-allowed';
    } else {
        const basePath = window.location.href.substring(0, window.location.href.lastIndexOf('/'));
        linkInput.value = `${basePath}/take.html?id=${filterId}`;
        copyBtn.disabled = false;
        copyBtn.style.opacity = '1';
        copyBtn.style.cursor = 'pointer';
    }
    
    linkContainer.style.display = 'block';

    const filtered = window.dashboardResponses.filter(r => r.quizId === filterId);

    if (filtered.length === 0) {
        list.innerHTML = '<p style="text-align:center;">No responses for this quiz yet.</p>';
        return;
    }

    filtered.forEach(data => {
        let detailsHtml = '';
        if (data.details && data.details.length > 0) {
            detailsHtml += `<details style="margin-top: 15px; cursor: pointer; outline: none;"><summary style="font-weight: 600; color: #2563eb;">View Detailed Answers</summary><div style="margin-top: 12px; padding-left: 12px; border-left: 2px solid #e2e8f0;">`;
            data.details.forEach((d, i) => {
                detailsHtml += `
                    <div style="margin-bottom: 12px; font-size: 14px;">
                        <p style="margin-bottom: 4px; color: #334155;"><strong>Q${i+1}: ${d.questionText}</strong></p>
                        <p style="color: #64748b;">Participant Answer: <span style="font-weight:600; color: ${d.isCorrect ? '#10b981' : '#ef4444'};">${d.userAnswerText}</span></p>
                        ${!d.isCorrect ? `<p style="color: #64748b;">Correct Answer: <span style="font-weight:600; color:#10b981;">${d.correctAnswerText}</span></p>` : ''}
                    </div>
                `;
            });
            detailsHtml += `</div></details>`;
        } else {
            detailsHtml += `<p style="font-size: 13px; color: #94a3b8; margin-top: 10px;"><em>Detailed answers not available for this older attempt.</em></p>`;
        }

        const div = document.createElement('div');
        div.className = 'review-item';
        div.innerHTML = `
            <p><strong>Participant Email:</strong> ${data.taker}</p>
            <p><strong>Score:</strong> ${data.score} / ${data.totalQuestions}</p>
            ${detailsHtml}
        `;
        list.appendChild(div);
    });
};

window.copyDashboardLink = () => {
    const input = document.getElementById('shareable-link-input');
    if (!input.value.includes('http')) return;
    input.select();
    document.execCommand('copy');
    window.customAlert("Link copied to clipboard!");
};

window.deleteQuizAction = () => {
    const filterId = document.getElementById('quiz-filter').value;
    if (!filterId) {
        window.customAlert("Please select a quiz to delete first.");
        return;
    }

    window.customConfirm("Are you sure you want to completely delete this quiz and all of its responses? This action cannot be undone.", async () => {
        try {
            await deleteDoc(doc(db, "quizzes", filterId));

            const filteredResponses = window.dashboardResponses.filter(r => r.quizId === filterId);
            for (const resp of filteredResponses) {
                if (resp.docId) {
                    await deleteDoc(doc(db, "responses", resp.docId));
                }
            }

            window.customAlert("Quiz successfully deleted.", () => {
                window.location.reload();
            });
        } catch (e) {
            window.customAlert("Error deleting quiz: " + e.message);
        }
    });
};

document.addEventListener("DOMContentLoaded", () => {
    const path = window.location.pathname;

    if (path.endsWith('create.html')) {
        window.addQuestionField();
    } else if (path.endsWith('list.html')) {
        window.loadQuizzes();
    } else if (path.endsWith('take.html') || path.includes('take.html?')) {
        window.initTakeQuiz();
    } else if (path.endsWith('result.html')) {
        window.showResultsPage();
    } else if (path.endsWith('dashboard.html')) {
        window.loadDashboard();
    }

    if (!path.endsWith('auth.html') && typeof window.renderNav === "function") {
        window.renderNav();
    }
});

