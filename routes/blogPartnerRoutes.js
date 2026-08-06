const express = require("express");

const {
createPartner,
getAllPartners,
adminUpdatePartner,
getPartnerUsers,
getPartner,
getDashboard,
getPayoutHistory,
getLeaderboard,
loginPartner,
updatePayoutDetails,
changePartnerPassword,
updatePartnerEmail,
trackReferralClick,
verifyBlogEmail,
sendPartnerResetOTP,
verifyPartnerResetOTP
}=require("../controllers/blogPartnerController");

const router = express.Router();
const blogPartnerAuth = require("../middleware/blogPartnerAuth");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");



// verify blog email
router.post(
"/verify-email",
verifyBlogEmail
);


// partner password reset
router.post(
"/send-reset-otp",
sendPartnerResetOTP
);

router.post(
"/verify-reset-otp",
verifyPartnerResetOTP
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


// admin get all blog partners
router.get(
"/all",
getAllPartners
);


// admin update partner
router.put(
"/admin/:id",
adminUpdatePartner
);




router.get(
"/admin/:id/users",
auth,
admin,
getPartnerUsers
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
