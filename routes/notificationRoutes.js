const express = require("express");
const router = express.Router();

const DeviceToken = require("../models/DeviceToken");
const Notification = require("../models/Notification");

const auth = require("../middleware/auth");

const {
  markRead,
  markAllRead
} = require("../controllers/notificationController");



// Save admin device token
router.post("/register-token", async (req,res)=>{

  try{

    const { token } = req.body;

    if(!token){
      return res.status(400).json({
        message:"Token required"
      });
    }


    await DeviceToken.findOneAndUpdate(
      { token },
      {
        token,
        userType:"admin"
      },
      {
        upsert:true,
        new:true
      }
    );


    res.json({
      success:true,
      message:"Device registered"
    });


  }catch(error){

    res.status(500).json({
      message:error.message
    });

  }

});


// Get admin notifications
router.get("/admin", async(req,res)=>{

  try{

    const notifications = await Notification.find({
      phone:"admin"
    })
    .sort({
      createdAt:-1
    })
    .limit(50);


    res.json(notifications);


  }catch(error){

    res.status(500).json({
      message:error.message
    });

  }

});


// Get user notifications
router.get("/:phone", async(req,res)=>{

  try{

    const notifications = await Notification.find({
      phone:req.params.phone
    })
    .sort({
      createdAt:-1
    })
    .limit(50);


    res.json(notifications);


  }catch(error){

    res.status(500).json({
      message:error.message
    });

  }

});



// Mark a notification as read
router.patch(
  "/read/:id",
  auth,
  markRead
);


// Mark all notifications as read
router.patch(
  "/read-all/:phone",
  auth,
  markAllRead
);


module.exports = router;
