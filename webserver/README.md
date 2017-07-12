A REST client written in node.js and express. <br><br>
There are 4 routes (as seen in the table below) which can be called (in our setup called by Alexa skill and node scripts running on rasperry pis). <br>
writeTrainData is called by trainScript.js, which is run on the raspberry pis, and saves the collected data for training the system in the correspondent table. <br>
writeData is called by writeScript.js, which is also run on the raspberry pis, and saves the collected data while the system is running in the correspondent table. <br>
predict is called through the alexa skill and compares the data collected by writeData with the trainData to predict the location of the item. <br>
registerUser is called through the alexa skill and is used to register a different user, which affects the feedback near the predicted location (Phillips Hue for visual feedback, Sonos Box for audio feedback). <br><br>
The code for the webserver is based on a different project (https://github.com/sana-malik/CatGear)<br><br>

API Calls:


| Type | Route | Parameters | Response |
| ---  | ---   | ---        | --- |
| post/get | /writeTrainData | device_id, rssi, location | Status Code |
| post/get | /writeData | device_id, rssi | Status Code |
| post/get | /predict | search | Status Code + location (e.g {location: "desk"}) |
| post/get | /registerUser | name | Status Code |

To run:

`npm install`

`bower install`

`node app.js`


Mac Addresse:

| Raspberry Pi | Mac Addresse |
| ---          | ---          |
| 1            | b8:27:eb:5d:15:a4 |
| 2            | b8:27:eb:08:e9:1c |
