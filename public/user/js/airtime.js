const token = localStorage.getItem("token");
const phoneSaved = localStorage.getItem("phone");


if(!token){

window.location.href="login.html";

}



if(phoneSaved){

document.getElementById("phone").value = phoneSaved;

}

async function loadBeneficiaries(){

try{

const response=await fetch(
"/beneficiaries/"+phoneSaved,
{
headers:{
"Authorization":"Bearer "+token
}
}
);

const data=await response.json();

const select=document.getElementById("beneficiarySelect");

if(!select || !Array.isArray(data)) return;

data.forEach(item=>{

select.innerHTML += `
<option value="${item.owner}">
${item.nickname} - ${item.owner}
</option>
`;

});

select.onchange=function(){

document.getElementById("phone").value =
this.value || phoneSaved;

};

}catch(error){

console.log(error);

}

}

loadBeneficiaries();




document.getElementById("buyAirtime").onclick = async function(){


const network =
document.getElementById("network").value;


const phone =
document.getElementById("phone").value;


const amount =
document.getElementById("amount").value;



try{


const response = await fetch(

"/airtime/buy",

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
