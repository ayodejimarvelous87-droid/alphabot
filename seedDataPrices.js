require("dotenv").config();

const mongoose = require("mongoose");
const DataPrice = require("./models/DataPrice");

const { vtuPublicGet } = require("./services/vtuService");
const { getPlans } = require("./services/blitzPayService");
const { getDataPlans } = require("./services/oplugService");

mongoose.connect(process.env.MONGO_URI)
.then(async()=>{

let allPlans=[];


// VTU
try{

const response = await vtuPublicGet(
"/api/v2/variations/data"
);

(response.data || []).forEach(plan=>{

if(!plan.data_plan || !plan.service_name) return;

allPlans.push({
variation_id:String(plan.variation_id),
provider:"vtu",
network:plan.service_name,
name:plan.data_plan,
providerPrice:Number(plan.reseller_price),
sellingPrice:Number(plan.reseller_price)
});

});

}catch(e){
console.log("VTU error",e.message);
}



// BlitzPay
try{

const response = await getPlans();

(response.plans || []).forEach(plan=>{

if(!plan.network || !plan.price) return;

allPlans.push({
variation_id:String(plan.id),
provider:"blitzpay",
network:plan.network,
name:plan.name || plan.data_plan,
providerPrice:Number(plan.price),
sellingPrice:Number(plan.price)
});

});

}catch(e){
console.log("Blitz error",e.message);
}



// Oplug
try{

for(const network of [
"MTN",
"AIRTEL",
"GLO",
"9MOBILE"
]){

const plans = await getDataPlans(network);

plans.forEach(plan=>{

allPlans.push({
variation_id:String(plan.id),
provider:"oplug",
providerPlanId:String(plan.providerPlanId || plan.id),
network:plan.network,
name:`${plan.network} ${plan.datasize}`,
providerPrice:Number(plan.price),
sellingPrice:Number(plan.price)
});

});

}

}catch(e){
console.log("Oplug error",e.message);
}



console.log("Plans collected:", allPlans.length);



let count=0;


for(const plan of allPlans){

await DataPrice.findOneAndUpdate(
{
variation_id:plan.variation_id
},
plan,
{
upsert:true
}
);

count++;

}


console.log("DataPrice saved:",count);


process.exit();

})
.catch(err=>{
console.log(err);
process.exit(1);
});
