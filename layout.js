(() => {
  "use strict";

  let searchDataPromise;
  let searchInitialized = false;
  let navSubmenusInitialized = false;
  const NAV_ITEMS = [
    { key: "wiki", label: "Wiki", path: "wiki/index.html" },
    {
      key: "markets",
      label: "Maerkte",
      aliases: ["stocks"],
      sections: [
        { key: "listed-companies", label: "Boersennotierte Unternehmen", path: "aktien.html", aliases: ["stocks"] },
        { key: "exchange-rates", label: "Wechselkurse", path: "wechselkurse.html" }
      ]
    },
    { key: "tools", label: "Tools", path: "werkzeuge.html" }
  ];

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
      const openClass = isNavActive(activeNav, item) ? " is-open" : "";
      const keyAttr = ` data-nav-key="${escapeHtml(item.key)}"`;
      const submenuMarkup = item.sections.map((section) => {
        const sectionActiveClass = isSectionActive(activeNav, section) ? " class=\"active\"" : "";
        const sectionKeyAttr = ` data-nav-key="${escapeHtml(section.key)}"`;
        return `<li><a${sectionActiveClass}${sectionKeyAttr} href="${href(basePath, section.path)}">${section.label}</a></li>`;
      }).join("");

      return `<li class="nav-item has-submenu${openClass}" data-nav-group="${escapeHtml(item.key)}">
        <button type="button" class="nav-parent${activeClass}"${keyAttr} data-nav-toggle="${escapeHtml(item.key)}" aria-expanded="${activeClass ? "true" : "false"}" aria-haspopup="true">
          <span>${item.label}</span>
          <span class="nav-chevron" aria-hidden="true"></span>
        </button>
        <ul class="submenu" data-nav-submenu="${escapeHtml(item.key)}">
          ${submenuMarkup}
        </ul>
      </li>`;
    }

    const activeClass = isNavActive(activeNav, item) ? " class=\"active\"" : "";
    const keyAttr = ` data-nav-key="${escapeHtml(item.key)}"`;
    return `<li class="nav-item"><a${activeClass}${keyAttr} href="${href(basePath, item.path)}">${item.label}</a></li>`;
  }

  function closeSubmenus(navRoot, keepOpenKey = "") {
    const items = navRoot.querySelectorAll(".has-submenu");
    items.forEach((item) => {
      const key = item.getAttribute("data-nav-group");
      const shouldStayOpen = keepOpenKey && key === keepOpenKey;
      item.classList.toggle("is-open", shouldStayOpen);
      const toggle = item.querySelector("[data-nav-toggle]");
      if (toggle) {
        toggle.setAttribute("aria-expanded", shouldStayOpen ? "true" : "false");
      }
    });
  }

  function initNavSubmenus() {
    if (navSubmenusInitialized) {
      return;
    }

    const navRoot = document.querySelector(".main-nav");
    if (!navRoot) {
      return;
    }

    const submenuItems = Array.from(navRoot.querySelectorAll(".has-submenu"));
    if (!submenuItems.length) {
      navSubmenusInitialized = true;
      return;
    }

    submenuItems.forEach((item) => {
      const toggle = item.querySelector("[data-nav-toggle]");
      const key = item.getAttribute("data-nav-group");
      if (!toggle || !key) {
        return;
      }

      toggle.addEventListener("click", (event) => {
        event.preventDefault();
        const isOpen = item.classList.contains("is-open");
        closeSubmenus(navRoot);
        if (!isOpen) {
          item.classList.add("is-open");
          toggle.setAttribute("aria-expanded", "true");
        }
      });
    });

    document.addEventListener("click", (event) => {
      if (!navRoot.contains(event.target)) {
        closeSubmenus(navRoot);
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") {
        return;
      }
      const openToggle = navRoot.querySelector(".has-submenu.is-open [data-nav-toggle]");
      closeSubmenus(navRoot);
      if (openToggle) {
        openToggle.focus();
      }
    });

    navSubmenusInitialized = true;
  }

  function renderHeader(config = {}) {
    const { basePath, activeNav } = readLayoutConfig(config);
    const navMarkup = NAV_ITEMS.map((item) => navItemMarkup(basePath, activeNav, item)).join("");

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
