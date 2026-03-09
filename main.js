(() => {
  "use strict";

  const page = document.body.dataset.page || "";
  const basePath = document.body.dataset.basePath || ".";

  const DATA_FILES = {
    categories: "kategorien.json",
    topics: "themen.json",
    terms: "begriffe.json"
  };

  // Centralized JSON loader for all pages.
  async function loadJson(fileName) {
    const response = await fetch(`${basePath}/data/${fileName}`);
    if (!response.ok) {
      throw new Error(`Daten konnten nicht geladen werden: ${fileName}`);
    }
    return response.json();
  }

  function setMetaDescription(content) {
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute("content", content);
    }
  }

  function renderMessage(container, text, isError = false) {
    container.innerHTML = "";
    const msg = document.createElement("p");
    msg.className = `status-message${isError ? " error" : ""}`;
    msg.textContent = text;
    container.appendChild(msg);
  }

  function createBadge(text) {
    const badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = text;
    return badge;
  }

  function createButtonLink(href, label) {
    const link = document.createElement("a");
    link.className = "btn";
    link.href = href;
    link.textContent = label;
    return link;
  }

  function normalizeText(value) {
    return String(value || "").trim();
  }

  // Allows gradual migration from JSON detail pages to static wiki article files.
  function resolveTopicHref(topic) {
    const articlePath = normalizeText(topic?.artikelPfad);
    if (articlePath) {
      const cleanPath = articlePath.replace(/^\.?\//, "");
      return `${basePath}/${cleanPath}`;
    }
    return `${basePath}/pages/thema.html?id=${encodeURIComponent(topic.id)}`;
  }

  function getTopicIntro(topic) {
    if (topic && typeof topic.inhalt === "object" && topic.inhalt) {
      return normalizeText(topic.inhalt.einleitung || topic.beschreibung);
    }
    return normalizeText(topic?.beschreibung);
  }

  function createTopicCard(topic) {
    const card = document.createElement("article");
    card.className = "card topic-card";

    const title = document.createElement("h3");
    title.textContent = normalizeText(topic.titel);

    const desc = document.createElement("p");
    desc.textContent = normalizeText(topic.beschreibung);

    const badgeRow = document.createElement("div");
    badgeRow.className = "badge-row";
    badgeRow.appendChild(createBadge(topic.kategorie));
    badgeRow.appendChild(createBadge(topic.unterkategorie));

    const actions = document.createElement("div");
    actions.className = "card-actions";
    actions.appendChild(createButtonLink(resolveTopicHref(topic), "Artikel lesen"));

    card.append(title, desc, badgeRow, actions);
    return card;
  }

  async function initTopics() {
    const list = document.querySelector("#themen-list");
    const filter = document.querySelector("#kategorie-filter");
    const counter = document.querySelector("#themen-count");

    if (!list || !filter || !counter) {
      return;
    }

    const [topics, categories] = await Promise.all([
      loadJson(DATA_FILES.topics),
      loadJson(DATA_FILES.categories)
    ]);

    filter.innerHTML = "";
    const allOption = document.createElement("option");
    allOption.value = "Alle";
    allOption.textContent = "Alle Kategorien";
    filter.appendChild(allOption);

    // Merge configured categories with data categories from topics for easy future extension.
    const categorySet = new Set(categories.map((category) => normalizeText(category.titel)));
    topics.forEach((topic) => categorySet.add(normalizeText(topic.kategorie)));

    [...categorySet].filter(Boolean).sort((a, b) => a.localeCompare(b, "de")).forEach((categoryTitle) => {
      const option = document.createElement("option");
      option.value = categoryTitle;
      option.textContent = categoryTitle;
      filter.appendChild(option);
    });

    const params = new URLSearchParams(window.location.search);
    const initialCategory = params.get("kategorie") || "Alle";
    const categoryExists = [...filter.options].some((option) => option.value === initialCategory);
    filter.value = categoryExists ? initialCategory : "Alle";

    // Re-render list whenever filter changes or URL param updates.
    const renderTopicList = () => {
      list.innerHTML = "";

      const selected = filter.value;
      const filteredTopics = topics.filter((topic) => {
        return selected === "Alle" || topic.kategorie === selected;
      });

      counter.textContent = `${filteredTopics.length} Thema/Themen gefunden`;

      if (filteredTopics.length === 0) {
        renderMessage(list, "Für diese Kategorie sind noch keine Themen vorhanden.");
        return;
      }

      filteredTopics.forEach((topic) => {
        list.appendChild(createTopicCard(topic));
      });
    };

    filter.addEventListener("change", () => {
      const selected = filter.value;
      const nextParams = new URLSearchParams(window.location.search);

      if (selected === "Alle") {
        nextParams.delete("kategorie");
      } else {
        nextParams.set("kategorie", selected);
      }

      const query = nextParams.toString();
      const nextUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname;
      window.history.replaceState({}, "", nextUrl);
      renderTopicList();
    });

    renderTopicList();
  }

  function clearAndSetText(selector, value) {
    const node = document.querySelector(selector);
    if (node) {
      node.textContent = normalizeText(value);
    }
  }

  async function initTopicDetail() {
    const article = document.querySelector("#thema-detail");
    if (!article) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const topicId = params.get("id");

    if (!topicId) {
      renderMessage(article, "Kein Thema ausgewählt.", true);
      return;
    }

    // Load topics and glossary terms once to resolve cross-links.
    const [topics, terms] = await Promise.all([
      loadJson(DATA_FILES.topics),
      loadJson(DATA_FILES.terms)
    ]);

    const topic = topics.find((entry) => entry.id === topicId);

    if (!topic) {
      renderMessage(article, "Thema nicht gefunden.", true);
      return;
    }

    document.title = `${topic.titel} | MarktWiki`;
    setMetaDescription(topic.beschreibung);

    clearAndSetText("#thema-titel", topic.titel);
    clearAndSetText("#thema-meta", `${topic.kategorie} / ${topic.unterkategorie}`);
    clearAndSetText("#thema-einleitung", getTopicIntro(topic));

    const sectionContainer = document.querySelector("#thema-abschnitte");
    if (sectionContainer) {
      sectionContainer.innerHTML = "";
      const sections = Array.isArray(topic.inhalt?.abschnitte) ? topic.inhalt.abschnitte : [];

      sections.forEach((section) => {
        const block = document.createElement("section");
        block.className = "section-space";

        const heading = document.createElement("h2");
        heading.textContent = normalizeText(section.titel);

        const paragraph = document.createElement("p");
        paragraph.textContent = normalizeText(section.text);

        block.append(heading, paragraph);
        sectionContainer.appendChild(block);
      });
    }

    const relatedTermsList = document.querySelector("#thema-begriffe");
    const relatedTermsBox = document.querySelector("#thema-begriffe-box");
    if (relatedTermsList && relatedTermsBox) {
      relatedTermsList.innerHTML = "";
      const termMap = new Map(terms.map((term) => [term.begriff, term.slug]));
      const relatedTerms = Array.isArray(topic.verwandteBegriffe) ? topic.verwandteBegriffe : [];

      if (relatedTerms.length === 0) {
        relatedTermsBox.style.display = "none";
      } else {
        relatedTerms.forEach((termLabel) => {
          const li = document.createElement("li");
          const link = document.createElement("a");
          const slug = termMap.get(termLabel);

          if (slug) {
            link.href = `${basePath}/pages/begriff.html?slug=${encodeURIComponent(slug)}`;
          } else {
            link.href = `${basePath}/begriffe.html`;
          }
          link.textContent = termLabel;

          li.appendChild(link);
          relatedTermsList.appendChild(li);
        });
      }
    }
  }

  async function initTerms() {
    const container = document.querySelector("#begriffe-list");
    if (!container) {
      return;
    }

    const terms = await loadJson(DATA_FILES.terms);
    const sortedTerms = [...terms].sort((a, b) => a.begriff.localeCompare(b.begriff, "de"));
    container.innerHTML = "";

    sortedTerms.forEach((term) => {
      const card = document.createElement("article");
      card.className = "card term-card";

      const title = document.createElement("h3");
      const link = document.createElement("a");
      link.href = `${basePath}/pages/begriff.html?slug=${encodeURIComponent(term.slug)}`;
      link.textContent = normalizeText(term.begriff);
      title.appendChild(link);

      const definition = document.createElement("p");
      definition.textContent = normalizeText(term.definition);

      card.append(title, definition);
      container.appendChild(card);
    });
  }

  async function initTermDetail() {
    const article = document.querySelector("#begriff-detail");
    const titleNode = document.querySelector("#begriff-titel");
    const definitionNode = document.querySelector("#begriff-definition");
    const relatedTopicsNode = document.querySelector("#begriff-themen");

    if (!article || !titleNode || !definitionNode || !relatedTopicsNode) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const slug = params.get("slug");

    if (!slug) {
      renderMessage(article, "Kein Begriff ausgewählt.", true);
      return;
    }

    // Resolve "verwendetIn" IDs to topic titles and links.
    const [terms, topics] = await Promise.all([
      loadJson(DATA_FILES.terms),
      loadJson(DATA_FILES.topics)
    ]);

    const term = terms.find((entry) => entry.slug === slug);
    if (!term) {
      renderMessage(article, "Begriff nicht gefunden.", true);
      return;
    }

    document.title = `${term.begriff} | MarktWiki`;
    setMetaDescription(term.definition);

    titleNode.textContent = normalizeText(term.begriff);
    definitionNode.textContent = normalizeText(term.definition);

    relatedTopicsNode.innerHTML = "";
    const topicMap = new Map(topics.map((topic) => [topic.id, topic]));
    const usedIn = Array.isArray(term.verwendetIn) ? term.verwendetIn : [];

    if (usedIn.length === 0) {
      const li = document.createElement("li");
      li.textContent = "Noch keine verknüpften Themen vorhanden.";
      relatedTopicsNode.appendChild(li);
      return;
    }

    usedIn.forEach((topicId) => {
      const listItem = document.createElement("li");
      const topic = topicMap.get(topicId);

      if (topic) {
        const link = document.createElement("a");
        link.href = resolveTopicHref(topic);
        link.textContent = topic.titel;
        listItem.appendChild(link);
      } else {
        listItem.textContent = topicId;
      }

      relatedTopicsNode.appendChild(listItem);
    });
  }

  async function initPage() {
    try {
      if (page === "topics") {
        await initTopics();
        return;
      }

      if (page === "topic-detail") {
        await initTopicDetail();
        return;
      }

      if (page === "terms") {
        await initTerms();
        return;
      }

      if (page === "term-detail") {
        await initTermDetail();
      }
    } catch (error) {
      const targets = document.querySelectorAll("[data-error-target]");
      if (targets.length > 0) {
        targets.forEach((target) => {
          renderMessage(target, "Fehler beim Laden der Inhalte. Bitte später erneut versuchen.", true);
        });
      }
      console.error(error);
    }
  }

  document.addEventListener("DOMContentLoaded", initPage);
})();
