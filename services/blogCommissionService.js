const User = require("../models/User");
const BlogPartner = require("../models/BlogPartner");
const BlogCommission = require("../models/BlogCommission");
const BlogWeeklyCommission = require("../models/BlogWeeklyCommission");


function getWeek(){

  const d = new Date();

  const year = d.getFullYear();

  const week = Math.ceil(
    (
      (
        d - new Date(year,0,1)
      ) / 86400000 + 1
    ) / 7
  );

  return `${year}-${week}`;

}


const addBlogCommission = async({
  phone,
  amount,
  reference,
  service
}) => {

  try{

    if(!phone || !reference || !Number.isFinite(Number(amount))){
      console.log("Blog commission skipped: invalid data");
      return;
    }


    /*
     * The transaction reference is the idempotency key.
     * One successful transaction can create only one
     * partner commission.
     */

    const existingCommission =
      await BlogCommission.findOne({
        reference
      });

    if(existingCommission){
      return existingCommission;
    }


    const user = await User.findOne({
      phone
    });

    if(!user || !user.blogPartner){
      return;
    }


    const blog = await BlogPartner.findById(
      user.blogPartner
    );


    if(!blog || blog.status !== "active"){
      return;
    }


    const transactionAmount =
      Number(amount);

    const commissionRate =
      Number(blog.commissionRate || 30);

    const commissionAmount =
      (
        transactionAmount *
        commissionRate
      ) / 100;


    /*
     * Individual locked commission.
     */

    const commission =
      await BlogCommission.create({

        blogPartner: blog._id,

        user: user._id,

        reference,

        amount: commissionAmount,

        transactionAmount,

        service: service || "unknown",

        transactionReference: reference,

        status: "pending",

        availableAt:
          new Date(
            Date.now() +
            7 * 24 * 60 * 60 * 1000
          )

      });


    /*
     * Keep the existing weekly aggregate for
     * dashboard/reporting purposes.
     */

    const week = getWeek();


    let earning =
      await BlogWeeklyCommission.findOne({

        blogPartner: blog._id,

        week

      });


    if(!earning){

      earning =
        await BlogWeeklyCommission.create({

          blogPartner: blog._id,

          week

        });

    }


    earning.totalSales +=
      transactionAmount;


    earning.commission +=
      commissionAmount;


    await earning.save();


    return commission;


  }catch(error){

    /*
     * A duplicate reference can happen if two requests
     * reach this function at nearly the same time.
     *
     * MongoDB's unique index on BlogCommission.reference
     * protects the database from creating two commissions.
     */

    if(error.code === 11000){

      return await BlogCommission.findOne({
        reference
      });

    }


    console.log(
      "Blog commission error:",
      error.message
    );

  }

};


module.exports = {
  addBlogCommission
};
