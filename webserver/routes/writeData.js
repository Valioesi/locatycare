exports.writeData = function(req, res){
  var device_id = req.body.device_id || req.query.device_id;
  // var gear_id = req.body.gear_id || req.query.gear_id;
  var rssi = req.body.rssi || req.query.rssi;

  //map device id (mac address of pi) to corresponding name of column in database
  if(device_id === '...'){
    device_id = 'rssi_1';
  }else if(device_id === '...'){
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
    //new code, which only updates the one row; only the appropriate (depending on the device) is updated
    var query = 'UPDATE rssi_data SET '+device_id+' = '+rssi+', time = NOW()';
    console.log(query);
    client.query(query, function(err, result) {
      if(err) {
        return console.error('error running query', err);
      }

      client.end();
      res.status(200).send('Updated');
    });
  });
};
