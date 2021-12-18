let data, geoData, popn, checkData, geojson;
let population = {}, surpriseData = [], checkSurprise = [];
let colorsLength = 11
let min, max = 0

	
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

function getdata(queryDate){
	$.ajax({
    url: "https://data.cdc.gov/resource/8xkx-amqh.json?date=" + queryDate,
    type: "GET",
    data: {
      "$limit" : 5000,
      "$$app_token" : "ztg2e75T7AHYY47YuxkzxhAxH"
    }
}).done(function(dtx) {
	data = dtx;
	Promise.all([d3.json('counties.json'), d3.csv('uspopn.csv')]).then(cleanupData);
});
document.getElementById("datePicker").remove()
document.getElementById("datePickerLabel").remove()	
}

function cleanupData(dte){
	for(let record in dte[1]){
	   popn = [];
	   popn.push(+dte[1][record].ppercentage);
	   population[+dte[1][record].fips] = popn;
	}
	for (let record in data){
		if (data[record].fips != "UNK"){		
			if (data[record].recip_state == "ID" || data[record].recip_state == "GA" || data[record].recip_state == "VT" || data[record].recip_state == "WV" || data[record].recip_state == "VA"){
				data[record].series_complete_pop_pct = 0
			}
			if (data[record].series_complete_pop_pct != 0) {
				data[record].population = +population[+data[record].fips];
				data[record].series_complete_pop_pct = +data[record].series_complete_pop_pct / 100;
			}
		}
	}
	geoData = dte[0];
	makeMaps();
}

function makeMaps(){
    calcSurprise();
	min = Math.min(...checkSurprise);
	max = Math.max(...checkSurprise);
	drawGraph();
}

function average(){
  let sum = 0;
  let n = 0;
  for (let iter = 0; iter < data.length; iter++) {
	 if(!Number.isNaN(+data[iter].series_complete_pop_pct)){
		sum += (+data[iter].series_complete_pop_pct);
		n++;
	 } 
  }
  return sum / n;
}

function sumU(){
  let sum = 0;
  for (let iter = 0; iter < data.length; iter++) {
	   if(!Number.isNaN(+data[iter].series_complete_pop_pct))
			sum+= (+data[iter].series_complete_pop_pct);
  }
  return sum;
}
  
function standardDeviation(avg){
  let sqSum = 0;
  for (let iter = 0; iter < data.length; iter++) {
	  if(!Number.isNaN(+data[iter].series_complete_pop_pct))
		sqSum += Math.abs(Math.pow(((+data[iter].series_complete_pop_pct) - avg), 2));
  }
  return Math.sqrt(sqSum / (data.length - 1));
}

function calcSurprise(){
  let pMs = [0.5];
  let pDMs = [];
  let pMDs = [];
  let avg, kl;
  let diffs = [0];
  let s = 0;
      avg = average();
  let pSum = 0;
  let pSMs = [];
      sd = standardDeviation(avg);
  //Estimate P(D|M) 
  //De Moivres
  for (let iter = 0; iter < data.length; iter++) {
	  if (+data[iter].series_complete_pop_pct != 0){
		  s = ((+data[iter].series_complete_pop_pct) - avg) / (sd / Math.sqrt(+data[iter].population)); //Z-Score
		  //s = ((jsonData[iter].series_complete_pop_pct) - avg) / sd;
		  pSMs.push(1 - (2 * cdf(Math.abs(s)))); //Liklehood
	  } else {
	      pSMs.push(0);
	  }  
  }
  
    //Calculate per county surprise
    for (let iter = 0; iter < data.length; iter++) {
	  if ((+data[iter].series_complete_pop_pct == 0) || (+data[iter].population == undefined)) {
			surpriseData.push({fips : +data[iter].fips, surprise: 0})	
			data[iter]['surprise'] = 0
	  } else {
		  diffs[0] = (+data[iter].series_complete_pop_pct) - avg;
		  //Estimate P(M|D)
		  //De' moivres
		  pMDs[0] = pMs[0] * pSMs[iter];

		  // Surprise is the sum of KL divergance across model space
		  // Each model also gets a weighted "vote" on what the sign should be
		  kl = 0;
		  let voteSum = 0;
		  kl += +pMDs[0] * (Math.log( +pMDs[0] / +pMs[0]) / Math.log(2));
		  if (Number.isNaN(kl)){
			surpriseData.push({fips : +data[iter].fips, surprise: 0})
			data[iter]['surprise'] = 0			
		  } else {
			voteSum += diffs[0] * pMs[0];
			let surprise = voteSum >= 0 ? +Math.abs(kl) : -1* +Math.abs(kl);
			checkSurprise.push(+surprise); //To find max and min
			data[iter]['surprise'] = +surprise
		    surpriseData.push({fips : +data[iter].fips, surprise: +surprise})		
	  }}
    }
}

