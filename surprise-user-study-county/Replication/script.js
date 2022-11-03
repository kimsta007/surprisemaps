let data, geoData, popn, checkData, xd, geojson;
let population = {}, surpriseData = [], checkSurprise = [], dataColumn = []
let mean, stddev

//Wolfram integrate (Power[e,-Power[x,2]/2])/Sqrt[2π] from 0 to 1.436817133952481   7742420276

var erfc = function(x) {
    var z = Math.abs(x);
    var t = 1 / (1 + z / 2);
    var r = t * Math.exp(-z * z - 1.26551223 + t * (1.00002368 +
            t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 +
            t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 +
            t * (-0.82215223 + t * 0.17087277)))))))))
    return x >= 0 ? r : 2 - r;
  };

  var cdf = function(x) {
    return (0.5 * erfc(-(x / Math.sqrt(2)))) - 0.5;
  }

function getdata(){
	Promise.all([d3.json('counties.json'), d3.json('unemployment.json')]).then(cleanupData);
}

function cleanupData(dte){
	geoData = dte[0];
	xd = dte[1]
	for (let iter = 0; iter < 3188; iter++) {
		if (!isNaN(+xd.objects.counties.geometries[iter].properties["Unemployment Rate"]))
			dataColumn.push(+xd.objects.counties.geometries[iter].properties["Unemployment Rate"])
	}
	mean = math.mean(dataColumn)
	stddev = math.std(dataColumn)
	makeMaps();
}

function makeMaps(){
    calcSurprise();
	drawGraph();
}

function getCountyByFips(fips) {
		for (let iter = 0; iter < data.length; iter++) {
			if (+data[iter].fips == fips){
				return iter;
			}
		}
}

function getToolTipData(fips){
	for(let iter=0; iter< 3188; iter++){
		if(+xd.objects.counties.geometries[iter].properties.id == fips)
			return [+xd.objects.counties.geometries[iter].properties["Unemployment Rate"], +xd.objects.counties.geometries[iter].properties["SignedSurprise"], +xd.objects.counties.geometries[iter].properties["Population"], xd.objects.counties.geometries[iter].properties["Geography"]]
	}
}

function calcSurprise(){
  let pMs = [0.5];
  let pDMs = [];
  let pMDs = [];
  let kl;
  let diffs = [0];
  let s = 0;
  let pSum = 0;
  let pSMs = [];

  //Estimate P(D|M) 
  //De Moivres

  let zscore
  for (let iter = 0; iter < 3188; iter++) {
	  if (+xd.objects.counties.geometries[iter].properties["Unemployment Rate"] != 0){
		 s = ((+xd.objects.counties.geometries[iter].properties["Unemployment Rate"]) - mean) / (stddev / (Math.sqrt(+xd.objects.counties.geometries[iter].properties["Population Percent"]))); //Z-Score
		  pSMs.push(1 - (2 * cdf(Math.abs(s)))); //Liklehood
	  } else {
	      pSMs.push(0);
	  }  
  }

    //Calculate per state surprise
    for (let iter = 0; iter < 3188; iter++) {
	  if ((+xd.objects.counties.geometries[iter].properties["Unemployment Rate"] == 0) || (+xd.objects.counties.geometries[iter].properties["Population Percent"] == undefined)) {
			surpriseData.push({fips : +xd.objects.counties.geometries[iter].properties.id, surprise: 0})	
	  } else {
		  diffs[0] = (+xd.objects.counties.geometries[iter].properties["Unemployment Rate"]) - mean;
		  //Estimate P(M|D)
		  //De' moivres
		  pMDs[0] = 0.5 * pSMs[iter];

		  // Surprise is the sum of KL divergance across model space
		  // Each model also gets a weighted "vote" on what the sign should be
		  kl = 0;
		  let voteSum = 0;
		  kl += +pMDs[0] * (Math.log( +pMDs[0] / +pMs[0]) / Math.log(2));
		  if (Number.isNaN(kl)){
			surpriseData.push({fips : +xd.objects.counties.geometries[iter].properties.id, surprise: 0})	
		  } else {
			voteSum += diffs[0] * pMs[0];
			let surprise = voteSum >= 0 ? +Math.abs(kl) : -1* +Math.abs(kl);
			checkSurprise.push(+surprise); 
		    surpriseData.push({fips : +xd.objects.counties.geometries[iter].properties.id, surprise: +surprise})			
	  }}
    }
}

function setSurprise(){
	for (var x = 0; x < 3188; x++){
		for (var y = 0; y < 3142; y++){
			if (surpriseData[x].fips == geojson.features[y].id){
				geojson.features[y].properties["Surprise"] = surpriseData[x].surprise
			}
		}
	}
	geojson.features[1935].properties["Surprise"] = 0
	geojson.features[154].properties["Surprise"] = 0
}

