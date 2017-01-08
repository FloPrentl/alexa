'use strict';
var AWS = require('aws-sdk');
var dynamodb = new AWS.DynamoDB({apiVersion: '2012-08-10'});

exports.handler = function(event, context, callback) {
  var docClient = new AWS.DynamoDB.DocumentClient();
  var title = (event.title === undefined ? 'Kein Titel.' : event.title);
  var params = {
    TableName: 'Aktionen',
    Item:{
        "type": 'aktion',
        "title": title
    }
  };
  docClient.put(params, function(err, data) {
    if (err) {
        console.error("Error when putting an item: ", JSON.stringify(err, null, 2));
        callback(null, "Error: " + err);
    } else {
        console.log("Success when putting an item: ", JSON.stringify(data, null, 2));
        callback(null, "Success_: " + data);
    }
  });
};
