# robbe-consulting.de — Website

Statischer Build der Website von **Robbe Sales & AI Consulting** (Florian Robbe, Baiersbronn).
SEO-, GEO- und Performance-optimierte Fassung, Stand 05.07.2026.

**Live-Vorschau (GitHub Pages):** https://mrrobb86.github.io/

## Struktur

```
/                    Startseite (index.html) + 404.html
/ki-beratung ...     14 Unterseiten, je als Ordner mit index.html (vorgerendert)
/assets/             JS-Bundle + CSS (gehashte Dateinamen)
/images/             Bilder
.htaccess            Apache-Konfiguration: Redirects, Kanonisierung, Kompression, Caching
robots.txt           Crawler-Regeln + Sitemap- und llms.txt-Verweis
sitemap.xml          Sitemap (15 Seiten)
llms.txt             Kompakte Website-Infos für KI-Assistenten
llms-full.txt        Ausführliche Inhalte für KI-Assistenten
geo-seite.txt        GEO-Faktenblatt
og-image.jpg         Social-Media-Vorschaubild (selbst gehostet)
```

## Deployment auf den Webserver (Produktion)

Kompletten Repo-Inhalt (ohne `.git`, `README.md`, `.nojekyll`, `.gitignore`) ins Web-Root
des Hosters laden — **inklusive der unsichtbaren `.htaccess`**. Die `.htaccess` übernimmt:

- http→https, www→non-www
- Kanonische URLs ohne Trailing-Slash (`/ki-beratung` liefert direkt 200,
  `/ki-beratung/` und `/ki-beratung/index.html` leiten mit 301 dorthin)
- Echte 404-Statuscodes für unbekannte URLs (kein Soft-404)
- gzip-/Brotli-Kompression, differenzierte Cache-Header

**Hinweis GitHub Pages:** Pages ignoriert die `.htaccess` — die Vorschau hier nutzt
daher Trailing-Slash-URLs und hat keine Redirect-/Header-Logik. Maßgeblich für
Suchmaschinen ist der Apache-Hoster mit robbe-consulting.de.
