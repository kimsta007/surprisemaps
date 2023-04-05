let data, geoData, popn, geojson, rankingValues;
let population = {}, expData = [];
let participantList = [], fipsList = [], transData  = [], exploreFips = [], exploreData = []
let colorsChoropleth = [
  "#C87661",
  "#D5937E",
  "#E0AF9C",
  "#EACCBB",
  "#D4CCBC",
  "#9FAE9E",
  "#6B9081",
  "#327365",
];

let palette = [
  "#C87661",
  "#DDA391",
  "#EFCFC5",
  "#FBF6F2",
  "#FBF6F2",
  "#C1CEC6",
  "#7BA094",
  "#327365",
];

let radius = d3.scaleSqrt()
    .domain([0, 4])
    .range([0, 1]);
let count = 0, row = "", counties = [], surpriseData = [], validation = [];
const checkSurprise = [], analysisData = []
let timeout = null, toggled = true, toggleValue = 1, lastSelected, lastLegendSelected = null
let mouseStartTime, mouseIdleTime, mouseLog = [], mouseClick = []
let min, max, rnd_gen, sd, avg, highTickValue
let cPath, group, type = 'i', previouslySelected = "Selected"

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
	Promise.all([d3.json('../data/counties.json'), d3.csv('../data/pbc_vacc.csv'), d3.csv('../data/pbce_vacc.csv')]).then(cleanupData);
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
	
	dte[1].forEach((record) => {
		participantList.push(record.participant)
		fipsList.push(record.fips)
	})

	dte[2].forEach((record) => {
		exploreFips.push(record.fips)
	})

	participantList = [...new Set(participantList)];
	fipsList = [...new Set(fipsList)];
	exploreFips = [...new Set(exploreFips)];

    fipsList.forEach((record) => {
		let slist = dte[1].filter((data) => {return record == data.fips})
		transData.push({'fips': record, 'count': slist.length})
	})

	exploreFips.forEach((record) => {
		let slist = dte[2].filter((data) => {return record == data.fips})
		exploreData.push({'fips': record, 'count': slist.length})
	})

	let plist = document.getElementById("plist");
	plist.addEventListener("change", updateSelectedMap);

	let ptask = document.getElementById("ptask");
	ptask.addEventListener("change", updateExploreMap);

	let option = document.createElement("option");
		option.text = 'All';
        option.value = 'All';
		plist.appendChild(option)

	participantList.forEach((record) => {
		let option = document.createElement("option");
		option.text = record;
        option.value = record;
		plist.appendChild(option)
	})
	eDset = dte[2]
	hoverData = dte[1]
    
    avg = math.mean(validation)
	sd = math.std(validation)
	geoData = dte[0];
    makeMaps();
}

function updateExploreMap() {
	if ((document.getElementById('ptask').value != previouslySelected) && (document.getElementById('ptask').value == "Explored")) {
		d3.selectAll('#bubble').remove() 
		createBubbles(group, 'e', cPath)
		previouslySelected = document.getElementById('ptask').value
		type = 'e'
		document.getElementById("plist").dispatchEvent(new Event("change"));
	}
	else if ((document.getElementById('ptask').value != previouslySelected) && (document.getElementById('ptask').value == "Selected")){
		d3.selectAll('#bubble').remove()
		createBubbles(group, 'i', cPath)
		type = 'i'
		previouslySelected = document.getElementById('ptask').value
		document.getElementById("plist").dispatchEvent(new Event("change"));
	}
}

function updateSelectedMap() {	
	if (document.getElementById("plist").value === 'All') {
		let currentData = (type == 'i') ? transData : exploreData;
		currentData.forEach((record) => {
			d3.select('.' + type + record.fips).attr('r', radius(record.count) * 10)
		})
		d3.selectAll('#bubble').style('opacity', '1')
	} else {
		d3.selectAll('#bubble').style('opacity', '0')
		let currentData = (type == 'i') ? hoverData : eDset;
		currentData.forEach((record) => {
			if (record.participant == document.getElementById("plist").value){
				d3.selectAll('.' + type + record.fips).style('opacity', '1')
				d3.select('.' + type + record.fips).attr('r', '3')
			}
		})
	}
}


