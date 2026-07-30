const Transaction = require("../models/Transaction");


const checkIdempotency = async(idempotencyKey)=>{

if(!idempotencyKey){
return null;
}


const existing = await Transaction.findOne({
idempotencyKey
});


return existing || null;

};



const saveIdempotencyKey = async(transaction,key)=>{

if(!key){
return;
}


transaction.idempotencyKey = key;

await transaction.save();

};



module.exports = {
checkIdempotency,
saveIdempotencyKey
};
