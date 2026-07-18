const { vtuPublicGet } = require("./services/vtuService");

const endpoints = [
"/api/v2/variations/data",
"/api/v2/variations/data/sme",
"/api/v2/variations/data/sme2",
"/api/v2/variations/data/corporate",
"/api/v2/variations/data/gifting"
];

(async()=>{

for(const endpoint of endpoints){

try{

const result = await vtuPublicGet(endpoint);

console.log(
"\nSUCCESS:",
endpoint,
JSON.stringify(result).slice(0,200)
);

}catch(error){

console.log(
"\nFAILED:",
endpoint,
error.response?.status,
error.response?.data || error.message
);

}

}

})();
