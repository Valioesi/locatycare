var noble = require('noble');
var http = require('http');
var mac = require('getmac'); // npm package to get mac address from own maschine
var address = '';
var location = process.argv[2];
var count = 0;

//get mac address
mac.getMac(function (err, macAddress) {
    if (err) {
        console.log('Error getting mac address');
    } else {
        address = macAddress;
    }
});

noble.on('stateChange', function (state) {
    if (state === 'poweredOn') {
        noble.startScanning();
    } else {
        noble.stopScanning();
    }
});

noble.on('discover', function (peripheral) {
    if (peripheral.id == "00ea24407984") {

        console.log('Found device with local name: ' + peripheral.advertisement.localName);
        console.log('advertising the following service uuid\'s: ' + peripheral.advertisement.serviceUuids);
        console.log();

        //make call to REST API
        var body = JSON.stringify({
            device_id: address,
            rssi: peripheral.rssi,
            location: location
        });

        //TODO: change host after restart of server
        var options = {
            host: 'ec2-user@ec2-54-77-55-113.eu-west-1.compute.amazonaws.com',
            port: '3000',
            path: '/writeTrainData',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': body.length
            }
        };

        var request = http.request(options, function (res) {
            res.setEncoding('utf8');
            res.on('data', function (chunk) {
                count++;
                console.log('Response: ' + chunk);
                noble.stopScanning();
                console.log('start new Scan');
                if(count<process.argv[3])
                noble.startScanning();
            });
        });

        request.write(body);
        request.end();
    }
});