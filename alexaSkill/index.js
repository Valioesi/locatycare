// Derived from Amazon Node.js Alexa Color Sample Skill

'use strict';
let http = require('http');
let ec2 = "ec2-54-77-55-113.eu-west-1.compute.amazonaws.com";
/**
 * This is based on the Color Example of Alexa Skills Kit api.

 */


// --------------- Helpers that build all of the responses -----------------------

function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: 'PlainText',
            text: output,
        },
        card: {
            type: 'Simple',
            title: `SessionSpeechlet - ${title}`,
            content: `SessionSpeechlet - ${output}`,
        },
        reprompt: {
            outputSpeech: {
                type: 'PlainText',
                text: repromptText,
            },
        },
        shouldEndSession,
    };
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: '1.0',
        sessionAttributes,
        response: speechletResponse,
    };
}


// --------------- Functions that control the skill's behavior -----------------------
// user for standard Alexa Intent not called.
function getHelpResponse(callback) {
    // If we wanted to initialize the session to have some attributes we could add those here.
    const sessionAttributes = {};
    const cardTitle = 'Welcome';
    const speechOutput = 'Willkommen zu Locaty Care ' +
        'Frag einfach nach deinen Gegenständen und dir finden sie für dich';
    // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.
    const repromptText = 'Find deine Gegenstände mit ' +
        'wo ist mein Schlüssel';
    const shouldEndSession = true;

    callback(sessionAttributes,
        buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}
// not called
function handleSessionEndRequest(callback) {
    const cardTitle = 'Session Ended';
    const speechOutput = 'Bye.';
    // Setting this to true ends the session and exits the skill.
    const shouldEndSession = true;

    callback({}, buildSpeechletResponse(cardTitle, speechOutput, null, shouldEndSession));
}

//Called when intent locateThing is recognized. calls server to get location. 
function locateIntent(intent, session, callback){
    let locationOfIntent;
    const repromptText = '';
    const sessionAttributes = {};
    let shouldEndSession = false;
    let speechOutput = '';
    

    // get location  from server
    var options = {
        host: ec2,
        port: 3000,
        path: `/predict?search=${intent.slots.Thing.value.toLowerCase()}`
    };
    console.log('before REQ')
    http.request(options, function(response) {
        console.log(response.statusCode)   
        let body = '';

        response.on('data', function(chunk){
            body += chunk;
            console.log('data')
        });

        response.on('end', function(){            
            if(response.statusCode===200){
                //location found for thing
                let json = JSON.parse(body);
                console.log("answer: ",json)
                locationOfIntent = json.location
                speechOutput = `Dein ${intent.slots.Thing.value} liegt beim ${locationOfIntent}.`;
                shouldEndSession = true;
            }else if(response.statusCode===404){
                 //returned if thing is not tracked
                 speechOutput = "Dein "+ intent.slots.Thing.value +" wird gerade noch nicht geortet. Um das Gerät zu Orten wende dich an den Support.";
                 shouldEndSession = true;
            }else {
                //any ohter error
                speechOutput = "Wir können dein "+ intent.slots.Thing.value +" gerade nicht finden. Frag später nochmal!";
                 shouldEndSession = true;
            }
            callback(sessionAttributes,
                buildSpeechletResponse(intent.name, speechOutput, repromptText, shouldEndSession));
        });

        
    }).end();
}

//react to set user 
function userIntent(intent, session, callback){
    let locationOfIntent;
    const repromptText = '';
    const sessionAttributes = {};
    let shouldEndSession = false;
    let speechOutput = '';
    
    var options = {
        host: ec2,
        port: 3000,
        path: `/registerUser?name=${intent.slots.User.value.toLowerCase()}`
    };
    //set user on the Server
    //users hard coded for now 
    http.request(options, function(response) {
        console.log(response.statusCode)   
        let body = '';

        response.on('data', function(chunk){
            body += chunk;
        });

        response.on('end', function(){
            console.log("answer: ",body)
            
            if(response.statusCode===200){
                if(intent.slots.User.value.toLowerCase()==="traussen"){
                     speechOutput = `Hallo Herr Draussen!`;//Traussen would be spelled strange
                }else if(intent.slots.User.value.toLowerCase()==="ostegaard"){
                     speechOutput = `Hallo Frau ${intent.slots.User.value}!`;
                }else{
                    speechOutput = `Hallo! Leider kennen wir dich noch nicht.`
                }
                shouldEndSession = true;
            }else{
                speechOutput = "Wir können dein Benutzer gerade nicht einloggen oder finden. Frag später nochmal!";
                shouldEndSession = true;
            }
            callback(sessionAttributes,
                buildSpeechletResponse(intent.name, speechOutput, repromptText, shouldEndSession));
        });
        response.on('error', function(){
            let json = JSON.parse(body);
            console.log("answer: ",json)
            speechOutput = "Wir sind gerade offline. Sorry!";
            callback(sessionAttributes,
                buildSpeechletResponse(intent.name, speechOutput, repromptText, shouldEndSession));
        });
        
    }).end();
}


// --------------- Events -----------------------

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
    console.log(`onSessionStarted requestId=${sessionStartedRequest.requestId}, sessionId=${session.sessionId}`);
}

/**
 * Called when the user launches the skill without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
    console.log(`onLaunch requestId=${launchRequest.requestId}, sessionId=${session.sessionId}`);
}

/**
 * Called when the user specifies an intent for this skill.
 */
function onIntent(intentRequest, session, callback) {
    console.log(`onIntent requestId=${intentRequest.requestId}, sessionId=${session.sessionId}`);

    const intent = intentRequest.intent;
    const intentName = intentRequest.intent.name;

    // Dispatch to your skill's intent handlers
    if (intentName === 'FindThing') {
        locateIntent(intent, session, callback);
    } else if (intentName==='SetUser'){
         userIntent(intent, session, callback);
    }
    else if (intentName === 'AMAZON.HelpIntent') {
        getHelpResponse(callback);
    } else if (intentName === 'AMAZON.StopIntent' || intentName === 'AMAZON.CancelIntent') {
        handleSessionEndRequest(callback);
    } else {
        throw new Error('Invalid intent');
    }
}

/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {
    console.log(`onSessionEnded requestId=${sessionEndedRequest.requestId}, sessionId=${session.sessionId}`);
    // Add cleanup logic here
}


// --------------- Main handler -----------------------

// Route the incoming request based on type (LaunchRequest, IntentRequest,
// etc.) The JSON body of the request is provided in the event parameter.
exports.handler = (event, context, callback) => {
    try {
        console.log(`event.session.application.applicationId=${event.session.application.applicationId}`);

        if (event.session.new) {
            onSessionStarted({ requestId: event.request.requestId }, event.session);
        }

        if (event.request.type === 'LaunchRequest') {
            onLaunch(event.request,
                event.session,
                (sessionAttributes, speechletResponse) => {
                    callback(null, buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === 'IntentRequest') {
            onIntent(event.request,
                event.session,
                (sessionAttributes, speechletResponse) => {
                    callback(null, buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === 'SessionEndedRequest') {
            onSessionEnded(event.request, event.session);
            callback();
        }
    } catch (err) {
        callback(err);
    }
};
