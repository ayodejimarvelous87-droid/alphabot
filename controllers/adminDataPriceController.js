const ProductOverride = require("../models/ProductOverride");
const DataPlanCache = require("../models/DataPlanCache");


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


// Invalidate the data-plan catalogue cache so the next
// /data/plans request rebuilds the catalogue and applies
// this newly saved ProductOverride.
try{

  await DataPlanCache.deleteOne({
    key:"data-plans"
  });

  console.log(
    "✅ Data plans cache invalidated after admin price save"
  );

}catch(cacheError){

  console.log(
    "⚠️ Data plans cache invalidation failed:",
    cacheError.message
  );

}


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
