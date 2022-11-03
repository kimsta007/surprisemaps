let data, geoData, geojson, positiveSurprise, negativeSurprise;
let count = 0, row = "", counties = [], surpriseData = [], validation = [], checkSurprise = [];
let timeout = null
let mouseStartTime, mouseIdleTime, mouseLog = []
let sd, avg
let red = "rgb(172,32,47)";
let purple = "rgb(116,2,128)";
let blue = "rgb(34,101,163)";

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

function kernelDensityEstimator(kernel, X) {
  return function(V) {
    return X.map(function(x) {
      return [x, d3.mean(V, function(v) { return kernel(x - v); })];
    });
  };
}

function kernelEpanechnikov(k) {
  return function(v) {
    return Math.abs(v /= k) <= 1 ? 0.75 * (1 - v * v) / k : 0;
  };
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
	Promise.all([d3.json('../../data/counties.json')]).then(cleanupData);
});
}

function cleanupData(dte){
	for (let record in data){
		if (data[record].fips != "UNK"){		
			if (data[record].recip_state == "VT" || data[record].recip_state == "HI"){
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

function makeMaps(geoData){
    calcSurprise()
	
	positiveSurprise = d3.scaleLinear()
		  .domain([0, d3.extent(checkSurprise)[1]])
		  .range([0, 1]);
		  
	negativeSurprise = d3.scaleLinear()
		  .domain([0, d3.extent(checkSurprise[0])])
		  .range([0, -1]);
		  
    /*rnd_gen = +sessionStorage.getItem('lrValue')

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
	} */
	drawGraph();
	document.getElementById('labels').hidden = ""
	document.getElementById('narration').hidden = ""
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
							
	let vDom = [0.2, 1];
	let uDom = [1, 0];

	let interpolateIsoRdBu = d3.scaleLinear()
			  .domain([0,0.5,1])
			  .range([blue,purple,red])
			  .interpolate(d3.interpolateLab);

	let quantization = vsup.quantization().branching(2).layers(4).valueDomain(vDom).uncertaintyDomain(uDom);
	
	let scale = vsup.scale().quantize(quantization).range(interpolateIsoRdBu);
	
	let section = d3.select("#visualsx")
		            .classed("svg-containerx", true) 

    let zoom = d3.zoom()
        .scaleExtent([1, 8])
        .on('zoom', zoomed);

	let svg = section
		.append("svg")
			.attr("viewBox", "0 0 1100 540")
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
	let path = d3.geoPath(d3.geoIdentity().translate([100, 0]).scale(0.8))  
  
	g.selectAll("path")
		.data(geojson.features)
		.enter()
		.append("path")
			.attr("d", path)
			.attr("stroke", "#FFF")
			.attr("stroke-width", .3)
			.attr("id", (d) => d.id)
			.attr("fill", (d) => {      let countyData = getCountyByFips(d.id)
										if ((countyData.series_complete_pop_pct != 0) && !isNaN(countyData.series_complete_pop_pct) && (+d.properties.Surprise.toFixed(3) >= 0)){
											console.log(+d.properties.Surprise.toFixed(3), '->',parseFloat(positiveSurprise(+d.properties.Surprise.toFixed(3)).toFixed(4)))
										    return scale(parseFloat(countyData.series_complete_pop_pct).toFixed(3), parseFloat(positiveSurprise(+d.properties.Surprise.toFixed(3)).toFixed(4)))								
										}
										else if ((countyData.series_complete_pop_pct != 0) && !isNaN(countyData.series_complete_pop_pct) && (+d.properties.Surprise.toFixed(3) < 0)) {
											return '#fff'
											//return scale(parseFloat(countyData.series_complete_pop_pct).toFixed(3), Math.abs(parseFloat(negativeSurprise(+d.properties.Surprise.toFixed(3)).toFixed(4))))
										}		
										else
											return texture.url();
								 })
			.attr("data-fips", (d) => d.id)
			.attr("data-vaccinations", (d) => {getCountyByFips(d.id).series_complete_pop_pct})
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
	  	.attr("stroke", "white")
    .datum(topojson.mesh(geoData, geoData.objects.states), (a, b) => a !== b)
    	.attr('d', path)

	// legend
          var legend = vsup.legend.arcmapLegend()

          legend
            .scale(scale)
            .size(160)
            .x(width - 80)
            .y(height - 200)
            .vtitle("Vaccination Rate")
            .utitle("Uncertainty / Surprise");

          svg.append("g").call(legend)

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

	function handleClick(el) {
		let countyData = getCountyByFips(el.id)
		clearTimeout(timeout);
		timeout = setTimeout(function() {
			if (count == 5){
				document.getElementById('icon').classList.add('fa-shake');
			}
			if (expType == 1 && countyData.series_complete_pop_pct != 0){
				let county = countyData.recip_county
				if ((count < 5) && (counties.indexOf(el.id) == -1)){
					row += '<td class="tblText" id="' + el.id +'">&emsp;' + county + '&nbsp;<button class="selected" id="' + el.id + '" type="button" onclick="removeRow(this.id)" data-bs-toggle="tooltip" data-bs-placement="bottom" title="Click to Remove County" class="form-control btn-danger" style="font-size: 12px;">Remove</button></td>'
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

		document.getElementById(el.id).parentElement.appendChild(document.getElementById(el.id))
		document.getElementById(el.id).style.stroke = 'black'
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
		document.getElementById(el.id).style.stroke = 'white'
	}

	function handleMouseMove(el) {
		tooltip
				.style("left", d3.event.pageX + 10 + "px")
				.style("top", d3.event.pageY + 10 + "px")
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
