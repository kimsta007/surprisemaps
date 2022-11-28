let data, geoData, popn, geojson, rankingValues;
let population = {}, expData = [];

// let colorsChoropleth = ['#c77560', '#d18f7e', '#daa99c','#edddd9','#cfdcda','#7fa79f','#578d81','#2f7264'] 
// let palette = ['#c77560', '#d18f7e','#e4c3bb','#edddd9','#f7f7f7','#cfdcda','#a7c2bc','#578d81','#2f7264']

let colorsChoropleth = [
  "#cc816c",
  "#d89b87",
  "#e3b6a1",
  "#ebcebd",
  "#d7cebd",
  "#a8b3a2",
  "#7a9988",
  "#4a806f",
];

let palette = [
  "#cc816c",
  "#d89b87",
  "#e3b6a1",
  "#ebcebd",
  "#f7f7f7",
  "#d7cebd",
  "#a8b3a2",
  "#7a9988",
  "#4a806f",
];

let count = 0, row = "", counties = [], surpriseData = [], validation = [];
const checkSurprise = []
let timeout = null, toggled = true, toggleValue = 1, lastSelected, lastLegendSelected = null
let mouseStartTime, mouseIdleTime, mouseLog = [], mouseClick = []
let min, max, rnd_gen, sd, avg

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
	queryDate = '2022-10-12T00:00:00.000'
	$.ajax({
    url: "https://data.cdc.gov/resource/8xkx-amqh.json?date=" + queryDate,
    type: "GET",
    data: {
      "$limit" : 5000,
      "$$app_token" : "ztg2e75T7AHYY47YuxkzxhAxH"
    }
}).done(function(dtx) {
	data = dtx;
	Promise.all([d3.json('../data/counties.json')]).then(cleanupData);
});
}

function cleanupData(dte){
	for (let record in data){
		if (data[record].fips != "UNK"){		
			if (data[record].recip_state == "HI"){
				data[record].series_complete_pop_pct = 0
			}
			if (data[record].series_complete_pop_pct != 0 && !isNaN(data[record].series_complete_pop_pct)) {
				data[record].population = +data[record].census2019 / 328239523;
				data[record].series_complete_pop_pct = +data[record].series_complete_pop_pct / 100;
				validation.push(+data[record].series_complete_pop_pct);
			}
		}
	}
    avg = math.mean(validation)
	sd = math.std(validation)
	geoData = dte[0];
    makeMaps();
}

function makeMaps(){
    calcSurprise()
    rnd_gen = +sessionStorage.getItem('lrValue')

	if (rnd_gen % 2 == 0)  {
		drawGraph(0)
		document.getElementById('lblx').textContent = 'Choropleth Map'
		if (expType == 0)
			document.getElementById('parax').innerHTML = `<b>Choropleth Maps</b> are colored directly based on the number of people vaccinated divided by the county population.
			<br/><br/>We can visually identify numerous patterns when using Choropleth Maps, such as regions with high vaccination rates (shaded in green) as well as regions with low vaccination rates (shaded in red).<br/><br/>
			We will ask you to use this map to answer questions about high or low performing counties in terms of vaccination rates.`
	}
	else {
		drawGraph(1) 
		document.getElementById('lblx').textContent = 'Surprise Map'
		if (expType == 0)
			document.getElementById('parax').innerHTML = `<b>Surprise Maps</b> use an experimental technique called &nbsp;“Surprise”&nbsp; to color counties based on whether their vaccination 
			rates are far enough from expected values so as to be considered surprising. <br/><br/> For example, a small county with 80 out of 100 people vaccinated might not be considered as "surprising" 
			as a large county with 80,000 out of 100,000 people vaccinated. Similarly, a small county with 10 out of 100 people vaccinated might not be colored as "surprising" 
			as a large county with 20,000 out of 100,000 people vaccinated. In other words, we expect smaller counties to vary more in their rates than larger counties, and factor this into the map coloring.
			<br/><br/>We will ask you to use this map to answer questions about surprising counties in terms of vaccination rates.`
	}


	if (expType != 0) { //Identify task
		if (rnd_gen % 2 == 0){
			document.getElementById('txt-a').textContent = "The Choropleth Map shows vaccination data, weighted directly by population as of 10/12/2022."
		} else { 
			document.getElementById('txt-a').textContent = "The Surprise Map summarizes counties with interesting vaccination rates as of 10/12/2022, based on the national average. A county can show either high surprise, low surprise or no surprise."
		}
	} 
	document.getElementById('labels').hidden = ""
	document.getElementById('narration').hidden = ""
}

