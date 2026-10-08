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

/** Qualquer usuário autenticado pode usar as páginas compartilhadas */
function requireSession() {
  var u = typeof getSession === "function" ? getSession() : getSessionLocal();
  if (!u || !u.role) {
    if (typeof goToIndex === "function") goToIndex();
    else window.location.href = "index.html";
    return null;
  }
  return u;
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
  // Páginas exclusivas do admin
  $$(".nav a").forEach(function (a) {
    var href = (a.getAttribute("href") || "").toLowerCase();
    if (href.indexOf("usuarios") !== -1 || href.indexOf("inteligente") !== -1) {
      a.style.display = role === "administrador" ? "" : "none";
    }
  });
  // Link ficha do aluno: mostra só para aluno
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

  var current = location.pathname.split("/").pop();
  $$(".nav a").forEach(function (a) {
    var href = a.getAttribute("href") || "";
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
            window.location.href = "index.html";
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
