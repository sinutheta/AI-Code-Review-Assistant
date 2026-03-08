async function reviewCode() {

const code = document.getElementById("codeInput").value;
const resultBox = document.getElementById("result");
const loading = document.getElementById("loading");

if (!code) {
alert("Please paste some code first.");
return;
}

loading.classList.remove("hidden");
resultBox.innerHTML = "";

try {

const response = await fetch("/review", {
method: "POST",
headers: {
"Content-Type": "application/json"
},
body: JSON.stringify({ code })
});

const data = await response.json();

loading.classList.add("hidden");

if (data.analysis) {
resultBox.innerText = data.analysis;
} else if (data.error) {
resultBox.innerText = data.error;
} else {
resultBox.innerText = "Unexpected response from server.";
}

} catch (error) {

console.error(error);

loading.classList.add("hidden");
resultBox.innerText = "Error connecting to server.";

}

}