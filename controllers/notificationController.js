const Notification = require("../models/Notification");
const normalizePhone = require("../utils/phone");


// Get user notifications
const getNotifications = async (req, res) => {
  try {

    const phone = normalizePhone(req.params.phone);


    if (
      req.user.role !== "admin" &&
      req.user.phone !== phone
    ) {
      return res.status(403).json({
        message: "Unauthorized notification access"
      });
    }


    const notifications = await Notification.find({
      phone
    })
    .sort({
      createdAt: -1
    });


    res.json(notifications);


  } catch(error) {

    res.status(500).json({
      message: error.message
    });

  }
};



// Mark notification as read
const markRead = async (req,res)=>{
  try{

    const notification = await Notification.findById(
      req.params.id
    );


    if(!notification){
      return res.status(404).json({
        message:"Notification not found"
      });
    }


    notification.read = true;

    await notification.save();


    res.json({
      message:"Notification marked as read"
    });


  }catch(error){

    res.status(500).json({
      message:error.message
    });

  }
};



module.exports = {
  getNotifications,
  markRead
};