function makeMaps(){
    calcSurprise()
    rnd_gen = +sessionStorage.getItem('lrValue')
    rnd_gen = 2
	if (rnd_gen === 2)  {
		drawGraph(0)
		document.getElementById('lblx').textContent = 'Choropleth Map'
		if (expType == 0)
			document.getElementById('parax').innerHTML = `<b>Choropleth Maps</b> are colored directly based on the number of sales divided by the county population.
			<br/><br/>We can visually identify numerous patterns when using Choropleth Maps, such as regions with high sales rates (shaded in green) as well as regions with low sales rates (shaded in red).<br/><br/>
			We will ask you to use this map to answer questions about high or low performing counties in terms of sales rates.`
	}
	else {
		drawGraph(1) 
		document.getElementById('lblx').textContent = 'Surprise Map'
		if (expType == 0)
			document.getElementById('parax').innerHTML = `<b>Surprise Maps</b> use an experimental technique called &nbsp;“Surprise”&nbsp; to color counties based on whether their sales 
			rates are far enough from expected values so as to be considered surprising. <br/><br/> For example, a small county with 80 sales and a total population of 100 people might not be considered as "surprising" 
			as a large county with 80,000 sales and a total population of 100,000 people. Similarly, a small county with 10 sales and a total population of 100 people might not be colored as "surprising" 
			as a large county with 20,000 sales and a total population of 100,000 people. In other words, we expect smaller counties to vary more in their rates than larger counties, and factor this into the map coloring.
			<br/><br/>We will ask you to use this map to answer questions about surprising counties in terms of sales rates.`
	}


	if (expType != 0) { //Identify task
		if (rnd_gen === 2){
			document.getElementById('txt-a').textContent = "The Choropleth Map shows sales data of a product line, weighted directly by population"
		} else { 
			document.getElementById('txt-a').textContent = "The Surprise Map summarizes counties with interesting sales rates, based on the national average. A county can show either high surprise, low surprise or no surprise."
		}
	} 
	document.getElementById('narration').hidden = ""
}

