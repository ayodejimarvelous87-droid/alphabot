const token = localStorage.getItem("adminToken");

if(!token){
    window.location.href="login.html";
}


async function loadUsers(){

    try{

        const response = await fetch("/admin/users",{
            headers:{
                "Authorization":"Bearer " + token
            }
        });


        const users = await response.json();


        const box = document.getElementById("usersList");

        box.innerHTML="";


        users.forEach(user=>{

            box.innerHTML += `

            <div class="card">


            <h2>
            ${user.name || "Name not provided"}
            </h2>


            <p>
            📱 ${user.phone}
            </p>


            <p>
            📧 ${user.email || "No email"}
            </p>


            <p>
            📅 Joined:
            ${new Date(user.createdAt).toLocaleDateString()}
            </p>


            <button onclick="viewUser('${user.phone}')">
            View Wallet
            </button>


            </div>

            `;

        });


    }catch(error){

        console.log(error);

    }

}



function viewUser(phone){

    window.location.href =
    "profile.html?phone=" + phone;

}



const logout = document.getElementById("logout");


if(logout){

logout.onclick=()=>{

localStorage.removeItem("adminToken");

window.location.href="login.html";

}

}



loadUsers();
