async function reviewCode(){

const code = document.getElementById("codeInput").value;
const resultBox = document.getElementById("result");
const loading = document.getElementById("loading");

if(!code){
alert("Please paste some code first.");
return;
}

loading.classList.remove("hidden");
resultBox.innerHTML = "";

try{

const res = await fetch("http://localhost:5000/review",{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({code})
});

const data = await res.json();

loading.classList.add("hidden");

resultBox.innerText = data.analysis;

}catch(error){

loading.classList.add("hidden");
resultBox.innerText = "Error connecting to server.";

}

}