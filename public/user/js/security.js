const token = localStorage.getItem("token");
const phone = localStorage.getItem("phone");


if(!token || !phone){

window.location.href="login.html";

}




document.getElementById("savePin").onclick = async function(){


const pin =
document.getElementById("pin").value;



save(pin);


};





document.getElementById("changePin").onclick = async function(){


const pin =
document.getElementById("newPin").value;



save(pin);


};





async function save(pin){


try{


const response = await fetch(

"/pin/set",

{

method:"POST",

headers:{

"Content-Type":"application/json",

"Authorization":"Bearer " + token

},


body:JSON.stringify({

phone,

pin

})


}

);



const data =
await response.json();



document.getElementById("message").innerText =
data.message;



}catch(error){


console.log(error);


}

}
