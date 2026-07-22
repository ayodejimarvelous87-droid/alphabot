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

return await oplugRequest(
`/vtu/data-plans?network=${network}`
);

};


const purchaseData = async(data)=>{

let phone = data.phone;

if(phone.startsWith("+234")){
phone = "0" + phone.slice(4);
}

return await oplugRequest(
"/vtu/data",
"POST",
{
plan:data.plan,
phone
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
