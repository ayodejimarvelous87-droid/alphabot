const crypto = require("crypto");

const normalizeNetwork = (network) => {

  const value =
    String(network || "")
      .trim()
      .toUpperCase();

  if(value.includes("MTN")){
    return "MTN";
  }

  if(value.includes("AIRTEL")){
    return "Airtel";
  }

  if(
    value.includes("GLO")
  ){
    return "Glo";
  }

  if(
    value.includes("9MOBILE") ||
    value.includes("ETISALAT")
  ){
    return "9mobile";
  }

  return value || "Other";
};


const normalizeCategory = (plan) => {

  const text = [
    plan?.category,
    plan?.type,
    plan?.data_plan,
    plan?.name
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if(
    text.includes("sme 2") ||
    text.includes("sme2")
  ){
    return "SME 2";
  }

  if(text.includes("sme")){
    return "SME";
  }

  if(text.includes("gift")){
    return "Gifting";
  }

  if(text.includes("corporate")){
    return "Corporate";
  }

  if(
    text.includes("awoof") ||
    text.includes("weekend") ||
    text.includes("sunday") ||
    text.includes("1 day")
  ){
    return "Awoof";
  }

  return "Standard";
};


const getProviderPlanId = (plan) => {

  const id =
    plan?.providerPlanId ??
    plan?.provider_plan_id ??
    plan?.variation_id ??
    plan?.plan_id ??
    plan?.id;

  if(
    id === undefined ||
    id === null ||
    String(id).trim() === ""
  ){
    return null;
  }

  return String(id);
};


const getDatasize = (plan) => {

  return String(
    plan?.datasize ??
    plan?.size ??
    ""
  ).trim();
};


const getValidity = (plan) => {

  return String(
    plan?.validity ??
    plan?.day ??
    ""
  ).trim();
};


/*
 * Generate a stable identity for ONE provider plan.
 *
 * IMPORTANT:
 * Provider identity is deliberately included.
 *
 * Therefore:
 *
 * Oplug MTN 5GB
 * and
 * Provider-B MTN 5GB
 *
 * remain separate products.
 */
const createProductId = ({
  provider,
  network,
  providerPlanId
}) => {

  const raw = [
    String(provider || "").toLowerCase(),
    normalizeNetwork(network),
    String(providerPlanId || "")
  ].join(":");

  const hash =
    crypto
      .createHash("sha256")
      .update(raw)
      .digest("hex")
      .slice(0,16);

  return `alphabot:${hash}`;
};


const normalizePlan = ({
  plan,
  provider,
  providerPrice,
  sellingPrice
}) => {

  const network = normalizeNetwork(
    plan?.network ||
    plan?.service_name
  );

  const providerPlanId =
    getProviderPlanId(plan);

  if(
    !providerPlanId ||
    network === "Other"
  ){
    return null;
  }

  const price =
    Number(
      providerPrice ??
      plan?.price ??
      plan?.costPrice ??
      0
    );

  if(!Number.isFinite(price) || price <= 0){
    return null;
  }

  const finalSellingPrice =
    Number(
      sellingPrice ??
      plan?.sellingPrice ??
      plan?.display_price ??
      price
    );

  const category =
    normalizeCategory(plan);

  const datasize =
    getDatasize(plan);

  const validity =
    getValidity(plan);

  const productId =
    createProductId({
      provider,
      network,
      providerPlanId
    });

  return {

    ...plan,

    productId,

    provider:
      String(provider).toLowerCase(),

    providerPlanId,

    network,

    category,

    datasize,

    validity,

    providerPrice:price,

    sellingPrice:
      Number.isFinite(finalSellingPrice)
        ? finalSellingPrice
        : price

  };

};


module.exports = {
  normalizeNetwork,
  normalizeCategory,
  getProviderPlanId,
  createProductId,
  normalizePlan
};
