let data, geoData, popn, checkData, geojson, rankingValues;
let population = {}, expData = [];
//let colorsChoropleth = ["#c77560", "#dba788", "#efdbcb", "#b3d0c7", "#6fa194", "#2f7264"]
let colorsChoropleth = ["#701e84", "#8f60a6" ,"#ddc3de", "#cf8fa9", "#ba5c6e", "#a71c3b"]
//let palette = ['#c47464', '#dba788','#efdbcb', '#f7f7f7', '#dae2e0', '#abc7c1',	'#96b9b1',	'#80aba1',	'#6b9d92',	'#568f82',	'#2c7363'];
let palette = ["#5e568e", "#837ab9", "#bab5d8", "#f7f7f7", "#fee5d9", "#fcbba1", "#fc9272", "#fb6a4a", "#ef3b2c", "#cb181d","#99000d"]
let count = 0, row = "", counties = [], surpriseData = [], checkSurprise = [], validation = [];
let legendTextureA, legendTextureB, legendTextureC, legendTextureD, legendTextureE, legendTextureF, 
        legendTextureG, legendTextureH, legendTextureI, legendTextureJ, legendTextureK, legendTextureL, legendTextureM,
		legendTextureN, legendTextureO, legendTextureP, legendTextureQ, timeout = null
let mouseStartTime, mouseIdleTime, mouseLog = []
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

