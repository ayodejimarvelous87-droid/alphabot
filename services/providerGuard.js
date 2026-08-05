require("dotenv").config();


const {getBalance: getOplugBalance} = require("./oplugService");
const {getBalance: getBlitzBalance} = require("./blitzPayService");
const {vtuGet} = require("./vtuService");
const SystemSetting = require("../models/SystemSetting");


const checkProviderBalance = async(provider)=>{

try{

let balance = 0;

if(provider === "oplug"){

const data = await getOplugBalance();

balance = Number(
data.balance ||
data.data?.balance ||
0
);

}


else if(provider === "blitzpay"){

const data = await getBlitzBalance();

balance = Number(
data.balance ||
data.data?.balance ||
0
);

}


else if(provider === "vtu"){

const data = await vtuGet("/api/v2/balance");

balance = Number(
data.balance ||
data.data?.balance ||
0
);

}


console.log(
  `${provider.toUpperCase()} PROVIDER BALANCE:`,
  balance
);

let minimumBalance = 500;

try{

const setting = await SystemSetting.findOne();

if(setting?.providerMinimumBalance){
  minimumBalance = Number(setting.providerMinimumBalance);
}

}catch(error){

console.log(
  "Provider minimum balance setting unavailable, using default:",
  minimumBalance
);

}

if(balance < minimumBalance){

  console.log(
    `${provider} blocked: low provider balance`
  );

throw new Error(
"Service temporarily unavailable. Please try again shortly."
);

}


return true;

}catch(error){

console.log(
"PROVIDER BALANCE CHECK FAILED:",
error.message
);

throw new Error(
"Service temporarily unavailable. Please try again shortly."
);

}

};


module.exports = {
checkProviderBalance
};
