const AuditLog = require("../models/AuditLog");

const auditLogger = async ({
actor = null,
role = "user",
action,
target = null,
ip = null,
userAgent = null,
details = {}
}) => {

try{

await AuditLog.create({
actor,
role,
action,
target,
ip,
userAgent,
details
});

}catch(error){

console.log("Audit log failed:", error.message);

}

};

module.exports = auditLogger;
