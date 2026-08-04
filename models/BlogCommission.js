const mongoose = require("mongoose");

const blogCommissionSchema = new mongoose.Schema({

blogPartner:{
type:mongoose.Schema.Types.ObjectId,
ref:"BlogPartner",
required:true
},

user:{
type:mongoose.Schema.Types.ObjectId,
ref:"User"
},

reference:{
type:String,
unique:true,
required:true
},

amount:{
type:Number,
default:0
},

transactionAmount:{
type:Number,
default:0
},

service:{
type:String,
default:"unknown"
},

transactionReference:{
type:String
},

createdAt:{
type:Date,
default:Date.now
}

});


module.exports = mongoose.model(
"BlogCommission",
blogCommissionSchema
);
