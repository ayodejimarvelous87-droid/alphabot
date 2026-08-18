const Event = require("../models/Event");
const TeamRushMembership = require("../models/TeamRushMembership");


const getTeamRushEvent = async()=>{

  return Event.findOne({
    type:"team_rush",
    status:{
      $in:[
        "scheduled",
        "active"
      ]
    }
  })
  .sort({
    startsAt:1
  });

};



const getTeamRush = async(req,res)=>{

  try{

    const event = await getTeamRushEvent();

    if(!event){

      return res.status(404).json({
        message:"No active Team Rush"
      });

    }


    const userId = req.user.id;


    const membership =
      await TeamRushMembership.findOne({
        event:event._id,
        user:userId
      }).lean();


    /*
     * Do not expose team numbers or progress
     * until this user has selected a team.
     */
    if(!membership){

      return res.json({

        eventId:event._id,

        title:event.title,

        description:event.description,

        reward:event.reward,

        startsAt:event.startsAt,

        endsAt:event.endsAt,

        target:event.target,

        selectedTeam:null,

        alphaMembers:null,

        betaMembers:null,

        alphaProgress:null,

        betaProgress:null

      });

    }


    const counts =
      await TeamRushMembership.aggregate([

        {
          $match:{
            event:event._id
          }
        },

        {
          $group:{
            _id:"$team",
            count:{
              $sum:1
            }
          }
        }

      ]);


    let alphaMembers = 0;
    let betaMembers = 0;


    for(const row of counts){

      if(row._id === "alpha"){
        alphaMembers = row.count;
      }

      if(row._id === "beta"){
        betaMembers = row.count;
      }

    }


    const target =
      Number(event.target || 0);


    const alphaProgress =
      target > 0
        ? Math.min(
            100,
            (alphaMembers / target) * 100
          )
        : 0;


    const betaProgress =
      target > 0
        ? Math.min(
            100,
            (betaMembers / target) * 100
          )
        : 0;


    return res.json({

      eventId:event._id,

      title:event.title,

      description:event.description,

      reward:event.reward,

      startsAt:event.startsAt,

      endsAt:event.endsAt,

      target,

      selectedTeam:membership.team,

      alphaMembers,

      betaMembers,

      alphaProgress,

      betaProgress

    });


  }catch(error){

    console.error(
      "TEAM RUSH GET ERROR:",
      error
    );

    return res.status(500).json({
      message:error.message
    });

  }

};



const joinTeamRush = async(req,res)=>{

  try{

    const {team} = req.body;


    if(
      team !== "alpha" &&
      team !== "beta"
    ){

      return res.status(400).json({
        message:"Invalid team"
      });

    }


    const event = await getTeamRushEvent();


    if(!event){

      return res.status(404).json({
        message:"No active Team Rush"
      });

    }


    const now = new Date();


    if(now < event.startsAt){

      return res.status(400).json({
        message:"Team Rush has not started"
      });

    }


    if(now >= event.endsAt){

      return res.status(400).json({
        message:"Team Rush has ended"
      });

    }


    const existing =
      await TeamRushMembership.findOne({
        event:event._id,
        user:req.user.id
      });


    if(existing){

      return res.status(409).json({

        message:"You have already joined a team",

        team:existing.team

      });

    }


    try{

      const membership =
        await TeamRushMembership.create({

          event:event._id,

          user:req.user.id,

          team

        });


      return res.status(201).json({

        message:
          `You joined ${team.toUpperCase()}`,

        team:membership.team

      });


    }catch(error){

      /*
       * Handles the unique event + user index
       * if two requests arrive simultaneously.
       */
      if(error.code === 11000){

        const existing =
          await TeamRushMembership.findOne({
            event:event._id,
            user:req.user.id
          }).lean();


        return res.status(409).json({

          message:
            "You have already joined a team",

          team:existing?.team || null

        });

      }

      throw error;

    }


  }catch(error){

    console.error(
      "TEAM RUSH JOIN ERROR:",
      error
    );

    return res.status(500).json({
      message:error.message
    });

  }

};



module.exports = {

  getTeamRush,

  joinTeamRush

};
