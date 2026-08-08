from pathlib import Path

p = Path("services/providerMonitorService.js")
s = p.read_text()

s = s.replace(
'const ProviderHealth = require("../models/ProviderHealth");',
'const ProviderHealth = require("../models/ProviderHealth");\nconst mongoose = require("mongoose");'
)

s = s.replace(
'const recordProviderResult = async ({',
'const recordProviderResult = async ({'
)

# Add guards before every ProviderHealth.findOne
s = s.replace(
'let record = await ProviderHealth.findOne({',
'''if(mongoose.connection.readyState !== 1){
  return;
}

  let record = await ProviderHealth.findOne({'''
)

s = s.replace(
'record = await ProviderHealth.findOne({',
'''if(mongoose.connection.readyState !== 1){
        return true;
      }

      record = await ProviderHealth.findOne({'''
)

p.write_text(s)

print("✅ monitor fully guarded")
