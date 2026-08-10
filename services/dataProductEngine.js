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

  if (cost <= 500) {
    return Math.round(cost + 22);
  }

  if (cost <= 2000) {
    return Math.round(cost + 52);
  }

  if (cost <= 5000) {
    return Math.round(cost + 102);
  }

  return Math.round(cost + (cost * 0.02) + 2);
}

function normalizeCategory(plan) {
  const name = String(
    plan.data_plan ||
    plan.type ||
    plan.name ||
    ""
  ).toLowerCase();

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

  const providerPlanId =
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

  const costPrice = normalizeNumber(
    plan.costPrice ??
    plan.providerPrice ??
    plan.reseller_price ??
    plan.price
  );

  if (costPrice <= 0) {
    return null;
  }

  const datasize = String(
    plan.datasize ||
    plan.size ||
    ""
  ).trim();

  const validity = String(
    plan.validity ||
    plan.day ||
    ""
  ).trim();

  let name = String(
    plan.name ||
    plan.data_plan ||
    ""
  ).trim();

  if (!name && datasize) {
    name = `${network} ${datasize}`;
  }

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

    sellingPrice:
      calculateSellingPrice(costPrice),

    providerRoute: {
      provider: String(provider).toLowerCase(),
      providerPlanId: String(providerPlanId),
      costPrice,
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

  const products = new Map();

  for (const item of plans) {
    if (!item) {
      continue;
    }

    const normalized =
      normalizePlan(
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

    const existingProvider =
      product.providers.find(
        route =>
          route.provider === provider
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
     * Cheapest active provider becomes the
     * default selling-price reference.
     */
    const cheapest =
      product.providers
        .filter(route => route.active)
        .sort(
          (a, b) =>
            a.costPrice - b.costPrice
        )[0];

    if (cheapest) {

      product.sellingPrice =
        calculateSellingPrice(
          cheapest.costPrice
        );

    } else {

      /*
       * Keep the product itself visible even when every
       * provider route has been disabled.
       *
       * This is important because ALL plans must remain
       * represented in the frontend/product catalogue.
       */
      product.active = true;

    }
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

            sellingPrice:
              product.sellingPrice,

            active:
              product.active,

            providers:
              product.providers,

            metadata:
              product.metadata,

            lastSeenAt:
              new Date()
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
