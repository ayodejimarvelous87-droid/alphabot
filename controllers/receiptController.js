const Transaction = require("../models/Transaction");


const getReceipt = async(req,res)=>{

try{

const { id } = req.params;


const transaction = await Transaction.findById(id);


if(!transaction){

return res.status(404).json({

message:"Receipt not found"

});

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
