/* Herz-Jesu Ball 2026 – Ticket-Reservierung ohne Konto (/tickets)
   Ohne JavaScript bleibt nur „Online kaufen“ sichtbar (der Teil „Lieber
   persönlich kaufen?“ ist im HTML versteckt und wird erst hier eingeblendet).
   Kein innerHTML, keine externen Requests außer dem eigenen /api/reservierung. */
(function () {
  "use strict";

  var start = document.getElementById("rsvStart");
  var form = document.getElementById("rsvForm");
  if (!start || !form) return;

  var PRICES = { k1: 35, k2: 73, sh: 5 };
  var LABELS = { k1: "Kategorie 1", k2: "Tischplatz", sh: "Shuttle" };
  var MAX = 10;
  // Tischplätze nur bis 8. November 2026, 23:59 Uhr (gleiche Frist wie js/main.js und der Worker)
  var TISCH_DEADLINE = Date.parse("2026-11-08T23:59:59+01:00");
  var tischOpen = Date.now() < TISCH_DEADLINE;
  var qty = { k1: 1, k2: 0, sh: 0 };

  var choices = document.getElementById("rsvChoices");
  var done = document.getElementById("rsvDone");
  var back = document.getElementById("rsvBack");
  var stepLabel = document.getElementById("rsvStepLabel");
  var views = form.querySelectorAll(".rsv-view");
  var step = 1;

  var alt = document.getElementById("rsvAlt");
  if (alt) alt.hidden = false;
  if (!tischOpen) {
    var rowK2 = document.getElementById("rsvRowK2");
    if (rowK2) rowK2.hidden = true;
  }

  function euro(n) { return n.toLocaleString("de-AT") + " €"; }
  function sum() { return qty.k1 * PRICES.k1 + qty.k2 * PRICES.k2 + qty.sh * PRICES.sh; }

  function showStep(n) {
    step = n;
    for (var i = 0; i < views.length; i++) views[i].hidden = Number(views[i].getAttribute("data-step")) !== n;
    stepLabel.textContent = "Schritt " + n + " von 2";
    var h = views[n - 1].querySelector("h2");
    if (h) { h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); }
    form.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function klick(k) { if (window.hjbKlick) window.hjbKlick(k); }
  var online = document.getElementById("rsvOnline");
  if (online) online.addEventListener("click", function () { klick("choice:online"); });

  start.addEventListener("click", function () {
    klick("choice:reservieren");
    choices.hidden = true;
    form.hidden = false;
    showStep(1);
  });
  back.addEventListener("click", function () {
    if (step === 2) { showStep(1); return; }
    form.hidden = true;
    choices.hidden = false;
    start.focus();
  });

  /* ---- Schritt 1: Anzahl ---- */
  var next = document.getElementById("rsvNext");
  // Shuttle: höchstens ein Platz pro Ticket (gleiche Regel wie im Worker,
  // siehe RES_PRICES/die Validierung in handleReservierung), daher eigenes
  // Maximum statt des globalen Tickets-MAX und ein Nachziehen, falls die
  // Ticketzahl nachträglich sinkt.
  function renderQty() {
    var tickets = qty.k1 + qty.k2;
    if (qty.sh > tickets) qty.sh = tickets;
    Object.keys(qty).forEach(function (k) {
      document.getElementById("rsvOut-" + k).textContent = qty[k];
      var st = form.querySelector('.rsv-stepper[data-key="' + k + '"]');
      st.querySelector('[data-d="-1"]').disabled = qty[k] === 0;
      st.querySelector('[data-d="1"]').disabled = k === "sh" ? qty.sh >= tickets : tickets >= MAX;
    });
    document.getElementById("rsvTotal").textContent = euro(sum());
    next.disabled = tickets === 0;
  }
  var steppers = form.querySelectorAll(".rsv-stepper");
  for (var i = 0; i < steppers.length; i++) {
    (function (st) {
      var k = st.getAttribute("data-key");
      st.querySelectorAll("button").forEach(function (b) {
        b.addEventListener("click", function () {
          var max = k === "sh" ? (qty.k1 + qty.k2) : MAX;
          qty[k] = Math.max(0, Math.min(max, qty[k] + Number(b.getAttribute("data-d"))));
          renderQty();
        });
      });
    })(steppers[i]);
  }
  next.addEventListener("click", function () { if (!next.disabled) showStep(2); });

  /* ---- Schritt 2: Kontakt ---- */
  var CH = {
    mail: { label: "Deine E-Mail-Adresse", ph: "name@beispiel.at", type: "email", ac: "email", mode: "email", name: "E-Mail", via: "E-Mail",
            ok: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v); } },
    wa:   { label: "Deine Handynummer für WhatsApp", ph: "+43 660 1234567", type: "tel", ac: "tel", mode: "tel", name: "WhatsApp", via: "WhatsApp",
            ok: function (v) { var d = v.replace(/[^0-9]/g, ""); return d.length >= 8 && d.length <= 16 && /^[+0-9 ()\/-]+$/.test(v); } },
    ig:   { label: "Dein Instagram-Name", ph: "@deinname", type: "text", ac: "off", mode: "text", name: "Instagram", via: "Instagram-DM",
            ok: function (v) { return /^@?[A-Za-z0-9._]{2,30}$/.test(v); } }
  };
  var ch = "mail";
  var contact = document.getElementById("rsvContact");
  var consent = document.getElementById("rsvConsent");
  var submit = document.getElementById("rsvSubmit");
  var error = document.getElementById("rsvError");
  var segs = form.querySelectorAll(".rsv-seg button");

  // Vor- und Nachname (Pflicht): Karten werden an der Abendkasse auf diesen Namen hinterlegt.
  var firstName = document.getElementById("rsvFirst");
  var lastName = document.getElementById("rsvLast");
  var NAME_OK = /^[A-Za-zÀ-ÖØ-öø-ÿĀ-žḀ-ỿ][A-Za-zÀ-ÖØ-öø-ÿĀ-žḀ-ỿ '’.\-]*$/;
  function nameOk(el) { var v = el ? el.value.trim().replace(/\s+/g, " ") : ""; return v.length >= 1 && v.length <= 60 && NAME_OK.test(v); }
  function validate() { submit.disabled = !(nameOk(firstName) && nameOk(lastName) && CH[ch].ok(contact.value.trim()) && consent.checked); }
  [firstName, lastName].forEach(function (el) { if (el) el.addEventListener("input", function () { error.textContent = ""; validate(); }); });
  segs.forEach(function (b) {
    b.addEventListener("click", function () {
      ch = b.getAttribute("data-ch");
      segs.forEach(function (x) { x.setAttribute("aria-checked", x === b ? "true" : "false"); });
      var c = CH[ch];
      document.getElementById("rsvContactLabel").textContent = c.label;
      contact.type = c.type; contact.placeholder = c.ph; contact.autocomplete = c.ac; contact.inputMode = c.mode;
      contact.value = ""; error.textContent = "";
      contact.focus(); validate();
    });
  });
  contact.addEventListener("input", function () { error.textContent = ""; validate(); });
  consent.addEventListener("change", validate);

  // Optionale Nachricht mit Zeichenzähler
  var message = document.getElementById("rsvMessage");
  var count = document.getElementById("rsvCount");
  function renderCount() { if (count && message) count.textContent = message.value.length + " / 500"; }
  if (message) message.addEventListener("input", renderCount);

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (submit.disabled) return;
    submit.disabled = true;
    var oldText = submit.textContent;
    submit.textContent = "Wird gesendet …";
    error.textContent = "";
    var payload = {
      k1: qty.k1, k2: tischOpen ? qty.k2 : 0, sh: qty.sh,
      firstName: firstName.value.trim().replace(/\s+/g, " "), lastName: lastName.value.trim().replace(/\s+/g, " "),
      channel: ch, contact: contact.value.trim(), consent: true,
      message: message ? message.value.trim().slice(0, 500) : "",
      website: document.getElementById("rsvWebsite").value
    };
    fetch("/api/reservierung", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }).then(function (r) {
      return r.json().catch(function () { return { error: "Hat nicht geklappt." }; });
    }).then(function (data) {
      if (!data || data.error || !data.code) throw new Error((data && data.error) || "Hat nicht geklappt.");
      klick("reserviert");
      showDone(data.code);
    }).catch(function (err) {
      submit.textContent = oldText;
      submit.disabled = false;
      error.textContent = (err && err.message && err.message !== "Failed to fetch" ? err.message : "Keine Verbindung.") +
        " Bitte nochmal versuchen oder schreib uns auf Instagram.";
    });
  });

  function showDone(code) {
    var c = CH[ch];
    var who = contact.value.trim();
    if (ch === "ig" && who.charAt(0) !== "@") who = "@" + who;
    var msg = message ? message.value.trim() : "";
    form.hidden = true;
    done.hidden = false;
    document.getElementById("rsvCode").textContent = code;
    document.title = "Reservierung " + code + " · Herz-Jesu Ball 2026";

    var name = firstName.value.trim().replace(/\s+/g, " ") + " " + lastName.value.trim().replace(/\s+/g, " ");
    document.getElementById("rsvDoneName").textContent = name;

    // Texte mit fett gesetzten Teilen (ohne innerHTML)
    function boldLine(el, parts) {
      el.textContent = "";
      parts.forEach(function (p, i) {
        if (i % 2) { var b = document.createElement("b"); b.textContent = p; el.appendChild(b); }
        else el.appendChild(document.createTextNode(p));
      });
    }
    boldLine(document.getElementById("rsvDoneLead"), ["Deine Karten liegen am Ballabend an der Abendkasse auf den Namen ", name, " bereit."]);
    boldLine(document.getElementById("rsvContactNote"), ["Bei Rückfragen melden wir uns an ", who, " per ", c.via, "."]);
    boldLine(document.getElementById("rsvPrintContact"), ["Bei Rückfragen melden wir uns an ", who, " per ", c.via, "."]);

    var rows = [];
    var kinds = ["k1", "k2", "sh"].filter(function (k) { return qty[k]; });
    kinds.forEach(function (k) { rows.push([qty[k] + "× " + LABELS[k], euro(qty[k] * PRICES[k])]); });
    if (kinds.length > 1) rows.push(["Gesamt", euro(sum())]);
    rows.push(["Zahlung", "an der Abendkasse"]);

    var dl = document.getElementById("rsvSummary");
    dl.textContent = "";
    rows.forEach(function (r) {
      var dt = document.createElement("dt"), dd = document.createElement("dd");
      dt.textContent = r[0]; dd.textContent = r[1];
      dl.appendChild(dt); dl.appendChild(dd);
    });
    if (msg) {
      var dt = document.createElement("dt"), dd = document.createElement("dd");
      dt.textContent = "Zusätzliche Infos"; dt.className = "wide";
      dd.textContent = msg; dd.className = "wide";
      dl.appendChild(dt); dl.appendChild(dd);
    }

    // Druckseite für „Als PDF speichern“ befüllen
    document.getElementById("rsvPrintCode").textContent = code;
    document.getElementById("rsvPrintName").textContent = name;
    var tb = document.getElementById("rsvPrintRows");
    tb.textContent = "";
    var printRows = [["Reserviert am", new Date().toLocaleString("de-AT", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) + " Uhr"]]
      .concat([["Name", name]])
      .concat(rows)
      .concat([["Kontakt", who + " (" + c.via + ")"]]);
    if (msg) printRows.push(["Zusätzliche Infos", msg]);
    printRows.forEach(function (r) {
      var tr = document.createElement("tr"), th = document.createElement("th"), td = document.createElement("td");
      th.textContent = r[0]; td.textContent = r[1];
      tr.appendChild(th); tr.appendChild(td); tb.appendChild(tr);
    });

    var t = document.getElementById("rsvDoneTitle");
    t.focus({ preventScroll: true });
    done.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /* ---- Bestätigung: Nummer kopieren, als PDF speichern ---- */
  var copyBtn = document.getElementById("rsvCopy");
  if (copyBtn) copyBtn.addEventListener("click", function () {
    var code = document.getElementById("rsvCode").textContent;
    function ok() {
      copyBtn.textContent = "✓ Kopiert";
      copyBtn.classList.add("is-copied");
      setTimeout(function () { copyBtn.textContent = "Nummer kopieren"; copyBtn.classList.remove("is-copied"); }, 1800);
    }
    function fallback() {
      var ta = document.createElement("textarea");
      ta.value = code; ta.setAttribute("readonly", ""); ta.style.position = "absolute"; ta.style.left = "-9999px";
      document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); } catch (e) {}
      document.body.removeChild(ta); ok();
    }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(code).then(ok, fallback);
    else fallback();
  });
  var printBtn = document.getElementById("rsvPrint");
  if (printBtn) printBtn.addEventListener("click", function () { window.print(); });

  renderQty();
  // Direkt zum Formular springen, wenn mit /tickets#reservieren verlinkt
  if (location.hash === "#reservieren") start.click();
})();