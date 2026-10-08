// =====================================================
// Dashboard em tempo real — Unidac Industries
// =====================================================

var __dashUnsubs = [];
var __dashCache = {
  stock: [],
  waste: [],
  purchases: [],
  notifications: [],
  goals: [],
  financial: [],
  users: []
};

function dashToast(msg) {
  if (typeof showAppToast === "function") showAppToast(msg);
  else if (typeof showToast === "function") showToast(msg);
}

function formatBRL(v) {
  return "R$ " + Number(v || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
}

function sumWaste(list) {
  return (list || []).reduce(function (acc, w) {
    return acc + (Number(w.quantity) || 0);
  }, 0);
}

function stockStats(list) {
  var total = (list || []).length;
  var low = (list || []).filter(function (i) {
    var s = (i.status || "").toLowerCase();
    return s.indexOf("baixo") !== -1 || s.indexOf("atenção") !== -1 || s.indexOf("atencao") !== -1;
  }).length;
  var qty = (list || []).reduce(function (a, i) {
    return a + (Number(i.quantity) || 0);
  }, 0);
  return { total: total, low: low, qty: qty };
}

function financeBalance(list) {
  var saldo = 0;
  (list || []).forEach(function (m) {
    var v = Number(m.amount) || 0;
    var t = (m.type || "").toLowerCase();
    if (t.indexOf("receita") !== -1 || t === "entrada") saldo += v;
    else saldo -= v;
  });
  return saldo;
}

function pendingPurchases(list) {
  return (list || []).filter(function (p) {
    var s = (p.status || "").toLowerCase();
    return s.indexOf("pendente") !== -1 || s.indexOf("trânsito") !== -1 || s.indexOf("transito") !== -1;
  }).length;
}

function activeGoals(list) {
  return (list || []).filter(function (g) {
    return (g.status || "").indexOf("andamento") !== -1 || !g.status;
  }).length;
}

function unreadNotifications(list) {
  return (list || []).filter(function (n) {
    return n.read === false || n.read === "false" || n.read == null;
  }).length;
}

/** Atualiza elementos com data-live="chave" */
function applyDataLive(map) {
  document.querySelectorAll("[data-live]").forEach(function (el) {
    var key = el.getAttribute("data-live");
    if (map[key] !== undefined && map[key] !== null) {
      el.textContent = map[key];
    }
  });
  document.querySelectorAll("[data-live-html]").forEach(function (el) {
    var key = el.getAttribute("data-live-html");
    if (map[key] !== undefined && map[key] !== null) {
      el.innerHTML = map[key];
    }
  });
}

function buildMetrics() {
  var st = stockStats(__dashCache.stock);
  var wasteTotal = sumWaste(__dashCache.waste);
  var balance = financeBalance(__dashCache.financial);
  var pending = pendingPurchases(__dashCache.purchases);
  var goals = activeGoals(__dashCache.goals);
  var notif = unreadNotifications(__dashCache.notifications);
  var users = (__dashCache.users || []).length;

  return {
    "finance-balance": formatBRL(Math.abs(balance)) + (balance < 0 ? " (neg.)" : ""),
    "finance-balance-raw": formatBRL(balance),
    "waste-total": wasteTotal.toLocaleString("pt-BR") + " kg",
    "waste-total-num": String(wasteTotal),
    "stock-count": String(st.total),
    "stock-qty": String(st.qty),
    "stock-low": String(st.low),
    "stock-low-label": st.low
      ? st.low + " produto(s) precisam de atenção"
      : "Estoque estável",
    "purchases-pending": String(pending),
    "purchases-total": String((__dashCache.purchases || []).length),
    "goals-active": String(goals),
    "notifications-unread": String(notif),
    "users-count": String(users),
    "meals-placeholder": "—" // sem coleção de refeições ainda
  };
}

function updateDashboardStatsFallback(metrics) {
  // Dashboards sem data-live: tenta mapear .stats .stat na ordem comum
  var stats = document.querySelectorAll("section.stats article.stat, .grid.stats .stat, .stats .stat");
  if (!stats.length) return;

  // Heurística por texto do label (span no head)
  stats.forEach(function (article) {
    var labelEl = article.querySelector(".stat-head span, span");
    var strong = article.querySelector("strong");
    var small = article.querySelector("small");
    if (!labelEl || !strong) return;
    var label = (labelEl.textContent || "").toLowerCase();

    if (label.indexOf("saldo") !== -1 || label.indexOf("financeiro") !== -1 || label.indexOf("caixa") !== -1) {
      strong.textContent = metrics["finance-balance-raw"];
    } else if (label.indexOf("desperd") !== -1) {
      strong.textContent = metrics["waste-total"];
    } else if (label.indexOf("refei") !== -1 || label.indexOf("consumo") !== -1) {
      // sem fonte ainda — mostra compras/pedidos como proxy opcional
      strong.textContent = metrics["purchases-total"];
      if (small) small.textContent = "Pedidos registrados no sistema";
    } else if (label.indexOf("estoque") !== -1 || label.indexOf("produto") !== -1) {
      strong.textContent = metrics["stock-count"];
      if (small) {
        small.textContent = metrics["stock-low-label"];
        small.className = metrics["stock-low"] !== "0" ? "warning" : "positive";
      }
    } else if (label.indexOf("meta") !== -1 || label.indexOf("desafio") !== -1) {
      strong.textContent = metrics["goals-active"];
    } else if (label.indexOf("notif") !== -1 || label.indexOf("alerta") !== -1) {
      strong.textContent = metrics["notifications-unread"];
    } else if (label.indexOf("usuário") !== -1 || label.indexOf("usuario") !== -1) {
      strong.textContent = metrics["users-count"];
    } else if (label.indexOf("compra") !== -1 || label.indexOf("pedido") !== -1) {
      strong.textContent = metrics["purchases-pending"];
      if (small) small.textContent = "Pedidos pendentes / em trânsito";
    }
  });
}

function updateAlertsFromNotifications() {
  var list = __dashCache.notifications || [];
  var container =
    document.getElementById("alerts-container") ||
    document.getElementById("notification-list") ||
    document.querySelector("[data-live-list='notifications']");

  if (!container) return;

  var unread = list.filter(function (n) {
    return n.read === false || n.read === "false" || n.read == null;
  });
  var source = unread.length ? unread : list;

  if (!source.length) {
    container.innerHTML =
      '<div class="alert"><div><strong>Nenhum alerta</strong><p>Tudo certo no momento.</p></div></div>';
    return;
  }

  container.innerHTML = source
    .slice(0, 8)
    .map(function (n) {
      var sev = n.severity || "info";
      return (
        '<div class="alert" data-id="' + (n.id || "") + '">' +
        "<div><strong>" + (n.title || "Alerta") + "</strong>" +
        "<p>" + (n.message || "") + "</p></div></div>"
      );
    })
    .join("");
}

function refreshDashboardUI() {
  var metrics = buildMetrics();
  applyDataLive(metrics);
  updateDashboardStatsFallback(metrics);
  updateAlertsFromNotifications();

  // Graficos a partir  (sem mock)
  if (typeof drawBars === "function" && __dashCache.waste && __dashCache.waste.length) {
    var vals = __dashCache.waste.slice(-7).map(function (w) { return Number(w.quantity) || 0; });
    var labs = __dashCache.waste.slice(-7).map(function (w) {
      var d = (w.date || "").slice(5) || "";
      return d;
    });
    drawBars("#waste-chart", vals, labs);
  } else if (typeof drawBars === "function" && document.querySelector("#waste-chart")) {
    drawBars("#waste-chart", [], []);
  }


  // Listas auxiliares no dashboard
  if (document.querySelector("#stock-body") && typeof renderStock === "function") {
    renderStock(__dashCache.stock);
  }
  if (document.querySelector("#purchases-body") && typeof renderPurchases === "function") {
    renderPurchases(__dashCache.purchases);
  }
  if (document.querySelector("#notification-list") && typeof renderNotifications === "function") {
    renderNotifications(__dashCache.notifications);
  }
}

function watchCollection(name, cacheKey) {
  if (typeof listenCollection !== "function") return;
  var unsub = listenCollection(name, function (list) {
    __dashCache[cacheKey] = list || [];
    refreshDashboardUI();
  });
  if (typeof unsub === "function") __dashUnsubs.push(unsub);
}

function isDashboardPage() {
  var p = (location.pathname || "").toLowerCase();
  return p.indexOf("dashboard") !== -1;
}

function initRealtimeDashboard() {
  if (typeof db === "undefined" || typeof listenCollection !== "function") {
    console.warn("[Dashboard] Firebase não pronto");
    return;
  }

  // Sempre escuta coleções principais (dashboard e páginas com data-live)
  var needsDash =
    isDashboardPage() ||
    document.querySelector("[data-live]") ||
    document.querySelector("section.stats, .grid.stats");

  if (!needsDash) return;

  watchCollection("stock", "stock");
  watchCollection("waste", "waste");
  watchCollection("purchases", "purchases");
  watchCollection("notifications", "notifications");
  watchCollection("goals", "goals");
  watchCollection("financial_movements", "financial");
  watchCollection("users", "users");

  console.info("[Dashboard] Listeners em tempo real ativos");
}

document.addEventListener("DOMContentLoaded", function () {
  setTimeout(initRealtimeDashboard, 500);
});
