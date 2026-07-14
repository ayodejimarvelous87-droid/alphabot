const token = localStorage.getItem("token");
const phone = localStorage.getItem("phone");


if(!token || !phone){

    window.location.href = "login.html";

}



async function loadDashboard(){

    try{


        const headers = {

            "Authorization":
            "Bearer " + token

        };



        // Wallet balance

        const walletResponse = await fetch(
            `/wallet/balance/${phone}`,
            {
                headers
            }
        );


        const wallet = await walletResponse.json();


        document.getElementById("balance").innerText =
        "₦" + Number(wallet.balance).toLocaleString();



        const balanceElement = document.getElementById("balance");
        const toggleButton = document.getElementById("toggleBalance");

        let balanceVisible = true;
        const realBalance = "₦" + Number(wallet.balance).toLocaleString();

        toggleButton.onclick = () => {

            balanceVisible = !balanceVisible;

            if(balanceVisible){

                balanceElement.innerText = realBalance;
                toggleButton.innerHTML = '<i class="fa-solid fa-eye"></i>';

            }else{

                balanceElement.innerText = "₦••••••";
                toggleButton.innerHTML = '<i class="fa-solid fa-eye-slash"></i>';

            }

        };


        // Notifications

        const notificationResponse = await fetch(
            `/notifications/${phone}`,
            {
                headers
            }
        );


        const notifications =
        await notificationResponse.json();


        document.getElementById("notificationCount").innerText =
        notifications.length;




        // Profile

        const profileResponse = await fetch(
            `/users/profile/${phone}`,
            {
                headers
            }
        );


        const profile =
        await profileResponse.json();



        document.getElementById("phone").innerText =
        profile.phone;



        document.getElementById("referral").innerText =
        profile.referralCode || "None";



        // Logout

        document.getElementById("logout").onclick =
        function(){

            localStorage.removeItem("token");
            localStorage.removeItem("phone");

            window.location.href =
            "login.html";

        };



    }catch(error){

        console.log(error);

    }


}



loadDashboard();
