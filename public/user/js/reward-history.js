const phone = localStorage.getItem("phone");
const token = localStorage.getItem("token");


async function loadRewards(){

try{


const response = await fetch(
`/transactions/${phone}`,
{
headers:{
"Authorization":"Bearer "+token
}
}
);


const transactions = await response.json();



const rewards = transactions.filter(t =>
t.type === "referral_reward" ||
t.type === "cashback"
);



let total = 0;
let referral = 0;
let cashback = 0;


const list = document.getElementById("rewardList");

list.innerHTML="";



if(rewards.length === 0){

list.innerHTML="No rewards earned yet";

return;

}



rewards.forEach(item=>{


let amount = Number(item.amount);


total += amount;


if(item.type === "referral_reward"){

referral += amount;

}


if(item.type === "cashback"){

cashback += amount;

}



list.innerHTML += `

<div class="transaction-card">

<h3>
${item.type === "cashback" ? "💵 Cashback" : "👥 Referral Reward"}
</h3>


<p>
+₦${amount.toLocaleString()}
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



document.getElementById("totalRewards").innerText =
"₦"+total.toLocaleString();



document.getElementById("referralTotal").innerText =
"₦"+referral.toLocaleString();



document.getElementById("cashbackTotal").innerText =
"₦"+cashback.toLocaleString();



}catch(error){

console.log(error);

}

}


loadRewards();
