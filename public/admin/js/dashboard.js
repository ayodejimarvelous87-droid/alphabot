const token = localStorage.getItem("adminToken");

if(!token){
    window.location.href = "login.html";
}


async function loadDashboard(){

    try{

        const headers = {
            "Authorization": "Bearer " + token
        };


        const usersResponse = await fetch("/admin/users", {
            headers
        });


        const walletsResponse = await fetch("/admin/wallets", {
            headers
        });


        const transactionsResponse = await fetch("/admin/transactions", {
            headers
        });


        const fundingResponse = await fetch("/funding/requests", {
            headers
        });


        const maintenanceResponse = await fetch("/maintenance");



        const users = await usersResponse.json();

        const wallets = await walletsResponse.json();

        const transactions = await transactionsResponse.json();

        const funding = await fundingResponse.json();

        const maintenance = await maintenanceResponse.json();



        document.getElementById("users").innerText =
        users.length;



        document.getElementById("transactions").innerText =
        transactions.length;



        document.getElementById("funding").innerText =
        funding.length;



        let totalWallet = 0;


        wallets.forEach(wallet => {

            totalWallet += Number(wallet.balance);

        });



        document.getElementById("wallet").innerText =
        "₦" + totalWallet.toLocaleString();



        if(document.getElementById("maintenanceStatus")){

            document.getElementById("maintenanceStatus").innerText =
            maintenance.enabled
            ? "🔴 Maintenance ON"
            : "🟢 System Online";

        }



    } catch(error){

        console.log(error);

    }

}



const logout = document.getElementById("logout");


if(logout){

    logout.onclick = function(){

        localStorage.removeItem("adminToken");

        window.location.href = "login.html";

    };

}



loadDashboard();
