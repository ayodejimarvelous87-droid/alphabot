const { vtuPublicGet } = require("../services/vtuService");
const { getPlans } = require("../services/blitzPayService");
const { getDataPlans: getOplugPlans } = require("../services/oplugService");
const SystemSetting = require("../models/SystemSetting");
const savedPlans = require("../plans.json");


const categoriesList = [
"SME",
"SME 2",
"Awoof",
"Gifting",
"Corporate",
"Standard"
];


const formatCategory = (plan)=>{

const name = (
plan.data_plan || plan.type ||
plan.name ||
""
).toLowerCase();


if(name.includes("sme 2") || name.includes("sme2")){
return "SME 2";
}

if(name.includes("sme")){
return "SME";
}

if(name.includes("gift")){
return "Gifting";
}

if(name.includes("corporate")){
return "Corporate";
}

if(
name.includes("awoof") ||
name.includes("weekend") ||
name.includes("sunday") ||
name.includes("1 day") ||
Number(plan.reseller_price || plan.price) <= 500
){

return "Awoof";

}

return "Standard";

};



const getDataPlans = async(req,res)=>{

try{


const setting = await SystemSetting.findOne();

const profit = setting?.dataProfit || 0;



let allPlans = [];


// VTU.ng plans

try{

const vtuResponse = await vtuPublicGet(
"/api/v2/variations/data"
);


const vtuPlans = vtuResponse.data || [];


vtuPlans.forEach(plan=>{

if(
!plan.data_plan || plan.type ||
!plan.service_name ||
plan.availability === "Unavailable"
){
return;
}

allPlans.push({
...plan,
network: plan.service_name,
service_name: plan.service_name,
name: plan.data_plan,
price: Number(plan.reseller_price),
provider:"vtu",
display_price:Number(plan.reseller_price) + Number(profit)
});

});


}catch(error){

console.log(
"VTU plans error:",
error.message
);

}



// BlitzPay plans

try{

const blitzResponse = await getPlans();


const blitzPlans = blitzResponse.plans || [];


blitzPlans.forEach(plan=>{

if(
!plan.name &&
!plan.data_plan
){
return;
}

if(
!plan.network ||
Number(plan.price) <= 0
){
return;
}

allPlans.push({
...plan,
service_name: plan.network,
provider:"blitzpay",
display_price:Number(plan.price) + Number(profit)
});

});


}catch(error){

console.log(
"BlitzPay plans error:",
error.message
);

}



// OPLUG plans
try{

const oplugNetworks = ["MTN","AIRTEL","GLO","9MOBILE"];

for(const network of oplugNetworks){

const oplugPlans = await getOplugPlans(network);

oplugPlans.forEach(plan=>{

allPlans.push({
...plan,
service_name: plan.network,
name: `${plan.network} ${plan.datasize}`,
price:Number(plan.price),
provider:"oplug",
variation_id:plan.plan_id,
display_price:Number(plan.price) + Number(profit),
validity:`${plan.day} Days`
});

});

}

}catch(error){
console.log("OPLUG plans error:", error.message);
}



// Add missing Oplug plans from saved cache
try {
const savedOplug = [];
for(const network in savedPlans.networks){
for(const category in savedPlans.networks[network]){
savedPlans.networks[network][category].forEach(plan=>{
if(plan.provider==="oplug") savedOplug.push(plan);
});
}
}

const existingIds = new Set(allPlans.filter(p=>p.provider==="oplug").map(p=>p.variation_id));

savedOplug.forEach(plan=>{
if(!existingIds.has(plan.variation_id)){
allPlans.push(plan);
}
});


}catch(e){
console.log("Saved Oplug merge error:",e.message);
}

const grouped = {};



allPlans.forEach(plan=>{


let network =
plan.service_name ||
plan.network ||
"Other";

network = network.toString().trim().toLowerCase();

if(network.includes("mtn")){
network = "MTN";
}
else if(network.includes("airtel")){
network = "Airtel";
}
else if(network.includes("glo")){
network = "Glo";
}
else if(network.includes("9mobile") || network.includes("etisalat")){
network = "9mobile";
}
else{
network = "Other";
}



if(!grouped[network]){

grouped[network] = {};


categoriesList.forEach(category=>{

grouped[network][category] = [];

});

}



const category = formatCategory(plan);


grouped[network][category].push(plan);


});



Object.keys(grouped).forEach(network=>{
Object.keys(grouped[network]).forEach(category=>{
if(grouped[network][category].length===0){
delete grouped[network][category];
}
});
if(Object.keys(grouped[network]).length===0 || network==="Other"){
delete grouped[network];
}
});

res.json({

success:true,

networks:grouped

});


}catch(error){


console.log(
"Data plans error:",
error.message
);


res.status(500).json({

message:error.message

});


}

};



module.exports = {
getDataPlans
};
