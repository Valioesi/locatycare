A REST client written in node.js and express.

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
