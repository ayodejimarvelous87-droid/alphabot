const ExamPin = require("../models/ExamPin");


// Add Exam PIN

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
getExamStock
};
