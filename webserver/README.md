A REST client written in node.js and express.

API Calls:


| Type | Route | Parameters | Response |
| ---  | ---   | ---        | --- |
| post/get | /writeTrainData | device_id, rssi, location | Status Code |
| post/get | /writeData | device_id, rssi | Status Code |
| post/get | /predict | search | Status Code + location (e.g {location: "desk"}) |

To run:

`npm install`

`bower install`

`node app.js`
