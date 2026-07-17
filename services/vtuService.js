




const {
  purchaseCable,
  purchaseElectricity
} = require("./billService");


// Temporary data purchase
const purchaseData = async (phone, product) => {

  return {
    success: false,
    message: "Data provider not connected yet"
  };

};


// Temporary airtime purchase
const purchaseAirtime = async (phone, product) => {

  return {
    success: false,
    message: "Airtime provider not connected yet"
  };

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
