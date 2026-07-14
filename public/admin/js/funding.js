const token = localStorage.getItem("adminToken");


if(!token){

    window.location.href = "login.html";

}



async function loadFunding(){


    try{


        const response = await fetch(
            "/funding/requests",
            {
                headers:{
                    "Authorization":
                    "Bearer " + token
                }
            }
        );


        const requests =
        await response.json();



        const box =
        document.getElementById("fundingTable");



        if(requests.length === 0){

            box.innerHTML =
            "<h3>No pending funding requests</h3>";

            return;

        }



        box.innerHTML = "";



        requests.forEach(request=>{


            box.innerHTML += `

            <div class="card funding-card">

            <h2>
            ₦${Number(request.amount).toLocaleString()}
            </h2>

            <p>
            Phone: ${request.phone}
            </p>

            <p>
            Reference:
            ${request.reference}
            </p>

            <p class="pending">
            Status: ${request.status}
            </p>


            <button onclick="approveFunding('${request._id}')">
            Approve
            </button>


            <button onclick="rejectFunding('${request._id}')">
            Reject
            </button>


            </div>

            `;


        });


    }catch(error){

        console.log(error);

    }


}




async function approveFunding(id){


    await fetch(
        `/funding/approve/${id}`,
        {

            method:"PUT",

            headers:{
                "Authorization":
                "Bearer " + token
            }

        }
    );


    loadFunding();


}




async function rejectFunding(id){


    await fetch(
        `/funding/reject/${id}`,
        {

            method:"PUT",

            headers:{
                "Authorization":
                "Bearer " + token
            }

        }
    );


    loadFunding();


}



const logout =
document.getElementById("logout");


if(logout){

logout.onclick = ()=>{

    localStorage.removeItem("adminToken");

    window.location.href="login.html";

};

}



loadFunding();
