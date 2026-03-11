(() => {
  "use strict";

  const page = document.body.dataset.page || "";
  const basePath = document.body.dataset.basePath || ".";

  const DATA_FILES = {
    categories: "kategorien.json",
    topics: "themen.json",
    companiesIndex: "companies/index.json",
    exchangeRates: "exchange-rates.json"
  };
  const FAVORITES_STORAGE_KEY = "favorites";
  const WATCHLIST_VISIBILITY_STORAGE_KEY = "watchlistVisible";
  const DISPLAY_CURRENCY_STORAGE_KEY = "displayCurrency";
  const DEFAULT_DISPLAY_CURRENCY = "EUR";
  const DEFAULT_STOCK_SORT_FIELD = "marketCap";
  const DEFAULT_STOCK_SORT_DIRECTION = "desc";
  const SUPPORTED_DISPLAY_CURRENCIES = new Set(["EUR", "USD"]);
  const RAW_CURRENCY_ALIAS = {
    GBp: "GBX"
  };
  const COUNTRY_FLAG_ASSET_BY_CODE = {
    AU: "assets/flags/au.svg",
    BE: "assets/flags/be.svg",
    BR: "assets/flags/br.svg",
    CA: "assets/flags/ca.svg",
    CH: "assets/flags/ch.svg",
    CN: "assets/flags/cn.svg",
    DE: "assets/flags/de.svg",
    DK: "assets/flags/dk.svg",
    ES: "assets/flags/es.svg",
    FR: "assets/flags/fr.svg",
    GB: "assets/flags/gb.svg",
    IE: "assets/flags/ie.svg",
    IN: "assets/flags/in.svg",
    IT: "assets/flags/it.svg",
    JP: "assets/flags/jp.svg",
    NL: "assets/flags/nl.svg",
    NO: "assets/flags/no.svg",
    SA: "assets/flags/sa.svg",
    SE: "assets/flags/se.svg",
    TH: "assets/flags/th.svg",
    TW: "assets/flags/tw.svg",
    US: "assets/flags/us.svg",
    UY: "assets/flags/uy.svg"
  };
  const CURRENCY_FLAG_COUNTRY_BY_CODE = {
    AUD: "AU",
    CAD: "CA",
    CHF: "CH",
    EUR: "EU",
    GBP: "GB",
    GBX: "GB",
    INR: "IN",
    JPY: "JP",
    SAR: "SA",
    SEK: "SE",
    THB: "TH",
    TWD: "TW",
    USD: "US"
  };
  const jsonPromiseCache = new Map();
  const convertedValueCache = new Map();
  const normalizedValueCache = new Map();
  const exchangeRateDisplayCache = new Map();
  const currencyNameCache = new Map();
  const stockMarketDataCache = new Map();
  let stockMarketDataPromise = null;
  let exchangeRatesPromise = null;
  let currencyDisplayNameFormatter = null;

  async function loadJson(path) {
    const cleanPath = String(path || "").replace(/^\/+/, "");
    if (jsonPromiseCache.has(cleanPath)) {
      return jsonPromiseCache.get(cleanPath);
    }

    const request = fetch(`${basePath}/${cleanPath}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Daten konnten nicht geladen werden: ${cleanPath}`);
        }
        return response.json();
      })
      .catch((error) => {
        jsonPromiseCache.delete(cleanPath);
        throw error;
      });

    jsonPromiseCache.set(cleanPath, request);
    return request;
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

  function normalizeCountryCode(value) {
    const normalized = normalizeText(value).toUpperCase();
    return /^[A-Z]{2}$/.test(normalized) ? normalized : "";
  }

  function countryCodeToFlag(countryCode) {
    const normalizedCode = normalizeCountryCode(countryCode);
    if (!normalizedCode) {
      return "";
    }

    const baseCodePoint = 127397;
    return String.fromCodePoint(
      normalizedCode.charCodeAt(0) + baseCodePoint,
      normalizedCode.charCodeAt(1) + baseCodePoint
    );
  }

  function getCountryFlagAssetPath(countryCode) {
    const normalizedCode = normalizeCountryCode(countryCode);
    if (!normalizedCode) {
      return "";
    }

    return COUNTRY_FLAG_ASSET_BY_CODE[normalizedCode] || "";
  }

  function createCountryDisplayNode(countryCode) {
    const normalizedCode = normalizeCountryCode(countryCode);
    if (!normalizedCode) {
      return null;
    }

    const wrapper = document.createElement("span");
    wrapper.className = "country-with-flag";

    const assetPath = getCountryFlagAssetPath(normalizedCode);
    if (assetPath) {
      const image = document.createElement("img");
      image.className = "country-flag-image";
      image.src = `${basePath}/${assetPath}`;
      image.alt = `Flagge ${normalizedCode}`;
      image.loading = "lazy";
      image.decoding = "async";
      image.width = 18;
      image.height = 12;
      image.addEventListener("error", () => {
        image.remove();
      });
      wrapper.appendChild(image);
    }

    const codeElement = document.createElement("span");
    codeElement.className = "country-code";
    codeElement.textContent = normalizedCode;
    wrapper.appendChild(codeElement);

    return wrapper;
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

  function normalizeCurrencyForRates(currency) {
    const raw = normalizeText(currency);
    if (!raw) {
      return "";
    }

    if (RAW_CURRENCY_ALIAS[raw]) {
      return RAW_CURRENCY_ALIAS[raw];
    }

    return raw.toUpperCase();
  }

  function getCurrencyDisplayName(currencyCode) {
    const normalizedCode = normalizeCurrencyForRates(currencyCode);
    if (!normalizedCode) {
      return "";
    }

    if (currencyNameCache.has(normalizedCode)) {
      return currencyNameCache.get(normalizedCode);
    }

    if (!currencyDisplayNameFormatter && typeof Intl?.DisplayNames === "function") {
      currencyDisplayNameFormatter = new Intl.DisplayNames(["de"], { type: "currency" });
    }

    let name = "";
    if (currencyDisplayNameFormatter) {
      try {
        name = normalizeText(currencyDisplayNameFormatter.of(normalizedCode));
      } catch (_) {
        name = "";
      }
    }

    if (name.toUpperCase() === normalizedCode) {
      name = "";
    }

    currencyNameCache.set(normalizedCode, name);
    return name;
  }

  function getCurrencyFlag(currencyCode) {
    const normalizedCode = normalizeCurrencyForRates(currencyCode);
    if (!normalizedCode) {
      return "";
    }

    const fallbackCountryCode = CURRENCY_FLAG_COUNTRY_BY_CODE[normalizedCode] || "";
    return countryCodeToFlag(fallbackCountryCode);
  }

  function formatCurrencyLabel(currencyCode) {
    const normalizedCode = normalizeCurrencyForRates(currencyCode);
    if (!normalizedCode) {
      return "";
    }

    const currencyName = getCurrencyDisplayName(normalizedCode);
    return currencyName ? `${currencyName} (${normalizedCode})` : normalizedCode;
  }

  function createCurrencyDisplayNode(currencyCode) {
    const label = formatCurrencyLabel(currencyCode);
    if (!label) {
      return null;
    }

    const wrapper = document.createElement("span");
    wrapper.className = "currency-with-flag";

    const flag = getCurrencyFlag(currencyCode);
    if (flag) {
      const flagElement = document.createElement("span");
      flagElement.className = "currency-flag";
      flagElement.setAttribute("aria-hidden", "true");
      flagElement.textContent = flag;
      wrapper.appendChild(flagElement);
    }

    const labelElement = document.createElement("span");
    labelElement.className = "currency-label";
    labelElement.textContent = label;
    wrapper.appendChild(labelElement);

    return wrapper;
  }

  function resolveDisplayCurrency(rawCurrency) {
    const normalized = normalizeCurrencyForRates(rawCurrency);
    if (SUPPORTED_DISPLAY_CURRENCIES.has(normalized)) {
      return normalized;
    }
    return DEFAULT_DISPLAY_CURRENCY;
  }

  function readDisplayCurrency() {
    try {
      return resolveDisplayCurrency(window.localStorage.getItem(DISPLAY_CURRENCY_STORAGE_KEY));
    } catch (error) {
      console.warn("Anzeigewaehrung konnte nicht aus localStorage gelesen werden.", error);
      return DEFAULT_DISPLAY_CURRENCY;
    }
  }

  function writeDisplayCurrency(currency) {
    const normalized = resolveDisplayCurrency(currency);
    try {
      window.localStorage.setItem(DISPLAY_CURRENCY_STORAGE_KEY, normalized);
    } catch (error) {
      console.warn("Anzeigewaehrung konnte nicht gespeichert werden.", error);
    }
    return normalized;
  }

  async function loadExchangeRates() {
    if (exchangeRatesPromise) {
      return exchangeRatesPromise;
    }

    exchangeRatesPromise = loadJson(`data/${DATA_FILES.exchangeRates}`).then((payload) => {
      if (!payload || typeof payload !== "object") {
        throw new Error("Ungueltige Wechselkurs-Struktur.");
      }

      const rates = {};
      if (payload.usdPerUnit && typeof payload.usdPerUnit === "object") {
        Object.entries(payload.usdPerUnit).forEach(([code, rawValue]) => {
          const normalizedCode = normalizeCurrencyForRates(code);
          const numericRate = toNumber(rawValue);
          if (normalizedCode && numericRate && numericRate > 0) {
            rates[normalizedCode] = numericRate;
          }
        });
      } else if (payload.rates && typeof payload.rates === "object") {
        const baseCode = normalizeCurrencyForRates(payload.base || "USD");
        const ratesByBase = {};
        Object.entries(payload.rates).forEach(([code, rawValue]) => {
          const normalizedCode = normalizeCurrencyForRates(code);
          const numericRate = toNumber(rawValue);
          if (normalizedCode && numericRate && numericRate > 0) {
            ratesByBase[normalizedCode] = numericRate;
          }
        });
        ratesByBase[baseCode] = 1;

        if (baseCode === "USD") {
          Object.entries(ratesByBase).forEach(([code, perUsd]) => {
            const rateNumber = toNumber(perUsd);
            if (rateNumber && rateNumber > 0) {
              rates[code] = 1 / rateNumber;
            }
          });
        } else {
          const usdPerBase = toNumber(ratesByBase.USD);
          if (!usdPerBase || usdPerBase <= 0) {
            throw new Error("Wechselkursdaten ohne USD-Anker sind nicht nutzbar.");
          }

          Object.entries(ratesByBase).forEach(([code, perBase]) => {
            const rateNumber = toNumber(perBase);
            if (rateNumber && rateNumber > 0) {
              rates[code] = usdPerBase / rateNumber;
            }
          });
          rates[baseCode] = usdPerBase;
          rates.USD = 1;
        }
      } else {
        throw new Error("Ungueltige Wechselkurs-Struktur.");
      }

      if (!rates.USD) {
        rates.USD = 1;
      }
      if (!rates.EUR || !rates.USD) {
        throw new Error("Erforderliche Wechselkurse fuer EUR/USD fehlen.");
      }

      return {
        updatedAt: normalizeText(payload.updatedAt),
        usdPerUnit: rates
      };
    });

    return exchangeRatesPromise;
  }

  function convertCurrencyValue(value, sourceCurrency, targetCurrency, ratesData) {
    const numericValue = toNumber(value);
    if (numericValue === null) {
      return null;
    }

    const sourceCode = normalizeCurrencyForRates(sourceCurrency);
    const targetCode = normalizeCurrencyForRates(targetCurrency);

    if (!sourceCode || !targetCode) {
      return null;
    }

    if (sourceCode === targetCode) {
      return numericValue;
    }

    const sourceRate = toNumber(ratesData?.usdPerUnit?.[sourceCode]);
    const targetRate = toNumber(ratesData?.usdPerUnit?.[targetCode]);

    if (!sourceRate || !targetRate) {
      return null;
    }

    const usdValue = numericValue * sourceRate;
    return usdValue / targetRate;
  }

  function getConvertedCompanyValue(company, field, targetCurrency, ratesData) {
    const symbol = normalizeCompanySymbol(company?.symbol) || "__unknown__";
    const normalizedTarget = normalizeCurrencyForRates(targetCurrency);
    const sourceCurrency = normalizeCurrencyForRates(company?.currency);
    const sourceValue = toNumber(company?.[field]);
    const key = `${symbol}|${field}|${sourceCurrency}|${sourceValue}|${normalizedTarget}`;

    if (convertedValueCache.has(key)) {
      return convertedValueCache.get(key);
    }

    const converted = convertCurrencyValue(company?.[field], company?.currency, normalizedTarget, ratesData);
    convertedValueCache.set(key, converted);
    return converted;
  }

  function getNormalizedValue(cacheKey, value, sourceCurrency, ratesData) {
    const normalizedSourceCurrency = normalizeCurrencyForRates(sourceCurrency);
    const numericValue = toNumber(value);
    const key = `${cacheKey}|${normalizedSourceCurrency}|${numericValue}|USD`;
    if (normalizedValueCache.has(key)) {
      return normalizedValueCache.get(key);
    }

    const normalized = convertCurrencyValue(value, sourceCurrency, "USD", ratesData);
    normalizedValueCache.set(key, normalized);
    return normalized;
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
    heading.className = "company-section-title";
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

  function readFavorites() {
    try {
      const rawValue = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (!rawValue) {
        return [];
      }

      const parsed = JSON.parse(rawValue);
      const rawSymbols = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed?.favorites)
          ? parsed.favorites
          : null;

      if (!rawSymbols) {
        return [];
      }

      const symbols = rawSymbols
        .map((entry) => normalizeCompanySymbol(entry))
        .filter(Boolean);

      return [...new Set(symbols)];
    } catch (error) {
      console.warn("Favoriten konnten nicht gelesen werden.", error);
      return [];
    }
  }

  function writeFavorites(favorites) {
    try {
      const normalized = [...new Set((favorites || [])
        .map((entry) => normalizeCompanySymbol(entry))
        .filter(Boolean))];
      window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify({
        favorites: normalized
      }));
      return true;
    } catch (error) {
      console.warn("Favoriten konnten nicht gespeichert werden.", error);
      return false;
    }
  }

  function createFavoriteButton(symbol, isActive = false, onToggle = null) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "favorite-toggle";
    button.setAttribute("aria-label", isActive ? "Aus Favoriten entfernen" : "Zu Favoriten hinzufuegen");
    button.setAttribute("aria-pressed", String(Boolean(isActive)));
    button.textContent = isActive ? "\u2605" : "\u2606";

    if (isActive) {
      button.classList.add("is-active");
    }

    if (!symbol || typeof onToggle !== "function") {
      button.disabled = true;
      return button;
    }

    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      onToggle(symbol);
    });

    return button;
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

  function getStockExchangeLabel(company) {
    const symbol = normalizeCompanySymbol(company?.symbol);
    if (!symbol) {
      return "";
    }

    const metrics = stockMarketDataCache.get(symbol);
    return normalizeText(metrics?.exchange);
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

  function formatExchangeRateValue(value) {
    const number = toNumber(value);
    if (number === null) {
      return "k. A.";
    }

    return formatNumber(number, {
      minimumFractionDigits: number >= 1 ? 2 : 4,
      maximumFractionDigits: 6
    });
  }

  function getExchangeRateEntries(baseCurrency, ratesData) {
    const normalizedBase = resolveDisplayCurrency(baseCurrency);
    const cacheKey = `${normalizedBase}|${normalizeText(ratesData?.updatedAt)}`;
    if (exchangeRateDisplayCache.has(cacheKey)) {
      return exchangeRateDisplayCache.get(cacheKey);
    }

    const entries = Object.keys(ratesData?.usdPerUnit || {})
      .map((currencyCode) => normalizeCurrencyForRates(currencyCode))
      .filter(Boolean)
      .map((currencyCode) => {
        const rate = convertCurrencyValue(1, normalizedBase, currencyCode, ratesData);
        const inverseRate = convertCurrencyValue(1, currencyCode, normalizedBase, ratesData);
        return {
          currencyCode,
          rate,
          inverseRate
        };
      })
      .filter((entry) => toNumber(entry.rate) !== null);

    exchangeRateDisplayCache.set(cacheKey, entries);
    return entries;
  }

  function getExchangeRateCurrencyCodes(ratesData) {
    return Object.keys(ratesData?.usdPerUnit || {})
      .map((currencyCode) => normalizeCurrencyForRates(currencyCode))
      .filter(Boolean)
      .filter((code, index, list) => list.indexOf(code) === index)
      .sort((a, b) => {
        const labelA = formatCurrencyLabel(a) || a;
        const labelB = formatCurrencyLabel(b) || b;
        return labelA.localeCompare(labelB, "de");
      });
  }

  function formatCurrencyOptionLabel(currencyCode) {
    const normalizedCode = normalizeCurrencyForRates(currencyCode);
    if (!normalizedCode) {
      return "";
    }
    const currencyName = getCurrencyDisplayName(normalizedCode);
    return currencyName ? `${normalizedCode} — ${currencyName}` : normalizedCode;
  }

  function createCurrencyCombobox(options = {}) {
    const {
      input,
      listbox,
      toggleButton,
      currencies = [],
      initialCurrency = "",
      onChange = null
    } = options;

    if (!input || !listbox) {
      return null;
    }

    const normalizedCurrencies = currencies
      .map((currencyCode) => normalizeCurrencyForRates(currencyCode))
      .filter(Boolean)
      .filter((code, index, list) => list.indexOf(code) === index);

    const fallbackCurrency = normalizedCurrencies[0] || "";
    let selectedCurrency = normalizeCurrencyForRates(initialCurrency);
    if (!normalizedCurrencies.includes(selectedCurrency)) {
      selectedCurrency = fallbackCurrency;
    }

    const ariaControls = normalizeText(input.getAttribute("aria-controls"));
    if (!normalizeText(listbox.id) && ariaControls) {
      listbox.id = ariaControls;
    }
    if (!normalizeText(input.getAttribute("aria-controls")) && listbox.id) {
      input.setAttribute("aria-controls", listbox.id);
    }

    const getFilteredCurrencies = (query = "") => {
      const normalizedQuery = normalizeForMatch(query);
      if (!normalizedQuery) {
        return normalizedCurrencies;
      }

      return normalizedCurrencies
        .map((currencyCode) => {
          const codeText = normalizeForMatch(currencyCode);
          const nameText = normalizeForMatch(getCurrencyDisplayName(currencyCode));
          const optionText = normalizeForMatch(formatCurrencyOptionLabel(currencyCode));
          const matches = codeText.includes(normalizedQuery) || nameText.includes(normalizedQuery) || optionText.includes(normalizedQuery);
          if (!matches) {
            return null;
          }

          let score = 6;
          if (codeText === normalizedQuery) {
            score = 0;
          } else if (codeText.startsWith(normalizedQuery)) {
            score = 1;
          } else if (nameText.startsWith(normalizedQuery)) {
            score = 2;
          } else if (optionText.startsWith(normalizedQuery)) {
            score = 3;
          } else if (codeText.includes(normalizedQuery)) {
            score = 4;
          } else if (nameText.includes(normalizedQuery)) {
            score = 5;
          }

          return { currencyCode, score };
        })
        .filter(Boolean)
        .sort((a, b) => {
          if (a.score !== b.score) {
            return a.score - b.score;
          }
          return formatCurrencyOptionLabel(a.currencyCode).localeCompare(formatCurrencyOptionLabel(b.currencyCode), "de");
        })
        .map((entry) => entry.currencyCode);
    };

    const closeList = () => {
      listbox.hidden = true;
      input.setAttribute("aria-expanded", "false");
      input.removeAttribute("aria-activedescendant");
    };

    const renderList = (query = "", activeCurrency = "") => {
      const filtered = getFilteredCurrencies(query);
      listbox.innerHTML = "";

      if (!filtered.length) {
        const emptyItem = document.createElement("li");
        emptyItem.className = "currency-combobox-option currency-combobox-empty";
        emptyItem.textContent = "Keine Treffer";
        emptyItem.setAttribute("role", "option");
        emptyItem.setAttribute("aria-disabled", "true");
        listbox.appendChild(emptyItem);
        return { filtered, activeCode: "" };
      }

      const preferredActive = normalizeCurrencyForRates(activeCurrency);
      const activeCode = filtered.includes(preferredActive) ? preferredActive : filtered[0];

      filtered.forEach((currencyCode) => {
        const item = document.createElement("li");
        item.className = "currency-combobox-option";
        item.textContent = formatCurrencyOptionLabel(currencyCode);
        item.setAttribute("role", "option");
        item.dataset.currencyCode = currencyCode;
        item.id = `${listbox.id || "exchange-converter-list"}-${currencyCode.toLowerCase()}`;
        const isSelected = currencyCode === selectedCurrency;
        const isActive = currencyCode === activeCode;
        item.setAttribute("aria-selected", isSelected ? "true" : "false");
        if (isActive) {
          item.classList.add("is-active");
        }
        item.addEventListener("mousedown", (event) => {
          event.preventDefault();
          setSelectedCurrency(currencyCode, { emit: true, keepListOpen: false });
          input.focus();
        });
        listbox.appendChild(item);
      });

      const activeItem = listbox.querySelector(".currency-combobox-option.is-active");
      if (activeItem?.id) {
        input.setAttribute("aria-activedescendant", activeItem.id);
      }

      return { filtered, activeCode };
    };

    const openList = (query = "", activeCurrency = "") => {
      renderList(query, activeCurrency);
      listbox.hidden = false;
      input.setAttribute("aria-expanded", "true");
    };

    function setSelectedCurrency(currencyCode, config = {}) {
      const { emit = true, keepListOpen = false } = config;
      const normalizedCode = normalizeCurrencyForRates(currencyCode);
      if (!normalizedCode || !normalizedCurrencies.includes(normalizedCode)) {
        return false;
      }

      selectedCurrency = normalizedCode;
      input.value = formatCurrencyOptionLabel(selectedCurrency);

      if (!keepListOpen) {
        closeList();
      }

      if (typeof onChange === "function" && emit) {
        onChange(selectedCurrency);
      }
      return true;
    }

    const setActiveOption = (nextCode) => {
      const normalizedCode = normalizeCurrencyForRates(nextCode);
      if (!normalizedCode) {
        return;
      }

      const optionsList = [...listbox.querySelectorAll(".currency-combobox-option[data-currency-code]")];
      optionsList.forEach((optionElement) => {
        const isActive = optionElement.dataset.currencyCode === normalizedCode;
        optionElement.classList.toggle("is-active", isActive);
        if (isActive && optionElement.id) {
          input.setAttribute("aria-activedescendant", optionElement.id);
          optionElement.scrollIntoView({ block: "nearest" });
        }
      });
    };

    const moveActive = (step) => {
      const visibleOptions = [...listbox.querySelectorAll(".currency-combobox-option[data-currency-code]")];
      if (!visibleOptions.length) {
        return;
      }
      const currentIndex = visibleOptions.findIndex((option) => option.classList.contains("is-active"));
      const nextIndex = currentIndex < 0
        ? 0
        : Math.max(0, Math.min(visibleOptions.length - 1, currentIndex + step));
      setActiveOption(visibleOptions[nextIndex].dataset.currencyCode);
    };

    input.addEventListener("focus", () => {
      openList(input.value, selectedCurrency);
    });

    input.addEventListener("input", () => {
      openList(input.value, selectedCurrency);
    });

    input.addEventListener("keydown", (event) => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        if (listbox.hidden) {
          openList(input.value, selectedCurrency);
        }
        moveActive(1);
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        if (listbox.hidden) {
          openList(input.value, selectedCurrency);
        }
        moveActive(-1);
        return;
      }

      if (event.key === "Enter") {
        const activeOption = listbox.querySelector(".currency-combobox-option.is-active[data-currency-code]");
        if (activeOption) {
          event.preventDefault();
          setSelectedCurrency(activeOption.dataset.currencyCode, { emit: true, keepListOpen: false });
          return;
        }
      }

      if (event.key === "Escape") {
        event.preventDefault();
        setSelectedCurrency(selectedCurrency, { emit: false, keepListOpen: false });
      }
    });

    input.addEventListener("blur", () => {
      window.setTimeout(() => {
        if (document.activeElement === input || document.activeElement === toggleButton) {
          return;
        }
        if (!listbox.contains(document.activeElement)) {
          setSelectedCurrency(selectedCurrency, { emit: false, keepListOpen: false });
        }
      }, 100);
    });

    if (toggleButton) {
      toggleButton.addEventListener("click", () => {
        if (listbox.hidden) {
          openList("", selectedCurrency);
          input.focus();
        } else {
          closeList();
          input.focus();
        }
      });
    }

    document.addEventListener("click", (event) => {
      if (event.target === input || event.target === toggleButton) {
        return;
      }
      if (listbox.contains(event.target)) {
        return;
      }
      if (!listbox.hidden) {
        setSelectedCurrency(selectedCurrency, { emit: false, keepListOpen: false });
      }
    });

    if (selectedCurrency) {
      input.value = formatCurrencyOptionLabel(selectedCurrency);
    }
    closeList();

    return {
      getSelectedCurrency: () => selectedCurrency,
      setSelectedCurrency
    };
  }

  function formatConverterCurrencyValue(value, currencyCode) {
    const number = toNumber(value);
    const normalizedCurrency = normalizeCurrencyForRates(currencyCode);
    if (number === null || !normalizedCurrency) {
      return "k. A.";
    }

    const abs = Math.abs(number);
    const maxFractionDigits = abs > 0 && abs < 1 ? 6 : 2;
    return formatCurrency(number, normalizedCurrency, {
      minimumFractionDigits: 2,
      maximumFractionDigits: maxFractionDigits
    });
  }

  function formatConverterNumber(value) {
    const number = toNumber(value);
    if (number === null) {
      return "k. A.";
    }

    const abs = Math.abs(number);
    return formatNumber(number, {
      minimumFractionDigits: 2,
      maximumFractionDigits: abs > 0 && abs < 1 ? 6 : 2
    });
  }

  function toInputNumberString(value) {
    const number = toNumber(value);
    if (number === null) {
      return "";
    }

    const abs = Math.abs(number);
    const decimals = abs > 0 && abs < 1 ? 6 : 4;
    let text = number.toFixed(decimals);
    text = text.replace(/\.?0+$/, "");
    if (text === "-0") {
      return "0";
    }
    return text;
  }

  function parseConverterInputValue(input) {
    const raw = normalizeText(input?.value);
    if (!raw) {
      return { status: "empty", value: null };
    }

    const number = toNumber(raw);
    if (number === null) {
      return { status: "invalid", value: null };
    }

    if (number < 0) {
      return { status: "negative", value: null };
    }

    return { status: "valid", value: number };
  }

  function initExchangeConverter(ratesData, preferredBaseCurrency = DEFAULT_DISPLAY_CURRENCY) {
    const amountInputLeft = document.querySelector("#exchange-converter-amount-left");
    const amountInputRight = document.querySelector("#exchange-converter-amount-right");
    const fromInput = document.querySelector("#exchange-converter-from-input");
    const toInput = document.querySelector("#exchange-converter-to-input");
    const fromListbox = document.querySelector("#exchange-converter-from-listbox");
    const toListbox = document.querySelector("#exchange-converter-to-listbox");
    const fromToggle = document.querySelector(".currency-combobox[data-side='from'] [data-role='toggle']");
    const toToggle = document.querySelector(".currency-combobox[data-side='to'] [data-role='toggle']");
    const output = document.querySelector("#exchange-converter-output");
    const rateOutput = document.querySelector("#exchange-converter-rate");

    if (!amountInputLeft || !amountInputRight || !fromInput || !toInput || !fromListbox || !toListbox || !output || !rateOutput) {
      return;
    }

    const currencyCodes = getExchangeRateCurrencyCodes(ratesData);
    if (!currencyCodes.length) {
      output.textContent = "Keine Wechselkurse verfuegbar.";
      rateOutput.textContent = "";
      fromInput.disabled = true;
      toInput.disabled = true;
      if (fromToggle) {
        fromToggle.disabled = true;
      }
      if (toToggle) {
        toToggle.disabled = true;
      }
      amountInputLeft.disabled = true;
      amountInputRight.disabled = true;
      return;
    }

    const normalizedPreferredBase = normalizeCurrencyForRates(preferredBaseCurrency);
    const preferredFrom = currencyCodes.includes(normalizedPreferredBase)
      ? normalizedPreferredBase
      : currencyCodes[0];
    const preferredTo = currencyCodes.find((code) => code !== preferredFrom) || preferredFrom;

    let activeSide = "left";

    const applyConversion = () => {
      const fromCurrency = normalizeCurrencyForRates(fromCombobox.getSelectedCurrency());
      const toCurrency = normalizeCurrencyForRates(toCombobox.getSelectedCurrency());
      const leftInput = parseConverterInputValue(amountInputLeft);
      const rightInput = parseConverterInputValue(amountInputRight);

      if (!fromCurrency || !toCurrency) {
        output.textContent = "Bitte waehlen Sie eine gueltige Waehrung aus.";
        rateOutput.textContent = "";
        return;
      }

      if (leftInput.status === "invalid" || rightInput.status === "invalid") {
        output.textContent = "Bitte einen gueltigen Betrag eingeben.";
        rateOutput.textContent = "";
        return;
      }

      if (leftInput.status === "negative" || rightInput.status === "negative") {
        output.textContent = "Bitte einen Betrag groesser oder gleich 0 eingeben.";
        rateOutput.textContent = "";
        return;
      }

      const leaderSide = activeSide === "right"
        ? (rightInput.status === "valid" ? "right" : (leftInput.status === "valid" ? "left" : "right"))
        : (leftInput.status === "valid" ? "left" : (rightInput.status === "valid" ? "right" : "left"));

      if (leftInput.status !== "valid" && rightInput.status !== "valid") {
        output.textContent = "Bitte einen Betrag eingeben.";
        rateOutput.textContent = "";
        return;
      }

      let leftValue = leftInput.value;
      let rightValue = rightInput.value;
      if (leaderSide === "left") {
        rightValue = convertCurrencyValue(leftInput.value, fromCurrency, toCurrency, ratesData);
        amountInputRight.value = toInputNumberString(rightValue);
      } else {
        leftValue = convertCurrencyValue(rightInput.value, toCurrency, fromCurrency, ratesData);
        amountInputLeft.value = toInputNumberString(leftValue);
      }

      const sourceAmount = leaderSide === "left" ? leftValue : rightValue;
      const sourceCurrency = leaderSide === "left" ? fromCurrency : toCurrency;
      const targetAmount = leaderSide === "left" ? rightValue : leftValue;
      const targetCurrency = leaderSide === "left" ? toCurrency : fromCurrency;
      const unitRate = convertCurrencyValue(1, fromCurrency, toCurrency, ratesData);

      if (sourceAmount === null || targetAmount === null || unitRate === null) {
        output.textContent = "Umrechnung aktuell nicht verfuegbar.";
        rateOutput.textContent = "";
        return;
      }

      output.textContent = `${formatConverterNumber(sourceAmount)} ${sourceCurrency} = ${formatConverterNumber(targetAmount)} ${targetCurrency}`;
      rateOutput.textContent = `1 ${fromCurrency} = ${formatExchangeRateValue(unitRate)} ${toCurrency}`;
    };

    const fromCombobox = createCurrencyCombobox({
      input: fromInput,
      listbox: fromListbox,
      toggleButton: fromToggle,
      currencies: currencyCodes,
      initialCurrency: preferredFrom,
      onChange: () => {
        applyConversion();
      }
    });

    const toCombobox = createCurrencyCombobox({
      input: toInput,
      listbox: toListbox,
      toggleButton: toToggle,
      currencies: currencyCodes,
      initialCurrency: preferredTo,
      onChange: () => {
        applyConversion();
      }
    });

    if (!fromCombobox || !toCombobox) {
      return;
    }

    amountInputLeft.addEventListener("input", () => {
      activeSide = "left";
      applyConversion();
    });

    amountInputRight.addEventListener("input", () => {
      activeSide = "right";
      applyConversion();
    });

    amountInputLeft.value = toInputNumberString(parseConverterInputValue(amountInputLeft).value ?? 1);
    activeSide = "left";
    amountInputRight.value = "";
    requestAnimationFrame(() => {
      applyConversion();
    });
  }

  function createExchangeRateCard(entry, baseCurrency) {
    const currencyCode = normalizeCurrencyForRates(entry?.currencyCode);
    const normalizedBase = resolveDisplayCurrency(baseCurrency);
    const card = document.createElement("article");
    card.className = "card exchange-rate-card";

    const title = document.createElement("h2");
    title.className = "exchange-rate-card-title";
    const currencyDisplay = createCurrencyDisplayNode(currencyCode);
    if (currencyDisplay) {
      title.appendChild(currencyDisplay);
    } else {
      title.textContent = "k. A.";
    }

    const primary = document.createElement("p");
    primary.className = "exchange-rate-primary";
    primary.textContent = `1 ${normalizedBase} = ${formatExchangeRateValue(entry?.rate)} ${currencyCode}`;

    const secondary = document.createElement("p");
    secondary.className = "muted exchange-rate-secondary";
    secondary.textContent = `Referenzkurs: 1 ${currencyCode} = ${formatExchangeRateValue(entry?.inverseRate)} ${normalizedBase}`;

    card.append(title, primary, secondary);
    return card;
  }

  async function initExchangeRates() {
    const list = document.querySelector("#exchange-rates-list");
    const baseSelect = document.querySelector("#exchange-base-currency");
    const sortSelect = document.querySelector("#exchange-sort-direction");
    const meta = document.querySelector("#exchange-rates-meta");

    if (!list) {
      return;
    }

    renderMessage(list, "Wechselkurse werden geladen ...");
    const ratesData = await loadExchangeRates();
    let selectedBaseCurrency = readDisplayCurrency();
    initExchangeConverter(ratesData, selectedBaseCurrency);

    if (baseSelect) {
      baseSelect.value = selectedBaseCurrency;
    }

    const applyExchangeFilters = () => {
      selectedBaseCurrency = resolveDisplayCurrency(baseSelect?.value || selectedBaseCurrency);
      const selectedDirection = normalizeText(sortSelect?.value) === "asc" ? "asc" : "desc";
      const entries = getExchangeRateEntries(selectedBaseCurrency, ratesData);
      const sortedEntries = [...entries].sort((a, b) => {
        const rateA = toNumber(a?.rate) ?? Number.POSITIVE_INFINITY;
        const rateB = toNumber(b?.rate) ?? Number.POSITIVE_INFINITY;
        return selectedDirection === "asc" ? rateA - rateB : rateB - rateA;
      });

      list.innerHTML = "";

      if (!sortedEntries.length) {
        renderMessage(list, "Es sind keine Wechselkurse verfuegbar.");
      } else {
        sortedEntries.forEach((entry) => {
          list.appendChild(createExchangeRateCard(entry, selectedBaseCurrency));
        });
      }

      if (meta) {
        const updateLabel = normalizeText(ratesData.updatedAt)
          ? ` | Stand: ${formatDate(ratesData.updatedAt)}`
          : "";
        meta.textContent = `${sortedEntries.length} Wechselkurse | Basis: ${selectedBaseCurrency}${updateLabel}`;
      }
    };

    baseSelect?.addEventListener("change", () => {
      selectedBaseCurrency = writeDisplayCurrency(baseSelect.value);
      applyExchangeFilters();
    });
    sortSelect?.addEventListener("change", applyExchangeFilters);

    applyExchangeFilters();
  }

  async function loadStockMarketData(indexCompanies) {
    if (stockMarketDataPromise) {
      return stockMarketDataPromise;
    }

    const entries = Array.isArray(indexCompanies) ? indexCompanies : [];
    stockMarketDataPromise = Promise.all(entries.map(async (entry) => {
      const symbol = normalizeCompanySymbol(entry?.symbol);
      if (!symbol) {
        return;
      }

      const fileName = normalizeText(entry?.file) || `${symbol}.json`;

      try {
        const company = await loadJson(`data/companies/${fileName}`);
        stockMarketDataCache.set(symbol, {
          marketCap: toNumber(company?.marketCap),
          currency: normalizeText(company?.currency) || normalizeText(entry?.currency),
          exchange: normalizeText(company?.exchangeFullName) || normalizeText(company?.exchange)
        });
      } catch (error) {
        stockMarketDataCache.set(symbol, {
          marketCap: null,
          currency: normalizeText(entry?.currency),
          exchange: ""
        });
      }
    }));

    await stockMarketDataPromise;
    return stockMarketDataCache;
  }

  function renderStockCards(list, companies, options = {}) {
    list.innerHTML = "";
    const {
      favoriteSymbols = new Set(),
      onToggleFavorite = null,
      emptyMessage = "Keine Unternehmen fuer diese Suche/Filter gefunden.",
      displayCurrency = DEFAULT_DISPLAY_CURRENCY,
      ratesData = null
    } = options;

    if (!companies.length) {
      renderMessage(list, emptyMessage);
      return;
    }

    companies.forEach((company) => {
      const symbol = normalizeCompanySymbol(company?.symbol);
      const isFavorite = symbol ? favoriteSymbols.has(symbol) : false;
      list.appendChild(createStockCard(company, {
        isFavorite,
        onToggleFavorite,
        displayCurrency,
        ratesData
      }));
    });
  }

  function createStockCard(company, options = {}) {
    const {
      isFavorite = false,
      onToggleFavorite = null,
      displayCurrency = DEFAULT_DISPLAY_CURRENCY,
      ratesData = null
    } = options;
    const symbol = normalizeCompanySymbol(company.symbol);
    const companyName = normalizeText(company.companyName) || symbol || "Unbekanntes Unternehmen";
    const originalCurrency = normalizeText(company.currency) || "k. A.";
    const logoFallbackText = symbol || normalizeText(company.companyName).slice(0, 3).toUpperCase() || "N/A";

    const appendStockFact = (target, label, value) => {
      const row = document.createElement("div");
      const term = document.createElement("dt");
      const detail = document.createElement("dd");
      const normalizedValue = normalizeText(value);

      term.textContent = label;
      if (value instanceof Node) {
        detail.appendChild(value);
      } else {
        detail.textContent = normalizedValue || "k. A.";
      }

      if (!normalizedValue && !(value instanceof Node)) {
        detail.classList.add("is-missing");
      }

      row.append(term, detail);
      target.appendChild(row);
    };

    const card = document.createElement("article");
    card.className = "card stock-card";

    const link = document.createElement("a");
    link.className = "stock-card-link";
    link.href = `${basePath}/pages/unternehmen.html?symbol=${encodeURIComponent(symbol)}`;
    link.setAttribute("aria-label", `${companyName} (${symbol}) - zur Unternehmensseite`);

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
      fallback.textContent = logoFallbackText;
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
    const targetCurrency = resolveDisplayCurrency(displayCurrency);
    const convertedPrice = ratesData ? getConvertedCompanyValue(company, "price", targetCurrency, ratesData) : null;
    const primaryPrice = convertedPrice === null
      ? formatCurrency(company.price, originalCurrency)
      : formatCurrency(convertedPrice, targetCurrency);
    const originalPrice = formatCurrency(company.price, originalCurrency);
    const baseCurrencyCode = normalizeCurrencyForRates(originalCurrency) || "Basiswaehrung";
    priceLine.textContent = convertedPrice === null
      ? `Kurs: ${primaryPrice}`
      : `Kurs: ${primaryPrice} | ${baseCurrencyCode}: ${originalPrice}`;

    const facts = document.createElement("dl");
    facts.className = "stock-meta stock-facts stock-facts-compact";

    appendStockFact(facts, "CEO", company.ceo);
    appendStockFact(facts, "Sektor", company.sector);
    appendStockFact(facts, "Branche", company.industry);
    appendStockFact(facts, "Land", createCountryDisplayNode(company.country) || company.country);

    const teaser = document.createElement("p");
    teaser.className = "stock-context";
    teaser.textContent = shortenText(company.description, 110);

    details.append(title, symbolLine, priceLine, facts, teaser);
    link.append(visual, details);
    card.appendChild(link);

    const favoriteButton = createFavoriteButton(symbol, isFavorite, onToggleFavorite);
    favoriteButton.classList.add("favorite-toggle-card");
    card.appendChild(favoriteButton);

    return card;
  }

  async function initStocks() {
    const list = document.querySelector("#stocks-list");
    const favoritesList = document.querySelector("#stocks-favorites-list");
    const watchlistToggle = document.querySelector("#stocks-watchlist-toggle");
    const searchInput = document.querySelector("#stocks-search");
    const countryFilter = document.querySelector("#stocks-country-filter");
    const currencyFilter = document.querySelector("#stocks-currency-filter");
    const displayCurrencyFilter = document.querySelector("#stocks-display-currency");
    const sectorFilter = document.querySelector("#stocks-sector-filter");
    const industryFilter = document.querySelector("#stocks-industry-filter");
    const exchangeFilter = document.querySelector("#stocks-exchange-filter");
    const sortSelect = document.querySelector("#stocks-sort");
    const sortDirectionSelect = document.querySelector("#stocks-sort-direction");
    const resetButton = document.querySelector("#stocks-reset-filters");
    const resultsCount = document.querySelector("#stocks-results-count");
    const params = new URLSearchParams(window.location.search);

    if (!list) {
      return;
    }

    renderMessage(list, "Unternehmen werden geladen ...");
    if (favoritesList) {
      renderMessage(favoritesList, "Favoriten werden geladen ...");
    }

    // Index enthaelt Vorschauwerte, damit die Uebersicht in einem Request ladbar bleibt.
    const [companies, ratesData] = await Promise.all([
      loadCompanyIndex(),
      loadExchangeRates()
    ]);
    await loadStockMarketData(companies);
    let favoriteSymbols = new Set(readFavorites());
    let displayCurrency = readDisplayCurrency();
    let watchlistVisible = favoriteSymbols.size > 0;
    let hasStoredWatchlistPreference = false;

    if (favoritesList) {
      try {
        const storedVisibility = normalizeText(window.localStorage.getItem(WATCHLIST_VISIBILITY_STORAGE_KEY));
        if (storedVisibility === "true" || storedVisibility === "false") {
          watchlistVisible = storedVisibility === "true";
          hasStoredWatchlistPreference = true;
        }
      } catch (error) {
        console.warn("Sichtbarkeit der Beobachtungsliste konnte nicht gelesen werden.", error);
      }
    }

    if (displayCurrencyFilter) {
      displayCurrencyFilter.value = displayCurrency;
    }

    const updateWatchlistVisibility = () => {
      if (favoritesList) {
        favoritesList.hidden = !watchlistVisible;
      }

      if (watchlistToggle) {
        watchlistToggle.textContent = watchlistVisible ? "Ausblenden" : "Einblenden";
        watchlistToggle.setAttribute("aria-expanded", String(watchlistVisible));
      }
    };

    const persistAndRefresh = (symbol) => {
      const normalizedSymbol = normalizeCompanySymbol(symbol);
      if (!normalizedSymbol) {
        return;
      }

      if (favoriteSymbols.has(normalizedSymbol)) {
        favoriteSymbols.delete(normalizedSymbol);
      } else {
        favoriteSymbols.add(normalizedSymbol);
      }

      writeFavorites([...favoriteSymbols]);
      applyStockFilters();
    };

    const renderFavorites = () => {
      if (!favoritesList) {
        return;
      }

      const favoriteCompanies = companies.filter((company) => {
        const symbol = normalizeCompanySymbol(company?.symbol);
        return symbol && favoriteSymbols.has(symbol);
      });

      renderStockCards(favoritesList, favoriteCompanies, {
        favoriteSymbols,
        onToggleFavorite: persistAndRefresh,
        displayCurrency,
        ratesData,
        emptyMessage: "Sie koennen Unternehmen als Favoriten markieren, um sie hier schnell wiederzufinden."
      });

      if (!hasStoredWatchlistPreference) {
        watchlistVisible = favoriteCompanies.length > 0;
      }
      updateWatchlistVisibility();
    };

    watchlistToggle?.addEventListener("click", () => {
      watchlistVisible = !watchlistVisible;
      hasStoredWatchlistPreference = true;

      try {
        window.localStorage.setItem(WATCHLIST_VISIBILITY_STORAGE_KEY, String(watchlistVisible));
      } catch (error) {
        console.warn("Sichtbarkeit der Beobachtungsliste konnte nicht gespeichert werden.", error);
      }

      updateWatchlistVisibility();
    });

    if (!companies.length) {
      renderMessage(list, "Derzeit sind noch keine Unternehmen verfuegbar.");
      if (favoritesList) {
        renderMessage(favoritesList, "Sie koennen Unternehmen als Favoriten markieren, um sie hier schnell wiederzufinden.");
      }
      updateWatchlistVisibility();
      if (resultsCount) {
        resultsCount.textContent = "0 Unternehmen gefunden";
      }
      return;
    }

    fillSelectOptions(countryFilter, getFilterValues(companies, "country"), "Alle Laender");
    fillSelectOptions(currencyFilter, getFilterValues(companies, "currency"), "Alle Waehrungen");
    fillSelectOptions(sectorFilter, getFilterValues(companies, "sector"), "Alle Sektoren");
    fillSelectOptions(industryFilter, getFilterValues(companies, "industry"), "Alle Branchen");
    fillSelectOptions(
      exchangeFilter,
      [...new Set(companies.map((company) => getStockExchangeLabel(company)).filter(Boolean))]
        .sort((a, b) => a.localeCompare(b, "de")),
      "Alle Boersen"
    );

    const setSelectFromParam = (select, rawParamValue) => {
      if (!select) {
        return;
      }

      const paramValue = normalizeText(rawParamValue);
      if (!paramValue) {
        return;
      }

      const normalizedParamValue = normalizeForMatch(paramValue);
      const option = [...select.options].find((entry) => normalizeForMatch(entry.value) === normalizedParamValue);

      if (option) {
        select.value = option.value;
      }
    };

    if (searchInput) {
      searchInput.value = normalizeText(params.get("q"));
    }
    setSelectFromParam(countryFilter, params.get("country"));
    setSelectFromParam(currencyFilter, params.get("currency"));
    setSelectFromParam(sectorFilter, params.get("sector"));
    setSelectFromParam(industryFilter, params.get("industry"));
    setSelectFromParam(exchangeFilter, params.get("exchange"));
    setSelectFromParam(sortSelect, params.get("sort"));
    setSelectFromParam(sortDirectionSelect, params.get("direction"));
    setSelectFromParam(displayCurrencyFilter, params.get("displayCurrency"));

    if (sortSelect && !normalizeText(sortSelect.value)) {
      sortSelect.value = DEFAULT_STOCK_SORT_FIELD;
    }
    if (sortDirectionSelect && !normalizeText(sortDirectionSelect.value)) {
      sortDirectionSelect.value = DEFAULT_STOCK_SORT_DIRECTION;
    }
    if (displayCurrencyFilter) {
      displayCurrency = resolveDisplayCurrency(displayCurrencyFilter.value || displayCurrency);
      displayCurrencyFilter.value = displayCurrency;
    }

    const sortCompanies = (entries, sortBy, direction) => {
      const sorted = [...entries];
      const isDescending = direction === "desc";
      const directionFactor = isDescending ? -1 : 1;

      const compareText = (aValue, bValue) => {
        const valueA = normalizeText(aValue);
        const valueB = normalizeText(bValue);
        const hasA = Boolean(valueA);
        const hasB = Boolean(valueB);

        if (!hasA && !hasB) {
          return 0;
        }
        if (!hasA) {
          return 1;
        }
        if (!hasB) {
          return -1;
        }

        const baseCompare = valueA.localeCompare(valueB, "de", { sensitivity: "base" });
        if (baseCompare === 0) {
          return 0;
        }
        return baseCompare * directionFactor;
      };

      if (sortBy === "price") {
        sorted.sort((a, b) => {
          const symbolA = normalizeCompanySymbol(a?.symbol) || normalizeText(a?.companyName);
          const symbolB = normalizeCompanySymbol(b?.symbol) || normalizeText(b?.companyName);
          const priceA = getNormalizedValue(`${symbolA}|price`, a?.price, a?.currency, ratesData);
          const priceB = getNormalizedValue(`${symbolB}|price`, b?.price, b?.currency, ratesData);

          if (priceA === null && priceB === null) {
            return compareText(a?.companyName, b?.companyName);
          }
          if (priceA === null) {
            return 1;
          }
          if (priceB === null) {
            return -1;
          }

          const difference = priceA - priceB;
          if (difference === 0) {
            return compareText(a?.companyName, b?.companyName);
          }
          return difference * directionFactor;
        });
        return sorted;
      }

      if (sortBy === "marketCap") {
        sorted.sort((a, b) => {
          const symbolA = normalizeCompanySymbol(a?.symbol);
          const symbolB = normalizeCompanySymbol(b?.symbol);
          const metricsA = symbolA ? stockMarketDataCache.get(symbolA) : null;
          const metricsB = symbolB ? stockMarketDataCache.get(symbolB) : null;
          const capA = getNormalizedValue(
            `${symbolA || normalizeText(a?.companyName)}|marketCap`,
            metricsA?.marketCap,
            metricsA?.currency || a?.currency,
            ratesData);
          const capB = getNormalizedValue(
            `${symbolB || normalizeText(b?.companyName)}|marketCap`,
            metricsB?.marketCap,
            metricsB?.currency || b?.currency,
            ratesData);

          if (capA === null && capB === null) {
            return compareText(a?.companyName, b?.companyName);
          }
          if (capA === null) {
            return 1;
          }
          if (capB === null) {
            return -1;
          }

          const difference = capA - capB;
          if (difference === 0) {
            return compareText(a?.companyName, b?.companyName);
          }
          return difference * directionFactor;
        });
        return sorted;
      }

      if (sortBy === "country") {
        sorted.sort((a, b) => {
          const countryCompare = compareText(a?.country, b?.country);
          if (countryCompare !== 0) {
            return countryCompare;
          }
          return compareText(a?.companyName, b?.companyName);
        });
        return sorted;
      }

      if (sortBy === "sector") {
        sorted.sort((a, b) => {
          const sectorCompare = compareText(a?.sector, b?.sector);
          if (sectorCompare !== 0) {
            return sectorCompare;
          }
          return compareText(a?.companyName, b?.companyName);
        });
        return sorted;
      }

      sorted.sort((a, b) => compareText(a?.companyName, b?.companyName));

      return sorted;
    };

    const updateStocksUrlState = () => {
      const nextParams = new URLSearchParams();
      const query = normalizeText(searchInput?.value);
      const selectedCountry = normalizeText(countryFilter?.value);
      const selectedCurrency = normalizeText(currencyFilter?.value);
      const selectedSector = normalizeText(sectorFilter?.value);
      const selectedIndustry = normalizeText(industryFilter?.value);
      const selectedExchange = normalizeText(exchangeFilter?.value);
      const selectedSort = normalizeText(sortSelect?.value) || DEFAULT_STOCK_SORT_FIELD;
      const selectedDirection = normalizeText(sortDirectionSelect?.value) || DEFAULT_STOCK_SORT_DIRECTION;
      const selectedDisplayCurrency = resolveDisplayCurrency(displayCurrencyFilter?.value || displayCurrency);

      if (query) {
        nextParams.set("q", query);
      }
      if (selectedCountry) {
        nextParams.set("country", selectedCountry);
      }
      if (selectedCurrency) {
        nextParams.set("currency", selectedCurrency);
      }
      if (selectedSector) {
        nextParams.set("sector", selectedSector);
      }
      if (selectedIndustry) {
        nextParams.set("industry", selectedIndustry);
      }
      if (selectedExchange) {
        nextParams.set("exchange", selectedExchange);
      }
      if (selectedSort && selectedSort !== DEFAULT_STOCK_SORT_FIELD) {
        nextParams.set("sort", selectedSort);
      }
      if (selectedDirection && selectedDirection !== DEFAULT_STOCK_SORT_DIRECTION) {
        nextParams.set("direction", selectedDirection);
      }
      if (selectedDisplayCurrency !== DEFAULT_DISPLAY_CURRENCY) {
        nextParams.set("displayCurrency", selectedDisplayCurrency);
      }

      const nextQuery = nextParams.toString();
      const nextUrl = nextQuery ? `${window.location.pathname}?${nextQuery}` : window.location.pathname;
      window.history.replaceState({}, "", nextUrl);
    };

    const applyStockFilters = async () => {
      const query = normalizeForMatch(searchInput?.value || "");
      const selectedCountry = normalizeText(countryFilter?.value);
      const selectedCurrency = normalizeText(currencyFilter?.value);
      const selectedSector = normalizeText(sectorFilter?.value);
      const selectedIndustry = normalizeText(industryFilter?.value);
      const selectedExchange = normalizeText(exchangeFilter?.value);
      const normalizedIndustry = normalizeForMatch(selectedIndustry);
      const selectedSort = normalizeText(sortSelect?.value) || DEFAULT_STOCK_SORT_FIELD;
      const selectedDirection = normalizeText(sortDirectionSelect?.value) || DEFAULT_STOCK_SORT_DIRECTION;
      displayCurrency = resolveDisplayCurrency(displayCurrencyFilter?.value || displayCurrency);

      const filtered = companies.filter((company) => {
        const matchesSearch = !query || createCompanySearchText(company).includes(query);
        const matchesCountry = !selectedCountry || normalizeText(company.country) === selectedCountry;
        const matchesCurrency = !selectedCurrency || normalizeText(company.currency) === selectedCurrency;
        const matchesSector = !selectedSector || normalizeText(company.sector) === selectedSector;
        const matchesIndustry = !normalizedIndustry || normalizeForMatch(company.industry) === normalizedIndustry;
        const matchesExchange = !selectedExchange || getStockExchangeLabel(company) === selectedExchange;
        return matchesSearch && matchesCountry && matchesCurrency && matchesSector && matchesIndustry && matchesExchange;
      });
      const sorted = sortCompanies(filtered, selectedSort, selectedDirection === "asc" ? "asc" : "desc");

      renderStockCards(list, sorted, {
        favoriteSymbols,
        onToggleFavorite: persistAndRefresh,
        displayCurrency,
        ratesData
      });
      renderFavorites();

      if (resultsCount) {
        resultsCount.textContent = `${sorted.length} von ${companies.length} Unternehmen`;
      }

      updateStocksUrlState();
    };

    const resetStocksFilters = () => {
      if (searchInput) {
        searchInput.value = "";
      }
      if (countryFilter) {
        countryFilter.value = "";
      }
      if (currencyFilter) {
        currencyFilter.value = "";
      }
      if (sectorFilter) {
        sectorFilter.value = "";
      }
      if (industryFilter) {
        industryFilter.value = "";
      }
      if (exchangeFilter) {
        exchangeFilter.value = "";
      }
      if (sortSelect) {
        sortSelect.value = DEFAULT_STOCK_SORT_FIELD;
      }
      if (sortDirectionSelect) {
        sortDirectionSelect.value = DEFAULT_STOCK_SORT_DIRECTION;
      }
      if (displayCurrencyFilter) {
        displayCurrencyFilter.value = displayCurrency;
      }
      applyStockFilters();
    };

    searchInput?.addEventListener("input", applyStockFilters);
    countryFilter?.addEventListener("change", applyStockFilters);
    currencyFilter?.addEventListener("change", applyStockFilters);
    sectorFilter?.addEventListener("change", applyStockFilters);
    industryFilter?.addEventListener("change", applyStockFilters);
    exchangeFilter?.addEventListener("change", applyStockFilters);
    sortSelect?.addEventListener("change", applyStockFilters);
    sortDirectionSelect?.addEventListener("change", applyStockFilters);
    resetButton?.addEventListener("click", resetStocksFilters);
    displayCurrencyFilter?.addEventListener("change", () => {
      displayCurrency = writeDisplayCurrency(displayCurrencyFilter.value);
      applyStockFilters();
    });

    await applyStockFilters();
  }

  function createWebsiteLink(urlText) {
    const url = normalizeText(urlText);
    if (!url) {
      return "k. A.";
    }

    const link = document.createElement("a");
    link.className = "company-external-link";
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.title = url;

    try {
      const parsedUrl = new URL(url);
      link.textContent = parsedUrl.hostname.replace(/^www\./i, "") || url;
    } catch (_) {
      link.textContent = url;
    }

    return link;
  }

  function createPrimarySecondaryValue(primaryValue, secondaryValue = "", options = {}) {
    const { secondaryLabel = "" } = options;
    const wrapper = document.createElement("span");
    wrapper.className = "value-stack";

    const primary = document.createElement("span");
    primary.className = "value-primary";
    primary.textContent = normalizeText(primaryValue) || "k. A.";
    wrapper.appendChild(primary);

    const secondaryText = normalizeText(secondaryValue);
    if (secondaryText) {
      const secondary = document.createElement("span");
      secondary.className = "value-secondary";
      secondary.textContent = secondaryLabel
        ? `${secondaryLabel}: ${secondaryText}`
        : secondaryText;
      wrapper.appendChild(secondary);
    }

    return wrapper;
  }

  function formatCurrencyWithOptionalBase(value, options = {}) {
    const {
      sourceCurrency = "",
      displayCurrency = DEFAULT_DISPLAY_CURRENCY,
      ratesData = null,
      formatter = formatCurrency
    } = options;

    const sourceCode = normalizeCurrencyForRates(sourceCurrency);
    const targetCode = normalizeCurrencyForRates(displayCurrency);
    const convertedValue = ratesData ? convertCurrencyValue(value, sourceCode, targetCode, ratesData) : null;
    const canShowConverted = convertedValue !== null && targetCode && targetCode !== sourceCode;
    const primaryValue = canShowConverted
      ? formatter(convertedValue, targetCode)
      : formatter(value, sourceCode);
    const secondaryValue = canShowConverted
      ? formatter(value, sourceCode)
      : "";

    return createPrimarySecondaryValue(primaryValue, secondaryValue, {
      secondaryLabel: sourceCode || "Basiswaehrung"
    });
  }

  function parseRangeValues(rawRange) {
    const valueText = normalizeText(rawRange);
    if (!valueText) {
      return null;
    }

    const numericMatches = valueText.match(/-?\d+(?:[.,]\d+)?/g);
    if (!Array.isArray(numericMatches) || numericMatches.length < 2) {
      return null;
    }

    const firstValue = toNumber(numericMatches[0]);
    const secondValue = toNumber(numericMatches[1]);
    if (firstValue === null || secondValue === null) {
      return null;
    }

    return {
      low: Math.min(firstValue, secondValue),
      high: Math.max(firstValue, secondValue)
    };
  }

  function createRangeFactItems(rangeValue, options = {}) {
    const {
      sourceCurrency = "",
      displayCurrency = DEFAULT_DISPLAY_CURRENCY,
      ratesData = null
    } = options;

    const parsedRange = parseRangeValues(rangeValue);
    if (!parsedRange) {
      return [{
        label: "52W-Range",
        value: normalizeText(rangeValue) || "k. A."
      }];
    }

    const sourceCode = normalizeCurrencyForRates(sourceCurrency);
    const targetCode = normalizeCurrencyForRates(displayCurrency);
    const lowConverted = ratesData ? convertCurrencyValue(parsedRange.low, sourceCode, targetCode, ratesData) : null;
    const highConverted = ratesData ? convertCurrencyValue(parsedRange.high, sourceCode, targetCode, ratesData) : null;
    const canShowConverted = lowConverted !== null
      && highConverted !== null
      && targetCode
      && targetCode !== sourceCode;

    const resolvedCurrency = canShowConverted ? targetCode : sourceCode;
    const lowDisplay = canShowConverted ? lowConverted : parsedRange.low;
    const highDisplay = canShowConverted ? highConverted : parsedRange.high;
    const spreadDisplay = highDisplay - lowDisplay;

    const secondaryLow = canShowConverted ? formatCurrency(parsedRange.low, sourceCode) : "";
    const secondaryHigh = canShowConverted ? formatCurrency(parsedRange.high, sourceCode) : "";
    const secondarySpread = canShowConverted ? formatCurrency(parsedRange.high - parsedRange.low, sourceCode) : "";
    const secondaryLabel = sourceCode || "Basiswaehrung";

    return [
      {
        label: "52W Tief",
        value: createPrimarySecondaryValue(
          formatCurrency(lowDisplay, resolvedCurrency),
          secondaryLow,
          { secondaryLabel }
        )
      },
      {
        label: "52W Hoch",
        value: createPrimarySecondaryValue(
          formatCurrency(highDisplay, resolvedCurrency),
          secondaryHigh,
          { secondaryLabel }
        )
      },
      {
        label: "52W Spanne",
        value: createPrimarySecondaryValue(
          formatCurrency(spreadDisplay, resolvedCurrency),
          secondarySpread,
          { secondaryLabel }
        )
      }
    ];
  }

  function createStocksFilterLink(value, key) {
    const filterValue = normalizeText(value);
    const filterKey = normalizeText(key);

    if (!filterValue || !filterKey) {
      return null;
    }

    const link = document.createElement("a");
    link.className = "company-filter-link";
    link.href = `${basePath}/aktien.html?${encodeURIComponent(filterKey)}=${encodeURIComponent(filterValue)}`;
    link.textContent = filterValue;
    return link;
  }

  function resolveCompanyField(company, fallbackEntry, field) {
    const primary = normalizeText(company?.[field]);
    if (primary) {
      return primary;
    }
    return normalizeText(fallbackEntry?.[field]);
  }

  function findSimilarCompanies(index, company, fallbackEntry, limit = 3) {
    if (!Array.isArray(index) || !index.length) {
      return [];
    }

    const currentSymbol = normalizeCompanySymbol(company?.symbol || fallbackEntry?.symbol);
    const targetIndustry = normalizeForMatch(resolveCompanyField(company, fallbackEntry, "industry"));
    const targetSector = normalizeForMatch(resolveCompanyField(company, fallbackEntry, "sector"));

    if (!targetIndustry && !targetSector) {
      return [];
    }

    return index
      .map((entry) => {
        const symbol = normalizeCompanySymbol(entry?.symbol);
        if (!symbol || symbol === currentSymbol) {
          return null;
        }

        const industry = normalizeForMatch(entry?.industry);
        const sector = normalizeForMatch(entry?.sector);

        if (targetIndustry && industry && industry === targetIndustry) {
          return { ...entry, symbol, priority: 0 };
        }

        if (targetSector && sector && sector === targetSector) {
          return { ...entry, symbol, priority: 1 };
        }

        return null;
      })
      .filter(Boolean)
      .sort((a, b) => {
        if (a.priority !== b.priority) {
          return a.priority - b.priority;
        }
        return normalizeText(a.companyName).localeCompare(normalizeText(b.companyName), "de");
      })
      .slice(0, Math.max(0, limit));
  }

  function createSimilarCompaniesSection(similarCompanies, options = {}) {
    const {
      sectionId = "",
      title = "Aehnliche Unternehmen",
      extraClassName = ""
    } = options;

    const section = document.createElement("section");
    section.className = `card company-wiki-section company-similar-section ${normalizeText(extraClassName)}`.trim();
    if (sectionId) {
      section.id = sectionId;
    }
    section.setAttribute("aria-labelledby", `${sectionId || "aehnliche-unternehmen"}-title`);

    const heading = document.createElement("h2");
    heading.id = `${sectionId || "aehnliche-unternehmen"}-title`;
    heading.className = "company-section-title";
    heading.textContent = title;
    section.appendChild(heading);

    const entries = Array.isArray(similarCompanies) ? similarCompanies : [];
    if (!entries.length) {
      const hint = document.createElement("p");
      hint.className = "muted company-similar-empty";
      hint.textContent = "Aktuell sind keine passenden Unternehmen verfuegbar.";
      section.appendChild(hint);
      return section;
    }

    const list = document.createElement("ul");
    list.className = "company-similar-list";

    entries.forEach((entry) => {
      const symbol = normalizeCompanySymbol(entry?.symbol);
      if (!symbol) {
        return;
      }

      const companyName = normalizeText(entry?.companyName) || symbol;
      const item = document.createElement("li");
      const link = document.createElement("a");
      link.className = "company-similar-link";
      link.href = `${basePath}/pages/unternehmen.html?symbol=${encodeURIComponent(symbol)}`;
      link.setAttribute("aria-label", `${companyName} (${symbol}) - zur Unternehmensseite`);

      const nameNode = document.createElement("span");
      nameNode.className = "company-similar-name";
      nameNode.textContent = companyName;

      const symbolNode = document.createElement("span");
      symbolNode.className = "company-similar-symbol";
      symbolNode.textContent = symbol;

      link.append(nameNode, symbolNode);
      item.appendChild(link);
      list.appendChild(item);
    });

    if (!list.children.length) {
      const hint = document.createElement("p");
      hint.className = "muted company-similar-empty";
      hint.textContent = "Aktuell sind keine passenden Unternehmen verfuegbar.";
      section.appendChild(hint);
      return section;
    }

    section.appendChild(list);
    return section;
  }

  function createCompanyAnchorNavigation() {
    const nav = document.createElement("nav");
    nav.className = "company-anchor-nav article-toc";
    nav.setAttribute("aria-label", "Inhalt");

    const title = document.createElement("h3");
    title.className = "company-anchor-title";
    title.textContent = "Inhalt";

    const list = document.createElement("ul");
    list.className = "company-anchor-list";

    [
      { id: "summary", label: "Summary" },
      { id: "beschreibung", label: "Beschreibung" },
      { id: "kennzahlen", label: "Kennzahlen" },
      { id: "analyse", label: "Analyse" },
      { id: "aehnliche-unternehmen", label: "Aehnliche Unternehmen" }
    ].forEach((entry) => {
      const item = document.createElement("li");
      const link = document.createElement("a");
      link.className = "company-anchor-link";
      link.href = `#${entry.id}`;
      link.dataset.targetSection = entry.id;
      link.textContent = entry.label;
      item.appendChild(link);
      list.appendChild(item);
    });

    nav.append(title, list);
    return nav;
  }

  function createCompanyFactsGroup(title, items) {
    const group = document.createElement("section");
    group.className = "company-fact-group";

    const heading = document.createElement("h3");
    heading.textContent = title;

    const list = document.createElement("dl");
    list.className = "stock-meta detail-facts";
    items.forEach((item) => {
      appendFact(list, item.label, item.value);
    });

    group.append(heading, list);
    return group;
  }

  function appendParagraphs(target, text) {
    const normalized = normalizeText(text);
    if (!normalized) {
      const paragraph = document.createElement("p");
      paragraph.textContent = "Keine Beschreibung vorhanden.";
      target.appendChild(paragraph);
      return;
    }

    const parts = normalized.split(/\n+/).map((part) => part.trim()).filter(Boolean);
    const paragraphs = parts.length ? parts : [normalized];
    paragraphs.forEach((part) => {
      const paragraph = document.createElement("p");
      paragraph.textContent = part;
      target.appendChild(paragraph);
    });
  }

  function setupCompanyAnchorNavigation(container) {
    const nav = container.querySelector(".company-anchor-nav");
    if (!nav) {
      return;
    }

    const links = [...nav.querySelectorAll(".company-anchor-link")];
    if (!links.length) {
      return;
    }

    const sections = links
      .map((link) => normalizeText(link.dataset.targetSection))
      .map((id) => id ? document.getElementById(id) : null)
      .filter((section) => section && container.contains(section));
    const sectionById = new Map(sections.map((section) => [section.id, section]));

    const setActiveLink = (sectionId) => {
      links.forEach((link) => {
        const isActive = normalizeText(link.dataset.targetSection) === sectionId;
        link.classList.toggle("is-active", isActive);
        if (isActive) {
          link.setAttribute("aria-current", "true");
        } else {
          link.removeAttribute("aria-current");
        }
      });
    };

    links.forEach((link) => {
      link.addEventListener("click", () => {
        const targetSection = normalizeText(link.dataset.targetSection);
        if (!targetSection) {
          return;
        }
        setActiveLink(targetSection);
      });
    });

    const activeHash = normalizeText(window.location.hash).replace(/^#/, "");
    if (activeHash && sectionById.has(activeHash)) {
      setActiveLink(activeHash);
    } else if (sections.length) {
      setActiveLink(sections[0].id);
    }

    const previousObserver = container.__companySectionObserver;
    if (previousObserver && typeof previousObserver.disconnect === "function") {
      previousObserver.disconnect();
    }

    if ("IntersectionObserver" in window && sections.length) {
      const observer = new IntersectionObserver((entries) => {
        let topEntry = null;
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }
          if (!topEntry || entry.intersectionRatio > topEntry.intersectionRatio) {
            topEntry = entry;
          }
        });

        if (topEntry?.target?.id) {
          setActiveLink(topEntry.target.id);
        }
      }, {
        rootMargin: "-35% 0px -52% 0px",
        threshold: [0.2, 0.35, 0.5, 0.75]
      });

      sections.forEach((section) => observer.observe(section));
      container.__companySectionObserver = observer;
    }

    window.requestAnimationFrame(() => {
      const hashId = normalizeText(window.location.hash).replace(/^#/, "");
      if (!hashId || !sectionById.has(hashId)) {
        return;
      }
      sectionById.get(hashId).scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
      setActiveLink(hashId);
    });
  }

  function renderCompanyDetail(container, company, options = {}) {
    const {
      favoriteSymbols = new Set(),
      onToggleFavorite = null,
      similarCompanies = [],
      displayCurrency = DEFAULT_DISPLAY_CURRENCY,
      ratesData = null,
      onDisplayCurrencyChange = null
    } = options;
    container.innerHTML = "";

    const symbol = normalizeCompanySymbol(company.symbol);
    const companyName = normalizeText(company.companyName) || symbol || "Unternehmen";
    const fullDescription = normalizeText(company.description) || "Keine Beschreibung vorhanden.";
    const tone = getChangeTone(company.changePercentage);
    const selectedDisplayCurrency = resolveDisplayCurrency(displayCurrency);
    const companyCurrency = normalizeText(company.currency);
    const displayPrice = ratesData
      ? convertCurrencyValue(company.price, companyCurrency, selectedDisplayCurrency, ratesData)
      : null;
    const displayChange = ratesData
      ? convertCurrencyValue(company.change, companyCurrency, selectedDisplayCurrency, ratesData)
      : null;
    const backLink = document.createElement("a");
    backLink.className = "back-link";
    backLink.href = `${basePath}/aktien.html`;
    backLink.textContent = "\u2190 Zur Maerkte-Uebersicht";

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
    const titleRow = document.createElement("div");
    titleRow.className = "company-title-row";
    titleRow.append(
      title,
      createFavoriteButton(symbol, favoriteSymbols.has(symbol), onToggleFavorite)
    );

    const classification = document.createElement("p");
    classification.className = "company-classification";
    const sectorLink = createStocksFilterLink(company.sector, "sector");
    const industryLink = createStocksFilterLink(company.industry, "industry");
    classification.appendChild(document.createTextNode("Sektor: "));
    classification.appendChild(sectorLink || document.createTextNode("k. A."));
    classification.appendChild(document.createTextNode(" | Branche: "));
    classification.appendChild(industryLink || document.createTextNode("k. A."));

    const heroLead = document.createElement("p");
    heroLead.className = "company-hero-lead";
    heroLead.textContent = shortenText(fullDescription, 240);

    const marketSnapshot = document.createElement("aside");
    marketSnapshot.className = "company-market-snapshot";

    const currencyField = document.createElement("div");
    currencyField.className = "field company-currency-switch";
    const currencyLabel = document.createElement("label");
    currencyLabel.setAttribute("for", "company-display-currency");
    currencyLabel.textContent = "Anzeigewaehrung";
    const currencySelect = document.createElement("select");
    currencySelect.id = "company-display-currency";
    currencySelect.setAttribute("aria-label", "Anzeigewaehrung");
    [
      { value: "EUR", label: "EUR" },
      { value: "USD", label: "USD" }
    ].forEach((entry) => {
      const option = document.createElement("option");
      option.value = entry.value;
      option.textContent = entry.label;
      currencySelect.appendChild(option);
    });
    currencySelect.value = selectedDisplayCurrency;
    if (typeof onDisplayCurrencyChange === "function") {
      currencySelect.addEventListener("change", () => {
        onDisplayCurrencyChange(currencySelect.value);
      });
    }
    currencyField.append(currencyLabel, currencySelect);

    const priceBox = document.createElement("div");
    priceBox.className = "company-price-block";
    const priceLabel = document.createElement("span");
    priceLabel.className = "company-metric-label";
    priceLabel.textContent = "Kurs";
    const priceValue = document.createElement("strong");
    priceValue.className = "company-price-value";
    priceValue.textContent = displayPrice === null
      ? formatCurrency(company.price, companyCurrency)
      : formatCurrency(displayPrice, selectedDisplayCurrency);
    const priceOriginal = document.createElement("span");
    priceOriginal.className = "muted company-original-currency";
    const baseCurrencyCode = normalizeCurrencyForRates(companyCurrency);
    priceOriginal.textContent = `${baseCurrencyCode || "Basiswaehrung"}: ${formatCurrency(company.price, companyCurrency)}`;
    priceBox.append(priceLabel, priceValue, priceOriginal);

    const changeBox = document.createElement("div");
    changeBox.className = `company-change-row tone-${tone}`;
    const changeLabel = document.createElement("span");
    changeLabel.className = "company-metric-label";
    changeLabel.textContent = "Veraenderung";
    const changeValue = document.createElement("strong");
    changeValue.className = "company-change-value";
    const signedChange = displayChange === null
      ? formatSignedCurrency(company.change, companyCurrency)
      : formatSignedCurrency(displayChange, selectedDisplayCurrency);
    changeValue.textContent = `${signedChange} (${formatPercent(company.changePercentage)})`;
    changeBox.append(changeLabel, changeValue);

    marketSnapshot.append(currencyField, priceBox, changeBox);
    headMain.append(topMeta, titleRow, classification, heroLead);
    header.append(logoWrap, headMain, marketSnapshot);

    const anchorNavigation = createCompanyAnchorNavigation();

    const addressParts = [
      normalizeText(company.address),
      normalizeText(company.city),
      normalizeText(company.state),
      normalizeText(company.zip),
      normalizeText(company.country)
    ].filter(Boolean);
    const rangeFactItems = createRangeFactItems(company.range, {
      sourceCurrency: companyCurrency,
      displayCurrency: selectedDisplayCurrency,
      ratesData
    });

    const summarySection = document.createElement("section");
    summarySection.id = "summary";
    summarySection.className = "card company-wiki-section";
    summarySection.setAttribute("aria-labelledby", "summary-title");

    const summaryTitle = document.createElement("h2");
    summaryTitle.id = "summary-title";
    summaryTitle.className = "company-section-title";
    summaryTitle.textContent = "Summary";

    const summaryIntro = document.createElement("p");
    summaryIntro.className = "company-section-lead";
    summaryIntro.textContent = `Kompakter Ueberblick zu ${companyName} mit den wichtigsten Einordnungen und Kennzahlen.`;

    const summaryGrid = document.createElement("div");
    summaryGrid.className = "company-summary-grid";
    summaryGrid.append(
      createCompanyFactsGroup("Unternehmensprofil kompakt", [
        { label: "CEO", value: company.ceo },
        { label: "Mitarbeitende", value: formatNumber(company.fullTimeEmployees) },
        { label: "Sitz", value: composeLocation(company) },
        { label: "Website", value: createWebsiteLink(company.website) }
      ]),
      createCompanyFactsGroup("Status / Klassifikation", [
        { label: "ETF", value: createStatusPill(company.isEtf) },
        { label: "Fund", value: createStatusPill(company.isFund) },
        { label: "ADR", value: createStatusPill(company.isAdr) },
        { label: "Aktiv gehandelt", value: createStatusPill(company.isActivelyTrading) }
      ]),
      createCompanyFactsGroup("Wichtigste Kennzahlen", [
        {
          label: "Kurs",
          value: formatCurrencyWithOptionalBase(company.price, {
            sourceCurrency: companyCurrency,
            displayCurrency: selectedDisplayCurrency,
            ratesData,
            formatter: formatCurrency
          })
        },
        {
          label: "Market Cap",
          value: formatCurrencyWithOptionalBase(company.marketCap, {
            sourceCurrency: companyCurrency,
            displayCurrency: selectedDisplayCurrency,
            ratesData,
            formatter: formatCompactCurrency
          })
        },
        ...rangeFactItems.slice(0, 2),
        { label: "Volume", value: formatCompactNumber(company.volume) }
      ])
    );
    summarySection.append(summaryTitle, summaryIntro, summaryGrid);

    const descriptionSection = document.createElement("section");
    descriptionSection.id = "beschreibung";
    descriptionSection.className = "card company-wiki-section";
    descriptionSection.setAttribute("aria-labelledby", "beschreibung-title");

    const descriptionTitle = document.createElement("h2");
    descriptionTitle.id = "beschreibung-title";
    descriptionTitle.className = "company-section-title";
    descriptionTitle.textContent = "Beschreibung";

    const descriptionBody = document.createElement("div");
    descriptionBody.className = "company-text-content";
    appendParagraphs(descriptionBody, fullDescription);
    descriptionSection.append(descriptionTitle, descriptionBody);

    const metricsSection = document.createElement("section");
    metricsSection.id = "kennzahlen";
    metricsSection.className = "card company-wiki-section";
    metricsSection.setAttribute("aria-labelledby", "kennzahlen-title");

    const metricsTitle = document.createElement("h2");
    metricsTitle.id = "kennzahlen-title";
    metricsTitle.className = "company-section-title";
    metricsTitle.textContent = "Kennzahlen";

    const metricsGroups = document.createElement("div");
    metricsGroups.className = "company-fact-groups";
    metricsGroups.append(
      createCompanyFactsGroup("Boersen- und Handelsdaten", [
        {
          label: "Market Cap",
          value: formatCurrencyWithOptionalBase(company.marketCap, {
            sourceCurrency: companyCurrency,
            displayCurrency: selectedDisplayCurrency,
            ratesData,
            formatter: formatCompactCurrency
          })
        },
        { label: "Beta", value: formatNumber(company.beta, { maximumFractionDigits: 3 }) },
        {
          label: "Dividende",
          value: formatCurrencyWithOptionalBase(company.lastDividend, {
            sourceCurrency: companyCurrency,
            displayCurrency: selectedDisplayCurrency,
            ratesData,
            formatter: formatCurrency
          })
        },
        ...rangeFactItems,
        { label: "Volume", value: formatCompactNumber(company.volume) },
        { label: "Average Volume", value: formatCompactNumber(company.averageVolume) }
      ]),
      createCompanyFactsGroup("Unternehmens- und Stammdaten", [
        { label: "Symbol", value: symbol || "k. A." },
        { label: "Boerse", value: normalizeText(company.exchangeFullName) || normalizeText(company.exchange) || "k. A." },
        { label: "Waehrung", value: createCurrencyDisplayNode(company.currency) || normalizeText(company.currency) || "k. A." },
        { label: "Land", value: createCountryDisplayNode(company.country) || normalizeText(company.country) || "k. A." },
        { label: "IPO-Datum", value: formatDate(company.ipoDate) },
        { label: "Adresse", value: addressParts.join(", ") || "k. A." },
        { label: "Telefon", value: company.phone },
        { label: "Website", value: createWebsiteLink(company.website) }
      ]),
      createCompanyFactsGroup("Identifikatoren", [
        { label: "CIK", value: company.cik },
        { label: "ISIN", value: company.isin },
        { label: "CUSIP", value: company.cusip }
      ])
    );
    metricsSection.append(metricsTitle, metricsGroups);

    const analysisSection = document.createElement("section");
    analysisSection.id = "analyse";
    analysisSection.className = "card company-wiki-section";
    analysisSection.setAttribute("aria-labelledby", "analyse-title");

    const analysisTitle = document.createElement("h2");
    analysisTitle.id = "analyse-title";
    analysisTitle.className = "company-section-title";
    analysisTitle.textContent = "Analyse";

    const analysisIntro = document.createElement("p");
    analysisIntro.className = "company-section-lead";
    analysisIntro.textContent = "Dieser Bereich ist fuer weiterfuehrende, strukturierte Einschaetzungen vorbereitet.";

    const analysisGrid = document.createElement("div");
    analysisGrid.className = "company-analysis-grid";
    [
      { title: "Chancen", text: "Treiber wie Innovation, Expansion und neue Produktlinien koennen hier bewertet werden." },
      { title: "Risiken", text: "Risiken wie Regulierung, Nachfragezyklen, Kostenentwicklung oder operative Abhaengigkeiten." },
      { title: "Konkurrenz", text: "Einordnung direkter Wettbewerber sowie Differenzierungsmerkmale im Marktumfeld." },
      { title: "Marktmacht", text: "Bewertung von Preissetzungsspielraum, Netzwerkeffekten und strukturellen Wettbewerbsvorteilen." }
    ].forEach((entry) => {
      const card = document.createElement("article");
      card.className = "company-analysis-item";
      const title = document.createElement("h3");
      title.textContent = entry.title;
      const text = document.createElement("p");
      text.textContent = entry.text;
      card.append(title, text);
      analysisGrid.appendChild(card);
    });
    analysisSection.append(analysisTitle, analysisIntro, analysisGrid);

    const similarSection = createSimilarCompaniesSection(similarCompanies, {
      sectionId: "aehnliche-unternehmen",
      title: "Aehnliche Unternehmen"
    });

    const contentColumn = document.createElement("div");
    contentColumn.className = "company-content-column";
    contentColumn.append(
      header,
      summarySection,
      descriptionSection,
      metricsSection,
      analysisSection,
      similarSection
    );

    const tocColumn = document.createElement("aside");
    tocColumn.className = "company-toc-column";
    tocColumn.appendChild(anchorNavigation);

    const wikiLayout = document.createElement("div");
    wikiLayout.className = "company-wiki-layout";
    wikiLayout.append(tocColumn, contentColumn);

    container.classList.add("company-detail-page");
    container.append(backLink, wikiLayout);
    setupCompanyAnchorNavigation(container);
  }

  async function initCompanyDetail() {
    const article = document.querySelector("#company-detail");
    if (!article) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const symbol = normalizeCompanySymbol(params.get("symbol"));

    if (!symbol) {
      renderMessage(article, "Kein Unternehmenssymbol uebergeben. Bitte waehlen Sie ein Unternehmen aus der Maerkte-Uebersicht.", true);
      return;
    }

    renderMessage(article, "Unternehmensdaten werden geladen ...");

    const [index, ratesData] = await Promise.all([
      loadCompanyIndex(),
      loadExchangeRates()
    ]);
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
    let favoriteSymbols = new Set(readFavorites());
    let displayCurrency = readDisplayCurrency();
    const similarCompanies = findSimilarCompanies(index, company, entry, 3);

    const persistAndRender = (nextSymbol) => {
      const normalizedSymbol = normalizeCompanySymbol(nextSymbol);
      if (!normalizedSymbol) {
        return;
      }

      if (favoriteSymbols.has(normalizedSymbol)) {
        favoriteSymbols.delete(normalizedSymbol);
      } else {
        favoriteSymbols.add(normalizedSymbol);
      }

      writeFavorites([...favoriteSymbols]);
      renderCompanyDetail(article, company, {
        favoriteSymbols,
        onToggleFavorite: persistAndRender,
        similarCompanies,
        displayCurrency,
        ratesData,
        onDisplayCurrencyChange: updateDisplayCurrency
      });
    };

    const updateDisplayCurrency = (nextCurrency) => {
      displayCurrency = writeDisplayCurrency(nextCurrency);
      renderCompanyDetail(article, company, {
        favoriteSymbols,
        onToggleFavorite: persistAndRender,
        similarCompanies,
        displayCurrency,
        ratesData,
        onDisplayCurrencyChange: updateDisplayCurrency
      });
    };

    renderCompanyDetail(article, company, {
      favoriteSymbols,
      onToggleFavorite: persistAndRender,
      similarCompanies,
      displayCurrency,
      ratesData,
      onDisplayCurrencyChange: updateDisplayCurrency
    });
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

      if (page === "exchange-rates") {
        await initExchangeRates();
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

