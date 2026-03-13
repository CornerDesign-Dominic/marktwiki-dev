(() => {
  "use strict";

  const CATEGORY_CONFIG = {
    aktien: {
      title: "Aktien",
      page: "kurse-aktien.html",
      dataPath: "data/quotes/aktien.json",
      type: "currency"
    },
    etfs: {
      title: "ETFs",
      page: "kurse-etfs.html",
      dataPath: "data/quotes/etfs.json",
      type: "currency"
    },
    indizes: {
      title: "Indizes",
      page: "kurse-indizes.html",
      dataPath: "data/quotes/indizes.json",
      type: "points"
    },
    krypto: {
      title: "Krypto",
      page: "kurse-krypto.html",
      dataPath: "data/quotes/krypto.json",
      type: "currency"
    },
    waehrungen: {
      title: "Währungen",
      page: "kurse-waehrungen.html",
      dataPath: "data/quotes/waehrungen.json",
      type: "rate"
    },
    rohstoffe: {
      title: "Rohstoffe",
      page: "kurse-rohstoffe.html",
      dataPath: "data/quotes/rohstoffe.json",
      type: "unit-price"
    }
  };

  function normalizeText(value) {
    return String(value ?? "").trim();
  }

  function normalizeBasePath(value) {
    const trimmed = normalizeText(value);
    if (!trimmed || trimmed === "./") {
      return ".";
    }
    return trimmed.replace(/\/+$/, "") || ".";
  }

  function href(path) {
    const basePath = normalizeBasePath(document.body?.dataset.basePath || ".");
    return basePath === "." ? path : `${basePath}/${path}`;
  }

  async function loadJson(path) {
    const response = await fetch(href(path));
    if (!response.ok) {
      throw new Error(`Datei konnte nicht geladen werden: ${path}`);
    }
    return response.json();
  }

  function formatNumber(value, maximumFractionDigits = 2, minimumFractionDigits = 2) {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) {
      return "k. A.";
    }

    return new Intl.NumberFormat("de-DE", {
      minimumFractionDigits,
      maximumFractionDigits
    }).format(numericValue);
  }

  function formatDate(value) {
    const input = normalizeText(value);
    if (!input) {
      return "k. A.";
    }

    const date = new Date(`${input}T00:00:00`);
    if (Number.isNaN(date.getTime())) {
      return input;
    }

    return new Intl.DateTimeFormat("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }).format(date);
  }

  function formatPercent(value) {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) {
      return "k. A.";
    }

    return `${numericValue > 0 ? "+" : numericValue < 0 ? "" : ""}${formatNumber(numericValue, 2, 2)} %`;
  }

  function getChangeClass(value) {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue) || numericValue === 0) {
      return "neutral";
    }
    return numericValue > 0 ? "positive" : "negative";
  }

  function formatQuoteValue(item, field, type) {
    const numericValue = Number(item?.[field]);
    if (!Number.isFinite(numericValue)) {
      return "k. A.";
    }

    if (type === "points") {
      return `${formatNumber(numericValue, 2, 2)} Punkte`;
    }

    if (type === "rate") {
      return formatNumber(numericValue, 4, 4);
    }

    if (type === "unit-price") {
      const currency = normalizeText(item?.currency);
      const unit = normalizeText(item?.unit);
      return [formatNumber(numericValue, 2, 2), currency, unit ? `/ ${unit}` : ""].filter(Boolean).join(" ").trim();
    }

    const currency = normalizeText(item?.currency);
    return currency ? `${formatNumber(numericValue, 2, 2)} ${currency}` : formatNumber(numericValue, 2, 2);
  }

  function normalizeForSearch(value) {
    return normalizeText(value)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function renderMessage(container, message, isError = false) {
    if (!container) {
      return;
    }

    container.innerHTML = `<p class="status-message${isError ? " error" : ""}">${message}</p>`;
  }

  function renderOverviewCard(categoryKey, items) {
    const config = CATEGORY_CONFIG[categoryKey];
    if (!config) {
      return "";
    }

    const compactItems = items.slice(0, 5);
    const rows = compactItems.map((item) => {
      const changeClass = getChangeClass(item.changePct);

      return `<div class="quote-overview-row">
        <strong class="quote-overview-name">${normalizeText(item.name) || "k. A."}</strong>
        <span class="quote-overview-symbol">${normalizeText(item.symbol) || "-"}</span>
        <span class="quote-overview-value">${formatQuoteValue(item, "open", config.type)}</span>
        <span class="quote-overview-value">${formatQuoteValue(item, "close", config.type)}</span>
        <span class="quote-overview-value quote-change ${changeClass}">${formatPercent(item.changePct)}</span>
      </div>`;
    }).join("");

    return `<section class="card quote-overview-card">
      <div class="quote-overview-card-head">
        <h2><a class="quote-overview-link" href="${href(config.page)}">${config.title}</a></h2>
      </div>
      <div class="quote-overview-list" role="table" aria-label="${config.title}">
        <div class="quote-overview-header" role="row">
          <span>Wert</span>
          <span>Symbol</span>
          <span>Start</span>
          <span>Schluss</span>
          <span>Veraenderung</span>
        </div>
        ${rows}
      </div>
    </section>`;
  }

  async function initOverviewPage() {
    const container = document.querySelector("#quotes-overview");
    if (!container) {
      return;
    }

    try {
      const entries = await Promise.all(Object.entries(CATEGORY_CONFIG).map(async ([categoryKey, config]) => {
        const data = await loadJson(config.dataPath);
        return {
          categoryKey,
          items: Array.isArray(data.items) ? data.items : []
        };
      }));

      container.innerHTML = entries.map((entry) => renderOverviewCard(entry.categoryKey, entry.items)).join("");
    } catch (error) {
      renderMessage(container, "Die Kursuebersicht konnte nicht geladen werden.", true);
    }
  }

  function renderTableRows(items, config) {
    if (!items.length) {
      return `<tr><td colspan="6"><p class="quote-empty-state">Keine Kurse fuer die aktuelle Auswahl gefunden.</p></td></tr>`;
    }

    return items.map((item) => {
      const changeClass = getChangeClass(item.changePct);
      const instrumentMeta = [normalizeText(item.symbol), normalizeText(item.market)].filter(Boolean).join(" - ");

      return `<tr>
        <td>
          <div class="quote-instrument">
            <strong>${normalizeText(item.name) || "k. A."}</strong>
            <span>${instrumentMeta || "Lokaler Kurseintrag"}</span>
          </div>
        </td>
        <td class="numeric-cell">${formatQuoteValue(item, "open", config.type)}</td>
        <td class="numeric-cell">${formatQuoteValue(item, "close", config.type)}</td>
        <td class="numeric-cell">${formatQuoteValue(item, "high", config.type)}</td>
        <td class="numeric-cell">${formatQuoteValue(item, "low", config.type)}</td>
        <td class="numeric-cell"><span class="quote-change ${changeClass}">${formatPercent(item.changePct)}</span></td>
      </tr>`;
    }).join("");
  }

  async function initCategoryPage() {
    const categoryKey = normalizeText(document.body?.dataset.quoteCategory).toLowerCase();
    if (!categoryKey) {
      return;
    }

    const config = CATEGORY_CONFIG[categoryKey];
    const tableBody = document.querySelector("#quotes-table-body");
    const resultCount = document.querySelector("#quotes-results-count");
    const updatedNote = document.querySelector("#quotes-category-updated");
    const searchInput = document.querySelector("#quotes-search");
    if (!config || !tableBody || !resultCount || !updatedNote) {
      return;
    }

    try {
      const data = await loadJson(config.dataPath);
      const items = Array.isArray(data.items) ? data.items : [];

      const applyFilter = () => {
        const query = normalizeForSearch(searchInput?.value || "");
        const filteredItems = items.filter((item) => {
          if (!query) {
            return true;
          }

          const haystack = normalizeForSearch([
            item.name,
            item.symbol,
            item.market,
            item.currency,
            item.unit
          ].join(" "));

          return haystack.includes(query);
        });

        tableBody.innerHTML = renderTableRows(filteredItems, config);
        resultCount.textContent = `${filteredItems.length} Kurse angezeigt.`;
      };

      updatedNote.textContent = `Datenstand: ${formatDate(data.updatedAt)}. Quelle: ${normalizeText(data.source) || "Lokale JSON-Datei"}.`;
      applyFilter();

      if (searchInput) {
        searchInput.addEventListener("input", applyFilter);
      }
    } catch (error) {
      const tableShell = tableBody.closest(".quotes-table-shell");
      renderMessage(tableShell, "Die Kursdaten konnten nicht geladen werden.", true);
      resultCount.textContent = "";
      updatedNote.textContent = "";
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    initOverviewPage();
    initCategoryPage();
  });
})();
