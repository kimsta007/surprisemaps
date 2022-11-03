let data, geoData, popn, checkData, geojson;
let population = {}, surpriseData = [], checkSurprise = [];
let count = 0, row = "", counties = []
let legendTextureA, legendTextureB, legendTextureC, legendTextureD, legendTextureE, legendTextureF,
        legendTextureG, legendTextureH, legendTextureI, legendTextureJ, legendTextureK, palette
let mouseStartTime, mouseIdleTime, mouseLog = []
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
	Promise.all([d3.json('../../data/counties.json'), d3.csv('../../data/uspopn.csv')]).then(cleanupData);
});
}

function cleanupData(dte){
	for(let record in dte[1]){
	   popn = [];
	   popn.push(+dte[1][record].ppercentage);
	   population[+dte[1][record].fips] = popn;
	}

	for (let record in data){
		if (data[record].fips != "UNK"){		
			//if (data[record].recip_state == "ID" || data[record].recip_state == "GA" || data[record].recip_state == "VT" || data[record].recip_state == "WV" || data[record].recip_state == "VA"){
			//	data[record].series_complete_pop_pct = 0
			//}
			if (data[record].recip_state == "VT" || data[record].recip_state == "HI"){
				data[record].series_complete_pop_pct = 0
			}
				
			if (data[record].series_complete_pop_pct != 0) {
				data[record].population = +population[+data[record].fips];
				data[record].series_complete_pop_pct = +data[record].series_complete_pop_pct / 100;
				//console.log(data[record].fips + '*' + data[record].recip_county + '*' + data[record].recip_state + '*' + data[record].series_complete_pop_pct)
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
	if (expType == 0){
		document.getElementById('sintro').hidden = "";
		document.getElementById('btnExperiment').hidden = ""
	}
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
  let pMs = [1];
  let pDMs = [];
  let pMDs = [];
  let avg, kl;
  let diffs = [0];
  let s = 0;
      avg = average();
 // console.log(avg, ss.mean(data.map(function(d){ return +d.series_complete_pop_pct; })))
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
			checkSurprise.push(+surprise.toFixed(4)); //To find max and min
			data[iter]['surprise'] = +surprise
		    surpriseData.push({fips : +data[iter].fips, surprise: +surprise})
	  }}
    }
}

