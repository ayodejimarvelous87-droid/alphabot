const token = localStorage.getItem("token");
const phone = localStorage.getItem("phone");


document.getElementById("withdraw").onclick = async()=>{


const bankName =
document.getElementById("bankName").value;


const accountNumber =
document.getElementById("accountNumber").value;


const accountName =
document.getElementById("accountName").value;


const amount =
document.getElementById("amount").value;


const pin =
document.getElementById("pin").value;



const response = await fetch("/withdrawal",
{

method:"POST",

headers:{

"Content-Type":"application/json",

"Authorization":"Bearer "+token

},

body:JSON.stringify({

phone,
bankName,
accountNumber,
accountName,
amount,
pin

})

});


const data = await response.json();


document.getElementById("message").innerText =
data.message;


};
