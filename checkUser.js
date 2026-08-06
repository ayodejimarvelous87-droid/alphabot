require("dotenv").config();

const mongoose = require("mongoose");
const User = require("./models/User");

async function run(){

await mongoose.connect(process.env.MONGO_URI);

const user = await User.findOne({
phone:{
$regex:"9037120624"
}
}).select("phone name email");

console.log(user);

await mongoose.disconnect();

}

run();
