const express = require("express");
const router = express.Router();

const FootballMatch = require("../models/FootballMatch");


// Get football matches
router.get("/matches", async(req,res)=>{

try{

const matches = await FootballMatch.find()
.sort({matchDate:1});


res.json(matches);


}catch(error){

res.status(500).json({
message:error.message
});

}

});


module.exports = router;
