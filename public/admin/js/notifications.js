const token = localStorage.getItem("adminToken");

if(!token){
    window.location.href = "login.html";
}


async function loadNotifications(){

    try{

        const response = await fetch("/admin/notifications", {
            headers:{
                "Authorization":"Bearer " + token
            }
        });


        const notifications = await response.json();


        const container = document.getElementById("notifications");


        if(notifications.length === 0){

            container.innerHTML = `
                <div class="card">
                    No notifications found
                </div>
            `;

            return;
        }



        container.innerHTML = notifications.map(notification => `

            <div class="card">

                <h2>
                ${notification.title}
                </h2>

                <p>
                User: ${notification.phone}
                </p>

                <p>
                ${notification.message}
                </p>

                <p>
                Type: ${notification.type}
                </p>

                <small>
                ${new Date(notification.createdAt).toLocaleString()}
                </small>

            </div>

        `).join("");


    }catch(error){

        console.log(error);

    }

}



const logout = document.getElementById("logout");


if(logout){

    logout.onclick = function(){

        localStorage.removeItem("adminToken");

        window.location.href = "login.html";

    };

}



loadNotifications();
