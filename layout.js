(() => {
  "use strict";

  let searchDataPromise;
  let searchInitialized = false;

  function normalizeBasePath(value) {
    const trimmed = String(value || ".").trim();
    if (!trimmed || trimmed === "./") {
      return ".";
    }
    return trimmed.replace(/\/+$/, "") || ".";
  }

  function readLayoutConfig(overrides = {}) {
    const body = document.body;
    return {
      basePath: normalizeBasePath(overrides.basePath || body?.dataset.basePath || "."),
      activeNav: String(overrides.activeNav || body?.dataset.nav || "").trim()
    };
  }

  function href(basePath, path) {
    return `${basePath}/${path}`;
  }

  function normalizeText(value) {
    return String(value || "").trim();
  }

  function normalizeForSearch(value) {
    return normalizeText(value)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function shorten(value, maxLength = 150) {
    const text = normalizeText(value);
    if (text.length <= maxLength) {
      return text;
    }
    return `${text.slice(0, maxLength - 1).trimEnd()}…`;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function resolveTopicHref(topic, basePath) {
    const articlePath = normalizeText(topic?.artikelPfad);
    if (articlePath) {
      return href(basePath, articlePath.replace(/^\.?\//, ""));
    }
    return `${href(basePath, "pages/thema.html")}?id=${encodeURIComponent(topic.id)}`;
  }

  function getTopicIntro(topic) {
    if (topic && typeof topic.inhalt === "object" && topic.inhalt) {
      return normalizeText(topic.inhalt.einleitung || topic.beschreibung);
    }
    return normalizeText(topic?.beschreibung);
  }

  function getTopicDefinition(topic) {
    const sections = Array.isArray(topic?.inhalt?.abschnitte) ? topic.inhalt.abschnitte : [];
    const explicitDefinition = sections.find((section) => {
      return normalizeForSearch(section?.titel).includes("definition");
    });

    if (explicitDefinition) {
      return normalizeText(explicitDefinition.text);
    }

    return normalizeText(sections[0]?.text || "");
  }

  function buildSearchIndex(basePath, topics) {
    const topicEntries = topics.map((topic) => {
      const title = normalizeText(topic.titel);
      const intro = getTopicIntro(topic);
      const definition = getTopicDefinition(topic);
      const searchable = normalizeForSearch([title, intro, definition, normalizeText(topic.id), normalizeText(topic.slug), normalizeText(topic.kategorie), normalizeText(topic.unterkategorie)].join(" "));

      return {
        type: "Thema",
        title,
        intro,
        definition,
        href: resolveTopicHref(topic, basePath),
        searchable
      };
    });
    return topicEntries;
  }

  async function loadSearchIndex(basePath) {
    if (!searchDataPromise) {
      searchDataPromise = fetch(href(basePath, "data/themen.json")).then((response) => {
        if (!response.ok) {
          throw new Error("Themen konnten nicht geladen werden.");
        }
        return response.json();
      }).then((topics) => {
        return buildSearchIndex(basePath, topics);
      });
    }

    return searchDataPromise;
  }

  function renderSearchResults(panel, query, entries) {
    const normalizedQuery = normalizeForSearch(query);
    if (!normalizedQuery) {
      panel.innerHTML = "";
      panel.hidden = true;
      return;
    }

    const tokens = normalizedQuery.split(/\s+/).filter(Boolean);

    const matches = entries
      .filter((entry) => tokens.every((token) => entry.searchable.includes(token)))
      .sort((a, b) => a.title.localeCompare(b.title, "de"))
      .slice(0, 10);

    if (matches.length === 0) {
      panel.innerHTML = '<p class="search-empty">Keine Ergebnisse gefunden.</p>';
      panel.hidden = false;
      return;
    }

    panel.innerHTML = matches.map((entry) => {
      const snippetSource = entry.intro || entry.definition;
      const snippet = shorten(snippetSource || entry.definition, 160);

      return `<a class="search-result-item" href="${entry.href}">
        <span class="search-result-title">${escapeHtml(entry.title)}</span>
        <span class="search-result-meta">${escapeHtml(entry.type)}</span>
        <span class="search-result-snippet">${escapeHtml(snippet)}</span>
      </a>`;
    }).join("");

    panel.hidden = false;
  }

  function initHeaderSearch(config = {}) {
    if (searchInitialized) {
      return;
    }

    const { basePath } = readLayoutConfig(config);
    const searchBox = document.querySelector(".header-search");
    const input = searchBox?.querySelector("input[type='search']");
    const panel = searchBox?.querySelector(".search-results");

    if (!searchBox || !input || !panel) {
      return;
    }

    const closePanel = () => {
      panel.innerHTML = "";
      panel.hidden = true;
    };

    input.addEventListener("focus", () => {
      loadSearchIndex(basePath).catch(() => {
        panel.innerHTML = '<p class="search-empty">Suche konnte nicht geladen werden.</p>';
        panel.hidden = false;
      });
    });

    input.addEventListener("input", async () => {
      const query = input.value.trim();
      if (!query) {
        closePanel();
        return;
      }

      try {
        const entries = await loadSearchIndex(basePath);
        renderSearchResults(panel, query, entries);
      } catch (error) {
        panel.innerHTML = '<p class="search-empty">Suche konnte nicht geladen werden.</p>';
        panel.hidden = false;
        console.error(error);
      }
    });

    document.addEventListener("click", (event) => {
      if (!searchBox.contains(event.target)) {
        closePanel();
      }
    });

    input.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        input.blur();
        closePanel();
      }
    });

    searchInitialized = true;
  }

  function navLink(basePath, activeNav, key, label, path) {
    const activeClass = activeNav === key ? " class=\"active\"" : "";
    return `<li><a${activeClass} href="${href(basePath, path)}">${label}</a></li>`;
  }

  function renderHeader(config = {}) {
    const { basePath, activeNav } = readLayoutConfig(config);
    return `<header class="site-header">
    <div class="container nav-wrap">
      <a class="brand" href="${href(basePath, "index.html")}">MarktWiki</a>
      <div class="header-search">
        <input type="search" placeholder="Suche im MarktWiki..." aria-label="Suche im MarktWiki" autocomplete="off" spellcheck="false">
        <div class="search-results" hidden aria-live="polite"></div>
      </div>
      <nav class="main-nav" aria-label="Hauptnavigation">
        <ul>
          ${navLink(basePath, activeNav, "wiki", "Wiki", "wiki/index.html")}
          ${navLink(basePath, activeNav, "stocks", "Aktien", "aktien.html")}
          ${navLink(basePath, activeNav, "tools", "Werkzeuge", "werkzeuge.html")}
        </ul>
      </nav>
    </div>
  </header>`;
  }

  function renderFooter(config = {}) {
    const { basePath } = readLayoutConfig(config);
    return `<footer class="site-footer">
    <div class="container footer-wrap">
      <p>MarktWiki</p>
      <nav aria-label="Footer Navigation">
        <a href="${href(basePath, "impressum.html")}">Impressum</a>
        <a href="${href(basePath, "datenschutz.html")}">Datenschutz</a>
      </nav>
    </div>
  </footer>`;
  }

  function injectMarkup(markup, fallbackPosition = "afterbegin") {
    const marker = document.currentScript;
    if (marker) {
      // Waehren Parser-Ausfuehrung direkt in den Dokumentstrom schreiben,
      // damit Header/Footer ohne spaetes Nachrendern erscheinen.
      if (document.readyState === "loading") {
        document.write(markup);
        return;
      }

      // Falls spaeter aufgerufen, Skriptmarker direkt ersetzen.
      marker.outerHTML = markup;
      return;
    }

    // Fallback fuer Aufrufe ausserhalb des Parser-Kontexts.
    document.body?.insertAdjacentHTML(fallbackPosition, markup);
  }

  function injectHeader(config = {}) {
    injectMarkup(renderHeader(config), "afterbegin");
    initHeaderSearch(config);
  }

  function injectFooter(config = {}) {
    injectMarkup(renderFooter(config), "beforeend");
  }

  window.MarktWikiLayout = {
    renderHeader,
    renderFooter,
    injectHeader,
    injectFooter
  };
})();
