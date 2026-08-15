const DataProduct = require("../models/DataProduct");
const ProductOverride = require("../models/ProductOverride");

const NETWORKS = {
  mtn: "MTN",
  airtel: "Airtel",
  glo: "Glo",
  "9mobile": "9mobile",
  etisalat: "9mobile"
};

const CATEGORIES = [
  "SME",
  "SME 2",
  "Awoof",
  "Gifting",
  "Corporate",
  "Standard"
];

function normalizeNetwork(value) {
  const text = String(value || "").trim().toLowerCase();

  for (const key of Object.keys(NETWORKS)) {
    if (text.includes(key)) {
      return NETWORKS[key];
    }
  }

  return null;
}

function normalizeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function calculateSellingPrice(cost) {
  cost = normalizeNumber(cost);

  if (cost < 500) {
    return Math.round(cost + 22);
  }

  if (cost <= 1000) {
    return Math.round(cost + 52);
  }

  if (cost <= 5000) {
    return Math.round(cost + 102);
  }

  if (cost <= 10000) {
    return Math.round(cost + 150);
  }

  return Math.round(cost + 200);
}

function normalizeCategory(plan) {
  const name = [
    plan?.category,
    plan?.type,
    plan?.data_plan,
    plan?.name
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (
    name.includes("sme 2") ||
    name.includes("sme2")
  ) {
    return "SME 2";
  }

  if (name.includes("sme")) {
    return "SME";
  }

  if (name.includes("gift")) {
    return "Gifting";
  }

  if (name.includes("corporate")) {
    return "Corporate";
  }

  if (
    name.includes("awoof") ||
    name.includes("weekend") ||
    name.includes("sunday") ||
    name.includes("1 day") ||
    normalizeNumber(
      plan.reseller_price || plan.price
    ) <= 500
  ) {
    return "Awoof";
  }

  return "Standard";
}

function normalizePlan(plan, provider) {
  if (!plan || !provider) {
    return null;
  }

  const network = normalizeNetwork(
    plan.network ||
    plan.service_name
  );

  if (!network) {
    return null;
  }

  let providerPlanId =
    plan.providerPlanId ??
    plan.provider_plan_id ??
    plan.id ??
    plan.plan_id ??
    plan.variation_id;

  if (
    providerPlanId === undefined ||
    providerPlanId === null
  ) {
    return null;
  }

  /*
   * OPLUG may expose the same plan using two identifiers:
   *
   *   85
   *   provider_9mobile_85
   *
   * These are the same OPLUG route, not two routes.
   *
   * Canonicalize only the known OPLUG provider_<network>_<id>
   * format. Other providers keep their original IDs untouched.
   */
  if (
    String(provider).toLowerCase() === "oplug"
  ) {

    const idText =
      String(providerPlanId).trim();

    const networkSlug =
      String(network)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "");

    const match =
      idText.match(
        /^provider_(9mobile|etisalat|mtn|airtel|glo)_(.+)$/i
      );

    if (match) {

      const idNetwork =
        match[1]
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "");

      if (
        idNetwork === networkSlug ||
        (
          idNetwork === "etisalat" &&
          networkSlug === "9mobile"
        )
      ) {
        providerPlanId =
          String(match[2]);
      }
    }
  }

  const costPrice = normalizeNumber(
    plan.costPrice ??
    plan.providerPrice ??
    plan.reseller_price ??
    plan.price ??
    plan.amount
  );

  if (costPrice <= 0) {
    return null;
  }

  // Normalize data size and extract validity embedded in the
  // datasize string.
  //
  // Examples:
  //   "750mb - 1day"              -> datasize "750MB", validity "1 Days"
  //   "2.5GB - 2days"             -> datasize "2.5GB", validity "2 Days"
  //   "10GB - 7days"              -> datasize "10GB", validity "7 Days"
  //   "16.5GB + 25mins - 30days"  -> datasize "16.5GB+25MINS", validity "30 Days"
  //
  // This prevents formatting differences from creating duplicate
  // DataProducts.

  function normalizeDatasize(value) {
    let text = String(value || "")
      .trim()
      .replace(/\s+/g, " ")
      .toUpperCase();

    /*
     * Some providers put the network name inside the datasize/name:
     *
     *   "Glo 1GB"       -> "1GB"
     *   "MTN 2GB"       -> "2GB"
     *   "Airtel 500MB"  -> "500MB"
     *
     * Only remove a known network prefix.
     * Do NOT strip arbitrary words because descriptions such as
     * "250MB NIGHT PLAN" must remain intact.
     */
    const networkPrefix = new RegExp(
      "^(?:MTN|AIRTEL|GLO|9MOBILE|ETISALAT)\\s+",
      "i"
    );

    text = text.replace(
      networkPrefix,
      ""
    );

    return text
      .trim()
      .replace(/\s+/g, "")
      .toUpperCase();
  }

  function extractEmbeddedValidity(value) {
    const text = String(value || "")
      .trim()
      .replace(/\s+/g, " ");

    /*
     * Validity may appear before a trailing description.
     *
     * Examples:
     *
     *   "750MB - 1day"
     *     -> "750MB", "1 Days"
     *
     *   "2.5GB - 2days"
     *     -> "2.5GB", "2 Days"
     *
     *   "300.0 GB - 90 days"
     *     -> "300.0 GB", "90 Days"
     *
     *   "18GB - 14days (New)"
     *     -> "18GB (New)", "14 Days"
     *
     *   "5GB - 30days (Promo: N399/GB)"
     *     -> "5GB (Promo: N399/GB)", "30 Days"
     *
     * The old implementation required the validity to be at the
     * very end of the string. That caused values such as
     * "18GB - 14days (New)" to remain embedded in datasize.
     */

    const match = text.match(
      /\s*-\s*(\d+(?:\.\d+)?)\s*(day|days|week|weeks|month|months)\b/i
    );

    if (!match) {
      return {
        datasize: text,
        validity: ""
      };
    }

    const number = match[1];
    const unit = match[2].toLowerCase();

    let normalizedUnit = "Days";

    if (unit === "week" || unit === "weeks") {
      normalizedUnit = "Weeks";
    } else if (unit === "month" || unit === "months") {
      normalizedUnit = "Months";
    }

    /*
     * Remove only the "- N days/weeks/months" portion.
     *
     * Anything after it, such as "(New)" or "(Promo: ...)",
     * remains part of the descriptive datasize.
     */
    const datasize = (
      text.slice(0, match.index) +
      text.slice(match.index + match[0].length)
    )
      .replace(/\s+/g, " ")
      .trim();

    const normalizedValidity =
      normalizedUnit === "Days"
        ? `${number} Day${Number(number) === 1 ? "" : "s"}`
        : normalizedUnit === "Weeks"
          ? `${number} Week${Number(number) === 1 ? "" : "s"}`
          : `${number} Month${Number(number) === 1 ? "" : "s"}`;

    return {
      datasize,
      validity: normalizedValidity
    };
  }

  // Normalize validity.
  // Examples:
  //   "30"       -> "30 Days"
  //   "30 Days"  -> "30 Days"
  //   "7 day"    -> "7 Days"
  //   "4 weeks"  -> "4 Weeks"
  //   undefined  -> ""
  function normalizeValidity(value) {
    if (
      value === undefined ||
      value === null ||
      String(value).trim() === ""
    ) {
      return "";
    }

    let text = String(value)
      .trim()
      .replace(/\s+/g, " ");

    // Reject malformed/meaningless validity values.
    // In particular, never create "0 Days".
    if (
      /^0(?:\.0+)?\s*(day|days|week|weeks|month|months)?$/i.test(text)
    ) {
      return "";
    }

    // Repair accidental duplicated units such as:
    // "1 days days" -> "1 Day"
    // "2 day days"  -> "2 Days"
    const duplicated = text.match(
      /^(\d+(?:\.\d+)?)\s*(day|days|week|weeks|month|months)\s+\2$/i
    );

    if (duplicated) {
      text = `${duplicated[1]} ${duplicated[2]}`;
    }

    if (/^\d+(?:\.\d+)?$/.test(text)) {
      const number = Number(text);

      if (!Number.isFinite(number) || number <= 0) {
        return "";
      }

      return `${text} Day${Number(text) === 1 ? "" : "s"}`;
    }

    const match = text.match(
      /^(\d+(?:\.\d+)?)\s*(day|days|week|weeks|month|months)$/i
    );

    if (match) {
      const number = Number(match[1]);
      const unit = match[2].toLowerCase();

      if (!Number.isFinite(number) || number <= 0) {
        return "";
      }

      if (unit === "day" || unit === "days") {
        return `${match[1]} Day${number === 1 ? "" : "s"}`;
      }

      if (unit === "week" || unit === "weeks") {
        return `${match[1]} Week${number === 1 ? "" : "s"}`;
      }

      return `${match[1]} Month${number === 1 ? "" : "s"}`;
    }

    return "";
  }

  const rawDatasize =
    plan.datasize ||
    plan.size ||
    plan.data_plan ||
    plan.plan ||
    plan.name ||
    "";

  const extracted =
    extractEmbeddedValidity(rawDatasize);

  /*
   * Some providers put the validity in the name rather than
   * datasize. If datasize did not contain it, inspect the name.
   */
  const extractedFromName =
    extracted.validity
      ? extracted
      : extractEmbeddedValidity(
          plan.name ||
          plan.data_plan ||
          ""
        );

  const finalExtractedValidity =
    extracted.validity ||
    extractedFromName.validity ||
    "";

  const datasizeSource =
    extracted.validity
      ? extracted.datasize
      : extractedFromName.validity
        ? extractedFromName.datasize
        : rawDatasize;

  const datasize =
    normalizeDatasize(datasizeSource)
      .replace(/\s*([+])\s*/g, "$1")
      .replace(/\s*([/-])\s*/g, "$1");

  const explicitValidity =
    plan.validity ??
    plan.day;

  const explicitValidityText =
    explicitValidity === undefined ||
    explicitValidity === null
      ? ""
      : String(explicitValidity).trim();

  const normalizedExplicitValidity =
    explicitValidityText &&
    !/^undefined\s*days?$/i.test(explicitValidityText)
      ? normalizeValidity(explicitValidity)
      : "";

  /*
   * Prefer a valid explicit provider value.
   * Otherwise use validity extracted from datasize/name.
   *
   * Invalid values such as 0, undefined, or malformed duplicated
   * units must never become part of productKey.
   */
  const validity =
    String(provider).toLowerCase() === "oplug"
      ? normalizedExplicitValidity
      : (
          normalizedExplicitValidity ||
          finalExtractedValidity
        );

  let name = String(
    plan.name ||
    plan.data_plan ||
    ""
  ).trim();

  const category = normalizeCategory(plan);

  /*
   * Product identity deliberately does NOT contain provider.
   *
   * This is what allows:
   *
   * Oplug MTN 5GB
   * BlitzPay MTN 5GB
   * NewAPI MTN 5GB
   *
   * to become one product with multiple provider routes.
   */
  const productKey = [
    network.toLowerCase(),
    category.toLowerCase(),
    datasize.toLowerCase(),
    validity.toLowerCase()
  ].join(":");

  return {
    productKey,

    network,
    category,

    name,
    datasize,
    validity,

    providerRoute: {
      provider: String(provider).toLowerCase(),
      providerPlanId: String(providerPlanId),
      costPrice,
      sellingPrice: calculateSellingPrice(costPrice),
      active: true,
      priority: 100,
      lastSeenAt: new Date()
    },

    original: plan
  };
}

