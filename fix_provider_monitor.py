from pathlib import Path

p = Path("services/providerMonitorService.js")
s = p.read_text()

s = s.replace(
"""const ProviderHealth = require("../models/ProviderHealth");""",
"""const ProviderHealth = require("../models/ProviderHealth");
const mongoose = require("mongoose");"""
)

s = s.replace(
"""try{

  let record = await ProviderHealth.findOne({""",
"""try{

  if(mongoose.connection.readyState !== 1){
    return;
  }

  let record = await ProviderHealth.findOne({"""
)

s = s.replace(
"""try {

      record = await ProviderHealth.findOne({""",
"""try {

      if(mongoose.connection.readyState !== 1){
        return true;
      }

      record = await ProviderHealth.findOne({"""
)

p.write_text(s)

print("✅ Provider monitor Mongo guard added")
