var https = require('https');
var AWS = require('aws-sdk');
var dynamodb = new AWS.DynamoDB({apiVersion: '2012-08-10'});
var theData = null;

exports.handler = (event, context) => {

  try {
    if (event.session.new) {
      // console.log("NEW SESSION")
    }

    switch (event.request.type) {
      case "LaunchRequest":
        context.succeed(generateResponse({}, "Ella fragt womit sie helfen kann.", true));
        break;

      case "IntentRequest":
        var docClient = new AWS.DynamoDB.DocumentClient();
        var queryAlleAktionenParams = {
            TableName : "Aktionen",
            KeyConditionExpression: "#typeA = :typeB",
            ExpressionAttributeNames:{"#typeA": "type"},
            ExpressionAttributeValues: {":typeB": 'aktion'}
        };
        var queryAlleTermineParams = {
            TableName : "Termine",
            KeyConditionExpression: "#typeA = :typeB",
            ExpressionAttributeNames:{"#typeA": "type"},
            ExpressionAttributeValues: {":typeB": 'termin'}
        };
        var speechResponse;
        var contextSucceed;
        var aktionNummer;

        switch(event.request.intent.name) {
          case "ListeAktionenIntent":
            contextSucceed = (data) => {
              speechResponse = 'Ella sagt Du könntest ...';
              data.Items.forEach(function(item) {
                  speechResponse = speechResponse.concat(" " + item.title + " ... ");
              });
              context.succeed(generateResponse({}, speechResponse, true));
            };

            if (theData === null) {
              docClient.query(queryAlleAktionenParams, function(err, data) {
                if (err) console.error("Error when querying items: ", JSON.stringify(err, null, 2));
                else contextSucceed(data);
              });
            } else {
              contextSucceed(data);
            }
            break;

          case "NaechsteAktionIntent":
            contextSucceed = (data) => {
              console.log("aktionNummer " + aktionNummer);
              aktionNummer = (event.session.attributes === undefined || event.session.attributes.aktionNummer === undefined ? 0 : event.session.attributes.aktionNummer);
              console.log("aktionNummer " + aktionNummer);
              var speechResponse = "";
              if (aktionNummer === 0) {
                  speechResponse = 'Ella sagt Du könntest ';
              }
              speechResponse = speechResponse.concat(data.Items[aktionNummer].title);

              aktionNummer = aktionNummer + 1;
              console.log("aktionNummer " + aktionNummer);
              context.succeed(generateResponse({ aktionNummer: aktionNummer }, speechResponse, false));
            };

            if (theData === null) {
              docClient.query(queryAlleAktionenParams, function(err, data) {
                if (err) console.error("Error when querying items: ", JSON.stringify(err, null, 2));
                else contextSucceed(data);
              });
            } else {
              contextSucceed(data);
            }
            break;

          case "ListeTermineIntent":
            contextSucceed = (data) => {
              speechResponse = 'Ella sagt Deine nächsten Termine sind ...';
              var termine = data.Items;
              termine.sort(function(a, b) { return Number(a.date) - Number(b.date) } );
              termine.forEach(function(item) {
                  if (item.title.substr(0,1) != '_') {
                    speechResponse = speechResponse.concat(" " + item.weekday + " " + item.time + " " + item.title + " ... ");
                  }
              });
              context.succeed(generateResponse({}, speechResponse, true));
            };

            if (theData === null) {
              docClient.query(queryAlleTermineParams, function(err, data) {
                if (err) console.error("Error when querying items: ", JSON.stringify(err, null, 2));
                else contextSucceed(data);
              });
            } else {
              contextSucceed(data);
            }
            break;

           case "BeendeSessionIntent":
            context.succeed(generateResponse({}, "Gerne.", true));
            break;

          default:
            throw "Invalid intent"
        }
        break;

      case "SessionEndedRequest":
        break;

      default:
        context.fail("Den Request Type ${event.request.type} gibt es nicht.")
    }

  } catch(error) { console.error(error); context.fail("Der Fehller ${error} ist aufgetreten.") }
}

generateResponse = (sessionAttributes, text, shouldEndSession) => {
  return {
    version: "1.0",
    sessionAttributes: sessionAttributes,
    response: {
      outputSpeech: {
        type: "PlainText",
        text: text
      },
      shouldEndSession: shouldEndSession
    }
  }
}
