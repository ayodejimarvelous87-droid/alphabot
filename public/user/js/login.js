const button = document.getElementById("login");


button.onclick = async function(){


    const phone =
    document.getElementById("phone").value;


    const password =
    document.getElementById("password").value;



    try{


        const response = await fetch(
            "/users/login",
            {
                method:"POST",

                headers:{
                    "Content-Type":"application/json"
                },

                body:JSON.stringify({
                    phone,
                    password
                })

            }
        );



        const data = await response.json();



        if(response.ok){


            localStorage.setItem(
                "token",
                data.token
            );


            localStorage.setItem(
                "phone",
                data.user.phone
            );


            document.getElementById("message").innerText =
            "Login successful";


            setTimeout(()=>{

                window.location.href =
                "dashboard.html";

            },1000);



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
