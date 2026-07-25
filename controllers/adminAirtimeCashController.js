const AirtimeCash = require("../models/AirtimeCash");
const AirtimeInventory = require("../models/AirtimeInventory");
const Wallet = require("../models/wallet");
const Transaction = require("../models/Transaction");
const { createNotification } = require("../services/notificationService");
const { approveAirtimeCash: approveRequest } = require("../services/airtimeCashApprovalService");


// Get pending requests

const getAirtimeCashRequests = async(req,res)=>{

try{

const requests = await AirtimeCash.find({
status:"pending"
}).sort({
createdAt:-1
});


res.json(requests);


}catch(error){

res.status(500).json({
message:error.message
});

}

};




// Approve request

const approveAirtimeCash = async(req,res)=>{

try{

const wallet = await approveRequest(req.params.id);


res.json({

message:"Airtime cash approved",

wallet

});


}catch(error){


res.status(400).json({

message:error.message

});


}

};


module.exports={

getAirtimeCashRequests,

approveAirtimeCash

};
