from pathlib import Path
import re

file = Path("services/oplugService.js")
text = file.read_text()

pattern = r"const getDataPlans = async\(network\)=>\{.*?\n\};"

replacement = r'''const getDataPlans = async(network)=>{

try{

const services = await oplugRequest("/vtu/services");

const servicePlans = services.data?.data?.[network] || [];

return servicePlans.map(plan=>({

id: plan.id,
providerPlanId: plan.id,
plan_id: plan.id,
network: plan.network,
type: plan.type,
datasize: plan.size || plan.datasize,
day: plan.validity,
name: plan.name,
price: plan.api_price

}));

}catch(error){

console.log("OPLUG GET PLANS ERROR:", error.message);

return [];

}

};'''

new_text, count = re.subn(pattern, replacement, text, flags=re.S)

if count:
    file.write_text(new_text)
    print("✅ getDataPlans replaced")
else:
    print("❌ Function not found")
