
/**
 * app.js defines the different routes and which correspondent functions should be called
 * it also starts the api server when the script is called 
 */

var express = require('express'),
cors = require('cors');
var routes = require('./routes');
var http = require('http');
var path = require('path');

var app = express();

var DBconfig = {
    user: 'postgres',
    password: 'password',
    database: 'postgres',
    host: 'localhost',
}

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
// app.use(cors);
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);

var writeDataRoute = require('./routes/writeData');
app.get('/writeData', cors(),  writeDataRoute.writeData);
app.post('/writeData', cors(), writeDataRoute.writeData);


var writeTrainDataRoute = require('./routes/writeTrainData');
app.get('/writeTrainData', cors(),  writeTrainDataRoute.writeTrainData);
app.post('/writeTrainData', cors(), writeTrainDataRoute.writeTrainData);


var predictRoute = require('./routes/predict');
app.post('/predict', cors(), predictRoute.predict);
app.get('/predict', cors(), predictRoute.predict);

var registerRoute = require('./routes/registerUser');
app.post('/registerUser', cors(), registerRoute.registerUser);
app.get('/registerUser', cors(), registerRoute.registerUser);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
