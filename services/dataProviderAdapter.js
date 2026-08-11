const {
  normalizePlan
} = require("./dataProductEngine");

function adaptProviderPlans(provider, plans) {
  if (!Array.isArray(plans)) {
    return [];
  }

  const result = [];

  for (const plan of plans) {
    const normalized = normalizePlan(
      plan,
      provider
    );

    if (!normalized) {
      continue;
    }

    result.push(normalized);
  }

  return result;
}

function mergeProviderPlans(providerResults) {
  const all = [];

  for (const result of providerResults) {
    if (!result) {
      continue;
    }

    const {
      provider,
      plans
    } = result;

    all.push(
      ...adaptProviderPlans(
        provider,
        plans
      )
    );
  }

  return all;
}

module.exports = {
  adaptProviderPlans,
  mergeProviderPlans
};
