const button = document.getElementById("register");


// Auto-fill referral code from URL
const params = new URLSearchParams(window.location.search);

const ref = params.get("ref");

if(ref){

    document.getElementById("referralCode").value = ref;

}


button.onclick = async function(){


    const name =
    document.getElementById("name").value;


    const phone =
    document.getElementById("phone").value;


    const email =
    document.getElementById("email").value;


    const password =
    document.getElementById("password").value;


    const referralCode =
    document.getElementById("referralCode").value;



    try{


        const response = await fetch(
            "/users/register",
            {
                method:"POST",

                headers:{
                    "Content-Type":"application/json"
                },

                body:JSON.stringify({

                    name,
                    phone,
                    email,
                    password,
                    referralCode

                })

            }
        );


        const data = await response.json();


        if(response.ok){

            document.getElementById("message").innerText =
            "Registration successful. Redirecting...";

            setTimeout(()=>{

                window.location.href =
                "login.html";

            },1500);

        }else{

            document.getElementById("message").innerText =
            data.message;

        }


    }catch(error){

        console.log(error);

        document.getElementById("message").innerText =
        "Something went wrong";

    }

};
