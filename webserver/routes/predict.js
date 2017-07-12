/**
 * This file contains the predict function which is called via the route /predict of our API.
 * It uses a knn neighbour algorithm to predict the location of the searched for item. 
 * There it has to get the data stored in the tables rssi_data and train_data_formatted
 */

var https = require("https");
var openhabHelper = require("./openhabHelper");
var locationConfig = {
  BlauerStuhl: {
    light: "Color3"
  },
  Regal: {
    light: "Color2",
    sound: "play_uri_switch"
  },
  Schreibtisch: {
    light: "Lampe1"
  },
  Telefon: {},
  Bad:{light:"Color3"},
};
var notificationTimeout = 30000;

exports.predict = function (req, res) {
  var pg = require("pg");
  var math = require("mathjs");
  var client = new pg.Client({
    user: "postgres",
    password: "password",
    database: "postgres",
    host: "localhost"
  });

  var trainData = [];
  var predictions = [];
  var loggedInUser;

  var itemToLookFor = req.body.search || req.query.search;

  if(itemToLookFor.toLowerCase()!=="schlüssel"){ //as long as there is only one item (enables Alexa to says sth. meaningful)
    res.status(404).send("device not found");
    return;
  }

  client.connect(function (err) {
    if (err) {
      res.status(500).send("could not connect to postgres");
      return console.error("could not connect to postgres", err);
    }
    //check which user is logged in
    client.query("select user_id from registration", function (err, result) {
      if (err) {
        console.log("Error getting registered user");
      } else {
        loggedInUser = result.rows[0].user_id;
      }
    });
    
    //get the train data 
    var query = "select * from train_data_formatted";
    client.query(query, function (err, result) {
      if (err) {
        res.status(500).send("error running query");
        return console.error("error running query", err);
      }
      trainData = result.rows;
    });

    //get the current rssi data, 10 rows are stored over the last minute or so --> we take the average
    query = "select * from rssi_data";
    client.query(query, function (err, result) {
      if (err) {
        res.status(500).send("error running query");
        return console.error("error running query", err);
      }
      var rssi1Array = [];
      var rssi2Array = [];
      var rssi3Array = [];

      for (var i = 0; i < result.rows.length; i++) {
        rssi1Array.push(result.rows[i].rssi_1);
        rssi2Array.push(result.rows[i].rssi_2);
        rssi3Array.push(result.rows[i].rssi_3);
      }

      //now we get the mean from rssi_1, rssi_2, rssi_3 and add it to testPoint
      var testPoint = {
        rssi_1: math.mean(rssi1Array),
        rssi_2: math.mean(rssi2Array),
        rssi_3: math.mean(rssi3Array)
      };
      console.log("Averages: ", testPoint);
      //check location with nearest neighbour algorithm
      try {
        var location = {
          location: getLocation(testPoint, trainData)
        };

        //if registeredUser is 1 (Traussen) we want send request to Phillips Hue
        //depending on the location a different lamp is activated
        console.log("logged in user: ", loggedInUser);
        if (loggedInUser == 2) {
          var device = locationConfig[location.location.replace(" ", "")].light;
          if (device) {
            // openhabHelper.openhabRequest(device, "ON");
            if (device.match(/lampe/i)) {
              openhabHelper.openhabRequest(device, "ON");
              setTimeout(function () {
                openhabHelper.openhabRequest(device, "OFF");
              }, 30000);
            } else {
              openhabHelper.openhabLightNotification(device);
            }
          }
        } else if (loggedInUser == 1) {
          var device = locationConfig[location.location.replace(" ", "")].sound;
          if (device) {
            openhabHelper.openhabRequest(device, "ON");
          }
        }

        res.status(200).send(location);
      } catch (error) {
        console.log(error);
        res.status(500).send({
          errorMessage: error,
          error: "Error calculating Location"
        });
      }
    });
  });
};

//options for nearest neighbour algorithm
var knn = require("alike");
var knn_options = {
  k: 3,
  weights: {
    rssi_1: 0.33,
    rssi_2: 0.33,
    rssi_3: 0.33
  }
};
//predicts the acutal location from the trained data
function getLocation(testPoint, trainData) {
  var knn_locations = knn(testPoint, trainData, knn_options);
  var locations = {};
  for (var i in knn_locations) {
    count = locations[knn_locations[i].location];
    if (count === undefined) {
      locations[knn_locations[i].location] = 1;
    } else {
      locations[knn_locations[i].location] = count + 1;
    }
  }
  var maxCount = 0;
  var maxLocation = "";
  for (var l in locations) {
    if (locations[l] > maxCount) {
      maxCount = locations[l];
      maxLocation = l;
    }
  }
  if (maxCount > 1) return maxLocation;
  else return knn_locations[0].location;
}
