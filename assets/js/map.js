/* America250 weekend guide — maps + filtering
   One overview map + one mini-map per day, all driven by the shared filter bar. */
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

  // ---- filter state ----
  var state = {
    region: {},      // id -> bool
    category: {},     // id -> bool
    freeOnly: false,
    q: ""
  };
  // default everything on
  document.querySelectorAll('.a2-chip[data-filter="region"]').forEach(function (b) { state.region[b.dataset.value] = true; });
  document.querySelectorAll('.a2-chip[data-filter="category"]').forEach(function (b) { state.category[b.dataset.value] = true; });

  function passes(e) {
    if (state.region[e.region] === false) return false;
    if (state.category[e.category] === false) return false;
    if (state.freeOnly && !(e.cost && e.cost.toLowerCase() === "free")) return false;
    if (state.q) {
      var hay = ((e.title || "") + " " + (e.venue || "") + " " + (e.town || "") + " " + (e.org || "")).toLowerCase();
      if (hay.indexOf(state.q) === -1) return false;
    }
    return true;
  }

  function popupHtml(e) {
    var h = '<div class="a2-pop">';
    h += '<strong>' + esc(e.title) + '</strong>';
    if (e.venue) h += '<div class="a2-pop-venue">' + esc(e.venue) + (e.town ? ' · ' + esc(e.town) : '') + '</div>';
    var links = [];
    if (e.url) links.push('<a href="' + esc(e.url) + '" target="_blank" rel="noopener">Event page ↗</a>');
    if (e.address) links.push('<a href="https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(e.address) + '" target="_blank" rel="noopener">Directions ↗</a>');
    links.push('<a href="#ev-' + esc(e.id) + '">Jump to details ↓</a>');
    h += '<div class="a2-pop-links">' + links.join(" ") + '</div>';
    h += '</div>';
    return h;
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function makeMarker(e) {
    var m = L.circleMarker([e.lat, e.lng], {
      radius: 7,
      fillColor: COLOR[e.region] || "#555",
      color: "#fff",
      weight: 2,
      opacity: 1,
      fillOpacity: 0.9
    });
    m.bindPopup(popupHtml(e));
    m._a2 = e;
    return m;
  }

  // ---- build a map instance over a set of events ----
  function buildMap(elId, events, opts) {
    var el = document.getElementById(elId);
    if (!el) return null;
    var located = events.filter(function (e) { return typeof e.lat === "number" && typeof e.lng === "number"; });
    var map = L.map(el, { scrollWheelZoom: false, zoomControl: true });
    L.tileLayer(TILE, { attribution: ATTR, maxZoom: 19, subdomains: "abcd" }).addTo(map);
    var layer = L.layerGroup().addTo(map);
    var markers = located.map(function (e) {
      var m = makeMarker(e);
      m.addTo(layer);
      return m;
    });
    var rec = {
      map: map, layer: layer, markers: markers,
      fit: function () {
        var vis = markers.filter(function (m) { return passes(m._a2); });
        if (vis.length) {
          var g = L.featureGroup(vis);
          map.fitBounds(g.getBounds().pad(0.18), { maxZoom: (opts && opts.maxZoom) || 13 });
        } else if (opts && opts.center) {
          map.setView(opts.center, opts.zoom || 9);
        }
      },
      refresh: function () {
        markers.forEach(function (m) {
          if (passes(m._a2)) { if (!layer.hasLayer(m)) layer.addLayer(m); }
          else { if (layer.hasLayer(m)) layer.removeLayer(m); }
        });
      }
    };
    rec.refresh();
    rec.fit();
    return rec;
  }

  var REGION_CENTER = [40.30, -74.92]; // near New Hope/Lambertville, the geographic hub
  var maps = [];
  var mainMap = buildMap("a2-map-main", EVENTS, { center: REGION_CENTER, zoom: 9, maxZoom: 12 });
  if (mainMap) maps.push(mainMap);

  document.querySelectorAll(".a2-map-day").forEach(function (el) {
    var day = el.dataset.day;
    var dayEvents = EVENTS.filter(function (e) { return e.date === day; });
    var rec = buildMap(el.id, dayEvents, { center: REGION_CENTER, zoom: 9, maxZoom: 13 });
    if (rec) maps.push(rec);
  });

  // ---- apply filters to cards + maps + counts ----
  function apply() {
    var anyVisible = false;
    // cards
    document.querySelectorAll(".a2-card").forEach(function (card) {
      var ok =
        state.region[card.dataset.region] !== false &&
        state.category[card.dataset.category] !== false &&
        (!state.freeOnly || card.dataset.cost === "free") &&
        (!state.q || (card.dataset.search || "").indexOf(state.q) !== -1);
      card.hidden = !ok;
      if (ok) anyVisible = true;
    });
    // region blocks + day sections: hide if no visible cards inside
    document.querySelectorAll(".a2-region-block").forEach(function (b) {
      var vis = b.querySelectorAll(".a2-card:not([hidden])").length;
      b.hidden = vis === 0;
    });
    document.querySelectorAll(".a2-day").forEach(function (s) {
      var vis = s.querySelectorAll(".a2-card:not([hidden])").length;
      s.hidden = vis === 0;
      var dlink = document.querySelector('.a2-daynav-link[href="#' + s.id + '"]');
      if (dlink) {
        var c = dlink.querySelector(".a2-daynav-count");
        if (c) c.textContent = vis;
        dlink.classList.toggle("is-empty", vis === 0);
      }
    });
    // region/day counts
    document.querySelectorAll(".a2-region-count").forEach(function (c) {
      var blk = c.closest(".a2-region-block");
      if (blk) c.textContent = blk.querySelectorAll(".a2-card:not([hidden])").length;
    });
    // maps
    maps.forEach(function (m) { m.refresh(); m.fit(); });
    // no results
    var nr = document.getElementById("a2-noresults");
    if (nr) nr.hidden = anyVisible;
  }

  // ---- wire controls ----
  document.querySelectorAll(".a2-chip").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var on = btn.classList.toggle("is-on");
      state[btn.dataset.filter][btn.dataset.value] = on;
      apply();
    });
  });
  var freeBox = document.getElementById("a2-free-only");
  if (freeBox) freeBox.addEventListener("change", function () { state.freeOnly = freeBox.checked; apply(); });
  var search = document.getElementById("a2-search");
  if (search) {
    var t;
    search.addEventListener("input", function () {
      clearTimeout(t);
      t = setTimeout(function () { state.q = search.value.trim().toLowerCase(); apply(); }, 150);
    });
  }
  function reset() {
    document.querySelectorAll(".a2-chip").forEach(function (b) {
      b.classList.add("is-on");
      state[b.dataset.filter][b.dataset.value] = true;
    });
    state.freeOnly = false; state.q = "";
    if (freeBox) freeBox.checked = false;
    if (search) search.value = "";
    apply();
  }
  ["a2-reset", "a2-reset2"].forEach(function (id) {
    var b = document.getElementById(id);
    if (b) b.addEventListener("click", reset);
  });

  // fix map sizing once laid out
  setTimeout(function () { maps.forEach(function (m) { m.map.invalidateSize(); m.fit(); }); }, 200);
})();
