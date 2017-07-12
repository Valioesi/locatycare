/**
 * This file contains the predict function which is called via the route /predict of our API.
 * It uses a knn neighbour algorithm to predict the location of the searched for item. 
 * There it has to get the data stored in the tables rssi_data and train_data_formatted
 */

var https = require("https");
exports.predict = function(req, res) {
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

  client.connect(function(err) {
    if (err) {
      res.status(500).send("could not connect to postgres");
      return console.error("could not connect to postgres", err);
    }
    //check which user is logged in
    client.query("select user_id from registration", function(err, result) {
      if (err) {
        console.log("Error getting registered user");
      } else {
        loggedInUser = result.rows[0].user_id;
      }
    });
    
    //get the train data 
    var query = "select * from train_data_formatted";
    client.query(query, function(err, result) {
      if (err) {
        res.status(500).send("error running query");
        return console.error("error running query", err);
      }
      trainData = result.rows;
    });

    //get the current rssi data, 10 rows are stored over the last minute or so --> we take the average
    query = "select * from rssi_data";
    client.query(query, function(err, result) {
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
          if (location.location === "Schreibtisch") {
            openhabRequest("Lampe1", "ON");
            setTimeout(function() {
              openhabRequest("Lampe1", "OFF");
            }, 30000);
          } else if (location.location === "Regal") {
            openhabRequest("Lampe2", "ON");
            setTimeout(function() {
              openhabRequest("Lampe2", "OFF");
            }, 30000);
          } else if (location.location === "Blauer Stuhl") {
            openhabRequest("Lampe3", "ON");
            setTimeout(function() {
              openhabRequest("Lampe3", "OFF");
            }, 30000);
          }
        } else if (loggedInUser == 1) {   //other person gets audio feedback via Sonos speakers
          if (location.location === "Regal") {
            openhabRequest("play_uri_switch", "ON");
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

//function to predict the location of the item using knn algorithm
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

//function which sends request to REST Api of OpenHab, Parameter = the item (Sonos or Hue)
function openhabRequest(itemPath, body) {
  //make call to REST API of OpenHab
  var auth =
    "Basic " +
    new Buffer("grafjonas@web.de" + ":" + "locatycare").toString("base64");
  var options = {
    host: "home.myopenhab.org",
    port: "443",
    path: "/rest/items/" + itemPath,
    method: "POST",
    headers: {
      "Content-Type": "text/plain",
      "Content-Length": body.length,
      Authorization: auth
    }
  };

  var request = https.request(options, function(res) {
    res.setEncoding("utf8");
    res.on("data", function(chunk) {
      console.log("Response: " + chunk);
    });
  });

  request.write(body);
  request.end();


}
