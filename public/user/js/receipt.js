const token = localStorage.getItem("token");

const params = new URLSearchParams(window.location.search);

const id = params.get("id");


async function loadReceipt(){

try{

const response = await fetch(
"/receipts/" + id,
{
headers:{
"Authorization":"Bearer " + token
}
}
);


const data = await response.json();


const receipt = data.receipt;


document.getElementById("description").innerText = receipt.description;

document.getElementById("amount").innerText =
"₦" + receipt.amount.toLocaleString();

document.getElementById("reference").innerText =
receipt.reference;

document.getElementById("status").innerText =
receipt.status;

document.getElementById("date").innerText =
new Date(receipt.createdAt).toLocaleString();


}catch(error){

console.log(error);

}

}


loadReceipt();


function shareReceipt(){

const text = 
"AlphaBot Receipt\n\n" +
document.getElementById("description").innerText + "\n" +
document.getElementById("amount").innerText + "\n" +
"Reference: " + document.getElementById("reference").innerText + "\n" +
"Status: " + document.getElementById("status").innerText;


if(navigator.share){

navigator.share({

title:"AlphaBot Receipt",

text:text

});

}else{

navigator.clipboard.writeText(text);

alert("Receipt copied");

}

}



function downloadReceipt(){

window.print();

}

