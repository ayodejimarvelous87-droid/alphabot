const { vtuPublicGet } = require("../services/vtuService");
const { getPlans } = require("../services/blitzPayService");
const { getDataPlans: getOplugPlans } = require("../services/oplugService");
const SystemSetting = require("../models/SystemSetting");
const DataPlanCache = require("../models/DataPlanCache");
const ProductOverride = require("../models/ProductOverride");
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

let dataPlansRefreshing = false;

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

  if(cached && !req?._skipDataPlansCache){

    const cacheAge =
      Date.now() - new Date(cached.updatedAt).getTime();

    // Fresh cache.
    if(cacheAge < DATA_PLANS_CACHE_TTL){

      return res.json(cached.data);

    }

    // Stale-while-revalidate.
    if(!dataPlansRefreshing){

      dataPlansRefreshing = true;

      // Refresh completely in the background.
      // The cached response is returned immediately to the user.
      Promise.resolve()
        .then(()=>getDataPlans(
          {_skipDataPlansCache:true},
          {
            json:()=>{}
          }
        ))
        .catch(error=>{

          console.log(
            "Background data-plan refresh error:",
            error.message
          );

        })
        .finally(()=>{

          dataPlansRefreshing = false;

        });

    }

    // Never make the user wait for provider APIs.
    return res.json(cached.data);

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

if(vtuFailed && cached?.providers?.vtu){

  console.log(
    "⚠️ VTU failed - using previous cached VTU plans"
  );

  allPlans.push(
    ...cached.providers.vtu
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
    price:Number(plan.reseller_price),
    provider:"vtu",
    display_price:
      calculateSellingPrice(plan.reseller_price)
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

if(blitzFailed && cached?.providers?.blitzpay){

  console.log(
    "⚠️ BlitzPay failed - using previous cached BlitzPay plans"
  );

  allPlans.push(
    ...cached.providers.blitzpay
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
    providerPrice,
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

if(oplugFailed && cached?.providers?.oplug){

  console.log(
    "⚠️ OPLUG failed - using previous cached OPLUG plans"
  );

  allPlans.push(
    ...cached.providers.oplug
  );

}else{

  oplugPlans.forEach(plan=>{

    allPlans.push({

      ...plan,

      service_name:plan.network,

      name:
        `${plan.network} ${plan.datasize}`,

      price:Number(plan.price),

      provider:"oplug",

      variation_id:
        String(
          plan.id ??
          plan.plan_id
        ),

      display_price:
        calculateSellingPrice(plan.price),

      validity:
        `${plan.day} Days`

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

    const variationId = String(plan.id);
    const providerPrice = Number(plan.price);
    const sellingPrice = calculateSellingPrice(providerPrice);

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
              String(
                plan.providerPlanId ??
                plan.plan_id ??
                variationId
              ),
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

    const planId =
      plan.id ??
      plan.plan_id ??
      plan.providerPlanId ??
      plan.variation_id;

    if(!network || planId === undefined || planId === null){
      return null;
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

    const identity = getOplugIdentity(plan);

    if(!identity || existingIds.has(identity)){
      return;
    }

    allPlans.push({

      ...plan,

      variation_id:
        String(
          plan.id ??
          plan.plan_id ??
          plan.providerPlanId ??
          plan.variation_id
        ),

      display_price:
        calculateSellingPrice(plan.price)

    });

    existingIds.add(identity);

  });


}catch(e){

  console.log(
    "Saved Oplug merge error:",
    e.message
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

  const getPlanProductId = (plan) => {

    if(!plan?.provider){
      return null;
    }

    const provider =
      String(plan.provider).toLowerCase();

    const network =
      String(
        plan.network ||
        plan.service_name ||
        ""
      ).trim().toUpperCase();

    const planId =
      plan.providerPlanId ??
      plan.provider_plan_id ??
      plan.id ??
      plan.plan_id ??
      plan.variation_id;

    if(
      !network ||
      planId === undefined ||
      planId === null
    ){
      return null;
    }

    return `${provider}:${network}:${String(planId)}`;
  };

  const beforeCount = allPlans.length;

  allPlans = allPlans.filter(plan => {

    const productId =
      getPlanProductId(plan);

    if(
      productId &&
      inactiveIds.has(productId)
    ){

      console.log(
        "🚫 Hiding inactive plan:",
        productId,
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
