const token = localStorage.getItem("token");
const phone = localStorage.getItem("phone");


if(!token || !phone){

    window.location.href="login.html";

}



async function loadOrders(){


try{


const response = await fetch(

`/orders/${phone}`,

{

headers:{

"Authorization":"Bearer " + token

}

}

);



const orders = await response.json();



const box =
document.getElementById("orders");



if(!orders || orders.length === 0){


box.innerHTML = `

<div class="card">

<h3>
No Orders Yet 📦
</h3>

<p>
Your purchased services will appear here.

</p>

</div>

`;


return;

}



box.innerHTML="";



orders.forEach(order=>{


const statusColor =

order.status === "successful"

? "#22c55e"

: "#facc15";



box.innerHTML += `


<div class="order-card">


<h3>
📱 ${order.product || "Service"}
</h3>


<p>

💰 Amount: ₦${Number(order.amount || 0).toLocaleString()}

</p>


<p style="color:${statusColor}">

● ${order.status || "pending"}

</p>



<small>

📅 ${new Date(order.createdAt).toLocaleString()}

</small>


</div>


`;



});



}catch(error){

console.log(error);

}


}



loadOrders();
