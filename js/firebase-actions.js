// =====================================================
// Acoes Admin - Firebase (corrigido)
// =====================================================

function pageName() {
  var p = (location.pathname || "").split("/").pop() || "";
  return p.replace(".html", "").toLowerCase();
}

function toast(msg) {
  if (typeof showAppToast === "function") return showAppToast(msg);
  if (typeof showToast === "function") return showToast(msg);
  var t = document.getElementById("toast");
  if (!t) {
    t = document.createElement("div");
    t.id = "toast";
    t.className = "toast";
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(function () { t.classList.remove("show"); }, 2800);
}

function val(id) {
  var el = document.getElementById(id);
  return el ? String(el.value || "").trim() : "";
}

function num(id) {
  var v = Number(String(val(id)).replace(",", "."));
  return isNaN(v) ? 0 : v;
}

function closeModalById(id) {
  var m = document.getElementById(id);
  if (!m) return;
  m.classList.remove("show");
  m.classList.remove("aberto");
  m.setAttribute("aria-hidden", "true");
}

// ---------- USUARIOS ----------
async function loadUsersTable() {
  var tbody = document.getElementById("usersTable");
  if (!tbody || typeof getUsers !== "function") return;
  var list = await getUsers();
  tbody.innerHTML = list.map(function (u) {
    return (
      '<tr data-id="' + (u.id || "") + '">' +
      "<td>" + (u.name || "") + "</td>" +
      "<td>" + (u.email || "") + "</td>" +
      "<td>" + (u.role || "") + "</td>" +
      "<td>" +
      '<button type="button" class="btn btn-sm" data-edit-user="' + (u.id || "") + '">Editar</button> ' +
      '<button type="button" class="btn btn-sm" data-del-user="' + (u.id || "") + '">Excluir</button>' +
      "</td></tr>"
    );
  }).join("") || '<tr><td colspan="4">Nenhum usuario</td></tr>';
  var count = document.getElementById("userCount");
  if (count) count.textContent = String(list.length);
}

async function saveUserFromModal() {
  var name = val("user-name");
  var email = val("user-email").toLowerCase();
  var role = (val("user-role") || "funcionario").toLowerCase();
  var editingId = window.__editingUserId || null;
  if (!name || !email) { toast("Preencha nome e e-mail."); return; }
  try {
    if (editingId) {
      await updateDocument("users", editingId, { name: name, email: email, role: role, active: true });
      toast("Dados atualizados");
    } else {
      var initialPassword = "123456";
      if (typeof createAuthUser === "function") {
        try {
          var created = await createAuthUser(email, initialPassword);
          if (created) toast("Dados atualizados");
          else toast("E-mail já cadastrado.");
        } catch (err) {
          toast(err.message || "Nao foi possivel criar o usuario.");
        }
      }
      await addDocument("users", { name: name, email: email, role: role, active: true });
      toast("Dados atualizados");
    }
    window.__editingUserId = null;
    closeModalById("user-modal");
    await loadUsersTable();
  } catch (err) {
    toast("Erro ao salvar usuario: " + (err.message || err));
  }
}

// ---------- FINANCEIRO ----------
async function loadFinanceList() {
  var box = document.getElementById("listaMovimentacoes");
  if (!box || typeof getCollection !== "function") return;
  var list = await getCollection("financial_movements");
  var receitas = 0, despesas = 0;
  box.innerHTML = list.map(function (m) {
    var v = Number(m.amount) || 0;
    var t = (m.type || "").toLowerCase();
    if (t.indexOf("receita") !== -1 || t === "entrada") receitas += v;
    else despesas += v;
    return (
      '<div class="list-item" data-id="' + (m.id || "") + '">' +
      "<div><strong>" + (m.description || m.type || "Movimentacao") + "</strong>" +
      "<p>" + (m.date || "") + " · " + (m.type || "") + " · R$ " + v.toLocaleString("pt-BR") + "</p></div></div>"
    );
  }).join("") || "<p>Nenhuma movimentacao</p>";
  var elR = document.getElementById("totalReceitas");
  var elD = document.getElementById("totalDespesas");
  var elS = document.getElementById("saldoDisponivel");
  if (elR) elR.textContent = "R$ " + receitas.toLocaleString("pt-BR");
  if (elD) elD.textContent = "R$ " + despesas.toLocaleString("pt-BR");
  if (elS) elS.textContent = "R$ " + (receitas - despesas).toLocaleString("pt-BR");
}

async function saveFinancialMovement() {
  var tipo = val("tipoMovimentacao") || "despesa";
  var descricao = val("descricaoMovimentacao");
  var valor = num("valorMovimentacao");
  var data = val("dataMovimentacao") || new Date().toISOString().slice(0, 10);
  if (!descricao || !valor) { toast("Preencha descricao e valor."); return; }
  try {
    await addDocument("financial_movements", {
      type: tipo, description: descricao, amount: valor, date: data
    });
    toast("Dados atualizados");
    closeModalById("movimentacaoModal");
    await loadFinanceList();
  } catch (err) {
    toast("Erro financeiro: " + (err.message || err));
  }
}

function openFinanceModal() {
  var finModal = document.getElementById("movimentacaoModal");
  if (!finModal) { toast("Modal financeiro nao encontrado."); return; }
  var d = document.getElementById("descricaoMovimentacao");
  var v = document.getElementById("valorMovimentacao");
  var t = document.getElementById("tipoMovimentacao");
  var dt = document.getElementById("dataMovimentacao");
  if (d) d.value = "";
  if (v) v.value = "";
  if (t) t.value = "receita";
  if (dt) dt.value = new Date().toISOString().slice(0, 10);
  finModal.classList.add("aberto");
  finModal.setAttribute("aria-hidden", "false");
  setTimeout(function () { if (d) d.focus(); }, 80);
}

// ---------- ESTOQUE ----------
async function saveProductEstoque() {
  var name = val("product-name");
  if (!name) { toast("Informe o nome do produto."); return; }
  var unit = val("product-unit") || "Un";
  var quantity = num("product-quantity");
  var minimum = num("product-minimum");
  var category = val("product-category");
  var price = num("product-price");
  var expiry = val("product-expiry");
  var status = quantity <= minimum ? "Estoque baixo" : "Estavel";
  try {
    await addDocument("products", {
      name: name, unit: unit, minStock: minimum, category: category, price: price, active: true
    });
    await addDocument("stock", {
      name: name, quantity: quantity, status: status, expiry: expiry || null
    });
    if (expiry) {
      await addDocument("product_batches", {
        productName: name, quantity: quantity, unit: unit, expiry_date: expiry
      });
    }
    toast("Dados atualizados");
    closeModalById("product-modal");
    var form = document.getElementById("product-form");
    if (form) form.reset();
  } catch (err) {
    toast("Erro ao salvar produto: " + (err.message || err));
  }
}

async function openMovementWithPicker(type) {
  window.currentProduct = "";
  try { currentProduct = ""; } catch (e) {}
  var typeEl = document.getElementById("movement-type");
  if (typeEl && type) typeEl.value = type;
  // usuario pode trocar Entrada/Saida no select do modal
  var list = typeof getStock === "function" ? await getStock() : [];
  var label = document.getElementById("movement-product");
  if (label) {
    var options = list.map(function (i) {
      var n = String(i.name || "").replace(/"/g, "&quot;");
      return '<option value="' + n + '">' + (i.name || "") + " (qtd: " + (i.quantity != null ? i.quantity : "-") + ")</option>";
    }).join("");
    label.innerHTML =
      'Produto: <select id="movement-product-select" style="margin-left:8px;min-width:200px">' +
      '<option value="">Selecione...</option>' + options + "</select>";
  }
  var modal = document.getElementById("movement-modal");
  if (modal) modal.classList.add("show");
}

async function doStockMovementConfirm() {
  var typeEl = document.getElementById("movement-type");
  var qtyEl = document.getElementById("movement-quantity");
  var type = typeEl ? typeEl.value : "entrada";
  var qty = qtyEl ? Number(qtyEl.value) : 0;
  var name = window.currentProduct || "";
  try { if (!name && typeof currentProduct === "string") name = currentProduct; } catch (e) {}
  var sel = document.getElementById("movement-product-select");
  if (sel && sel.value) name = sel.value;
  var label = document.getElementById("movement-product");
  if ((!name || name === "Selecione o produto") && label && !sel) {
    name = (label.textContent || "").replace("Produto selecionado:", "").trim();
  }
  if (!qty || qty <= 0) { toast("Informe uma quantidade valida."); return; }
  if (!name || name === "Selecione o produto" || name === "Selecione...") {
    toast("Selecione um produto na lista.");
    return;
  }
  try {
    if (typeof applyStockMovement === "function") {
      var ok = await applyStockMovement(null, name, type, qty);
      if (ok) {
        var modal = document.getElementById("movement-modal");
        if (modal) modal.classList.remove("show");
        if (qtyEl) qtyEl.value = "";
        window.currentProduct = "";
      }
    } else {
      toast("Funcao de movimentacao indisponivel.");
    }
  } catch (err) {
    toast("Erro movimentacao: " + (err.message || err));
  }
}

window.openMovement = function (product) {
  window.currentProduct = product || "";
  try { currentProduct = product || ""; } catch (e) {}
  if (!product || product === "Selecione o produto") {
    openMovementWithPicker(
      document.getElementById("movement-type")
        ? document.getElementById("movement-type").value
        : "entrada"
    );
    return;
  }
  var label = document.getElementById("movement-product");
  if (label) label.textContent = "Produto selecionado: " + product;
  var modal = document.getElementById("movement-modal");
  if (modal) modal.classList.add("show");
};

window.confirmMovement = function () {
  doStockMovementConfirm();
};

// ---------- DESPERDICIO ----------
async function registerWasteOccurrence() {
  var qty = window.prompt("Quantidade desperdiçada (numero):");
  if (qty === null) return;
  qty = Number(String(qty).replace(",", "."));
  if (!qty || qty <= 0) { toast("Quantidade invalida."); return; }
  var shift = window.prompt("Turno (manha / tarde / noite):", "tarde") || "tarde";
  var notes = window.prompt("Observacao (opcional):", "") || "";
  try {
    await addDocument("waste", {
      date: new Date().toISOString().slice(0, 10),
      quantity: qty,
      shift: shift,
      notes: notes
    });
    toast("Dados atualizados");
  } catch (err) {
    toast("Erro desperdicio: " + (err.message || err));
  }
}

// ---------- COMPRAS ----------
async function savePurchaseOrder() {
  var supplier = val("supplier");
  var amount = num("amount");
  if (!supplier) { toast("Informe o fornecedor."); return; }
  try {
    await addDocument("purchases", {
      code: "#" + Date.now().toString().slice(-5),
      supplier: supplier,
      date: new Date().toISOString().slice(0, 10),
      total: amount,
      status: "Pendente"
    });
    toast("Dados atualizados");
    closeModalById("purchase-modal");
    if (document.getElementById("supplier")) document.getElementById("supplier").value = "";
    if (document.getElementById("amount")) document.getElementById("amount").value = "";
  } catch (err) {
    toast("Erro compra: " + (err.message || err));
  }
}

// ---------- VALIDADES ----------
async function saveValidityProduct() {
  var name = val("product-name");
  var quantity = num("product-quantity");
  var unit = val("product-unit") || "Un";
  var date = val("product-date");
  if (!name || !date) { toast("Informe produto e data de validade."); return; }
  try {
    await addDocument("product_batches", {
      productName: name, quantity: quantity, unit: unit, expiry_date: date
    });
    var stock = await getStock();
    var item = stock.find(function (s) {
      return (s.name || "").toLowerCase() === name.toLowerCase();
    });
    if (item) {
      await updateDocument("stock", item.id, {
        name: item.name, quantity: item.quantity, status: "Validade proxima", expiry: date
      });
    } else {
      await addDocument("stock", {
        name: name, quantity: quantity, status: "Validade proxima", expiry: date
      });
    }
    toast("Dados atualizados");
    closeModalById("validity-modal");
  } catch (err) {
    toast("Erro validade: " + (err.message || err));
  }
}

// ---------- METAS ----------
async function refreshGoalsOnPage() {
  if (typeof getGoals !== "function") return;
  var list = await getGoals();
  var box = document.getElementById("goals-live-list");
  if (!box) return;
  var html = "<h3 style=\"margin:12px 16px\">Metas</h3><div class=\"list\">";
  if (!list.length) {
    html += "<p style=\"padding:12px 16px\">Nenhuma meta cadastrada.</p>";
  } else {
    html += list.map(function (g) {
      var cur = Number(g.currentValue) || 0;
      var tgt = Number(g.targetValue) || 0;
      var done = (g.status === "cumprida") || (tgt > 0 && cur >= tgt);
      var statusLabel = done ? "cumprida" : (g.status || "em_andamento");
      return (
        '<div class="list-item" data-goal-id="' + (g.id || "") + '">' +
        "<div><strong>" + (g.title || "") + (done ? " ✓" : "") + "</strong><p>Atual: " +
        cur + " / Meta: " + (tgt || "-") + " " + (g.unit || "") +
        " · Prazo: " + (g.deadline || "-") + " · " + statusLabel +
        '</p></div><div style="display:flex;gap:8px;flex-wrap:wrap">' +
        (done
          ? ""
          : '<button type="button" class="btn btn-sm" data-goal-done="' + (g.id || "") + '">Meta cumprida</button>') +
        '<button type="button" class="btn btn-sm" data-goal-del="' + (g.id || "") + '">Excluir</button>' +
        "</div></div>"
      );
    }).join("");
  }
  html += "</div>";
  box.innerHTML = html;
}

async function saveGoalChallenge() {
  var title = window.prompt("Titulo do desafio/meta:");
  if (!title) return;
  var target = window.prompt("Valor alvo (numero):", "30");
  var unit = window.prompt("Unidade (%, kg, un...):", "%") || "%";
  var deadline = window.prompt(
    "Data limite (AAAA-MM-DD):",
    new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)
  );
  try {
    await addDocument("goals", {
      title: title.trim(),
      targetValue: Number(target) || 0,
      currentValue: 0,
      unit: unit,
      deadline: deadline || null,
      status: "em_andamento"
    });
    toast("Dados atualizados");
    await refreshGoalsOnPage();
  } catch (err) {
    toast("Erro meta: " + (err.message || err));
  }
}

// ---------- COZINHA ----------
async function refreshProductionLogs() {
  if (typeof getCollection !== "function") return;
  var list = await getCollection("production_logs");
  var box = document.getElementById("production-confirmed-list");
  if (!box) return;
  list = (list || []).slice().reverse();
  if (!list.length) {
    box.innerHTML = "<p style=\"padding:8px 0\">Nenhuma producao confirmada ainda.</p>";
    return;
  }
  box.innerHTML = list.map(function (p) {
    return (
      '<div class="list-item"><div><strong>' + (p.description || "Producao") +
      "</strong><p>" + (p.date || "") + " · " + (p.status || "") +
      (p.updatedBy ? " · " + p.updatedBy : "") + "</p></div></div>"
    );
  }).join("");
}

async function confirmProduction() {
  var note = window.prompt("Descricao da producao confirmada:", "Producao do turno");
  if (note === null) return;
  try {
    var session = typeof getSession === "function" ? getSession() : null;
    await addDocument("production_logs", {
      description: note || "Producao confirmada",
      date: new Date().toISOString().slice(0, 10),
      status: "confirmado",
      role: session && session.role ? session.role : "",
      userName: session && session.name ? session.name : "",
      userEmail: session && session.email ? session.email : "",
      source: "cozinha"
    });
    toast("Dados atualizados");
    await refreshProductionLogs();
  } catch (err) {
    toast("Erro producao: " + (err.message || err));
  }
}

// ---------- BIND ----------

// ---------- TROCA DE SENHA (usuario logado) ----------
async function promptChangePassword() {
  var n1 = window.prompt("Nova senha (minimo 6 caracteres):");
  if (n1 === null) return;
  var n2 = window.prompt("Confirme a nova senha:");
  if (n2 === null) return;
  if (n1 !== n2) {
    toast("As senhas nao coincidem.");
    return;
  }
  try {
    if (typeof changePassword !== "function") {
      toast("Funcao de troca de senha indisponivel.");
      return;
    }
    await changePassword(n1);
    toast("Dados atualizados");
  } catch (err) {
    var msg = err.message || String(err);
    if (String(msg).indexOf("requires-recent-login") !== -1) {
      msg = "Por seguranca, faca logout, entre de novo e altere a senha em seguida.";
    }
    toast(msg);
  }
}

function ensureChangePasswordButton() {
  if (document.getElementById("btnChangePassword")) return;
  var profile = document.querySelector(".profile, .sidebar .profile, aside .profile");
  if (!profile) return;
  var btn = document.createElement("button");
  btn.type = "button";
  btn.id = "btnChangePassword";
  btn.className = "btn btn-sm";
  btn.style.marginTop = "8px";
  btn.textContent = "Alterar senha";
  btn.addEventListener("click", function (e) {
    e.preventDefault();
    promptChangePassword();
  });
  profile.appendChild(btn);
}

function bindAdminActions() {
  var page = pageName();

  // Financeiro - abrir modal
  var btnNova = document.getElementById("btnNovaMovimentacao");
  if (btnNova) {
    btnNova.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopImmediatePropagation();
      openFinanceModal();
    }, true);
  }
  var cancelFin = document.getElementById("cancelarMovimentacao");
  if (cancelFin) {
    cancelFin.addEventListener("click", function (e) {
      e.preventDefault();
      closeModalById("movimentacaoModal");
    }, true);
  }

  // IDs de salvar
  [
    ["save-user", saveUserFromModal],
    ["salvarMovimentacao", saveFinancialMovement],
    ["save-order", savePurchaseOrder]
  ].forEach(function (pair) {
    var el = document.getElementById(pair[0]);
    if (el) {
      el.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        pair[1]();
      }, true);
    }
  });

  var addUser = document.getElementById("addUser");
  if (addUser) {
    addUser.addEventListener("click", function () {
      window.__editingUserId = null;
    });
  }

  var productForm = document.getElementById("product-form");
  if (productForm) {
    productForm.addEventListener("submit", function (e) {
      e.preventDefault();
      e.stopImmediatePropagation();
      saveProductEstoque();
    }, true);
  }

  var validityForm = document.getElementById("validity-form");
  if (validityForm) {
    validityForm.addEventListener("submit", function (e) {
      e.preventDefault();
      e.stopImmediatePropagation();
      saveValidityProduct();
    }, true);
  }

  // Entrada / Saida com picker
  var qe = document.getElementById("quick-entry");
  var qx = document.getElementById("quick-exit");
  if (qx) qx.style.display = "none";
  if (qe) {
    qe.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopImmediatePropagation();
      // Um unico botao: abre modal com tipo Entrada/Saida escolhivel
      openMovementWithPicker("entrada");
    }, true);
  }

  document.addEventListener("click", function (e) {
    var btn = e.target.closest("button, a");
    if (!btn) return;
    var text = (btn.textContent || "").replace(/\s+/g, " ").trim().toLowerCase();

    if (btn.getAttribute("data-edit-user")) {
      e.preventDefault();
      e.stopImmediatePropagation();
      window.__editingUserId = btn.getAttribute("data-edit-user");
      var row = btn.closest("tr");
      if (row) {
        var cells = row.querySelectorAll("td");
        if (cells[0] && document.getElementById("user-name")) document.getElementById("user-name").value = cells[0].textContent.trim();
        if (cells[1] && document.getElementById("user-email")) document.getElementById("user-email").value = cells[1].textContent.trim();
        if (cells[2] && document.getElementById("user-role")) document.getElementById("user-role").value = cells[2].textContent.trim().toLowerCase();
      }
      var title = document.getElementById("user-modal-title");
      if (title) title.textContent = "Editar usuario";
      var modal = document.getElementById("user-modal");
      if (modal) modal.classList.add("show");
      return;
    }

    if (btn.getAttribute("data-del-user") || (page === "usuarios" && text === "excluir")) {
      e.preventDefault();
      e.stopImmediatePropagation();
      var id = btn.getAttribute("data-del-user");
      if (!id) {
        var tr = btn.closest("tr");
        id = tr ? tr.getAttribute("data-id") : null;
      }
      if (!id) { toast("ID nao encontrado."); return; }
      if (!confirm("Excluir este usuario ?")) return;
      deleteDocument("users", id)
        .then(function () { toast("Dados atualizados"); return loadUsersTable(); })
        .catch(function (err) { toast("Erro: " + (err.message || err)); });
      return;
    }

    if (text.indexOf("nova movimentacao") !== -1 || text.indexOf("nova movimentação") !== -1) {
      e.preventDefault();
      e.stopImmediatePropagation();
      openFinanceModal();
      return;
    }
    if (text.indexOf("salvar usuario") !== -1 || text.indexOf("salvar usuário") !== -1) {
      e.preventDefault(); e.stopImmediatePropagation(); saveUserFromModal(); return;
    }
    if (text.indexOf("salvar movimentacao") !== -1 || text.indexOf("salvar movimentação") !== -1) {
      e.preventDefault(); e.stopImmediatePropagation(); saveFinancialMovement(); return;
    }
    if (text.indexOf("salvar pedido") !== -1) {
      e.preventDefault(); e.stopImmediatePropagation(); savePurchaseOrder(); return;
    }
    if (text.indexOf("registrar ocorrencia") !== -1 || text.indexOf("registrar ocorrência") !== -1) {
      e.preventDefault(); e.stopImmediatePropagation(); registerWasteOccurrence(); return;
    }
    
    if (btn.getAttribute("data-goal-del")) {
      e.preventDefault();
      e.stopImmediatePropagation();
      var gid = btn.getAttribute("data-goal-del");
      if (!gid || !confirm("Excluir esta meta ?")) return;
      deleteDocument("goals", gid)
        .then(function () { toast("Dados atualizados"); return refreshGoalsOnPage(); })
        .catch(function (err) { toast("Erro: " + (err.message || err)); });
      return;
    }
    if (btn.getAttribute("data-goal-done")) {
      e.preventDefault();
      e.stopImmediatePropagation();
      var gid2 = btn.getAttribute("data-goal-done");
      if (!gid2) return;
      getGoals().then(function (list) {
        var g = (list || []).find(function (x) { return x.id === gid2; });
        var payload = { status: "cumprida" };
        if (g && g.targetValue != null) payload.currentValue = Number(g.targetValue) || 0;
        return updateDocument("goals", gid2, payload);
      }).then(function () {
        toast("Dados atualizados");
        return refreshGoalsOnPage();
      }).catch(function (err) {
        toast("Erro: " + (err.message || err));
      });
      return;
    }

    if (text.indexOf("novo desafio") !== -1) {
      e.preventDefault(); e.stopImmediatePropagation(); saveGoalChallenge(); return;
    }
    if (text.indexOf("confirmar producao") !== -1 || text.indexOf("confirmar produção") !== -1) {
      e.preventDefault(); e.stopImmediatePropagation(); confirmProduction(); return;
    }
    if (text.indexOf("confirmar movimentacao") !== -1 || text.indexOf("confirmar movimentação") !== -1) {
      e.preventDefault(); e.stopImmediatePropagation(); doStockMovementConfirm(); return;
    }
    if (text.indexOf("salvar produto") !== -1 && page === "validades") {
      e.preventDefault(); e.stopImmediatePropagation(); saveValidityProduct(); return;
    }
    if (text.indexOf("adicionar validade") !== -1) {
      e.preventDefault(); e.stopImmediatePropagation();
      toast("Use o botao Adicionar produto.");
      return;
    }
    if ((text.indexOf("atualizar") !== -1 || text.indexOf("inventario") !== -1 || text.indexOf("inventário") !== -1) &&
        (page === "estoque" || page === "validades")) {
      e.preventDefault();
      if (typeof getStock === "function" && typeof renderStock === "function") {
        getStock().then(function (list) {
          renderStock(list);
          toast("Dados atualizados");
        });
      }
      return;
    }
    if ((text.indexOf("historico") !== -1 || text.indexOf("histórico") !== -1) && page === "estoque") {
      e.preventDefault();
      getCollection("stock_movements").then(function (list) {
        var msg = (list || []).slice(0, 20).map(function (m) {
          return (m.type || "") + " | " + (m.productName || "") + " | " + (m.quantity || "");
        }).join("\n");
        alert(msg || "Nenhuma movimentacao.");
      });
      return;
    }
  }, true);

  if (page === "usuarios") setTimeout(function () { loadUsersTable().catch(console.error); }, 500);
  if (page === "financeiro") {
    setTimeout(function () { loadFinanceList().catch(console.error); }, 500);
    if (typeof listenCollection === "function") {
      listenCollection("financial_movements", function () { loadFinanceList(); });
    }
  }
  if (page === "metas") setTimeout(function () { refreshGoalsOnPage().catch(console.error); }, 500);
  if (page === "cozinha") setTimeout(function () { refreshProductionLogs().catch(console.error); }, 500);

  if (page === "validades") {
    setTimeout(function () {
      document.querySelectorAll("button, a").forEach(function (el) {
        var t = (el.textContent || "").replace(/\s+/g, " ").trim().toLowerCase();
        if (t.indexOf("adicionar validade") !== -1) el.style.display = "none";
      });
    }, 300);
  }

  if (page === "estoque") {
    setTimeout(function () {
      var search = document.querySelector('input[placeholder*="Pesquisar"], input[placeholder*="pesquisar"]');
      if (search) {
        search.addEventListener("input", function () {
          var q = search.value.toLowerCase();
          document.querySelectorAll("#stock-body tr").forEach(function (tr) {
            tr.style.display = (tr.textContent || "").toLowerCase().indexOf(q) !== -1 ? "" : "none";
          });
        });
      }
    }, 700);
  }
}

document.addEventListener("DOMContentLoaded", function () {
  setTimeout(function () {
    bindAdminActions();
    ensureChangePasswordButton();
  }, 400);
});
