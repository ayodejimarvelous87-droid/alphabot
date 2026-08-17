const Event = require("../models/Event");


const createEvent = async(req,res)=>{

try{

const {
title,
description,
icon,
type,
startsAt,
endsAt
} = req.body;


if(!title || !type || !startsAt || !endsAt){

return res.status(400).json({
message:"Title, type, startsAt and endsAt are required"
});

}


const start = new Date(startsAt);
const end = new Date(endsAt);


if(
isNaN(start.getTime()) ||
isNaN(end.getTime())
){

return res.status(400).json({
message:"Invalid event dates"
});

}


if(end <= start){

return res.status(400).json({
message:"endsAt must be after startsAt"
});

}


const event = await Event.create({

title,
description:description || "",
icon:icon || "🎉",
type,
startsAt:start,
endsAt:end,
status:"draft"

});


res.status(201).json({
message:"Event created",
event
});


}catch(error){

res.status(500).json({
message:error.message
});

}

};


const getEvents = async(req,res)=>{

try{

const events = await Event.find()
.sort({createdAt:-1});

res.json(events);

}catch(error){

res.status(500).json({
message:error.message
});

}

};


const updateEventStatus = async(req,res)=>{

try{

const { id } = req.params;
const { status } = req.body;

const allowedStatuses = [
"draft",
"scheduled",
"active",
"ended",
"cancelled"
];

if(!allowedStatuses.includes(status)){

return res.status(400).json({
message:"Invalid event status"
});

}

const event = await Event.findById(id);

if(!event){

return res.status(404).json({
message:"Event not found"
});

}

event.status = status;

await event.save();

res.json({
message:"Event status updated",
event
});

}catch(error){

res.status(500).json({
message:error.message
});

}

};



const resetEventLeaderboard = async(req,res)=>{

try{

const { id } = req.params;

const event = await Event.findById(id);

if(!event){

return res.status(404).json({
message:"Event not found"
});

}


/*
 * Do NOT delete transactions.
 *
 * This timestamp becomes the new starting point
 * for this event's leaderboard.
 */
event.leaderboardResetAt = new Date();

await event.save();


res.json({

message:"Event leaderboard reset",

event

});


}catch(error){

console.error(
"RESET EVENT LEADERBOARD ERROR:",
error
);

res.status(500).json({
message:error.message
});

}

};


module.exports={
createEvent,
getEvents,
updateEventStatus,
resetEventLeaderboard
};
