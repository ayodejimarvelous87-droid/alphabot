const mongoose = require("mongoose");
require("dotenv").config();

const BettingSetting = require("./models/BettingSetting");


const services = [
"bet9ja",
"sportybet",
"1xbet",
"betking"
];


async function seed(){

try{

await mongoose.connect(process.env.MONGO_URI);


for(const service of services){

await BettingSetting.findOneAndUpdate(
{
service
},
{
service,
fee:0,
active:true
},
{
upsert:true,
new:true
}
);

}


console.log("Betting settings seeded");

process.exit();


}catch(error){

console.log(error.message);

process.exit(1);

}

}


seed();
