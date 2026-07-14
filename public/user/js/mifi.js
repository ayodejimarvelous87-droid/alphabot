const token = localStorage.getItem("token");
const phone = localStorage.getItem("phone");


if(!token || !phone){

window.location.href="login.html";

}



async function loadProducts(){

const response = await fetch("/products");

const products = await response.json();


const container =
document.getElementById("products");


container.innerHTML="";


products
.filter(product=>product.type==="mifi")
.forEach(product=>{


container.innerHTML += `

<div class="card">

<h3>${product.name}</h3>

<p>₦${product.price.toLocaleString()}</p>

<button onclick="buyProduct('${product._id}')">

Buy Now

</button>

</div>

`;

});


}



async function buyProduct(productId){


const pin =
document.getElementById("transactionPin").value;


const response = await fetch("/orders/buy",
{

method:"POST",

headers:{

"Content-Type":"application/json",

"Authorization":"Bearer "+token

},

body:JSON.stringify({

phone,
productId,
pin

})

});


const data = await response.json();


document.getElementById("message").innerText =
data.message;


}



loadProducts();
