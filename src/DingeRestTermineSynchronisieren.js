'use strict';
var AWS = require('aws-sdk');
var dynamodb = new AWS.DynamoDB({apiVersion: '2012-08-10'});

exports.handler = function(event, context, callback) {
  var docClient = new AWS.DynamoDB.DocumentClient();
  var termineFromRequest = (event.termine === undefined ? [] : event.termine);
  var params = { RequestItems: { 'Termine': [ { DeleteRequest: { Key: { type:'termin', title:'*' } } } ] } };

  params = {
      TableName : "Termine",
      KeyConditionExpression: "#typeA = :typeB",
      ExpressionAttributeNames:{"#typeA": "type"},
      ExpressionAttributeValues: {":typeB": 'termin'}
    };
  docClient.query(params, function(err, termineFromDynamo) {
      if (err) {
        console.error("Error when querying items: ", JSON.stringify(err, null, 2));
      } else {
        termineFromDynamo.Items.forEach(function(item) {
          var terminFromRequest = termineFromRequest.find(function (element) {  return element.title == item.title; });
          if (terminFromRequest === undefined) {
            var params = {
              TableName : 'Termine',
              Key: {type:'termin', title:item.title}
            };
            docClient.delete(params, function(err, data) {
              if (err) {
                console.error("Error when deleting item: ", JSON.stringify(err, null, 2));
              }
            });
          }
        })

        termineFromRequest.forEach(function(item) {

          var terminFromDynamo = termineFromDynamo.Items.find(function (element) {  return element.title == item.title; });
          if (terminFromDynamo === undefined) {
            console.log("item from request is not in the items from dynamo");
            var params = {
              TableName: 'Termine',
              Item:{"type": 'termin', "title": item.title, "date": item.date, "weekday": item.weekday, "time": item.time}
            };
            docClient.put(params, function(err, data) {
              if (err) {
                console.error("Error when creating item: ", JSON.stringify(err, null, 2));
              }
            });
          }
        })
      }
  });

  callback(null, "Synchronization completed.");  // SUCCESS with message
};
