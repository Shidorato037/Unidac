const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const ROLE_LABELS = {
  administrador: "Administrador",
  gerente: "Gerente",
  estoquista: "Estoquista",
  cozinheira: "Cozinheira",
  financeiro: "Financeiro",
  aluno: "Aluno",
  professor: "Professor",
  funcionario: "Funcionário"
};

function getSessionLocal() {
  try {
    var u = JSON.parse(localStorage.getItem("unidacUser") || "null");
    if (u && u.role) u.role = String(u.role).trim().toLowerCase();
    return u;
  } catch (e) {
    return null;
  }
}

function currentPageName() {
  var p = (location.pathname || "").split("/").pop() || "";
  return p.toLowerCase() || "index.html";
}

/** Evita loop: só redireciona para index se NÃO estiver no login */
function requireSession() {
  var u = typeof getSession === "function" ? getSession() : getSessionLocal();
  if (u && u.role) return u;

  var page = currentPageName();
  if (page === "index.html" || page === "" || page === "preview-alertas.html") {
    return null;
  }

  // Uma única troca de página (sem empilhar histórico)
  try {
    window.location.replace("index.html");
  } catch (e) {
    window.location.href = "index.html";
  }
  return null;
}

function showToast(msg) {
  if (typeof showUnidacAlert === "function") {
    var m = String(msg || "");
    if (/dados atualizados/i.test(m)) {
      showUnidacAlert("Dados atualizados", "success", "Sucesso", 2800);
      return;
    }
    showUnidacAlert(m);
    return;
  }
  var t = document.querySelector("#toast");
  if (!t) {
    t = document.createElement("div");
    t.id = "toast";
    t.className = "toast";
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(function () {
    t.classList.remove("show");
  }, 2800);
}

function applyRoleNav(role) {
  $$(".nav a").forEach(function (a) {
    var href = (a.getAttribute("href") || "").toLowerCase();
    if (href.indexOf("usuarios") !== -1 || href.indexOf("inteligente") !== -1) {
      a.style.display = role === "administrador" ? "" : "none";
    }
  });
  var fichaLink = document.querySelector('.nav a[href*="ficha"]');
  if (fichaLink) {
    fichaLink.style.display = role === "aluno" ? "" : "none";
  }
}

function setup() {
  var u = requireSession();
  if (!u) return;

  var role = u.role;
  var label = ROLE_LABELS[role] || role;
  var name = u.name || label;

  $$(".user-name").forEach(function (e) {
    e.textContent = name;
  });
  $$(".user-role").forEach(function (e) {
    e.textContent = label;
  });
  $$(".avatar").forEach(function (e) {
    e.textContent = (name || "U")[0].toUpperCase();
  });

  applyRoleNav(role);

  var current = currentPageName();
  $$(".nav a").forEach(function (a) {
    var href = (a.getAttribute("href") || "").toLowerCase();
    if (href === current || href.endsWith("/" + current)) a.classList.add("active");
  });

  $$(".logout").forEach(function (b) {
    b.type = "button";
    b.onclick =
      typeof doLogout === "function"
        ? doLogout
        : function (e) {
            if (e) {
              e.preventDefault();
              e.stopPropagation();
            }
            if (!confirm("Sair do sistema?\nSua sessão será encerrada neste dispositivo.")) return;
            localStorage.removeItem("unidacUser");
            window.location.replace("index.html");
          };
  });

  $$("[data-toast]").forEach(function (b) {
    b.onclick = function () {
      showToast(b.dataset.toast);
    };
  });
  $$(".progress i[data-width]").forEach(function (el) {
    requestAnimationFrame(function () {
      el.style.width = el.dataset.width + "%";
    });
  });
}

document.addEventListener("DOMContentLoaded", setup);
