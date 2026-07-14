const token = localStorage.getItem("token");
const phone = localStorage.getItem("phone");


if(!token || !phone){

window.location.href="login.html";

}




document.getElementById("subscribeTV").onclick = async function(){


const provider =
document.getElementById("provider").value;


const smartCardNumber =
document.getElementById("smartCardNumber").value;


const package =
document.getElementById("package").value;


const amount =
document.getElementById("amount").value;



try{


const response = await fetch(

"/tv/subscribe",

{

method:"POST",

headers:{

"Content-Type":"application/json",

"Authorization":"Bearer " + token

},


body:JSON.stringify({

phone,

provider,

smartCardNumber,

package,

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
