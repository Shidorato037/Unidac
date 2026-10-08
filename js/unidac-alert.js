// Balões de alerta unificados — centro da tela
(function (global) {
  var hideTimer = null;

  function ensureOverlay() {
    var ov = document.getElementById("unidac-alert-overlay");
    if (ov) return ov;
    ov = document.createElement("div");
    ov.id = "unidac-alert-overlay";
    ov.className = "unidac-alert-overlay";
    ov.innerHTML =
      '<div class="unidac-alert info" role="alertdialog" aria-modal="true">' +
      '<div class="unidac-alert-icon">i</div>' +
      '<h3 class="unidac-alert-title"></h3>' +
      '<p class="unidac-alert-msg"></p>' +
      '<div class="unidac-alert-actions">' +
      '<button type="button" class="unidac-alert-btn">OK</button>' +
      "</div></div>";
    document.body.appendChild(ov);
    ov.addEventListener("click", function (e) {
      if (e.target === ov) hideUnidacAlert();
    });
    var btn = ov.querySelector(".unidac-alert-btn");
    if (btn) btn.addEventListener("click", hideUnidacAlert);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") hideUnidacAlert();
    });
    return ov;
  }

  function hideUnidacAlert() {
    var ov = document.getElementById("unidac-alert-overlay");
    if (!ov) return;
    ov.classList.remove("show");
    if (hideTimer) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }
  }

  function showUnidacAlert(message, type, title, autoMs) {
    type = type || "info";
    var defaults = {
      error: { title: "Atenção", icon: "!" },
      success: { title: "Sucesso", icon: "✓" },
      warn: { title: "Aviso", icon: "!" },
      info: { title: "Informação", icon: "i" }
    };
    var meta = defaults[type] || defaults.info;
    var ov = ensureOverlay();
    var box = ov.querySelector(".unidac-alert");
    if (!box) return;
    box.className = "unidac-alert " + type;
    var icon = box.querySelector(".unidac-alert-icon");
    var titleEl = box.querySelector(".unidac-alert-title");
    var msgEl = box.querySelector(".unidac-alert-msg");
    if (icon) icon.textContent = meta.icon;
    if (titleEl) titleEl.textContent = title || meta.title;
    if (msgEl) msgEl.textContent = message || "";
    // force reflow for animation
    void ov.offsetWidth;
    ov.classList.add("show");

    if (hideTimer) clearTimeout(hideTimer);
    var ms = autoMs === 0 ? 0 : (typeof autoMs === "number" ? autoMs : 3200);
    if (ms > 0) {
      hideTimer = setTimeout(hideUnidacAlert, ms);
    }
  }

  function detectType(m) {
    var lower = String(m || "").toLowerCase();
    if (
      lower.indexOf("erro") !== -1 ||
      lower.indexOf("incorret") !== -1 ||
      lower.indexOf("inválid") !== -1 ||
      lower.indexOf("invalid") !== -1 ||
      lower.indexOf("falha") !== -1 ||
      lower.indexOf("preencha") !== -1 ||
      lower.indexOf("informe") !== -1
    ) {
      return "error";
    }
    if (
      lower.indexOf("sucesso") !== -1 ||
      lower.indexOf("salvo") !== -1 ||
      lower.indexOf("salva") !== -1 ||
      lower.indexOf("criado") !== -1 ||
      lower.indexOf("registrad") !== -1 ||
      lower.indexOf("atualiz") !== -1 ||
      lower.indexOf("exclu") !== -1 ||
      lower.indexOf("enviado") !== -1 ||
      lower.indexOf("confirmad") !== -1 ||
      lower.indexOf("cumprida") !== -1 ||
      lower.indexOf("alterada") !== -1
    ) {
      return "success";
    }
    if (lower.indexOf("aviso") !== -1 || lower.indexOf("atenção") !== -1) {
      return "warn";
    }
    return "info";
  }

  function showToast(msg) {
    var m = String(msg || "");
    // Simplifica mensagens longas de atualizacao
    if (/dados atualizados/i.test(m)) {
      showUnidacAlert("Dados atualizados", "success", "Sucesso", 2800);
      return;
    }
    showUnidacAlert(m, detectType(m));
  }

  global.showUnidacAlert = showUnidacAlert;
  global.hideUnidacAlert = hideUnidacAlert;
  global.showToast = showToast;
  global.showAppToast = showToast;
})(window);
