require("dotenv").config();

const axios = require("axios");

let token = null;


const getToken = async () => {

  if(token){
    return token;
  }


  try {

    const response = await axios.post(
      `${process.env.VTU_BASE_URL}/jwt-auth/v1/token`,
      {
        username: process.env.VTU_USERNAME,
        password: process.env.VTU_PASSWORD
      },
      {
        headers:{
          "Content-Type":"application/json"
        }
      }
    );


    token = response.data.token;

    console.log("VTU token generated successfully");

    return token;


  } catch(error){

    console.log(
      "VTU authentication error:",
      error.response?.data || error.message
    );

    throw error;

  }

};



const vtuRequest = async(endpoint,data={})=>{
try{
const accessToken = await getToken();
const response = await axios.post(
`${process.env.VTU_BASE_URL}${endpoint}`,
data,
{
headers:{
Authorization:`Bearer ${accessToken}`,
"Content-Type":"application/json"
}
}
);
return response.data;
}catch(error){
if(error.response && error.response.status===401){
token=null;
const newToken=await getToken();
const retry=await axios.post(
`${process.env.VTU_BASE_URL}${endpoint}`,
data,
{
headers:{
Authorization:`Bearer ${newToken}`,
"Content-Type":"application/json"
}
}
);
return retry.data;
}
throw error;
}
};



// GET request helper

const vtuGet = async(endpoint)=>{

  const accessToken = await getToken();


  const response = await axios.get(
    `${process.env.VTU_BASE_URL}${endpoint}`,
    {
      headers:{
        Authorization:`Bearer ${accessToken}`,
        "Content-Type":"application/json"
      }
    }
  );


  return response.data;

};



const purchaseAirtime = async ({
  phone,
  network,
  amount,
  request_id
}) => {

  return await vtuRequest(
    "/api/v2/airtime",
    {
      request_id,
      phone,
      service_id: network.toLowerCase(),
      amount: Number(amount)
    }
  );

};


const vtuPublicGet = async(endpoint)=>{

  const response = await axios.get(
    `${process.env.VTU_BASE_URL}${endpoint}`
  );

  return response.data;

};

const purchaseProduct = async(phone, product)=>{

try{

return await vtuRequest("/api/v2/data",{
request_id:"PRODUCT-"+Date.now(),
phone,
service_id:product.network.toLowerCase(),
variation_id:product.variation_id
});

}catch(error){

return {
success:false,
message:error.response?.data || error.message
};

}

};



const getTVVariations = async()=>{

return await vtuPublicGet("/api/v2/variations/tv");

};


const verifyCustomer = async({customer_id,service_id,variation_id})=>{

return await vtuRequest("/api/v2/verify-customer",{
customer_id,
service_id,
variation_id
});

};


const purchaseTV = async({customer_id,service_id,variation_id,request_id})=>{

return await vtuRequest("/api/v2/tv",{
request_id,
customer_id,
service_id,
variation_id
});

};




const purchaseElectricity = async({customer_id,service_id,variation_id,amount,request_id})=>{

return await vtuRequest("/api/v2/electricity",{
request_id,
customer_id,
service_id,
variation_id,
amount:Number(amount)
});

};

const purchaseBetting = async({customer_id,service_id,amount,request_id})=>{

return await vtuRequest("/api/v2/betting",{
request_id,
customer_id,
service_id,
amount:Number(amount)
});

};

const purchaseEPins = async({network,amount,quantity,request_id})=>{

return await vtuRequest("/api/v2/epins",{
request_id,
service_id:network.toLowerCase(),
value:Number(amount),
quantity:Number(quantity)
});

};


const requeryOrder = async(order_id)=>{

return await vtuRequest("/api/v2/requery",{
order_id
});

};


module.exports = {
  getToken,
  vtuRequest,
  vtuGet,
    vtuPublicGet,
  purchaseAirtime,
    purchaseProduct,
    getTVVariations,
    verifyCustomer,
    purchaseTV,
    purchaseElectricity,
    purchaseBetting,
    purchaseEPins,
    requeryOrder,
};

