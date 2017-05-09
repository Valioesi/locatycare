exports.writeData = function(req, res){
  var device_id = req.body.device_id || req.query.device_id;
  // var gear_id = req.body.gear_id || req.query.gear_id;
  var rssi = req.body.rssi || req.query.rssi;

  var pg = require('pg');
  // var conString = process.env.DATABASE_URL || 'postgres://localhost:5432/cattrack';
  var conString = 'postgres://localhost:5432/cattrack';

  var client = new pg.Client(conString);
  client.connect(function(err) {
    if(err) {
      return console.error('could not connect to postgres', err);
    }
    //TODO: only keep one row with 3 rssi columns, which get updated every time -> to avoid post processing
    //or maybe it would be better to have several rows to get an average -> to be discussed
    //TODO: rename gear_id in code and database
    // var query = 'insert into rssiData (device_id, gear_id, rssi, time) values (\''+device_id+'\', \''+gear_id+'\', '+rssi+', NOW());'
    // !!Change!!
    //new code, which only updates the one row; only the appropriate (depending on the device) is updated
    var query = 'UPDATE rssiData SET '+device_id+' = '+rssi+', time = NOW()';
    console.log(query);
    client.query(query, function(err, result) {
      if(err) {
        return console.error('error running query', err);
      }
     
      client.end();
      res.writeHead(200);
      res.end(query);
    });
  });
};