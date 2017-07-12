/**
 * This is a script to format the train data which is collected by trainScript.js and processed by the /writeTrainData route
 * The script rebuilds the table so that we afterwards have the values of all 3 pis in one row. 
 */

var pg = require("pg");

var client = new pg.Client({
  user: "postgres",
  password: "password",
  database: "postgres",
  host: "localhost"
});

client.connect(function (err) {

  if (err) {
    res.status(500).send("could not connect to postgres");
    return console.error("could not connect to postgres", err);
  }

  var query1 = "SELECT * FROM train_data WHERE device_id = 'rssi_1';";
  var query2 = "SELECT * FROM train_data WHERE device_id = 'rssi_2';";
  var query3 = "SELECT * FROM train_data WHERE device_id = 'rssi_3';";

  var result1, result2, result3;

  client.query(query1, function (err, result) {

    if (err) {
      return console.error("error running query", err);
    }

    result1 = result.rows;

    //   client.end();

    client.query(query2, function (err, result) {

      if (err) {
        return console.error("error running query", err);
      }

      result2 = result.rows;

      client.query(query3, function (err, result) {
        if (err) {
          return console.error("error running query", err);
        }
        result3 = result.rows;
        console.log(result1.length, result2.length, result3.length);
        for (var i = 0; i < 120; i++) {
          var insertQuery = "INSERT INTO train_data_formatted (rssi_1, rssi_2, rssi_3, location) VALUES (" + result1[i].rssi + ", " + result2[i].rssi + ", " + result3[i].rssi + ", '" + result1[i].location +"')";
          client.query(insertQuery, function(err, result){
            if(err){
              return console.error("error running insertion inside for loop", err);
            }else{
              console.log("Inserted inside for loop");
            }
          });
        }
        //client.end();        
      });
      //   client.end();
    });
  });
});