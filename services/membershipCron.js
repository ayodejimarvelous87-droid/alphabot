const User = require("../models/User");
const {
  createNotification
} = require("./notificationService");

const {
  sendMembershipExpiryReminderEmail,
  sendMembershipExpiredEmail
} = require("./membershipEmailService");


const processMembershipLifecycle = async()=>{

  const now = new Date();

  /*
   * EXPIRING SOON
   *
   * Look ahead 24 hours.
   * The tracking field prevents repeated notifications.
   */
  const reminderLimit = new Date(
    now.getTime() + 24 * 60 * 60 * 1000
  );

  const expiringUsers = await User.find({
    accountTier:{
      $in:["silver","gold"]
    },
    accountTierExpiresAt:{
      $gt:now,
      $lte:reminderLimit
    },
    $or:[
      {
        membershipExpiryReminderSentAt:null
      },
      {
        membershipExpiryReminderSentAt:{
          $exists:false
        }
      }
    ]
  }).select(
    "name phone email accountTier accountTierExpiresAt"
  );


  for(const user of expiringUsers){

    /*
     * Claim the reminder before sending it.
     * This prevents multiple cron executions from sending
     * duplicate reminders.
     */
    const claimed =
      await User.findOneAndUpdate(
        {
          _id:user._id,
          $or:[
            {
              membershipExpiryReminderSentAt:null
            },
            {
              membershipExpiryReminderSentAt:{
                $exists:false
              }
            }
          ]
        },
        {
          membershipExpiryReminderSentAt:now
        },
        {
          new:true
        }
      );

    if(!claimed) continue;


    await createNotification(
      user.phone,
      "Membership Expiring Soon ⏰",
      `Your ${user.accountTier.toUpperCase()} membership expires on ${new Date(user.accountTierExpiresAt).toLocaleDateString()}. Renew before it expires to keep your membership benefits.`,
      "warning"
    );


    if(user.email){

      try{

        await sendMembershipExpiryReminderEmail({
          user,
          tier:user.accountTier,
          expiresAt:user.accountTierExpiresAt
        });

      }catch(error){

        console.log(
          "Membership expiry reminder email failed:",
          error.message
        );

      }

    }

  }


  /*
   * EXPIRED MEMBERSHIPS
   */
  const expiredUsers = await User.find({
    accountTier:{
      $in:["silver","gold"]
    },
    accountTierExpiresAt:{
      $lte:now
    },
    $or:[
      {
        membershipExpiredNotifiedAt:null
      },
      {
        membershipExpiredNotifiedAt:{
          $exists:false
        }
      }
    ]
  }).select(
    "name phone email accountTier accountTierExpiresAt"
  );


  for(const user of expiredUsers){

    const expiredTier = user.accountTier;


    /*
     * Atomically claim the expiry notification.
     */
    const claimed =
      await User.findOneAndUpdate(
        {
          _id:user._id,
          accountTier:{
            $in:["silver","gold"]
          },
          accountTierExpiresAt:{
            $lte:now
          },
          $or:[
            {
              membershipExpiredNotifiedAt:null
            },
            {
              membershipExpiredNotifiedAt:{
                $exists:false
              }
            }
          ]
        },
        {
          accountTier:"normal",
          accountTierExpiresAt:null,
          membershipExpiredNotifiedAt:now
        },
        {
          new:true
        }
      );

    if(!claimed) continue;


    await createNotification(
      user.phone,
      "Membership Expired",
      `Your ${expiredTier.toUpperCase()} membership has expired and your account has returned to the Normal tier.`,
      "info"
    );


    if(user.email){

      try{

        await sendMembershipExpiredEmail({
          user,
          tier:expiredTier
        });

      }catch(error){

        console.log(
          "Membership expiry email failed:",
          error.message
        );

      }

    }

  }

};


module.exports = {
  processMembershipLifecycle
};
