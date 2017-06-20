

exports.predict = function (req, res) {
    var fetch = require('http')
    var pg = require('pg');
    // var conString = process.env.DATABASE_URL || 'postgres://localhost:5432/postgres';
    var client = new pg.Client({
        user: 'postgres',
        password: 'password',
        database: 'postgres',
        host: 'localhost',
    });

    var trainData = [];
    var testData = [];
    var predictions = [];
    var loggedInUser;

    var itemToLookFor = req.body.search || req.query.search;

    client.connect(function (err) {
        if (err) {
            res.status(500).send('could not connect to postgres');
            return console.error('could not connect to postgres', err);
        }
        //check which user is logged in
        client.query('select user_id from registration', function (err, result) {
            if (err) {
                console.log('Error getting registered user');
            } else {
                loggedInUser = result;
            }
        })
        var query = 'select * from train_data_formatted';
        client.query(query, function (err, result) {
            if (err) {
                res.status(500).send('error running query');
                return console.error('error running query', err);
            }
            trainData = result.rows;
        });
        query = 'select * from rssi_data';
        client.query(query, function (err, result) {
            if (err) {
                res.status(500).send('error running query');
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
            try {
               /* var location = {
                    'location': getLocation(testPoint, trainData)
                };*/

                var location = {
                    'location': 'auf dem Schreibtisch'
                };
                
                //if registeredUser is 1 (Traussen) we want send request to Phillips Hue
                // if(loggedInUser == 1){
                    openhabRequest('Lamp1');
                // }else if(loggedInUser == 2){
                    // openhabRequest('Sonos');
                // }

                res.status(200).send(location);
            } catch (error) {
                res.status(500).send({
                    errorMessage: error,
                    error: "Error calculating Location"
                });
            }

        });
    });
}
var knn = require('alike');
var knn_options = {
    k: 3,
    weights: {
        "rssi1": 0.33,
        "rssi2": 0.33,
        "rssi3": 0.33
    }
};

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
    var maxLocation = '';
    for (var l in locations) {
        if (locations[l] > maxCount) {
            maxCount = locations[l];
            maxLocation = l;
        }
    }
    if (maxCount > 1)
        return maxLocation;
    else
        return knn_locations[0].location;
}

//function which sends request to REST Api of OpenHab, Parameter = the item (Sonos or Hue)
function openhabRequest(itemPath){
    var headers = new Headers({
	'Content-Type': 'text/plain'
    });

    var options = {
        method: 'POST',
        body: 'ON',
        headers: headers
    };


     //make call to REST API
    var body = "ON";

    //TODO: change host after restart of server
    var options = {
        host : 'https://grafjonas@web.de:locatycare@home.myopenhab.org',
        port : '80',
        path : '/rest/items/'+itemPath,
        method : 'POST',
        headers : {
            'Content-Type': 'plain/text',
            'Content-Length': body.length
        }
    };

    var request = http.request(options, function(res){
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
          console.log('Response: ' + chunk);
      });
    });

    request.write(body);
    request.end();
    
    // fetch('https://grafjonas@web.de:locatycare@home.myopenhab.org/rest/items/Lampe1' + itemPath, options)
    // .then(function(response){
    //     if(response == '200'){
    //         console.log('OpenHab request successful');
    //         return true;
    //     }else{
    //         console.log('OpenHab request not successful');            
    //         return false;
    //     }
    // });
}

