const token = localStorage.getItem("adminToken");


if(!token){

    window.location.href = "login.html";

}



async function loadMaintenance(){

    const response = await fetch("/maintenance");

    const data = await response.json();


    document.getElementById("status").innerText =
    data.enabled ? "🔴 Maintenance ON" : "🟢 Maintenance OFF";


    document.getElementById("message").value =
    data.message;

}



async function updateSettings(enabled){


    const message =
    document.getElementById("message").value;



    const response = await fetch("/maintenance", {

        method:"PUT",

        headers:{

            "Content-Type":"application/json",

            "Authorization":"Bearer " + token

        },


        body:JSON.stringify({

            enabled,

            message

        })

    });



    const data = await response.json();


    alert(data.message);


    loadMaintenance();

}




function turnOn(){

    updateSettings(true);

}



function turnOff(){

    updateSettings(false);

}



function updateMessage(){

    updateSettings(
        document.getElementById("status").innerText.includes("ON")
    );

}



loadMaintenance();
