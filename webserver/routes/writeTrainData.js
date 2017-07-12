/**
 * This file contains the writeTrainData function which is called via the route /writeTrainData of our API.
 * It receives the rssi data collected by the raspberry pis during the training process and stores it in the database
 * Later the table is formatted (final table is called train_data_formatted) using the script formatData.js, so that we 
 * can properly use the predict funtion.
 */


exports.writeTrainData = function(req, res){
  var device_id = req.body.device_id || req.query.device_id;
  // var gear_id = req.body.gear_id || req.query.gear_id;
  var rssi = req.body.rssi || req.query.rssi;
  var location = req.body.location || req.query.location;

  //map device id (mac address of pi) to corresponding name of column in database
  if(device_id === 'b8:27:eb:5d:15:a4'){
    device_id = 'rssi_1';
  }else if(device_id === 'b8:27:eb:08:e9:1c'){
    device_id = 'rssi_2';
  }else{
    device_id = 'rssi_3';
  }

  var pg = require('pg');
  var client = new pg.Client({
      user: 'postgres',
      password: 'password',
      database: 'postgres',
      host: 'localhost',
  });
  client.connect(function(err) {
    if(err) {
      res.status(500).send('could not connect to postgres');
      return console.error('could not connect to postgres', err);
    }
    var query = 'insert into train_data (device_id, rssi, location, time) values (\''+device_id+'\', '+rssi+ ', \'' +location+ '\', NOW());';
    console.log(query);
    client.query(query, function(err, result) {
      if(err) {
        return console.error('error running query', err);
      }
      // console.log(result);
      client.end();
      res.status(200).send('Inserted');
    });
  });
};
