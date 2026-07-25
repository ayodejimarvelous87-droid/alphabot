const SystemSetting = require("../models/SystemSetting");


const getServiceSettings = async(req,res)=>{

try{

let setting = await SystemSetting.findOne();

if(!setting){
setting = await SystemSetting.create({});
}

res.json(setting);


}catch(error){

res.status(500).json({
message:error.message
});

}

};



const updateService = async(req,res)=>{

try{

let setting = await SystemSetting.findOne();

if(!setting){
setting = await SystemSetting.create({});
}


Object.keys(req.body).forEach(key=>{

setting[key]=req.body[key];

});


await setting.save();


res.json({
message:"Service settings updated",
setting
});


}catch(error){

res.status(500).json({
message:error.message
});

}

};


module.exports={
getServiceSettings,
updateService
};