function setSurprise(){
	for (var x = 0; x < data.length; x++){
		for (var y = 0; y < 3142; y++){
			if (surpriseData[x].fips == geojson.features[y].id){
				geojson.features[y].properties["Surprise"] = surpriseData[x].surprise
			}
		}
	}
}

function getCountyByFips(fips) {
		for (let iter = 0; iter < data.length; iter++) {
			if (+data[iter].fips == fips){
				return iter;
			}
		}
}

function getCountyDataByFips(fips) {
		for (let iter = 0; iter < data.length; iter++) {
			if (+data[iter].fips == fips){
				if (+data[iter].series_complete_pop_pct != 0)
					return true;
			}
		}
}

function drawGraph() {
	var colorScale = d3.scaleQuantile()
						.domain([max,min])
						.range(colorbrewer.RdBu[colorsLength].reverse());
	
	const width = 950;
	const height = 600;
	
	let section = d3.select("body")
		.append("section")

	let svg = section
		.append("svg")
			.attr("width", width)
			.attr("height", height)
			
	svg
      .append('defs')
      .append('pattern')
        .attr('id', 'texture')
        .attr('patternUnits', 'userSpaceOnUse')
        .attr('width', 8)
        .attr('height', 8)
      .append('path')
        .attr('d', 'M0 0L8 8ZM8 0L0 8Z')
        .attr('stroke', '#C48AB2')
        .attr('stroke-width', 1);

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
						if (getCountyDataByFips(d.id))
							return colorScale(+d.properties.Surprise)
						else 
							return 'url(#texture)';
			})
			.attr("data-fips", (d) => d.id)
			.attr("data-vaccinations", (d) => +d.properties.Surprise)
			.on("mouseover", handleMouseOver)
			.on("mosemove", handleMouseMove)
			.on("mouseout", handleMouseOut)


	//DRAWING BORDERS
  let borders = svg.append("path")
	  	.classed("stateBorder", true)
	  	.attr("fill", "none")
	  	.attr("stroke", "black")
    .datum(topojson.mesh(geoData, geoData.objects.states), (a, b) => a !== b)
    	.attr('d', path)

//TOOLTIP
	let tooltip = d3.select("body")
		.append("div")
			.style("opacity", 0)
			.attr("id", "tooltip")
			.style("position", "absolute")
			.style("background-color", '#154360')
			.style("color", "white")
			.style("padding", "10px")
			.style("text-align", "center")
			.style("border-radius", "10%")

	function handleMouseOver(el) {
		let county = getCountyByFips(el.id);
		tooltip
				.transition()
				.style("opacity", 0.8)
		tooltip
				.style("left", d3.event.pageX + 10 + "px")
				.style("top", d3.event.pageY + 10 + "px")
				.attr("data-vaccinations", `${data[county].series_complete_pop_pct}`)
				.html(`${data[county].recip_county}: ${data[county].series_complete_pop_pct}: ${data[county].surprise}`)
		d3.select(this)
				.style("opacity", 0.2)
	}

	function handleMouseOut(el) {
		tooltip
				.transition()
				.style("opacity", 0)
		tooltip
				.style("left", "-1000px")  
				.style("top", "-1000px")  
		d3.select(this)
				.style("opacity", 1)
	}

	function handleMouseMove(el) {
		tooltip
				.style("left", d3.event.pageX + 10 + "px")
				.style("top", d3.event.pageY + 10 + "px")
	}
	// END TOOLTIP

	
	// START LEGEND
	const legendWidth = 300;
	const legendHeight = 10;
	const legendBarLength = legendWidth / colorsLength

	let legend = svg
		.append("g")
			.attr("id", "legend")

	let legendScale = d3.scaleLinear()
		.domain([min, -min])
		.rangeRound([0, legendWidth])

	let legendAxis = d3.axisTop(legendScale)
		  .tickSize(5)
		  .tickSizeOuter(0)
		  .tickFormat(x => `${x.toFixed(3)}`)
		  .tickValues([min,-min]);

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