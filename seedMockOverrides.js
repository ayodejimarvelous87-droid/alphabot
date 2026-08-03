require("dotenv").config();

const mongoose = require("mongoose");
const DataPrice = require("./models/DataPrice");
const ProductOverride = require("./models/ProductOverride");

mongoose.connect(process.env.MONGO_URI)
.then(async()=>{

const plans = await DataPrice.find();

let count = 0;

for(const plan of plans){

await ProductOverride.findOneAndUpdate(
{
productId:String(plan.variation_id)
},
{
productId:String(plan.variation_id),
provider:plan.provider,
providerPlanId: plan.plan_id || plan.variation_id,
network:plan.network,
name:plan.name,
providerPrice:Number(plan.providerPrice),
sellingPrice:50,
active:true
},
{
upsert:true
}
);

count++;

}

console.log("Mock overrides created:",count);

process.exit();

})
.catch(err=>{
console.log(err);
process.exit(1);
});
