const BlogCommission = require("../models/BlogCommission");
const BlogPartner = require("../models/BlogPartner");
const WeeklyBlogPayout = require("../models/WeeklyBlogPayout");
const { createNotification } = require("./notificationService");


const startBlogCommissionUnlockCron = () => {

  setInterval(async () => {

    try{

      const now = new Date();


      const partners =
        await BlogPartner.find({
          status: "active"
        });


      for(const partner of partners){

        /*
         * Only commissions whose 7-day lock has expired
         * are eligible for the current payout.
         */

        const unlocked =
          await BlogCommission.find({

            blogPartner: partner._id,

            status: "pending",

            availableAt: {
              $lte: now
            }

          })
          .sort({
            availableAt: 1
          });


        if(!unlocked.length){
          continue;
        }


        /*
         * Do not create another reminder while the
         * previous payout is still awaiting manual payment.
         *
         * The commissions remain pending and will be
         * included after the existing payout is marked paid.
         */

        const existing =
          await WeeklyBlogPayout.findOne({

            blogPartner: partner._id,

            status: "pending_admin_payment"

          });


        if(existing){
          continue;
        }


        const totalSales =
          unlocked.reduce(
            (sum, item) =>
              sum +
              Number(item.transactionAmount || 0),
            0
          );


        /*
         * Use the commission amounts stored on each
         * transaction rather than recalculating them
         * using the partner's current rate.
         */

        const commissionAmount =
          unlocked.reduce(
            (sum, item) =>
              sum +
              Number(item.amount || 0),
            0
          );


        const weekStart =
          unlocked[0].createdAt;


        /*
         * Create an ADMIN PAYMENT REMINDER.
         *
         * This does NOT transfer money.
         */

        const payout =
          await WeeklyBlogPayout.create({

            blogPartner: partner._id,

            weekStart,

            weekEnd: now,

            totalSales,

            commissionAmount,

            status: "pending_admin_payment"

          });


        /*
         * These exact commissions have now been moved
         * into the weekly payout and must not be counted
         * again.
         */

        await BlogCommission.updateMany(

          {
            _id: {
              $in: unlocked.map(
                commission => commission._id
              )
            },

            status: "pending"

          },

          {
            $set: {
              status: "processed"
            }
          }

        );


        /*
         * Add this payout to the partner's lifetime
         * earned commission total.
         *
         * This happens only for commissions that were
         * moved into this newly-created payout.
         */

        partner.totalEarned =
          Number(partner.totalEarned || 0) +
          commissionAmount;

        await partner.save();


        /*
         * Notify all registered admin devices.
         */

        await createNotification(
          "admin",
          "Blog payout awaiting payment",
          `${partner.name || "Blog partner"} has a blog payout of ₦${commissionAmount.toLocaleString()} awaiting payment.`,
          "payout",
          null,
          partner._id
        );


        console.log(
          `Weekly blog payout created for ${partner.name || partner._id}: ₦${commissionAmount}`
        );


      }


    }catch(error){

      console.log(
        "Blog commission unlock error:",
        error.message
      );

    }


  }, 60 * 60 * 1000);


  console.log(
    "Blog commission unlock cron started"
  );

};


module.exports = {
  startBlogCommissionUnlockCron
};
