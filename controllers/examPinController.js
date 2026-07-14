const ExamPin = require("../models/ExamPin");
const Wallet = require("../models/wallet");
const Transaction = require("../models/Transaction");
const { createNotification } = require("../services/notificationService");


// Buy Exam PIN

const buyExamPin = async(req,res)=>{

try{


const {
phone,
exam,
quantity,
pin
}=req.body;



if(!phone || !exam || !quantity){

return res.status(400).json({
message:"Exam type and quantity are required"
});

}



const pins = await ExamPin.find({

exam,
status:"available"

})
.limit(Number(quantity));



if(pins.length < Number(quantity)){

return res.status(400).json({

message:"Insufficient PIN stock"

});

}



const total =
pins.reduce((sum,item)=>sum + item.price,0);



const wallet = await Wallet.findOne({
phone
});


if(!wallet){

return res.status(404).json({
message:"Wallet not found"
});

}



if(wallet.balance < total){

return res.status(400).json({

message:"Insufficient wallet balance"

});

}



const balanceBefore = wallet.balance;


wallet.balance -= total;


await wallet.save();



let purchasedPins=[];


for(const item of pins){


item.status="used";

item.usedBy=phone;

item.usedAt=new Date();


await item.save();


purchasedPins.push(item.pin);


}




const reference =
"EXAM-" + Date.now();



await Transaction.create({

phone,

type:"exam_pin",

direction:"debit",

amount:total,

reference,

balanceBefore,

balanceAfter:wallet.balance,

description:`${exam} PIN purchase`,

status:"successful"

});




await createNotification(

phone,

"Exam PIN Purchase Successful",

`${exam} PIN purchased successfully.`,

"success"

);




res.json({

message:"Exam PIN purchase successful",

pins:purchasedPins,

balance:wallet.balance

});



}catch(error){


res.status(500).json({

message:error.message

});


}

};



module.exports={
buyExamPin
};
