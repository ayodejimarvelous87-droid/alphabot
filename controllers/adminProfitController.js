const Profit = require("../models/Profit");

const getProfits = async(req,res)=>{

try{

const profits = await Profit.find();

const totalProfit = profits.reduce(
(sum,item)=>sum + Number(item.amount || 0),
0
);


const airtimeProfit = profits
.filter(item=>item.service==="airtime")
.reduce(
(sum,item)=>sum + Number(item.amount || 0),
0
);


res.json({
totalProfit,
airtimeProfit,
records:profits
});


}catch(error){

res.status(500).json({
message:error.message
});

}

};


module.exports={
getProfits
};
