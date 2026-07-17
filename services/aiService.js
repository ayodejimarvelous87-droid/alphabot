const getAIReply = (message) => {

const text = message.toLowerCase().trim();


if(
text.includes("hey") ||
text.includes("hello") ||
text.includes("hi") ||
text.includes("good morning") ||
text.includes("good afternoon") ||
text.includes("good evening")
){
return "Hello 👋 Welcome to AlphaBot. How can I assist you today? You can ask me about wallet funding, data, airtime, referrals, and our services.";
}


if(text.includes("what is alphabot") || text.includes("about alphabot")){
return "AlphaBot is a digital platform that provides VTU services including airtime, data, cable subscription, electricity payments, wallet services, and referral rewards.";
}


if(text.includes("fund") || text.includes("deposit") || text.includes("add money")){
return "To fund your AlphaBot wallet, go to the funding section and complete payment. Your wallet balance will update after successful confirmation.";
}


if(text.includes("data")){
return "You can buy data on AlphaBot by selecting your network, choosing a data plan, and paying from your wallet balance.";
}


if(text.includes("airtime")){
return "AlphaBot allows you to purchase airtime instantly for supported networks using your wallet balance.";
}


if(text.includes("referral")){
return "AlphaBot referral rewards allow you to earn when people join using your referral link and complete eligible transactions.";
}


if(text.includes("password") || text.includes("account")){
return "For account issues, try resetting your password or contact AlphaBot support through WhatsApp for assistance.";
}


if(text.includes("thank")){
return "You're welcome 😊 I'm always here to help with AlphaBot services.";
}


return "I'm AlphaBot AI Assistant 🤖. I can help you with AlphaBot services, wallet, VTU purchases, referrals, and account support. Please ask me anything related to AlphaBot.";

};


module.exports = {
getAIReply
};
