/**
 * This file contains the writeData function which is called via the route /writeData of our API.
 * It receives the rssi data collected by the raspberry pis during runtime and stores it in a table, 10 rows at a time
 */

var data = { rssi_1: false, rssi_1: false, rssi_3: false };

exports.writeData = function(req, res) {
  var device_id = req.body.device_id || req.query.device_id;
  var rssi = req.body.rssi || req.query.rssi;

  //map device id (mac address of pi) to corresponding name of column in database
  if (device_id === "b8:27:eb:5d:15:a4") {
    data.rssi_1 = rssi;
    console.log("received from pi 1");
  } else if (device_id === "b8:27:eb:08:e9:1c") {
    data.rssi_2 = rssi;
    console.log("received from pi 2");
  } else {
    data.rssi_3 = rssi;
    console.log("received from pi 3");
  }

  //only if we have received data from all three pis we store the values in the database, so that we
  //can keep all of the values in one row
  if (data.rssi_3 && data.rssi_2 && data.rssi_1) {
    console.log("received all 3 updating...", data);
    var pg = require("pg");
    var client = new pg.Client({
      user: "postgres",
      password: "password",
      database: "postgres",
      host: "localhost"
    });
    client.connect(function(err) {
      if (err) {
        res.status(500).send("could not connect to postgres");
        return console.error("could not connect to postgres", err);
      }

      var query =
        "INSERT INTO rssi_data  (rssi_1,rssi_2,rssi_3,time) values  (" +
        data.rssi_1 +
        "," +
        data.rssi_2 +
        "," +
        data.rssi_3 +
        ",NOW());";
      console.log(query);
      client.query(query, function(err, result) {
        if (err) {
          return console.error("error running query", err);
        }

        
        res.status(200).send("Updated");
        data = { rssi_1: false, rssi_2: false, rssi_3: false };

        //if we have more than 10 rows already we delete the oldest row
        var query2 = "SELECT * FROM rssi_data;";
        client.query(query2, function(err, result) {
          if (err) {
            return console.error("error running query", err);
          }
          if (result.rows.length > 10) {
            var query3 =
              "DELETE FROM rssi_data WHERE ctid IN (SELECT ctid FROM rssi_data ORDER BY time asc limit 1);";
            client.query(query3, function(err, result) {
              if (err) {
                return console.error("error running query", err);
              }
              client.end();
            });
          }else{
            client.end();
          }
        });
      });
    });
  }else{
      res.status(200).send("Stored");
  }
};
