const token = localStorage.getItem("token");
const phone = localStorage.getItem("phone");


document.getElementById("buy").onclick = async()=>{


const exam =
document.getElementById("exam").value;


const quantity =
document.getElementById("quantity").value;


const pin =
document.getElementById("pin").value;



const response = await fetch("/exam-pin",{

method:"POST",

headers:{

"Content-Type":"application/json",

"Authorization":"Bearer "+token

},

body:JSON.stringify({

phone,
exam,
quantity,
pin

})

});


const data = await response.json();


document.getElementById("message").innerText =
data.message;


};
