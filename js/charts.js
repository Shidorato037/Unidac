function drawBars(selector, data, labels) {
  var el = document.querySelector(selector);
  if (!el) return;
  data = data || [];
  labels = labels || [];
  if (!data.length) {
    el.innerHTML = '<p class="muted" style="padding:12px">Sem dados  para este grafico.</p>';
    return;
  }
  var max = Math.max.apply(null, data.concat([1]));
  el.innerHTML = data
    .map(function (v, i) {
      var h = Math.max(10, (v / max) * 82);
      return (
        '<div class="bar-wrap"><div class="bar" style="height:' +
        h +
        '%"></div><span>' +
        (labels[i] || "") +
        "</span></div>"
      );
    })
    .join("");
}

document.addEventListener("DOMContentLoaded", function () {
  // Sem mock: so desenha se houver dados reais carregados depois
  // Firebase-dashboard / listeners podem preencher e chamar drawBars.
  if (typeof UNIDAC_DATA !== "undefined") {
    if (UNIDAC_DATA.waste7 && UNIDAC_DATA.waste7.length) {
      drawBars("#waste-chart", UNIDAC_DATA.waste7, ["28", "29", "30", "31", "01", "02", "03"]);
    } else {
      drawBars("#waste-chart", [], []);
    }
    if (UNIDAC_DATA.consumption && UNIDAC_DATA.consumption.length) {
      drawBars("#consumption-chart", UNIDAC_DATA.consumption, ["Man", "Int", "Alm", "Tar", "Man", "Int", "Alm"]);
    } else {
      drawBars("#consumption-chart", [], []);
    }
  }
  var report = document.querySelector("#report-chart");
  if (report) {
    drawBars("#report-chart", [], []);
  }
});
