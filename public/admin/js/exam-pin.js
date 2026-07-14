const token = localStorage.getItem("token");


document.getElementById("addPin").onclick = async()=>{


const exam=document.getElementById("exam").value;
const pin=document.getElementById("pin").value;
const price=document.getElementById("price").value;


const response = await fetch("/admin/exam-pin",
{

method:"POST",

headers:{

"Content-Type":"application/json",

"Authorization":"Bearer "+token

},

body:JSON.stringify({

exam,
pin,
price

})

});


const data = await response.json();


document.getElementById("message").innerText =
data.message;


loadStock();

};



async function loadStock(){

const response = await fetch("/admin/exam-pin/stock",
{

headers:{

"Authorization":"Bearer "+token

}

});


const data = await response.json();


document.getElementById("stock").innerHTML =
JSON.stringify(data);

}


loadStock();
