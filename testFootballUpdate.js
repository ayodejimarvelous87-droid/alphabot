require("dotenv").config();
const mongoose = require("mongoose");
const updateFootballMatches = require("./services/footballService");

mongoose.connect(process.env.MONGO_URI,{
 serverSelectionTimeoutMS:5000
})
.then(async()=>{

console.log("Mongo connected");

await updateFootballMatches();

process.exit();

})
.catch(err=>{

console.log(err.message);
process.exit();

});
