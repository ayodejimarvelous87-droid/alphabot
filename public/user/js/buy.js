const token = localStorage.getItem("token");
const phone = localStorage.getItem("phone");

if(!token || !phone){
    window.location.href = "login.html";
}


let beneficiaryPhone = phone;


async function loadBeneficiaries(){

try{

const response = await fetch(
"/beneficiaries/"+phone,
{
headers:{
"Authorization":"Bearer "+token
}
}
);

const data = await response.json();

const select = document.getElementById("beneficiarySelect");

if(!select || !Array.isArray(data)) return;


data.forEach(item=>{

select.innerHTML += `
<option value="${item.owner}">
${item.nickname} - ${item.owner}
</option>
`;

});


select.onchange = function(){

if(this.value){

beneficiaryPhone = this.value;

}else{

beneficiaryPhone = phone;

}

};


}catch(error){

console.log(error);

}

}

async function loadProducts(){

    try{

        const response = await fetch("/products");

        const products = await response.json();

        const container = document.getElementById("products");

        container.innerHTML = "";

        products.forEach(product=>{

            const div = document.createElement("div");

            div.className="card";

            div.innerHTML=`

            <h3>${product.name}</h3>

            <p>₦${Number(product.price).toLocaleString()}</p>

            <button onclick="buyProduct('${product._id}')">

            Buy Now

            </button>

            `;

            container.appendChild(div);

        });

    }catch(error){

        console.log(error);

    }

}

async function buyProduct(productId){

    const pin =
    document.getElementById("transactionPin").value;

    if(!pin){

        document.getElementById("message").innerText =
        "Enter your Transaction PIN";

        return;

    }

    try{

        const response = await fetch(

            "/orders/buy",

            {

                method:"POST",

                headers:{

                    "Content-Type":"application/json",

                    "Authorization":"Bearer " + token

                },

                body:JSON.stringify({

                    phone: beneficiaryPhone,

                    productId,

                    pin

                })

            }

        );

        const data = await response.json();

        document.getElementById("message").innerText =
        data.message;

    }catch(error){

        console.log(error);

    }

}

loadBeneficiaries();
loadProducts();
