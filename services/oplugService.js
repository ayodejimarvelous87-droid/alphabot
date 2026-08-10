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
  data = null
) => {

  const startTime = Date.now();

  const providerAvailable = await canUseProvider({
    provider: "oplug",
    service: endpoint
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
      service: endpoint,
      success: true,
      responseTime: Date.now() - startTime
    });

    return response.data;

  } catch (error) {

    await recordProviderResult({
      provider: "oplug",
      service: endpoint,
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

    const response =
      await oplugRequest("/data_plans");

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

    return filtered.map(plan => ({

      id: plan.plan_id,
      providerPlanId: plan.plan_id,
      plan_id: plan.plan_id,

      network: plan.network,

      type: plan.type || "DATA",

      datasize: plan.datasize || "DATA",

      day:
        plan.day
          ? `${plan.day} Days`
          : "30 Days",

      name:
        `${plan.network} ${plan.datasize || "DATA"} - ${plan.type || "DATA"}`,

      price: Number(plan.price) || 0

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

  return await oplugRequest(
    "/data",
    "POST",
    {
      network: data.network,
      phone,
      data_plan: Number(planId),
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
