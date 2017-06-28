
var https = require('https')
exports.predict = function (req, res) {

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
                loggedInUser = result.rows[0].user_id;
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
            var rssi1Array = [];
            var rssi2Array = [];
            var rssi3Array = [];
            for(var i = 0; i < result.rows.length; i++){
                rssi1Array.push(result.rows[i].rssi_1);
                rssi2Array.push(result.rows[i].rssi_2);
                rssi3Array.push(result.rows[i].rssi_3);
            }

            //now we get the median from rssi_1, rssi_2, rssi_3 and add it to testPoint
            var testPoint = {
                'rssi_1': median(rssi1Array),
                'rssi_2': median(rssi2Array),
                'rssi_3': median(rssi3Array)
            }
            //check location with nearest neighbour algorithm
            try {
                var location = {
                    'location': getLocation(testPoint, trainData)
                };

                
                //if registeredUser is 1 (Traussen) we want send request to Phillips Hue
                console.log("logged in user: ",loggedInUser)
                if(loggedInUser == 2){
                    
                    if(location.location==="Schreibtisch"){
                        openhabRequest('Lampe1');
                    }else if(location.location==="Regal"){
                         openhabRequest('Lampe2');
                    }else if(location.location==="Blauer Stuhl"){
                         openhabRequest('Lampe3');
                    }

                }else if(loggedInUser == 1){
                    if(location.location==="Regal"){
                    openhabRequest('play_uri_switch');
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
}
var knn = require('alike');
var knn_options = {
    k: 3,
    weights: {
        "rssi_1": 0.33,
        "rssi_2": 0.33,
        "rssi_3": 0.33
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




     //make call to REST API
    var body = "ON";
    var auth = "Basic " + new Buffer("grafjonas@web.de" + ":" + "locatycare").toString("base64");
    var options = {
        host : 'home.myopenhab.org',
        port : '443',
        path : '/rest/items/'+itemPath,
        method : 'POST',
        headers : {
            'Content-Type': 'text/plain',
            'Content-Length': body.length,
             "Authorization" : auth
        }
    };

    var request = https.request(options, function(res){
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

//function to calculate median
function median(values) {

    values.sort( function(a,b) {return a - b;} );

    var half = Math.floor(values.length/2);

    if(values.length % 2 == 0)
        return (values[half-1] + values[half]) / 2.0;
    else
        return values[half];
}