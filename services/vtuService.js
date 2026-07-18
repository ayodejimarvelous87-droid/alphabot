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



const purchaseAirtime = async({
  phone,
  network,
  amount,
  request_id
})=>{


  return await vtuRequest(
    "/api/v2/airtime",
    {
      request_id,
      phone,
      service_id: network.toLowerCase(),
      amount:Number(amount)
    }
  );


};



const vtuPublicGet = async(endpoint)=>{

  const response = await axios.get(
    `${process.env.VTU_BASE_URL}${endpoint}`
  );

  return response.data;

};

module.exports = {
  getToken,
  vtuRequest,
  vtuGet,
    vtuPublicGet,
  purchaseAirtime
};
