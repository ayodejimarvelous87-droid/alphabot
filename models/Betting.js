const mongoose = require("mongoose");


const bettingSchema = new mongoose.Schema({

    phone: {
        type:String,
        required:true
    },


    provider: {
        type:String,
        required:true
    },


    customerId: {
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


module.exports = mongoose.model("Betting", bettingSchema);
