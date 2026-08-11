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


const firstNonEmpty = (...values) => {

  for (const value of values) {

    if (
      value !== undefined &&
      value !== null &&
      String(value).trim() !== ""
    ) {
      return value;
    }
  }

  return "";
};


const getRawPlanText = (plan) => {

  return String(
    firstNonEmpty(
      plan?.datasize,
      plan?.size,
      plan?.data_plan,
      plan?.name,
      plan?.type
    )
  )
    .trim()
    .replace(/\s+/g, " ");
};


const extractDataAndValidity = (plan) => {

  const text = getRawPlanText(plan);

  /*
   * Examples:
   *
   * 16.5GB - 30 Days
   * 1GB - 7 Days
   * 3.2GB - 2 Days
   * 1GB + 1.5 mins - 1 Day
   * 500MB (Gift) - 30 Days
   */

  const match = text.match(
    /^(.*?)\s*-\s*(\d+(?:\.\d+)?)\s*(day|days|week|weeks|month|months)\s*$/i
  );

  if(!match){

    return {
      datasize:
        String(
          plan?.datasize ??
          plan?.size ??
          ""
        ).trim(),

      validity:
        String(
          plan?.validity ??
          plan?.day ??
          ""
        ).trim()
    };

  }

  let datasize =
    match[1]
      .trim()
      .replace(/\s+/g, " ")
      .toUpperCase();

  const number = match[2];
  const unit = match[3].toLowerCase();

  let normalizedUnit = "Days";

  if(unit === "week" || unit === "weeks"){
    normalizedUnit = "Weeks";
  }

  if(unit === "month" || unit === "months"){
    normalizedUnit = "Months";
  }

  let finalUnit = normalizedUnit;

  if(Number(number) === 1){
    if(normalizedUnit === "Days"){
      finalUnit = "Day";
    }

    if(normalizedUnit === "Weeks"){
      finalUnit = "Week";
    }

    if(normalizedUnit === "Months"){
      finalUnit = "Month";
    }
  }

  const validity =
    `${number} ${finalUnit}`;

  return {
    datasize,
    validity
  };
};


const normalizeDatasizeText = (value) => {

  let text =
    String(value || "")
      .trim()
      .replace(/\s+/g, " ")
      .toUpperCase();

  return text
    .replace(/\s*\+\s*/g, "+")
    .replace(/\s*-\s*/g, " - ");
};


const extractDatasizeValidity = (plan) => {

  const raw =
    plan?.datasize ??
    plan?.size ??
    plan?.data_plan ??
    plan?.name ??
    "";

  let text =
    String(raw)
      .trim()
      .replace(/\s+/g, " ");

  if(!text){
    return {
      datasize:"",
      validity:""
    };
  }

  /*
   * Match:
   *
   * 1GB - 30 Days
   * 1GB – 30 Days
   * 1GB - 30 day
   * 2.5GB - 7days
   * 16.5GB + 25mins - 30days
   */

  const match =
    text.match(
      /\s*[-–—]\s*(\d+(?:\.\d+)?)\s*(day|days|week|weeks|month|months)\s*$/i
    );

  if(match){

    const number = match[1];
    const unit = match[2].toLowerCase();

    let normalizedUnit = "Day";

    if(
      unit === "week" ||
      unit === "weeks"
    ){
      normalizedUnit = "Week";
    }

    if(
      unit === "month" ||
      unit === "months"
    ){
      normalizedUnit = "Month";
    }

    return {

      datasize:
        normalizeDatasizeText(
          text.slice(0, match.index)
        ),

      validity:
        `${number} ${normalizedUnit}`

    };

  }

  /*
   * If there is no validity embedded in the name,
   * preserve an explicitly supplied validity.
   */

  const explicitValidity =
    plan?.validity ??
    plan?.day ??
    "";

  let validity =
    String(explicitValidity || "")
      .trim()
      .replace(/\s+/g, " ");

  if(validity){

    const validityMatch =
      validity.match(
        /^(\d+(?:\.\d+)?)\s*(day|days|week|weeks|month|months)?$/i
      );

    if(validityMatch){

      const number =
        validityMatch[1];

      const unit =
        (validityMatch[2] || "day")
          .toLowerCase();

      let normalizedUnit = "Day";

      if(
        unit === "week" ||
        unit === "weeks"
      ){
        normalizedUnit = "Week";
      }

      if(
        unit === "month" ||
        unit === "months"
      ){
        normalizedUnit = "Month";
      }

      validity =
        `${number} ${normalizedUnit}`;

    }

  }

  return {

    datasize:
      normalizeDatasizeText(text),

    validity

  };

};


