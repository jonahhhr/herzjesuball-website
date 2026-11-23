# Sponsor-Logos

Lege die Logo-Dateien hier ab – **exakt mit diesen Dateinamen**. Sobald eine Datei
existiert, erscheint sie automatisch auf `sponsoren.html`. Fehlt eine Datei, zeigt die
Kachel elegant den Sponsornamen als Text (Fallback via `js/main.js`).

| Dateiname (in diesem Ordner) | Sponsor |
|------------------------------|---------|
| `zentrum-visionen.svg`       | Zentrum für Visionen |
| `weidham.svg`                | Gas · Wasser · Heizung — Weidham |
| `christmas-easter.svg`       | Christmas & Easter |
| `raiffeisen.svg`             | Raiffeisen |
| `rauscher.svg`               | Rauscher |
| `teekanne.svg`               | Teekanne |
| `beats.svg`                  | Beats — Salzburg Nightlife |
| `lagerhaus.svg`              | Lagerhaus |

## Hinweise

- **Format:** `.svg` bevorzugt (scharf in jeder Größe). PNG geht auch – dann in
  `sponsoren.html` die Endung von `.svg` auf `.png` ändern (oder mir Bescheid geben).
- **Hintergrund:** Die Kacheln sind weiß. Logos mit transparentem Hintergrund oder auf
  Weiß sehen am besten aus.
- **Größe:** Die Höhe wird automatisch auf max. 66 px begrenzt – Seitenverhältnis bleibt erhalten.
- **Weitere Sponsoren:** neue `<figure class="sponsor" data-name="…"><img …></figure>`-Zeile in
  `sponsoren.html` ergänzen und Datei hier ablegen.
