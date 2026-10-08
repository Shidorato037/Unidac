// App compartilhado — páginas em /shared/pages/
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

function getSessionLocal() {
  try {
    var u = JSON.parse(localStorage.getItem("unidacUser") || "null");
    if (u && u.role) u.role = String(u.role).trim().toLowerCase();
    return u;
  } catch (e) {
    return null;
  }
}

function requireAnySession() {
  var u = typeof getSession === "function" ? getSession() : getSessionLocal();
  if (!u || !u.role) {
    window.location.href = new URL("../../index.html", window.location.href).href;
    return null;
  }
  return u;
}

function roleDashboardUrl(role) {
  return new URL("../../" + role + "/pages/dashboard.html", window.location.href).href;
}

function setupShared() {
  var u = requireAnySession();
  if (!u) return;

  var label = u.name || u.role || "Usuário";
  $$(".user-name").forEach(function (e) {
    e.textContent = label;
  });
  $$(".user-role").forEach(function (e) {
    e.textContent = u.role || "";
  });
  $$(".avatar").forEach(function (e) {
    e.textContent = (label || "U")[0].toUpperCase();
  });

  // Link Dashboard → painel do cargo
  $$('a[href="#dashboard"], a[href="dashboard.html"]').forEach(function (a) {
    a.setAttribute("href", roleDashboardUrl(u.role));
  });

  // Logout
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
            window.location.href = new URL("../../index.html", window.location.href).href;
          };
  });

  // Marca nav ativa
  var current = location.pathname.split("/").pop();
  $$(".nav a").forEach(function (a) {
    var href = a.getAttribute("href") || "";
    if (href.endsWith(current)) a.classList.add("active");
  });
}

document.addEventListener("DOMContentLoaded", setupShared);
