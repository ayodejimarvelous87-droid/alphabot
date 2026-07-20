const { vtuPublicGet } = require("../services/vtuService");
const { getPlans } = require("../services/blitzPayService");
const SystemSetting = require("../models/SystemSetting");


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
plan.data_plan ||
plan.name ||
""
).toLowerCase();


if(name.includes("sme 2")){
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

allPlans.push({

...plan,

provider:"vtu",

display_price:
Number(plan.reseller_price) + Number(profit)

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

allPlans.push({

...plan,

provider:"blitzpay",

display_price:
Number(plan.price) + Number(profit)

});

});


}catch(error){

console.log(
"BlitzPay plans error:",
error.message
);

}



const grouped = {};



allPlans.forEach(plan=>{


const network =
plan.service_name ||
plan.network ||
"Other";



if(!grouped[network]){

grouped[network] = {};


categoriesList.forEach(category=>{

grouped[network][category] = [];

});

}



const category = formatCategory(plan);


grouped[network][category].push(plan);


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
