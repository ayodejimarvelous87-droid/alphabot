const Maintenance = require("../models/Maintenance");


// Get maintenance status
const getMaintenance = async (req, res) => {

    try {

        let maintenance = await Maintenance.findOne();


        if(!maintenance){

            maintenance = await Maintenance.create({});

        }


        res.json(maintenance);


    } catch(error){

        res.status(500).json({
            message:error.message
        });

    }

};




// Update maintenance mode
const updateMaintenance = async (req, res) => {

    try {

        const {
            enabled,
            message
        } = req.body;



        let maintenance = await Maintenance.findOne();



        if(!maintenance){

            maintenance = new Maintenance();

        }



        if(enabled !== undefined){

            maintenance.enabled = enabled;

        }


        if(message){

            maintenance.message = message;

        }



        await maintenance.save();



        res.json({

            message:"Maintenance settings updated",

            maintenance

        });



    } catch(error){


        res.status(500).json({

            message:error.message

        });


    }

};



module.exports = {
    getMaintenance,
    updateMaintenance
};
