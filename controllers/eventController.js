const Event = require("../models/Event");
const Transaction = require("../models/Transaction");
const User = require("../models/User");


const SERVICE_PURCHASE_TYPES = [
  "purchase",
  "airtime",
  "data",
  "betting",
  "electricity",
  "tv",
  "exam_pin",
  "recharge_pin"
];


const getServicePurchasesLeaderboard = async(event)=>{

  /*
   * The leaderboard belongs to THIS event only.
   *
   * If the admin has reset the leaderboard,
   * counting starts from leaderboardResetAt.
   *
   * Otherwise counting starts from startsAt.
   */
  const leaderboardStart =
    event.leaderboardResetAt || event.startsAt;


  const rows = await Transaction.aggregate([

    {
      $match:{

        status:"successful",

        direction:"debit",

        type:{
          $in:SERVICE_PURCHASE_TYPES
        },

        createdAt:{
          $gte:leaderboardStart,
          $lt:event.endsAt
        }

      }
    },

    {
      $group:{

        _id:"$phone",

        amount:{
          $sum:"$amount"
        }

      }
    },

    {
      $sort:{
        amount:-1
      }
    },

    {
      $limit:100
    }

  ]);


  if(!rows.length){
    return [];
  }


  const phones = rows.map(
    row=>row._id
  );


  const users = await User.find({

    phone:{
      $in:phones
    }

  })
  .select("phone name")
  .lean();


  const userMap = new Map(
    users.map(user=>[
      user.phone,
      user
    ])
  );


  return rows.map((row,index)=>{

    const user =
      userMap.get(row._id);


    return {

      rank:index + 1,

      username:
        user?.name ||
        "AlphaBot User",

      points:
        Math.round(
          Number(row.amount) * 10
        )

    };

  });

};


const getPublicEvents = async(req,res)=>{

  try{

    const events = await Event.find({

      status:{
        $in:[
          "scheduled",
          "active",
          "ended"
        ]
      }

    })
    .sort({
      startsAt:1
    })
    .lean();


    const result = await Promise.all(

      events.map(async(event)=>{

        let leaderboard = [];


        if(
          event.type === "service_purchases"
        ){

          leaderboard =
            await getServicePurchasesLeaderboard(
              event
            );

        }


        return {

          ...event,

          leaderboard

        };

      })

    );


    res.json(result);


  }catch(error){

    console.error(
      "PUBLIC EVENTS ERROR:",
      error
    );


    res.status(500).json({

      message:error.message

    });

  }

};


module.exports = {

  getPublicEvents

};
