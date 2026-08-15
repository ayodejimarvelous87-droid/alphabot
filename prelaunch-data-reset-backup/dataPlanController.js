const { vtuPublicGet } = require("../services/vtuService");
const { getPlans } = require("../services/blitzPayService");
const { getDataPlans: getOplugPlans } = require("../services/oplugService");
const SystemSetting = require("../models/SystemSetting");
const DataPlanCache = require("../models/DataPlanCache");
const ProductOverride = require("../models/ProductOverride");

const {
  syncProviderProducts
} = require("../services/dataProductSync");

const savedPlans = require("../plans.json");


const categoriesList = [
"SME",
"SME 2",
"Awoof",
"Gifting",
"Corporate",
"Standard"
];

function calculateSellingPrice(cost){
  cost = Number(cost);

  let price;

  if(cost <= 500){
    price = cost + 22;
  }

  else if(cost <= 2000){
    price = cost + 52;
  }

  else if(cost <= 5000){
    price = cost + 102;
  }

  else{
    price = cost + (cost * 0.02) + 2;
  }

  return Math.round(price);
}


const formatCategory = (plan)=>{

const name = (
plan.data_plan || plan.type ||
plan.name ||
""
).toLowerCase();


if(name.includes("sme 2") || name.includes("sme2")){
return "SME 2";
}

if(name.includes("sme")){
return "SME";
}

if(name.includes("gift")){
return "Gifting";
}

if(name.includes("corporate")){
return "Corporate";
}

if(
name.includes("awoof") ||
name.includes("weekend") ||
name.includes("sunday") ||
name.includes("1 day") ||
Number(plan.reseller_price || plan.price) <= 500
){

return "Awoof";

}

return "Standard";

};



const DATA_PLANS_CACHE_TTL = 5 * 60 * 1000;

const DATA_PLANS_CACHE_KEY = "data-plans";


const getCachedDataPlans = async()=>{

  try{

    // The Express server connects MongoDB during startup.
    // Never create another MongoDB connection here.
    if(DataPlanCache.db.readyState !== 1){
      console.log(
        "⚠️ MongoDB is not connected - cache unavailable"
      );
      return null;
    }

    return await DataPlanCache.findOne({
      key:DATA_PLANS_CACHE_KEY
    }).lean();

  }catch(error){

    console.log(
      "Data plans cache read error:",
      error.message
    );

    return null;
  }

};


const saveDataPlansCache = async(data, providers)=>{

  try{

    // Use the existing Express/Mongoose connection.
    if(DataPlanCache.db.readyState !== 1){

      console.log(
        "⚠️ MongoDB is not connected - cache not saved"
      );

      return false;
    }

    await DataPlanCache.findOneAndUpdate(
      {
        key:DATA_PLANS_CACHE_KEY
      },
      {
        $set:{
          data,
          providers,
          updatedAt:new Date()
        },
        $setOnInsert:{
          key:DATA_PLANS_CACHE_KEY
        }
      },
      {
        upsert:true,
        new:true,
        setDefaultsOnInsert:true
      }
    );

    console.log(
      "✅ Data plans persistent cache updated"
    );

    return true;

  }catch(error){

    console.log(
      "Data plans cache save error:",
      error.message
    );

    return false;
  }

};


