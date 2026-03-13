(() => {
  "use strict";

  const DATA_PATH = "./data/glossar.json";
  const listRoot = document.querySelector("#glossary-list");
  const letterNav = document.querySelector("#glossary-letter-nav");
  const searchInput = document.querySelector("#glossary-search");
  const status = document.querySelector("#glossary-status");

  function normalizeText(value) {
    return String(value || "").trim();
  }

  function normalizeSearch(value) {
    return normalizeText(value)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function getLetter(value) {
    const normalized = normalizeText(value);
    if (!normalized) {
      return "#";
    }

    const firstChar = normalized[0]
      .toLocaleUpperCase("de-DE")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    return /[A-Z]/.test(firstChar) ? firstChar : "#";
  }

  function formatCount(count) {
    return `${count} ${count === 1 ? "Begriff" : "Begriffe"}`;
  }

  function buildSearchableEntry(entry) {
    const related = Array.isArray(entry.verwandteBegriffe) ? entry.verwandteBegriffe.join(" ") : "";
    return normalizeSearch([
      entry.begriff,
      entry.definition,
      entry.kategorie,
      related
    ].join(" "));
  }

  function sortEntries(entries) {
    return [...entries].sort((a, b) => {
      return normalizeText(a.begriff).localeCompare(normalizeText(b.begriff), "de", { sensitivity: "base" });
    });
  }

  function groupEntries(entries) {
    const groups = new Map();

    entries.forEach((entry) => {
      const letter = getLetter(entry.begriff);
      if (!groups.has(letter)) {
        groups.set(letter, []);
      }
      groups.get(letter).push(entry);
    });

    return Array.from(groups.entries())
      .sort((a, b) => a[0].localeCompare(b[0], "de", { sensitivity: "base" }))
      .map(([letter, items]) => ({ letter, items }));
  }

  function renderLetterNav(groups) {
    if (!letterNav) {
      return;
    }

    letterNav.innerHTML = groups.map((group) => {
      const anchor = `#glossary-letter-${group.letter.toLowerCase()}`;
      return `<a class="badge" href="${anchor}">${escapeHtml(group.letter)}</a>`;
    }).join("");
  }

  function renderGroups(entries, query) {
    if (!listRoot || !status) {
      return;
    }

    const filteredEntries = entries.filter((entry) => {
      if (!query) {
        return true;
      }
      return entry.searchable.includes(query);
    });

    const groups = groupEntries(filteredEntries);

    if (!groups.length) {
      renderLetterNav([]);
      listRoot.innerHTML = `
        <section class="card glossary-empty-state">
          <h2>Keine Begriffe gefunden</h2>
          <p>Bitte passe den Suchbegriff an oder loesche den Filter.</p>
        </section>
      `;
      status.textContent = "0 Begriffe gefunden.";
      return;
    }

    renderLetterNav(groups);
    status.textContent = `${formatCount(filteredEntries.length)} gefunden.`;
    listRoot.innerHTML = groups.map((group) => {
      const itemsMarkup = group.items.map((entry, index) => {
        const panelId = `glossary-panel-${group.letter.toLowerCase()}-${index}`;
        const hasCategory = normalizeText(entry.kategorie);
        const related = Array.isArray(entry.verwandteBegriffe) ? entry.verwandteBegriffe.filter(Boolean) : [];

        return `<li class="glossary-term-item">
          <button
            type="button"
            class="glossary-term-button"
            data-glossary-toggle
            aria-expanded="false"
            aria-controls="${panelId}">
            <span class="glossary-term-name">${escapeHtml(entry.begriff)}</span>
            <span class="glossary-term-indicator" aria-hidden="true">+</span>
          </button>
          <div id="${panelId}" class="card glossary-definition-card" hidden>
            <p>${escapeHtml(entry.definition)}</p>
            ${hasCategory ? `<p class="glossary-meta"><strong>Kategorie:</strong> ${escapeHtml(entry.kategorie)}</p>` : ""}
            ${related.length ? `<p class="glossary-meta"><strong>Verwandte Begriffe:</strong> ${escapeHtml(related.join(", "))}</p>` : ""}
          </div>
        </li>`;
      }).join("");

      return `<section class="card glossary-group" id="glossary-letter-${group.letter.toLowerCase()}">
        <div class="section-head glossary-group-head">
          <h2>${escapeHtml(group.letter)}</h2>
          <p class="muted">${formatCount(group.items.length)}</p>
        </div>
        <ul class="glossary-term-list" aria-label="Begriffe mit ${escapeHtml(group.letter)}">
          ${itemsMarkup}
        </ul>
      </section>`;
    }).join("");
  }

  function initToggles() {
    if (!listRoot) {
      return;
    }

    listRoot.addEventListener("click", (event) => {
      const button = event.target instanceof Element ? event.target.closest("[data-glossary-toggle]") : null;
      if (!(button instanceof HTMLButtonElement)) {
        return;
      }

      const panelId = button.getAttribute("aria-controls");
      const panel = panelId ? document.getElementById(panelId) : null;
      if (!panel) {
        return;
      }

      const expanded = button.getAttribute("aria-expanded") === "true";
      button.setAttribute("aria-expanded", expanded ? "false" : "true");
      panel.hidden = expanded;

      const indicator = button.querySelector(".glossary-term-indicator");
      if (indicator) {
        indicator.textContent = expanded ? "+" : "-";
      }
    });
  }

  async function initGlossary() {
    if (!listRoot || !searchInput || !status) {
      return;
    }

    try {
      const response = await fetch(DATA_PATH);
      if (!response.ok) {
        throw new Error("Glossardaten konnten nicht geladen werden.");
      }

      const rawEntries = await response.json();
      const entries = sortEntries(rawEntries)
        .filter((entry) => normalizeText(entry.begriff) && normalizeText(entry.definition))
        .map((entry) => ({
          begriff: normalizeText(entry.begriff),
          definition: normalizeText(entry.definition),
          kategorie: normalizeText(entry.kategorie),
          verwandteBegriffe: Array.isArray(entry.verwandteBegriffe) ? entry.verwandteBegriffe.map((item) => normalizeText(item)).filter(Boolean) : [],
          searchable: buildSearchableEntry(entry)
        }));

      renderGroups(entries, "");

      searchInput.addEventListener("input", () => {
        renderGroups(entries, normalizeSearch(searchInput.value));
      });

      initToggles();
    } catch (error) {
      console.error(error);
      if (letterNav) {
        letterNav.innerHTML = "";
      }
      status.textContent = "Glossar konnte nicht geladen werden.";
      listRoot.innerHTML = `
        <section class="card glossary-empty-state">
          <h2>Glossar derzeit nicht verfuegbar</h2>
          <p>Bitte versuche es spaeter noch einmal.</p>
        </section>
      `;
    }
  }

  initGlossary();
})();
