const express = require('express')
const gaussian = require('gaussian')

const app = express()
app.use( express.urlencoded({ extended:true }) )
app.use(express.json({limit: '1mb'}))
app.post('/', (request, response) => {
	response.json({'pval': calcCdf(+request.body.mean, +request.body.variance, +request.body.dval)})
})

app.use(express.static('Surprise Research/Replication X')) 
server = app.listen(3000, () => {console.log("server is listening on port", server.address().port);
})

function calcCdf(mean, variance, dval){
	var distro = gaussian(mean, variance)
	return distro.cdf(dval) - 0.5
}	