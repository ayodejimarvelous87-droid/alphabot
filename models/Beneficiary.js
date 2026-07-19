const mongoose = require("mongoose");

const beneficiarySchema = new mongoose.Schema(
{
    phone:{
        type:String,
        required:true
    },

    owner:{
        type:String,
        required:true
    },

    service:{
        type:String,
        enum:[
            "data",
            "airtime"
        ],
        required:true
    },

    targetPhone:{
        type:String,
        required:true
    },

    network:{
        type:String
    },

    nickname:{
        type:String,
        required:true
    }

},
{
    timestamps:true
}
);

module.exports = mongoose.model("Beneficiary", beneficiarySchema);
