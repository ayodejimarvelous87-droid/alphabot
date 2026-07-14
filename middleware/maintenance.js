const Maintenance = require("../models/Maintenance");


const maintenance = async (req, res, next) => {

    try {

        const settings = await Maintenance.findOne();


        if(settings && settings.enabled){

            return res.status(503).json({

                message: settings.message

            });

        }


        next();


    } catch(error){

        res.status(500).json({

            message: error.message

        });

    }

};


module.exports = maintenance;
