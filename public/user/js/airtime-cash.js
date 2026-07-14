const token = localStorage.getItem("token");
const phoneSaved = localStorage.getItem("phone");


if(!token){

window.location.href="login.html";

}



document.getElementById("convert").onclick = async function(){


const network =
document.getElementById("network").value;


const phone =
document.getElementById("phone").value;


const amount =
document.getElementById("amount").value;



if(!network || !phone || !amount){

document.getElementById("message").innerText =
"Fill all fields";

return;

}



try{


const response = await fetch(

"/airtime-cash",

{

method:"POST",

headers:{

"Content-Type":"application/json",

"Authorization":"Bearer " + token

},

body:JSON.stringify({

phone,

network,

amount

})

}

);



const data = await response.json();



document.getElementById("message").innerText =
data.message;



}catch(error){

console.log(error);

document.getElementById("message").innerText =
"Something went wrong";

}


};
