const mongoose = require("mongoose");

const recurringSchema = new mongoose.Schema(
{
    phone:{
        type:String,
        required:true
    },

    service:{
        type:String,
        enum:["data","airtime","betting"],
        required:true
    },

    provider:{
        type:String,
        default:""
    },

    productId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Product",
        default:null
    },

    amount:{
        type:Number,
        required:true
    },

    frequency:{
        type:String,
        enum:["daily","weekly","monthly"],
        required:true
    },

    status:{
        type:String,
        enum:["active","paused","cancelled"],
        default:"active"
    },

    nextRun:{
        type:Date,
        required:true
    }
},
{
    timestamps:true
}
);

module.exports = mongoose.model("Recurring", recurringSchema);
