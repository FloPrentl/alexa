'use strict';
var AWS = require('aws-sdk');
var dynamodb = new AWS.DynamoDB({apiVersion: '2012-08-10'});

exports.handler = function(event, context, callback) {


  var docClient = new AWS.DynamoDB.DocumentClient();





  params = {
      TableName : "Aktionen",
      KeyConditionExpression: "#typeA = :typeB",
      ExpressionAttributeNames:{
          "#typeA": "type"
      },
      ExpressionAttributeValues: {
          ":typeB": 'aktion'
      }
  };
  docClient.query(params, function(err, data) {
      if (err) {
          console.error("Error when querying items: ", JSON.stringify(err, null, 2));
      } else {
          console.log("Success when querying items: ", JSON.stringify(data, null, 2));
          var speechResponse = '';
          data.Items.forEach(function(item) {
              console.log(" -", item.type + ": " + item.title);
              speechResponse = speechResponse.concat(" " + item.title);
          });
          context.succeed(
            generateResponse(
              buildSpeechletResponse(speechResponse, true),
              {}
            )
          )
      }
  });


  // var params = { RequestItems: { 'Aktionen': [ { DeleteRequest: { Key: { type:'aktion' } } } ] } };
  //
  // docClient.batchWrite(params, function(err, data) {
  //   if (err) console.log(err);
  //   else console.log(data);
  //
  //   if (err) {
  //       console.error("Error when deleting all items: ", JSON.stringify(err, null, 2));
  //       callback(null, "Error: " + err);
  //   } else {
  //       console.log("Success when deleting all items: ", JSON.stringify(data, null, 2));
  //       callback(null, "Success: " + data);
  //   }
  // });
};
