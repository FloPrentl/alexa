var https = require('https');
var AWS = require('aws-sdk');

exports.handler = (event, context) => {
  try {
    //if (event.session.new) {
      //console.log("event.session.new");
    //}

    switch (event.request.type) {
      case "LaunchRequest":
        context.succeed(generateResponse({}, "Ella fragt womit sie helfen kann.", true));
        break;

      case "IntentRequest":
        console.log(event.request.intent.name);
        switch(event.request.intent.name) {
          case "WeiterIntent":
            var lastIntent = (event.session.attributes === undefined || event.session.attributes.lastIntent === undefined ? null : event.session.attributes.lastIntent);
            switch(lastIntent) {
              case "listeAktionenIntent":
                listeAktionenIntent(event, context);
                break;
              case "naechsteAktionIntent":
                naechsteAktionIntent(event, context);
                break;
              case "listeTermineIntent":
                listeTermineIntent(event, context);
                break;
              case "naechsteVokabelIntent":
                naechsteVokabelIntent(event, context);
                break;
              default:
                context.fail("Es gab keinen vorherigen Intent.")
            }
            break;

          case "ListeAktionenIntent":
            listeAktionenIntent(event, context);
            break;

          case "NaechsteAktionIntent":
            naechsteAktionIntent(event, context);
            break;

          case "ListeTermineIntent":
            listeTermineIntent(event, context);
            break;

          case "NaechsteVokabelIntent":
            naechsteVokabelIntent(event, context);
            break;

          case "BeendeSessionIntent":
            context.succeed(generateResponse({}, "Gerne.", true));
            break;

          default:
            context.fail("Für den Intent ${event.request.intent.name} ist keine Funktionalität implementiert.")
        }
        break;

      //case "SessionEndedRequest":
        //break;

      default:
        context.fail("Den Request Type ${event.request.type} gibt es nicht.")
    }

  } catch(error) {
    console.error(error);
    context.fail("Der Fehler ${error} ist aufgetreten.")
  }
}

listeAktionenIntent = (event, context) => {
  var contextSucceed = (data) => {
    var speechResponse = 'Ella sagt Du könntest ...';
    data.Items.forEach(function(item) {
        speechResponse = speechResponse.concat(" " + item.title + " ... ");
    });
    context.succeed(generateResponse({ lastIntent: 'listeAktionenIntent' }, speechResponse, true));
  };

  var queryAlleAktionenParams = {
      TableName : "Aktionen",
      KeyConditionExpression: "#typeA = :typeB",
      ExpressionAttributeNames:{"#typeA": "type"},
      ExpressionAttributeValues: {":typeB": 'aktion'}
  };

  var docClient = new AWS.DynamoDB.DocumentClient();
  docClient.query(queryAlleAktionenParams, function(err, data) {
    if (err) console.error("Error when querying items: ", JSON.stringify(err, null, 2));
    else contextSucceed(data);
  });
}

naechsteAktionIntent = (event, context) => {
  var queryResult = (event.session.attributes === undefined || event.session.attributes.queryResult === undefined ? null : event.session.attributes.queryResult);

  var contextSucceed = (data) => {
    var itemNummer = (event.session.attributes === undefined || event.session.attributes.itemNummer === undefined ? 0 : event.session.attributes.itemNummer);
    var speechResponse;
    if (itemNummer === 0) {
        speechResponse = 'Ella sagt Du könntest ...';
    } else {
        speechResponse = '';
    }
    speechResponse = speechResponse.concat(data.Items[itemNummer].title);
    itemNummer = itemNummer + 1;
    context.succeed(generateResponse({ itemNummer: itemNummer, lastIntent: 'naechsteAktionIntent' }, speechResponse, false));
  };

  var queryAlleAktionenParams = {
      TableName : "Aktionen",
      KeyConditionExpression: "#typeA = :typeB",
      ExpressionAttributeNames:{"#typeA": "type"},
      ExpressionAttributeValues: {":typeB": 'aktion'}
  };

  if (queryResult === null) {
    var docClient = new AWS.DynamoDB.DocumentClient();
    docClient.query(queryAlleAktionenParams, function(err, data) {
      if (err) console.error("Error when querying items: ", JSON.stringify(err, null, 2));
      else contextSucceed(data);
    });
  } else {
    contextSucceed(queryResult);
  }
}

listeTermineIntent = (event, context) => {
  var contextSucceed = (data) => {
    var speechResponse = 'Ella sagt Deine nächsten Termine sind ...';
    var termine = data.Items;
    termine.sort(function(a, b) { return Number(a.date) - Number(b.date) } );
    termine.forEach(function(item) {
      var dateNow = new Date();
      var yyyy = dateNow.getFullYear();
      var mm = dateNow.getMonth()+1; // getMonth() is zero-based
      var dd  = dateNow.getDate();
      var hh  = dateNow.getHours();
      var ii  = dateNow.getMinutes();
      var yyyymmddhhmmss = String(100000000*yyyy + 1000000*mm + 10000*dd + 100*hh + ii); // Leading zeros for mm and dd
      if (item.date > yyyymmddhhmmss && item.title.substr(0,1) != '_') {
        speechResponse = speechResponse.concat(" " + item.weekday + " " + item.time + " " + item.title + " ... ");
      }
    });
    context.succeed(generateResponse({ lastIntent: 'listeTermineIntent' }, speechResponse, true));
  };

  var queryAlleTermineParams = {
      TableName : "Termine",
      KeyConditionExpression: "#typeA = :typeB",
      ExpressionAttributeNames:{"#typeA": "type"},
      ExpressionAttributeValues: {":typeB": 'termin'}
  };

  var docClient = new AWS.DynamoDB.DocumentClient();
  docClient.query(queryAlleTermineParams, function(err, data) {
    if (err) console.error("Error when querying items: ", JSON.stringify(err, null, 2));
    else contextSucceed(data);
  });
}

naechsteVokabelIntent = (event, context) => {
  var queryResult = (event.session.attributes === undefined || event.session.attributes.queryResult === undefined ? null : event.session.attributes.queryResult);

  var contextSucceed = (data) => {
    var itemNummer = (event.session.attributes === undefined || event.session.attributes.itemNummer === undefined ? 0 : event.session.attributes.itemNummer);
    var speechResponse;
    if (itemNummer === 0) {
        speechResponse = 'Ella kennt folgende Vokabel ...';
    } else {
        speechResponse = '';
    }
    speechResponse = speechResponse.concat(" " + data.Items[itemNummer].latin + " bedeutet " + data.Items[itemNummer].german + " ... ");
    itemNummer = itemNummer + 1;
    context.succeed(generateResponse({ itemNummer: itemNummer, lastIntent: 'naechsteVokabelIntent' }, speechResponse, false));
  };

  var queryAlleVokabelnParams = {
      TableName : "Vokabeln",
      KeyConditionExpression: "#typeA = :typeB",
      ExpressionAttributeNames:{"#typeA": "type"},
      ExpressionAttributeValues: {":typeB": 'vokabel'}
  };

  if (queryResult === null) {
    var docClient = new AWS.DynamoDB.DocumentClient();
    docClient.query(queryAlleVokabelnParams, function(err, data) {
      if (err) console.error("Error when querying items: ", JSON.stringify(err, null, 2));
      else contextSucceed(data);
    });
  } else {
    contextSucceed(queryResult);
  }
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
