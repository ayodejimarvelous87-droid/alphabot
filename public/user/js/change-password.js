const token = localStorage.getItem("token");
const phone = localStorage.getItem("phone");


if(!token || !phone){

    window.location.href = "login.html";

}



document.getElementById("change").onclick = async function(){


    const oldPassword =
    document.getElementById("oldPassword").value;


    const newPassword =
    document.getElementById("newPassword").value;



    try{


        const response = await fetch(
            `/users/change-password/${phone}`,
            {

                method:"PUT",

                headers:{

                    "Content-Type":"application/json",

                    "Authorization":
                    "Bearer " + token

                },


                body:JSON.stringify({

                    oldPassword,

                    newPassword

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