function removeRow(id){
	row = ""
	index = counties.indexOf(+id);
	counties.splice(index, 1)
	if (counties.length) {
		counties.forEach(function(county){		
			let ct = getCountyByFips(county)	
			row += '<div class="row-county" id="' + county +'"><button class="btn btn-primary btn-sm" id="' + county + '" type="button" onclick="removeRow(this.id)" data-bs-toggle="tooltip" data-bs-placement="bottom" title="Click to Remove County" class="form-control btn-danger" style="font-size: 14px; vertical-align:middle;"><i class="fa fa-times"></i> '+ ct.recip_county + ', ' + ct.recip_state + '</button></div>'
		})
		document.getElementById("rowCounties").innerHTML = row;
	} else {
		document.getElementById("rowCounties").innerHTML = '<span class="text-muted">You haven\'t selected any counties yet.</span>';
	}
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
	let colorScale, section, texture
	texture = textures.lines()
                            .size(4)
                            .lighter()
                            .strokeWidth(1)
                            .stroke('red')
                            .shapeRendering("crispEdges");
							
	if (mapType == 0) {  //map choropleth
		colorScale = d3.scaleQuantize()
						// .domain(calculateIQRange(validation))
						.domain([0.1, 0.9])
						.range(colorsChoropleth)

		section = d3.select("#visualsx")
		section.classed("svg-containerx", true) 
	} else { //map surprise -------------
		const tempSurprise = checkSurprise.map(a => a < 0 ? -a : a)
		const IQRSurprise = calculateIQRange(tempSurprise)

		const step = (IQRSurprise[1] - IQRSurprise[0]) / 4;
		const ticks = d3.ticks(0, IQRSurprise[1] + step, 4);
		highTickValue = ticks[ticks.length - 1] 

		colorScale = d3.scaleQuantize() 
							.domain([-highTickValue, highTickValue])
							.range(palette);

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
	let path = d3.geoPath(d3.geoIdentity().translate([50, 0]).scale(0.78)) //Change size of map
  
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
			.attr("data-sales", (d) => {(mapType == 0) ? +getCountyByFips(d.id).series_complete_pop_pct : +d.properties.Surprise})
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
			.style('left', 0)
			.style('top', 0)
			
		function handleClick(el) {
			let countyData = getCountyByFips(el.id)
			clearTimeout(timeout);
			timeout = setTimeout(function() {
				let mType = (mapType == 0) ? 'Choropleth' : 'Surprise'
				if (count == 5){
					document.getElementById('icon').classList.add('fa-shake');
				}
				if (expType == 1 && countyData.series_complete_pop_pct != 0){
					let county = countyData.recip_county
					mouseClick.push({'state':countyData.recip_state,'county': countyData.recip_county, 'fips': el.id, 'sales-rate': countyData.series_complete_pop_pct,'surprise': countyData.surprise, 'idle_duration': mouseIdleTime, 'mapType': mType})
					if ((count < 5) && (counties.indexOf(el.id) == -1)){
						row += '<div class="row-county" id="' + el.id +'"><button class="btn btn-primary btn-sm" id="' + el.id + '" type="button" onclick="removeRow(this.id)" data-bs-toggle="tooltip" data-bs-placement="bottom" title="Click to Remove County" class="form-control btn-danger" style="font-size: 14px; vertical-align:middle;"><i class="fa fa-times"></i> '+ county + ', ' + countyData.recip_state + '</button></div>'
						document.getElementById("rowCounties").innerHTML = row;
						count += 1
						counties.push(+el.id)	
						document.getElementById("ccount").innerText = "Selected Counties [" + counties.length + "/5]"
						document.getElementById("ccount").style.fontWeight = "bold"
						if (count == 5)
							document.getElementById("btnContinue").disabled = false;
					}
				}
			}, 400)		
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
				.attr("data-sales", `${county.series_complete_pop_pct}`)
				.html(function(){
					if (county.series_complete_pop_pct == 0 || (isNaN(county.series_complete_pop_pct)))
						return `No data available`
					else
						return `<b><p style="text-align: left; margin: 0px; padding: 0px; background-color: white;">${county.recip_county} (${county.recip_state})</p></b>
					<table style="width: 100%; margin-top: 0px; padding: 0px;"><tr style="border-bottom: 0.8px solid black;"><td>Sales Rate</td><td>Surprise</td><td>Population</td></tr><tr><td style="font-size: 12px;">${numeral(county.series_complete_pop_pct.toFixed(2)).format('0%')}</td><td style="font-size: 12px;">${county.surprise.toFixed(3)}</td><td style="font-size: 12px;">${county.census2019}</td></tr></table>`
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
			mouseLog.push({'state':county.recip_state,'county': county.recip_county, 'fips': el.id, 'sales-rate': county.series_complete_pop_pct,'surprise': county.surprise, 'idle_duration': mouseIdleTime})
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
	cPath = path
	group = g
	createBubbles(g, 'i', path)
	makeLegend(colorScale, svg, mapType)
}

function createBubbles(g, type, path){
	g
	.selectAll("circle")
		.data(geojson.features)
	.enter().append("circle")
		.attr("id", "bubble")
		.attr("class", function(d) {return type + d.id})
		.attr("transform", function(d) { return "translate(" + path.centroid(d) + ")"; })
		.attr("r", function(d) {		
			let count = (type == 'i') ? d.properties.selectedCount : d.properties.exploreCount
			if (d.properties.Participant != undefined && !isNaN(count)){
				return (document.getElementById('plist').value == 'All') ? radius(count) * 10 : '3';
			}
					})
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
			(surprise / 0.015 > 1)
			checkSurprise.push(+surprise / 0.015); //To find max and min
			data[iter]['surprise'] = +surprise / 0.015
		    surpriseData.push({fips : +data[iter].fips, surprise: +surprise / 0.015})
			analysisData.push([+data[iter].fips, data[iter].recip_county, data[iter].recip_state, +surprise, +data[iter].series_complete_pop_pct, +data[iter].census2019])
	  }}
    }
}

function setSurprise(geojson){
	for (var x = 0; x < 3142; x++){
		for (var y = 0; y < eDset.length; y++){
			if (eDset[y].fips == geojson.features[x].id){
				geojson.features[x].properties["Participant"] = eDset[y].participant				
				break;
			}
		}		
	}

	for (var x = 0; x < 3142; x++){
		for (var y = 0; y < hoverData.length; y++){
			if (hoverData[y].fips == geojson.features[x].id){
				geojson.features[x].properties["Participant"] = hoverData[y].participant				
				break;
			}
		}		
	}

	for (var x = 0; x < 3142; x++){
		for (var y = 0; y < transData.length; y++){
			if (transData[y].fips == geojson.features[x].id){
				geojson.features[x].properties["selectedCount"] = transData[y].count				
				break;
			}
		}		
	}

	for (var x = 0; x < 3142; x++){
		for (var y = 0; y < exploreData.length; y++){
			if (exploreData[y].fips == geojson.features[x].id){
				geojson.features[x].properties["exploreCount"] = exploreData[y].count				
				break;
			}
		}		
	}
	
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
	let width = 1150
	const legendWidth = 300;
	const legendBarLength = (mapType == 0) ? (legendWidth / 8) : (legendWidth / 7)

	let legendScale = d3.scaleLinear()
		.domain((mapType == 0) ? [0.1, 0.9] : [-Math.round(highTickValue), Math.round(highTickValue)])
		.rangeRound([0, legendWidth])

	let legendAxis = d3.axisTop(legendScale)
		  .tickSize(5)
		  .tickSizeOuter(0)

	if (mapType == 0)
		  legendAxis.tickFormat(d3.format('.0%'))
	else  {
		  legendAxis.tickValues([-Math.round(highTickValue), Math.round(highTickValue)])
		  legendAxis.tickFormat((d) => `${d.toFixed(1)}`)
	}
	 
    let colorRange = [... new Set(colorScale.range())] //TODO: find a better way to remove duplicate
		.map(d => {
	    let inverted = colorScale.invertExtent(d);
	    if (inverted[0] === undefined) {inverted[0] = legendScale.domain()[0];}
	    if (inverted[1] === undefined) {inverted[1] = legendScale.domain()[1];}
	    return inverted;
			});

	svg.append('rect')
			.attr('x', 620)
			.attr('y', 460)
			.attr('height', '60px')
			.attr('width', legendWidth + 25)
			.style('fill', '#fff')
			.style('opacity', 0.5)

    let legend = svg
			.append("g")
				.attr("id", "legend")

	let legendColors = legend
		.selectAll("rect")
		.data(colorRange)
		.enter()
		.append("rect")
			.attr("transform", (d) => { if (mapType == 0) 
											return `translate(${width*0.55},480)`
										else 
											return `translate(${width*0.55},480)` })
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
					legendLastSelected = legend
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
											return `translate(${width*0.55},480)`
										else 
											return `translate(${width*0.55},480)`})
		.call(legendAxis)
		.call(removeLegendDomain)

		svg.append("text")
		.attr("x", (mapType == 0) ? 680 : 675)
		.attr("y", 515)
		.style("text-anchor", "middle")
		.style("font-size", "12px")
		.text((mapType == 0) ? "Low Sales Rates" : "Surprisingly Low");

		svg.append("text")
		.attr("x", (mapType == 0) ? 885 : 885)
		.attr("y", 515)
		.style("text-anchor", "middle")
		.style("font-size", "12px")
		.text((mapType == 0) ? "High Sales Rates" : "Surprisingly High");
}

async function saveCSV () {
	var blob = new Blob([CSV.serialize(analysisData)], {type: "text/csv"});
   
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
	array.sort(d3.ascending)	
	let q1 = d3.quantile(array, 0.25);
	let q3 = d3.quantile(array, 0.75);
	let skew = skewness(array)
	let mad = math.mad(array)
	let iqr = q3 - q1
	let flag = (skew < -1 || skew > 1)
	let upperFence = q3 + (1.5 * mad)
	let lowerFence = q1 - (1.5 * mad)
	return [flag ? +Math.floor(lowerFence * 100) / 100 : lowerFence, flag ? +Math.round(upperFence * 100) / 100 : upperFence]
}

  function skewness(arr) {
	const n = arr.length;
	const mean = arr.reduce((sum, value) => sum + value, 0) / n;
	const variance = arr.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / (n - 1);
	const stdDev = Math.sqrt(variance);
	const skew = arr.reduce((sum, value) => sum + Math.pow((value - mean) / stdDev, 3), 0) / n;
	return skew;
  }