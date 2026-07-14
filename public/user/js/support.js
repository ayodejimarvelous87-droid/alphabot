const chat = document.getElementById("chat");
const input = document.getElementById("message");


function addMessage(text, sender){

const div = document.createElement("div");

div.className = "card";

div.innerHTML = `
<b>${sender}</b><br>
${text}
`;

chat.appendChild(div);

}



function sendMessage(){

const message = input.value.toLowerCase().trim();


if(!message) return;


addMessage(input.value,"You");


let reply = "";


if(message.includes("fund") || message.includes("deposit")){

reply = "To fund your AlphaBot wallet, go to Fund Wallet and follow the instructions.";

}


else if(message.includes("data")){

reply = "You can buy data from the Buy Data section. Select your plan and enter your transaction PIN.";

}


else if(message.includes("airtime")){

reply = "You can purchase airtime from the Airtime section. Your transaction PIN is required.";

}


else if(message.includes("referral")){

reply = "Invite users with your referral link and earn rewards when they complete qualifying activities.";

}


else if(message.includes("pin")){

reply = "Your transaction PIN protects your wallet. Never share it with anyone.";

}


else if(message.includes("balance")){

reply = "You can check your wallet balance from your dashboard.";

}


else if(message.includes("hello") || message.includes("hi")){

reply = "Hello 👋 Welcome to AlphaBot AI Support. How can I assist you?";

}


else{

reply = "I'm not sure I understand. Would you like to chat with human support?";

}



setTimeout(()=>{

addMessage(reply,"🤖 AlphaBot AI");

},500);


input.value = "";

}
