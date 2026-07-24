require("dotenv").config();
const axios = require("axios");

const BASE_URL = process.env.OPLUG_BASE_URL;

const oplugRequest = async(endpoint, method="GET", data=null)=>{

try{

const config = {
headers:{
Authorization:`Bearer ${process.env.OPLUG_API_KEY}`,
"Content-Type":"application/json"
}
};


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


return response.data;


}catch(error){

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

const plans = await oplugRequest(
`/vtu/data-plans?network=${network}`
);

try{

const services = await oplugRequest("/vtu/services");

const servicePlans = services.data?.data?.[network] || [];

return plans.map(plan=>{

const match = servicePlans.find(item=>
Number(item.api_price) === Number(plan.price) &&
item.network?.toUpperCase() === network.toUpperCase()
);

return {
...plan,
id: plan.plan_id
};

});

}catch(error){

return plans;

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
