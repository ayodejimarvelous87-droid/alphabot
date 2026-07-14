const phone = localStorage.getItem("phone");
const token = localStorage.getItem("token");


async function loadReferral(){

const res = await fetch(
`/referrals/${phone}`,
{
headers:{
"Authorization":"Bearer "+token
}
}
);


const data = await res.json();


document.getElementById("people").innerText =
"People Referred: "+data.totalReferrals;


document.getElementById("link").innerText =
data.referralLink;


let earnings = Number(data.earnings || 0);


document.getElementById("progress").innerText =
"₦"+earnings+" / ₦500 before withdrawal";


}


function copyReferral(){

navigator.clipboard.writeText(
document.getElementById("link").innerText
);

alert("Referral link copied");

}


loadReferral();
