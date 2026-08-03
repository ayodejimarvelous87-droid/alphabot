require("dotenv").config();
const axios = require("axios");
const { recordProviderResult, canUseProvider } = require("./providerMonitorService");

const BASE_URL =
"https://tljnhlhzyntotadxoypz.supabase.co/functions/v1";


const blitzRequest = async(endpoint, method="GET", data=null)=>{

const startTime = Date.now();


const providerAvailable = await canUseProvider({
  provider:"blitzpay",
  service:endpoint
});


if(!providerAvailable){

  throw new Error(
    "BlitzPay service temporarily unavailable. Please try again later."
  );

}


try{

const config = {
headers:{
"x-api-key": process.env.BLITZPAY_API_KEY,
"Content-Type":"application/json"
}
};


let response;


if(method === "POST"){

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
provider:"blitzpay",
service:endpoint,
success:true,
responseTime:Date.now()-startTime
});


return response.data;


  }catch(error){

    await recordProviderResult({
      provider:"blitzpay",
      service:endpoint,
      success:false,
      responseTime:Date.now()-startTime,
      error: JSON.stringify(error.response?.data || error.message)
    });

    console.log("BLITZPAY FULL ERROR:", JSON.stringify(error.response?.data || error.message, null, 2));

    throw error;
  }
};

const getBalance = async()=>{

return await blitzRequest("/api-balance");

};



const getPlans = async()=>{

return await blitzRequest("/api-plans");

};



const getServices = async()=>{

return await blitzRequest("/api-services");

};



const verifyCustomer = async(data)=>{

return await blitzRequest(
"/api-verify",
"POST",
data
);

};



const purchase = async(data)=>{

return await blitzRequest(
"/api-purchase",
"POST",
data
);

};



const checkTransaction = async(reference)=>{

return await blitzRequest(
`/api-transaction/${reference}`
);

};



const getCablePackages = async()=>{

const services = await getServices();

return services.cable_packages || services;

};

module.exports = {
getBalance,
getPlans,
getServices,
getCablePackages,
verifyCustomer,
purchase,
checkTransaction
};
