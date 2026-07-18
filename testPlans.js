const { vtuPublicGet } = require("./services/vtuService");

(async()=>{

const response = await vtuPublicGet(
"/api/v2/variations/data"
);

const plans = response.data || [];

plans.forEach(plan=>{

console.log(
plan.variation_id,
"|",
plan.service_name,
"|",
plan.data_plan,
"|",
plan.reseller_price
);

});

})();
