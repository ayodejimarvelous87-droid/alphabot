const Event = require("../models/Event");
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const ABCoinTransaction = require("../models/ABCoinTransaction");
const Prediction = require("../models/Prediction");


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


  const scoredRows = rows
    .map(row => {

      const amount = Number(row.amount);

      const unitAmount =
        Number(event.pointsUnitAmount);

      const pointsPerUnit =
        Number(event.pointsPerUnit);

      if(
        !Number.isFinite(amount) ||
        !Number.isFinite(unitAmount) ||
        !Number.isFinite(pointsPerUnit) ||
        unitAmount <= 0 ||
        pointsPerUnit <= 0
      ){
        return null;
      }

      const points =
        Math.floor(
          (amount / unitAmount) *
          pointsPerUnit
        );

      return {
        ...row,
        points
      };

    })
    .filter(Boolean)
    .sort((a,b) => {

      if(b.points !== a.points){
        return b.points - a.points;
      }

      return Number(b.amount) - Number(a.amount);

    })
    .slice(0,100);


  return scoredRows.map((row,index)=>{

    const user =
      userMap.get(row._id);


    return {

      rank:index + 1,

      username:
        user?.name ||
        "AlphaBot User",

      points:row.points

    };

  });

};


const getReferralLeaderboard = async(event)=>{

  const leaderboardStart =
    event.leaderboardResetAt || event.startsAt;


  const rows = await User.aggregate([

    {
      $match:{

        referredBy:{
          $ne:null
        },

        createdAt:{
          $gte:leaderboardStart,
          $lt:event.endsAt
        }

      }

    },

    {
      $group:{

        _id:"$referredBy",

        referrals:{
          $sum:1
        }

      }

    }

  ]);


  if(!rows.length){
    return [];
  }


  const referralCodes = rows.map(
    row=>row._id
  );


  const users = await User.find({

    referralCode:{
      $in:referralCodes
    }

  })
  .select("referralCode name")
  .lean();


  const userMap = new Map(
    users.map(user=>[
      user.referralCode,
      user
    ])
  );


  return rows

    .map(row=>{

      const user =
        userMap.get(row._id);


      return {

        referrals:Number(row.referrals),

        username:
          user?.name ||
          "AlphaBot User"

      };

    })

    .sort((a,b)=>{

      if(b.referrals !== a.referrals){
        return b.referrals - a.referrals;
      }

      return a.username.localeCompare(
        b.username
      );

    })

    .slice(0,100)

    .map((row,index)=>({

      rank:index + 1,

      username:row.username,

      referrals:row.referrals

    }));

};


const getABCoinsLeaderboard = async(event)=>{

  const leaderboardStart =
    event.leaderboardResetAt || event.startsAt;


  const rows = await ABCoinTransaction.aggregate([

    {
      $match:{

        type:"purchase_reward",

        createdAt:{
          $gte:leaderboardStart,
          $lt:event.endsAt
        }

      }

    },

    {
      $group:{

        _id:"$phone",

        coins:{
          $sum:"$coins"
        }

      }

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


  return rows

    .map(row=>{

      const user =
        userMap.get(row._id);


      return {

        coins:
          Math.round(
            Number(row.coins || 0) * 100
          ) / 100,

        username:
          user?.name ||
          "AlphaBot User"

      };

    })

    .sort((a,b)=>{

      if(b.coins !== a.coins){
        return b.coins - a.coins;
      }

      return a.username.localeCompare(
        b.username
      );

    })

    .slice(0,100)

    .map((row,index)=>({

      rank:index + 1,

      username:row.username,

      coins:row.coins

    }));

};



const getFootballPicksLeaderboard = async(event)=>{

  const leaderboardStart =
    event.leaderboardResetAt || event.startsAt;


  const rows = await Prediction.aggregate([

    {
      $match:{

        createdAt:{
          $gte:leaderboardStart,
          $lt:event.endsAt
        }

      }

    },

    {
      $group:{

        _id:"$userId",

        picks:{
          $sum:1
        }

      }

    }

  ]);


  if(!rows.length){
    return [];
  }


  const userIds = rows.map(
    row=>row._id
  );


  const users = await User.find({

    _id:{
      $in:userIds
    }

  })
  .select("_id name")
  .lean();


  const userMap = new Map(
    users.map(user=>[
      String(user._id),
      user
    ])
  );


  return rows

    .map(row=>{

      const user =
        userMap.get(
          String(row._id)
        );


      return {

        picks:Number(row.picks),

        username:
          user?.name ||
          "AlphaBot User"

      };

    })

    .sort((a,b)=>{

      if(b.picks !== a.picks){
        return b.picks - a.picks;
      }

      return a.username.localeCompare(
        b.username
      );

    })

    .slice(0,100)

    .map((row,index)=>({

      rank:index + 1,

      username:row.username,

      picks:row.picks

    }));

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
        else if(
          event.type === "referral_challenge"
        ){

          leaderboard =
            await getReferralLeaderboard(
              event
            );

        }
        else if(
          event.type === "ab_coins"
        ){

          leaderboard =
            await getABCoinsLeaderboard(
              event
            );

        }
        else if(
          event.type === "football_picks"
        ){

          leaderboard =
            await getFootballPicksLeaderboard(
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
