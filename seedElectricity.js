const mongoose = require("mongoose");
require("dotenv").config();

const ElectricitySetting = require("./models/ElectricitySetting");

const discos = [
  "ikeja-electric",
  "eko-electric",
  "abuja-electric",
  "ibadan-electric",
  "enugu-electric",
  "portharcourt-electric",
  "kaduna-electric",
  "jos-electric",
  "benin-electric",
  "aba-electric",
  "yola-electric",
  "kano-electric"
];

async function seed(){

  try{

    await mongoose.connect(process.env.MONGO_URI);

    for(const disco of discos){

      await ElectricitySetting.findOneAndUpdate(
        { disco },
        {
          disco,
          fee:0,
          active:true
        },
        {
          upsert:true,
          new:true
        }
      );

    }

    console.log("Electricity settings seeded");

    process.exit();

  }catch(error){

    console.log(error.message);
    process.exit(1);

  }

}

seed();
