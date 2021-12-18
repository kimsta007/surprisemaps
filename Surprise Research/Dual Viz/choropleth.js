let data, geoData, popn, checkData;
let population = {}, surpriseData = [], dotplotData = [];
let colorsChoropleth = d3.schemeBlues[9];
let colorsSurprise = d3.schemeRdBu[9];
let states = [ "AK", "AL", "AR", "AS", "AZ", "CA", "CO", "CT", "DC", "DE", "FL", "GA", "GU", "HI", "IA", "ID", "IL", "IN", "KS",
               "KY", "LA", "MA", "MD", "ME", "MI", "MN", "MO", "MS", "MT", "NC", "ND", "NE", "NH", "NJ", "NM", "NV", "NY", "OH",
               "OK", "OR", "PA", "PR", "RI", "SC", "SD", "TN", "TX", "UT", "VA", "VI", "VT", "WA", "WI", "WV", "WY"]
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
	Promise.all([d3.json('counties.json'), d3.csv('data.csv')]).then(cleanupData);
});
document.getElementById("datePicker").remove()
document.getElementById("datepickerLabel").remove()	
}

function cleanupData(dte){
	for(let record in dte[1]){
	   popn = [];
	   popn.push(+dte[1][record].population);
	   population[+dte[1][record].county] = popn;
	}
	for (let record in data){
		if (data[record].fips != "UNK"){		
			if (data[record].recip_state == "ID" || data[record].recip_state == "GA" || data[record].recip_state == "VT" || data[record].recip_state == "WV" || data[record].recip_state == "VA"){
				data[record].series_complete_pop_pct = 0
			}
			if (data[record].series_complete_pop_pct != 0) {
				data[record].population = +population[+data[record].fips];
				data[record].series_complete_pop_pct = (+data[record].series_complete_pop_pct / 100).toFixed(2);
			}
		}
	}
	console.log(dte[0])
	geoData = dte[0];
	makeMaps();
}

function selectScale(seriesMin, seriesMax, mapType){
let colorScale = (mapType === "choropleth") ? colorsChoropleth : colorsSurprise;
let classes = 0;
if (seriesMin < 0)
	classes = (seriesMax + Math.abs(seriesMin)) / 9
else	
	classes = (seriesMax - seriesMin) / 9
return d3.scaleQuantile()
		.domain(d3.range(seriesMin, seriesMax, classes))
		.range(colorScale);
}

function makeMaps(){
    calcSurprise();
	checkData = data;
	drawGraph("Surprise", colorsSurprise, surpriseData);
	createDotPlot();
	document.getElementById("narration").hidden = "";
}

function getCountyByFips(fips) {
		for (let iter = 0; iter < data.length; iter++) {
			if (+data[iter].fips == fips){
				return iter;
			}
		}
}

function handleClick(el) {
	if (el.id != null)
		document.getElementById("formTextInput").value = data[getCountyByFips(el.id)].recip_county;
	else 
		document.getElementById("formTextInput").value = el.county;
}

