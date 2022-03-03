//Use Express
const express = require('express');
const cors = require('cors');

const app = express();

app.use(express.json());
app.use(cors({ origin: true }));

//Use axios to sent requests
const axios = require('axios')

//Initiate firebase functions
const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

//Use express validator for sanitization and validation
const { body,validationResult } = require('express-validator');


//Listen  on port 3000
app.listen(3000)


//Set connection to mailjet
const mailjet = require ('node-mailjet')
.connect('f1b41b4797cfcff9d6c5a3baae714f6c', 'f9594f8bd0398db5c31ac20a755dc253')

const apiEndpointReCap = 'https://www.google.com/recaptcha/api/siteverify?secret=6LfMGWMeAAAAANowu1Ld1ByVKKAJjwvC0NJFkBNt&response=';


const errMsg = {"errors" : [{"msg" : "Error sending message. Please contact me directly on j.stjerne@live.dk"}]};
const sucMsg = {"errors" : [{"msg" : "Thank you for your message. I will contact you ASAP"}]};

//Endpoint for sending mail
app.post('/sendMessage', 
  body('name', 'Please provide a name').isLength({ min: 3 }).escape(),
  body('email', 'Please provide a valid email').isEmail().normalizeEmail(),
  body('message', 'Please write a message').not().isEmpty().trim().escape(),
  body('g-token', errMsg).not().isEmpty().trim().escape().custom(value => {
     return axios.get(apiEndpointReCap + value)
    .then(res => {
      if (res.data.score < 0.7 || !res.data.success || res.data.action != "submit") return Promise.reject(); 
     })
    .catch(err => {
      return Promise.reject()
     })
  }), 
  (req, res) => 
  {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
      return res.status(400).json({errors: errors.array() });
    }
    emailRequest(req.body.name, req.body.email, req.body.message)
    .then((result) => {
      res.send(sucMsg);
    })
    .catch((err) => {
      res.send(errMsg);
    })
  }
)

//Send mail to 
function emailRequest(name, email, message) {
  return (mailjet
  .post("send", {'version': 'v3.1'})
  .request({
    "Messages":[
      {
        "From": {
          "Email": "j.stjerne@live.dk",
          "Name": "Jonas"
        },
        "To": [
          {
            "Email": "jstjerne1@gmail.com",
            "Name": "Jonas"
          }
        ],
        "Subject": "New Portfolio Message",
        "HTMLPart": `<h3>New portfoli message from ${name}</h3><br><ul><li>${email}</li><li>${message}</li></ul>`
      }
    ]
  }))

  //For testing without sending mail
  // return (new Promise((res, rej) => {
  //   setTimeout(() => {
  //     res('foo');
  //   }, 300)
  // })
  // )
}

//Expose Express API as a single Cloud Function
exports.widgets = functions.https.onRequest(app);