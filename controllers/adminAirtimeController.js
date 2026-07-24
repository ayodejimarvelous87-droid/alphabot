const AirtimeOverride = require("../models/AirtimeOverride");


// Get airtime settings
const getAirtimePrices = async(req,res)=>{

try{

const data = await AirtimeOverride.find();

res.json(data);


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
