const token = localStorage.getItem("token");
const phone = localStorage.getItem("phone");


if(!token || !phone){

window.location.href="login.html";

}



document.getElementById("payElectricity").onclick = async function(){


const disco =
document.getElementById("disco").value;


const meterType =
document.getElementById("meterType").value;


const meterNumber =
document.getElementById("meterNumber").value;


const amount =
document.getElementById("amount").value;



try{


const response = await fetch(

"/electricity/pay",

{

method:"POST",

headers:{

"Content-Type":"application/json",

"Authorization":"Bearer " + token

},


body:JSON.stringify({

phone,

disco,

meterType,

meterNumber,

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
