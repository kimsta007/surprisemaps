let data, geoData, geojson, positiveSurprise, negativeSurprise;
let count = 0, row = "", counties = [], surpriseData = [], validation = [], checkSurprise = [];
let timeout = null, nsminmax, psminmax
let mouseStartTime, mouseIdleTime, mouseLog = [], mouseClick = []
let toggleValue = 1
let toggled = true
let participantList = [], fipsList = [], transData = [], exploreFips = [], exploreData = []
let sd, avg, svg, lastSelected, lastHovered = null
let colorLow = "#c77560";
let colorMid = "rgb(239, 219, 203)";
let colorHigh = "#2f7264";

let legend
let radius = d3.scaleSqrt()
    .domain([0, 4])
    .range([0, 1]);
let cPath, group, type = 'i', previouslySelected = "Selected", hoverData, eDset

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
	let queryDate = '2022-10-12T00:00:00.000'
	$.ajax({
    url: "https://data.cdc.gov/resource/8xkx-amqh.json?date=" + queryDate,
    type: "GET",
    data: {
      "$limit" : 5000,
      "$$app_token" : "ztg2e75T7AHYY47YuxkzxhAxH"
    }
}).done(function(dtx) {
	data = dtx;
	Promise.all([d3.json('../data/counties.json'), d3.csv('../data/main/vvw.csv') /*, d3.csv('../data/pwve_vacc.csv')*/]).then(cleanupData);
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

	/*dte[2].forEach((record) => {
		exploreFips.push(record.fips)
	})*/

	participantList = [...new Set(participantList)];
	fipsList = [...new Set(fipsList)];
	//exploreFips = [...new Set(exploreFips)];

 	fipsList.forEach((record) => {
		let slist = dte[1].filter((data) => {return record == data.fips})
		transData.push({'fips': record, 'count': slist.length})
	})

	/*exploreFips.forEach((record) => {
		let slist = dte[2].filter((data) => {return record == data.fips})
		exploreData.push({'fips': record, 'count': slist.length})
	})*/

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
	
	hoverData = dte[1]
	//eDset = dte[2]

    avg = math.mean(validation)
	sd = math.std(validation)
	geoData = dte[0];
    makeMaps();
}

function makeMaps(geoData){
    calcSurprise()
	psminmax = d3.extent(checkSurprise)
	drawGraph();
}

function getCountyByFips(fips) {
		for (let iter = 0; iter < data.length; iter++) {
			if (+data[iter].fips == fips){
				return data[iter];
			}
		}
}

function removeRow(id){
	row = ""
	index = counties.indexOf(+id);
	counties.splice(index, 1)
	if (counties.length) {
		counties.forEach(function(county){	
			let ct = getCountyByFips(county)
			row += '<div class="row-county" id="' + county +'"><button class="btn btn-primary btn-sm" id="' + id + '" type="button" onclick="removeRow(this.id)" data-bs-toggle="tooltip" data-bs-placement="bottom" title="Click to Remove County" class="form-control btn-danger" style="font-size: 14px; vertical-align:middle;"><i class="fa fa-times"></i> '+ ct.recip_county + ', ' + ct.recip_state + '</button></div>'
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


function drawGraph() {
	const width = 950; //size of svg
	const height = 525;

	let texture = textures.lines()
                            .size(4)
                            .lighter()
                            .strokeWidth(1)
                            .stroke('red')
                            .shapeRendering("crispEdges");
	// -----------------------						
	let vDom = calculateIQRange(validation);
	let uDom = [calculateIQRange(checkSurprise)[1], 0];

	const vDomDiff = vDom[1] - vDom[0]
	let interpolateIsoRdBu = d3
    .scaleLinear()
    .domain([vDom[0] - .18 * vDomDiff, .5, vDom[1] + .115 * vDomDiff])
    .range([colorLow, colorMid, colorHigh])
    .interpolate(d3.interpolateLab);

	let quantization = vsup.quantization().branching(2).layers(4).valueDomain(vDom).uncertaintyDomain(uDom);

	let scale = vsup.scale().quantize(quantization).range(interpolateIsoRdBu);
	//-------------------------
	let section = d3.select("#visualsx")
		            .classed("svg-containerx", true) 

    let zoom = d3.zoom()
        .scaleExtent([1, 8])
        .on('zoom', zoomed);

	svg = section
		.append("svg")
			.attr("viewBox", "0 0 950 525")
			.attr("preserveAspectRatio", "xMinYMin meet")
			.attr("class","svg-content")
			.attr("id", "csvg")
    
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
	let path = d3.geoPath(d3.geoIdentity().translate([49.9, 0]).scale(0.78))  
  
	g.selectAll("path")
		.data(geojson.features)
		.enter()
		.append("path")
			.attr("d", path)
			.attr("stroke", "#FFF")
			.attr("stroke-width", .2)
			.attr("id", (d) => 'c'.concat(d.id))
			.attr("class", function(d) {    let countyData = getCountyByFips(d.id)	
											return getCountyRGB(countyData).replaceAll(', ', '').replace('(','').replace(')','');
			})
			.attr("fill", (d) => {      let countyData = getCountyByFips(d.id)
										return getCountyRGB(countyData)
								 })
			.attr("data-fips", (d) => d.id)
			.attr("data-sales", (d) => {getCountyByFips(d.id).series_complete_pop_pct})
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

		let arcGenerator = d3.arc();

		let pathData = arcGenerator({
		  startAngle: -0.55,
		  endAngle: 2.6,
		  innerRadius: 0,
		  outerRadius: 220
		});

		svg
			.append('path')
			.attr('d', pathData)
			.style('fill', '#fff')
			.style('opacity', 0.8)
			.attr('transform', 'translate(800,500)');
		  
	// legend
    legend = vsup.legend.arcmapLegend(null,null,'.0%')

          legend
            .scale(scale)
            .size(160)
            .x(width - 220)
            .y(height - 200)
            .vtitle("Sales Rate")
            .utitle("Uncertainty / Surprise");

          svg.append("g").call(legend)  

    svg.append("text")
		  .style("fill", "#AAA")
		  .style("font-size", "10px")
		  .attr("dy", ".35em")
		  .attr("text-anchor", "middle")
		  .attr("transform", "translate(735, 380) rotate(59)")
		  .text("Surprisingly Low");
		
	svg.append("text")
		  .style("fill", "#AAA")
		  .style("font-size", "10px")
		  .attr("dy", ".35em")
		  .attr("text-anchor", "middle")
		  .attr("transform", "translate(920, 380) rotate(-60)")
		  .text("Surprisingly High");

	svg.append("text")
		  .style("fill", "#AAA")
		  .style("font-size", "10px")
		  .attr("dy", ".35em")
		  .attr("text-anchor", "middle")
		  .attr("transform", "translate(815,510) rotate(0)")
		  .text("Not Surprising"); 

  function zoomed(e) {
	  		d3
              .select('#csvg g') // To prevent stroke width from scaling
              .attr('transform', function(d) {
								return d3.event.transform}); 
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
			.style("left", "0")
			.style("top", "0")

	function handleClick(el) {
		let countyData = getCountyByFips(el.id)
		clearTimeout(timeout);
		timeout = setTimeout(function() {
			if (count == 5){
				document.getElementById('icon').classList.add('fa-shake');
			}
			if (expType == 1 && countyData.series_complete_pop_pct != 0){
				let county = countyData.recip_county
				mouseClick.push({'state':countyData.recip_state,'county': countyData.recip_county, 'fips': el.id, 'sales-rate': countyData.series_complete_pop_pct,'surprise': countyData.surprise, 'idle_duration': mouseIdleTime, 'mapType': 'vsup'})
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
		}, 500)		
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


		if (toggled) {
			d3.select('#'.concat('c'.concat(el.id))).raise()
			d3.select('#'.concat('c'.concat(el.id))).style("stroke", "black")
			d3.select('#'.concat('c'.concat(el.id))).style("stroke-width", 1.5)
			let id = 'legend'.concat(getCountyRGB(county).replaceAll(', ', '').replace('(','').replace(')','').replace('rgb',''))
			d3.select('#'.concat(id)).raise()
			d3.select('#'.concat(id)).style('stroke','black')
			d3.select('#'.concat(id)).style('stroke-width',2.5)
		}
	}}

	function getCountyRGB(countyData){
		if ((countyData.series_complete_pop_pct != 0) && !isNaN(countyData.series_complete_pop_pct)){ 
				// let x = (Math.abs(+countyData.surprise) - psminmax[0])/( psminmax[1] - psminmax[0])
				// return scale(parseFloat(countyData.series_complete_pop_pct), parseFloat(x))								
				return scale(parseFloat(countyData.series_complete_pop_pct), countyData.surprise < 0 ? -countyData.surprise: countyData.surprise)								
		}	
		else
				return texture.url();
		
	}

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
		if (toggled) {
			d3.select('#'.concat('c'.concat(el.id))).style("stroke", "white")
			d3.select('#'.concat('c'.concat(el.id))).style("stroke-width", 0.2)
		    d3.selectAll('.stateBorder').raise()
			let id = 'legend'.concat(getCountyRGB(county).replaceAll(', ', '').replace('(','').replace(')','').replace('rgb',''))
			d3.select('#'.concat(id)).style('stroke','white')
			d3.select('#'.concat(id)).style('stroke-width',0.2)
		}

	
	}

	function handleMouseMove(el) {
		tooltip
				.style("left", d3.event.pageX + 10 + "px")
				.style("top", d3.event.pageY + 10 + "px")
	}

    cPath = path
	group = g
	createBubbles(g, 'i', path)

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
			data[iter]['surprise'] = +surprise / 0.015  //to fix
		    surpriseData.push({fips : +data[iter].fips, surprise: +surprise / 0.015}) //to fix
			checkSurprise.push(+Math.abs(kl) / 0.015) //to fix
	  }}
    }
}

function setSurprise(geojson){
	/*for (var x = 0; x < 3142; x++){
		for (var y = 0; y < eDset.length; y++){
			if (eDset[y].fips == geojson.features[x].id){
				geojson.features[x].properties["Participant"] = eDset[y].participant				
				break;
			}
		}		
	}*/

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

	/*for (var x = 0; x < 3142; x++){
		for (var y = 0; y < exploreData.length; y++){
			if (exploreData[y].fips == geojson.features[x].id){
				geojson.features[x].properties["exploreCount"] = exploreData[y].count				
				break;
			}
		}		
	}*/
	
	for (var x = 0; x < surpriseData.length; x++){
		for (var y = 0; y < 3142; y++){
			if (surpriseData[x].fips == geojson.features[y].id){
				geojson.features[y].properties["Surprise"] = surpriseData[x].surprise
			}
		}
	}
}

function calculateIQRange(array){
	array.sort(d3.ascending)	
	let q1 = d3.quantile(array, 0.25);
	let q3 = d3.quantile(array, 0.75);
	let skew = skewness(array)
	let mad = math.mad(array)
	let iqr = q3 - q1
	let flag = (skew < -1 || skew > 1)
	let upperFence = q3 + (1.5 * (flag ? mad : iqr))
	let lowerFence = q1 - (1.5 * (flag ? mad : iqr))
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