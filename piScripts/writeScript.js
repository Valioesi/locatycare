/**
 * This node script uses the npm package "noble" to get access to the bluetooth rssi data of nearby devices. 
 * It gets the value and sends it to the server to be stored. 
 * The script is used to collect data and send it to the server to be processed.
 * It works virtually the same as trainScript.js, but it incorporates a loop to get the rssi value of the XY Finder every x seconds.
 */

var noble = require('noble');
var http = require('http');
var mac = require('getmac'); // npm package to get mac address from own maschine
var address = '';

//get mac address of the raspberry pi
mac.getMac(function (err, macAddress) {
    if (err) {
        console.log('Error getting mac address');
    } else {
        address = macAddress;
    }
});

noble.on('stateChange', function (state) {
    if (state === 'poweredOn') {
        setInterval(function () {
            noble.startScanning();
        }, process.argv[2]);
    } else {
        noble.stopScanning();
    }
});

//this part of the code is called when a bluetooth device is found
noble.on('discover', function (peripheral) {
        //we only want to proceed if the XY Findables Tracker is found
    if (peripheral.id == "00ea24407984") {

        console.log('Found device with local name: ' + peripheral.advertisement.localName);
        console.log('advertising the following service uuid\'s: ' + peripheral.advertisement.serviceUuids);
        console.log();

        //make call to REST API, route is /writeData

        var body = JSON.stringify({
            device_id: address,
            rssi: peripheral.rssi,
        });

        //the host has to changed after every restart of server
        var options = {
            host: 'ec2-54-77-55-113.eu-west-1.compute.amazonaws.com',
            port: '3000',
            path: '/writeData',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': body.length
            }
        };

        var request = http.request(options, function (res) {
            res.setEncoding('utf8');
            res.on('data', function (chunk) {
                console.log('Response: ' + chunk);
            });
        });

        request.write(body);
        request.end();
    }else{
        console.log('Our XY not found, but...');
        console.log('Found device with local name: ' + peripheral.advertisement.localName);
    }
});