(() => {
  "use strict";

  const page = document.body.dataset.page || "";
  const basePath = document.body.dataset.basePath || ".";

  const DATA_FILES = {
    categories: "kategorien.json",
    topics: "themen.json"
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

    const topics = await loadJson(DATA_FILES.topics);

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

      return;
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
