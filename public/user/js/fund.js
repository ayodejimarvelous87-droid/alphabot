const button = document.getElementById("fund");

const savedPhone = localStorage.getItem("phone");


if(savedPhone){

    document.getElementById("phone").value = savedPhone;

}



button.onclick = async function(){


    const phone =
    document.getElementById("phone").value;


    const amount =
    document.getElementById("amount").value;



    try{


        const response = await fetch(
            "/funding/request",
            {

                method:"POST",

                headers:{
                    "Content-Type":"application/json"
                },

                body:JSON.stringify({

                    phone,
                    amount

                })

            }
        );



        const data =
        await response.json();



        document.getElementById("message").innerText =
        data.message;



    }catch(error){


        console.log(error);


        document.getElementById("message").innerText =
        "Something went wrong";


    }


};