function setSurprise(){
	for (var x = 0; x < surpriseData.length; x++){
		for (var y = 0; y < 3142; y++){
			if (surpriseData[x].fips == geojson.features[y].id){
				geojson.features[y].properties["Surprise"] = surpriseData[x].surprise
				console.log(surpriseData[x].fips + '*' + surpriseData[x].surprise)
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

//get all surprise values rank them
//get all actual and rank them 
//find the average - possible ranking

function handleClick(el) {
    if (count == 5){
        document.getElementById('icon').classList.add('fa-shake');
    }
    if (expType == 1  && data[getCountyByFips(el.id)].series_complete_pop_pct != 0){
        let county = data[getCountyByFips(el.id)].recip_county
        if ((count < 5) && (counties.indexOf(county) == -1)){
            row += '<tr><td class="tblText">' + county + '</td><td class="selected" ><button id="' + county + '" type="button" data-bs-toggle="tooltip" data-bs-placement="right" title="Click to Remove County" onclick="removeRow(this.id)" class="form-control btn-danger" style="font-size: 12px;">Remove</button></td></tr>'
            document.getElementById("listOfStates").innerHTML = row;
            count += 1
            counties.push(el.id)
            if (count == 5)
                document.getElementById("btnContinue").disabled = false;
        }
    }
}

function removeRow(id){
    row = ""
	counties.splice(id, 1)
	document.getElementById("listOfStates").innerHTML = ""
	counties.forEach(function(county){
		row += '<tr><td class="tblText">' + data[getCountyByFips(county)].recip_county + '</td><td class="selected"><button type="button" data-bs-toggle="tooltip" data-bs-placement="right" title="Click to Remove County" onclick="removeRow(this.id)" class="form-control btn-danger" style="font-size: 12px;">Remove</button></td></tr>'
	})
	document.getElementById("listOfStates").innerHTML = row;
	count -= 1
	if (count < 5){
			document.getElementById("btnContinue").disabled = true;
            document.getElementById('icon').classList.remove('fa-shake');
    }
}

function drawGraph() {
	/*var colorScale = d3.scaleQuantile()
						.domain(d3.extent(checkSurprise))
						.range(colorbrewer.RdBu[11].reverse());*/

    //['#053061', '#2166ac', '#4393c3', '#92c5de', '#d1e5f0', '#f7f7f7', '#fddbc7', '#f4a582', '#d6604d', '#b2182b', '#67001f']

	/*var colorScale = d3.scaleThreshold() //jenks scale
						.domain(ss.jenks(surpriseData.map(function(d) { return +d.surprise; }), 11))
						.range(colorbrewer.RdBu[11].reverse()); */

	//'#053061', '#2166ac', '#4393c3', '#92c5de', '#d1e5f0', '#f7f7f7', '#fddbc7', '#f4a582', '#d6604d', '#b2182b', '#67001f' -- old colors
	//'#ab755c',	'#bc917d',	'#cdac9d',	'#ddc8be',	'#eee3de',	'#f7f7f7',	'#dae2e0',	'#b5c5c0',	'#90a9a1',	'#6b8c81',	'#466f62' -- ny times values
	//'#674637',	'#d5baae',	'#f7f7f7', '#dae2e0', '#a2b6b2',	'#8fa7a2',	'#698983',	'#577b74',	'#446c64',	'#365650',	'#1b2b28' -- mines
	//'#c47464',	'#efdbcb',	'#f7f7f7', '#dae2e0', '#abc7c1',	'#96b9b1',	'#80aba1',	'#6b9d92',	'#568f82',	'#418173',	'#2c7363' -- lane approved
	var dRange, colorScale
		dRange = d3.range(-0.025, 0, 0.025 / 3).slice(1).concat([-0.001]).concat(d3.range(0.001, 0.1 ,  0.1/ 8));
		palette = ['#c47464', '#dba788','#efdbcb', '#f7f7f7', '#dae2e0', '#abc7c1',	'#96b9b1',	'#80aba1',	'#6b9d92',	'#568f82',	'#2c7363'];
		colorScale = d3.scaleThreshold() //manual scale 
							.domain(dRange)
							.range(palette);
	
	let colorRange = colorScale
		.range()
	  .map(d => {
	    let inverted = colorScale.invertExtent(d);
		return inverted
	  })

	const width = 950;
	const height = 525;
	
	let section = d3.select("#visualsurprise")

	let svg = section
		.append("svg")
			.attr("preserveAspectRatio", "xMinYMin meet")
			.attr("class","svg-content")
			.attr("width", width)
			.attr("height", height)
	
    let zoom = d3.zoom()
            .scaleExtent([1, 8])
            .on('zoom', zoomed);
    svg.call(zoom)
            .on('wheel.zoom', null)
            .on("dblclick.zoom", null);

    d3.select("#zoom_in").on("click", function() {
        zoom.scaleBy(svg.transition().duration(650), 1.2);
        document.getElementById("zoom_out").disabled = false
        document.getElementById("zoom_cancel").disabled = false
      });

    d3.select("#zoom_out").on("click", function() {
        zoom.scaleBy(svg.transition().duration(650), 0.8);
        if (d3.zoomTransform(svg.node()).k <= 1.2){
            document.getElementById("zoom_out").disabled = true
            document.getElementById("zoom_cancel").disabled = true
        }
      });

    d3.select("#zoom_cancel").on("click", function() {
        zoom.scaleBy(svg.transition().duration(650), -8);
        document.getElementById("zoom_out").disabled = true
        document.getElementById("zoom_cancel").disabled = true
    });

    let g = svg.append('g')
 
    const texture = textures.lines()
                            .size(4)
                            .lighter()
                            .strokeWidth(1)
                            .stroke('red')
                            .shapeRendering("crispEdges");
            legendTextureA = textures.lines()
                            .orientation("vertical", "horizontal")
                            .size(4)
                            .strokeWidth(0.5)
                            .shapeRendering("crispEdges")
                            .stroke("black")
                            .background('#c47464')
            legendTextureB = textures.lines()
                            .orientation("vertical", "horizontal")
                            .size(4)
                            .strokeWidth(0.5)
                            .shapeRendering("crispEdges")
                            .stroke("black")
                            .background('#dba788')
            legendTextureC = textures.lines()
                            .orientation("vertical", "horizontal")
                            .size(4)
                            .strokeWidth(0.5)
                            .shapeRendering("crispEdges")
                            .stroke("black")
                            .background('#efdbcb')
            legendTextureD = textures.lines()
                            .orientation("vertical", "horizontal")
                            .size(4)
                            .strokeWidth(0.5)
                            .shapeRendering("crispEdges")
                            .stroke("black")
                            .background('#f7f7f7')
            legendTextureE = textures.lines()
                            .orientation("vertical", "horizontal")
                            .size(4)
                            .strokeWidth(0.5)
                            .shapeRendering("crispEdges")
                            .stroke("black")
                            .background('#dae2e0')
            legendTextureF = textures.lines()
                            .orientation("vertical", "horizontal")
                            .size(4)
                            .strokeWidth(0.5)
                            .shapeRendering("crispEdges")
                            .stroke("black")
                            .background('#abc7c1')
            legendTextureG = textures.lines()
                            .orientation("vertical", "horizontal")
                            .size(4)
                            .strokeWidth(0.5)
                            .shapeRendering("crispEdges")
                            .stroke("black")
                            .background('#96b9b1')
            legendTextureH = textures.lines()
                            .orientation("vertical", "horizontal")
                            .size(4)
                            .strokeWidth(0.5)
                            .shapeRendering("crispEdges")
                            .stroke("black")
                            .background('#80aba1')
            legendTextureI = textures.lines()
                            .orientation("vertical", "horizontal")
                            .size(4)
                            .strokeWidth(0.5)
                            .shapeRendering("crispEdges")
                            .stroke("black")
                            .background('#6b9d92')
            legendTextureJ = textures.lines()
                            .orientation("vertical", "horizontal")
                            .size(4)
                            .strokeWidth(0.5)
                            .shapeRendering("crispEdges")
                            .stroke("black")
                            .background('#568f82')
            legendTextureK = textures.lines()
                            .orientation("vertical", "horizontal")
                            .size(4)
                            .strokeWidth(0.5)
                            .shapeRendering("crispEdges")
                            .stroke("black")
                            .background('#2c7363')
        
    svg.call(texture)
    svg.call(legendTextureA)
    svg.call(legendTextureB)
    svg.call(legendTextureC)
    svg.call(legendTextureD)
    svg.call(legendTextureE)
    svg.call(legendTextureF)
    svg.call(legendTextureG)
    svg.call(legendTextureH)
    svg.call(legendTextureI)
    svg.call(legendTextureJ)
    svg.call(legendTextureK)
    

	//DRAWING COUNTIES
    geojson = topojson.feature(geoData, geoData.objects.counties)
    setSurprise()
	let path = d3.geoPath(d3.geoIdentity().translate([40, 0]).scale(0.8));
	g.selectAll("path")
		.data(geojson.features)
		.enter()
		.append("path")
			.attr("d", path)
            .attr("id", (d) => {
                let cdata = +d.properties.Surprise.toFixed(3)
				if ((cdata == 0) && (data[getCountyByFips(+d.id)].series_complete_pop_pct == 0))					
					return 'classZ'
				else if (cdata <= -0.017)
                    return 'classA'
                else if ((cdata >= -0.017) && (cdata < -0.008)) 
                    return 'classB'
                else if ((cdata >= -0.008) && (cdata < -0.001)) 
                    return 'classC'
                else if ((cdata >= -0.001) && (cdata < 0.001)) 
                    return 'classD'
                else if ((cdata >= 0.001) && (cdata < 0.0135)) 
                    return 'classE'
                else if ((cdata > 0.0135) && (cdata <= 0.026)) 
                    return 'classF'
                    else if ((cdata >= 0.026) && (cdata <= 0.0385)) 
                    return 'classG'
                else if ((cdata > 0.0385) && (cdata <= 0.051)) 
                    return 'classH'
                else if ((cdata > 0.051) && (cdata <= 0.0635)) 
                    return 'classI'
                else if ((cdata > 0.0635) && (cdata <= 0.076)) 
                    return 'classJ'
                else if (cdata > 0.076) 
                    return 'classK'
            })
			.attr("class", "county")
			.attr("stroke", "#FFF")
			.attr("stroke-width", .3)
			.attr("fill", function(d) { 
						if (getCountyDataByFips(d.id))
							return colorScale(+d.properties.Surprise.toFixed(3))
						else 
							return texture.url();
			})
			.attr("data-fips", (d) => d.id)
			.attr("data-vaccinations", (d) => +d.properties.Surprise)
			.on("mouseover", handleMouseOver)
			.on("mosemove", handleMouseMove)
			.on("mouseout", handleMouseOut)
			.on("click", handleClick)
    


	//DRAWING BORDERS
  let borders = g.append("path")
	  	.classed("stateBorder", true)
	  	.attr("fill", "none")
	  	.attr("stroke", "white")
    .datum(topojson.mesh(geoData, geoData.objects.states), (a, b) => a !== b)
    	.attr('d', path)

  let x = g.append('g')
        .attr('class','hstates')

    switch (expType){
            case 2: {
                x.append("path")
                .attr("fill", "none")
            .attr("stroke", "#E4FF54")
            .attr("stroke-width", 2)
            .datum(topojson.mesh(geoData, geoData.objects.states.geometries[13]), (a, b) => a !== b)
            .attr('d', path)
                 
        x.append("path")
                .attr("fill", "none")
            .attr("stroke", "#E4FF54")
            .attr("stroke-width", 2)
            .datum(topojson.mesh(geoData, geoData.objects.states.geometries[35]), (a, b) => a !== b)
            .attr('d', path)
   
        x.append('g')
           .selectAll('circle')
           .data(geojson.features)
           .enter()
           .append('svg:circle')
           .attr("cx", function(d){
               if (+d.id == 48003 || +d.id == 32003)
                   return path.centroid(d)[0];
           })
           .attr("cy", function(d){
               if (+d.id == 48003 || +d.id == 32003)
                   return  path.centroid(d)[1];
           })
           .attr('r', 15)
           .style('fill', function(d) {
               if (+d.id == 48003 || +d.id == 32003)
                   return 'black'
               else 
                   return 'white'})
   
           
        x.append("g")
            .selectAll("text")
            .data(geojson.features)
            .enter()
            .append("svg:text")
            .text(function(d){
            if (+d.id == 32003)
                return 'A';
            else if (+d.id == 48003)
                return 'B';
            })
            .attr("x", function(d){
                return path.centroid(d)[0];
            })
            .attr("y", function(d){
                return  path.centroid(d)[1] + 5;
            })
            .attr("text-anchor","middle")
            .attr('fill', 'white')
            .style('font-weight', 'bold')
            .style("font-size", "16px")
            } break;
            case 3: {
             x.append("path")
                     .attr("class", "stateX")
                     .attr("fill", "none")
                 .attr("stroke", "#E4FF54")
                 .attr("stroke-width", 2)
                 .datum(topojson.mesh(geoData, geoData.objects.states.geometries[21]), (a, b) => a !== b)
                 .attr('d', path)
           
             x.append("path")
                     .attr("class", "stateY")
                     .attr("fill", "none")
                 .attr("stroke", "#E4FF54")
                 .attr("stroke-width", 2)
                 .datum(topojson.mesh(geoData, geoData.objects.states.geometries[5]), (a, b) => a !== b)
                 .attr('d', path)
                 
             x.append("path")
                     .attr("class", "stateZ")
                     .attr("fill", "none")
                 .attr("stroke", "#E4FF54")
                 .attr("stroke-width", 2)
                 .datum(topojson.mesh(geoData, geoData.objects.states.geometries[4]), (a, b) => a !== b)
                 .attr('d', path)
     
                 x.append("path")
                 .attr("class", "stateX")
                 .attr("fill", "none")
             .attr("stroke", "#E4FF54")
             .attr("stroke-width", 2)
             .datum(topojson.mesh(geoData, geoData.objects.states.geometries[21]), (a, b) => a !== b)
             .attr('d', path)
       
         x.append("path")
                 .attr("class", "stateY")
                 .attr("fill", "none")
             .attr("stroke", "#E4FF54")
             .attr("stroke-width", 2)
             .datum(topojson.mesh(geoData, geoData.objects.states.geometries[5]), (a, b) => a !== b)
             .attr('d', path)
             
         x.append("path")
                 .attr("class", "stateZ")
                 .attr("fill", "none")
             .attr("stroke", "##E4FF54")
             .attr("stroke-width", 2)
             .datum(topojson.mesh(geoData, geoData.objects.states.geometries[4]), (a, b) => a !== b)
             .attr('d', path)
    
         x.append('g')
             .selectAll('circle')
             .data(geojson.features)
             .enter()
             .append('svg:circle')
             .attr("cx", function(d){
                 if (+d.id == 46103 || +d.id == 42051 || +d.id == 1047)
                     return path.centroid(d)[0];
             })
             .attr("cy", function(d){
                if (+d.id == 46103 || +d.id == 42051 || +d.id == 1047)
                     return  path.centroid(d)[1];
             })
             .attr('r', 15)
             .style('fill', function(d) {
                if (+d.id == 46103 || +d.id == 42051 || +d.id == 1047)
                     return 'black'
                 else 
                     return 'white'})
     
    
         x.append("g")
             .selectAll("text")
             .data(geojson.features)
             .enter()
             .append("svg:text")
             .text(function(d){
             if (+d.id == 46103)
                 return 'A'
             else if (+d.id == 42051)
                 return 'B'
             else if (+d.id == 1047)
                 return 'C'
             })
             .attr("x", function(d){
                 return path.centroid(d)[0];
             })
             .attr("y", function(d){
                 return  path.centroid(d)[1] + 5;
             })
             .attr("text-anchor","middle")
             .attr('fill', 'white')
             .style("font-size", "16px")
             .style("font-weight", "bold")    
     
            } break;
            case 4:{
             x.append("path")
                     .attr("class", "state1")
                     .attr("fill", "none")
                 .attr("stroke", "#E4FF54")
                 .attr("stroke-width", 2)
                 .datum(topojson.mesh(geoData, geoData.objects.states.geometries[4]), (a, b) => a !== b)
                 .attr('d', path)
                 
             x.append("path")
                     .attr("class", "state2")
                     .attr("fill", "none")
                 .attr("stroke", "#E4FF54")
                 .attr("stroke-width", 2)
                 .datum(topojson.mesh(geoData, geoData.objects.states.geometries[24]), (a, b) => a !== b)
                 .attr('d', path)
                 
             x.append("path")
                     .attr("class", "state3")
                     .attr("fill", "none")
                 .attr("stroke", "#E4FF54")
                 .attr("stroke-width", 2)
                 .datum(topojson.mesh(geoData, geoData.objects.states.geometries[38]), (a, b) => a !== b)
                 .attr('d', path)
                 
             x.append("path")
                     .attr("class", "state4")
                     .attr("fill", "none")
                 .attr("stroke", "#E4FF54")
                 .attr("stroke-width", 2)
                 .datum(topojson.mesh(geoData, geoData.objects.states.geometries[42]), (a, b) => a !== b)
                 .attr('d', path)
     
             x.append("path")
                     .attr("class", "state5")
                     .attr("fill", "none")
                 .attr("stroke", "#E4FF54")
                 .attr("stroke-width", 2)
                 .datum(topojson.mesh(geoData, geoData.objects.states.geometries[29]), (a, b) => a !== b)
                 .attr('d', path)
                 
             x.append("path")
                     .attr("class", "state6")
                     .attr("fill", "none")
                 .attr("stroke", "#E4FF54")
                 .attr("stroke-width", 2)
                 .datum(topojson.mesh(geoData, geoData.objects.states.geometries[22]), (a, b) => a !== b)
                 .attr('d', path)
                 
             x.append("path")
                     .attr("class", "state6")
                     .attr("fill", "none")
                 .attr("stroke", "#E4FF54")
                 .attr("stroke-width", 2)
                 .datum(topojson.mesh(geoData, geoData.objects.states.geometries[7]), (a, b) => a !== b)
                 .attr('d', path)
     
                 x.append('g')
                 .selectAll('circle')
                 .data(geojson.features)
                 .enter()
                 .append('svg:circle')
                 .attr("cx", function(d){
                     if (+d.id == 5079 || +d.id == 21099 || +d.id == 51031 || +d.id == 45043
                        || +d.id == 1003 || +d.id == 13191 || +d.id == 12103)
                         return path.centroid(d)[0];
                 })
                 .attr("cy", function(d){
                    if (+d.id == 5079 || +d.id == 21099 || +d.id == 51031 || +d.id == 45043 || +d.id == 13191 || +d.id == 12103 || +d.id == 1003)
                         return  path.centroid(d)[1];
                 })
                 .attr('r', 12)
                 .style('fill', function(d) {
                    if (+d.id == 5079 || +d.id == 21099 || +d.id == 51031 || +d.id == 45043
                        || +d.id == 1003 || +d.id == 13191 || +d.id == 12103)
                         return 'black'
                     else 
                         return 'white'})
        
        
             x.append("g")
                 .selectAll("text")
                 .data(geojson.features)
                 .enter()
                 .append("svg:text")
                 .text(function(d){
                 if (+d.id == 5079)
                     return 'A'
                 else if (+d.id == 21099)
                     return 'B'
                 else if (+d.id == 51031)
                     return 'C'
                 else if (+d.id == 45043)
                     return 'D'
                 else if (+d.id == 1003)
                     return 'E'
                 else if (+d.id == 13191)
                     return 'F'
                 else if (+d.id == 12103)
                     return 'G'
                 })
                 .attr("x", function(d){
                     return path.centroid(d)[0];
                 })
                 .attr("y", function(d){
                     return  path.centroid(d)[1] + 5;
                 })
                 .attr("text-anchor","middle")
                 .attr('fill', 'white')
                 .style("font-size", "11px")
                 .style("font-weight", "bold")
            } break;
            case 5: {
                 x.append("path")
                         .attr("class", "stateX")
                         .attr("fill", "none")
                     .attr("stroke", "#E4FF54")
                     .attr("stroke-width", 2)
                     .datum(topojson.mesh(geoData, geoData.objects.states.geometries[10]), (a, b) => a !== b)
                     .attr('d', path)
                     
                 x.append("path")
                         .attr("class", "stateY")
                         .attr("fill", "none")
                     .attr("stroke", "#E4FF54")
                     .attr("stroke-width", 2)
                     .datum(topojson.mesh(geoData, geoData.objects.states.geometries[14]), (a, b) => a !== b)
                     .attr('d', path)
     
                     x.append('g')
                     .selectAll('circle')
                     .data(geojson.features)
                     .enter()
                     .append('svg:circle')
                     .attr("cx", function(d){
                         if (+d.id == 20193 || +d.id == 38021)
                             return path.centroid(d)[0];
                     })
                     .attr("cy", function(d){
                         if (+d.id == 20193 || +d.id == 38021)
                             return  path.centroid(d)[1];
                     })
                     .attr('r', 15)
                     .style('fill', function(d) {
                         if (+d.id == 20193 || +d.id == 38021)
                             return 'black'
                         else 
                             return 'white'})
             
                     
                  x.append("g")
                      .selectAll("text")
                      .data(geojson.features)
                      .enter()
                      .append("svg:text")
                      .text(function(d){
                      if (+d.id == 20193)
                          return 'A';
                      else if (+d.id == 38021)
                          return 'B';
                      })
                      .attr("x", function(d){
                          return path.centroid(d)[0];
                      })
                      .attr("y", function(d){
                          return  path.centroid(d)[1] + 5;
                      })
                      .attr("text-anchor","middle")
                      .attr('fill', 'white')
                      .style('font-weight', 'bold')
                      .style("font-size", "16px")
                     } break;
         }
     
function zoomed() {
            g
              .selectAll('path') // To prevent stroke width from scaling
              .attr('transform', d3.event.transform);
            x.selectAll('circle').attr('transform', d3.event.transform);
             x.selectAll('text').attr('transform', d3.event.transform);
}
//TOOLTIP
	let tooltip = d3.select("body")
		.append("div")
			.style("opacity", 0)
			.attr("id", "tooltip")
			.style("position", "absolute")
			.style("background-color", '#154360')
			.style("color", "white")
			.style("padding", "10px")
            .style("font-size","11px")
			.style("text-align", "center")
			.style("border-radius", "1%")

	function handleMouseOver(el) {
		mouseStartTime = new Date().getTime()
		let county = getCountyByFips(el.id);
		tooltip
				.transition()
				.style("opacity", 0.8)
		tooltip
				.style("left", d3.event.pageX + 10 + "px")
				.style("top", d3.event.pageY + 10 + "px")
				.attr("data-vaccinations", `${data[county].series_complete_pop_pct}`)
				.html(function(){
					if (data[county].series_complete_pop_pct == 0)
						return `No data available`
					else
						return `${data[county].recip_county} (${data[county].recip_state})<br/> Vacc Rate: ${data[county].series_complete_pop_pct.toFixed(2)}; Surprise: ${data[county].surprise.toFixed(3)}`
				})
		d3.select(this)
				.style("opacity", 0.2)
	}

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
		d3.select(this)
				.style("opacity", 1)
	}

	function handleMouseMove(el) {
		tooltip
				.style("left", d3.event.pageX + 10 + "px")
				.style("top", d3.event.pageY + 10 + "px")
	} 
	// END TOOLTIP
		makeDensityPlot(checkSurprise, colorScale, svg)
}

function makeDensityPlot(data, colorScale, svg) {
var margin = {top: 10, right: 10, bottom: 20, left: 695},
    width = 960 - margin.left - margin.right,
    height = 200 - margin.top - margin.bottom;
 removeValues();
 
 svg.append('rect')
 .attr('width', 340)
 .attr('height', 215)
 .attr('fill', '#FAFAFA')
 .style('opacity', 0.6)
 .attr("transform", "translate(" + 695 + "," + 298 + ")")

  var svgx = svg.append("svg")
		.attr("y", "290")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
		.append("g")            
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")")

  
  var x = d3.scaleLinear()
      .domain(d3.extent(data.map(function(d){ return +d * 10000; })))      
      .range([0, width]);    

  var axisGenerator = d3.axisBottom(x)
					    .tickSizeOuter(0)
						.tickSize(5)
						.tickFormat(function(d) {
							if ((d / 10000) == 0.08)
							  return `0.08+`
							else 
							  return `${d / 10000}`						 
						})
  
  let xAxis =  svgx.append("g")
                .attr("transform", "translate(0,170)")
				.call(axisGenerator);

  xAxis.selectAll(".domain")
	   .attr("opacity",".0");
  
  var x2 = d3.scaleLinear() //bar chart scale
      .domain(d3.extent(data.map(function(d){ return +d; })))      
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
        .style("fill", "#ADAD7B");
		
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

svg.append('g').attr("id","cScale").attr("transform", "translate(695,490)");

var g = d3.select("#cScale") 			

g.select(".domain").remove();

g.selectAll("rect")
  .data(colorScale.range().map(function(color) {
    var d = colorScale.invertExtent(color);
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
    //.on('mouseout', mouseout);
/*
function mouseout(el){
    d3.select(this).style('opacity',1)
    if (el[0].toFixed(3) == -0.024){
        d3.selectAll('#classA')
            .attr('fill', palette[0])
    } else if (el[0].toFixed(3) == -0.017){
        d3.selectAll('#classB')
            .attr('fill', palette[1])
    } else if (el[0].toFixed(3) == -0.008){
        d3.selectAll('#classC')
            .attr('fill', palette[2])       
    } else if (el[0].toFixed(3) == -0.001){
        d3.selectAll('#classD')
            .attr('fill', palette[3])
    } else if (el[0].toFixed(3) == 0.001){
        d3.selectAll('#classE')
             .attr('fill', palette[4])
    } else if (el[0].toFixed(3) == 0.014){
        d3.selectAll('#classF')
            .attr('fill', palette[5])
    } else if (el[0].toFixed(3) == 0.026){
        d3.selectAll('#classG')
            .attr('fill', palette[6])
    } else if (el[0].toFixed(3) == 0.039){
        d3.selectAll('#classH')
            .attr('fill', palette[7])       
    } else if (el[0].toFixed(3) == 0.051){
        d3.selectAll('#classI')
            .attr('fill', palette[8])
    } else if (el[0].toFixed(3) == 0.064){
        d3.selectAll('#classJ')
             .attr('fill', palette[9])
    } else if (el[0].toFixed(3) >= 0.076){
        d3.selectAll('#classK')
            .attr('fill', palette[10])
    }
} */

let itemClicked = null, rectColor

function clicked(el){
    d3.selectAll('#legendRect').style('opacity', 1)
    if (itemClicked != null){
        d3.selectAll(itemClicked)
            .attr('fill', rectColor)
    }

    d3.select(this).style('opacity',0.2)
    rectClicked = this

        if (el[0].toFixed(3) == -0.024){
            d3.selectAll('#classA')
                .attr('fill', legendTextureA.url())
            itemClicked = '#classA'
            rectColor = palette[0]
        } else if (el[0].toFixed(3) == -0.017){
            d3.selectAll('#classB')
                .attr('fill', legendTextureB.url())
            itemClicked = '#classB'
            rectColor = palette[1]
        } else if (el[0].toFixed(3) == -0.008){
            d3.selectAll('#classC')
                .attr('fill', legendTextureC.url())   
            itemClicked = '#classC'
            rectColor = palette[2]
        } else if (el[0].toFixed(3) == -0.001){
            d3.selectAll('#classD')
                .attr('fill', legendTextureD.url())
            itemClicked = '#classD'
            rectColor = palette[3]
        } else if (el[0].toFixed(3) == 0.001){
            d3.selectAll('#classE')
                 .attr('fill', legendTextureE.url())
            itemClicked = '#classE'
            rectColor = palette[4]
        } else if (el[0].toFixed(3) == 0.014){
            d3.selectAll('#classF')
                .attr('fill', legendTextureF.url())
            itemClicked = '#classF'
            rectColor = palette[5]
        } else if (el[0].toFixed(3) == 0.026){
            d3.selectAll('#classG')
                .attr('fill', legendTextureG.url())
            itemClicked = '#classG'
            rectColor = palette[6]
        } else if (el[0].toFixed(3) == 0.039){
            d3.selectAll('#classH')
                .attr('fill', legendTextureH.url())   
            itemClicked = '#classH' 
            rectColor = palette[7]
        } else if (el[0].toFixed(3) == 0.051){
            d3.selectAll('#classI')
                .attr('fill', legendTextureI.url())
            itemClicked = '#classI'
            rectColor = palette[8]
        } else if (el[0].toFixed(3) == 0.064){
            d3.selectAll('#classJ')
                 .attr('fill', legendTextureJ.url())
            itemClicked = '#classJ'
            rectColor = palette[9]
        } else if (el[0].toFixed(3) >= 0.076){
            d3.selectAll('#classK')
                .attr('fill', legendTextureK.url())
            itemClicked = '#classK'
            rectColor = palette[10]
        }
}

g.selectAll("text")
	.attr("y", 0)
	.attr("x", 12)
	.attr("dy", ".35em")
	.attr("transform", "rotate(90)")
	.style("text-anchor", "start");
	

g.append("text")
    .attr("x", 126)
    .attr("y", 20)
    .style("text-anchor", "middle")
	.style("font-size", "12px")
    .text("Low Surprise -------------------------- High Surprise");	
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

