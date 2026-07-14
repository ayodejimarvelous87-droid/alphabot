const token = localStorage.getItem("token");
const phone = localStorage.getItem("phone");


if(!token || !phone){

    window.location.href = "login.html";

}



document.getElementById("save").onclick = async function(){


    const name =
    document.getElementById("name").value;


    const email =
    document.getElementById("email").value;



    try{


        const response = await fetch(
            `/users/profile/${phone}`,
            {

                method:"PUT",

                headers:{

                    "Content-Type":"application/json",

                    "Authorization":
                    "Bearer " + token

                },


                body:JSON.stringify({

                    name,

                    email

                })

            }
        );



        const data =
        await response.json();



        document.getElementById("message").innerText =
        data.message;



    }catch(error){

        console.log(error);

    }


};
