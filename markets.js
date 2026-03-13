(() => {
  "use strict";

  const PIE_COLORS = ["#38bdf8", "#7dd3fc", "#0ea5e9", "#22c55e", "#f59e0b", "#ef4444", "#a78bfa", "#f97316"];

  const MARKET_CONFIG = {
    commodities: {
      label: "Rohstoffe",
      singularLabel: "Rohstoff",
      indexPath: "data/markets/commodities/index.json",
      detailFolder: "data/markets/commodities",
      listPath: "rohstoffe.html",
      detailPath: "pages/rohstoff.html",
      valueLabel: "Referenzpreis",
      filters: [
        { key: "category", label: "Kategorie", allLabel: "Alle Kategorien" },
        { key: "regionFocus", label: "Herkunftsschwerpunkt", allLabel: "Alle Regionen" },
        { key: "currency", label: "Handelswaehrung", allLabel: "Alle Waehrungen" }
      ],
      sorts: [
        { value: "price", label: "Referenzpreis", defaultDirection: "desc", type: "number" },
        { value: "name", label: "Name", defaultDirection: "asc", type: "string" },
        { value: "category", label: "Kategorie", defaultDirection: "asc", type: "string" },
        { value: "regionFocus", label: "Herkunftsschwerpunkt", defaultDirection: "asc", type: "string" }
      ]
    },
    etfs: {
      label: "ETFs",
      singularLabel: "ETF",
      indexPath: "data/markets/etfs/index.json",
      detailFolder: "data/markets/etfs",
      listPath: "etfs.html",
      detailPath: "pages/etf.html",
      valueLabel: "Kurs",
      filters: [
        { key: "provider", label: "Anbieter", allLabel: "Alle Anbieter" },
        { key: "region", label: "Region", allLabel: "Alle Regionen" },
        { key: "assetClass", label: "Asset-Klasse", allLabel: "Alle Asset-Klassen" },
        { key: "distributionPolicy", label: "Ausschuettung", allLabel: "Alle Varianten" },
        { key: "replicationMethod", label: "Replikation", allLabel: "Alle Methoden" },
        { key: "currency", label: "Waehrung", allLabel: "Alle Waehrungen" }
      ],
      sorts: [
        { value: "aumBn", label: "Fondsvolumen", defaultDirection: "desc", type: "number" },
        { value: "ter", label: "TER", defaultDirection: "asc", type: "number" },
        { value: "name", label: "Name", defaultDirection: "asc", type: "string" },
        { value: "price", label: "Kurs", defaultDirection: "desc", type: "number" }
      ]
    },
    indices: {
      label: "Indizes",
      singularLabel: "Index",
      indexPath: "data/markets/indices/index.json",
      detailFolder: "data/markets/indices",
      listPath: "indizes.html",
      detailPath: "pages/index-detail.html",
      valueLabel: "Indexstand",
      filters: [
        { key: "region", label: "Region", allLabel: "Alle Regionen" },
        { key: "type", label: "Typ", allLabel: "Alle Typen" },
        { key: "componentBucket", label: "Anzahl Werte", allLabel: "Alle Groessen" },
        { key: "indexKind", label: "Indexart", allLabel: "Alle Indexarten" },
        { key: "currency", label: "Waehrung", allLabel: "Alle Waehrungen" }
      ],
      sorts: [
        { value: "level", label: "Indexstand", defaultDirection: "desc", type: "number" },
        { value: "componentCount", label: "Anzahl Werte", defaultDirection: "desc", type: "number" },
        { value: "name", label: "Name", defaultDirection: "asc", type: "string" },
        { value: "region", label: "Region", defaultDirection: "asc", type: "string" }
      ]
    },
    crypto: {
      label: "Kryptowaehrungen",
      singularLabel: "Kryptowaehrung",
      indexPath: "data/markets/crypto/index.json",
      detailFolder: "data/markets/crypto",
      listPath: "krypto.html",
      detailPath: "pages/krypto-detail.html",
      valueLabel: "Referenzkurs",
      filters: [
        { key: "category", label: "Kategorie", allLabel: "Alle Kategorien" },
        { key: "consensusMechanism", label: "Konsens", allLabel: "Alle Mechanismen" },
        { key: "launchYear", label: "Launch-Jahr", allLabel: "Alle Jahre" },
        { key: "network", label: "Netzwerk", allLabel: "Alle Netzwerke" },
        { key: "maxSupplyLabel", label: "Max Supply", allLabel: "Alle Varianten" }
      ],
      sorts: [
        { value: "marketCapBn", label: "Marktkapitalisierung", defaultDirection: "desc", type: "number" },
        { value: "price", label: "Kurs", defaultDirection: "desc", type: "number" },
        { value: "launchYear", label: "Launch-Jahr", defaultDirection: "desc", type: "number" },
        { value: "name", label: "Name", defaultDirection: "asc", type: "string" }
      ]
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
    container.innerHTML = "";
    const element = document.createElement("p");
    element.className = `status-message${isError ? " error" : ""}`;
    element.textContent = message;
    container.appendChild(element);
  }

  function formatNumber(value, options = {}) {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) {
      return "k. A.";
    }
    return new Intl.NumberFormat("de-DE", options).format(numericValue);
  }

  function formatPercent(value) {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) {
      return "k. A.";
    }
    return `${numericValue >= 0 ? "+" : ""}${formatNumber(numericValue, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %`;
  }

  function formatPercentValue(value) {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) {
      return "k. A.";
    }
    return `${formatNumber(numericValue, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %`;
  }

  function formatCurrency(value, currency, maximumFractionDigits = 2) {
    const numericValue = Number(value);
    const normalizedCurrency = normalizeText(currency);
    if (!Number.isFinite(numericValue) || !normalizedCurrency) {
      return "k. A.";
    }
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: normalizedCurrency,
      maximumFractionDigits,
      minimumFractionDigits: maximumFractionDigits === 0 ? 0 : 2
    }).format(numericValue);
  }

  function formatCompactBillions(value, currency) {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) {
      return "k. A.";
    }
    return `${formatNumber(numericValue, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} Mrd. ${normalizeText(currency)}`;
  }

  function formatSupply(value, symbol, allowNullLabel = false) {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) {
      return allowNullLabel ? "Kein festes Limit" : "k. A.";
    }
    return `${formatNumber(numericValue, { maximumFractionDigits: 0 })} ${normalizeText(symbol)}`.trim();
  }

  function formatIndexLevel(level, currency) {
    const numericValue = Number(level);
    if (!Number.isFinite(numericValue)) {
      return "k. A.";
    }
    return `${formatNumber(numericValue, { maximumFractionDigits: 2 })} Punkte${currency ? ` (${currency})` : ""}`;
  }

  function formatQuoteValue(quote) {
    if (!quote || typeof quote !== "object") {
      return "k. A.";
    }
    const value = Number(quote.value);
    if (!Number.isFinite(value)) {
      return "k. A.";
    }
    const currency = normalizeText(quote.currency);
    const unit = normalizeText(quote.unit);
    const label = currency ? formatCurrency(value, currency) : formatNumber(value, { maximumFractionDigits: 2 });
    return unit ? `${label} je ${unit}` : label;
  }

  function createPlainList(values) {
    const list = Array.isArray(values) ? values.map((entry) => normalizeText(entry)).filter(Boolean) : [];
    return list.length ? list.join(", ") : "k. A.";
  }

  function appendValue(container, value) {
    if (value instanceof Node) {
      container.appendChild(value);
      return;
    }
    container.textContent = normalizeText(value) || "k. A.";
  }

  function createDl(entries, className = "detail-facts") {
    const list = document.createElement("dl");
    list.className = className;
    entries.forEach((entry) => {
      const label = normalizeText(entry?.label);
      if (!label) {
        return;
      }
      const row = document.createElement("div");
      const dt = document.createElement("dt");
      const dd = document.createElement("dd");
      dt.textContent = label;
      appendValue(dd, entry?.value);
      row.append(dt, dd);
      list.appendChild(row);
    });
    return list;
  }

  function fillSelectOptions(select, values, defaultLabel) {
    if (!select) {
      return;
    }
    select.innerHTML = "";
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = defaultLabel;
    select.appendChild(defaultOption);
    values.forEach((value) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      select.appendChild(option);
    });
  }

  function getFilterValues(items, key) {
    return [...new Set(items.map((item) => normalizeText(item?.[key])).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, "de"));
  }

  function buildSearchText(item) {
    return normalizeForSearch(Object.values(item || {}).join(" "));
  }

  function getChangeTone(value) {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue) || numericValue === 0) {
      return "neutral";
    }
    return numericValue > 0 ? "positive" : "negative";
  }

  function createBadge(text) {
    const value = normalizeText(text);
    if (!value) {
      return null;
    }
    const badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = value;
    return badge;
  }

  function buildFilterFields(config, target) {
    target.innerHTML = "";
    return config.filters.map((filter) => {
      const field = document.createElement("div");
      field.className = "field";
      const label = document.createElement("label");
      const id = `market-filter-${filter.key}`;
      label.setAttribute("for", id);
      label.textContent = filter.label;
      const select = document.createElement("select");
      select.id = id;
      select.dataset.filterKey = filter.key;
      select.setAttribute("aria-label", `${config.label} nach ${filter.label} filtern`);
      field.append(label, select);
      target.appendChild(field);
      return { ...filter, select };
    });
  }

  function getListBadges(item, type) {
    if (type === "commodities") {
      return [item.category, item.regionFocus, item.currency];
    }
    if (type === "etfs") {
      return [item.assetClass, item.distributionPolicy, item.replicationMethod];
    }
    if (type === "indices") {
      return [item.region, item.indexKind, item.currency];
    }
    return [item.category, item.consensusMechanism, item.network];
  }

  function getCardFacts(item, type) {
    if (type === "commodities") {
      return [
        { label: "Symbol", value: item.symbol },
        { label: "Einheit", value: item.unit },
        { label: "Markt", value: item.referenceMarket }
      ];
    }
    if (type === "etfs") {
      return [
        { label: "Benchmark", value: item.benchmark },
        { label: "TER", value: formatPercentValue(item.ter) },
        { label: "Volumen", value: formatCompactBillions(item.aumBn, item.currency) }
      ];
    }
    if (type === "indices") {
      return [
        { label: "Typ", value: item.type },
        { label: "Werte", value: item.componentCount },
        { label: "Betreiber", value: item.operator }
      ];
    }
    return [
      { label: "Netzwerk", value: item.network },
      { label: "Konsens", value: item.consensusMechanism },
      { label: "Market Cap", value: formatCompactBillions(item.marketCapBn, "USD") }
    ];
  }

  function getListValue(item, type) {
    if (type === "indices") {
      return formatIndexLevel(item.level, item.currency);
    }
    return formatCurrency(item.price, item.currency);
  }

  function createMarketCard(item, config, type) {
    const article = document.createElement("article");
    article.className = "card market-list-card";
    const link = document.createElement("a");
    link.className = "market-list-card-link";
    link.href = href(`${config.detailPath}?id=${encodeURIComponent(item.id)}`);

    const visual = document.createElement("div");
    visual.className = "market-list-card-visual";
    const symbol = document.createElement("span");
    symbol.className = "market-list-card-symbol";
    symbol.textContent = normalizeText(item.symbol || item.ticker || item.code || "N/A");
    visual.appendChild(symbol);

    const content = document.createElement("div");
    content.className = "market-list-card-content";

    const titleRow = document.createElement("div");
    titleRow.className = "market-list-card-title-row";
    const title = document.createElement("h3");
    title.textContent = normalizeText(item.name) || "Eintrag";
    const badgeRow = document.createElement("div");
    badgeRow.className = "badge-row";
    getListBadges(item, type).filter(Boolean).forEach((entry) => {
      const badge = createBadge(entry);
      if (badge) {
        badgeRow.appendChild(badge);
      }
    });
    titleRow.append(title, badgeRow);

    const valueRow = document.createElement("div");
    valueRow.className = "market-list-card-value-row";
    const value = document.createElement("p");
    value.className = "market-list-card-value";
    value.textContent = getListValue(item, type);
    const change = document.createElement("p");
    const tone = getChangeTone(item.changePct);
    change.className = `market-list-card-change is-${tone}`;
    change.textContent = formatPercent(item.changePct);
    valueRow.append(value, change);

    const summary = document.createElement("p");
    summary.className = "market-list-card-summary";
    summary.textContent = normalizeText(item.summary) || "Keine Kurzbeschreibung vorhanden.";

    const facts = createDl(getCardFacts(item, type), "detail-facts market-list-card-facts");
    content.append(titleRow, valueRow, summary, facts);
    link.append(visual, content);
    article.appendChild(link);
    return article;
  }

  function createSection(title, contentNode, introText = "") {
    const section = document.createElement("section");
    section.className = "card section-space market-detail-section";
    const heading = document.createElement("h2");
    heading.textContent = title;
    section.appendChild(heading);
    if (introText) {
      const intro = document.createElement("p");
      intro.className = "market-detail-section-intro";
      intro.textContent = introText;
      section.appendChild(intro);
    }
    section.appendChild(contentNode);
    return section;
  }

  function renderPieDistribution(entry) {
    const wrapper = document.createElement("div");
    wrapper.className = "market-distribution-grid";
    const items = Array.isArray(entry?.items) ? entry.items.filter((item) => Number.isFinite(Number(item?.share))) : [];
    if (!items.length) {
      const empty = document.createElement("p");
      empty.className = "muted";
      empty.textContent = "Keine Verteilungsdaten vorhanden.";
      wrapper.appendChild(empty);
      return wrapper;
    }

    const chart = document.createElement("div");
    chart.className = "market-pie-chart";
    const stops = [];
    let offset = 0;
    items.forEach((item, index) => {
      const share = Number(item.share);
      const color = item.color || PIE_COLORS[index % PIE_COLORS.length];
      const start = offset;
      const end = offset + share;
      stops.push(`${color} ${start}% ${end}%`);
      offset = end;
    });
    chart.style.background = `conic-gradient(${stops.join(", ")})`;
    chart.setAttribute("aria-hidden", "true");
    wrapper.appendChild(chart);

    const list = document.createElement("ul");
    list.className = "market-distribution-list";
    items.forEach((item, index) => {
      const li = document.createElement("li");
      const swatch = document.createElement("span");
      swatch.className = "market-distribution-swatch";
      swatch.style.backgroundColor = item.color || PIE_COLORS[index % PIE_COLORS.length];
      const label = document.createElement("span");
      label.className = "market-distribution-label";
      label.textContent = normalizeText(item.label) || "Anteil";
      const value = document.createElement("strong");
      value.textContent = `${formatNumber(item.share, { maximumFractionDigits: 1 })} %`;
      li.append(swatch, label, value);
      list.appendChild(li);
    });
    wrapper.appendChild(list);
    return wrapper;
  }

  function renderAllocationBars(entry) {
    const wrapper = document.createElement("div");
    wrapper.className = "market-allocation-list";
    const items = Array.isArray(entry?.items) ? entry.items.filter((item) => Number.isFinite(Number(item?.share))) : [];
    if (!items.length) {
      const empty = document.createElement("p");
      empty.className = "muted";
      empty.textContent = "Keine Allokationsdaten vorhanden.";
      wrapper.appendChild(empty);
      return wrapper;
    }

    items.forEach((item, index) => {
      const row = document.createElement("div");
      row.className = "market-allocation-row";
      const head = document.createElement("div");
      head.className = "market-allocation-head";
      const label = document.createElement("span");
      label.textContent = normalizeText(item.label) || "Anteil";
      const value = document.createElement("strong");
      value.textContent = `${formatNumber(item.share, { maximumFractionDigits: 1 })} %`;
      head.append(label, value);
      const track = document.createElement("div");
      track.className = "market-allocation-track";
      const fill = document.createElement("span");
      fill.className = "market-allocation-fill";
      fill.style.width = `${Math.max(0, Math.min(100, Number(item.share)))}%`;
      fill.style.backgroundColor = item.color || PIE_COLORS[index % PIE_COLORS.length];
      track.appendChild(fill);
      row.append(head, track);
      wrapper.appendChild(row);
    });
    return wrapper;
  }

  function renderDistributions(entries) {
    const wrapper = document.createElement("div");
    wrapper.className = "market-distribution-sections";
    (entries || []).forEach((entry) => {
      const section = document.createElement("article");
      section.className = "market-distribution-card";
      const title = document.createElement("h3");
      title.textContent = normalizeText(entry?.title) || "Verteilung";
      section.appendChild(title);
      if (normalizeText(entry?.intro)) {
        const intro = document.createElement("p");
        intro.className = "market-detail-section-intro";
        intro.textContent = normalizeText(entry.intro);
        section.appendChild(intro);
      }
      section.appendChild(entry.kind === "pie" ? renderPieDistribution(entry) : renderAllocationBars(entry));
      wrapper.appendChild(section);
    });
    return wrapper;
  }

  function renderHighlights(items, title) {
    const list = document.createElement("ul");
    list.className = "link-list";
    (items || []).forEach((entry) => {
      const text = typeof entry === "string"
        ? normalizeText(entry)
        : `${normalizeText(entry?.name || entry?.label)}${entry?.weight ? ` (${entry.weight})` : ""}`;
      if (!text) {
        return;
      }
      const li = document.createElement("li");
      li.textContent = text;
      list.appendChild(li);
    });
    return createSection(title, list);
  }

  function getDetailBadges(detail, type) {
    return getListBadges(detail, type).filter(Boolean);
  }

  function getOverviewFacts(detail, type) {
    if (type === "commodities") {
      return [
        { label: "Kategorie", value: detail.category },
        { label: "Referenzmarkt", value: detail.quote?.referenceMarket },
        { label: "Maeinheit", value: detail.quote?.unit },
        { label: "Fokus", value: detail.regionFocus }
      ];
    }
    if (type === "etfs") {
      return [
        { label: "Anbieter", value: detail.provider },
        { label: "Benchmark", value: detail.benchmark },
        { label: "TER", value: formatPercentValue(detail.ter) },
        { label: "Volumen", value: formatCompactBillions(detail.fundVolumeBn, detail.currency) }
      ];
    }
    if (type === "indices") {
      return [
        { label: "Region", value: detail.region },
        { label: "Betreiber", value: detail.operator },
        { label: "Anzahl Werte", value: detail.componentCount },
        { label: "Berechnung", value: detail.calculationMethod }
      ];
    }
    return [
      { label: "Kategorie", value: detail.category },
      { label: "Netzwerk", value: detail.network },
      { label: "Launch", value: detail.launchYear },
      { label: "Use Case", value: detail.useCase }
    ];
  }

  function getFactsGroups(detail, type) {
    if (type === "commodities") {
      return [
        {
          title: "Marktdaten",
          items: [
            { label: "Symbol", value: detail.symbol },
            { label: "Preis", value: formatQuoteValue(detail.quote) },
            { label: "Handelswaehrung", value: detail.quote?.currency },
            { label: "Letzte Aenderung", value: formatPercent(detail.quote?.changePct) }
          ]
        },
        {
          title: "Herkunft und Nutzung",
          items: [
            { label: "Wichtige Ursprungslaender", value: createPlainList(detail.majorOrigins) },
            { label: "Einsatz", value: createPlainList(detail.mainUses) },
            { label: "Kontrakte", value: createPlainList(detail.contracts) },
            { label: "Datenstand", value: detail.lastUpdated }
          ]
        }
      ];
    }
    if (type === "etfs") {
      return [
        {
          title: "Stammdaten",
          items: [
            { label: "Ticker", value: detail.ticker },
            { label: "ISIN", value: detail.isin },
            { label: "WKN", value: detail.wkn },
            { label: "Anbieter", value: detail.provider }
          ]
        },
        {
          title: "Fondsprofil",
          items: [
            { label: "Benchmark", value: detail.benchmark },
            { label: "TER", value: formatPercentValue(detail.ter) },
            { label: "Fondsvolumen", value: formatCompactBillions(detail.fundVolumeBn, detail.currency) },
            { label: "Domizil", value: detail.domicile },
            { label: "Fondsart", value: detail.fundType },
            { label: "Ausschuettung", value: detail.distributionPolicy },
            { label: "Replikation", value: detail.replicationMethod },
            { label: "Waehrung", value: detail.currency }
          ]
        }
      ];
    }
    if (type === "indices") {
      return [
        {
          title: "Stammdaten",
          items: [
            { label: "Kuerzel", value: detail.ticker },
            { label: "Region", value: detail.region },
            { label: "Land", value: detail.country },
            { label: "Betreiber", value: detail.operator }
          ]
        },
        {
          title: "Indexprofil",
          items: [
            { label: "Indexstand", value: formatIndexLevel(detail.level, detail.currency) },
            { label: "Waehrung", value: detail.currency },
            { label: "Werte", value: detail.componentCount },
            { label: "Typ", value: detail.type },
            { label: "Indexart", value: detail.indexKind },
            { label: "Berechnung", value: detail.calculationMethod }
          ]
        }
      ];
    }
    return [
      {
        title: "Stammdaten",
        items: [
          { label: "Symbol", value: detail.symbol },
          { label: "Kategorie", value: detail.category },
          { label: "Netzwerk", value: detail.network },
          { label: "Konsens", value: detail.consensusMechanism }
        ]
      },
      {
        title: "Angebot und Markt",
        items: [
          { label: "Kurs", value: formatQuoteValue(detail.quote) },
          { label: "Marktkapitalisierung", value: formatCompactBillions(detail.marketCapBn, "USD") },
          { label: "Umlaufmenge", value: formatSupply(detail.circulatingSupply, detail.symbol) },
          { label: "Max Supply", value: formatSupply(detail.maxSupply, detail.symbol, true) },
          { label: "Launch-Jahr", value: detail.launchYear },
          { label: "Dominanz", value: detail.dominance }
        ]
      },
      {
        title: "Projekt",
        items: [
          { label: "Gruender / Organisation", value: detail.organization || createPlainList(detail.founders) },
          { label: "Use Case", value: detail.useCase }
        ]
      }
    ];
  }

  function getDistributions(detail, type) {
    if (type === "commodities") {
      return [{
        title: "Herkunftsverteilung",
        kind: "pie",
        intro: "Statische Herkunftsverteilung der wichtigsten Foerder- oder Ursprungsschwerpunkte.",
        items: detail.originDistribution || []
      }];
    }
    return detail.allocations || [];
  }

  function getHighlights(detail, type) {
    if (type === "commodities") {
      return detail.marketNotes || [];
    }
    if (type === "indices") {
      return detail.topComponents || [];
    }
    if (type === "etfs") {
      return detail.profilePoints || [];
    }
    return detail.highlights || [];
  }

  async function initMarketList() {
    const type = normalizeText(document.body?.dataset.marketType);
    const config = MARKET_CONFIG[type];
    const list = document.querySelector("#market-list");
    const searchInput = document.querySelector("#market-search");
    const filterFields = document.querySelector("#market-filter-fields");
    const sortSelect = document.querySelector("#market-sort");
    const sortDirectionSelect = document.querySelector("#market-sort-direction");
    const resetButton = document.querySelector("#market-reset-filters");
    const resultsCount = document.querySelector("#market-results-count");
    if (!config || !list || !filterFields || !sortSelect || !sortDirectionSelect) {
      return;
    }

    renderMessage(list, `${config.label} werden geladen ...`);

    const payload = await loadJson(config.indexPath);
    const items = Array.isArray(payload?.items) ? payload.items.map((item) => ({
      ...item,
      maxSupplyLabel: item.hasMaxSupply ? "Mit Limit" : "Ohne Limit",
      _searchable: buildSearchText(item)
    })) : [];

    const filters = buildFilterFields(config, filterFields);
    filters.forEach((filter) => {
      fillSelectOptions(filter.select, getFilterValues(items, filter.key), filter.allLabel);
    });

    sortSelect.innerHTML = "";
    config.sorts.forEach((entry) => {
      const option = document.createElement("option");
      option.value = entry.value;
      option.textContent = entry.label;
      sortSelect.appendChild(option);
    });
    sortSelect.value = config.sorts[0].value;
    sortDirectionSelect.value = config.sorts[0].defaultDirection || "asc";

    const applyFilters = () => {
      const query = normalizeForSearch(searchInput?.value || "");
      const activeSort = config.sorts.find((entry) => entry.value === sortSelect.value) || config.sorts[0];
      const direction = sortDirectionSelect.value === "desc" ? -1 : 1;
      const filtered = items.filter((item) => {
        if (query && !item._searchable.includes(query)) {
          return false;
        }
        return filters.every((filter) => {
          const selected = normalizeText(filter.select.value);
          return !selected || normalizeText(item?.[filter.key]) === selected;
        });
      }).sort((left, right) => {
        const a = left?.[activeSort.value];
        const b = right?.[activeSort.value];
        if (activeSort.type === "number") {
          const leftValue = Number(a);
          const rightValue = Number(b);
          return ((Number.isFinite(leftValue) ? leftValue : -Infinity) - (Number.isFinite(rightValue) ? rightValue : -Infinity)) * direction;
        }
        return String(a ?? "").localeCompare(String(b ?? ""), "de") * direction;
      });

      list.innerHTML = "";
      if (!filtered.length) {
        renderMessage(list, `Keine passenden ${config.label.toLowerCase()} gefunden.`);
      } else {
        filtered.forEach((item) => list.appendChild(createMarketCard(item, config, type)));
      }
      if (resultsCount) {
        resultsCount.textContent = `${filtered.length} ${config.label} gefunden`;
      }
    };

    const syncDirectionWithSort = () => {
      const activeSort = config.sorts.find((entry) => entry.value === sortSelect.value);
      if (activeSort && !sortDirectionSelect.dataset.userChanged) {
        sortDirectionSelect.value = activeSort.defaultDirection || "asc";
      }
      applyFilters();
    };

    searchInput?.addEventListener("input", applyFilters);
    filters.forEach((filter) => filter.select.addEventListener("change", applyFilters));
    sortSelect.addEventListener("change", syncDirectionWithSort);
    sortDirectionSelect.addEventListener("change", () => {
      sortDirectionSelect.dataset.userChanged = "true";
      applyFilters();
    });
    resetButton?.addEventListener("click", () => {
      if (searchInput) {
        searchInput.value = "";
      }
      filters.forEach((filter) => {
        filter.select.value = "";
      });
      sortSelect.value = config.sorts[0].value;
      delete sortDirectionSelect.dataset.userChanged;
      sortDirectionSelect.value = config.sorts[0].defaultDirection || "asc";
      applyFilters();
    });

    applyFilters();
  }

  async function initMarketDetail() {
    const type = normalizeText(document.body?.dataset.marketType);
    const config = MARKET_CONFIG[type];
    const shell = document.querySelector("#market-detail");
    if (!config || !shell) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const id = normalizeText(params.get("id"));
    if (!id) {
      renderMessage(shell, `Kein ${config.singularLabel.toLowerCase()} uebergeben. Bitte waehlen Sie einen Eintrag aus der Uebersicht aus.`, true);
      return;
    }

    renderMessage(shell, "Daten werden geladen ...");

    const indexPayload = await loadJson(config.indexPath);
    const indexItems = Array.isArray(indexPayload?.items) ? indexPayload.items : [];
    const summary = indexItems.find((entry) => normalizeText(entry?.id) === id);
    if (!summary || !normalizeText(summary.file)) {
      renderMessage(shell, "Der angeforderte Eintrag wurde nicht gefunden.", true);
      return;
    }

    const detail = await loadJson(`${config.detailFolder}/${summary.file}`);
    shell.innerHTML = "";

    const backLink = document.createElement("a");
    backLink.className = "back-link";
    backLink.href = href(config.listPath);
    backLink.textContent = `\u2190 Zur ${config.label}-Uebersicht`;

    const header = document.createElement("section");
    header.className = "card market-detail-header";
    const main = document.createElement("div");
    main.className = "market-detail-main";
    const title = document.createElement("h1");
    title.textContent = normalizeText(detail.name) || "Markteintrag";
    const symbol = document.createElement("p");
    symbol.className = "meta-pill";
    symbol.textContent = normalizeText(detail.symbol || detail.ticker || detail.code || "Profil");
    const lead = document.createElement("p");
    lead.className = "lead";
    lead.textContent = normalizeText(detail.summary || detail.description);
    const badges = document.createElement("div");
    badges.className = "badge-row";
    getDetailBadges(detail, type).forEach((entry) => {
      const badge = createBadge(entry);
      if (badge) {
        badges.appendChild(badge);
      }
    });
    main.append(title, symbol, lead, badges);

    const snapshot = document.createElement("aside");
    snapshot.className = "market-detail-snapshot";
    const snapshotHeading = document.createElement("h2");
    snapshotHeading.textContent = config.valueLabel;
    const snapshotValue = document.createElement("p");
    snapshotValue.className = "market-detail-snapshot-value";
    snapshotValue.textContent = type === "indices"
      ? formatIndexLevel(detail.level, detail.currency)
      : formatQuoteValue(detail.quote);
    const snapshotMeta = createDl([
      { label: "Aenderung", value: formatPercent(detail.quote?.changePct ?? detail.changePct) },
      { label: "Datenstand", value: detail.lastUpdated },
      { label: "Referenz", value: detail.quote?.referenceMarket || detail.operator || detail.network }
    ], "detail-facts market-detail-snapshot-facts");
    snapshot.append(snapshotHeading, snapshotValue, snapshotMeta);
    header.append(main, snapshot);

    const overviewGrid = document.createElement("div");
    overviewGrid.className = "market-detail-grid";
    overviewGrid.append(
      createSection("Ueberblick", createDl(getOverviewFacts(detail, type))),
      createSection("Beschreibung", (() => {
        const body = document.createElement("div");
        body.className = "company-text-content";
        const paragraph = document.createElement("p");
        paragraph.textContent = normalizeText(detail.description) || "Keine Beschreibung vorhanden.";
        body.appendChild(paragraph);
        return body;
      })())
    );

    const factsWrapper = document.createElement("div");
    factsWrapper.className = "market-detail-grid";
    getFactsGroups(detail, type).forEach((group) => {
      const card = document.createElement("article");
      card.className = "card market-detail-facts-card";
      const title = document.createElement("h2");
      title.textContent = normalizeText(group.title) || "Details";
      card.append(title, createDl(group.items));
      factsWrapper.appendChild(card);
    });

    shell.append(backLink, header, overviewGrid, factsWrapper);

    const distributions = getDistributions(detail, type).filter((entry) => Array.isArray(entry?.items) && entry.items.length);
    if (distributions.length) {
      shell.appendChild(createSection("Struktur und Verteilung", renderDistributions(distributions)));
    }

    const highlights = getHighlights(detail, type);
    if (highlights.length) {
      shell.appendChild(renderHighlights(highlights, type === "indices" ? "Top-Komponenten" : "Einordnung"));
    }

    document.title = `${normalizeText(detail.name) || "Markteintrag"} | MarktWiki`;
    const description = document.querySelector('meta[name="description"]');
    if (description) {
      description.setAttribute("content", normalizeText(detail.summary || detail.description).slice(0, 155));
    }
  }

  async function init() {
    const page = normalizeText(document.body?.dataset.page);
    try {
      if (page === "market-list") {
        await initMarketList();
      }
      if (page === "market-detail") {
        await initMarketDetail();
      }
    } catch (error) {
      console.error(error);
      const target = document.querySelector("[data-error-target]");
      renderMessage(target, "Die Marktdaten konnten nicht geladen werden.", true);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
