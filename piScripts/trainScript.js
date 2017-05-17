var noble = require('noble');
var http = require('http');
var mac = require('getmac');    // npm package to get mac address from own maschine
var address = '';
var location = 'Schreibtisch';

//get mac address
mac.getMac(function(err, macAddress){
    if(err) {
        console.log('Error getting mac address');
    }else{
        address = macAddress;
    }
});

noble.on('stateChange', function(state) {
  if (state === 'poweredOn') {
    noble.startScanning();
  } else {
    noble.stopScanning();
  }
});

noble.on('discover', function(peripheral) {
    console.log('Found device with local name: ' + peripheral.advertisement.localName);
    console.log('advertising the following service uuid\'s: ' + peripheral.advertisement.serviceUuids);
    console.log();

    //make call to REST API
    var body = JSON.stringify({
        device_id : address,
        rssi : peripheral.rssi,
        location : location
    });

    //TODO: change host after restart of server
    var options = {
        host : 'http://ec2-34-252-244-185.eu-west-1.compute.amazonaws.com',
        port : '3000',
        path : '/writeTrainData',
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