const Profit = require("../models/Profit");


const getProfits = async(req,res)=>{

try{

const profits = await Profit.find();


const totalSales = profits.reduce(
(sum,item)=>sum + Number(item.customerAmount || 0),
0
);


const totalCost = profits.reduce(
(sum,item)=>sum + Number(item.providerCost || 0),
0
);


const totalProfit = profits.reduce(
(sum,item)=>sum + Number(item.profit || 0),
0
);


const airtimeProfit = profits
.filter(item=>item.service==="airtime")
.reduce(
(sum,item)=>sum + Number(item.profit || 0),
0
);


res.json({

totalSales,

totalCost,

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
