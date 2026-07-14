const phone = localStorage.getItem("phone");
const token = localStorage.getItem("token");


let referralLink = "";


async function loadReferralEarnings(){

try{


const res = await fetch(
`/referrals/${phone}`,
{
headers:{
"Authorization":"Bearer "+token
}
}
);


const data = await res.json();


let earnings = Number(data.earnings || 0);


referralLink = data.referralLink;



document.getElementById("earned").innerText =
"₦"+earnings.toLocaleString();



document.getElementById("referrals").innerText =
"People Referred: "+data.totalReferrals;



document.getElementById("withdrawProgress").innerText =
"₦"+earnings+" / ₦200 needed for withdrawal";



document.getElementById("link").innerText =
referralLink;



if(earnings < 200){

document.getElementById("withdrawBtn").disabled=true;

}else{

document.getElementById("withdrawBtn").disabled=false;

}



loadReferralHistory();



}catch(error){

console.log(error);

}

}




async function loadReferralHistory(){

try{


const res = await fetch(
`/transactions/${phone}`,
{
headers:{
"Authorization":"Bearer "+token
}
}
);


const transactions = await res.json();



const rewards = transactions.filter(t =>
t.type === "referral_reward"
);



const history =
document.getElementById("history");


history.innerHTML="";



if(rewards.length === 0){

history.innerHTML =
"No referral earnings yet";

return;

}



rewards.forEach(item=>{


history.innerHTML += `

<div class="transaction-card">

<h3>
👥 Referral Reward
</h3>


<p>
+₦${Number(item.amount).toLocaleString()}
</p>


<p>
${item.description}
</p>


<small>
${new Date(item.createdAt).toLocaleString()}
</small>


</div>

`;

});


}catch(error){

console.log(error);

}

}





async function withdrawReferral(){

try{


const res = await fetch(
"/referral-withdraw",
{
method:"POST",

headers:{
"Content-Type":"application/json",
"Authorization":"Bearer "+token
},

body:JSON.stringify({
phone
})

}
);


const data = await res.json();


document.getElementById("withdrawMessage").innerText =
data.message;



if(res.ok){

loadReferralEarnings();

}



}catch(error){

console.log(error);

}

}





function copyLink(){

navigator.clipboard.writeText(referralLink);

alert("Referral link copied");

}





document
.getElementById("withdrawBtn")
.onclick = withdrawReferral;



loadReferralEarnings();
