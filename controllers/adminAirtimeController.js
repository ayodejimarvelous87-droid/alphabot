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


const airtime = await AirtimeOverride.findOneAndUpdate(

{
network
},

{
network,
...req.body
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
