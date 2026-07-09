import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyC72dlOMpIZf47nyw02S3DnEDolDfPMfMc",
    authDomain: "quiz-web-4a9cf.firebaseapp.com",
    projectId: "quiz-web-4a9cf",
    storageBucket: "quiz-web-4a9cf.firebasestorage.app",
    messagingSenderId: "867492930551",
    appId: "1:867492930551:web:0c93883fb9f54f5d47c4f2"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };