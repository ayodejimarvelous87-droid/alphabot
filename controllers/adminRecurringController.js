const AppError = require("../utils/AppError");
const Recurring = require("../models/Recurring");


// Get all recurring payments
const getAllRecurring = async(req,res)=>{

try{

const recurring = await Recurring.find()
.sort({createdAt:-1});


res.json(recurring);


}catch(error){

res.status(500).json({
message:error.message
});

}

};



// Cancel recurring from admin
const cancelRecurringAdmin = async(req,res)=>{

try{

const recurring =
await Recurring.findById(req.params.id);


if(!recurring){

throw new AppError(
  "Recurring payment not found",
  404
);

}


recurring.status="cancelled";

await recurring.save();


res.json({
message:"Recurring payment cancelled",
recurring
});


}catch(error){

res.status(500).json({
message:error.message
});

}

};


module.exports={
getAllRecurring,
cancelRecurringAdmin
};
