const AppError = require("../utils/AppError");
const bcrypt = require("bcryptjs");
const Wallet = require("../models/wallet");
const Product = require("../models/Product");
const Order = require("../models/Order");
const Transaction = require("../models/Transaction");
const TransactionPin = require("../models/TransactionPin");
const User = require("../models/User");
const SystemSetting = require("../models/SystemSetting");
const normalizePhone = require("../utils/phone");
const { createNotification } = require("../services/notificationService");

const { purchaseProduct } = require("../services/vtuService");
const { awardPurchaseCoins } = require("../services/abCoinService");


// Buy product
const buyProduct = async (req, res) => {
  try {

    const { phone, productId, pin } = req.body;

    const cleanPhone = normalizePhone(phone);


    if (req.user.phone !== cleanPhone) {
      return res.status(403).json({
        message: "Unauthorized order access"
      });
    }


    const product = await Product.findById(productId);


    if (!product) {
      throw new AppError(
  "Product not found",
  404
);
    }




    const userPin = await TransactionPin.findOne({
      phone: cleanPhone
    });

    if(!userPin){
      throw new AppError(
  "Create transaction PIN first",
  400
);
    }

    if(!(await bcrypt.compare(pin,userPin.pin))){
      throw new AppError(
  "Incorrect transaction PIN",
  400
);
    }

    const wallet = await Wallet.findOne({
      phone: cleanPhone
    });



    if (!wallet) {
      throw new AppError(
  "Wallet not found",
  404
);
    }



    if (wallet.balance < product.price) {
      throw new AppError(
  "Insufficient wallet balance",
  400
);
    }



    const vtuResponse = await purchaseProduct(
      cleanPhone,
      product
    );



    if (!vtuResponse.success) {
      throw new AppError(
  vtuResponse.message,
  400
);
    }



    const balanceBefore = wallet.balance;


    wallet.balance -= product.price;


    await wallet.save();



    const order = await Order.create({

      phone: cleanPhone,

      productId: product._id,

      productName: product.name,

      amount: product.price,

      status:"successful"

    });



    const transaction = await Transaction.create({

      phone: cleanPhone,

      type:"purchase",

      direction:"debit",

      amount:product.price,

      reference:order._id.toString(),

      balanceBefore,

      balanceAfter:wallet.balance,

      description:product.name,

      status:"successful"

    });

    await awardPurchaseCoins(transaction);






    await createNotification(

      cleanPhone,

      "Purchase Successful",

      `${product.name} purchase completed successfully.`,

      "success"

    );

    const buyer = await User.findOne({

      phone:cleanPhone

    });




    if(buyer){

      if(!buyer.firstPurchaseCompleted){

        buyer.firstPurchaseCompleted = true;

      }


      if(
        buyer.referredBy &&
          !buyer.referralRewardGiven &&
        product.price > 300
      ){

        const referrer = await User.findOne({

          referralCode: buyer.referredBy

        });


        if(referrer){

          const referrerWallet = await Wallet.findOne({

            phone:referrer.phone

          });


          if(referrerWallet){

            const setting = await SystemSetting.findOne();

const referralPercentage = Number(
  setting?.referralPercentage ?? 1
);

const reward = Math.floor(
  product.price * (referralPercentage / 100)
);


            if(reward > 0){

              const balanceBefore = referrerWallet.balance;


              referrerWallet.balance += reward;

              await referrerWallet.save();


              referrer.referralEarnings += reward;

              await referrer.save();
                buyer.referralRewardGiven = true;


              await Transaction.create({

                phone: referrer.phone,

                type:"referral_reward",

                direction:"credit",

                amount:reward,

                balanceBefore,

                balanceAfter:referrerWallet.balance,

                description:
                "Referral reward from referred user purchase",

                reference:order._id.toString(),

                status:"successful"

              });

            }

          }

        }

      }


      await buyer.save();

    }




    res.json({

      message:"Purchase successful",

      order,

      wallet,

      vtuResponse

    });



  } catch(error){

    res.status(500).json({

      message:error.message

    });

  }

};





// Order history
const orderHistory = async(req,res)=>{

  try{


    const cleanPhone = normalizePhone(req.params.phone);



    if(
      req.user.role !== "admin" &&
      req.user.phone !== cleanPhone
    ){

      return res.status(403).json({

        message:"Unauthorized order access"

      });

    }



    const orders = await Order.find({

      phone:cleanPhone

    }).sort({

      createdAt:-1

    });



    res.json(orders);



  }catch(error){

    res.status(500).json({

      message:error.message

    });

  }

};





module.exports = {

buyProduct,

orderHistory

};
