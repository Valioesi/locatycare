var https = require("https");
var exports = (module.exports = {});
var notificationTimeout = 30000;
exports.openhabRequest = function(itemPath, body) {
  //make call to REST API

  var auth =
    "Basic " +
    new Buffer("grafjonas@web.de" + ":" + "locatycare").toString("base64");
  var options = {
    host: "home.myopenhab.org",
    port: "443",
    path: "/rest/items/" + itemPath,
    method: "POST",
    headers: {
      "Content-Type": "text/plain",
      "Content-Length": body.length,
      Authorization: auth
    }
  };

  var request = https.request(options, function(res) {
    res.setEncoding("utf8");
    res.on("data", function(chunk) {
      console.log("Response: " + chunk);
    });
  });

  request.write(body);
  request.end();
};

//request for the Item data. callback gets called when data is available
var openhabItemRequest = function(itemPath, callback) {
  //make call to REST API

  var auth =
    "Basic " +
    new Buffer("grafjonas@web.de" + ":" + "locatycare").toString("base64");
  var options = {
    host: "home.myopenhab.org",
    port: "443",
    path: "/rest/items/" + itemPath,
    method: "GET",
    headers: {
      "Content-Type": "text/plain",
      //   "Content-Length": body.length,
      Authorization: auth
    }
  };

  var request = https.request(options, function(res) {
    res.setEncoding("utf8");
    res.on("data", function(chunk) {
      console.log("Response: " + chunk);
      callback(chunk);
    });
  });

  //   request.write(body);
  request.end();
};
//sends a light notification -> turning the light back to the previous state after notificationTimout.
exports.openhabLightNotification = function(device) {
  // TODO: to make it work with colors reconfigure Switches in OpenHAB as Color not Switch then send 0,0,0 etc. to the light for HSB
  openhabItemRequest(device, function(item) {
    var json = JSON.parse(item);
    console.log("openhab notif request to ",device)
    exports.openhabRequest(device, "280,100,100");
    setTimeout(function() {
      console.log("openhab reset request to",device,json.state)
      exports.openhabRequest(device, json.state);
    }, notificationTimeout,json);
  });
};