const getDataPlans = async(req,res)=>{

try{

  const cached = await getCachedDataPlans();

  console.log(
    "🔎 DATA PLANS REQUEST:",
    JSON.stringify({
      hasCache: !!cached,
      updatedAt: cached?.updatedAt || null,
      skipCache: !!req?._skipDataPlansCache
    })
  );

  if(cached && !req?._skipDataPlansCache){

    const cacheAge =
      Date.now() - new Date(cached.updatedAt).getTime();

    // Fresh cache.
    if(cacheAge < DATA_PLANS_CACHE_TTL){

      console.log(
        "🔎 DATA PLANS CACHE BRANCH: FRESH CACHE"
      );

      // ---------------------------------------------------------
      // Keep the new unified DataProduct layer synchronized even
      // when the legacy frontend response is being served from
      // the persistent cache.
      //
      // This is important during migration because the frontend
      // must continue receiving the exact cached response while
      // DataProduct is populated independently.
      // ---------------------------------------------------------

      try {

        const cachedProviderResults = [
          {
            provider: "vtu",
            plans: cached.providers?.vtu || []
          },

          {
            provider: "blitzpay",
            plans: cached.providers?.blitzpay || []
          },

          {
            provider: "oplug",
            plans: cached.providers?.oplug || []
          }
        ];

        // =========================================================
        // TEMPORARY CROSS-PROVIDER NORMALIZATION AUDIT
        // =========================================================

        try {

          const {
            normalizePlan
          } = require("../services/dataProductEngine");

          const auditPlans = [];

          for (const result of cachedProviderResults) {

            if (!result || !Array.isArray(result.plans)) {
              continue;
            }

            for (const plan of result.plans) {

              const provider =
                String(result.provider || "").toLowerCase();

              const normalized =
                normalizePlan(plan, provider);

              if (!normalized) {
                continue;
              }

              auditPlans.push({
                provider,
                productKey: normalized.productKey,
                providerPlanId:
                  normalized.providerRoute.providerPlanId,
                network: normalized.network,
                category: normalized.category,
                datasize: normalized.datasize,
                validity: normalized.validity,
                name: normalized.name
              });

            }
          }

          const crossProvider =
            new Map();

          for (const item of auditPlans) {

            if (!crossProvider.has(item.productKey)) {
              crossProvider.set(
                item.productKey,
                []
              );
            }

            crossProvider
              .get(item.productKey)
              .push(item);
          }

          console.log(
            "\n========== CACHED CROSS-PROVIDER MATCHES ==========\n"
          );

          let matchCount = 0;

          for (const [productKey, routes] of crossProvider) {

            const providers =
              new Set(
                routes.map(
                  route => route.provider
                )
              );

            if (providers.size > 1) {

              matchCount++;

              console.log(
                JSON.stringify(
                  {
                    productKey,
                    providers: [...providers],
                    routes
                  },
                  null,
                  2
                )
              );

              if (matchCount >= 30) {
                break;
              }

            }
          }

          console.log(
            `\\nCross-provider unified products found: ${matchCount}\\n`
          );

        } catch(auditError) {

          console.log(
            "⚠️ Cross-provider audit error:",
            auditError.message
          );

        }

        const unifiedResult =
          await syncProviderProducts(
            cachedProviderResults
          );

        console.log(
          `✅ Cached DataProduct sync: ${unifiedResult.synced} unified products`
        );

      } catch(error) {

        console.log(
          "⚠️ Cached DataProduct sync error:",
          error.message
        );

      }

      return res.json(cached.data);

    }

    // Cache is stale.
    //
    // IMPORTANT:
    // Do NOT return the stale catalogue.
    //
    // Returning stale data here could resurrect plans from a
    // provider that has now failed. The refresh must complete
    // first so the response represents the current provider state.
    //
    // There is intentionally NO provider fallback.

    console.log(
      "⚠️ Data plans cache is stale - refreshing providers before response"
    );

  }


const setting = await SystemSetting.findOne();

const profit = setting?.dataProfit || 0;



let allPlans = [];


// Fetch all provider plans concurrently.
// A provider failure is preserved as a rejected result so we can
// safely fall back to its previous persistent cache.

const ProductOverride = require("../models/ProductOverride");

const [
  vtuResult,
  blitzResult,
  oplugResult
] = await Promise.allSettled([

  // VTU.ng
  (async()=>{
    try{

      const response = await vtuPublicGet(
        "/api/v2/variations/data"
      );

      return {
        plans:response.data || [],
        failed:false
      };

    }catch(error){

      console.log(
        "VTU plans error:",
        error.message
      );

      throw error;
    }
  })(),

  // BlitzPay
  (async()=>{
    try{

      const response = await getPlans();

      return {
        plans:response.plans || [],
        failed:false
      };

    }catch(error){

      console.log(
        "BlitzPay plans error:",
        error.message
      );

      throw error;
    }
  })(),

  // OPLUG - fetch all networks concurrently.
  // If any network fails, treat Oplug as partially failed and
  // retain the previous Oplug cache rather than replacing it
  // with an incomplete provider result.
  (async()=>{

    const networks = [
      "MTN",
      "AIRTEL",
      "GLO",
      "9MOBILE"
    ];

    const results = await Promise.allSettled(
      networks.map(async network=>{

        try{

          const plans =
            await getOplugPlans(network);

          return plans || [];

        }catch(error){

          console.log(
            `OPLUG ${network} plans error:`,
            error.message
          );

          throw error;
        }

      })
    );

    const failed =
      results.some(
        result=>result.status === "rejected"
      );

    if(failed){

      throw new Error(
        "One or more OPLUG networks failed"
      );

    }

    return {
      plans:results.flatMap(
        result=>result.value || []
      ),
      failed:false
    };

  })()

]);

// =========================
// Process VTU plans
// =========================

const vtuFailed =
  vtuResult.status !== "fulfilled";

const vtuPlans =
  vtuResult.status === "fulfilled"
    ? (vtuResult.value?.plans || [])
    : [];

if(vtuFailed){

  console.log(
    "⚠️ VTU failed - NO fallback plans will be used"
  );

}else{

  vtuPlans.forEach(plan=>{

  if(
    !plan.data_plan ||
    !plan.service_name ||
    plan.availability === "Unavailable"
  ){
    return;
  }

  allPlans.push({

    ...plan,

    network:plan.service_name,

    service_name:plan.service_name,

    name:plan.data_plan,

    variation_id:
      String(plan.variation_id),

    providerPlanId:
      String(plan.variation_id),

    validity:
      plan.validity ||
      (
        String(plan.data_plan)
          .split(" - ")
          .slice(1)
          .join(" - ")
          .trim()
      ),

    price:
      Number(plan.reseller_price),

    providerPrice:
      Number(plan.reseller_price),

    provider:"vtu",

    sellingPrice:
      calculateSellingPrice(
        plan.reseller_price
      ),

    display_price:
      calculateSellingPrice(
        plan.reseller_price
      )

  });

});

}


// =========================
// Process BlitzPay plans
// =========================

const blitzFailed =
  blitzResult.status !== "fulfilled";

const blitzPlans =
  blitzResult.status === "fulfilled"
    ? (blitzResult.value?.plans || [])
    : [];

const currentBlitzIds = new Set();

const blitzOverrides = [];

if(blitzFailed){

  console.log(
    "⚠️ BlitzPay failed - NO fallback plans will be used"
  );

}else{

for(const plan of blitzPlans){

  if(
    !plan.id ||
    !plan.name ||
    !plan.network ||
    Number(plan.price) <= 0 ||
    plan.available === false
  ){
    continue;
  }

  const variationId = String(plan.id);

  currentBlitzIds.add(variationId);

  const providerPrice = Number(plan.price);
  const sellingPrice =
    calculateSellingPrice(providerPrice);

  allPlans.push({
    ...plan,
    variation_id:variationId,
    service_name:plan.network,
    name:plan.name,
    network:plan.network,
    provider:"blitzpay",
    providerPlanId:variationId,
    providerPrice,
    costPrice:providerPrice,
    sellingPrice,
    display_price:sellingPrice
  });

  blitzOverrides.push({
    updateOne:{
      filter:{
        productId:`blitzpay:${String(plan.network).toUpperCase()}:${variationId}`
      },
      update:{
        $set:{
          productId:`blitzpay:${String(plan.network).toUpperCase()}:${variationId}`,

          provider:"blitzpay",
          providerPlanId:variationId,
          network:plan.network,
          name:plan.name,
          providerPrice,
          sellingPrice,
          active:true
        }
      },
      upsert:true
    }
  });

}

}


// Sync BlitzPay ProductOverrides in one DB operation
if(blitzOverrides.length > 0){

  try{

    await ProductOverride.bulkWrite(
      blitzOverrides,
      {
        ordered:false
      }
    );

  }catch(error){

    console.log(
      "BlitzPay ProductOverride bulk sync error:",
      error.message
    );

  }

}


// Remove stale BlitzPay overrides
try{

  const currentIds =
    Array.from(
      blitzPlans
        .filter(plan =>
          plan?.id &&
          plan?.network
        )
        .map(plan =>
          `blitzpay:${String(plan.network).toUpperCase()}:${String(plan.id)}`
        )
    );

  if(currentIds.length > 0){

    const deleted =
      await ProductOverride.deleteMany({

        provider:"blitzpay",

        productId:{
          $nin:currentIds
        }

      });

    console.log(
      `BlitzPay stale ProductOverride plans removed: ${deleted.deletedCount}`
    );

  }

}catch(error){

  console.log(
    "BlitzPay ProductOverride cleanup error:",
    error.message
  );

}


// =========================
// Process OPLUG plans
// =========================

const oplugFailed =
  oplugResult.status !== "fulfilled";

const oplugPlans =
  oplugResult.status === "fulfilled"
    ? (oplugResult.value?.plans || [])
    : [];

if(oplugFailed){

  console.log(
    "⚠️ OPLUG failed - NO fallback plans will be used"
  );

}else{

  oplugPlans.forEach(plan=>{

    // Never expose OPLUG plans with zero or invalid provider prices.
    /*
     * OPLUG exposes both `price` and `costPrice`.
     *
     * `costPrice` is the provider cost used by AlphaBot
     * for providerPrice and selling-price calculation.
     *
     * Fall back to `price` for older cached/legacy records.
     */
    const providerPrice = Number(
      plan.costPrice ?? plan.price
    );

    if(
      !Number.isFinite(providerPrice) ||
      providerPrice <= 0
    ){
      console.log(
        "⚠️ OPLUG zero/invalid cost price skipped:",
        JSON.stringify({
          id: plan?.id,
          plan_id: plan?.plan_id,
          network: plan?.network,
          datasize: plan?.datasize,
          price: plan?.price,
          costPrice: plan?.costPrice
        })
      );

      return;
    }

    allPlans.push({

      ...plan,

      service_name:plan.network,

      name:
        `${plan.network} ${plan.datasize}`,

      price:providerPrice,

      provider:"oplug",

      /*
       * Oplug canonical identity:
       *
       * Prefer numeric plan_id over legacy/non-canonical id.
       *
       * Example:
       *   id: "gsubz_356"
       *   plan_id: 356
       *
       * Canonical ID = 356
       */
      variation_id:
        String(
          (
            plan.plan_id !== undefined &&
            plan.plan_id !== null &&
            /^\d+$/.test(
              String(plan.plan_id).trim()
            )
          )
            ? plan.plan_id
            : plan.id
        ),

      display_price:
        calculateSellingPrice(providerPrice),

      /*
       * Preserve the provider's validity value.
       *
       * Do NOT append "Days" blindly:
       *   "30 Days" -> "30 Days Days"  ❌
       *   undefined -> "undefined Days" ❌
       *
       * dataProductEngine.normalizeValidity() will perform
       * the final canonical normalization.
       */
      validity:
        plan.validity ??
        plan.day ??
        ""

    });

  });

}



// Sync OPLUG ProductOverrides using provider + network + plan ID
// This prevents collisions where different providers reuse the same plan ID.
try {

  const oplugOverrides = [];

  for(const plan of oplugPlans){

    if(
      plan?.id === undefined ||
      plan?.id === null ||
      !plan.network ||
      Number(plan.price) <= 0
    ){
      continue;
    }

    /*
     * Use the same canonical Oplug identity rule used above.
     * Numeric plan_id wins over legacy/non-canonical id.
     */
    const variationId = String(
      (
        plan.plan_id !== undefined &&
        plan.plan_id !== null &&
        /^\d+$/.test(
          String(plan.plan_id).trim()
        )
      )
        ? plan.plan_id
        : plan.id
    );
    /*
     * OPLUG provider cost:
     * prefer costPrice, with price as a legacy fallback.
     */
    const providerPrice = Number(
      plan.costPrice ?? plan.price
    );

    const sellingPrice =
      calculateSellingPrice(providerPrice);

    const productId =
      `oplug:${String(plan.network).toUpperCase()}:${variationId}`;

    oplugOverrides.push({
      updateOne:{
        filter:{
          productId
        },
        update:{
          $set:{
            productId,
            provider:"oplug",
            providerPlanId:
              variationId,
            network:plan.network,
            name:`${plan.network} ${plan.datasize || "DATA"}`,
            providerPrice,
            sellingPrice
          },
          $setOnInsert:{
            active:true
          }
        },
        upsert:true
      }
    });

  }

  if(oplugOverrides.length > 0){

    await ProductOverride.bulkWrite(
      oplugOverrides,
      {
        ordered:false
      }
    );

    console.log(
      `OPLUG ProductOverride sync: ${oplugOverrides.length} plans`
    );

  }

}catch(error){

  console.log(
    "OPLUG ProductOverride sync error:",
    error.message
  );

}


// Add missing Oplug plans from saved cache
// Use a stable provider + network + plan ID identity so
// cached plans cannot duplicate freshly fetched plans.
try {

  const savedOplug = [];

  for(const network in savedPlans.networks){

    for(const category in savedPlans.networks[network]){

      savedPlans.networks[network][category].forEach(plan=>{

        if(plan.provider === "oplug"){
          savedOplug.push(plan);
        }

      });

    }

  }


  const getOplugIdentity = (plan) => {

    if(!plan || plan.provider !== "oplug"){
      return null;
    }

    const network = String(
      plan.network ||
      plan.service_name ||
      ""
    ).trim().toUpperCase();

    /*
     * Canonical Oplug cache identity.
     *
     * Prefer numeric plan_id over legacy/non-canonical id.
     *
     * Example:
     *   id: "gsubz_356"
     *   plan_id: 356
     *
     * Canonical identity = 356
     */
    let planId =
      (
        plan.plan_id !== undefined &&
        plan.plan_id !== null &&
        /^\d+$/.test(
          String(plan.plan_id).trim()
        )
      )
        ? plan.plan_id
        : (
            plan.id ??
            plan.providerPlanId ??
            plan.variation_id
          );

    if(!network || planId === undefined || planId === null){
      return null;
    }

    /*
     * OPLUG can cache the same plan as:
     *
     *   85
     *   provider_9mobile_85
     *
     * Treat both as the same provider route.
     */
    const idText = String(planId).trim();

    const match =
      idText.match(
        /^provider_(9mobile|etisalat|mtn|airtel|glo)_(.+)$/i
      );

    if(match){

      const idNetwork =
        match[1]
          .toUpperCase();

      if(
        idNetwork === network ||
        (
          idNetwork === "ETISALAT" &&
          network === "9MOBILE"
        )
      ){
        planId = match[2];
      }

    }

    return `oplug:${network}:${String(planId)}`;

  };


  const existingIds = new Set();

  for(const plan of allPlans){

    const identity = getOplugIdentity(plan);

    if(identity){
      existingIds.add(identity);
    }

  }


  savedOplug.forEach(plan=>{

    /*
     * Prefer the provider's explicit costPrice.
     * Older cached OPLUG records fall back to price.
     */
    const providerPrice = Number(
      plan.costPrice ?? plan.price
    );

    // Never resurrect cached OPLUG plans with zero/invalid prices.
    if(
      !Number.isFinite(providerPrice) ||
      providerPrice <= 0
    ){
      console.log(
        "⚠️ Cached OPLUG zero/invalid cost price skipped:",
        JSON.stringify({
          id: plan?.id,
          plan_id: plan?.plan_id,
          network: plan?.network,
          datasize: plan?.datasize,
          price: plan?.price,
          costPrice: plan?.costPrice
        })
      );

      return;
    }

    const identity = getOplugIdentity(plan);

    if(!identity || existingIds.has(identity)){
      return;
    }

    allPlans.push({

      ...plan,

      variation_id:
        String(
          (
            plan.plan_id !== undefined &&
            plan.plan_id !== null &&
            /^\d+$/.test(
              String(plan.plan_id).trim()
            )
          )
            ? plan.plan_id
            : (
                plan.id ??
                plan.providerPlanId ??
                plan.variation_id
              )
        ),

      display_price:
        calculateSellingPrice(providerPrice)

    });

    existingIds.add(identity);

  });


}catch(e){

  console.log(
    "Saved Oplug merge error:",
    e.message
  );

}

// =========================================================
// Unified DataProduct synchronization
// =========================================================
//
// At this point all provider plans have already been assembled
// into allPlans. Failed providers contribute no plans.
//
// The existing frontend response is NOT changed here.
// DataProduct is built alongside the current system so we can
// safely migrate routing later.
//
// This also means the future 4th API can simply be added to
// this provider list without rewriting the frontend.
// =========================================================

try {

  
console.log("\n========== PROVIDER NORMALIZATION AUDIT ==========\n");

const {
  normalizePlan
} = require("../services/dataProductEngine");

for (const provider of ["vtu", "blitzpay", "oplug"]) {

  const providerPlans = allPlans.filter(
    plan =>
      String(plan.provider || "").toLowerCase() === provider
  );

  console.log(`\n===== ${provider.toUpperCase()} =====`);
  console.log(`Raw plans: ${providerPlans.length}`);

  const keys = new Map();

  for (const plan of providerPlans) {

    const normalized = normalizePlan(
      plan,
      provider
    );

    if (!normalized) {
      continue;
    }

    const key = normalized.productKey;

    if (!keys.has(key)) {
      keys.set(key, []);
    }

    keys.get(key).push({
      provider,
      name: plan.name,
      data_plan: plan.data_plan,
      datasize: plan.datasize,
      network: plan.network,
      service_name: plan.service_name,
      category: plan.category,
      type: plan.type,
      validity: plan.validity,
      day: plan.day,
      providerPlanId:
        normalized.providerRoute.providerPlanId,
      normalized: {
        network: normalized.network,
        category: normalized.category,
        datasize: normalized.datasize,
        validity: normalized.validity,
        productKey: normalized.productKey
      }
    });
  }

  console.log(`Normalized keys: ${keys.size}`);

  for (const [key, plans] of keys) {

    if (plans.length > 1) {
      console.log(
        JSON.stringify(plans, null, 2)
      );
    }
  }
}

const crossProvider = new Map();

for (const plan of allPlans) {

  const provider =
    String(plan.provider || "").toLowerCase();

  const normalized =
    normalizePlan(plan, provider);

  if (!normalized) {
    continue;
  }

  if (!crossProvider.has(normalized.productKey)) {
    crossProvider.set(
      normalized.productKey,
      []
    );
  }

  crossProvider
    .get(normalized.productKey)
    .push({
      provider,
      providerPlanId:
        normalized.providerRoute.providerPlanId,
      name: normalized.name,
      network: normalized.network,
      category: normalized.category,
      datasize: normalized.datasize,
      validity: normalized.validity
    });
}

console.log(
  "\n========== CROSS-PROVIDER MATCHES ==========\n"
);

let matchCount = 0;

for (const [productKey, routes] of crossProvider) {

  const providers =
    new Set(
      routes.map(route => route.provider)
    );

  if (providers.size > 1) {

    matchCount++;

    console.log(
      JSON.stringify({
        productKey,
        providers: [...providers],
        routes
      }, null, 2)
    );

    if (matchCount >= 30) {
      break;
    }
  }
}

console.log(
  `\nCross-provider unified products found: ${matchCount}`
);


const unifiedProviderResults = [

    {
      provider: "vtu",
      plans: allPlans.filter(
        plan =>
          String(plan.provider || "").toLowerCase() === "vtu"
      )
    },

    {
      provider: "blitzpay",
      plans: allPlans.filter(
        plan =>
          String(plan.provider || "").toLowerCase() === "blitzpay"
      )
    },

    {
      provider: "oplug",
      plans: allPlans.filter(
        plan =>
          String(plan.provider || "").toLowerCase() === "oplug"
      )
    }

  ];

  const unifiedResult =
    await syncProviderProducts(
      unifiedProviderResults
    );

  console.log(
    `✅ DataProduct engine synced ${unifiedResult.synced} unified products`
  );

} catch(error) {

  /*
   * DataProduct is an additional layer during migration.
   * If it fails, the existing frontend plan system must
   * continue working normally.
   */
  console.log(
    "⚠️ DataProduct unified sync error:",
    error.message
  );

}

// Remove plans manually deactivated through ProductOverride.
// ProductOverride is the source of truth for admin-disabled plans.
try {

  const inactiveOverrides =
    await ProductOverride.find({
      active:false
    }).select(
      "productId provider network providerPlanId"
    ).lean();

  const inactiveIds = new Set(
    inactiveOverrides.map(
      item => String(item.productId)
    )
  );

  // Generate every possible ProductOverride identity for a plan.
  // Oplug can expose the same plan using different identifiers.
  // Example:
  //   providerPlanId: "gsubz_356"
  //   plan_id: 356
  //
  // If admin disabled oplug:MTN:356, the current gsubz_356
  // version must also remain hidden.
  const getPlanProductIds = (plan) => {

    if(!plan?.provider){
      return [];
    }

    const provider =
      String(plan.provider).toLowerCase();

    const network =
      String(
        plan.network ||
        plan.service_name ||
        ""
      ).trim().toUpperCase();

    if(!network){
      return [];
    }

    const identifiers = [
      plan.providerPlanId,
      plan.provider_plan_id,
      plan.id,
      plan.plan_id,
      plan.variation_id
    ];

    const uniqueIds = [
      ...new Set(
        identifiers
          .filter(
            id =>
              id !== undefined &&
              id !== null &&
              String(id).trim() !== ""
          )
          .map(id => String(id))
      )
    ];

    return uniqueIds.map(
      id => `${provider}:${network}:${id}`
    );
  };

  const beforeCount = allPlans.length;

  allPlans = allPlans.filter(plan => {

    const productIds =
      getPlanProductIds(plan);

    const disabledProductId =
      productIds.find(
        id => inactiveIds.has(id)
      );

    if(disabledProductId){

      console.log(
        "🚫 Hiding inactive plan:",
        disabledProductId,
        plan.name || plan.datasize || ""
      );

      return false;
    }

    return true;
  });

  console.log(
    `✅ Inactive ProductOverrides filtered: ${beforeCount - allPlans.length}`
  );

}catch(error){

  console.log(
    "Inactive ProductOverride filtering error:",
    error.message
  );

}

// Apply individual admin selling-price overrides.
// ProductOverride is per-product; it does NOT act as a
// centralized pricing setting.
//
// The provider cost remains untouched.
// If an admin has manually set a sellingPrice for this exact
// provider + network + provider plan ID, that price wins.
// Otherwise the normal calculated selling price remains.

try {

  const priceOverrides =
    await ProductOverride.find({
      sellingPrice: {
        $gt: 0
      }
    })
    .select(
      "productId provider network providerPlanId sellingPrice"
    )
    .lean();

  const overridePrices = new Map();

  for(const override of priceOverrides){

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

    if(
      !provider ||
      !network ||
      !providerPlanId
    ){
      continue;
    }

    const key =
      `${provider}:${network}:${providerPlanId}`;

    const sellingPrice =
      Number(override.sellingPrice);

    if(
      Number.isFinite(sellingPrice) &&
      sellingPrice > 0
    ){
      overridePrices.set(
        key,
        sellingPrice
      );
    }

  }


  let appliedOverrides = 0;

  allPlans = allPlans.map(plan => {

    const provider =
      String(
        plan.provider || ""
      ).trim().toLowerCase();

    const network =
      String(
        plan.network ||
        plan.service_name ||
        ""
      ).trim().toUpperCase();

    const providerPlanId =
      String(
        plan.providerPlanId ||
        plan.provider_plan_id ||
        plan.variation_id ||
        plan.id ||
        plan.plan_id ||
        ""
      ).trim();

    const key =
      `${provider}:${network}:${providerPlanId}`;

    const overridePrice =
      overridePrices.get(key);

    if(
      overridePrice === undefined
    ){
      return plan;
    }

    appliedOverrides++;

    return {
      ...plan,

      sellingPrice:
        overridePrice,

      display_price:
        overridePrice
    };

  });


  console.log(
    `✅ Individual ProductOverrides applied: ${appliedOverrides}`
  );

}catch(error){

  console.log(
    "⚠️ ProductOverride selling-price application error:",
    error.message
  );

}


/*
 * Final plan price normalization.
 *
 * Keep one consistent meaning for each price field:
 *
 *   providerPrice -> actual provider cost
 *   sellingPrice  -> customer price
 *   price         -> legacy alias for provider cost
 *   display_price -> legacy alias for customer price
 *
 * This prevents provider-specific records (especially OPLUG)
 * from exposing missing/ambiguous price fields.
 */
allPlans = allPlans.map(plan => {

  const providerPrice =
    Number(
      plan.providerPrice ??
      plan.costPrice ??
      plan.price
    );

  const sellingPrice =
    Number(
      plan.sellingPrice ??
      plan.display_price ??
      (
        Number.isFinite(providerPrice) &&
        providerPrice > 0
          ? calculateSellingPrice(providerPrice)
          : 0
      )
    );

  return {
    ...plan,

    providerPrice:
      Number.isFinite(providerPrice)
        ? providerPrice
        : 0,

    costPrice:
      Number.isFinite(providerPrice)
        ? providerPrice
        : 0,

    price:
      Number.isFinite(providerPrice)
        ? providerPrice
        : 0,

    sellingPrice:
      Number.isFinite(sellingPrice)
        ? sellingPrice
        : 0,

    display_price:
      Number.isFinite(sellingPrice)
        ? sellingPrice
        : 0
  };

});


const grouped = {};



allPlans.forEach(plan=>{


let network =
  plan.network ||
  plan.service_name ||
  "Other";

network = network.toString().trim().toLowerCase();

if(network.includes("mtn")){
network = "MTN";
}
else if(network.includes("airtel")){
network = "Airtel";
}
else if(network.includes("glo")){
network = "Glo";
}
else if(network.includes("9mobile") || network.includes("etisalat")){
network = "9mobile";
}
else{
network = "Other";
}



if(!grouped[network]){

grouped[network] = {};


categoriesList.forEach(category=>{

grouped[network][category] = [];

});

}



const category = formatCategory(plan);


grouped[network][category].push(plan);


});



Object.keys(grouped).forEach(network=>{
Object.keys(grouped[network]).forEach(category=>{
if(grouped[network][category].length===0){
delete grouped[network][category];
}
});
if(Object.keys(grouped[network]).length===0 || network==="Other"){
delete grouped[network];
}
});

const responseData = {
success:true,
networks:grouped
};

// Save the fully processed plans to persistent MongoDB cache.
const cacheSaved = await saveDataPlansCache(
  responseData,
  {
    vtu:allPlans.filter(
      plan=>plan.provider==="vtu"
    ),

    blitzpay:allPlans.filter(
      plan=>plan.provider==="blitzpay"
    ),

    oplug:allPlans.filter(
      plan=>plan.provider==="oplug"
    )
  }
);

if(!cacheSaved){

  console.log(
    "⚠️ Data plans loaded but persistent cache was not updated"
  );

}

res.json(responseData);


}catch(error){


console.log(
"Data plans error:",
error.message
);


res.status(500).json({

message:error.message

});


}

};



module.exports = {
getDataPlans
};
