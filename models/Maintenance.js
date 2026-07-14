const mongoose = require("mongoose");

const maintenanceSchema = new mongoose.Schema({

    enabled: {
        type: Boolean,
        default: false
    },

    message: {
        type: String,
        default: "AlphaBot is currently under maintenance. Please check back soon."
    }

},
{
    timestamps:true
});


module.exports = mongoose.model("Maintenance", maintenanceSchema);
