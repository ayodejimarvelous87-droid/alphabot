const token = localStorage.getItem("token");
const phone = localStorage.getItem("phone");

if(!token || !phone){
    window.location.href="login.html";
}


async function loadBeneficiaries(){

try{

const res = await fetch(
"/beneficiaries/"+phone,
{
headers:{
"Authorization":"Bearer "+token
}
}
);


const data = await res.json();

const list = document.getElementById("list");

list.innerHTML="";


data.forEach(item=>{


list.innerHTML += `

<div class="card">

<h3>
${item.nickname}
</h3>

<p>
📱 ${item.owner}
</p>

<p>
Service: ${item.service}
</p>

<p>
Network: ${item.network || "N/A"}
</p>


<button onclick="deleteBeneficiary('${item._id}')">
Delete
</button>


</div>

`;


});


}catch(error){

console.log(error);

}


}



async function saveBeneficiary(){

const owner = document.getElementById("owner").value;
const nickname = document.getElementById("nickname").value;
const service = document.getElementById("service").value;


const res = await fetch(
"/beneficiaries",
{
method:"POST",

headers:{
"Content-Type":"application/json",
"Authorization":"Bearer "+token
},

body:JSON.stringify({

phone,
owner,
service,
nickname,
network:""

})

});


const data = await res.json();


document.getElementById("message").innerText =
data.message;


loadBeneficiaries();

}



async function deleteBeneficiary(id){

await fetch(
"/beneficiaries/"+id,
{
method:"DELETE",
headers:{
"Authorization":"Bearer "+token
}
}
);


loadBeneficiaries();

}


loadBeneficiaries();
