const token = localStorage.getItem("adminToken");

if(!token){
    window.location.href="login.html";
}


const params = new URLSearchParams(window.location.search);

const phone = params.get("phone");



async function loadProfile(){

    try{


        const usersResponse = await fetch(
            "/admin/users",
            {
                headers:{
                    "Authorization":"Bearer " + token
                }
            }
        );


        const users = await usersResponse.json();


        const user = users.find(
            u => u.phone === phone
        );


        if(!user){

            document.getElementById("profileBox").innerHTML =
            "<p>User not found</p>";

            return;

        }



        const walletResponse = await fetch(
            "/wallet/balance/" + phone,
            {
                headers:{
                    "Authorization":"Bearer " + token
                }
            }
        );


        const wallet = await walletResponse.json();



        document.getElementById("profileBox").innerHTML = `


        <h2>
        ${user.name || "Name not provided"}
        </h2>


        <p>
        📱 ${user.phone}
        </p>


        <p>
        📧 ${user.email || "No email"}
        </p>


        <p>
        💰 Wallet Balance:
        ₦${wallet.balance || 0}
        </p>


        <p>
        🎁 Referral Code:
        ${user.referralCode || "None"}
        </p>


        <p>
        💵 Referral Earnings:
        ₦${user.referralEarnings || 0}
        </p>


        <p>
        📅 Joined:
        ${new Date(user.createdAt).toLocaleDateString()}
        </p>


        `;



    }catch(error){

        console.log(error);

    }

}




const logout = document.getElementById("logout");


if(logout){

logout.onclick=()=>{

localStorage.removeItem("adminToken");

window.location.href="login.html";

}

}




async function loadTransactions(){

try{

const response = await fetch("/transactions/" + phone,{
headers:{
"Authorization":"Bearer " + token
}
});

const transactions = await response.json();

const box = document.getElementById("transactionsList");

box.innerHTML="";

if(transactions.length === 0){
box.innerHTML="<p>No transactions found</p>";
return;
}

transactions.forEach(tx => {

box.innerHTML += `
<div class="card">
<p>${tx.type}</p>
<p>Amount: ₦${tx.amount}</p>
<p>Status: ${tx.status}</p>
</div>
`;

});

}catch(error){
console.log(error);
}

}


loadProfile();
loadTransactions();
