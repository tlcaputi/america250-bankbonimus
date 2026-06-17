/* America250 weekend guide — HOME overview map + filters.
   Filters the overview map pins and updates each day-tile's count.
   (Full event lists live on the per-day pages; per-event detail on event pages.) */
(function () {
  "use strict";

  var dataEl = document.getElementById("a2-data");
  var regionEl = document.getElementById("a2-regions");
  if (!dataEl || !window.L) return;

  var EVENTS = JSON.parse(dataEl.textContent || "[]");
  var REGIONS = JSON.parse((regionEl && regionEl.textContent) || "[]");
  var COLOR = {};
  REGIONS.forEach(function (r) { COLOR[r.id] = r.color; });

  var TILE = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
  var ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

  var state = { region: {}, category: {}, freeOnly: false };
  document.querySelectorAll('.a2-chip[data-filter="region"]').forEach(function (b) { state.region[b.dataset.value] = true; });
  document.querySelectorAll('.a2-chip[data-filter="category"]').forEach(function (b) { state.category[b.dataset.value] = true; });

  function passes(e) {
    if (state.region[e.region] === false) return false;
    if (state.category[e.category] === false) return false;
    if (state.freeOnly && !(e.cost && e.cost.toLowerCase() === "free")) return false;
    return true;
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function popupHtml(e) {
    var h = '<div class="a2-pop"><strong>' + esc(e.title) + "</strong>";
    if (e.venue) h += '<div class="a2-pop-venue">' + esc(e.venue) + (e.town ? " · " + esc(e.town) : "") + "</div>";
    var links = [];
    if (e.page) links.push('<a href="' + esc(e.page) + '">View details →</a>');
    if (e.address) links.push('<a href="https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(e.address) + '" target="_blank" rel="noopener">Directions ↗</a>');
    h += '<div class="a2-pop-links">' + links.join(" ") + "</div></div>";
    return h;
  }

  var el = document.getElementById("a2-map-main");
  if (!el) return;
  var located = EVENTS.filter(function (e) { return typeof e.lat === "number" && typeof e.lng === "number"; });
  var map = L.map(el, { scrollWheelZoom: false });
  L.tileLayer(TILE, { attribution: ATTR, maxZoom: 19, subdomains: "abcd" }).addTo(map);
  var layer = L.layerGroup().addTo(map);
  var markers = located.map(function (e) {
    var m = L.circleMarker([e.lat, e.lng], { radius: 7, fillColor: COLOR[e.region] || "#555", color: "#fff", weight: 2, opacity: 1, fillOpacity: 0.9 });
    m.bindPopup(popupHtml(e));
    m._a2 = e;
    return m;
  });

  function fit() {
    var vis = markers.filter(function (m) { return passes(m._a2); });
    if (vis.length) {
      map.fitBounds(L.featureGroup(vis).getBounds().pad(0.18), { maxZoom: 12 });
    } else {
      map.setView([40.10, -75.05], 9);
    }
  }

  function apply() {
    markers.forEach(function (m) {
      if (passes(m._a2)) { if (!layer.hasLayer(m)) layer.addLayer(m); }
      else if (layer.hasLayer(m)) layer.removeLayer(m);
    });
    // update day-tile counts
    document.querySelectorAll(".a2-daytile").forEach(function (tile) {
      var date = tile.dataset.date;
      var n = EVENTS.filter(function (e) { return e.date === date && passes(e); }).length;
      var c = tile.querySelector(".a2-daytile-count");
      if (c) c.textContent = n;
      tile.classList.toggle("is-empty", n === 0);
    });
    fit();
  }

  document.querySelectorAll(".a2-chip").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var on = btn.classList.toggle("is-on");
      state[btn.dataset.filter][btn.dataset.value] = on;
      apply();
    });
  });
  var freeBox = document.getElementById("a2-free-only");
  if (freeBox) freeBox.addEventListener("change", function () { state.freeOnly = freeBox.checked; apply(); });
  function reset() {
    document.querySelectorAll(".a2-chip").forEach(function (b) { b.classList.add("is-on"); state[b.dataset.filter][b.dataset.value] = true; });
    state.freeOnly = false;
    if (freeBox) freeBox.checked = false;
    apply();
  }
  var rb = document.getElementById("a2-reset");
  if (rb) rb.addEventListener("click", reset);

  apply();
  setTimeout(function () { map.invalidateSize(); fit(); }, 200);
})();
