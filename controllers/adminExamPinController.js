const ExamPin = require("../models/ExamPin");


// Add single Exam PIN
const addExamPin = async(req,res)=>{

try{

const {
exam,
pin,
price
}=req.body;


const exists = await ExamPin.findOne({
pin
});


if(exists){

return res.status(400).json({
message:"PIN already exists"
});

}


const examPin = await ExamPin.create({

exam,
pin,
price

});


res.json({

message:"Exam PIN added",
examPin

});


}catch(error){

res.status(500).json({
message:error.message
});

}

};



// Bulk add Exam PINs
const bulkAddExamPins = async(req,res)=>{

try{

const {
exam,
price,
pins
}=req.body;


if(!exam || !price || !Array.isArray(pins) || pins.length === 0){

return res.status(400).json({
message:"Exam, price and PIN list are required"
});

}



const existingPins = await ExamPin.find({

pin:{
$in:pins
}

});


const existingValues = existingPins.map(item=>item.pin);



const newPins = pins
.filter(pin=>!existingValues.includes(pin))
.map(pin=>({

exam,
pin,
price:Number(price)

}));



if(newPins.length === 0){

return res.status(400).json({

message:"All PINs already exist"

});

}



await ExamPin.insertMany(newPins);



res.json({

message:"Bulk Exam PIN upload successful",
added:newPins.length,
duplicates:existingValues.length

});


}catch(error){

res.status(500).json({

message:error.message

});

}

};



// View stock
const getExamStock = async(req,res)=>{

try{

const stock = await ExamPin.aggregate([

{
$match:{
status:"available"
}
},

{
$group:{
_id:"$exam",
total:{
$count:{}
}
}
}

]);


res.json(stock);


}catch(error){

res.status(500).json({
message:error.message
});

}

};



module.exports={

addExamPin,
bulkAddExamPins,
getExamStock

};
