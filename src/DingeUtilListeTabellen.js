var https = require('https');
var AWS = require('aws-sdk');
var dynamodb = new AWS.DynamoDB({apiVersion: '2012-08-10'});

exports.handler = (event, context) => {

  try {
    if (event.session.new) {
      console.log("NEW SESSION")
    }

    switch (event.request.type) {

      case "LaunchRequest":
        console.log(`LAUNCH REQUEST`)
        context.succeed(
          generateResponse(
            buildSpeechletResponse("Du kannst jetzt noch nicht spielen Leo!", true),
            {}
          )
        )
        break;

      case "IntentRequest":
        console.log(`INTENT REQUEST`);
        var docClient = new AWS.DynamoDB.DocumentClient();
        var params;

        switch(event.request.intent.name) {

          case "ListeTabellenIntent":
            dynamodb.listTables(function(err, data) {
              if (err) {
                console.error("Error when listing tables: ", JSON.stringify(err, null, 2));
                context.succeed(
                  generateResponse(
                    buildSpeechletResponse("Die Funktion 'List Tables' hat einen Fehler zurückgegeben.", true),
                    {}
                  )
                )
              } else {
                console.log("Success when listing tables: ", JSON.stringify(data, null, 2));
                context.succeed(
                  generateResponse(
                    buildSpeechletResponse("Die Funktion 'List Tables' war erfolgreich.", true),
                    {}
                  )
                )
              }
            });
            break;

          case "NeueTabelleIntent":
            params = {
                TableName : "Aktionen",
                KeySchema: [
                    { AttributeName: "type", KeyType: "HASH"},  //Partition key
                    { AttributeName: "title", KeyType: "RANGE" }  //Sort key
                ],
                AttributeDefinitions: [
                    { AttributeName: "type", AttributeType: "S" },
                    { AttributeName: "title", AttributeType: "S" }
                ],
                ProvisionedThroughput: {
                    ReadCapacityUnits: 10,
                    WriteCapacityUnits: 10
                }
            };

            dynamodb.createTable(params, function(err, data) {
                if (err) {
                    console.error("Error when creating table: ", JSON.stringify(err, null, 2));
                    context.succeed(
                      generateResponse(
                        buildSpeechletResponse("Die Funktion 'Create Table' hat einen Fehler zurückgegeben.", true),
                        {}
                      )
                    )
                } else {
                    console.log("Success when creating table: ", JSON.stringify(data, null, 2));
                    context.succeed(
                      generateResponse(
                        buildSpeechletResponse("Die Funktion 'Create Table' war erfolgreich.", true),
                        {}
                      )
                    )
                }
            });
            break;

          case "NeuerEintragIntent":
            params = {
              TableName: 'Aktionen',
              Item:{
                  "type": 'aktion',
                  "title": 'Müll rausbringen.'
              }
            };
            docClient.put(params, function(err, data) {
              if (err) {
                  console.error("Error when putting an item: ", JSON.stringify(err, null, 2));
                  context.succeed(
                    generateResponse(
                      buildSpeechletResponse("Die Funktion 'Doc Client Put' hat einen Fehler zurückgegeben.", true),
                      {}
                    )
                  )
              } else {
                  console.log("Success when putting an item: ", JSON.stringify(data, null, 2));
                  context.succeed(
                    generateResponse(
                      buildSpeechletResponse("Die Funktion 'Doc Client Put' war erfolgreich.", true),
                      {}
                    )
                  )
              }
            });
            break;

          case "ListeAktionenIntent":
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
            break;

          default:
            throw "Invalid intent"
        }
        break;

      case "SessionEndedRequest":
        // Session Ended Request
        console.log(`SESSION ENDED REQUEST`)
        break;

      default:
        context.fail(`INVALID REQUEST TYPE: ${event.request.type}`)
    }

  } catch(error) { context.fail(`Exception: ${error}`) }
}

// Helpers
buildSpeechletResponse = (outputText, shouldEndSession) => {
  return {
    outputSpeech: {
      type: "PlainText",
      text: outputText
    },
    shouldEndSession: shouldEndSession
  }

}

generateResponse = (speechletResponse, sessionAttributes) => {
  return {
    version: "1.0",
    sessionAttributes: sessionAttributes,
    response: speechletResponse
  }

}
