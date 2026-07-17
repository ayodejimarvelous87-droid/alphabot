const axios = require("axios");


// Cable TV purchase
const purchaseCable = async (phone, product) => {
  try {

    const requestData = {
      phone,
      service: product.name,
      amount: product.price
    };


    console.log("Cable TV Request:");
    console.log(requestData);


    // Real API call will be added later


    return {
      success: true,
      message: "Cable subscription processed successfully"
    };


  } catch (error) {

    return {
      success: false,
      message: error.message
    };

  }
};



// Electricity purchase
const purchaseElectricity = async (phone, product) => {
  try {

    const requestData = {
      phone,
      service: product.name,
      amount: product.price
    };


    console.log("Electricity Request:");
    console.log(requestData);


    // Real API call will be added later


    return {
      success: true,
      message: "Electricity payment processed successfully"
    };


  } catch (error) {

    return {
      success: false,
      message: error.message
    };

  }
};



module.exports = {
  purchaseCable,
  purchaseElectricity
};