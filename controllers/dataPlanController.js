const { vtuPublicGet } = require("../services/vtuService");
const SystemSetting = require("../models/SystemSetting");


const categoriesList = [
"SME",
"SME 2",
"Awoof",
"Gifting",
"Corporate",
"Standard"
];


const getDataPlans = async(req,res)=>{

try{


const response = await vtuPublicGet(
"/api/v2/variations/data"
);


const plans = response.data || [];

const setting = await SystemSetting.findOne();

const profit = setting?.dataProfit || 0;

plans.forEach(plan=>{

plan.reseller_price =
Number(plan.reseller_price) + Number(profit);

});


const grouped = {};



plans.forEach(plan=>{


const network = plan.service_name || "Other";


if(!grouped[network]){

grouped[network] = {};


categoriesList.forEach(category=>{

grouped[network][category] = [];

});

}



const name = (plan.data_plan || "").toLowerCase();


let category = "Standard";


if(name.includes("sme 2")){

category="SME 2";

}
else if(name.includes("sme")){

category="SME";

}
else if(name.includes("gift")){

category="Gifting";

}
else if(name.includes("corporate")){

category="Corporate";

}
else if(
name.includes("awoof") ||
name.includes("weekend") ||
name.includes("sunday") ||
name.includes("1 day") ||
Number(plan.reseller_price)<=500
){

category="Awoof";

}


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



module.exports={
getDataPlans
};
