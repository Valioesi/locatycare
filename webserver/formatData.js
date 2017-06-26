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
    var query1 = 'SELECT * FROM train_data WHERE device_id = rssi_1;'

    var query2 = 'SELECT * FROM train_data WHERE device_id = rssi_2;'

    var query3 = 'SELECT * FROM train_data WHERE device_id = rssi_3;'

    var result1, result2, result3;


    client.query(query1, function(err, result) {
      if(err) {
        return console.error('error running query', err);
      }
      result1=result.rows
    //   client.end();
});
    client.query(query2, function(err, result) {
      if(err) {
        return console.error('error running query', err);
      }
      result2=result.rows
    //   client.end();
});
    client.query(query3, function(err, result) {
      if(err) {
        return console.error('error running query', err);
      }
      result3=result.rows
    //   client.end();
});
    console.log(result1,result2,result3);
  });