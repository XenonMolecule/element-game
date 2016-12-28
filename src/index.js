'use strict';

var elements = [
  ["Actinium","Aluminum","Americium","Antimony","Argon","Arsenic","Astatine"],
  ["Barium","Berkelium","Beryllium","Bismuth","Bohrium","Boron","Bromine"],
  ["Cadmium","Calcium","Californium","Carbon","Cerium","Cesium","Chlorine","Chromium","Cobalt","Copernicium","Copper","Curium"],
  ["Darmstadtium","Dubnium","Dysprosium"],
  ["Einsteinium","Erbium","Europium"],
  ["Fermium","Flerovium","Fluorine","Francium"],
  ["Gadolinium","Gallium","Germanium","Gold"],
  ["Hafnium","Hassium","Helium","Holmium","Hydrogen"],
  ["Indium","Iodine","Iridium","Iron"],
  [],               // There are no elements that start with "J"
  ["Krypton"],
  ["Lanthanum","Lawrencium","Lead","Lithium","Livermorium","Lutetium"],
  ["Magnesium","Manganese","Meitnerium","Mendelevium","Mercury","Molybdenum","Moscovium"],
  ["Neodymium","Neon","Neptunium","Nickel","Nihonium","Niobium","Nitrogen","Nobelium"],
  ["Oganesson","Osmium","Oxygen"],
  ["Palladium","Phosphorus","Platinum","Plutonium","Polonium","Potassium","Praseodymium","Promethium","Protactinium"],
  [],               // There are no elements that start with "Q"
  ["Radium","Radon","Rhenium","Rhodium","Roentgenium","Rubidium","Ruthenium","Rutherfordium"],
  ["Samarium","Scandium","Seaborgium","Selenium","Silicon","Silver","Sodium","Strontium","Sulfur"],
  ["Tantalum","Technetium","Tellurium","Tennessine","Terbium","Thallium","Thorium","Thulium","Tin","Titanium","Tungsten"],
  ["Uranium"],
  ["Vanadium"],
  [],               // There are no elements that start with "W"
  ["Xenon"],
  ["Ytterbium","Yttrium"],
  ["Zinc","Zirconium"]
];

