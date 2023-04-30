const express = require('express')
const admin = require('firebase-admin')
const serviceAccount = require("./serviceAccountKey.json");
const cors = require('cors')

const app = express()
app.use(cors())

var reqChecker = 0;

app.use( express.urlencoded({ extended:true }) )
app.use(express.json({limit: '3mb'}))


// Initialize the app with a service account, granting admin privileges
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://bayesian-surprise-default-rtdb.firebaseio.com"
});

// As an admin, the app has access to read and write all data, regardless of Security Rules
let db = admin.database();

app.post('/dbdata', (request, response) => {
	sendData(request.body.url, request.body.identify, request.body.explore, request.body.iLog, request.body.eLog, request.body.cLog, request.body.dData, request.body.feedback)
})

app.post('/', (request, response) => {
	response.writeHead(200, "OK", {'Content-Type': 'text/plain' });
	response.end(JSON.stringify(reqChecker++))
})

app.post('/consent', (request, response) => {
	reqChecker = 2;   
	if (reqChecker === 2) { //Surprise
		response.redirect('http://proanalytics.co.uk/surprise/html/intro.html?type=1');
	} else if (reqChecker === 1) { //Choropleth
		response.redirect('http://proanalytics.co.uk/surprise/html/intro.html?type=2');
	} else {
		response.redirect('http://proanalytics.co.uk/vsup/html/intro.html');
	}
})

app.use(express.static('../'))

server = app.listen(3000, () => {console.log("server is listening on port", server.address().port);
})

function sendData(url, identify, explore, iLog, eLog, cLog, dData, feedback){
	db.ref(url).set({
		'identify': identify,
		'explore': explore,
		'identifyLog': iLog,
		'exploreLog': eLog,
		'clickLog': cLog,
		'diagnosticData': dData,
		'feedback': feedback,
	})
}
