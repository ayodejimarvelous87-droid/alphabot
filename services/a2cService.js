const axios = require("axios");

const BASE_URL = process.env.A2C_BASE_URL;
const TOKEN = process.env.A2C_TOKEN;

const headers = {
  "Content-Type": "application/json",
  "Accept": "application/json"
};

const authHeaders = {
  ...headers,
  Authorization:`Bearer ${TOKEN}`
};

// Generate OTP
const generateOTP = async(networkName, sender)=>{
  try{

    const response = await axios.post(
      `${BASE_URL}/api/v1/generate/otp`,
      {
        networkName,
        sender
      },
      {
        headers:authHeaders
      }
    );

    return response.data;

  }catch(error){

    console.log(
      "A2C OTP ERROR:",
      error.response?.data || error.message
    );

    throw error;
  }
};


// Verify OTP
const verifyOTP = async(networkName, sender, otp)=>{
  const response = await axios.post(
    `${BASE_URL}/api/v1/verify/otp`,
    {
      networkName,
      sender,
      otp
    },
    {
      headers:authHeaders
    }
  );

  return response.data;
};


// Protected headers


// Check quota
const checkQuota = async(networkName, amount)=>{
  const response = await axios.post(
    `${BASE_URL}/api/v1/check/quota/availability`,
    {
      networkName,
      amount
    },
    {
      headers:authHeaders
    }
  );

  return response.data;
};


// Transfer airtime
const transferAirtime = async(data)=>{
  const response = await axios.post(
    `${BASE_URL}/api/v1/transfer/airtime`,
    data,
    {
      headers:authHeaders
    }
  );

  return response.data;
};


module.exports = {
  generateOTP,
  verifyOTP,
  checkQuota,
  transferAirtime,
  verifyOTP
};
