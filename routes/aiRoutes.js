const express = require("express");
const router = express.Router();

const { getAIReply } = require("../services/aiService");


router.post("/chat",(req,res)=>{

const {message}=req.body;


if(!message){
return res.status(400).json({
message:"Message required"
});
}


const reply = getAIReply(message);


res.json({
reply
});

});


module.exports = router;
