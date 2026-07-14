const {
  purchaseCable,
  purchaseElectricity
} = require("./billService");

const { buyAirtime } = require("./clubkonnectAirtime");
const { buyData } = require("./clubkonnectData");


// Buy data
const purchaseData = async (phone, product) => {

  try {

    return await buyData(
      phone,
      product.network,
      product.providerCode
    );

  } catch(error){

    return {
      success:false,
      message:error.message
    };

  }

};


// Buy airtime
const purchaseAirtime = async (phone, product) => {

  try {

    return await buyAirtime(
      phone,
      product.network,
      product.price
    );

  } catch(error){

    return {
      success:false,
      message:error.message
    };

  }

};



const purchaseProduct = async (phone, product) => {

  if(product.type === "data" || product.type === "mifi"){
    return await purchaseData(phone, product);
  }

  if(product.type === "airtime"){
    return await purchaseAirtime(phone, product);
  }

  if(product.type === "cable"){
    return await purchaseCable(phone, product);
  }

  if(product.type === "electricity"){
    return await purchaseElectricity(phone, product);
  }


  return {
    success:false,
    message:"Unsupported product type"
  };

};


module.exports = {
  purchaseProduct
};