function makeMaps(){
    calcSurprise()
    rnd_gen = +sessionStorage.getItem('lrValue')
	checkData = data

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

function getCountyByFips(fips) {
		for (let iter = 0; iter < data.length; iter++) {
			if (+data[iter].fips == fips){
				return iter;
			}
		}
}

function removeRow(id){
    row = ""
	index = counties.indexOf(+id);
	counties.splice(index, 1)
	document.getElementById("rowCounties").innerHTML = ""
	counties.forEach(function(county){
		row += '<td class="tblText" id= "' + county + '">&emsp;' + data[getCountyByFips(county)].recip_county + '&nbsp;<button class="selected" id="' + county + '" type="button" onclick="removeRow(this.id)" data-bs-toggle="tooltip" data-bs-placement="bottom" title="Click to Remove County" class="form-control btn-danger" style="font-size: 12px;">Remove</button></td>'
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
		colorScale = d3.scaleQuantile()
						.domain([0, 0.4, 0.5, 0.6, 0.7, 0.8, 1])
						.range(colorsChoropleth);
		section = d3.select("#visualsx")
		section.classed("svg-containerx", true) 
		
        legendTextureA = createTexture('#2f7264')
		legendTextureB = createTexture('#6fa194')
		legendTextureC = createTexture('#b3d0c7')
		legendTextureD = createTexture('#efdbcb')
		legendTextureE = createTexture('#dba788')
		legendTextureF = createTexture('#c77560')
	} else { //map surprise
		colorScale = d3.scaleQuantile() //manual scale 
							.domain([-0.015, 0.031])
							.range(palette);
		section = d3.select("#visualsx")
		colorScale
			.range()
				.map(d => {
				let inverted = colorScale.invertExtent(d);
				return inverted
			})
						
			legendTextureG = createTexture('#c47464')
            legendTextureH = createTexture('#dba788')
            legendTextureI = createTexture('#efdbcb')
            legendTextureJ = createTexture('#f7f7f7')
            legendTextureK = createTexture('#dae2e0')
            legendTextureL = createTexture('#abc7c1')
            legendTextureM = createTexture('#96b9b1')
            legendTextureN = createTexture('#80aba1')
            legendTextureO = createTexture('#6b9d92')
            legendTextureP = createTexture('#568f82')
            legendTextureQ = createTexture('#2c7363')
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
    if (mapType == 0) { //Map Choropleth 
		d3.select("#zoom_in").on("click", function() {
			zoomCount += 1
			zoom.scaleBy(svg.transition().duration(250), 1.6);
			document.getElementById("zoom_out").disabled = false

			if (zoomCount == 5)
				document.getElementById("zoom_in").disabled = true 
			 d3.select("#csvg").call(zoom)
				.on('wheel.zoom', null)
				.on('dblclick.zoom', function(d){
					d3.select("#zoom_in").dispatch('click')
				})
		  });
		
		d3.select("#zoom_out").on("click", function() {
			zoomCount -= 1
			zoom.scaleBy(svg.transition().duration(250), 0.6);
			if (zoomCount == 0){
				document.getElementById("zoom_out").disabled = true
				d3.select("#csvg").call(zoom)
					.on('wheel.zoom', null)
					.on('dblclick.zoom', function(d){
						d3.select("#zoom_in").dispatch('click')
					})
					.on("touchstart.zoom", null)
					.on("touchmove.zoom", null)
					.on("touchend.zoom", null);
			}
			if (zoomCount == 4){
				document.getElementById("zoom_in").disabled = false
			}
		  });
	} else { // Map Surprise
         d3.select("#zoom_in").on("click", function() {
			zoomCount += 1
			zoom.scaleBy(svg.transition().duration(250), 1.6);
			document.getElementById("zoom_out").disabled = false

			if (zoomCount == 5)
				document.getElementById("zoom_in").disabled = true 
			 d3.select("#ssvg").call(zoom)
				.on('wheel.zoom', null)
				.on('dblclick.zoom', function(d){
					d3.select("#zoom_in").dispatch('click')
				})
		  });
		
		d3.select("#zoom_out").on("click", function() {
			zoomCount -= 1
			zoom.scaleBy(svg.transition().duration(250), 0.6);
			if (zoomCount == 0){
				document.getElementById("zoom_out").disabled = true
				d3.select("#ssvg").call(zoom)
					.on('wheel.zoom', null)
					.on('dblclick.zoom', function(d){
						d3.select("#zoom_in").dispatch('click')
					})
					.on("touchstart.zoom", null)
					.on("touchmove.zoom", null)
					.on("touchend.zoom", null);
			}
			if (zoomCount == 4){
				document.getElementById("zoom_in").disabled = false
			}
		  });
	}
	
	svg.call(texture) //Change these one should not affect the other	
	if (mapType == 0) {
		svg.call(legendTextureA)
		svg.call(legendTextureB)   
		svg.call(legendTextureC)   
		svg.call(legendTextureD)
		svg.call(legendTextureE)
		svg.call(legendTextureF)
	} else {
		svg.call(legendTextureG)
		svg.call(legendTextureH)
		svg.call(legendTextureI)
		svg.call(legendTextureJ)
		svg.call(legendTextureK)
		svg.call(legendTextureL)
		svg.call(legendTextureM)
		svg.call(legendTextureN)
		svg.call(legendTextureO)
		svg.call(legendTextureP)
		svg.call(legendTextureQ)
	}

	//DRAWING COUNTIES
	geojson = topojson.feature(geoData, geoData.objects.counties)
	setSurprise(geojson);
	let path = d3.geoPath(d3.geoIdentity().translate([100, 0]).scale(0.7)) //Change size of map
  
	g.selectAll("path")
		.data(geojson.features)
		.enter()
		.append("path")
			.attr("d", path)
			.attr("id", function(d) { if (mapType == 0) 
										return d.id + 'c'
									  else 
										return d.id + 's'
			}) 
			.attr("stroke", "#FFF")
			.attr("stroke-width", .3)
            .attr("class", (d) => {
				let cdata 
				if (mapType == 0) {
					cdata = checkData[getCountyByFips(d.id)].series_complete_pop_pct
					if (cdata >= 0.8)
						return 'classA'
					else if ((cdata >= 0.7) && (cdata < 0.8)) 
						return 'classB'
					else if ((cdata >= 0.6) && (cdata < 0.7)) 
						return 'classC'
					else if ((cdata >= 0.5) && (cdata < 0.6)) 
						return 'classD'
					else if ((cdata >= 0.4) && (cdata < 0.5)) 
						return 'classE'
					else if ((cdata > 0) && (cdata < 0.4)) 
						return 'classF'
				} else {
					cdata = +d.properties.Surprise.toFixed(3)
					if ((cdata == 0) && (data[getCountyByFips(+d.id)].series_complete_pop_pct == 0))					
						return 'classZ'
					else if (cdata <= -0.011)
						return 'classG'
					else if ((cdata > -0.011) && (cdata < -0.0066)) 
						return 'classH'
					else if ((cdata >= -0.0066) && (cdata < -0.0025)) 
						return 'classI'
					else if ((cdata >= -0.0025) && (cdata < 0.0017)) 
						return 'classJ'
					else if ((cdata >= 0.0017) && (cdata < 0.0059)) 
						return 'classK'
					else if ((cdata > 0.0059) && (cdata <= 0.01)) 
						return 'classL'
						else if ((cdata >= 0.01) && (cdata <= 0.01427)) 
						return 'classM'
					else if ((cdata > 0.01427) && (cdata <= 0.01855)) 
						return 'classN'
					else if ((cdata > 0.01855) && (cdata <= 0.0226)) 
						return 'classO'
					else if ((cdata > 0.0226) && (cdata <= 0.0268)) 
						return 'classP'
					else if (cdata > 0.0268) 
						return 'classQ'
				}
            })
			.attr("fill", (d) => {  if (mapType == 0) {
										let cdata = data[getCountyByFips(d.id)].series_complete_pop_pct
										if ((cdata != 0) && !isNaN(cdata)){												
											return colorScale(cdata)
										}
										else {
											return texture.url();
										}
									} else {
										if (getCountyDataByFips(d.id) && !isNaN(data[getCountyByFips(d.id)].series_complete_pop_pct))
											return colorScale(+d.properties.Surprise.toFixed(3))
										else 
											return texture.url();
									}
								 })
			.attr("data-fips", (d) => d.id)
			.attr("data-vaccinations", (d) => {(mapType == 0) ? +data[getCountyByFips(d.id)].series_complete_pop_pct : +d.properties.Surprise})
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

	let tooltips = d3.select("body")
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
			if (count == 5){
				document.getElementById('icon').classList.add('fa-shake');
			}
			if (expType == 1 && data[getCountyByFips(el.id)].series_complete_pop_pct != 0){
				let county = data[getCountyByFips(el.id)].recip_county
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
				.attr("data-vaccinations", `${data[county].series_complete_pop_pct}`)
				.html(function(){
					if (data[county].series_complete_pop_pct == 0 || (isNaN(data[county].series_complete_pop_pct)))
						return `No data available`
					else
						return `<b><p style="text-align: left; margin: 0px; padding: 0px; background-color: white;">${data[county].recip_county} (${data[county].recip_state})</p></b>
					<table style="width: 100%; margin-top: 0px; padding: 0px;"><tr style="border-bottom: 0.8px solid black;"><td>Vacc Rate</td><td>Surprise</td><td>Population</td></tr><tr><td style="font-size: 12px;">${data[county].series_complete_pop_pct.toFixed(2)}</td><td style="font-size: 12px;">${data[county].surprise.toFixed(3)}</td><td style="font-size: 12px;">${data[county].census2019}</td></tr></table>`
				})

		if (rnd_gen % 2 != 0) {
			document.getElementById(el.id + 's').parentElement.appendChild(document.getElementById(el.id + 's'))
			document.getElementById(el.id + 's').style.stroke = 'black'
		} else {
			document.getElementById(el.id + 'c').parentElement.appendChild(document.getElementById(el.id + 'c'))
			document.getElementById(el.id + 'c').style.stroke = 'black'
		}

	}}

	function handleMouseOut(el) {
		let county = getCountyByFips(el.id);
		mouseIdleTime = new Date().getTime() - mouseStartTime
		if (mouseIdleTime >= 120){
			mouseLog.push({'state':data[county].recip_state,'county': data[county].recip_county, 'fips': el.id, 'vacc-rate': data[county].series_complete_pop_pct.toFixed(2),'surprise': data[county].surprise.toFixed(3), 'idle_duration': mouseIdleTime})
		}
		tooltip
				.transition()
				.style("opacity", 0)
		tooltip
				.style("left", "-1000px")  
				.style("top", "-1000px")  
				
		tooltips
				.transition()
				.style("opacity", 0)
		tooltips
				.style("left", "-1000px")  
				.style("top", "-1000px") 

		if (rnd_gen % 2 == 0)
			document.getElementById(el.id + 'c').style.stroke = 'white'
		else
			document.getElementById(el.id + 's').style.stroke = 'white'
	}

	function handleMouseMove(el) {
		tooltip
				.style("left", d3.event.pageX + 10 + "px")
				.style("top", d3.event.pageY + 10 + "px")
	}
	// END TOOLTIP

 

	// START LEGEND CHOROPLETH
	if (mapType == 0) {
	var keys = ['0 - 0.4', '0.4 - 0.5', '0.5 - 0.6', '0.6 - 0.7', '0.7 - 0.8', '0.8 +']

   svg.append('rect')
    .attr('width', 140)
    .attr('height', 152)
    .attr('fill', '#FAFAFA')
    .style('opacity', 0.6)
    .attr("transform", "translate(" + 670 + "," + 398 + ")")
	
	var size = 10
	svg.selectAll("mydots")
	  .data(keys)
	  .enter()
	  .append("rect")
        .attr('id', 'legendRect')
		.attr("x", 700)
		.attr("y", function(d,i){ return 420 + i * (size+5)})  
		.attr("width", size)
		.attr("height", size)
		.style("fill", function(d){ return colorScale(+d.split(' ')[0])})
       .on('click', clicked)

	svg.selectAll("mylabels")
	  .data(keys)
	  .enter()
	  .append("text")
		.attr("x", 705 + size*1.2)
		.attr("y", function(d,i){ return 422 + i*(size+5) + (size/2)})  
		.text(function(d){ return d})
		.attr("text-anchor", "left")
		.style("font-size", "12px")
		.style("alignment-baseline", "middle")
		
	svg.append("text")
		.attr("x", 745)
		.attr("y", 410)
		.style("text-anchor", "middle")
		.style("font-size", "12px")
		.text("Vaccination Rate");	

    let itemClicked = null, rectColor

    function clicked(el){
        d3.selectAll('#legendRect').style('opacity', 1)
        if (itemClicked != null){
            d3.selectAll(itemClicked)
                .attr('fill', rectColor)
        }
        
        d3.select(this).style('opacity',0.2)
        if (el == '0.8 +'){
            d3.selectAll('.classA')
                .attr('fill', legendTextureA.url())
            itemClicked = '.classA'
        } else if (el == '0.7 - 0.8'){
            d3.selectAll('.classB')
                .attr('fill', legendTextureB.url())
            itemClicked = '.classB'
        } else if (el == '0.6 - 0.7'){
            d3.selectAll('.classC')
                .attr('fill', legendTextureC.url())    
            itemClicked = '.classC'   
        } else if (el == '0.5 - 0.6'){
            d3.selectAll('.classD')
                .attr('fill', legendTextureD.url())
            itemClicked = '.classD'
        } else if (el == '0.4 - 0.5'){
            d3.selectAll('.classE')
                 .attr('fill', legendTextureE.url())
            itemClicked = '.classE'
        } else if (el == '0 - 0.4'){
            d3.selectAll('.classF')
                .attr('fill', legendTextureF.url())
            itemClicked = '.classF'
        }
        rectColor = colorScale(+el.split(' ')[0])
    }} else { //make density plot
		makeDensityPlot(checkSurprise, colorScale, svg)
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
			checkSurprise.push(+surprise.toFixed(4)); //To find max and min
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

function removeValues(){
	for( var i = 0; i < checkSurprise.length; i++){ 
        if ((checkSurprise[i] < -0.025) || (checkSurprise[i] > 0.085)) { 
            checkSurprise.splice(i, 1); 
        }
    }
}

function setSurprise(){
	for (var x = 0; x < surpriseData.length; x++){
		for (var y = 0; y < 3142; y++){
			if (surpriseData[x].fips == geojson.features[y].id){
				geojson.features[y].properties["Surprise"] = surpriseData[x].surprise
			}
		}
	}
}

function makeDensityPlot(data, colorScale, svg) {
  var margin = {top: 70, right: 10, bottom: 20, left: 460},
    width = 1050 - margin.left - margin.right,
    height = 200 - margin.top - margin.bottom;
  removeValues();

  var svgx = svg.append("svg")
		.attr("y", "290")
		.attr("x", "180")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
		.append("g")            
		.attr("transform", "translate(" + 470 + "," + margin.top + ")") //move density plot

  var x = d3.scaleLinear() //density plot scale
      .domain([d3.extent(checkSurprise)[0] * 10000, d3.extent(checkSurprise)[1] * 10000])      
      .range([0, width]);    

  var axisGenerator = d3.axisBottom(x)
					    .tickSizeOuter(0)
						.tickSize(5)
						.tickFormat(function(d) {
							if ((d / 10000) == 0.03)
							  return `0.03+`
							else 
							  return `${d / 10000}`						 
						})
  
  let xAxis =  svgx.append("g")
                .attr("transform", "translate(0,110)")
				.call(axisGenerator);

  xAxis.selectAll(".domain")
	   .attr("opacity",".0");
  var x2 = d3.scaleLinear() //bar chart scale
      .domain(d3.extent(checkSurprise))      
      .range([0, width]);
  svgx.append("g")
      .attr("transform", "translate(0," + height + ")")
 
 let legendScale = d3.scaleLinear()
		.domain(d3.extent(checkSurprise))
		.range([0, width])

  var histogram = d3.histogram()
      .domain(x2.domain())   
      .value(function(d) { return d; })   
      .thresholds(x2.ticks(70));  

   
  var bins = histogram(data);
  var kde = kernelDensityEstimator(kernelEpanechnikov(7), x.ticks(70))
  var density =  kde( data.map(function(d){  return +d * 10000; }) )
  
  var y = d3.scaleLinear()
      .range([height, 0]);
      y.domain([0, d3.max(bins, function(d) { return +d.length; })]);   

  var y2 = d3.scaleLinear()
            .range([height, 0])
            .domain(d3.extent(density.map(function(d){ return +d[1]; })));
  svgx.append("g")
 
  svgx.selectAll("rect")
      .data(bins)
      .enter()
      .append("rect")
        .attr("x", 1)
        .attr("transform", function(d) { return "translate(" + x2(d.x0) + "," + y(d.length) + ")"; })
        .attr("width", function(d) { return x2(d.x1) - x2(d.x0) - 1 ; })
        .attr("height", function(d) { return height - y(d.length); })
        .style("fill", "#d5d5d6");
		
   svgx.append("path")
      .datum(density)
      .attr("fill", "#ADAD7B")
      .attr("opacity", ".8")
      .attr("stroke", "#000")
      .attr("stroke-width", 1)
      .attr("stroke-linejoin", "round")
      .attr("d",  d3.area()
        .curve(d3.curveBasis)
          .x(function(d) { return x(d[0]); })
          .y(function(d) { return y2(d[1]); })
      );

//append bottom color scale
var x = d3.scaleLinear()
    .domain(d3.extent(checkSurprise))
    .range([0, width]);

svg.append('g').attr("id","cScale").attr("transform", "translate(652,490)"); //move bar

var g = d3.select("#cScale") 			

g.select(".domain").remove();

g.selectAll("rect")
  .data(colorScale.range().map(function(color) {
    var d = colorScale.invertExtent(color);
    //console.log(d)
    if (d[0] == null) d[0] = x.domain()[0];
    if (d[1] == null) d[1] = x.domain()[1];
    return d;
  }))
  .enter().insert("rect", ".tick")
    .attr('id', 'legendRect')
    .attr("height", 8)
    .attr("x", function(d) { return x(d[0]); })
    .attr("width", function(d) { return x(d[1]) - x(d[0]); })
    .attr("fill", function(d) { return colorScale(d[0]); })
    .on('click', clicked)
	
let itemClicked = null, rectColor

function clicked(el){
    d3.selectAll('#legendRect').style('opacity', 1)
    if (itemClicked != null){
        d3.selectAll(itemClicked)
            .attr('fill', rectColor)
    }

    d3.select(this).style('opacity',0.2)
    rectClicked = this
        if (el[0].toFixed(3) <= -0.015){
            d3.selectAll('.classG')
                .attr('fill', legendTextureG.url())
            itemClicked = '.classG'
            rectColor = palette[0]
        } else if (el[0].toFixed(3) == -0.011){
            d3.selectAll('.classH')
                .attr('fill', legendTextureH.url())
            itemClicked = '.classH'
            rectColor = palette[1]
        } else if (el[0].toFixed(3) == -0.007){
            d3.selectAll('.classI')
                .attr('fill', legendTextureI.url())   
            itemClicked = '.classI'
            rectColor = palette[2]
        } else if (el[0].toFixed(3) == -0.002){
            d3.selectAll('.classJ')
                .attr('fill', legendTextureJ.url())
            itemClicked = '.classJ'
            rectColor = palette[3]
        } else if (el[0].toFixed(3) == 0.002){
            d3.selectAll('.classK')
                 .attr('fill', legendTextureK.url())
            itemClicked = '.classK'
            rectColor = palette[4]
        } else if (el[0].toFixed(3) == 0.006){
            d3.selectAll('.classL')
                .attr('fill', legendTextureL.url())
            itemClicked = '.classL'
            rectColor = palette[5]
        } else if (el[0].toFixed(3) == 0.010){
            d3.selectAll('.classM')
                .attr('fill', legendTextureM.url())
            itemClicked = '.classM'
            rectColor = palette[6]
        } else if (el[0].toFixed(3) == 0.014){
            d3.selectAll('.classN')
                .attr('fill', legendTextureN.url())   
            itemClicked = '.classN' 
            rectColor = palette[7]
        } else if (el[0].toFixed(3) == 0.018){
            d3.selectAll('.classO')
                .attr('fill', legendTextureO.url())
            itemClicked = '.classO'
            rectColor = palette[8]
        } else if (el[0].toFixed(3) == 0.023){
            d3.selectAll('.classP')
                 .attr('fill', legendTextureP.url())
            itemClicked = '.classP'
            rectColor = palette[9]
        } else if (el[0].toFixed(3) >= 0.027){
            d3.selectAll('.classQ')
                .attr('fill', legendTextureQ.url())
            itemClicked = '.classQ'
            rectColor = palette[10]
        }
}

g.selectAll("text")
	.attr("y", 0)
	.attr("x", 12)
	.attr("dy", ".35em")
	.attr("transform", "rotate(90)")
	.style("text-anchor", "start");
}



function createTexture(color){
	return textures.lines()
                .orientation("vertical", "horizontal")
                .size(4)
                .strokeWidth(0.5)
                .shapeRendering("crispEdges")
                .stroke("black")
                .background(color)
}