const getDatasize = (plan) => {

  const raw = String(
    firstNonEmpty(
      plan?.datasize,
      plan?.size,
      plan?.data_plan,
      plan?.name
    )
  )
    .trim()
    .replace(/\s+/g, " ");

  if(!raw){
    return "";
  }

  let text = raw.toUpperCase();

  // Remove common network prefixes from names.
  text = text.replace(
    /^(MTN|AIRTEL|GLO|9MOBILE|ETISALAT)\s+/i,
    ""
  );

  // Remove gift markers.
  text = text.replace(
    /\s*\(GIFT\)\s*/i,
    " "
  );

  /*
   * Remove validity embedded anywhere in the plan name.
   *
   * Examples:
   *   5GB - 14days
   *   5GB - 14days (N230/GB)
   *   300MB - 2 days
   *   16.5GB+25MINS - 30days
   */
  text = text.replace(
    /\s*[-–—]\s*\d+(?:\.\d+)?\s*(?:DAY|DAYS|WEEK|WEEKS|MONTH|MONTHS)\b/gi,
    ""
  );

  // Remove Sunday/Weekend labels.
  text = text.replace(
    /\s*[-–—]\s*(?:SUNDAY|WEEKEND)\b/gi,
    ""
  );

  return text
    .trim()
    .replace(/\s*([+])\s*/g, "$1")
    .replace(/\s+/g, " ");
};


const getValidity = (plan) => {

  /*
   * IMPORTANT:
   *
   * Embedded validity in the plan name is authoritative.
   *
   * Example:
   *   "MTN 1GB - 30days"
   *
   * must produce:
   *   "30 Days"
   *
   * even if old database metadata contains:
   *   "30 days days"
   *   "undefined days"
   *
   * Old metadata is only a fallback when the name contains
   * no validity information.
   */

  const raw = String(
    firstNonEmpty(
      plan?.datasize,
      plan?.size,
      plan?.data_plan,
      plan?.name
    )
  )
    .trim()
    .replace(/\s+/g, " ");

  /*
   * First look for validity embedded in the plan text.
   *
   * Handles:
   *   1GB - 30days
   *   1GB - 30 days
   *   5GB - 7days
   *   2GB - 2 weeks
   *   10GB - 1 month
   */
  const embeddedMatch =
    raw.match(
      /[-–—]\s*(\d+(?:\.\d+)?)\s*(day|days|week|weeks|month|months)\b/i
    );

  if(embeddedMatch){

    const number = embeddedMatch[1];
    const unit = embeddedMatch[2].toLowerCase();

    const numericValue = Number(number);

    if(!Number.isFinite(numericValue) || numericValue <= 0){
      return "";
    }

    if(
      unit === "day" ||
      unit === "days"
    ){
      return `${number} ${numericValue === 1 ? "Day" : "Days"}`;
    }

    if(
      unit === "week" ||
      unit === "weeks"
    ){
      return `${number} ${numericValue === 1 ? "Week" : "Weeks"}`;
    }

    return `${number} ${numericValue === 1 ? "Month" : "Months"}`;
  }

  /*
   * No validity in the name.
   *
   * Now use explicit metadata as a fallback.
   */
  const explicit =
    plan?.validity ??
    plan?.day;

  if(
    explicit !== undefined &&
    explicit !== null &&
    String(explicit).trim() !== ""
  ){

    const text =
      String(explicit)
        .trim()
        .replace(/\s+/g, " ");

    /*
     * Reject old corrupted values such as:
     *
     *   undefined days
     *   null days
     *   30 days days
     */
    if(
      /^undefined(?:\s+days?)?$/i.test(text) ||
      /^null(?:\s+days?)?$/i.test(text) ||
      /^nan(?:\s+days?)?$/i.test(text)
    ){
      return "";
    }

    const match =
      text.match(
        /^(\d+(?:\.\d+)?)\s*(day|days|week|weeks|month|months)$/i
      );

    if(match){

      const number = match[1];
      const unit = match[2].toLowerCase();

      const numericValue = Number(number);

      if(!Number.isFinite(numericValue) || numericValue <= 0){
        return "";
      }

      if(
        unit === "day" ||
        unit === "days"
      ){
        return `${number} ${numericValue === 1 ? "Day" : "Days"}`;
      }

      if(
        unit === "week" ||
        unit === "weeks"
      ){
        return `${number} ${numericValue === 1 ? "Week" : "Weeks"}`;
      }

      return `${number} ${numericValue === 1 ? "Month" : "Months"}`;
    }

    /*
     * Numeric validity such as:
     *   30
     *
     * means 30 days.
     */
    if(
      /^\d+(?:\.\d+)?$/.test(text)
    ){
      return `${text} Days`;
    }

    /*
     * Do not preserve obviously corrupted values.
     */
    if(
      /undefined|null|nan/i.test(text)
    ){
      return "";
    }

    return text;
  }

  return "";
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
