require("dotenv").config();
const axios = require("axios");
const { recordProviderResult, canUseProvider } = require("./providerMonitorService");

const BASE_URL = process.env.OPLUG_BASE_URL;

const oplugRequest = async(endpoint, method="GET", data=null)=>{

const startTime = Date.now();


const providerAvailable = await canUseProvider({
  provider:"oplug",
  service:endpoint
});


if(!providerAvailable){

  throw new Error(
    "Service temporarily unavailable. Please try again shortly."
  );

}


try{

const config = {
  headers:{
  "Content-Type":"application/json"
  }
};

if(process.env.OPLUG_API_KEY){
  config.headers.Authorization =
  `Bearer ${process.env.OPLUG_API_KEY}`;
}


let response;


if(method==="POST"){

console.log("OPLUG AXIOS BODY:", data);

response = await axios.post(
BASE_URL + endpoint,
data,
config
);

}else{

response = await axios.get(
BASE_URL + endpoint,
config
);

}


await recordProviderResult({
provider:"oplug",
service:endpoint,
success:true,
responseTime:Date.now()-startTime
});


return response.data;


}catch(error){

await recordProviderResult({
provider:"oplug",
service:endpoint,
success:false,
responseTime:Date.now()-startTime,
error:error.response?.data?.message || error.message
});


console.log(
"OPLUG error:",
error.response?.data || error.message
);


throw error;

}

};


const getBalance = async()=>{
  return await oplugRequest("/vtu/balance");
};


const getDataPlans = async(network)=>{

try{

const services = await oplugRequest("/vtu/services");

const servicePlans = services.data?.data?.[network] || [];

return servicePlans.map(plan=>({

id: plan.id,
providerPlanId: plan.id,
plan_id: plan.id,
network: plan.network,
type: plan.id.includes("gifting") ? "GIFTING" :
      plan.id.includes("sme") ? "SME" :
      plan.id.includes("awoof") ? "AWOOF" :
      "DATA",

datasize: plan.size !== "N/A" ? plan.size : "DATA",

day: plan.validity || "30 Days",

name: `${plan.network} DATA PLAN`,
price: plan.api_price

}));

}catch(error){

console.log("OPLUG GET PLANS ERROR:", error.message);

return [];

}

};


const purchaseData = async(data)=>{

let phone = data.phone || data.phoneNumber;

if(phone.startsWith("+234")){
  phone = "0" + phone.slice(4);
}

console.log("FINAL OPLUG PURCHASE:", {
  network:data.network,
  planId:data.planId || data.plan,
  phoneNumber:phone
});

return await oplugRequest(
  "/vtu/data",
  "POST",
  {
    network:data.network,
    planId:data.planId || data.plan,
    phoneNumber:phone
  }
);

};


const checkTransaction = async(reference)=>{

return await oplugRequest(
  `/vtu/status/${reference}`
);

};


module.exports = {
  getBalance,
  getDataPlans,
  purchaseData,
  checkTransaction
};
