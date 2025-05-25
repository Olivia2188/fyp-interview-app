window.onload = function(){
    resetInterviewState(); //clear previous session

    initialisePage();

    document.getElementById("output-box").style.display = "none";

    fetch('/start_interview')
        .then(response => response.json()) //parse json response to JS object
        .then(data =>{
            if(data.questions){
                questions = data.questions;
                localStorage.setItem("questionList", JSON.stringify(questions));
                displayQuestion(0); //show the first question, index starts from 0
                localStorage.setItem("currentQuestionIndex", 0);
                nextQns();
            }
            else{
                alert("Error loading questions:" + data.error)
            }
        })
        .catch(error =>{
            console.error("Fetch error:", error);
            alert("Failed to load questions");
            return;
        });
};

function displayQuestion(index){
    const questions = JSON.parse(localStorage.getItem("questionList")); //get shuffled list qns from local storage and convert it from JSON string to JS object
    const questionBox = document.getElementById("questionBox");

    if (questions && questions[index]){  // if questions is true(exist) & the index(position of qns, corresponding) is true, proceed
        questionBox.innerHTML = `
            <h3>Question ${index + 1}</h3>
            <p>${questions[index].text}</p>
            <p><strong>Time Given:</strong>${questions[index].time_given}</p>
            <p><strong>Marks:</strong>${questions[index].marks}</p>
        `;
    }
    else{
        questionBox.innerHTML = "<p>No question found.</p>";
    }
}
function initialisePage(){
    let studentName = localStorage.getItem("studentName");
    let admin = localStorage.getItem("adminNumber");
    let module = localStorage.getItem("moduleCode");

    document.getElementById("displayName").innerText = studentName;
    document.getElementById("displayAdmin").innerText = admin;
    document.getElementById("displayModule").innerText = module;
}

let recognition;

// Real-time Speech-to-Text
function startRecording(){
    responseSaved = false; //reset flag

    if(!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)){
        alert("Your browser doesn't support speech recognition.");
        return;
    }

    recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.continuous= true; //keep running after pauses so students can give longer answer
    recognition.interimResults = true; //allows system shows result while student still speaking
    recognition.lang = ""; //Auto-detect language

    document.querySelector("#recordSection .send-data-img").style.display = "none"; // hide img and description when start is being pressed
    document.querySelector("#recordSection .send-data-contain").style.display = "none";
    document.getElementById("output-box").style.display = "block"; // show transcribed text after pressing start    
    
    let containerRecord = document.querySelector("#recordSection .send-data-component");
    containerRecord.style.justifyContent = "flex-start";
    containerRecord.style.minHeight = "auto";
    containerRecord.style.padding = "0";
    containerRecord.style.marginTop = "0";

    let outputRecord = document.querySelector("#output-box .send-data-component");
    outputRecord.style.marginTop = "0";

    let recordBtn = document.querySelector("#recordSection .btn-container");
    recordBtn.style.padding = "0";
    
    let containerOutput = document.querySelector("#output-box .send-data-component");
    containerOutput.style.justifyContent = "flex-start";

    recognition.onstart = function(){ // starts listening
        document.getElementById("status").innerText = "Recording...";
        document.getElementById("status").style.marginTop = "0";
        document.getElementById("status").style.marginBottom = "20px";
    };

    recognition.onresult = function(event){
        let transcript = "";
        for (let i = 0; i < event.results.length; i++){
            transcript += event.results[i][0].transcript + " ";
        }
        document.getElementById("output").innerText = transcript;
    };

    recognition.onerror = function(event){
        alert("Error occured: " + event.error)
        return;
    };

    recognition.onend = function(){
        document.getElementById("status").innerText = "Press \"Start\" to begin.";
        document.getElementById("status").style.marginTop = "30px";
        document.getElementById("status").style.marginBottom = "20px";
    };

    recognition.start();
}

function stopRecording(){
    if(recognition){
        recognition.stop();
    }
    document.querySelector("#recordSection .send-data-img").style.display = "block"; // show img and desc again
    document.querySelector("#recordSection .send-data-contain").style.display = "block";

    let container = document.querySelector("#recordSection .send-data-component");
    container.style.justifyContent = "center";
    container.style.minHeight = "400px";
    container.style.width = "85%";
    container.style.marginTop = "50px";

    document.getElementById("output-box").style.display = "none";

    let recordBtn = document.querySelector("#recordSection .btn-container");
    recordBtn.style.padding = "15px";
}

function showRecord(){
    document.querySelector(".rec-btn-upload").classList.remove("active-btn");
    document.querySelector(".rec-btn-record").classList.add("active-btn");

    document.getElementById("recordSection").style.display = "block";        
    document.getElementById("output-box").style.display = "none";
}

/*save response, info to excel file*/

let responseSaved = false; // flag to check if response was alr saved, only save if this flag = false

