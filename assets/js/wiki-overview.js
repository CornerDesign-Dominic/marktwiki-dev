(() => {
  "use strict";

  function normalizeBasePath(value) {
    const trimmed = String(value || ".").trim();
    if (!trimmed || trimmed === "./") {
      return ".";
    }
    return trimmed.replace(/\/+$/, "") || ".";
  }

  function href(basePath, path) {
    return `${basePath}/${path}`;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function slugify(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function buildSubcategoryDescription(articles) {
    if (!Array.isArray(articles) || !articles.length) {
      return "Keine Artikel vorhanden.";
    }

    const titles = articles.map((article) => article.titel).filter(Boolean);
    if (titles.length === 1) {
      return `Artikel zu ${titles[0]}.`;
    }
    if (titles.length === 2) {
      return `Artikel zu ${titles[0]} und ${titles[1]}.`;
    }
    return `Artikel zu ${titles[0]}, ${titles[1]} und ${titles.length - 2} weiteren Themen.`;
  }

  function buildCategoryDescription(subcategories) {
    if (!Array.isArray(subcategories) || !subcategories.length) {
      return "Keine Unterkategorien vorhanden.";
    }

    if (subcategories.length === 1) {
      return `1 Unterkategorie mit ${subcategories[0].artikel.length} Artikel(n).`;
    }

    return `${subcategories.length} Unterkategorien mit insgesamt ${subcategories.reduce((sum, entry) => sum + entry.artikel.length, 0)} Artikel(n).`;
  }

  function mergeUniqueBy(array, keyFn) {
    const map = new Map();
    array.forEach((item) => {
      map.set(keyFn(item), item);
    });
    return Array.from(map.values());
  }

  function flattenGeneratedStructure(structure) {
    const categories = [];
    const topics = [];

    Object.entries(structure || {}).forEach(([categoryTitle, subcategories]) => {
      const categoryId = slugify(categoryTitle);
      categories.push({
        id: categoryId,
        titel: categoryTitle,
        beschreibung: ""
      });

      Object.entries(subcategories || {}).forEach(([subcategoryTitle, articles]) => {
        articles.forEach((article) => {
          const slug = String(article.slug || "").trim();
          if (!slug) {
            return;
          }

          topics.push({
            id: slug,
            titel: article.title,
            kategorie: categoryTitle,
            unterkategorie: subcategoryTitle,
            beschreibung: article.description,
            artikelPfad: `wiki/${slug}.html`
          });
        });
      });
    });

    return { categories, topics };
  }

  function buildTree(categories, topics) {
    const tree = categories.map((category) => ({
      ...category,
      subcategories: []
    }));

    const categoryMap = new Map(tree.map((category) => [String(category.titel || "").trim(), category]));

    topics.forEach((topic) => {
      const category = categoryMap.get(String(topic.kategorie || "").trim());
      if (!category) {
        return;
      }

      const subcategoryName = String(topic.unterkategorie || "").trim();
      let subcategory = category.subcategories.find((entry) => entry.titel === subcategoryName);
      if (!subcategory) {
        subcategory = {
          id: `${category.id}-${slugify(subcategoryName)}`,
          titel: subcategoryName,
          beschreibung: "",
          artikel: []
        };
        category.subcategories.push(subcategory);
      }

      subcategory.artikel.push({
        id: topic.id || slugify(topic.titel),
        titel: topic.titel,
        beschreibung: topic.beschreibung,
        artikelPfad: topic.artikelPfad
      });
    });

    tree.forEach((category) => {
      category.subcategories.sort((left, right) => left.titel.localeCompare(right.titel, "de"));
      category.subcategories.forEach((subcategory) => {
        subcategory.artikel.sort((left, right) => left.titel.localeCompare(right.titel, "de"));
        subcategory.beschreibung = buildSubcategoryDescription(subcategory.artikel);
      });
      if (!category.beschreibung) {
        category.beschreibung = buildCategoryDescription(category.subcategories);
      }
    });

    return tree;
  }

  function renderArticleCards(basePath, articles) {
    return articles.map((article) => {
      const articleHref = href(basePath, String(article.artikelPfad || "").replace(/^\.?\//, ""));
      const articleId = `wiki-anchor-article-${escapeHtml(article.id)}`;
      return `<li class="wiki-tree-item wiki-tree-item-article">
        <a class="category-link-card wiki-tree-card wiki-tree-card-article" id="${articleId}" href="${escapeHtml(articleHref)}">
          <span class="wiki-tree-article-row">
            <span class="wiki-tree-article-title">${escapeHtml(article.titel)}</span>
            <span class="wiki-tree-article-description">${escapeHtml(article.beschreibung || "")}</span>
          </span>
        </a>
      </li>`;
    }).join("");
  }

  function renderSubcategoryCards(basePath, category) {
    return category.subcategories.map((subcategory) => {
      const panelId = `wiki-subcategory-${escapeHtml(subcategory.id)}`;
      const buttonId = `wiki-anchor-subcategory-${escapeHtml(subcategory.id)}`;
      return `<li class="wiki-tree-item wiki-tree-item-subcategory">
        <button type="button" class="category-link-card wiki-tree-card wiki-tree-card-toggle wiki-tree-card-subcategory" id="${buttonId}" data-tree-toggle aria-expanded="false" aria-controls="${panelId}">
          <span class="wiki-tree-card-copy">
            <span class="category-card-title">${escapeHtml(subcategory.titel)}</span>
            <span class="category-card-description">${escapeHtml(subcategory.beschreibung)}</span>
          </span>
          <span class="wiki-tree-chevron" aria-hidden="true"></span>
        </button>
        <div class="wiki-tree-panel wiki-tree-panel-articles" id="${panelId}" hidden>
          <ul class="wiki-tree-list wiki-tree-list-articles" aria-label="Artikel zu ${escapeHtml(subcategory.titel)}">
            ${renderArticleCards(basePath, subcategory.artikel)}
          </ul>
        </div>
      </li>`;
    }).join("");
  }

  function renderTree(basePath, tree) {
    return `<ul class="wiki-tree-list wiki-tree-list-categories" aria-label="Wiki-Hauptkategorien">
      ${tree.map((category) => {
        const panelId = `wiki-category-${escapeHtml(category.id)}`;
        const buttonId = `wiki-anchor-category-${escapeHtml(category.id)}`;
        return `<li class="wiki-tree-item wiki-tree-item-category">
          <button type="button" class="category-link-card wiki-tree-card wiki-tree-card-toggle wiki-tree-card-category" id="${buttonId}" data-tree-toggle aria-expanded="false" aria-controls="${panelId}">
            <span class="wiki-tree-card-copy">
              <span class="category-card-title">${escapeHtml(category.titel)}</span>
              <span class="category-card-description">${escapeHtml(category.beschreibung || "")}</span>
            </span>
            <span class="wiki-tree-chevron" aria-hidden="true"></span>
          </button>
          <div class="wiki-tree-panel wiki-tree-panel-subcategories" id="${panelId}" hidden>
            <ul class="wiki-tree-list wiki-tree-list-subcategories" aria-label="Unterkategorien zu ${escapeHtml(category.titel)}">
              ${renderSubcategoryCards(basePath, category)}
            </ul>
          </div>
        </li>`;
      }).join("")}
    </ul>`;
  }

  function renderTocItems(items) {
    return items.map((item) => {
      return `<li><a class="wiki-overview-toc-link depth-${item.depth}" href="#${escapeHtml(item.id)}">${escapeHtml(item.label)}</a></li>`;
    }).join("");
  }

  function updateTableOfContents(root, tocList) {
    if (!tocList) {
      return;
    }

    const items = [];
    const categoryButtons = Array.from(root.querySelectorAll(".wiki-tree-item-category > [data-tree-toggle]"));

    categoryButtons.forEach((categoryButton) => {
      items.push({
        id: categoryButton.id,
        label: categoryButton.querySelector(".category-card-title")?.textContent || "",
        depth: 0
      });

      const categoryPanelId = categoryButton.getAttribute("aria-controls");
      const categoryPanel = categoryPanelId ? document.getElementById(categoryPanelId) : null;
      if (!categoryPanel || categoryPanel.hidden) {
        return;
      }

      const subcategoryButtons = Array.from(categoryPanel.querySelectorAll(".wiki-tree-item-subcategory > [data-tree-toggle]"));
      subcategoryButtons.forEach((subcategoryButton) => {
        items.push({
          id: subcategoryButton.id,
          label: subcategoryButton.querySelector(".category-card-title")?.textContent || "",
          depth: 1
        });

        const subcategoryPanelId = subcategoryButton.getAttribute("aria-controls");
        const subcategoryPanel = subcategoryPanelId ? document.getElementById(subcategoryPanelId) : null;
        if (!subcategoryPanel || subcategoryPanel.hidden) {
          return;
        }

        const articleLinks = Array.from(subcategoryPanel.querySelectorAll(".wiki-tree-item-article > a"));
        articleLinks.forEach((articleLink) => {
          items.push({
            id: articleLink.id,
            label: articleLink.querySelector(".wiki-tree-article-title")?.textContent || "",
            depth: 2
          });
        });
      });
    });

    tocList.innerHTML = renderTocItems(items);
  }

  function initCollapseControls(root, tocList) {
    const toggles = Array.from(root.querySelectorAll("[data-tree-toggle]"));
    toggles.forEach((toggle) => {
      toggle.addEventListener("click", () => {
        const panelId = toggle.getAttribute("aria-controls");
        const panel = panelId ? document.getElementById(panelId) : null;
        if (!panel) {
          return;
        }

        const isExpanded = toggle.getAttribute("aria-expanded") === "true";
        toggle.setAttribute("aria-expanded", isExpanded ? "false" : "true");
        toggle.classList.toggle("is-open", !isExpanded);
        panel.hidden = isExpanded;
        updateTableOfContents(root, tocList);
      });
    });

    const collapseAllButton = document.querySelector("[data-collapse-all]");
    if (!collapseAllButton) {
      return;
    }

    collapseAllButton.addEventListener("click", () => {
      toggles.forEach((toggle) => {
        toggle.setAttribute("aria-expanded", "false");
        toggle.classList.remove("is-open");
        const panelId = toggle.getAttribute("aria-controls");
        const panel = panelId ? document.getElementById(panelId) : null;
        if (panel) {
          panel.hidden = true;
        }
      });
      updateTableOfContents(root, tocList);
    });
  }

  function initBackToTop() {
    const button = document.querySelector("[data-back-to-top]");
    if (!button) {
      return;
    }

    const syncVisibility = () => {
      button.classList.toggle("is-visible", window.scrollY > 320);
    };

    button.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    window.addEventListener("scroll", syncVisibility, { passive: true });
    syncVisibility();
  }

  async function initWikiOverview() {
    const root = document.querySelector("[data-wiki-tree]");
    const tocList = document.querySelector("[data-wiki-toc-list]");
    if (!root) {
      return;
    }

    const basePath = normalizeBasePath(document.body?.dataset.basePath || ".");

    try {
      const [categoriesResponse, topicsResponse, structureResponse] = await Promise.all([
        fetch(href(basePath, "data/kategorien.json")),
        fetch(href(basePath, "data/themen.json")),
        fetch(href(basePath, "data/wiki-structure.json"))
      ]);

      if (!categoriesResponse.ok || !topicsResponse.ok || !structureResponse.ok) {
        throw new Error("Wiki-Daten konnten nicht geladen werden.");
      }

      const [categories, topics, wikiStructure] = await Promise.all([
        categoriesResponse.json(),
        topicsResponse.json(),
        structureResponse.json()
      ]);

      const generated = flattenGeneratedStructure(wikiStructure);
      const mergedCategories = mergeUniqueBy(
        [...categories, ...generated.categories],
        (entry) => String(entry.id || entry.titel || "").trim()
      );
      const mergedTopics = mergeUniqueBy(
        [...topics, ...generated.topics],
        (entry) => String(entry.id || entry.artikelPfad || "").trim()
      );

      const tree = buildTree(mergedCategories, mergedTopics);
      root.innerHTML = renderTree(basePath, tree);
      initCollapseControls(root, tocList);
      updateTableOfContents(root, tocList);
      initBackToTop();
    } catch (error) {
      root.innerHTML = '<p class="muted">Die Wiki-Uebersicht konnte gerade nicht geladen werden.</p>';
      if (tocList) {
        tocList.innerHTML = '<li><span class="muted">Inhalt konnte nicht geladen werden.</span></li>';
      }
      initBackToTop();
      console.error(error);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initWikiOverview, { once: true });
  } else {
    initWikiOverview();
  }
})();
