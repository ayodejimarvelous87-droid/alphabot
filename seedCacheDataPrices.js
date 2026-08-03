require("dotenv").config();

const mongoose = require("mongoose");
const DataPrice = require("./models/DataPrice");
const savedPlans = require("./plans.json");

mongoose.connect(process.env.MONGO_URI)
.then(async()=>{

let count = 0;

for(const network in savedPlans.networks){

  for(const category in savedPlans.networks[network]){

    for(const plan of savedPlans.networks[network][category]){

      const variation =
        String(
          plan.variation_id ||
          plan.id ||
          plan.plan_id
        );

      if(!variation) continue;


      await DataPrice.findOneAndUpdate(
        {
          variation_id: variation
        },
        {
          variation_id: variation,
          provider: plan.provider || "oplug",
          network: plan.network || network,
          name: plan.name || plan.datasize,
          providerPrice: Number(
            plan.price ||
            plan.providerPrice ||
            0
          ),
          sellingPrice: Number(
            plan.price ||
            plan.providerPrice ||
            0
          )
        },
        {
          upsert:true
        }
      );

      count++;

    }
  }
}

console.log("Cache plans saved:", count);

process.exit();

})
.catch(err=>{
console.log(err);
process.exit(1);
});
