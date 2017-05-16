var noble = require('noble');
var http = require('http');

noble.on('stateChange', function(state) {
  if (state === 'poweredOn') {
      setInterval(function() { 
        noble.startScanning();   
      }, 20000);
  } else {
    noble.stopScanning();
  }
});

noble.on('discover', function(peripheral) {
    console.log('Found device with local name: ' + peripheral.advertisement.localName);
    console.log('advertising the following service uuid\'s: ' + peripheral.advertisement.serviceUuids);
    console.log();

    //make call to REST API
    //TODO: change device_id to this pi's id
    var body = JSON.stringify({
        device_id : 'rssi_1',
        rssi : peripheral.rssi,
    });

    //TODO: change host after restart of server
    var options = {
        host : 'http://ec2-34-252-244-185.eu-west-1.compute.amazonaws.com',
        port : '3000',
        path : '/writeData',
        method : 'POST',
        headers : {
            'Content-Type': 'application/json',
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
});