function drawGraph() {
	var colorScale = d3.scaleQuantile()
						.domain([-0.114,0.114])
						.range(colorbrewer.RdBu[11].reverse());

	const width = 950;
	const height = 600;
	
	let section = d3.select("body")
		.append("section")

	let svg = section
		.append("svg")
			.attr("width", width)
			.attr("height", height)

	//DRAWING COUNTIES
    geojson = topojson.feature(geoData, geoData.objects.counties)
    setSurprise()
	let path = d3.geoPath();
	svg.selectAll("path")
		.data(geojson.features)
		.enter()
		.append("path")
			.attr("d", path)
			.attr("class", "county")
			.attr("stroke", "#FFF")
			.attr("stroke-width", .3)
			.attr("fill", function(d) {
				return colorScale(+d.properties.Surprise)
			})
			.attr("data-fips", (d) => d.id)
			.attr("data-vaccinations", (d) => +d.properties.Surprise)
			.on("mouseover", handleMouseOver)
			.on("mosemove", handleMouseMove)
			.on("mouseout", handleMouseOut)

	let tooltip = d3.select("body")
		.append("div")
			.style("opacity", 0)
			.attr("class", "tooltip")
			.attr("id", "tooltip")
			.style("position", "absolute")
			.style("background-color", '#FFF')
			.style("color", "black")
			.style("padding", "10px")
			.style("text-align", "left")
			.style("font-size","9px")
			.style("border-radius", "1%")

	function handleMouseMove(el) {
		tooltip
				.style("left", d3.event.pageX + 10 + "px")
				.style("top", d3.event.pageY + 10 + "px")
	}

	function handleMouseOver(el) {
		tooltipdata = getToolTipData(el.id)
		tooltip
				.transition()
				.style("opacity", 1)

		tooltip
				.style("left", d3.event.pageX + 10 + "px")
				.style("top", d3.event.pageY + 10 + "px")
				.attr("data-vaccinations", `${tooltipdata[0]}`)
				.html(function(){
						return `<b><p style="text-align: left; margin: 0px; padding: 0px; background-color: white;">${tooltipdata[3]}</p></b>
					<table style="width: 100%; margin-top: 0px; padding: 0px;"><tr style="border-bottom: 0.8px solid black;"><td>Rate</td><td>Surprise</td><td>Popn</td></tr><tr><td style="font-size: 12px;">${tooltipdata[0]}</td><td style="font-size: 12px;">${tooltipdata[1]}</td><td style="font-size: 12px;">${tooltipdata[2]}</td></tr></table>`
				})
	}

	function handleMouseOut(el) {
		tooltip
				.transition()
				.style("opacity", 0)
		tooltip
				.style("left", "-1000px")  
				.style("top", "-1000px")  
	}

	//DRAWING BORDERS
  let borders = svg.append("path")
	  	.classed("stateBorder", true)
	  	.attr("fill", "none")
	  	.attr("stroke", "black")
    .datum(topojson.mesh(geoData, geoData.objects.states), (a, b) => a !== b)
    	.attr('d', path)

	
	// START LEGEND
	const legendWidth = 300;
	const legendHeight = 10;
	const legendBarLength = legendWidth / 11

	let legend = svg
		.append("g")
			.attr("id", "legend")

	let legendScale = d3.scaleLinear()
		.domain([-0.114, 0.114])
		.rangeRound([0, legendWidth])

	let legendAxis = d3.axisTop(legendScale)
		  .tickSize(5)
		  .tickSizeOuter(0)
		  .tickFormat(x => `${x.toFixed(3)}`)
		  .tickValues([-0.114,0.114]);

	let colorRange = colorScale
		.range()
	  .map(d => {
	    let inverted = colorScale.invertExtent(d);
	    if (inverted[0] === undefined) {inverted[0] = legendScale.domain()[0];}
	    if (inverted[1] === undefined) {inverted[1] = legendScale.domain()[1];}
	    return inverted;
			});


	let legendColors = legend
		.selectAll("rect")
		.data(colorRange)
		.enter()
		.append("rect")
			.attr("transform", `translate(${width*0.65},30)`)
			.attr("height", 10)
			.attr("width", legendBarLength)
			.attr("x", (d,i) => i*legendBarLength)
			.attr("fill", (d) => colorScale(d[0]))

	function removeLegendDomain(el) {
		el.select(".domain").remove()
	}

	let legendTicks = legend.append("g")
			.attr("id", "legendAxis")
			.attr("transform", `translate(${width*0.65},30)`)
		.call(legendAxis)
		.call(removeLegendDomain)
}