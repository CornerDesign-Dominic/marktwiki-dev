(() => {
  "use strict";

  const THEME_STORAGE_KEY = "marktwiki-theme";
  const DEFAULT_THEME = "dark";
  const LIGHT_THEME = "light";
  let searchDataPromise;
  let searchInitialized = false;
  let navSubmenusInitialized = false;
  let themeToggleInitialized = false;
  const NAV_ITEMS = [
    {
      key: "wiki",
      label: "Wiki",
      sections: [
        { key: "wiki-home", label: "Wiki", path: "wiki/index.html", aliases: ["wiki"] }
      ]
    },
    {
      key: "markets",
      label: "Märkte",
      aliases: ["stocks"],
      sections: [
        { key: "markets-home", label: "Märkte", path: "maerkte.html", aliases: ["markets"] },
        { key: "listed-companies", label: "Börsennotierte Unternehmen", path: "aktien.html", aliases: ["stocks"] },
        { key: "indices", label: "Indizes", path: "indizes.html" },
        { key: "exchange-rates", label: "Wechselkurse", path: "wechselkurse.html" },
        { key: "commodities", label: "Rohstoffe", path: "rohstoffe.html" },
        { key: "crypto", label: "Krypto", path: "krypto.html" },
        { key: "etfs", label: "ETFs", path: "etfs.html" }
      ]
    },
    {
      key: "tools",
      label: "Tools",
      sections: [
        { key: "tools-home", label: "Tools", path: "werkzeuge.html", aliases: ["tools"] }
      ]
    }
  ];

  function normalizeTheme(value) {
    return value === LIGHT_THEME ? LIGHT_THEME : DEFAULT_THEME;
  }

  function readStoredTheme() {
    try {
      return normalizeTheme(window.localStorage.getItem(THEME_STORAGE_KEY));
    } catch (error) {
      return DEFAULT_THEME;
    }
  }

  function persistTheme(theme) {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, normalizeTheme(theme));
    } catch (error) {
      // localStorage kann blockiert sein; das Theme bleibt dann nur temporaer aktiv.
    }
  }

  function applyTheme(theme) {
    const resolvedTheme = normalizeTheme(theme);
    document.documentElement.setAttribute("data-theme", resolvedTheme);
    document.documentElement.style.colorScheme = resolvedTheme;
    return resolvedTheme;
  }

  function getThemeToggleLabel(theme) {
    return normalizeTheme(theme) === LIGHT_THEME ? "Dark Mode aktivieren" : "Light Mode aktivieren";
  }

  function syncThemeToggle(toggle, theme) {
    if (!toggle) {
      return;
    }

    const isLight = normalizeTheme(theme) === LIGHT_THEME;
    const label = getThemeToggleLabel(theme);
    toggle.setAttribute("aria-checked", isLight ? "true" : "false");
    toggle.setAttribute("aria-label", label);
    toggle.setAttribute("title", label);
  }

  function initThemeToggle() {
    const toggle = document.querySelector("[data-theme-toggle]");
    if (!toggle) {
      return;
    }

    syncThemeToggle(toggle, document.documentElement.getAttribute("data-theme"));

    if (themeToggleInitialized) {
      return;
    }

    toggle.addEventListener("click", () => {
      const currentTheme = normalizeTheme(document.documentElement.getAttribute("data-theme"));
      const nextTheme = currentTheme === LIGHT_THEME ? DEFAULT_THEME : LIGHT_THEME;
      applyTheme(nextTheme);
      persistTheme(nextTheme);
      syncThemeToggle(toggle, nextTheme);
    });

    themeToggleInitialized = true;
  }

  applyTheme(readStoredTheme());

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

  function isSectionActive(activeNav, section) {
    if (activeNav === section.key) {
      return true;
    }
    if (Array.isArray(section.aliases) && section.aliases.includes(activeNav)) {
      return true;
    }
    return false;
  }

  function isNavActive(activeNav, item) {
    if (activeNav === item.key) {
      return true;
    }
    if (Array.isArray(item.aliases) && item.aliases.includes(activeNav)) {
      return true;
    }
    if (Array.isArray(item.sections) && item.sections.some((section) => isSectionActive(activeNav, section))) {
      return true;
    }
    return false;
  }

  function navItemMarkup(basePath, activeNav, item) {
    if (Array.isArray(item.sections) && item.sections.length) {
      const activeClass = isNavActive(activeNav, item) ? " active" : "";
      const keyAttr = ` data-nav-key="${escapeHtml(item.key)}"`;
      return `<li class="nav-item has-submenu" data-nav-group="${escapeHtml(item.key)}">
        <button type="button" class="nav-parent${activeClass}"${keyAttr} data-nav-toggle="${escapeHtml(item.key)}" aria-expanded="false" aria-haspopup="true" aria-controls="main-nav-submenu-panel">
          <span>${item.label}</span>
        </button>
      </li>`;
    }

    const activeClass = isNavActive(activeNav, item) ? " class=\"active\"" : "";
    const keyAttr = ` data-nav-key="${escapeHtml(item.key)}"`;
    return `<li class="nav-item"><a${activeClass}${keyAttr} href="${href(basePath, item.path)}">${item.label}</a></li>`;
  }

  function initNavSubmenus() {
    if (navSubmenusInitialized) {
      return;
    }

    const { basePath, activeNav } = readLayoutConfig();
    const navWrap = document.querySelector(".nav-wrap");
    const navRoot = document.querySelector(".main-nav");
    const panel = document.querySelector("#main-nav-submenu-panel");
    const panelTitle = panel?.querySelector("[data-submenu-title]");
    const panelList = panel?.querySelector("[data-submenu-list]");
    if (!navRoot || !navWrap || !panel || !panelTitle || !panelList) {
      return;
    }

    const hoverCapable = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const submenuItems = NAV_ITEMS.filter((item) => Array.isArray(item.sections) && item.sections.length);
    const submenuItemsByKey = new Map(submenuItems.map((item) => [item.key, item]));
    const submenuToggles = Array.from(navRoot.querySelectorAll("[data-nav-toggle]"));
    if (!submenuItems.length) {
      navSubmenusInitialized = true;
      return;
    }

    let closeTimer = 0;
    let openKey = "";
    let stickyOpen = false;

    const clearCloseTimer = () => {
      if (closeTimer) {
        window.clearTimeout(closeTimer);
        closeTimer = 0;
      }
    };

    const setExpandedState = (expandedKey = "") => {
      submenuToggles.forEach((toggle) => {
        const key = String(toggle.getAttribute("data-nav-toggle") || "");
        const isExpanded = expandedKey && key === expandedKey;
        toggle.setAttribute("aria-expanded", isExpanded ? "true" : "false");
        toggle.classList.toggle("is-open", !!isExpanded);
      });
    };

    const closeMenu = (restoreFocus = false) => {
      clearCloseTimer();
      const previousOpenKey = openKey;
      openKey = "";
      stickyOpen = false;
      navWrap.classList.remove("submenu-open");
      panel.hidden = true;
      panel.setAttribute("aria-hidden", "true");
      panelTitle.textContent = "";
      panelList.innerHTML = "";
      setExpandedState("");

      if (restoreFocus && previousOpenKey) {
        const focusTarget = navRoot.querySelector(`[data-nav-toggle="${previousOpenKey}"]`);
        if (focusTarget instanceof HTMLElement) {
          focusTarget.focus();
        }
      }
    };

    const renderPanelContent = (item) => {
      panelTitle.textContent = item.label;
      panelList.innerHTML = item.sections.map((section) => {
        const sectionActiveClass = isSectionActive(activeNav, section) ? " class=\"active\"" : "";
        const sectionKeyAttr = ` data-nav-key="${escapeHtml(section.key)}"`;
        return `<li><a${sectionActiveClass}${sectionKeyAttr} href="${href(basePath, section.path)}">${section.label}</a></li>`;
      }).join("");
    };

    const openMenu = (key, options = {}) => {
      const item = submenuItemsByKey.get(key);
      if (!item) {
        closeMenu(false);
        return;
      }

      const { sticky = false } = options;
      clearCloseTimer();
      openKey = key;
      stickyOpen = !!sticky;
      renderPanelContent(item);
      navWrap.classList.add("submenu-open");
      panel.hidden = false;
      panel.setAttribute("aria-hidden", "false");
      setExpandedState(key);
    };

    const scheduleClose = () => {
      clearCloseTimer();
      closeTimer = window.setTimeout(() => {
        closeMenu(false);
      }, 170);
    };

    submenuToggles.forEach((toggle) => {
      const key = String(toggle.getAttribute("data-nav-toggle") || "");
      if (!key) {
        return;
      }

      toggle.addEventListener("click", (event) => {
        event.preventDefault();
        if (openKey === key) {
          closeMenu(false);
          return;
        }
        openMenu(key, { sticky: true });
      });

      if (hoverCapable) {
        toggle.addEventListener("mouseenter", () => {
          openMenu(key, { sticky: false });
        });
      }

      toggle.addEventListener("focus", () => {
        openMenu(key, { sticky: false });
      });

      toggle.addEventListener("keydown", (event) => {
        if (event.key === "ArrowDown") {
          event.preventDefault();
          openMenu(key, { sticky: true });
          const firstLink = panelList.querySelector("a");
          if (firstLink instanceof HTMLElement) {
            firstLink.focus();
          }
        }
      });
    });

    if (hoverCapable) {
      navWrap.addEventListener("mouseleave", () => {
        if (!openKey) {
          return;
        }
        if (stickyOpen) {
          return;
        }
        scheduleClose();
      });

      navWrap.addEventListener("mouseenter", () => {
        clearCloseTimer();
      });
    }

    panel.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu(true);
      }
    });

    document.addEventListener("click", (event) => {
      if (!openKey) {
        return;
      }
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }
      if (!navWrap.contains(target)) {
        closeMenu(false);
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") {
        return;
      }
      if (openKey) {
        event.preventDefault();
        closeMenu(true);
      }
    });

    document.addEventListener("focusin", (event) => {
      if (!openKey) {
        return;
      }
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }
      if (!navWrap.contains(target)) {
        closeMenu(false);
      }
    });

    navSubmenusInitialized = true;
  }

  function renderHeader(config = {}) {
    const { basePath, activeNav } = readLayoutConfig(config);
    const navMarkup = NAV_ITEMS.map((item) => navItemMarkup(basePath, activeNav, item)).join("");
    const themeToggleMarkup = `<div class="header-edge-toggle">
      <div class="theme-toggle-wrap">
        <button type="button" class="theme-toggle" data-theme-toggle role="switch" aria-checked="false" aria-label="Light Mode aktivieren">
          <span class="theme-toggle-track" aria-hidden="true">
            <span class="theme-toggle-thumb"></span>
          </span>
          <span class="sr-only">Darstellung wechseln</span>
        </button>
      </div>
    </div>`;

    return `<header class="site-header">
    <div class="container nav-wrap">
      <a class="brand" href="${href(basePath, "index.html")}">MarktWiki</a>
      <div class="header-search">
        <input type="search" placeholder="Suche im MarktWiki..." aria-label="Suche im MarktWiki" autocomplete="off" spellcheck="false">
        <div class="search-results" hidden aria-live="polite"></div>
      </div>
      <nav class="main-nav" aria-label="Hauptnavigation">
        <ul>
          ${navMarkup}
        </ul>
      </nav>
      <div id="main-nav-submenu-panel" class="nav-submenu-panel" hidden aria-hidden="true">
        <p class="nav-submenu-title" data-submenu-title></p>
        <ul class="nav-submenu-list" data-submenu-list></ul>
      </div>
    </div>
    ${themeToggleMarkup}
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
    initThemeToggle();
    initHeaderSearch(config);
    initNavSubmenus();
  }

  function injectFooter(config = {}) {
    injectMarkup(renderFooter(config), "beforeend");
  }

  function copyWithFallback(text) {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
      return navigator.clipboard.writeText(text);
    }

    return new Promise((resolve, reject) => {
      try {
        const helper = document.createElement("textarea");
        helper.value = text;
        helper.setAttribute("readonly", "");
        helper.style.position = "fixed";
        helper.style.opacity = "0";
        document.body.appendChild(helper);
        helper.select();
        const successful = document.execCommand("copy");
        document.body.removeChild(helper);
        if (successful) {
          resolve();
          return;
        }
        reject(new Error("Clipboard copy failed"));
      } catch (error) {
        reject(error);
      }
    });
  }

  function enhanceDefinitionSection(article) {
    const definitionHeading = article.querySelector("h2#definition");
    if (!definitionHeading) {
      return;
    }

    const definitionSection = definitionHeading.closest("section");
    if (!definitionSection || definitionSection.querySelector(".definition-box")) {
      return;
    }

    const definitionParagraph = Array.from(definitionSection.children).find((element) => {
      return element.tagName === "P";
    });

    if (!definitionParagraph) {
      return;
    }

    const definitionBox = document.createElement("div");
    definitionBox.className = "definition-box";
    definitionSection.insertBefore(definitionBox, definitionParagraph);
    definitionBox.appendChild(definitionParagraph);

    const copyButton = document.createElement("button");
    copyButton.type = "button";
    copyButton.className = "copy-definition";
    copyButton.title = "Definition kopieren";
    copyButton.setAttribute("aria-label", "Definition kopieren");
    copyButton.textContent = "Kopieren";
    definitionBox.appendChild(copyButton);

    copyButton.addEventListener("click", async () => {
      const definitionText = normalizeText(definitionParagraph.textContent);
      if (!definitionText) {
        return;
      }

      const defaultLabel = "Kopieren";
      copyButton.disabled = true;

      try {
        await copyWithFallback(definitionText);
        copyButton.textContent = "Kopiert";
      } catch (error) {
        copyButton.textContent = "Fehler";
        console.error(error);
      } finally {
        window.setTimeout(() => {
          copyButton.textContent = defaultLabel;
          copyButton.disabled = false;
        }, 1400);
      }
    });
  }

  function createArticleToc(article, headings) {
    const toc = document.createElement("section");
    toc.className = "article-toc";
    toc.setAttribute("aria-label", "Inhaltsnavigation");

    const heading = document.createElement("h3");
    heading.textContent = "Inhalt";
    toc.appendChild(heading);

    const list = document.createElement("ul");
    headings.forEach((entryHeading) => {
      const id = normalizeText(entryHeading.id);
      const label = normalizeText(entryHeading.textContent);
      if (!id || !label) {
        return;
      }

      const item = document.createElement("li");
      const link = document.createElement("a");
      link.href = `#${id}`;
      link.textContent = label;
      item.appendChild(link);
      list.appendChild(item);
    });

    if (!list.children.length) {
      return null;
    }

    toc.appendChild(list);
    return toc;
  }

  function enhanceArticleToc(article) {
    if (!article || article.closest(".article-with-toc")) {
      return;
    }

    const headings = Array.from(article.querySelectorAll("h2[id]"));
    if (!headings.length) {
      return;
    }

    const shouldShowToc = article.offsetHeight > 900 || headings.length >= 4;
    if (!shouldShowToc) {
      return;
    }

    const toc = createArticleToc(article, headings);
    if (!toc || !article.parentElement) {
      return;
    }

    const wrapper = document.createElement("div");
    wrapper.className = "article-with-toc";
    article.parentElement.insertBefore(wrapper, article);
    wrapper.appendChild(toc);
    wrapper.appendChild(article);
  }

  function initWikiArticleEnhancements() {
    const articles = document.querySelectorAll(".wiki-article");
    if (!articles.length) {
      return;
    }

    articles.forEach((article) => {
      enhanceDefinitionSection(article);
      enhanceArticleToc(article);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initWikiArticleEnhancements, { once: true });
  } else {
    initWikiArticleEnhancements();
  }

  window.MarktWikiLayout = {
    renderHeader,
    renderFooter,
    injectHeader,
    injectFooter
  };
})();
