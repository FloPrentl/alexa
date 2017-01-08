'use strict';
var AWS = require('aws-sdk');
var dynamodb = new AWS.DynamoDB({apiVersion: '2012-08-10'});

exports.handler = function(event, context, callback) {
  var docClient = new AWS.DynamoDB.DocumentClient();
  var aktionenFromRequest = (event.aktionen === undefined ? [] : event.aktionen);
  var params = { RequestItems: { 'Aktionen': [ { DeleteRequest: { Key: { type:'aktion', title:'*' } } } ] } };

  params = {
      TableName : "Aktionen",
      KeyConditionExpression: "#typeA = :typeB",
      ExpressionAttributeNames:{"#typeA": "type"},
      ExpressionAttributeValues: {":typeB": 'aktion'}
    };
  docClient.query(params, function(err, aktionenFromDynamo) {
      if (err) {
        console.error("Error when querying items: ", JSON.stringify(err, null, 2));
      } else {
        aktionenFromDynamo.Items.forEach(function(item) {
          var aktionFromRequest = aktionenFromRequest.find(function (element) {  return element.title == item.title; });
          if (aktionFromRequest === undefined) {
            var params = {
              TableName : 'Aktionen',
              Key: {type:'aktion', title:item.title}
            };
            docClient.delete(params, function(err, data) {
              if (err) {
                console.error("Error when deleting item: ", JSON.stringify(err, null, 2));
              }
            });
          }
        })

        aktionenFromRequest.forEach(function(item) {

          var aktionFromDynamo = aktionenFromDynamo.Items.find(function (element) {  return element.title == item.title; });
          if (aktionFromDynamo === undefined) {
            console.log("item from request is not in the items from dynamo");
            var params = {
              TableName: 'Aktionen',
              Item:{"type": 'aktion',"title": item.title}
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
