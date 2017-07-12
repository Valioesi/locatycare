/**
 * This node script uses the npm package "noble" to get access to the bluetooth rssi data of nearby devices. 
 * It gets the value and sends it to the server to be stored. 
 * The script is used to collect train data of different locations.
 */

var noble = require('noble');
var http = require('http');
var mac = require('getmac'); // npm package to get mac address from own machine
var address = '';
var location = process.argv[2];
var count = 0;

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
        noble.startScanning();
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

        //make call to REST API, route is /writeTrainData
        
        var body = JSON.stringify({
            device_id: address,
            rssi: peripheral.rssi,
            location: location
        });

        //the host has to changed after every restart of server
        var options = {
            host: 'ec2-54-77-55-113.eu-west-1.compute.amazonaws.com',
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
                if(count<process.argv[3]){
                noble.startScanning();
                }else{
                    process.exit();
                }
            });
        });

        request.write(body);
        request.end();
    }
});