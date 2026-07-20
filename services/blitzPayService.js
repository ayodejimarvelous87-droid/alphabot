require("dotenv").config();
const axios = require("axios");

const BASE_URL =
"https://tljnhlhzyntotadxoypz.supabase.co/functions/v1";


const blitzRequest = async(endpoint, method="GET", data=null)=>{

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


return response.data;


}catch(error){

console.log(
"BlitzPay error:",
error.response?.data || error.message
);

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
