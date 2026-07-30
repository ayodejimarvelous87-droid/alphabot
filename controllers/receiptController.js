const AppError = require("../utils/AppError");
const Transaction = require("../models/Transaction");


const getReceipt = async(req,res)=>{

try{

const { id } = req.params;


const transaction = await Transaction.findById(id);


if(!transaction){

throw new AppError(
  "Receipt not found",
  404
);

}


res.json({

receipt: transaction

});


}catch(error){

res.status(500).json({

message:error.message

});

}

};



module.exports = {

getReceipt

};
