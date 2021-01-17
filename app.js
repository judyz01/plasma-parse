// Declare all imports
const express = require("express");
const app = express();
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { createWorker } = require('tesseract.js');
var log4js = require('log4js');

const worker = createWorker();
const PSM = require('tesseract.js/src/constants/PSM.js')

// Declare storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads")
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const upload = multer({storage: storage}).single("avatar");

app.set("view engine", "ejs");


// Routes
app.get("/", (req, res) => {
  res.render("index");
});



app.post("/upload", (req, res) => {
  upload(req, res, err => {
    console.log(req.file);
    fs.readFile(`./uploads/${req.file.originalname}`, (err, data) => {
      if (err) return console.log("This is your error", err);
      
      async function getTextFromImage() {
        await worker.load()
        await worker.loadLanguage('eng')
        await worker.initialize('eng')
        await worker.setParameters({
          tessedit_pageseg_mode: PSM.AUTO,
        })
        const { data: { text } } = await worker.recognize(`./uploads/${req.file.originalname}`);
        const { data } = await worker.getPDF('Tesseract OCR Result');
        // fs.writeFile('tesseract-ocr-result.txt', `${ text.description }`, function(err) { 
        //   if (err) return console.log(err);
        // });
      
        const myConsole = new console.Console(fs.createWriteStream('./output.txt'));
        myConsole.log(text);
        console.log('Generate PDF: tesseract-ocr-result.txt');

        fs.readFile('./output.txt', function (err, text) {
          if(text.toString().toLowerCase().includes('positive')){
            console.log("YESS")
          }
          else if (text.toString().toLowerCase().includes('negative')) {
            console.log("no");
          }
          else {
            console.log("neither");
          }
        });

        await worker.terminate();
        
        return text
      }
      getTextFromImage()  
        .then(console.log)
    });
  });
});


// Start up our server
const PORT= 3006 || process.env.PORT;
app.listen(PORT, () => console.log(`Hey I'm running on port ${PORT}`));

