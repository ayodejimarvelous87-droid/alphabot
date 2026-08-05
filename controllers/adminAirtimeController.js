const AirtimeOverride = require("../models/AirtimeOverride");
const { getAirtimePlans } = require("../services/airtimePlanService");


// Get airtime settings
const getAirtimePrices = async(req,res)=>{

try{

const overrides = await AirtimeOverride.find();

const plans = await getAirtimePlans();

const merged = plans.map(plan=>{

const override = overrides.find(
item=>item.network === plan.network
);

return {
...plan,
sellingPrice:
override?.sellingPrice ||
plan.providerPrice,

profit:
Number(
override?.sellingPrice ||
plan.providerPrice
) - Number(plan.providerPrice),

active:
override?.active !== false

};

});

res.json(merged);


}catch(error){

res.status(500).json({
message:error.message
});

}

};


// Update airtime network price
const updateAirtimePrice = async(req,res)=>{

try{

const {network}=req.params;


const discount = Number(
req.body.discount || 0
);


const providerPrice = Number(
req.body.providerPrice || 0
);


const sellingPrice = Number(
req.body.sellingPrice || 0
);


const profit = sellingPrice - providerPrice;


const airtime = await AirtimeOverride.findOneAndUpdate(

{
network:network.toUpperCase()
},

{
network:network.toUpperCase(),
providerPrice,
discount,
sellingPrice,
profit,
active:req.body.active !== false
},

{
new:true,
upsert:true
}

);


res.json({
message:"Airtime price updated",
airtime
});


}catch(error){

res.status(500).json({
message:error.message
});

}

};


module.exports={
getAirtimePrices,
updateAirtimePrice
};
