const token = localStorage.getItem("token");
const phone = localStorage.getItem("phone");


if(!token || !phone){

window.location.href="login.html";

}

async function loadBeneficiaries(){

try{

const response=await fetch(
"/beneficiaries/"+phone,
{
headers:{
"Authorization":"Bearer "+token
}
}
);

const data=await response.json();

const select=document.getElementById("beneficiarySelect");

if(!select || !Array.isArray(data)) return;

data
.filter(item=>item.service==="betting")
.forEach(item=>{

select.innerHTML += `
<option value="${item.owner}">
${item.nickname} - ${item.owner}
</option>
`;

});

select.onchange=function(){

document.getElementById("phoneNumber").value =
this.value || "";

};

}catch(error){

console.log(error);

}

}

loadBeneficiaries();




document.getElementById("fundBetting").onclick = async function(){


const provider =
document.getElementById("provider").value;


const phoneNumber =
document.getElementById("phoneNumber").value;


const amount =

const pin = document.getElementById("pin").value;
document.getElementById("amount").value;




try{


const response = await fetch(

"/betting/fund",

{

method:"POST",

headers:{

"Content-Type":"application/json",

"Authorization":"Bearer " + token

},


body:JSON.stringify({

phone,

provider,

customerId: phoneNumber,

pin,

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
