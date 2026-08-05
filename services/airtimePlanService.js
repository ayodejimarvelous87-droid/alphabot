const { getPlans } = require("./blitzPayService");

const NETWORKS = [
"MTN",
"AIRTEL",
"GLO",
"9MOBILE"
];


const getAirtimePlans = async()=>{

const result=[];


// VTU airtime has no variations endpoint
NETWORKS.forEach(network=>{

result.push({
provider:"vtu",
network,
providerPrice:0
});

});


// Blitz
try{

const response = await getPlans();

const plans =
response.plans || [];


plans.forEach(item=>{

const service =
String(
item.service ||
item.type ||
item.category ||
""
).toLowerCase();


if(!service.includes("airtime"))
return;


const network =
String(
item.network ||
item.service_name ||
""
).toUpperCase();


if(!NETWORKS.includes(network))
return;


result.push({

provider:"blitzpay",
network,
providerPrice:Number(
item.price || 0
)

});


});


}catch(error){

console.log(
"Blitz airtime fetch:",
error.message
);

}


return result;

};


module.exports={
getAirtimePlans
};
