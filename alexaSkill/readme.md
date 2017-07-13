## Alexa Skill
The required information for the Alexa Skill.<br>

The intentSchema.json Contains all the required configuration of the Skill.<br>

Possible Intents are `SetUser` and `FindThing` <br>
Possible Values are `LIST_OF_THINGS`and `LIST_OF_USERS` <br> *(Items that alexa understands better when being asked for them)*

index.js is run as AWS Lambda function.