const token = localStorage.getItem("token");
const phone = localStorage.getItem("phone");


if(!token || !phone){

window.location.href="login.html";

}



document.getElementById("createRecurring").onclick = async ()=>{


const service =
document.getElementById("service").value;


const provider =
document.getElementById("provider").value;


const amount =
document.getElementById("amount").value;


const frequency =
document.getElementById("frequency").value;



const response = await fetch("/recurring",
{

method:"POST",

headers:{

"Content-Type":"application/json",

"Authorization":"Bearer "+token

},

body:JSON.stringify({

phone,
service,
provider,
amount,
frequency

})

});


const data = await response.json();


document.getElementById("message").innerText =
data.message;


loadRecurring();

};





async function loadRecurring(){


const response = await fetch(

"/recurring/"+phone,

{

headers:{
"Authorization":"Bearer "+token
}

}

);


const list = await response.json();


const box =
document.getElementById("recurringList");


box.innerHTML="";


if(!list.length){

box.innerHTML="No recurring payments";

return;

}



list.forEach(item=>{


box.innerHTML += `

<div class="card">

<h3>${item.service.toUpperCase()}</h3>

<p>${item.provider}</p>

<p>₦${item.amount}</p>

<p>${item.frequency}</p>

<p>Status: ${item.status}</p>

</div>

`;

});


}


loadRecurring();
