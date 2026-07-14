const mongoose = require("mongoose");


const electricitySchema = new mongoose.Schema({

    phone: {
        type:String,
        required:true
    },


    disco: {
        type:String,
        required:true
    },


    meterNumber: {
        type:String,
        required:true
    },


    meterType: {

        type:String,

        enum:[
            "prepaid",
            "postpaid"
        ],

        default:"prepaid"

    },


    amount: {
        type:Number,
        required:true
    },


    token: {

        type:String,

        default:null

    },


    status:{

        type:String,

        enum:[
            "pending",
            "successful",
            "failed"
        ],

        default:"pending"

    },


    reference:{

        type:String,

        unique:true

    }


},{

    timestamps:true

});


module.exports = mongoose.model("Electricity", electricitySchema);
