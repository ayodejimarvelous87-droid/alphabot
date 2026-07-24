const ProductOverride = require("../models/ProductOverride");


// Save/update plan settings
const updateDataPrice = async(req,res)=>{

try{

const {id}=req.params;

const override = await ProductOverride.findOneAndUpdate(
{
productId:id
},
{
productId:id,
...req.body
},
{
new:true,
upsert:true
}
);


res.json({
message:"Plan updated",
override
});


}catch(error){

res.status(500).json({
message:error.message
});

}

};



// Get admin overrides
const getDataPrices = async(req,res)=>{

try{

const data = await ProductOverride.find();

res.json(data);


}catch(error){

res.status(500).json({
message:error.message
});

}

};



module.exports={
updateDataPrice,
getDataPrices
};
