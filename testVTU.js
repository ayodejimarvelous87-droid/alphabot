require("dotenv").config();

const { getToken } = require("./services/vtuService");

getToken()
.then((token)=>{
  console.log("TOKEN OK");
  console.log(token.substring(0,20) + "...");
})
.catch((error)=>{
  console.log("FAILED");
});
