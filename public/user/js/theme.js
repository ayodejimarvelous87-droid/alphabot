const savedTheme = localStorage.getItem("theme");


if(savedTheme === "dark"){

    document.body.classList.add("dark");

}



document.addEventListener("DOMContentLoaded",()=>{


const themeButton = document.getElementById("themeToggle");


function updateThemeButton(){

if(!themeButton) return;


if(document.body.classList.contains("dark")){

themeButton.innerText="☀️ Light Mode";

}else{

themeButton.innerText="🌙 Dark Mode";

}

}



if(themeButton){

updateThemeButton();


themeButton.onclick=()=>{


document.body.classList.toggle("dark");


if(document.body.classList.contains("dark")){

localStorage.setItem("theme","dark");

}else{

localStorage.setItem("theme","light");

}


updateThemeButton();


};


}


});

