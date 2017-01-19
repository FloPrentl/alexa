var https = require('https');
var AWS = require('aws-sdk');

exports.handler = (event, context, callback) => {
  try {
    //if (event.session.new) {
      //console.log("event.session.new");
    //}

    switch (event.request.type) {
      case "LaunchRequest":
        callback(null, generateResponse({}, "Ella fragt womit sie helfen kann.", true));
        break;

      case "IntentRequest":
        console.log(event.request.intent.name);
        var lastIntent;
        switch(event.request.intent.name) {
            case "RichtigIntent":
                lastIntent = (event.session.attributes === undefined || event.session.attributes.lastIntent === undefined ? null : event.session.attributes.lastIntent);
                switch(lastIntent) {
                    case "naechsteVokabelIntent":
                      naechsteVokabelIntent(event, context, callback, 1);
                      break;
                default:
                    callback(null, generateResponse({}, "<speak>Es gab keinen vorherigen Intent der 'Richtig' unterstützt.</speak>", true));
            }
            break;
            case "FalschIntent":
                lastIntent = (event.session.attributes === undefined || event.session.attributes.lastIntent === undefined ? null : event.session.attributes.lastIntent);
                switch(lastIntent) {
                    case "naechsteVokabelIntent":
                      naechsteVokabelIntent(event, context, callback, 0);
                      break;
                default:
                    callback(null, generateResponse({}, "<speak>Es gab keinen vorherigen Intent der 'Falsch' unterstützt.</speak>", true));
            }
            break;
          case "WeiterIntent":
            lastIntent = (event.session.attributes === undefined || event.session.attributes.lastIntent === undefined ? null : event.session.attributes.lastIntent);
            switch(lastIntent) {
              case "naechsteAktionIntent":
                naechsteAktionIntent(event, context);
                break;
              case "naechsteVokabelIntent":
                naechsteVokabelIntent(event, context, callback, null);
                break;
              default:
                callback(null, generateResponse({}, "<speak>Es gab keinen vorherigen Intent der 'Weiter' unterstützt.</speak>", true));
            }
            break;

          case "ListeAktionenIntent":
            listeAktionenIntent(event, context, callback);
            break;

          case "NaechsteAktionIntent":
            naechsteAktionIntent(event, context, callback);
            break;

          case "ListeTermineIntent":
            listeTermineIntent(event, context, callback);
            break;

          case "NaechsteVokabelIntent":
            naechsteVokabelIntent(event, context, callback, null);
            break;

          case "ListeLeuteIntent":
            listeLeuteIntent(event, context, callback);
            break;

          case "BeendeSessionIntent":
            callback(null, generateResponse({}, "<speak>Gerne.</speak>", true));
            break;

          default:
            callback(null, generateResponse({}, "<speak>Für den Intent '" + event.request.intent.name + "' ist keine Funktionalität implementiert.</speak>", true));
        }
        break;

      case "SessionEndedRequest":
        callback(null, generateResponse({}, "<speak>Gerne.</speak>", true));
        break;

      default:
        callback(null, generateResponse({}, "<speak>Den Request Type '" + event.request.type + "' gibt es nicht.</speak>", true));
    }
  } catch(error) {
    console.error(error);
    callback(null, generateResponse({}, "<speak>Es ist ein Fehler aufgetreten.</speak>", true));
  }
};

listeAktionenIntent = (event, context, callback) => {
  var queryAlleAktionenParams = {
      TableName : "Aktionen",
      KeyConditionExpression: "#typeA = :typeB",
      ExpressionAttributeNames:{"#typeA": "type"},
      ExpressionAttributeValues: {":typeB": 'aktion'}
  };
  var docClient = new AWS.DynamoDB.DocumentClient();
  docClient.query(queryAlleAktionenParams, function(err, data) {
    if (err) {
      console.error("Error when querying items: ", JSON.stringify(err, null, 2));
      callback(null, generateResponse({}, "Fehler beim Laden von Aktionen.", true));
    } else {
      var speechResponse = 'Ella sagt Du könntest ...';
      data.Items.forEach(function(item) {
          speechResponse = speechResponse.concat(" " + item.title + " <break time='3s'/>");
      });
      callback(null, generateResponse({ lastIntent: 'listeAktionenIntent' }, speechResponse, true));
    }
  });
};

naechsteAktionIntent = (event, context, callback) => {
  var queryResult = (event.session.attributes === undefined || event.session.attributes.queryResult === undefined ? null : event.session.attributes.queryResult);

  var processQueryResult = (data, callback) => {
    var itemNummer = (event.session.attributes === undefined || event.session.attributes.itemNummer === undefined ? 0 : event.session.attributes.itemNummer);
    var speechResponse;
    if (itemNummer === 0) {
        speechResponse = 'Ella sagt Du könntest ...';
    } else {
        speechResponse = '';
    }
    speechResponse = speechResponse.concat(data.Items[itemNummer].title);
    itemNummer = itemNummer + 1;
    speechResponse = "<speak>".concat(speechResponse).concat("</speak>");
    callback(null, generateResponse({ itemNummer: itemNummer, lastIntent: 'naechsteAktionIntent' }, speechResponse, false));
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
      if (err) {
        console.error("Error when querying items: ", JSON.stringify(err, null, 2));
        callback(null, generateResponse({}, "Fehler beim Laden von Akionen.", true));
      } else {
        processQueryResult(data);
      }
    });
  } else {
    processQueryResult(queryResult);
  }
};

