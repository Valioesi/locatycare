exports.predict = function (req, res) {
    var pg = require('pg');
    var conString = process.env.DATABASE_URL || 'postgres://localhost:5432/cattrack';
    var client = new pg.Client(conString);
    var trainData = [];
    var testData = [];
    var predictions = [];
    
    var itemToLookFor = req.body.search || req.query.search;

    client.connect(function (err) {
        if (err) {
            return console.error('could not connect to postgres', err);
        }
        var query = 'select * from trainDataFinal';
        client.query(query, function (err, result) {
            if (err) {
                return console.error('error running query', err);
            }
            trainData = result.rows;
        });
        query = 'select * from rssiData';
        client.query(query, function (err, result) {
            if (err) {
                return console.error('error running query', err);
            }
            testData = result.rows;
            //TODO: to change rssi names depending on database names
            var testPoint = {
                'rssi1': testData[0].rssi1,
                'rssi2': testData[0].rssi2,
                'rssi3': testData[0].rssi3
            }
            //check location with nearest neighbour algorithm
            var location = getLocation(testPoint, trainData);
            res.send(location);
        });
    });
}
var knn = require('alike');
var knn_options = {
    k: 3,
    weights: {
      "rssi1":0.33, 
      "rssi2":0.33, 
      "rssi3":0.33
    }
  };
  
function getLocation(testPoint, trainData) {
  var knn_locations = knn(testPoint, trainData, knn_options);
  var locations = {};
  for(var i in knn_locations) {
    count = locations[knn_locations[i].location];
    if(count === undefined) {
      locations[knn_locations[i].location] = 1;
    } else {
      locations[knn_locations[i].location] = count + 1;
    }
  }
  var maxCount = 0;
  var maxLocation = '';
  for(var l in locations) {
    if(locations[l] > maxCount) {
      maxCount = locations[l];
      maxLocation = l;
    }
  }
  if(maxCount > 1)
    return maxLocation;
  else
    return knn_locations[0].location;
}