function saveToExcel(fromTimer = false){ //Saves data to Excel, fromTimer= true-> auto-save by timer, false ->saved by clicking btn
    if(responseSaved) return; //responseSvaed = true, don't save the response again

    let transcribedText = document.getElementById("output").innerText.trim();
    if(!transcribedText.trim()){ // if transcribedText is false (empty) after trimming spaces
        if(!fromTimer){
            alert("No text to save!");
            return;
        }
        else{
            alert("Time's up! No response was given.Saving empty response.")
        }
    }

    clearInterval(countdownInterval);  //stop the timer if user pressed save

    let studentName = localStorage.getItem("studentName"); //retrieve student info from local storage
    let admin = localStorage.getItem("adminNumber");
    let module = localStorage.getItem("moduleCode");

    const questions = JSON.parse(localStorage.getItem("questionList"));
    const index = parseInt(localStorage.getItem("currentQuestionIndex") || "0");
    const question = questions?.[index]?.text;
    if(!question){
        document.getElementById("questionBox").innerText = "No question found.";
        return;
    }
    fetch('/save_transcription',{ // make HTTP POST requests to server
        method: 'POST',
        headers: {
            'Content-Type': 'application/json' // tell server we are sending JSON data
        },
        body: JSON.stringify({
            text: transcribedText, 
            studentName, 
            admin,
            module, 
            question,
            index: localStorage.getItem("currentQuestionIndex")}) // send transcribedText... to server as JSON string
    })
    .then(response => response.json()) // Convert response backinto JS object
    .then(data => {
        alert(data.message); // displays the success message from server
        responseSaved = true;    //set flag to true to prevent multiple saving

        clearOutput();
        stopRecording();

        currentQuestionIndex++;
        localStorage.setItem("currentQuestionIndex", currentQuestionIndex);

        if (currentQuestionIndex < questions.length){
            displayQuestion(currentQuestionIndex);
            nextQns();
        }
        else{
            alert("Interview finished!");

            document.getElementById("mainContent").style.display = "none";
            document.getElementById("finishSection").style.display = "flex";

            return;
        }
    })
    .catch(error => console.error('Error:', error)); // handles errors
}

function clearOutput(){
    document.getElementById("output").innerText = "";
    responseSaved = false;   //reset the flag for next qns
}

/*studentInfo page*/

function saveInfo(event){
    event.preventDefault(); // stop default form submission, prevent reloading the page (allow fetch to carry out)

    let studentName = document.getElementById("studentName").value;
    let admin = document.getElementById("adminNumber").value;
    let module = document.getElementById("moduleCode").value;

    if(studentName === "" || admin === "" || module === ""){
        alert("Please fill in all fields");
        return;
    }
    localStorage.setItem("studentName", studentName); //save student info to local storage(built-in browser feature to store small amt of data)
    localStorage.setItem("adminNumber", admin);
    localStorage.setItem("moduleCode", module);

    fetch('/save_student',{ // capture user responses (no form submit way as that will refresh the page and unable to proceed to next page)
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({studentName, admin, module})
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
        window.location.href = "/student"; // redirect to the page
    })
    .catch(error => console.error("Error:", error));
}

//count-down timer
let currentQuestionIndex = parseInt(localStorage.getItem("currentQuestionIndex") || "0");  // start from 0 in shuffledlist
let questions = []; //empty list, under fetch start interview, it will be filled with data.questions(shuffled qns list)
let countdownInterval;

function nextQns(){
    responseSaved = false;  //reset the flag for next qns

    const q = questions[currentQuestionIndex]; //if index 0, get first row from shuffled list , including text,rubric....
    const timeInSecs = Math.floor(q.time_given * 60); // converts mins to secs, Math.floor to get whole number(prevent decimals)

    displayQuestion(currentQuestionIndex);

    startCountdown(timeInSecs, () =>{  //call the startCountdown function, save the following codes inside the parameter onEnd() 
        if(!responseSaved){
            saveToExcel(true); //save due to timeup
        }
    });
}
function startCountdown(timeInSecs, onEnd){
    let timer = timeInSecs;  // timer is a copy of timeInSecs that counts down every secs, timeInSecs need to remain unchange to calculate the percent(given timing vs time passed)
    const bar = document.getElementById("progressBar");
    const display = document.getElementById("countdown");

    clearInterval(countdownInterval); // to kill leftover interval from last qns, ensure a new interval -> no interupt

    countdownInterval = setInterval(() =>{ //build in function that runs the code repeatedly at a time interval
        let minutes = Math.floor(timer / 60);
        let seconds = timer % 60;
        display.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`; // convert mins, secs into string to add padding(leading 0), ensure both always in 2 digits, else add a 0 infront
        
        const percent = (timer / timeInSecs) * 100;
        bar.style.width = `${percent}%`;

        if (--timer < 0){ //if timer < 0
            clearInterval(countdownInterval) //stop the countdown timer when time's up
            onEnd(); //run the code that passed to onEnd() previously, like the currentQuestionIndex++
            clearOutput();
        }
    }, 1000); // the time interval, runs the setInterval() repeatedly at this time interval (1000ms = 1 secs)
}
function resetInterviewState(){ //function to clear previous session data
    localStorage.removeItem("questionList");
    localStorage.removeItem("currentQuestionIndex");
}