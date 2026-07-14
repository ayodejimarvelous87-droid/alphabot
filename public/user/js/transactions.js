const token = localStorage.getItem("token");
const phone = localStorage.getItem("phone");


if(!token || !phone){
    window.location.href = "login.html";
}


async function loadTransactions(){

    try{

        const response = await fetch(
            `/transactions/${phone}`,
            {
                headers:{
                    "Authorization":"Bearer " + token
                }
            }
        );


        const transactions = await response.json();

        const container = document.getElementById("transactions");


        if(!transactions.length){

            container.innerHTML = `

            <div class="card">

                <h3>No Transactions Yet</h3>

                <p>Your wallet activity will appear here.</p>

            </div>

            `;

            return;
        }


        container.innerHTML = "";


        transactions.forEach(tx=>{


            const color =
            tx.direction === "credit"
            ? "#22c55e"
            : "#ef4444";


            const sign =
            tx.direction === "credit"
            ? "🟢 +"
            : "🔴 -";


            container.innerHTML += `

            <div class="transaction-card"
            style="border-left:5px solid ${color};">


                <h3>
                ${tx.type === "refund" ? "↩️ REFUND" : tx.type.toUpperCase()}
                </h3>


                <p>
                ${sign}₦${Number(tx.amount).toLocaleString()}
                </p>


                <p>
                📝 ${tx.description || "No description"}
                </p>


                ${
                tx.type === "refund"
                ?
                `
                <p>
                🔎 Service: ${tx.service || "N/A"}
                <br>
                ⚠️ Reason: ${tx.reason || "N/A"}
                </p>
                `
                :
                ""
                }


                <p>
                📌 ${tx.status}
                </p>


                <small>

                📅 ${new Date(tx.createdAt).toLocaleString()}

                <br>

                <a href="receipt.html?id=${tx._id}">
                🧾 View Receipt
                </a>

                </small>


            </div>

            `;


        });


    }catch(error){

        console.log(error);

    }

}


loadTransactions();