function removeRow(id){
    row = ""
	index = counties.indexOf(+id);
	counties.splice(index, 1)
	document.getElementById("rowCounties").innerHTML = ""
	counties.forEach(function(county){
		row += '<td class="tblText" id= "' + county + '">&emsp;' + getCountyByFips(county).recip_county + '&nbsp;<button class="selected" id="' + county + '" type="button" onclick="removeRow(this.id)" data-bs-toggle="tooltip" data-bs-placement="bottom" title="Click to Remove County" class="form-control btn-danger" style="font-size: 12px;">Remove</button></td>'
	})
	document.getElementById("rowCounties").innerHTML = row;
	count -= 1
	document.getElementById("ccount").innerText = "Selected Counties [" + counties.length + "/5]"
	document.getElementById("ccount").style.fontWeight = "bold"
	if (count < 5){
			document.getElementById("btnContinue").disabled = true;
            document.getElementById('icon').classList.remove('fa-shake');
    }
	if (tour != null && tour.isActive())
		Shepherd.activeTour.next()
}


function drawGraph(mapType) {
	const width = 950; //size of svg
	const height = 525;
	let seriesMin = d3.min(data.map((d) => +d.series_complete_pop_pct));
	let seriesMax = d3.max(data.map((d) => +d.series_complete_pop_pct));
	let colorScale, section, colorRange, texture
	let currentMap = mapType
	texture = textures.lines()
                            .size(4)
                            .lighter()
                            .strokeWidth(1)
                            .stroke('red')
                            .shapeRendering("crispEdges");
							
	if (mapType == 0) {  //map choropleth
		colorScale = d3.scaleQuantize()
						.domain(calculateIQRange(validation))
						.range(colorsChoropleth)

		section = d3.select("#visualsx")
		section.classed("svg-containerx", true) 
	} else { //map surprise -------------
				colorScale = d3.scaleQuantize() 
							.domain(calculateIQRange(checkSurprise))
							.range(palette);

             //--------------------------

		section = d3.select("#visualsx")
		colorScale
			.range()
				.map(d => {
				let inverted = colorScale.invertExtent(d);
				return inverted
			})
	}

    let zoom = d3.zoom()
        .scaleExtent([1, 8])
        .on('zoom', zoomed);

	let svg = section
		.append("svg")
			.attr("viewBox", "0 0 950 525")
			.attr("preserveAspectRatio", "xMinYMin meet")
			.attr("class","svg-content")
			.attr("id", function(d) {
				if (mapType == 0){
					return "csvg";
				} else {
					return "ssvg";
				}
			})
    
    let g = svg.append('g')
	
    svg.call(zoom)
        .on('wheel.zoom', null)
		.on('dblclick.zoom', function(d){
			d3.select("#zoom_in").dispatch('click')
		})
		.on("touchstart.zoom", null)
		.on("touchmove.zoom", null)
		.on("touchend.zoom", null);
		
	let zoomCount = 0

		d3.select("#zoom_in").on("click", function() {
			zoomCount += 1
			zoom.scaleBy(svg.transition().duration(250), 1.6);
			document.getElementById("zoom_out").disabled = false

			if (zoomCount == 5)
				document.getElementById("zoom_in").disabled = true 
		  });
		
		d3.select("#zoom_out").on("click", function() {
			zoomCount -= 1
			zoom.scaleBy(svg.transition().duration(250), 0.6);
			if (zoomCount == 0)
				document.getElementById("zoom_out").disabled = true
			
			if (zoomCount == 4)
				document.getElementById("zoom_in").disabled = false			
		  });

	svg.call(texture) 

	//DRAWING COUNTIES
	geojson = topojson.feature(geoData, geoData.objects.counties)
	setSurprise(geojson);
	let path = d3.geoPath(d3.geoIdentity().translate([100, 0]).scale(0.7)) //Change size of map
  
	g.selectAll("path")
		.data(geojson.features)
		.enter()
		.append("path")
			.attr("d", path)
			.attr("id", (d) => d.id) 
			.attr("stroke", "#FFF")
			.attr("stroke-width", .2)
            .attr("class", (d) => { let cdata = +getCountyByFips(d.id).series_complete_pop_pct
								   if (mapType == 0)
										return 'county'.concat(colorScale(cdata)).replace('#','')
								   else if ((cdata != 0) && !isNaN(cdata))
										return 'county'.concat(colorScale(+d.properties.Surprise)).replace('#', '')
									})				
			.attr("fill", (d) => {  if (mapType == 0) {
										let cdata = getCountyByFips(d.id).series_complete_pop_pct
										if ((cdata != 0) && !isNaN(cdata)){												
											return colorScale(cdata)
										}
										else {
											return texture.url();
										}
									} else {
										if ((getCountyByFips(d.id).series_complete_pop_pct != 0) && !isNaN(getCountyByFips(d.id).series_complete_pop_pct))
											return colorScale(+d.properties.Surprise)
										else 
											return texture.url();
									}
								 })
			.attr("data-fips", (d) => d.id)
			.attr("data-vaccinations", (d) => {(mapType == 0) ? +getCountyByFips(d.id).series_complete_pop_pct : +d.properties.Surprise})
			.on("mouseover", handleMouseOver)
			.on("mosemove", handleMouseMove)
			.on("mouseout", handleMouseOut)
			.on("click", handleClick)
			.on("dblclick", function(d) {
								clearTimeout(timeout);								
							  });

	//DRAWING BORDERS
  let borders = g.append("path")
	  	.classed("stateBorder", true)
	  	.attr("fill", "none")
		.attr("stroke", "#252525")
		.style("opacity", 0.6)
    .datum(topojson.mesh(geoData, geoData.objects.states), (a, b) => a !== b)
    	.attr('d', path)

  function zoomed(e) {
	  		d3
              .select('#ssvg g') // To prevent stroke width from scaling
              .attr('transform', function(d) {
								return d3.event.transform}); 
			d3
              .select('#csvg g') // To prevent stroke width from scaling
              .attr('transform', d3.event.transform);
  }

	//TOOLTIP
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
	
	function handleClick(el) {
		clearTimeout(timeout);
		timeout = setTimeout(function() {
			let mType = (mapType == 0) ? 'Choropleth' : 'Surprise'
			if (count == 5){
				document.getElementById('icon').classList.add('fa-shake');
			}
			if (expType == 1 && getCountyByFips(el.id).series_complete_pop_pct != 0){
				let county = getCountyByFips(el.id)
				mouseClick.push({'state':county.recip_state,'county': county.recip_county, 'fips': el.id, 'vacc-rate': county.series_complete_pop_pct.toFixed(2),'surprise': county.surprise, 'idle_duration': mouseIdleTime, 'mapType': mType})
				if ((count < 5) && (counties.indexOf(el.id) == -1)){
					row += '<td class="tblText" id="' + el.id +'">&emsp;' + county.recip_county + '&nbsp;<button class="selected" id="' + el.id + '" type="button" onclick="removeRow(this.id)" data-bs-toggle="tooltip" data-bs-placement="bottom" title="Click to Remove County" class="form-control btn-danger" style="font-size: 12px;">Remove</button></td>'
					document.getElementById("rowCounties").innerHTML = row;
					count += 1
					counties.push(+el.id)	
					document.getElementById("ccount").innerText = "Selected Counties [" + counties.length + "/5]"
					document.getElementById("ccount").style.fontWeight = "bold"
					if (count == 5)
						document.getElementById("btnContinue").disabled = false;
				}
			}
		}, 300)		
	}


	function handleMouseOver(el) {
		if (expType != 0) {
		mouseStartTime = new Date().getTime()
		let county = getCountyByFips(el.id);
 
		tooltip
				.transition()
				.style("opacity", 1)

		tooltip
				.style("left", d3.event.pageX + 10 + "px")
				.style("top", d3.event.pageY + 10 + "px")
				.attr("data-vaccinations", `${county.series_complete_pop_pct}`)
				.html(function(){
					if (county.series_complete_pop_pct == 0 || (isNaN(county.series_complete_pop_pct)))
						return `No data available`
					else
						return `<b><p style="text-align: left; margin: 0px; padding: 0px; background-color: white;">${county.recip_county} (${county.recip_state})</p></b>
					<table style="width: 100%; margin-top: 0px; padding: 0px;"><tr style="border-bottom: 0.8px solid black;"><td>Vacc Rate</td><td>Surprise</td><td>Population</td></tr><tr><td style="font-size: 12px;">${county.series_complete_pop_pct.toFixed(2)}</td><td style="font-size: 12px;">${county.surprise.toFixed(3)}</td><td style="font-size: 12px;">${county.census2019}</td></tr></table>`
				})
			
		   let legendID
		   if (mapType == 0){
				legendID = '#legend'.concat(colorScale(+getCountyByFips(el.id).series_complete_pop_pct).replace('#',''))
			}
		   else {
				legendID = '#legend'.concat(colorScale(+el.properties.Surprise).replace('#', ''))
			}
			if (toggled) {
				d3.select(this).raise()
				d3.select(this).style("stroke", "black")
				d3.select(this).style("stroke-width", 1.5)
				d3.select(legendID).raise()
				d3.select(legendID).style('stroke','black')
				d3.select(legendID).style('stroke-width',2.5)
			}
	}}

	function handleMouseOut(el) {
		let county = getCountyByFips(el.id);
		mouseIdleTime = new Date().getTime() - mouseStartTime
		if (mouseIdleTime >= 120){
			mouseLog.push({'state':county.recip_state,'county': county.recip_county, 'fips': el.id, 'vacc-rate': county.series_complete_pop_pct.toFixed(2),'surprise': county.surprise.toFixed(3), 'idle_duration': mouseIdleTime})
		}
		tooltip
				.transition()
				.style("opacity", 0)
		tooltip
				.style("left", "-1000px")  
				.style("top", "-1000px")  

		let legendID
		if (mapType == 0){
				legendID = '#legend'.concat(colorScale(+getCountyByFips(el.id).series_complete_pop_pct).replace('#',''))
			}
		else {
				legendID = '#legend'.concat(colorScale(+el.properties.Surprise).replace('#', ''))
			}
		if (toggled) {
			d3.select(this).style("stroke", "white")
			d3.select(this).style("stroke-width", 0.2)
			d3.selectAll('.stateBorder').raise()
			d3.select(legendID).style('stroke','none')
		}
	}

	function handleMouseMove(el) {
		tooltip
				.style("left", d3.event.pageX + 10 + "px")
				.style("top", d3.event.pageY + 10 + "px")
	}
	// END TOOLTIP

	makeLegend(colorScale, svg, mapType)
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
			data[iter]['surprise'] = 'UNK'
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
			data[iter]['surprise'] = 'UNK'		
		  } else {
			voteSum += diffs[0] * pMs[0];
			let surprise = voteSum >= 0 ? +Math.abs(kl) : -1* +Math.abs(kl);
			checkSurprise.push(+surprise); //To find max and min
			data[iter]['surprise'] = +surprise
		    surpriseData.push({fips : +data[iter].fips, surprise: +surprise})
	  }}
    }
}

