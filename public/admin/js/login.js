document.querySelector("form").addEventListener("submit", async function(e){

    e.preventDefault();

    const username = document.querySelector('input[type="text"]').value.trim();
    const password = document.querySelector('input[type="password"]').value.trim();

    try {

        const response = await fetch("/admin/login", {
            method:"POST",
            headers:{
                "Content-Type":"application/json"
            },
            body: JSON.stringify({
                username,
                password
            })
        });

        const data = await response.json();

        if(response.ok){

            localStorage.setItem("adminToken", data.token);

            window.location.href = "dashboard.html";

        } else {

            alert(data.message);

        }

    } catch(error){

        alert("Server connection error");

    }

});
