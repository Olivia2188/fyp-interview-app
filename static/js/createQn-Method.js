function showpopup(){
    let popupWindow = document.querySelector(".popupWindow");
    popupWindow.style.display = "flex";
    popupWindow.style.backgroundColor = "#090909cc";

    document.querySelector('.popupBackbtn').style.display = "none";
}
function closepopup(){
    let popupWindow = document.querySelector(".popupWindow");
    popupWindow.style.display = "none";

    let importBtn = document.querySelector('.importBtn');
    importBtn.disabled = true;

    let fileInput = document.getElementById('fileInput');
    fileInput.value = '';

    let questionContainer = document.querySelector('.questionContainer');
    questionContainer.innerHTML = '';

    let upload = document.querySelector('.upload');
    upload.style.display = "block";

    let downloadbtn = document.querySelector('.popupBtn');
    downloadbtn.style.display = "block";

    let area = document.querySelector('.uploadArea');
    area.style.justifyContent = 'center';
}
function uploadfile(){
    document.getElementById('fileInput').click();

    let fileInput = document.getElementById('fileInput');
    let importBtn = document.querySelector('.importBtn');

    fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0){
            importBtn.disabled = false; /*if files is alr imported, make the importbtn to be able to press*/
        }
        else{
            importBtn.disabled = true; /*importbtn remains disabled*/
        }
    });
}
document.getElementById("fileInput").addEventListener('change', () => { /*check whether thr's a change to the id, if there is, */
    const file = document.getElementById("fileInput").files[0];            /*grab the first file*/ 
    if(file){         /*if file is true, check if there is a file*/
        uploadExcel(file);     /*call the function and bring the file over to the function*/
    }
})
function uploadExcel(file){
    const formData = new FormData();
    formData.append('file', file);
    fetch('/uploadQuestion',{
        method:'POST',
        body: formData
    })
    .then(res => res.json())
    .then(data =>{
        if (data.questions) {
            localStorage.setItem("questionList", JSON.stringify(data.questions));
            
            let uploadContainer = document.querySelector('.uploadContainer');
            uploadContainer.style.padding = "0px";

            let upload = document.querySelector('.upload');
            upload.style.display = "none";
            
            let container = document.querySelector('.questionContainer');
            container.innerHTML = ''; // Clear previous questions
            container.style.alignItems = 'flex-start';

            let area = document.querySelector('.uploadArea');
            area.style.justifyContent = 'flex-start';

            document.querySelector('.popupBackbtn').style.display = "inline-block";

            let downloadbtn = document.querySelector('.popupBtn');
            downloadbtn.style.display = "none";

            let table = `
                <table style = "width: 100%; border-collapse: collapse; text-align:left;">
                    <thead>
                        <tr>
                            <th style ="padding: 8px; border: 2px solid #ddd;">Question</th>
                            <th style ="padding: 8px; border: 2px solid #ddd;">Rubric</th>
                            <th style ="padding: 8px; border: 2px solid #ddd;">Time Given (min)</th>
                            <th style ="padding: 8px; border: 2px solid #ddd;">Awarded Marks</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            data.questions.forEach(q => {
                table += `
                    <tr>
                        <td style ="padding: 8px; border: 1px solid #ddd;">${q.text || ''}</td>
                        <td style ="padding: 8px; border: 1px solid #ddd;">${q.rubric || ''}</td>
                        <td style ="padding: 8px; border: 1px solid #ddd;">${q.time_given || ''}</td>
                        <td style ="padding: 8px; border: 1px solid #ddd;">${q.marks || ''}</td>
                    </tr>
                `;
            });

            table += `</tbody></table>`;
            container.innerHTML = table;
        } else if (data.error) {
            alert('Error: ' + data.error);
            return;
        }
    })
    .catch(error => console.error('Error:', error));
}
function back(){
    document.querySelector('.popupBackbtn').style.display = "none";

    let downloadbtn = document.querySelector('.popupBtn');
    downloadbtn.style.display = "block";

    let upload = document.querySelector('.upload');
    upload.style.display = "block";

    let area = document.querySelector('.uploadArea');
    area.style.justifyContent = 'center';

    let importBtn = document.querySelector('.importBtn');
    importBtn.disabled = true;

    let fileInput = document.getElementById('fileInput');
    fileInput.value = '';

    let questionContainer = document.querySelector('.questionContainer');
    questionContainer.innerHTML = '';
}
function scratchpage(){
    window.location.href = "/createfromScratch";
}
function confirmImport(){
    window.location.href ="/createfromScratch";
}