listeTermineIntent = (event, context, callback) => {
  var queryAlleTermineParams = {
      TableName : "Termine",
      KeyConditionExpression: "#typeA = :typeB",
      ExpressionAttributeNames:{"#typeA": "type"},
      ExpressionAttributeValues: {":typeB": 'termin'}
  };
  var docClient = new AWS.DynamoDB.DocumentClient();
  docClient.query(queryAlleTermineParams, function(err, data) {
    if (err) {
      console.error("Error when querying items: ", JSON.stringify(err, null, 2));
      callback(null, generateResponse({}, "Fehler beim Laden von Terminen.", true));
    } else {
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
          speechResponse = speechResponse.concat(" " + item.weekday + " " + item.time + " " + item.title + "<break time='3s'/>");
        }
      });
      speechResponse = "<speak>".concat(speechResponse).concat("</speak>");
      callback(null, generateResponse({ lastIntent: 'listeTermineIntent' }, speechResponse, true));
    }
  });
};

naechsteVokabelIntent = (event, context, callback, correct) => {
  var docClient = new AWS.DynamoDB.DocumentClient();
  if (correct != null) {
    var lastWord = (event.session.attributes === undefined || event.session.attributes.lastWord === undefined ? null : event.session.attributes.lastWord);
    if (lastWord != null && correct == 1) {
      console.log("last word was: " + lastWord);
      var params = { TableName : 'Vokabeln', Key: { type: 'vokabel', id: lastWord } };
      docClient.get(params, function(err, data) {
        if (err) {
          console.error("Error when getting item: ", JSON.stringify(err, null, 2));
        } else {
          console.log("Success when getting item: ", JSON.stringify(data, null, 2));

          if (data.Item.known === null) {
            data.Item.known = "1";
          } else {
            data.Item.known = String(Number(data.Item.known) + 1);
          }
          var params = {
             TableName: "Vokabeln",
             Item: data.Item
          };
          console.log("increasing " + data.Item.latin);
          docClient.put(params, function(err, data) {
              if (err) {
                  console.error("Error when putting item: ", JSON.stringify(err, null, 2));
              } else {
                  console.log("Success when putting item: ", JSON.stringify(data, null, 2));
              }
          });
        }
      });
    }
  }

  var queryResult = (event.session.attributes === undefined || event.session.attributes.queryResult === undefined ? null : event.session.attributes.queryResult);

  var processQueryResult = (data, callback) => {
    var itemNummer = (event.session.attributes === undefined || event.session.attributes.itemNummer === undefined ? 0 : event.session.attributes.itemNummer);
    var speechResponse;
    if (itemNummer === 0) {
        speechResponse = 'Ella fragt folgenden Vokabeln: ';
    } else {
        speechResponse = '';
    }
    speechResponse = speechResponse.concat(" " + data.Items[itemNummer].latin + "<break time='3s'/>" + data.Items[itemNummer].german + " ... ");
    itemNummer = itemNummer + 1;
    speechResponse = "<speak>".concat(speechResponse).concat("</speak>");
    callback(null, generateResponse({ queryResult: data, itemNummer: itemNummer, lastIntent: 'naechsteVokabelIntent', lastWord: data.Items[itemNummer - 1].id }, speechResponse, false));
  };

  var queryAlleVokabelnParams = {
      TableName : "Vokabeln",
      KeyConditionExpression: "#typeA = :typeB",
      ExpressionAttributeNames:{"#typeA": "type"},
      ExpressionAttributeValues: {":typeB": 'vokabel'}
  };

  if (queryResult === null) {
    docClient.query(queryAlleVokabelnParams, function(err, data) {
      if (err) {
        console.error("Error when querying items: ", JSON.stringify(err, null, 2));
        callback(null, generateResponse({}, "Fehler beim Laden von Vokabeln.", true));
      } else {
        data.Items.sort( function(a, b) {return a.known - b.known} );
        processQueryResult(data, callback);
      }
    });
  } else {
    processQueryResult(queryResult, callback);
  }
};

generateResponse = (sessionAttributes, text, shouldEndSession) => {
  return {
    version: "1.0",
    sessionAttributes: sessionAttributes,
    response: {
      outputSpeech: {
        type: "SSML",
        ssml: text
      },
      shouldEndSession: shouldEndSession
    }
  }
};

listeLeuteIntent = (event, context, callback) => {
  var speechResponse = 'Hier die Liste der Leute: ...';
  var leute = ["Onkel Werner", "Eddie Kopp", "Marcus Lanzl", "Kati Prentl", "Sonja James", "Christian Steiner", "Sebastian Adam"];
  leute.forEach(function(item) {
      speechResponse = speechResponse.concat(item + " <break time='2s'/>");
  });
  speechResponse = "<speak>".concat(speechResponse).concat("</speak>");  
  callback(null, generateResponse({ lastIntent: 'listeLeuteIntent' }, speechResponse, true));
};
