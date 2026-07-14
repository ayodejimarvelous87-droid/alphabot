const token = localStorage.getItem("token");
const phone = localStorage.getItem("phone");


if(!token || !phone){

    window.location.href = "login.html";

}



async function loadProfile(){

    try{


        const response = await fetch(
            `/users/profile/${phone}`,
            {
                headers:{
                    "Authorization":
                    "Bearer " + token
                }
            }
        );



        const user =
        await response.json();



        document.getElementById("name").innerText =
        user.name;



        document.getElementById("phone").innerText =
        user.phone;



        document.getElementById("email").innerText =
        user.email || "Not added";



        document.getElementById("referralCode").innerText =
        user.referralCode || "None";



        document.getElementById("earnings").innerText =
        "₦" + Number(
            user.referralEarnings || 0
        ).toLocaleString();



    }catch(error){

        console.log(error);

    }


}



loadProfile();
