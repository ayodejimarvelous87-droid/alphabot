const {
  syncProducts
} = require("./dataProductEngine");

const {
  mergeProviderPlans
} = require("./dataProviderAdapter");

async function syncProviderProducts(providerResults) {

  const normalizedPlans =
    mergeProviderPlans(providerResults);

  if(normalizedPlans.length === 0){

    console.log(
      "⚠️ No valid provider plans to sync"
    );

    return {
      products: [],
      synced: 0,
      normalizedPlans: []
    };
  }

  const result =
    await syncProducts(
      normalizedPlans
    );

  console.log(
    `✅ Unified product sync complete: ${result.synced} products`
  );

  return {
    ...result,
    normalizedPlans
  };
}

module.exports = {
  syncProviderProducts
};
