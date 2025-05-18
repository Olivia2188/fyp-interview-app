from flask import Flask, render_template, request, jsonify
from openpyxl import Workbook, load_workbook
from openpyxl.styles import Font
import os
import json     #to read, write & manipulate JSON data
import random

app = Flask(__name__)

@app.route('/uploadQuestion', methods=['POST'])
def uploadQuestion():
    file = request.files.get('file') # capture files sent from frontend that named 'file'

    if not file:
        return jsonify({"error": "No file uploaded"}), 400 # if file doesn't exist, return an error msg in JSON
    
    try:
        wb = load_workbook(filename = file) # workbook = open & read workbook with the filename called file
        sheet = wb.active # sheet = the first sheet/ last saved in the wb 

        expected_headers = ["Question Text", "Rubric", "Time Given(min)", "Awarded Marks"]
        actual_headers = [cell.value for cell in sheet[1]] # take the text inside the cell for row 1

        if expected_headers != actual_headers: # if they are different
            return jsonify({
                "error": f"Could not import from this spreadsheet. Please follow the sample template."
            }), 400
        
        questions = [] #empty list for storage

        for idx, row in enumerate(sheet.iter_rows(min_row = 2, values_only= True), start = 2): # going thru the wb row by row start from row 2, take the data in the cells
            if not any(row): # all 0 or empty (false), skip the row
                continue 

            question_text, rubric, time_given, awarded_marks = row # unpacking the row into 3 variables
            if question_text is None or rubric is None or time_given is None or awarded_marks is None:
                return jsonify({
                    "error": f"Missing the data in row {idx}. All fields are required" # idx count how many loops have happened like which excel row I'm at
                }), 400
            
            try:
                time_given = float(time_given)
                if time_given < 0:
                    raise ValueError
            except:
                return jsonify({"error": f"Invalid in row {idx}. Invalid time input."}), 400
            
            try:
                awarded_marks = float(awarded_marks)
                if awarded_marks < 0:
                    raise ValueError
            except:
                return jsonify({"error": f"Invalid in row {idx}. Invalid marks input ."}), 400
            
            questions.append({ # add the data to the empty list
                "text": str(question_text).strip(),
                "rubric": str(rubric).strip(),
                "time_given": time_given,
                "marks": awarded_marks
            })

            with open("uploadQuestion.json", "w") as f: #put the qns list inside the file called uploadQuestion for later use
                json.dump(questions, f)

        if not questions:
            return jsonify({"error": "No valid questions found in the file."}), 400
        
        return jsonify({"questions": questions}) # convert back to JSON format and sned back to the JS
    
    except Exception as e:
        return jsonify({"error":f"Failed to process Excel file:{str(e)}"}), 500

@app.route('/start_interview', methods=['GET'])
def start_interview():
    try:
        with open("uploadQuestion.json", "r") as f: #open the file in read mode
            questions = json.load(f) #load the JSON data from f, convert to python data and save it under questions
        random.shuffle(questions) 
        return jsonify({"questions":questions}) #convert python data to JSON data and save under the key named questions
    except Exception as e:
        return jsonify({"error": f"Failed to load questions: {str(e)}"}), 500

@app.route('/save_transcription', methods=['POST']) #set up a route to go the blk of codes, telling server fetch uses POST to send data
def save_transcription():
    data = request.get_json() #extract json data sent from fetch & turns it in python dictionary
    text = data.get("text", "") # extract the data in text, leave it empty if it's empty
    name = data.get("name")
    admin = data.get("admin")
    module = data.get("module")
    question = data.get("question")
    index = data.get("index")

    if not text.strip(): #strip remove leading/trailing spaces--> if text empty after removing spaces, carry actions
        return jsonify({"message": "No text to save!"}), 400  #400 means HTTP error (bad request, invalid input, users fault)
    
    excel_path = f"{admin}_{module}_{name}.xlsx" #name of the excel file to save to"

    if os.path.exists(excel_path):
        wb = load_workbook(excel_path)
        ws = wb.active
    else:
        wb = Workbook()
        ws = wb.active
    
        ws["A1"] = "Student Name"
        ws["B1"] = name
        ws["A2"] = "Admin No"
        ws["B2"] = admin
        ws["A3"] = "Module Code"
        ws["B3"] = module

        headers = ["Serial", "Question", "Response", "Score", "Remarks"]
        ws.append([])
        ws.append(headers)

        for col_num in range(1, len(headers)+1):
            cell = ws.cell(row=5, column=col_num)
            cell.font = Font(bold=True)

    target_row = int(index) + 6 #calculating row: index 0 = row 6, index 1 = row 7...
    serial = int(index) + 1

    ws.cell(row=target_row, column=1, value=serial)   #serial no.
    ws.cell(row=target_row, column=2, value=question)   #question
    ws.cell(row=target_row, column=3, value=text)    #transcribed text
    ws.cell(row=target_row, column=4, value=0)    #score
    ws.cell(row=target_row, column=5, value="")   #remarks

    wb.save(excel_path)

    return jsonify({"message": f"Save successfully as {excel_path}"}) #send response back to frontend

@app.route('/save_questionInfo', methods=["POST"])
def save_questionInfo():
    data = request.get_json()
    title = data.get("title")
    code = data.get("code")

    print(f"Question Info received: {code}:{title}")

    return jsonify({"success": True, "message": "Student info saved!"})

@app.route('/student')
def student():
    return render_template('student.html')

@app.route('/studentInfo')
def studentInfo():
    return render_template('studentInfo.html')

@app.route('/questionInfo')
def questionInfo():
    return render_template('questionInfo.html')

@app.route('/inputQuestion')
def inputQuestion():
    return render_template('inputQuestion.html')

@app.route('/qnMethod')
def qnMethod():
    return render_template('teacher-createQn-Method.html')

@app.route('/createfromScratch')
def createfromScratch():
    return render_template('teacher-createQn-scratch.html')

@app.route('/')
def index():
    return(render_template('index.html'))

@app.route('/save_student', methods=['POST'])
def save_student():
    data = request.get_json()
    name = data.get("name")
    admin = data.get("admin")
    module = data.get("module")

    print(f"Student Info received: {name}, {admin}, {module}")

    return jsonify({"success": True, "message": "Student info saved!"})

if __name__ == '__main__':
    app.run(debug=True)

