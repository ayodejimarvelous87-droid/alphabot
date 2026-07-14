const Wallet = require("../models/wallet");
const Product = require("../models/Product");
const Order = require("../models/Order");
const Transaction = require("../models/Transaction");
const TransactionPin = require("../models/TransactionPin");
const User = require("../models/User");
const normalizePhone = require("../utils/phone");
const { createNotification } = require("../services/notificationService");

const { purchaseProduct } = require("../services/vtuService");


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
      return res.status(404).json({
        message: "Product not found"
      });
    }




    const userPin = await TransactionPin.findOne({
      phone: cleanPhone
    });

    if(!userPin){
      return res.status(400).json({
        message:"Create transaction PIN first"
      });
    }

    if(userPin.pin !== pin){
      return res.status(400).json({
        message:"Incorrect transaction PIN"
      });
    }

    const wallet = await Wallet.findOne({
      phone: cleanPhone
    });



    if (!wallet) {
      return res.status(404).json({
        message: "Wallet not found"
      });
    }



    if (wallet.balance < product.price) {
      return res.status(400).json({
        message: "Insufficient wallet balance"
      });
    }



    const vtuResponse = await purchaseProduct(
      cleanPhone,
      product
    );



    if (!vtuResponse.success) {
      return res.status(400).json({
        message: vtuResponse.message
      });
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



    await Transaction.create({

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

            const reward = Math.floor(product.price * 0.01);


            if(reward > 0){

              const balanceBefore = referrerWallet.balance;


              referrerWallet.balance += reward;

              await referrerWallet.save();


              referrer.referralEarnings += reward;

              await referrer.save();


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
