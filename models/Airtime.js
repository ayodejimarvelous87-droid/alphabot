const mongoose = require("mongoose");


const airtimeSchema = new mongoose.Schema({

    phone: {
        type:String,
        required:true
    },


    network: {
        type:String,
        required:true
    },


    amount: {
        type:Number,
        required:true
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


module.exports = mongoose.model("Airtime", airtimeSchema);
