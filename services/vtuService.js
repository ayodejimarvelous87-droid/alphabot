const axios = require("axios");
const vtuConfig = require("../config/vtu");

const {
  purchaseCable,
  purchaseElectricity
} = require("./billService");



// Buy data
const purchaseData = async (phone, product) => {
  try {

    const requestData = {
      phone,
      network: product.network,
      plan: product.name,
      amount: product.price
    };


    console.log("Data Request:");
    console.log(requestData);


    return {
      success: true,
      message: "Data purchase processed successfully"
    };


  } catch (error) {

    return {
      success: false,
      message: error.message
    };

  }
};




// Buy airtime
const purchaseAirtime = async (phone, product) => {
  try {

    const requestData = {
      phone,
      network: product.network,
      amount: product.price
    };


    console.log("Airtime Request:");
    console.log(requestData);


    return {
      success: true,
      message: "Airtime purchase processed successfully"
    };


  } catch (error) {

    return {
      success: false,
      message: error.message
    };

  }
};




// Select correct service
const purchaseProduct = async (phone, product) => {


  if (product.type === "data") {
    return await purchaseData(phone, product);
  }


  if (product.type === "airtime") {
    return await purchaseAirtime(phone, product);
  }


  if (product.type === "cable") {
    return await purchaseCable(phone, product);
  }


  if (product.type === "electricity") {
    return await purchaseElectricity(phone, product);
  }


  return {
    success: false,
    message: "Unsupported product type"
  };

};



module.exports = {
  purchaseProduct
};