// Route the incoming request based on type (LaunchRequest, IntentRequest,
// etc.) The JSON body of the request is provided in the event parameter.
exports.handler = function (event, context) {
    try {
        console.log("event.session.application.applicationId=" + event.session.application.applicationId);

        /**
         * Uncomment this if statement and populate with your skill's application ID to
         * prevent someone else from configuring a skill that sends requests to this function.
         */

//     if (event.session.application.applicationId !== "amzn1.echo-sdk-ams.app.05aecccb3-1461-48fb-a008-822ddrt6b516") {
//         context.fail("Invalid Application ID");
//      }

        if (event.session.new) {
            onSessionStarted({requestId: event.request.requestId}, event.session);
        }

        if (event.request.type === "LaunchRequest") {
            onLaunch(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "IntentRequest") {
            onIntent(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "SessionEndedRequest") {
            onSessionEnded(event.request, event.session);
            context.succeed();
        }
    } catch (e) {
        context.fail("Exception: " + e);
    }
};

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
    console.log("onSessionStarted requestId=" + sessionStartedRequest.requestId
        + ", sessionId=" + session.sessionId);

    // add any session init logic here
}

/**
 * Called when the user invokes the skill without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
    console.log("onLaunch requestId=" + launchRequest.requestId
        + ", sessionId=" + session.sessionId);

    getWelcomeResponse(callback);
}

/**
 * Called when the user specifies an intent for this skill.
 */
function onIntent(intentRequest, session, callback) {
    console.log("onIntent requestId=" + intentRequest.requestId
        + ", sessionId=" + session.sessionId);

    var intent = intentRequest.intent,
        intentName = intentRequest.intent.name;

    // handle yes/no intent after the user has been prompted
    if (session.attributes && session.attributes.userPromptedToContinue) {
        delete session.attributes.userPromptedToContinue;
        if ("AMAZON.NoIntent" === intentName) {
            handleFinishSessionRequest(intent, session, callback);
        } else if ("AMAZON.YesIntent" === intentName) {
            handleRepeatRequest(intent, session, callback);
        }
    }

    // dispatch custom intents to handlers here
    if ("AnswerIntent" === intentName) {
        handleAnswerRequest(intent, session, callback);
    } else if ("AnswerOnlyIntent" === intentName) {
        handleAnswerRequest(intent, session, callback);
    } else if ("DontKnowIntent" === intentName) {
        handleAnswerRequest(intent, session, callback);
    } else if ("AMAZON.YesIntent" === intentName) {
        handleAnswerRequest(intent, session, callback);
    } else if ("AMAZON.NoIntent" === intentName) {
        handleAnswerRequest(intent, session, callback);
    } else if ("AMAZON.StartOverIntent" === intentName) {
        getWelcomeResponse(callback);
    } else if ("AMAZON.RepeatIntent" === intentName) {
        handleRepeatRequest(intent, session, callback);
    } else if ("AMAZON.HelpIntent" === intentName) {
        handleGetHelpRequest(intent, session, callback);
    } else if ("AMAZON.StopIntent" === intentName) {
        handleFinishSessionRequest(intent, session, callback);
    } else if ("AMAZON.CancelIntent" === intentName) {
        handleFinishSessionRequest(intent, session, callback);
    } else {
        throw "Invalid intent";
    }
}

/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {
    console.log("onSessionEnded requestId=" + sessionEndedRequest.requestId
        + ", sessionId=" + session.sessionId);

    // Add any cleanup logic here
}

// ------- Skill specific business logic -------

var CARD_TITLE = "Element Game"; // Be sure to change this for your skill.

function getWelcomeResponse(callback) {
    //Setup variables and introduce the game to the user
    var sessionAttributes = {},
        speechOutput = "I will start by naming an element, and we will go back and forth naming " +
        "elements that start with the last letter of the previously named element.  For example " +
        "if I were to say Oxygen, you could say Nitrogen, because oxygen ends with the letter N." +
        "  Let's begin.",
        repromptText,
        shouldEndSession = false;

    // Pick the first letter to use for the first element
    var elementOpts = [];
    do {
      elementOpts = elements[Math.floor(Math.random()*26)]
      //repeat if there is no element of that first letter
    } while(elementOpts.length == 0)

    //choose the element
    repromptText = elementOpts[Math.floor(Math.random()*elementOpts.length)];
    speechOutput += "  How about " + repromptText + ".";

    sessionAttributes = {
        "speechOutput": repromptText,
        "repromptText": repromptText,
        "score": 0,
        "alexaElements": [repromptText],
        "yourElements": [],
        "lastElement" : repromptText
    };
    callback(sessionAttributes,
        buildSpeechletResponseWithoutCard(speechOutput, repromptText, shouldEndSession));
}

function handleAnswerRequest(intent, session, callback) {
    var speechOutput = "";
    var sessionAttributes = {};
    var gameInProgress = session.attributes && session.attributes.alexaElements;
    var validAnswer = isAnswerValidElement(intent);
    var userGaveUp = intent.name === "DontKnowIntent";
    var notRepeat = validAnswer && (isNewElement(session.attributes,intent.slots.Answer.value) === 0);
    var matchEndAndStart = validAnswer && (matchingLetters(session.attributes.lastElement,intent.slots.Answer.value));
    var reprompt = "";

    if (!gameInProgress) {
        // If the user responded with an answer but there is no game in progress, ask the user
        // if they want to start a new game. Set a flag to track that we've prompted the user.
        sessionAttributes.userPromptedToContinue = true;
        speechOutput = "There is no game in progress. Do you want to start a new game? ";
        callback(sessionAttributes,
            buildSpeechletResponseWithoutCard(speechOutput, speechOutput, false));
    } else if (!validAnswer && !userGaveUp) {
        // If the user provided answer isn't a valid element,
        // return an error message to the user. Remember to guide the user into providing correct values.
        reprompt = session.attributes.speechOutput;
        var speechOutput = "Your answer must be a valid element.  " + reprompt;
        callback(session.attributes,
            buildSpeechletResponseWithoutCard(speechOutput, reprompt, false));
    } else {
        var currentScore = parseInt(session.attributes.score),
            alexaElements = session.attributes.alexaElements,
            yourElements = session.attributes.yourElements,
            lastElement = session.attributes.lastElement;

        var speechOutputAnalysis = "";

        //check if the answer is an element, and it is not a repeat, and the first letter
        // is the same as the last letter of the past element
        if (validAnswer && notRepeat && matchEndAndStart) {
            currentScore++;
            var repromptText = "Good answer."
            yourElements.push(intent.slots.Answer.value);
            sessionAttributes = {
                "speechOutput": repromptText,
                "repromptText": repromptText,
                "score": currentScore,
                "alexaElements": alexaElements,
                "yourElements": yourElements,
                "lastElement" : lastElement
            };
            generateAlexaResponse(session.attributes, intent.slots.Answer.value, repromptText, sessionAttributes, callback);
        } else {
          var repromptText = "";
          // if they didn't give up it was a good try
          if(!userGaveUp){
            repromptText += "Good try";
          }

          // if it was a repeat, tell the user
          if(!notRepeat){
            repromptText += ", but";
            if(isNewElement(session.attributes,intent.slots.Answer.value)===1) {
              repromptText += " I ";
            } else {
              repromptText += " you ";
            }
            repromptText += "already said " + intent.slots.Answer.value+".";
            //if the end and start didn't match tell the user
          } else if(!matchEndAndStart) {
            repromptText += ", but the first letter of " + intent.slots.Answer.value +
            " is not the same as the last letter of " + lastElement + ".";
          }

          // if it was a repeat AND the endings don't match
          if(!matchEndAndStart && !notRepeat) {
            repromptText += "  Also, the first letter of " + intent.slots.Answer.value +
            " is not the same as the last letter of " + lastElement + ".";
           }

           repromptText += "  Good Game."

           sessionAttributes = {
               "speechOutput": repromptText,
               "repromptText": repromptText,
               "score": currentScore,
               "alexaElements": alexaElements,
               "yourElements": yourElements,
               "lastElement" : lastElement
           };

           // End the game
           callback(session.attributes,
               buildSpeechletResponseWithEndCard(CARD_TITLE, repromptText, "", true, session.attributes));

        }
    }
}

function handleRepeatRequest(intent, session, callback) {
    // Repeat the previous speechOutput and repromptText from the session attributes if available
    // else start a new game session
    if (!session.attributes || !session.attributes.speechOutput) {
        getWelcomeResponse(callback);
    } else {
        callback(session.attributes,
            buildSpeechletResponseWithoutCard(session.attributes.speechOutput, session.attributes.repromptText, false));
    }
}

function handleGetHelpRequest(intent, session, callback) {
    // Provide a help prompt for the user, explaining how the game is played. Then, continue the game
    // if there is one in progress, or provide the option to start another one.

    // Ensure that session.attributes has been initialized
    if (!session.attributes) {
        session.attributes = {};
    }

    // Set a flag to track that we're in the Help state.
    session.attributes.userPromptedToContinue = true;

    var speechOutput = "I will name an element. Respond with an element that has the same first letter "
        + "as the last letter of the element I said.  "
        + "For example, if I said Helium, you could say Magnesium, because Helium ends with an M, and "
        + "Magnesium starts with an M.  "
        + "To start a new game at any time, say, start game. "
        + "To repeat the last question, say, repeat. "
        + "Would you like to keep playing?",
        repromptText = "To give an element, respond with the name of the element.  "
        + "Would you like to keep playing?";
        var shouldEndSession = false;
    callback(session.attributes,
        buildSpeechletResponseWithoutCard(speechOutput, repromptText, shouldEndSession));
}

function handleFinishSessionRequest(intent, session, callback) {
    // End the session with a "Good bye!" if the user wants to quit the game
    callback(session.attributes,
        buildSpeechletResponseWithoutCard("Good bye!", "", true));
}

function isAnswerValidElement(intent) {
  var answerSlotFilled = intent.slots && intent.slots.Answer && intent.slots.Answer.value;
  var reformattedInput = answerSlotFilled ? intent.slots.Answer.value.toLowerCase().trim() : "";
  //Get the first letter of the element as a number, a is 97, but we want to shift it to zero
  var firstLetter = answerSlotFilled ? reformattedInput.charCodeAt(0)-97 : -1;
  if(answerSlotFilled){
    for(var i = 0; i < elements[firstLetter].length; i++){
      if(elements[firstLetter][i].trim().toLowerCase() == reformattedInput) {
        return true;
      }
    }
  }
  console.log(elements);
  return false;
}

// Returns 0 if element not said, 1 if alexa said it, -1 if user said it
// The parameter attributes should be session.attributes
// The parameter element should be the name of the element from the intent
function isNewElement(attributes, element){
  element = element.trim().toLowerCase();
  for(var i = 0; i < attributes.alexaElements.length; i ++){
    if(attributes.alexaElements[i].trim().toLowerCase() == element){
      return 1;
    }
  }
  for(var i = 0; i < attributes.yourElements.length; i ++){
    if(attributes.yourElements[i].trim().toLowerCase() == element){
      return -1;
    }
  }
  return 0;
}

// Returns true if the last letter of the old element is the same as
//   the first letter of the new element
function matchingLetters(oldElement, newElement){
  oldElement = oldElement.toLowerCase().trim();
  newElement = newElement.toLowerCase().trim();
  var lastChar = oldElement.charCodeAt(oldElement.length-1);
  var firstChar = newElement.charCodeAt(0);
  return lastChar === firstChar;
}

function generateAlexaResponse(attributes, element, speechOutput, newSessionAttributes, callback) {
  //get the last letter of the past element
  var letter = element.charCodeAt(element.length-1)-97;
  var elementOpts = elements[letter].slice(); // The element list is organized in alphabetical order
  var elementOpt = "";
  var length = elementOpts.length; // The length will change, but this variable will not
  //choose random element that fits the criteria of first letter matching the last letter of past element
  for(var i = 0; i < length; i++){
    var randomElemIndex = Math.floor(Math.random()*elementOpts.length);
    elementOpt = elementOpts[randomElemIndex];
    elementOpt = isNewElement(attributes,elementOpt)===0 ? elementOpt : "";
    if(elementOpt === "") {
      elementOpts.splice(randomElemIndex,1);
    } else {
      break;
    }
  }
  if(elementOpt === ""){
    // The user has won, there are no other options
    speechOutput += "  Wow I am stumped.  Good game.  You had a score of " + attributes.score + ".";
    callback(attributes,
        buildSpeechletResponseWithEndCard(CARD_TITLE, speechOutput, "", true, attributes));
  } else {
    // Send over the new element
    speechOutput += "  How about " + elementOpt + ".";
    var sessionAttributes = newSessionAttributes;
    sessionAttributes.speechOutput = speechOutput;
    sessionAttributes.repromptText = speechOutput;
    sessionAttributes.lastElement = elementOpt;
    sessionAttributes.alexaElements.push(elementOpt);
    callback(sessionAttributes,
        buildSpeechletResponseWithoutCard(speechOutput, "  How about " + elementOpt + ".", false));
  }

}

function getEndCardText(attributes) {
  var output = "";
  if(attributes.alexaElements.length > attributes.yourElements.length) {
    output += "You Lost!\n";
  } else {
    output += "You Won!\n";
  }
  output += "Good Game.  You had a score of " + attributes.score + ".\n";
  output += "\nLet's look at how the game went:\n";
  for(var i = 0; i < attributes.yourElements.length; i ++){
    output += "I said: " + attributes.alexaElements[i] + "\n";
    output += "You said: " + attributes.yourElements[i] + "\n";
  }
  if(attributes.alexaElements.length > attributes.yourElements.length) {
    output += "I said: " + attributes.alexaElements[attributes.alexaElements.length-1];
  }
  return output;
}

// ------- Helper functions to build responses -------


function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        card: {
            type: "Simple",
            title: title,
            content: output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildSpeechletResponseWithEndCard(title, output, repromptText, shouldEndSession, attributes){
  return {
      outputSpeech: {
          type: "PlainText",
          text: output
      },
      card: {
          type: "Simple",
          title: title,
          content: getEndCardText(attributes)
      },
      reprompt: {
          outputSpeech: {
              type: "PlainText",
              text: repromptText
          }
      },
      shouldEndSession: shouldEndSession
  };
}

function buildSpeechletResponseWithoutCard(output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: "1.0",
        sessionAttributes: sessionAttributes,
        response: speechletResponse
    };
}
