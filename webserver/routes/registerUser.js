/**
 * This file contains the registerUser function which is called via the route /registerUser of our API.
 * Depending on the argument of the request the id of the user is stored in the database
 */

exports.registerUser = function (req, res) {
    var name = req.body.name || req.query.name;

    var userId;
    if(name === 'traussen'){
        userId = 1;
    }else{
        userId = 2;
    }

    var pg = require('pg');
    var client = new pg.Client({
        user: 'postgres',
        password: 'password',
        database: 'postgres',
        host: 'localhost',
    });
    
    //make database connection
    client.connect(function (err) {
        if (err) {
            res.status(500).send('could not connect to postgres');
            return console.error('could not connect to postgres', err);
        }
        var query = 'UPDATE registration SET user_id = ' + userId + ', time = NOW()';
        console.log(query);
        client.query(query, function (err, result) {
            if (err) {
                return console.error('error running query', err);
            }

            client.end();
            res.status(200).send('Registered user');
        });
    });

}