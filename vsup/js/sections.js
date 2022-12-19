// All the initial elements should be create in the drawInitial function
// As they are required, their attributes can be modified
// They can be shown or hidden using their 'opacity' attribute
// Each element should also have an associated class name for easy reference
drawInitial()
function drawInitial(){
   let svg = d3.select('#vis')
        .append('svg')
			.attr("viewBox", "0 -70 1400 1350")
			.attr("preserveAspectRatio", "xMinYMin meet")

    svg.append("svg:image")
            .attr('id', 'img')
            .attr('y', 100)
            .attr("xlink:href", "../assets/img1.gif")
            .style('opacity', 0)

    svg.append("svg:image")
            .attr('id', 'img2')
            .attr('y', 100)
            .attr("xlink:href", "../assets/img2.gif")
            .style('opacity', 0)
    
    svg.append("svg:image")
            .attr('id', 'img3')
            .attr('y', 100)
            .attr("xlink:href", "../assets/img_x.gif")
            .style('opacity', 0)

    svg.append("svg:image")
            .attr('id', 'img4')
            .attr('y', 100)
            .attr("xlink:href", "../assets/img4.gif")
            .style('opacity', 0)

    svg.append("svg:image")
            .attr('id', 'img5')
            .attr('y', 100)
            .attr("xlink:href", "../assets/img_x.gif")
            .style('opacity', 0)

    d3.select('#img').style("opacity", 1) 
}

function draw1(){    
    d3.select('#img2').style('opacity', 0)
    d3.select('#img').style("opacity", 1)  
}


function draw2(){
    d3.select('#img').style('opacity', 0)
    d3.select('#img3').style('opacity', 0)
    d3.select('#img2').style("opacity", 1)       
}

function draw3(){
    d3.select('#img2').style('opacity', 0)
    d3.select('#img4').style('opacity', 0) 
    d3.select('#img3').style("opacity", 1) 
}

function draw4(){
    d3.select('#img3').style('opacity', 0)
    d3.select('#img5').style('opacity', 0)  
    d3.select('#img4').style("opacity", 1) 
}

function draw5(){
    d3.select('#img4').style('opacity', 0)
    d3.select('#img5').style("opacity", 1) 
}

//Array of all the graph functions
//Will be called from the scroller functionality

let activationFunctions = [
    draw1,
    draw2,
    draw3,
    draw4,
    draw5
]

//All the scrolling function
//Will draw a new graph based on the index provided by the scroll
let scroll = scroller()
    .container(d3.select('#graphic'))
scroll()

let lastIndex, activeIndex = 0

scroll.on('active', function(index){
    d3.selectAll('.step')
        .transition().duration(500)
        .style('opacity', function (d, i) {return i === index ? 1 : 0.1;});
    
    activeIndex = index
    let sign = (activeIndex - lastIndex) < 0 ? -1 : 1; 
    let scrolledSections = d3.range(lastIndex + sign, activeIndex + sign, sign);
    scrolledSections.forEach(i => {
        activationFunctions[i]();
    })
    lastIndex = activeIndex;

})

scroll.on('progress', function(index, progress){
    if (index == 2 & progress > 0.7){

    }
})