const token = localStorage.getItem("adminToken");

if(!token){
    window.location.href = "login.html";
}


let currentPhone = "";


// Search wallet
async function searchWallet(){

    const phone = document.getElementById("searchPhone").value.trim();

    if(!phone){
        alert("Enter phone number");
        return;
    }


    const response = await fetch("/admin/wallet/" + phone, {

        headers:{
            "Authorization":"Bearer " + token
        }

    });


    const data = await response.json();


    if(response.ok){

        currentPhone = phone;

        document.getElementById("walletBox").style.display = "block";

        document.getElementById("phone").innerText = data.phone;

        document.getElementById("balance").innerText =
        Number(data.balance).toLocaleString();


    } else {

        alert(data.message);

    }

}




// Add funds
async function addFunds(){

    if(!currentPhone){
        alert("Search user first");
        return;
    }


    const amount =
    document.getElementById("addAmount").value;


    const reason =
    document.getElementById("addReason").value;



    const response = await fetch("/admin/wallet/add", {

        method:"POST",

        headers:{
            "Content-Type":"application/json",
            "Authorization":"Bearer " + token
        },


        body:JSON.stringify({

            phone:currentPhone,
            amount,
            reason

        })

    });



    const data = await response.json();


    alert(data.message);


    if(response.ok){
        searchWallet();
    }

}





// Deduct funds
async function deductFunds(){

    if(!currentPhone){
        alert("Search user first");
        return;
    }


    const amount =
    document.getElementById("deductAmount").value;


    const reason =
    document.getElementById("deductReason").value;



    const response = await fetch("/admin/wallet/deduct", {

        method:"POST",

        headers:{
            "Content-Type":"application/json",
            "Authorization":"Bearer " + token
        },


        body:JSON.stringify({

            phone:currentPhone,
            amount,
            reason

        })

    });



    const data = await response.json();


    alert(data.message);


    if(response.ok){
        searchWallet();
    }

}
