const express = require("express");
const router = express.Router();


// VTU.ng webhook callback
router.post("/webhook", async (req, res) => {

  try {

    console.log("VTU Webhook Received:");
    console.log(req.body);


    // We will update transaction status here
    // after confirming VTU.ng response format


    res.status(200).json({
      success: true,
      message: "Webhook received"
    });


  } catch (error) {

    console.log(
      "VTU webhook error:",
      error.message
    );

    res.status(500).json({
      success:false
    });

  }

});


module.exports = router;
