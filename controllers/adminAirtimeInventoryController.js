const AirtimeInventory = require("../models/AirtimeInventory");


// Get airtime inventory

const getAirtimeInventory = async(req,res)=>{

try{

const inventory = await AirtimeInventory.find()
.sort({network:1});

res.json(inventory);


}catch(error){

res.status(500).json({
message:error.message
});

}

};



// Update inventory limit

const updateAirtimeInventoryLimit = async(req,res)=>{

try{

const network = req.params.network.toUpperCase();

const { limit } = req.body;


if(!limit){

return res.status(400).json({
message:"Limit is required"
});

}


const inventory = await AirtimeInventory.findOne({
network
});


if(!inventory){

return res.status(404).json({
message:"Network inventory not found"
});

}


inventory.limit = Number(limit);

await inventory.save();


res.json({
message:"Airtime inventory limit updated",
inventory
});


}catch(error){

res.status(500).json({
message:error.message
});

}

};


module.exports={
getAirtimeInventory,
updateAirtimeInventoryLimit
};
