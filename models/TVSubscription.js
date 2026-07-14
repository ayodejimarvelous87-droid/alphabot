const mongoose = require("mongoose");


const tvSubscriptionSchema = new mongoose.Schema({

    phone: {

        type:String,

        required:true

    },


    provider: {

        type:String,

        required:true

    },


    smartCardNumber: {

        type:String,

        required:true

    },


    package: {

        type:String,

        required:true

    },


    amount: {

        type:Number,

        required:true

    },


    status: {

        type:String,

        enum:[
            "pending",
            "successful",
            "failed"
        ],

        default:"pending"

    },


    reference: {

        type:String,

        unique:true

    }


},{

    timestamps:true

});


module.exports = mongoose.model(
    "TVSubscription",
    tvSubscriptionSchema
);