function setSurprise(geojson){
	for (var x = 0; x < surpriseData.length; x++){
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
				return data[iter];
			}
		}
}

function makeLegend(colorScale, svg, mapType) {
	let width = 950
	const legendWidth = 300;
	const legendBarLength = (mapType == 0) ? (legendWidth / 8) : (legendWidth / 9)

	let legend = svg
		.append("g")
			.attr("id", "legend")

	let legendScale = d3.scaleLinear()
		.domain((mapType == 0) ? [Math.floor(calculateIQRange(validation)[0] * 10) / 10, +(calculateIQRange(validation)[1]).toFixed(1)] : d3.extent(checkSurprise))
		.rangeRound([0, legendWidth])


	let legendAxis = d3.axisTop(legendScale)
		  .tickSize(5)
		  .tickSizeOuter(0)
		  .tickFormat(x => `${x.toFixed(2)}`)
		  .tickValues((mapType == 0) ? [Math.floor(calculateIQRange(validation)[0] * 10) / 10, +(calculateIQRange(validation)[1]).toFixed(1)] : d3.extent(checkSurprise))

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
			.attr("transform", (d) => { if (mapType == 0) 
											return `translate(${width*0.55},450)`
										else 
											return `translate(${width*0.55},450)` })
			.attr("height", 20)
			.attr("width", legendBarLength)
			.attr("id", (d) => {return 'legend'.concat(colorScale(d[0]).replace('#', ''))})
			.attr("x", (d,i) => i * legendBarLength)
			.attr("fill", (d) => colorScale(d[0]))
			.on('mouseover', (d) => {
				if (toggled) {
					let county = '.county'.concat(colorScale(d[0])).replace('#','')
					let legend = '#legend'.concat(colorScale(d[0]).replace('#', ''))
					highlightCounties(county)	
					d3.select(legend).raise()
					d3.select(legend).style('stroke', 'black')
					d3.select(legend).style('stroke-width',2.5)	
			}})
			.on('mouseout', (d) => {
				let legend = '#legend'.concat(colorScale(d[0]).replace('#', ''))
				let county = '.county'.concat(colorScale(d[0])).replace('#','')
				if (toggled)
					unHighlightCounties(county)

				if (toggled && lastLegendSelected == null) {
					d3.select(legend).style('stroke', 'none')
					d3.selectAll('.stateBorder').raise()
				}
				
			})
			.on('click', (d) => {
				let legend = '#legend'.concat(colorScale(d[0]).replace('#', ''))
				let county = '.county'.concat(colorScale(d[0])).replace('#','')
				if (((toggleValue % 2) == 0) && (lastSelected != county)) {		
					unHighlightCounties(lastSelected)
					highlightCounties(county)

					//Switch legend highlight
					d3.select(legendLastSelected).style('stroke','none')
					d3.select(legend).style('stroke','black')
					d3.select(legend).style('stroke-width',2.5)	
					d3.selectAll('.stateBorder').raise()																					
					toggled = false
					lastSelected = county
					legendLastSelected - legend
				} else if (((toggleValue % 2) == 0) && (lastSelected == county)){
						unHighlightCounties(county)
						d3.selectAll('.stateBorder').raise()	
						toggled = true
						toggleValue -= 1
				} else {		
					highlightCounties(county)									
					toggled = false
					lastSelected = county
					legendLastSelected = legend
					toggleValue += 1
				}
			})

	function highlightCounties(county){
		d3.selectAll(county).classed("countyPath", true)	
		d3.selectAll(county).style("stroke-dasharray", "4,4")
		d3.selectAll(county).raise()
		d3.selectAll(county).style('stroke', 'black')
		d3.selectAll(county).style('stroke-width', 1)
	}

	function unHighlightCounties(county){
		d3.selectAll(county).classed("countyPath", false)	
		d3.selectAll(county).style("stroke-dasharray", "none")
		d3.selectAll(county).raise()
		d3.selectAll(county).style('stroke', 'white')
		d3.selectAll(county).style('stroke-width', 0.2)
	}

	function removeLegendDomain(el) {
		el.select(".domain").remove()
	}

	let legendTicks = legend.append("g")
			.attr("id", "legendAxis")
			.attr("transform", (d) => { if (mapType == 0) 
											return `translate(${width*0.55},450)`
										else 
											return `translate(${width*0.55},450)`})
		.call(legendAxis)
		.call(removeLegendDomain)

		svg.append("text")
		.attr("x", (mapType == 0) ? 570 : 545)
		.attr("y", 490)
		.style("text-anchor", "middle")
		.style("font-size", "12px")
		.text((mapType == 0) ? "Vaccination Rate" : "Surprise");
}

async function saveCSV () {
	var array = checkSurprise.map(x => [x])
   
	var blob = new Blob([CSV.serialize(array)], {type: "text/csv"});
   
	const fileHandle = await window.showSaveFilePicker({
	  suggestedName : "surprise.csv",
	  types: [{
		description: "CSV file",
		accept: {"text/csv": [".csv"]}
	  }]
	});
	const fileStream = await fileHandle.createWritable();
   
	await fileStream.write(blob);
	await fileStream.close();
  }

  function calculateIQRange(array){
	let upper = lower = array.sort(d3.ascending)		
	let medianLoc = (array.length % 2 == 0) ? upper.indexOf(ss.median(upper)) : (array.length / 2)
	upper = upper.slice(medianLoc, upper.length)
	lower = lower.slice(0, medianLoc)
	let q1 = ss.median(lower), q3 = ss.median(upper)
	let iqr = q3 - q1
	return [q1 - (1.5 * iqr), q3 + (1.5 * iqr)]
  }