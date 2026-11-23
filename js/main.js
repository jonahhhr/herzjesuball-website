/* Carpe Noctem — Herz-Jesu Ball 2026
   Small, dependency-free progressive-enhancement scripts.
   No external requests, no eval, no untrusted innerHTML. */
(function () {
  "use strict";

  /* ---------- Mobile navigation toggle ---------- */
  var toggle = document.querySelector(".nav__toggle");
  var links = document.getElementById("nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    // Close the menu after choosing a destination
    links.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        links.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---------- Sponsor logos: graceful text fallback ----------
     If a logo image is missing, show the sponsor's name instead.
     Attached programmatically (no inline handlers) to satisfy the CSP. */
  var sponsorLogos = document.querySelectorAll(".sponsor img, .sponsorstrip__row img");
  for (var s = 0; s < sponsorLogos.length; s++) {
    sponsorLogos[s].addEventListener("error", function (e) {
      var img = e.target;
      var fig = img.closest(".sponsor");
      if (!fig) { img.remove(); return; }
      var name = fig.getAttribute("data-name") || img.getAttribute("alt") || "";
      img.remove();
      if (!fig.querySelector(".sponsor__name")) {
        var span = document.createElement("span");
        span.className = "sponsor__name";
        span.textContent = name;           // textContent → no HTML injection
        fig.appendChild(span);
      }
    });
  }

  /* ---------- Current year in footer ---------- */
  var yearEls = document.querySelectorAll("[data-year]");
  var year = String(new Date().getFullYear());
  for (var i = 0; i < yearEls.length; i++) {
    yearEls[i].textContent = year;
  }

  /* ---------- Ticketverkauf-Start (1. August 2026, 12:00 Uhr MESZ) ---------- */
  var saleStart = Date.parse("2026-08-01T12:00:00+02:00");
  var ticketLinks = document.querySelectorAll("[data-ticket]");
  var lockNotes = document.querySelectorAll("[data-ticket-note]");

  function blockTicketClick(e) { e.preventDefault(); }

  function lockTickets() {
    for (var t = 0; t < ticketLinks.length; t++) {
      var tl = ticketLinks[t];
      tl.classList.add("is-locked");
      tl.setAttribute("aria-disabled", "true");
      tl.setAttribute("title", "Verkauf startet am 1. August 2026 um 12:00 Uhr");
      tl.addEventListener("click", blockTicketClick);
    }
    for (var n = 0; n < lockNotes.length; n++) { lockNotes[n].hidden = false; }
  }

  function unlockTickets() {
    for (var t = 0; t < ticketLinks.length; t++) {
      var tl = ticketLinks[t];
      tl.classList.remove("is-locked");
      tl.removeAttribute("aria-disabled");
      tl.removeAttribute("title");
      tl.removeEventListener("click", blockTicketClick);
    }
    for (var n = 0; n < lockNotes.length; n++) { lockNotes[n].hidden = true; }
  }

  if (Date.now() < saleStart) {
    lockTickets();
    // Genau um 12:00 live freischalten – ohne dass der Besucher neu laden muss.
    // setTimeout unterstützt max. ~24,8 Tage; nur dann einplanen, sonst greift der
    // normale Sperr-Check beim nächsten Laden.
    var msUntilSale = saleStart - Date.now();
    if (msUntilSale <= 2147483647) {
      setTimeout(unlockTickets, msUntilSale + 300);
    }
  }

  /* ---------- Copy-to-clipboard (address) ---------- */
  function copyFallback(text, done) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "absolute";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); } catch (e) {}
    document.body.removeChild(ta);
    done();
  }
  var copyBtns = document.querySelectorAll(".copybtn");
  for (var cb = 0; cb < copyBtns.length; cb++) {
    copyBtns[cb].addEventListener("click", function (e) {
      var btn = e.currentTarget;
      var text = btn.getAttribute("data-copy") || "";
      var original = btn.textContent;
      var done = function () {
        btn.textContent = "Adresse kopiert";
        btn.classList.add("copied");
        setTimeout(function () { btn.textContent = original; btn.classList.remove("copied"); }, 1800);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, function () { copyFallback(text, done); });
      } else {
        copyFallback(text, done);
      }
    });
  }

  /* ---------- FAQ-Accordion per Link öffnen (z.B. /infos#faq-shuttle) ---------- */
  function openFaqFromHash() {
    if (!location.hash) return;
    var target = document.querySelector(location.hash);
    if (target && target.tagName === "DETAILS") {
      target.open = true;
      target.scrollIntoView({ block: "start" });
    }
  }
  openFaqFromHash();
  window.addEventListener("hashchange", openFaqFromHash);

  /* ---------- Countdown to the ball ---------- */
  var cd = document.getElementById("countdown");
  if (cd) {
    // 21. November 2026, 19:00 Uhr MEZ (Einlass) – fixe Zeitzone Wien
    var target = Date.parse("2026-11-21T19:00:00+01:00");
    var elDays = document.getElementById("cd-days");
    var elHours = document.getElementById("cd-hours");
    var elMins = document.getElementById("cd-mins");
    var elSecs = document.getElementById("cd-secs");

    function pad(n) { return (n < 10 ? "0" : "") + n; }

    function tick() {
      var diff = target - Date.now();
      if (diff <= 0) {
        cd.innerHTML = "";
        var done = document.createElement("p");
        done.className = "countdown-done";
        done.textContent = "Carpe Noctem — es ist so weit. Willkommen!";
        cd.appendChild(done);
        clearInterval(timer);
        return;
      }
      var s = Math.floor(diff / 1000);
      var days = Math.floor(s / 86400);
      var hours = Math.floor((s % 86400) / 3600);
      var mins = Math.floor((s % 3600) / 60);
      var secs = s % 60;
      if (elDays) elDays.textContent = days;
      if (elHours) elHours.textContent = pad(hours);
      if (elMins) elMins.textContent = pad(mins);
      if (elSecs) elSecs.textContent = pad(secs);
    }

    var timer = setInterval(tick, 1000);
    tick();
  }
})();

/* ---------- Klicks auf Ticket-Buttons zählen (anonym) ----------
   Nur Gesamtzahlen pro Button und Tag, keine Cookies, keine Kennungen.
   sendBeacon blockiert den Seitenwechsel nicht. */
(function () {
  "use strict";
  function send(k) {
    try {
      var body = JSON.stringify({ k: k });
      if (navigator.sendBeacon) navigator.sendBeacon("/api/klick", body);
      else fetch("/api/klick", { method: "POST", body: body, keepalive: true });
    } catch (e) {}
  }
  window.hjbKlick = send;
  var PAGES = { "/": "start", "/index": "start", "/infos": "infos", "/ablauf": "ablauf", "/location": "location",
                "/komitee": "komitee", "/sponsoren": "sponsoren", "/impressum": "impressum", "/tickets": "tickets" };
  var path = location.pathname.replace(/\.html$/, "").replace(/\/+$/, "") || "/";
  var page = PAGES[path] || "andere";
  document.addEventListener("click", function (e) {
    var a = e.target && e.target.closest ? e.target.closest("[data-ticket]") : null;
    if (!a || a.classList.contains("is-locked")) return;
    var where = a.closest(".nav") ? "nav" : a.closest(".hero") ? "oben" : a.closest("#tickets") ? "ticketbereich" : a.closest(".faq") ? "faq" : "inhalt";
    send("btn:" + page + ":" + where);
  }, true);
})();