const token = localStorage.getItem("token");
const phone = localStorage.getItem("phone");


if(!token || !phone){

    window.location.href = "login.html";

}



async function loadReferral(){


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



        document.getElementById("code").innerText =
        user.referralCode || "No code";



        document.getElementById("earnings").innerText =
        "₦" + Number(
            user.referralEarnings || 0
        ).toLocaleString();



        const link =
        window.location.origin +
        "/user/register.html?ref=" +
        user.referralCode;



        document.getElementById("link").innerText =
        link;



        document.getElementById("copy").onclick =
        function(){


            navigator.clipboard.writeText(link);


            alert("Referral link copied");


        };



    }catch(error){

        console.log(error);

    }


}


loadReferral();
