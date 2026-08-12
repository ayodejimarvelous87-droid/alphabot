require("dotenv").config();
const axios = require("axios");
const {
  recordProviderResult,
  canUseProvider
} = require("./providerMonitorService");

const BASE_URL = process.env.OPLUG_BASE_URL;

const oplugRequest = async (
  endpoint,
  method = "GET",
  data = null,
  healthService = endpoint
) => {

  const startTime = Date.now();

  const providerAvailable = await canUseProvider({
    provider: "oplug",
    service: healthService
  });

  if (!providerAvailable) {
    throw new Error(
      "Service temporarily unavailable. Please try again shortly."
    );
  }

  try {

    const config = {
      headers: {
        "Content-Type": "application/json"
      }
    };

    if (process.env.OPLUG_API_KEY) {
        config.headers.Authorization =
          `Bearer ${process.env.OPLUG_API_KEY}`;
    }

    let response;

    if (method === "POST") {

      console.log("OPLUG AXIOS BODY:", data);

      response = await axios.post(
        BASE_URL + endpoint,
        data,
        config
      );

    } else {

      response = await axios.get(
        BASE_URL + endpoint,
        config
      );

    }

    await recordProviderResult({
      provider: "oplug",
      service: healthService,
      success: true,
      responseTime: Date.now() - startTime
    });

    return response.data;

  } catch (error) {

    await recordProviderResult({
      provider: "oplug",
      service: healthService,
      success: false,
      responseTime: Date.now() - startTime,
      error:
        error.response?.data?.message ||
        error.message
    });

    console.log(
      "========== OPLUG ERROR =========="
    );

    console.log(
      "OPLUG STATUS:",
      error.response?.status
    );

    console.log(
      "OPLUG RESPONSE STRING:",
      JSON.stringify(error.response?.data)
    );

    console.log(
      "OPLUG REQUEST:",
      JSON.stringify(
        {
          endpoint,
          method,
          data
        },
        null,
        2
      )
    );

    console.log(
      "OPLUG ERROR MESSAGE:",
      error.message
    );

    console.log(
      "================================="
    );

    throw error;
  }
};


const getBalance = async () => {

  return await oplugRequest("/user");

};


const getDataPlans = async (network) => {

  try {

    const healthService =
      `data_plans:${String(network || "ALL").trim().toUpperCase()}`;

    const response =
      await oplugRequest(
        "/data_plans",
        "GET",
        null,
        healthService
      );

    const plans = Array.isArray(response)
      ? response
      : response.plans || [];

    const filtered = network
      ? plans.filter(
          plan =>
            String(plan.network).toLowerCase() ===
            String(network).toLowerCase()
        )
      : plans;

    // Deduplicate OPLUG plans by provider + network + stable plan ID.
    // OPLUG may return the same plan more than once from /data_plans.
    const seen = new Set();

    const uniquePlans = filtered.filter(plan => {

      const planNetwork =
        String(
          plan.network ||
          network ||
          ""
        ).trim().toUpperCase();

      const planId =
        plan.id ??
        plan.plan_id;

      // If a plan has no stable ID, keep it rather than
      // accidentally removing a legitimate provider plan.
      if (
        !planNetwork ||
        planId === undefined ||
        planId === null
      ) {
        return true;
      }

      const identity =
        `oplug:${planNetwork}:${String(planId)}`;

      if (seen.has(identity)) {
        console.log(
          "OPLUG duplicate removed:",
          identity
        );

        return false;
      }

      seen.add(identity);

      return true;

    });

    return uniquePlans.map(plan => ({

      /*
       * Oplug may expose a legacy/non-canonical `id` such as:
       *
       *   id: "gsubz_356"
       *   plan_id: 356
       *
       * The numeric plan_id is the canonical Oplug route.
       * Prefer it whenever available so legacy gsubz_* identities
       * cannot be recreated in ProductOverride/DataProduct.
       */
      id:
        (
          plan.plan_id !== undefined &&
          plan.plan_id !== null &&
          /^\\d+$/.test(String(plan.plan_id).trim())
        )
          ? plan.plan_id
          : plan.id,

      providerPlanId:
        (
          plan.plan_id !== undefined &&
          plan.plan_id !== null &&
          /^\\d+$/.test(String(plan.plan_id).trim())
        )
          ? plan.plan_id
          : plan.id,

      plan_id:
        plan.plan_id,

      network: plan.network,

      type: plan.type || "DATA",

      datasize: plan.datasize || "DATA",

      day: (() => {
        const rawDay = plan.day;

        if (
          rawDay === undefined ||
          rawDay === null ||
          String(rawDay).trim() === ""
        ) {
          return "30 Days";
        }

        const value = String(rawDay).trim();

        if (/^\d+(?:\.\d+)?\s*days?$/i.test(value)) {
          return value.replace(/\s*days?$/i, " Days");
        }

        if (/^\d+(?:\.\d+)?$/.test(value)) {
          return `${value} Days`;
        }

        return value;
      })(),

      name:
        `${plan.network} ${plan.datasize || "DATA"} - ${plan.type || "DATA"}`,

      /*
       * Preserve both OPLUG price fields.
       *
       * `costPrice` is the provider cost used by AlphaBot's
       * unified pricing layer when supplied by OPLUG.
       *
       * Keep `price` as the original OPLUG price for reference
       * and backward compatibility.
       */
      price: Number(plan.price) || 0,

      costPrice:
        Number.isFinite(Number(plan.costPrice))
          ? Number(plan.costPrice)
          : 0

    }));

  } catch (error) {

    console.log(
      "OPLUG GET PLANS ERROR:",
      error.message
    );

    return [];

  }
};


const purchaseData = async (data) => {

  let phone =
    data.phone ||
    data.phoneNumber;

  if (!phone) {
    throw new Error("Phone number is required");
  }

  if (phone.startsWith("+234")) {
    phone = "0" + phone.slice(4);
  }

  console.log(
    "FINAL OPLUG PURCHASE:",
    {
      network: data.network,
      planId:
        data.planId ||
        data.plan ||
        data.providerPlanId,
      phoneNumber: phone
    }
  );

  const planId =
    data.planId ||
    data.plan ||
    data.providerPlanId;

  if (!planId) {
    throw new Error("Oplug data plan ID is required");
  }

  const networkMap = {
    MTN: 1,
    GLO: 2,
    "9MOBILE": 3,
    AIRTEL: 4
  };

  const networkName =
    String(data.network || "").trim().toUpperCase();

  const networkId =
    networkMap[networkName];

  if (!networkId) {
    throw new Error(
      `Unsupported Oplug network: ${data.network}`
    );
  }

  return await oplugRequest(
    "/data",
    "POST",
    {
      network: networkId,
      phone,
      data_plan: planId,
      bypass: data.bypass ?? false,
      "request-id":
        data.requestId ||
        data.reference ||
        `ALPHABOT_${Date.now()}`
    }
  );

};


const checkTransaction = async (reference) => {

  /*
   * The new Oplug documentation supplied does not
   * currently expose a transaction-status endpoint.
   *
   * Keep this function for AlphaBot compatibility.
   */
  return {
    status: "unknown",
    reference
  };

};


module.exports = {
  getBalance,
  getDataPlans,
  purchaseData,
  checkTransaction
};
