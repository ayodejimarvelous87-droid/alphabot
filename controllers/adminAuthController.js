const Admin = require("../models/Admin");
const jwt = require("jsonwebtoken");


// Admin login

const adminLogin = async (req, res) => {

    try {

        const { username, password } = req.body;


        const admin = await Admin.findOne({
            username
        });


        if (!admin) {
            return res.status(401).json({
                message:"Invalid login"
            });
        }


        if (admin.password !== password) {
            return res.status(401).json({
                message:"Invalid login"
            });
        }


        const token = jwt.sign(
            {
                id: admin._id,
                role:"admin"
            },
            process.env.JWT_SECRET,
            {
                expiresIn:"7d"
            }
        );


        res.json({
            message:"Login successful",
            token
        });


    } catch(error){

        res.status(500).json({
            message:error.message
        });

    }

};


module.exports = {
    adminLogin
};
