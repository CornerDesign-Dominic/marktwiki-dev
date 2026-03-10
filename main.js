(() => {
  "use strict";

  const page = document.body.dataset.page || "";
  const basePath = document.body.dataset.basePath || ".";

  const DATA_FILES = {
    categories: "kategorien.json",
    topics: "themen.json",
    companiesIndex: "companies/index.json"
  };

  async function loadJson(path) {
    const cleanPath = String(path || "").replace(/^\/+/, "");
    const response = await fetch(`${basePath}/${cleanPath}`);
    if (!response.ok) {
      throw new Error(`Daten konnten nicht geladen werden: ${cleanPath}`);
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

  function normalizeForMatch(value) {
    return normalizeText(value)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function toNumber(value) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string") {
      const normalized = value.replace(/\s+/g, "").replace(",", ".");
      const parsed = Number.parseFloat(normalized);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }

    return null;
  }

  function formatNumber(value, options = {}) {
    const number = toNumber(value);
    if (number === null) {
      return "k. A.";
    }

    return new Intl.NumberFormat("de-DE", options).format(number);
  }

  function formatCurrency(value, currency, options = {}) {
    const number = toNumber(value);
    const currencyCode = normalizeText(currency).toUpperCase();

    if (number === null) {
      return "k. A.";
    }

    if (!currencyCode) {
      return formatNumber(number, { maximumFractionDigits: 2 });
    }

    try {
      return new Intl.NumberFormat("de-DE", {
        style: "currency",
        currency: currencyCode,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        ...options
      }).format(number);
    } catch (_) {
      return `${formatNumber(number, { maximumFractionDigits: 2 })} ${currencyCode}`;
    }
  }

  function formatPrice(value) {
    const number = toNumber(value);
    if (number === null) {
      return "k. A.";
    }
    return formatNumber(number, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function formatSignedCurrency(value, currency) {
    const number = toNumber(value);
    const currencyCode = normalizeText(currency).toUpperCase();

    if (number === null) {
      return "k. A.";
    }

    if (!currencyCode) {
      return formatNumber(number, { maximumFractionDigits: 2, signDisplay: "always" });
    }

    try {
      return new Intl.NumberFormat("de-DE", {
        style: "currency",
        currency: currencyCode,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        signDisplay: "always"
      }).format(number);
    } catch (_) {
      return `${formatNumber(number, { maximumFractionDigits: 2, signDisplay: "always" })} ${currencyCode}`;
    }
  }

  function formatPercent(value) {
    const number = toNumber(value);
    if (number === null) {
      return "k. A.";
    }

    return `${formatNumber(number, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      signDisplay: "always"
    })} %`;
  }

  function formatCompactNumber(value) {
    const number = toNumber(value);
    if (number === null) {
      return "k. A.";
    }

    return formatNumber(number, {
      notation: "compact",
      compactDisplay: "short",
      maximumFractionDigits: 2
    });
  }

  function formatCompactCurrency(value, currency) {
    const number = toNumber(value);
    const currencyCode = normalizeText(currency).toUpperCase();

    if (number === null) {
      return "k. A.";
    }

    if (!currencyCode) {
      return formatCompactNumber(number);
    }

    try {
      return new Intl.NumberFormat("de-DE", {
        style: "currency",
        currency: currencyCode,
        notation: "compact",
        compactDisplay: "short",
        maximumFractionDigits: 2
      }).format(number);
    } catch (_) {
      return `${formatCompactNumber(number)} ${currencyCode}`;
    }
  }

  function formatDate(value) {
    const dateText = normalizeText(value);
    if (!dateText) {
      return "k. A.";
    }

    const date = new Date(dateText);
    if (Number.isNaN(date.getTime())) {
      return dateText;
    }

    return new Intl.DateTimeFormat("de-DE", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(date);
  }

  function formatBoolean(value) {
    if (typeof value !== "boolean") {
      return "k. A.";
    }
    return value ? "Ja" : "Nein";
  }

  function shortenText(value, maxLength = 190) {
    const text = normalizeText(value);
    if (!text) {
      return "Keine Beschreibung vorhanden.";
    }

    if (text.length <= maxLength) {
      return text;
    }

    return `${text.slice(0, maxLength - 1).trimEnd()}...`;
  }

  function composeLocation(company) {
    const parts = [normalizeText(company.city), normalizeText(company.state), normalizeText(company.country)].filter(Boolean);
    return parts.length ? parts.join(", ") : "k. A.";
  }

  function getChangeTone(value) {
    const number = toNumber(value);
    if (number === null || number === 0) {
      return "neutral";
    }
    return number > 0 ? "positive" : "negative";
  }

  function appendFact(dl, label, value) {
    const row = document.createElement("div");
    const term = document.createElement("dt");
    const detail = document.createElement("dd");

    term.textContent = label;

    if (value instanceof Node) {
      detail.appendChild(value);
    } else {
      detail.textContent = normalizeText(value) || "k. A.";
    }

    row.append(term, detail);
    dl.appendChild(row);
  }

  function createDataSection(title, items) {
    const section = document.createElement("section");
    section.className = "card company-info-card";

    const heading = document.createElement("h2");
    heading.className = "company-info-title";
    heading.textContent = title;

    const list = document.createElement("dl");
    list.className = "stock-meta detail-facts";

    items.forEach((item) => {
      appendFact(list, item.label, item.value);
    });

    section.append(heading, list);
    return section;
  }

  function createStatusPill(value) {
    const pill = document.createElement("span");
    pill.className = "company-status-pill";

    if (typeof value === "boolean") {
      pill.classList.add(value ? "is-yes" : "is-no");
      pill.textContent = value ? "Ja" : "Nein";
      return pill;
    }

    pill.classList.add("is-unknown");
    pill.textContent = "k. A.";
    return pill;
  }

  function normalizeCompanySymbol(value) {
    return normalizeText(value).toUpperCase();
  }

  async function loadCompanyIndex() {
    const payload = await loadJson(`data/${DATA_FILES.companiesIndex}`);

    if (Array.isArray(payload)) {
      return payload;
    }

    if (payload && Array.isArray(payload.companies)) {
      return payload.companies;
    }

    throw new Error("Ungueltige Unternehmensindex-Struktur.");
  }

  function findCompanyBySymbol(companies, symbol) {
    return companies.find((entry) => normalizeCompanySymbol(entry.symbol) === normalizeCompanySymbol(symbol));
  }

  function createCompanySearchText(company) {
    return normalizeForMatch([
      company.companyName,
      company.symbol,
      company.ceo,
      company.sector,
      company.industry,
      company.country,
      company.description
    ].map((value) => normalizeText(value)).join(" "));
  }

  function getFilterValues(companies, field) {
    const values = companies.map((company) => normalizeText(company[field])).filter(Boolean);
    return [...new Set(values)].sort((a, b) => a.localeCompare(b, "de"));
  }

  function fillSelectOptions(select, values, allLabel) {
    if (!select) {
      return;
    }

    select.innerHTML = "";

    const allOption = document.createElement("option");
    allOption.value = "";
    allOption.textContent = allLabel;
    select.appendChild(allOption);

    values.forEach((value) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      select.appendChild(option);
    });
  }

  function renderStockCards(list, companies) {
    list.innerHTML = "";

    if (!companies.length) {
      renderMessage(list, "Keine Unternehmen fuer diese Suche/Filter gefunden.");
      return;
    }

    companies.forEach((company) => {
      list.appendChild(createStockCard(company));
    });
  }

  function createStockCard(company) {
    const symbol = normalizeCompanySymbol(company.symbol);
    const companyName = normalizeText(company.companyName) || symbol || "Unbekanntes Unternehmen";
    const currencyCode = normalizeText(company.currency).toUpperCase() || "k. A.";

    const card = document.createElement("a");
    card.className = "card stock-card stock-card-link";
    card.href = `${basePath}/pages/unternehmen.html?symbol=${encodeURIComponent(symbol)}`;
    card.setAttribute("aria-label", `${companyName} (${symbol}) - zur Unternehmensseite`);

    const visual = document.createElement("div");
    visual.className = "stock-logo-box";

    const hasImage = normalizeText(company.image) && company.defaultImage !== true;
    if (hasImage) {
      const logo = document.createElement("img");
      logo.className = "stock-logo";
      logo.src = company.image;
      logo.alt = `${companyName} Logo`;
      logo.loading = "lazy";
      visual.appendChild(logo);
    } else {
      const fallback = document.createElement("span");
      fallback.className = "stock-logo-fallback";
      fallback.textContent = symbol || "N/A";
      visual.appendChild(fallback);
    }

    const details = document.createElement("div");
    details.className = "stock-details";

    const title = document.createElement("h2");
    title.textContent = companyName;

    const symbolLine = document.createElement("p");
    symbolLine.className = "stock-symbol-line";
    symbolLine.textContent = `Symbol: ${symbol || "k. A."}`;

    const priceLine = document.createElement("p");
    priceLine.className = "stock-price-line";
    priceLine.textContent = `Kurs: ${formatPrice(company.price)} ${currencyCode}`;

    const facts = document.createElement("dl");
    facts.className = "stock-meta stock-facts stock-facts-compact";

    appendFact(facts, "CEO", company.ceo);
    appendFact(facts, "Sektor", company.sector);
    appendFact(facts, "Branche", company.industry);
    appendFact(facts, "Land", company.country);

    const teaser = document.createElement("p");
    teaser.className = "stock-context";
    teaser.textContent = shortenText(company.description, 110);

    details.append(title, symbolLine, priceLine, facts, teaser);
    card.append(visual, details);

    return card;
  }

  async function initStocks() {
    const list = document.querySelector("#stocks-list");
    const searchInput = document.querySelector("#stocks-search");
    const countryFilter = document.querySelector("#stocks-country-filter");
    const currencyFilter = document.querySelector("#stocks-currency-filter");
    const sectorFilter = document.querySelector("#stocks-sector-filter");
    const resultsCount = document.querySelector("#stocks-results-count");

    if (!list) {
      return;
    }

    renderMessage(list, "Unternehmen werden geladen ...");

    // Index enthaelt Vorschauwerte, damit die Uebersicht in einem Request ladbar bleibt.
    const companies = await loadCompanyIndex();

    if (!companies.length) {
      renderMessage(list, "Derzeit sind noch keine Unternehmen verfuegbar.");
      if (resultsCount) {
        resultsCount.textContent = "0 Unternehmen gefunden";
      }
      return;
    }

    fillSelectOptions(countryFilter, getFilterValues(companies, "country"), "Alle Laender");
    fillSelectOptions(currencyFilter, getFilterValues(companies, "currency"), "Alle Waehrungen");
    fillSelectOptions(sectorFilter, getFilterValues(companies, "sector"), "Alle Sektoren");

    const applyStockFilters = () => {
      const query = normalizeForMatch(searchInput?.value || "");
      const selectedCountry = normalizeText(countryFilter?.value);
      const selectedCurrency = normalizeText(currencyFilter?.value);
      const selectedSector = normalizeText(sectorFilter?.value);

      const filtered = companies.filter((company) => {
        const matchesSearch = !query || createCompanySearchText(company).includes(query);
        const matchesCountry = !selectedCountry || normalizeText(company.country) === selectedCountry;
        const matchesCurrency = !selectedCurrency || normalizeText(company.currency) === selectedCurrency;
        const matchesSector = !selectedSector || normalizeText(company.sector) === selectedSector;
        return matchesSearch && matchesCountry && matchesCurrency && matchesSector;
      });

      renderStockCards(list, filtered);

      if (resultsCount) {
        resultsCount.textContent = `${filtered.length} von ${companies.length} Unternehmen`;
      }
    };

    searchInput?.addEventListener("input", applyStockFilters);
    countryFilter?.addEventListener("change", applyStockFilters);
    currencyFilter?.addEventListener("change", applyStockFilters);
    sectorFilter?.addEventListener("change", applyStockFilters);

    applyStockFilters();
  }

  function createWebsiteLink(urlText) {
    const url = normalizeText(urlText);
    if (!url) {
      return "k. A.";
    }

    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = url;
    return link;
  }

  function renderCompanyDetail(container, company) {
    container.innerHTML = "";

    const symbol = normalizeCompanySymbol(company.symbol);
    const companyName = normalizeText(company.companyName) || symbol || "Unternehmen";
    const tone = getChangeTone(company.changePercentage);

    const backLink = document.createElement("a");
    backLink.className = "back-link";
    backLink.href = `${basePath}/aktien.html`;
    backLink.textContent = "\u2190 Zur Aktien-Uebersicht";

    const header = document.createElement("section");
    header.className = "company-detail-header card";

    const logoWrap = document.createElement("div");
    logoWrap.className = "company-logo-wrap";

    if (normalizeText(company.image) && company.defaultImage !== true) {
      const logo = document.createElement("img");
      logo.className = "company-logo";
      logo.src = company.image;
      logo.alt = `${companyName} Logo`;
      logoWrap.appendChild(logo);
    } else {
      const logoFallback = document.createElement("span");
      logoFallback.className = "company-logo-fallback";
      logoFallback.textContent = symbol || "N/A";
      logoWrap.appendChild(logoFallback);
    }

    const headMain = document.createElement("div");
    headMain.className = "company-head-main company-identity";

    const topMeta = document.createElement("div");
    topMeta.className = "company-inline-meta";
    topMeta.append(
      createBadge(`Symbol: ${symbol || "k. A."}`),
      createBadge(`Boerse: ${normalizeText(company.exchangeFullName) || normalizeText(company.exchange) || "k. A."}`),
      createBadge(`Land: ${normalizeText(company.country) || "k. A."}`)
    );

    const title = document.createElement("h1");
    title.textContent = companyName;

    const classification = document.createElement("p");
    classification.className = "company-classification";
    classification.textContent = `${normalizeText(company.sector) || "Sektor offen"} / ${normalizeText(company.industry) || "Branche offen"}`;

    const description = document.createElement("p");
    description.className = "company-description";
    description.textContent = normalizeText(company.description) || "Keine Beschreibung vorhanden.";

    const marketSnapshot = document.createElement("aside");
    marketSnapshot.className = "company-market-snapshot";

    const priceBox = document.createElement("div");
    priceBox.className = "company-price-block";
    const priceLabel = document.createElement("span");
    priceLabel.className = "company-metric-label";
    priceLabel.textContent = "Kurs";
    const priceValue = document.createElement("strong");
    priceValue.className = "company-price-value";
    priceValue.textContent = formatCurrency(company.price, company.currency);
    priceBox.append(priceLabel, priceValue);

    const changeBox = document.createElement("div");
    changeBox.className = `company-change-row tone-${tone}`;
    const changeLabel = document.createElement("span");
    changeLabel.className = "company-metric-label";
    changeLabel.textContent = "Veraenderung";
    const changeValue = document.createElement("strong");
    changeValue.className = "company-change-value";
    changeValue.textContent = `${formatSignedCurrency(company.change, company.currency)} (${formatPercent(company.changePercentage)})`;
    changeBox.append(changeLabel, changeValue);

    marketSnapshot.append(priceBox, changeBox);
    headMain.append(topMeta, title, classification, description);
    header.append(logoWrap, headMain, marketSnapshot);

    const addressParts = [
      normalizeText(company.address),
      normalizeText(company.city),
      normalizeText(company.state),
      normalizeText(company.zip),
      normalizeText(company.country)
    ].filter(Boolean);

    const profileSection = createDataSection("Unternehmensprofil", [
      { label: "CEO", value: company.ceo },
      { label: "Mitarbeitende", value: formatNumber(company.fullTimeEmployees) },
      { label: "IPO-Datum", value: formatDate(company.ipoDate) },
      { label: "Website", value: createWebsiteLink(company.website) },
      { label: "Telefon", value: company.phone },
      { label: "Adresse", value: addressParts.join(", ") || "k. A." }
    ]);

    const marketSection = createDataSection("Boersen- und Stammdaten", [
      { label: "Market Cap", value: formatCompactCurrency(company.marketCap, company.currency) },
      { label: "Beta", value: formatNumber(company.beta, { maximumFractionDigits: 3 }) },
      { label: "Last Dividend", value: formatCurrency(company.lastDividend, company.currency) },
      { label: "52-Wochen-Range", value: normalizeText(company.range) || "k. A." },
      { label: "Volume", value: formatCompactNumber(company.volume) },
      { label: "Average Volume", value: formatCompactNumber(company.averageVolume) },
      { label: "CIK", value: company.cik },
      { label: "ISIN", value: company.isin },
      { label: "CUSIP", value: company.cusip },
      { label: "Exchange Full Name", value: company.exchangeFullName }
    ]);

    const statusSection = createDataSection("Status / Klassifikation", [
      { label: "ETF", value: createStatusPill(company.isEtf) },
      { label: "Fund", value: createStatusPill(company.isFund) },
      { label: "ADR", value: createStatusPill(company.isAdr) },
      { label: "Aktiv gehandelt", value: createStatusPill(company.isActivelyTrading) }
    ]);
    statusSection.classList.add("company-status-card");

    const detailGrid = document.createElement("section");
    detailGrid.className = "company-detail-grid section-space";
    detailGrid.append(profileSection, marketSection, statusSection);

    const futureSection = document.createElement("section");
    futureSection.className = "card section-space company-next-sections";
    futureSection.setAttribute("aria-label", "Weiterfuehrende Analyse");

    const futureTitle = document.createElement("h2");
    futureTitle.className = "company-info-title";
    futureTitle.textContent = "Weiterfuehrende Analyse (in Vorbereitung)";

    const futureIntro = document.createElement("p");
    futureIntro.className = "muted";
    futureIntro.textContent = "Dieser Bereich ist fuer spaetere Vertiefungen vorbereitet.";

    const futureList = document.createElement("div");
    futureList.className = "company-future-topics";
    futureList.append(
      createBadge("Chancen"),
      createBadge("Risiken"),
      createBadge("Konkurrenz"),
      createBadge("Marktmacht")
    );

    futureSection.append(futureTitle, futureIntro, futureList);
    container.append(backLink, header, detailGrid, futureSection);
  }

  async function initCompanyDetail() {
    const article = document.querySelector("#company-detail");
    if (!article) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const symbol = normalizeCompanySymbol(params.get("symbol"));

    if (!symbol) {
      renderMessage(article, "Kein Unternehmenssymbol uebergeben. Bitte waehlen Sie ein Unternehmen aus der Aktien-Uebersicht.", true);
      return;
    }

    renderMessage(article, "Unternehmensdaten werden geladen ...");

    const index = await loadCompanyIndex();
    const entry = findCompanyBySymbol(index, symbol);

    if (!entry) {
      renderMessage(article, `Unternehmen mit Symbol ${symbol} wurde nicht gefunden.`, true);
      return;
    }

    const fileName = normalizeText(entry.file) || `${symbol}.json`;
    const company = await loadJson(`data/companies/${fileName}`);

    if (!company || typeof company !== "object") {
      renderMessage(article, "Unternehmensdaten sind unvollstaendig.", true);
      return;
    }

    if (!normalizeCompanySymbol(company.symbol)) {
      company.symbol = symbol;
    }

    const companyName = normalizeText(company.companyName) || symbol;
    document.title = `${companyName} Aktie (${symbol}) | MarktWiki`;
    setMetaDescription(shortenText(company.description, 155));

    renderCompanyDetail(article, company);
  }

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
      loadJson(`data/${DATA_FILES.topics}`),
      loadJson(`data/${DATA_FILES.categories}`)
    ]);

    filter.innerHTML = "";
    const allOption = document.createElement("option");
    allOption.value = "Alle";
    allOption.textContent = "Alle Kategorien";
    filter.appendChild(allOption);

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

    const renderTopicList = () => {
      list.innerHTML = "";

      const selected = filter.value;
      const filteredTopics = topics.filter((topic) => {
        return selected === "Alle" || topic.kategorie === selected;
      });

      counter.textContent = `${filteredTopics.length} Thema/Themen gefunden`;

      if (filteredTopics.length === 0) {
        renderMessage(list, "Fuer diese Kategorie sind noch keine Themen vorhanden.");
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
      renderMessage(article, "Kein Thema ausgewaehlt.", true);
      return;
    }

    const topics = await loadJson(`data/${DATA_FILES.topics}`);

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

      if (page === "stocks") {
        await initStocks();
        return;
      }

      if (page === "company-detail") {
        await initCompanyDetail();
        return;
      }

      return;
    } catch (error) {
      const targets = document.querySelectorAll("[data-error-target]");
      if (targets.length > 0) {
        targets.forEach((target) => {
          renderMessage(target, "Fehler beim Laden der Inhalte. Bitte spaeter erneut versuchen.", true);
        });
      }
      console.error(error);
    }
  }

  document.addEventListener("DOMContentLoaded", initPage);
})();

