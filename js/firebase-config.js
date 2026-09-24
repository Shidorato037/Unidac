// =====================================================
// Firebase Configuration - Unidac Industries
// =====================================================
const firebaseConfig = {
  apiKey: "AIzaSyA9en_wwMAqJ-1nrPmWuSelZyqjW1po8Vg",
  authDomain: "unidac-industries.firebaseapp.com",
  projectId: "unidac-industries",
  storageBucket: "unidac-industries.firebasestorage.app",
  messagingSenderId: "747701964546",
  appId: "1:747701964546:web:e0ac8df2da7f655beabc1b",
  measurementId: "G-SEEZ6HNTS8"
};

// Inicializa Firebase (compat)
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// =====================================================
// Funções de autenticação e sessão
// =====================================================

/**
 * Faz login buscando o usuário no Firestore
 */
async function firebaseLogin(email, password) {
  const normalizedEmail = email.trim().toLowerCase();

  // Busca o usuário pelo e-mail
  const snapshot = await db.collection("users")
    .where("email", "==", normalizedEmail)
    .limit(1)
    .get();

  if (snapshot.empty) {
    throw new Error("E-mail não encontrado.");
  }

  const doc = snapshot.docs[0];
  const user = doc.data();

  // Por enquanto a senha ainda é fixa (123456)
  // Depois podemos evoluir para Firebase Authentication
  if (password !== "123456") {
    throw new Error("Senha incorreta.");
  }

  if (user.active === false) {
    throw new Error("Usuário desativado.");
  }

  // Salva sessão
  const session = {
    id: doc.id,
    name: user.name,
    email: user.email,
    role: user.role
  };

  localStorage.setItem("unidacUser", JSON.stringify(session));
  return session;
}

/**
 * Retorna o usuário logado
 */
function getSession() {
  try {
    return JSON.parse(localStorage.getItem("unidacUser") || "null");
  } catch (e) {
    return null;
  }
}

/**
 * Faz logout
 */
function firebaseLogout() {
  localStorage.removeItem("unidacUser");
  const base = new URL("../../index.html", window.location.href).href;
  // Se estiver na raiz
  if (window.location.pathname.endsWith("index.html") || window.location.pathname.endsWith("/")) {
    window.location.href = "index.html";
  } else {
    window.location.href = new URL("../../index.html", window.location.href).href;
  }
}

/**
 * Exige que o usuário esteja logado com determinado role
 */
function requireSession(expectedRole) {
  const user = getSession();
  if (!user || (expectedRole && user.role !== expectedRole)) {
    window.location.href = new URL("../../index.html", window.location.href).href;
    return null;
  }
  return user;
}

// =====================================================
// Helpers de dados (Firestore)
// =====================================================

/**
 * Busca todos os documentos de uma coleção
 */
async function getCollection(name) {
  const snapshot = await db.collection(name).get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * Busca notificações
 */
async function getNotifications() {
  return getCollection("notifications");
}

/**
 * Busca estoque
 */
async function getStock() {
  return getCollection("stock");
}

/**
 * Busca produtos
 */
async function getProducts() {
  return getCollection("products");
}

/**
 * Busca compras
 */
async function getPurchases() {
  return getCollection("purchases");
}

/**
 * Busca registros de desperdício
 */
async function getWaste() {
  return getCollection("waste");
}

/**
 * Busca metas
 */
async function getGoals() {
  return getCollection("goals");
}
