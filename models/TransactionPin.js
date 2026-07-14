const mongoose = require("mongoose");


const transactionPinSchema = new mongoose.Schema({

    phone:{

        type:String,

        required:true,

        unique:true

    },


    pin:{

        type:String,

        required:true

    },


    updatedAt:{

        type:Date,

        default:Date.now

    }


});


module.exports = mongoose.model(
    "TransactionPin",
    transactionPinSchema
);
