window.onload = function(){
    showInterviewInfo();
}
function showInterviewInfo(){
    let title = localStorage.getItem("interviewTitle");
    let code = localStorage.getItem("moduleCode");

    document.getElementById("displayTitle").innerText = title;
    document.getElementById("displayCode").innerText = code;

}
function questionInfo(event){
    event.preventDefault();

    let title = document.getElementById("interviewTitle").value;
    let code = document.getElementById("moduleCode").value;

    if(title === "" || code === ""){
        alert("Please fill in all fields");
        return;
    }
    localStorage.setItem("interviewTitle", title);
    localStorage.setItem("moduleCode", code);

    fetch('/save_questionInfo',{ // capture user responses (no form submit way as that will refresh the page and unable to proceed to next page)
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({title, code})
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
        window.location.href = "/inputQuestion"; // redirect to the page
    })
    .catch(error => console.error("Error:", error));
}