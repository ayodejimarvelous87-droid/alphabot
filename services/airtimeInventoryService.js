const AirtimeInventory = require("../models/AirtimeInventory");

const initializeAirtimeInventory = async()=>{

const networks=[
"MTN",
"AIRTEL"
];


for(const network of networks){

const exists = await AirtimeInventory.findOne({
network
});


if(!exists){

await AirtimeInventory.create({
network,
storedAmount:0,
limit:1500
});

}

}

};


module.exports = {
initializeAirtimeInventory
};