async function syncProducts(plans) {

  /*
   * ProductOverride remains the admin source of truth.
   * A disabled provider route must never be reactivated
   * simply because the provider appeared again.
   */
  let inactiveOverrides = [];

  try {

    inactiveOverrides =
      await ProductOverride.find({
        active: false
      })
      .select("productId provider network providerPlanId")
      .lean();

  } catch(error) {

    console.log(
      "⚠️ DataProduct ProductOverride read error:",
      error.message
    );

  }

  const inactiveIds = new Set(
    inactiveOverrides.map(
      item => String(item.productId)
    )
  );

  /*
   * Individual admin selling-price overrides.
   *
   * ProductOverride is per provider + network + providerPlanId.
   * An override affects ONLY that specific provider route.
   *
   * Provider cost remains untouched.
   */
  let sellingPriceOverrides = [];

  try {

    sellingPriceOverrides =
      await ProductOverride.find({
        sellingPrice: {
          $gt: 0
        }
      })
      .select(
        "productId provider network providerPlanId sellingPrice"
      )
      .lean();

  } catch(error) {

    console.log(
      "⚠️ DataProduct selling-price override read error:",
      error.message
    );

  }

  const overridePrices = new Map();

  for(const override of sellingPriceOverrides){

    const provider =
      String(
        override.provider || ""
      ).trim().toLowerCase();

    const network =
      String(
        override.network || ""
      ).trim().toUpperCase();

    const providerPlanId =
      String(
        override.providerPlanId || ""
      ).trim();

    const sellingPrice =
      Number(override.sellingPrice);

    if(
      !provider ||
      !network ||
      !providerPlanId ||
      !Number.isFinite(sellingPrice) ||
      sellingPrice <= 0
    ){
      continue;
    }

    const key =
      `${provider}:${network}:${providerPlanId}`;

    overridePrices.set(
      key,
      sellingPrice
    );

  }

  const products = new Map();

  for (const item of plans) {
    if (!item) {
      continue;
    }

    const normalized =
      item.productKey &&
      item.providerRoute
        ? item
        : normalizePlan(
            item.plan,
            item.provider
          );

    if (!normalized) {
      continue;
    }

    let product =
      products.get(
        normalized.productKey
      );

    if (!product) {
      product = {
        productKey:
          normalized.productKey,

        network:
          normalized.network,

        category:
          normalized.category,

        name:
          normalized.name,

        datasize:
          normalized.datasize,

        validity:
          normalized.validity,

        sellingPrice:
          normalized.sellingPrice,

        active: true,

        providers: [],

        metadata: {},

        lastSeenAt: new Date()
      };

      products.set(
        normalized.productKey,
        product
      );
    }

    /*
     * Build the provider identity used by ProductOverride.
     */
    const provider =
      normalized.providerRoute.provider;

    const providerPlanId =
      normalized.providerRoute.providerPlanId;

    const network =
      normalized.network.toUpperCase();

    const productId =
      `${provider}:${network}:${providerPlanId}`;

    const routeActive =
      !inactiveIds.has(productId);

    normalized.providerRoute.active =
      routeActive;

    /*
     * Apply an individual admin selling-price override.
     *
     * The override is tied to this exact provider route.
     * The provider costPrice is NEVER changed.
     *
     * If no override exists, the normal calculated price
     * from calculateSellingPrice(costPrice) remains.
     */
    const overrideKey =
      `${provider}:${network}:${providerPlanId}`;

    if(overridePrices.has(overrideKey)){

      normalized.providerRoute.sellingPrice =
        overridePrices.get(overrideKey);

    }

    /*
     * Keep EVERY provider plan.
     *
     * A provider can expose multiple routes for the same
     * normalized product, so provider alone is NOT enough
     * to identify a route.
     *
     * Identity:
     *   provider + providerPlanId
     *
     * This prevents one plan from silently replacing another.
     */
    const existingProvider =
      product.providers.find(
        route =>
          route.provider === provider &&
          String(route.providerPlanId) ===
          String(providerPlanId)
      );

    if (existingProvider) {

      Object.assign(
        existingProvider,
        normalized.providerRoute
      );

    } else {

      product.providers.push(
        normalized.providerRoute
      );

    }

    /*
     * IMPORTANT:
     *
     * Do NOT choose a cheapest provider.
     *
     * Every provider route is an independent product option.
     *
     * Example:
     *   Provider A -> 1GB -> ₦300
     *   Provider B -> 1GB -> ₦500
     *
     * These prices must remain attached to their respective
     * provider routes.
     *
     * If Provider A fails, the system MUST NOT switch to
     * Provider B automatically.
     *
     * The provider route is the source of truth.
     */

    /*
     * Keep the product visible even when every provider
     * route has been disabled.
     *
     * ALL provider plans must remain represented in the
     * frontend/product catalogue.
     */
    product.active = true;
  }

  const operations = [];

  for (const product of products.values()) {
    operations.push({
      updateOne: {
        filter: {
          productKey:
            product.productKey
        },

        update: {
          $set: {
            network:
              product.network,

            category:
              product.category,

            name:
              product.name,

            datasize:
              product.datasize,

            validity:
              product.validity,

            active:
              product.active,

            providers:
              product.providers,

            metadata:
              product.metadata,

            lastSeenAt:
              new Date()
          },

          /*
           * Product-level sellingPrice is intentionally removed.
           *
           * Prices belong to individual provider routes.
           */
          $unset: {
            sellingPrice: 1
          }
        },

        upsert: true
      }
    });
  }

  if (operations.length === 0) {
    return {
      products: [],
      synced: 0
    };
  }

  await DataProduct.bulkWrite(
    operations,
    {
      ordered: false
    }
  );

  /*
   * Reconcile stale products.
   *
   * Do NOT delete them. Mark them inactive so old malformed
   * products cannot continue appearing as current products.
   *
   * This is deliberately based on productKey, which means
   * every currently supplied provider plan remains represented.
   */
  const currentProductKeys = [
    ...products.keys()
  ];

  if (currentProductKeys.length > 0) {

    try {

      const staleResult =
        await DataProduct.updateMany(
          {
            productKey: {
              $nin: currentProductKeys
            },

            active: true
          },
          {
            $set: {
              active: false,
              "providers.$[].active": false
            }
          }
        );

      console.log(
        `🧹 Stale DataProducts marked inactive: ${staleResult.modifiedCount}`
      );

    } catch(error) {

      console.log(
        "⚠️ Stale DataProduct reconciliation error:",
        error.message
      );

    }

  }

  return {
    products:
      Array.from(products.values()),

    synced:
      operations.length
  };
}

module.exports = {
  NETWORKS,
  CATEGORIES,
  normalizeNetwork,
  normalizeCategory,
  normalizePlan,
  calculateSellingPrice,
  syncProducts
};
