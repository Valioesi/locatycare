# Locatycare

## Description
This project was created as part of the class "Smart Home Praktikum" at the Hochschule der Medien in Stuttgart.<br>
It is an indoor positioning solution using raspberry pis to locate items (equipped with a bluetooth chip from XYFindables) through triangulation. The user interaction works via Alexa (we used an Echo Dot) to provide natural language interaction. Alexa is simply asked: "Ask locatycare: Where are my keys?". The answer is something along the lines of "Your keys are lying on the desk."<br>
The project furthermore includes OpenHab integration to speak to Phillips Hue lightbulbs and Sonos speakers to give visual feedback at the found location. 

Preview Video: https://www.youtube.com/watch?v=LOTpqGx3j2U
<br><br>
## Structure of repository
The repository consists of different parts, which are essential for the project. <br>
The folder piScripts contains two node scripts, which are run on the raspberry pis, to collect bluetooth rssi data to predict the location of the searched for item. <br>
The folder webserver contains the REST API, which is called by the raspberry pi scripts and contains the server logic to store the data in a Postgresql database. The code for the webserver is based on a different project (https://github.com/sana-malik/CatGear).<br>
To see further information about the server code look at the Readme in the webserver folder.