const express = require("express");

const {
createPartner,
getPartner,
getDashboard,
getPayoutHistory,
getLeaderboard,
loginPartner,
updatePayoutDetails,
changePartnerPassword,
updatePartnerEmail,
trackReferralClick,
verifyBlogEmail
}=require("../controllers/blogPartnerController");

const router = express.Router();
const blogPartnerAuth = require("../middleware/blogPartnerAuth");



// verify blog email
router.post(
"/verify-email",
verifyBlogEmail
);

// partner login
router.post(
"/login",
loginPartner
);







// track referral link clicks (public)
router.get(
"/track/:code",
trackReferralClick
);


// update payout bank details
router.put(
"/payout-details",
blogPartnerAuth,
updatePayoutDetails
);


router.put(
"/change-password",
blogPartnerAuth,
changePartnerPassword
);


router.put(
"/update-email",
blogPartnerAuth,
updatePartnerEmail
);

// admin creates partner
router.post(
"/create",
createPartner
);


router.get(
"/dashboard",
blogPartnerAuth,
getDashboard
);


router.get(
"/payout-history",
blogPartnerAuth,
getPayoutHistory
);


router.get(
"/leaderboard",
getLeaderboard
);


// partner profile
router.get(
"/:id",
getPartner
);


module.exports = router;