function drawGraph(mapType, colors, data) {
	const width = 950;
	const height = 620;
	let seriesMin = d3.min(data.map((d) => d.series_complete_pop_pct));
	let seriesMax = d3.max(data.map((d) => d.series_complete_pop_pct));
	let colorScale = selectScale(seriesMin, seriesMax, mapType);
	
	let section = d3.select("#visuals")
		.append("section")

	let svg = section
		.append("svg")
			.attr("id", mapType)
			.attr("width", width)
			.attr("height", height)
			
	  svg
		.append("text")
		.attr("x", 415)
		.attr("y", 610)
        .style("font-size", "20px") 
        .style("text-decoration", "underline")  
		.text(mapType + " Map")
	
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
	let geojson = topojson.feature(geoData, geoData.objects.counties)

	let path = d3.geoPath();

	svg.selectAll("path")
		.data(geojson.features)
		.enter()
		.append("path")
			.attr("d", path)
			.attr("class", "county")
			.attr("id", (d) => (d.id + 'm'))
			.attr("stroke", "#FFF")
			.attr("stroke-width", .3)
			.attr("fill", (d) => {  let cdata = checkData[getCountyByFips(d.id)].series_complete_pop_pct
									if (cdata != 0)
										return colorScale(data[getCountyByFips(d.id)].series_complete_pop_pct)
									else 
										return 'url(#texture)';
								 })
			.attr("data-fips", (d) => d.id)
			.attr("data-vaccinations", (d) => +data[getCountyByFips(d.id)].series_complete_pop_pct)
			.on("mouseover", handleMouseOver)
			.on("mosemove", handleMouseMove)
			.on("mouseout", handleMouseOut)
			.on("click", handleClick)

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
		    .attr('id', 'tooltip')
			.style("opacity", 0)
			.attr("id", "tooltip")
			.style("position", "absolute")
			.style("background-color", '#154360')
			.style("color", "white")
			.style("padding", "10px")
			.style("text-align", "center")
			.style("border-radius", "10%")

	function handleMouseOver(el) {
		let county = getCountyByFips(+el.id);
		let x = document.getElementById(+el.id + 'm').getBBox().x 
		let y = document.getElementById(+el.id + 'm').getBBox().y 
		if ((Math.ceil(x/100)*100) == (Math.ceil(d3.event.pageX/100)*100)) {
			if(document.getElementById((el.id + 'd')) != null) {
				document.getElementById((el.id + 'd')).dispatchEvent(new Event('mouseover'));
			}
		}
		tooltip
				.transition()
				.duration(500)
				.style("opacity", 0.8)

		tooltip
				.style("left", x + "px")
				.style("top", y + "px")
				.attr("data-vaccinations", `${data[county].series_complete_pop_pct}`)
				.html(`${data[county].recip_county}: ${data[county].series_complete_pop_pct}`)
		d3.select(this)
				.style("opacity", 0.2)
				
		d3.select(this)
				.style("opacity", 0.2)
	}

	function handleMouseOut(el) {
		let x = document.getElementById(+el.id + 'm').getBBox().x 
		let y = document.getElementById(+el.id + 'm').getBBox().y 
		if ((Math.ceil(x/100)*100) == (Math.ceil(d3.event.pageX/100)*100)) {
			if(document.getElementById((el.id + 'd')) != null) {
				document.getElementById((el.id + 'd')).dispatchEvent(new Event('mouseout'));
			}
		}
		tooltip
				.transition()
				.duration(500)
				.style("opacity", 0)
		tooltip
				.style("left", "-1000px")  
				.style("top", "-1000px")  
		d3.select(this)
				.style("opacity", 1)
	}

	function handleMouseMove(el) {
		let x = document.getElementById(+el.id + 'm').getBBox().x 
		let y = document.getElementById(+el.id + 'm').getBBox().y 
		tooltip
				.style("left", x + "px")
				.style("top", y + "px")
	}
	// END TOOLTIP
	
	// START LEGEND
	const legendWidth = 300;
	const legendHeight = 10;
	const legendBarLength = legendWidth / colors.length

	let legend = svg
		.append("g")
			.attr("id", "legend")

	let legendScale = d3.scaleLinear()
		.domain([seriesMin, seriesMax])
		.rangeRound([0, legendWidth])

	let legendAxis = d3.axisTop(legendScale)
		  .tickSize(5)
		  .tickSizeOuter(0)
		  .tickFormat(x => `${x.toFixed(2)}`)
		  .tickValues(colorScale.domain());

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

function average(){
  let sum = 0;
  let n = 0;
  for (let iter = 0; iter < data.length; iter++) {
    sum += (+data[iter].series_complete_pop_pct);
    n++;
  }
  return sum / n;
}

function sumU(){
  let sum = 0;
  for (let iter = 0; iter < data.length; iter++) {
    sum+= (+data[iter].series_complete_pop_pct);
  }
  return sum;
}
  
function standardDeviation(avg){
  let sqSum = 0;
  for (let iter = 0; iter < data.length; iter++) {
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
  let pSum = 0;
  let pSMs = [];
      sd = standardDeviation(avg);
  //Estimate P(D|M) 
  //De Moivres
  for (let iter = 0; iter < data.length; iter++) {
	  if (data[iter].series_complete_pop_pct != 0){
		  s = ((data[iter].series_complete_pop_pct) - avg) / (sd / Math.sqrt(+data[iter].population / 100));
		  pSMs.push(1 - (2 * cdf(Math.abs(s))));
	  } else {
	      pSMs.push(0);
	  }  
  }
  
    //Calculate per state surprise
    for (let iter = 0; iter < data.length; iter++) {
	  if (+data[iter].series_complete_pop_pct == 0) {
		  surpriseData.push({fips: +data[iter].fips, population: +data[iter].population, series_complete_pop_pct: 0, recip_county: data[iter].recip_county})
	  } else {
		  diffs[0] = (data[iter].series_complete_pop_pct) - avg;
		  //Estimate P(M|D)
		  //De' moivres
		  pMDs[0] = pMs[0] * pSMs[iter];

		  // Surprise is the sum of KL divergance across model space
		  // Each model also gets a weighted "vote" on what the sign should be
		  kl = 0;
		  let voteSum = 0;
		  kl+= +pMDs[0] * (Math.log( +pMDs[0] / +pMs[0]) / Math.log(2));
		  if (Number.isNaN(kl)){
			surpriseData.push({fips: +data[iter].fips, population: +data[iter].population, series_complete_pop_pct: 0, recip_county: data[iter].recip_county})
		  } else {
			voteSum += diffs[0] * pMs[0];
			let surprise = voteSum >= 0 ? +Math.abs(kl).toFixed(2) : -1* +Math.abs(kl).toFixed(2);
			surpriseData.push({fips: +data[iter].fips, population: +data[iter].population, series_complete_pop_pct: +surprise, recip_county: data[iter].recip_county})
			dotplotData.push({county: data[iter].recip_county, fips: +data[iter].fips, state: data[iter].recip_state, surprise: +surprise, vacc_rate: data[iter].series_complete_pop_pct, population: +data[iter].population})
	  }}
    }
}

function createDotPlot(){
//SVG setup
const margin = {top: 50, right: 55, bottom: 55, left: 30},
      width = 1000 - margin.left - margin.right,
      height = 620 - margin.top - margin.bottom;

//x scales
const x = d3.scaleLinear()
    .rangeRound([0, width])
    .domain([0, 1]);

const colorList = ['#F44336', '#FFEBEE', '#FFCDD2', '#EF9A9A', '#E57373', '#EF5350', '#F44336', '#E53935', '#D32F2F', '#C62828',
                   '#B71C1C', '#FF8A80', '#FF5252', '#FF1744', '#D50000', '#E91E63', '#FCE4EC', '#F8BBD0', '#F48FB1', '#F06292', 
				   '#EC407A', '#E91E63', '#D81B60', '#C2185B', '#AD1457', '#880E4F', '#FF80AB', '#FF4081', '#F50057', '#C51162', 
				   '#9C27B0', '#F3E5F5', '#E1BEE7', '#CE93D8', '#BA68C8', '#AB47BC', '#9C27B0', '#8E24AA', '#7B1FA2', '#6A1B9A',
				   '#4A148C', '#EA80FC', '#E040FB', '#D500F9', '#AA00FF', '#673AB7', '#EDE7F6', '#D1C4E9', '#B39DDB', '#9575CD', '#7E57C2', '#673AB7']
	
const color = d3.scaleOrdinal(colorList)
				.domain(states)

//set up svg
const svg = d3.select("#visuals")
  .append("svg")
    .style("margin-left", "-50px")
    .attr("id", "dotplot")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform",
            `translate(${margin.left}, ${margin.top})`)

 svg
		.append("text")
		.attr("x", 400)
		.attr("y", 555)
        .style("font-size", "20px") 
        .style("text-decoration", "underline")  
		.text("Dot Plot")

//tooltip
const tooltip = d3.select("#visuals")
  .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

const dataFile = "dataset.csv"

//number of bins for histogram
const nbins = 300;

function update(){
	let data = dotplotData;

    //histogram binning
    const histogram = d3.histogram()
      .domain(x.domain())
      .thresholds(x.ticks(nbins))
      .value(function(d) { return d.vacc_rate;} )

    //binning data and filtering out empty bins
    const bins = histogram(data).filter(d => d.length>0)

    //g container for each bin
    let binContainer = svg.selectAll(".gBin")
      .data(bins);

    let binContainerEnter = binContainer.enter()
      .append("g")
        .attr("class", "gBin")
        .attr("transform", d => `translate(${x(d.x0)}, ${height})`)

    //need to populate the bin containers with data the first time
    binContainerEnter.selectAll("circle")
        .data(d => d.map((p, i) => {
          return {idx: i,
                  county: p.county,
				  fips: p.fips,
				  state: p.state,
                  vacc_rate: p.vacc_rate,
                  radius: (x(d.x1)-x(d.x0))/2
                }
        }))
      .enter()
      .append("circle")
        .attr("class", "enter")
		.attr("id", (d) => (d.fips + 'd'))
        .attr("cx", 0) //g element already at correct x pos
        .attr("cy", function(d) {
            return - d.idx * 2 * d.radius - d.radius; })
        .attr("r", 0)
		.style("fill", (d) => color(d.state))
		.on("click", handleClick)
        .on("mouseover", tooltipOn)
        .on("mouseout", tooltipOff)
        .transition()
          .duration(500)
          .attr("r", function(d) {
          return (d.length==0) ? 0 : d.radius; })
}//update

function tooltipOn(d) {
  //x position of parent g element
  if(document.getElementById((d.fips + 'm')) != null) {
			document.getElementById((d.fips + 'm')).dispatchEvent(new Event('mouseover'));
  }
  let gParent = d3.select(this.parentElement)
  let translateValue = gParent.attr("transform")
  let gX = translateValue.split(",")[0].split("(")[1]
  let gY = height + (+d3.select(this).attr("cy")-50)

  d3.select(this)
    .classed("selected", true)
  tooltip.transition()
       .duration(500)
       .style("opacity", .9);
  tooltip.html(d.county + "<br/> (" + d.vacc_rate + ")")
    .style("left", (+gX + 900) + "px")
    .style("top", (+gY + 120) + "px");
}//tooltipOn

function tooltipOff(d) {
  if(document.getElementById((d.fips + 'm')) != null) {
			document.getElementById((d.fips + 'm')).dispatchEvent(new Event('mouseout'));
  }
  d3.select(this)
      .classed("selected", false);
    tooltip.transition()
         .duration(500)
         .style("opacity", 0);
}//tooltipOff

// add x axis
svg.append("g")
  .attr("class", "axis axis--x")
  .attr("transform", "translate(0," + height + ")")
  .call(d3.axisBottom(x));

//draw everything
update();
}