const token = localStorage.getItem("token");
const phone = localStorage.getItem("phone");


if(!token || !phone){

    window.location.href="login.html";

}



async function loadNotifications(){

try{


const response = await fetch(

`/notifications/${phone}`,

{

headers:{

"Authorization":"Bearer " + token

}

}

);



const notifications = await response.json();



const container =
document.getElementById("notifications");



if(!notifications.length){

container.innerHTML = `

<div class="card">

<h3>
No Notifications Yet 🔔
</h3>

<p>
You will see important updates here.

</p>

</div>

`;

return;

}




container.innerHTML="";



notifications.forEach(notification=>{


container.innerHTML += `


<div class="notification-card">


<h3>
🔔 ${notification.title}
</h3>


<p>
${notification.message}
</p>


<small>

📅 ${new Date(notification.createdAt).toLocaleString()}

</small>


</div>


`;



});



}catch(error){

console.log(error);

}


}



loadNotifications();
