
function draw1(){    
    document.getElementById('cardHeader').innerHTML = 'Background'
    document.getElementById('cardBody').innerHTML = '<p class="card-text" style="background: #fff;">For the purposes of this study, you are a marketing/sales manager at Company X. <br /><br /> Company X has a new product line that is bring distributed nationally. <br />' +
    'The primary sales metric is sales as a percentage of total county population. <br />The product is performing well in some counties, but poorly in other counties. <br /><br/></p>' +
    '<p class="text-center mb-0" id="cardFooter" style="background: #fff;"><b>Scroll Down</b> <i class="fa-solid fa-angle-down fa-xl fa-bounce"></i></p>'
}


function draw2(){
    document.getElementById('cardHeader').innerHTML = 'Task'
    document.getElementById('cardBody').innerHTML = '<p class="card-text" style="background: #fff; text-align: justify;">Your goal is to identify:</p><ol style="text-align: justify;" <li>The top 5 lowest performing counties, where Company X will send additional marketing resources.</li><li>The top 5 best performing counties, where Company X will send a team there to learn about local sales strategies.</li></ol>' +
    '<p class="text-center mb-0" style="background: #fff;"><b>Scroll Up</b> <i class="fa-solid fa-angle-up fa-xl"></i> or <b>Scroll Down</b> <i class="fa-solid fa-angle-down fa-xl"></i></p>'
}

function draw3(){
    document.getElementById('cardHeader').innerHTML = 'Map Resource'
    document.getElementById('cardBody').innerHTML = '<p class="card-text" style="background: #fff;">To aid you in identifying key counties, the Company X Data Science team has produced a map. <br />This map includes a special metric, “surprise”, which is a statistical measure of how surprising a sales rate is for a given county. <br /><br />' +
    'Sales can be surprisingly high, or surprisingly low. <br />However, sales can also be high or low but not surprising.</p><p class="text-center mb-0" style="background: #fff;"><b>Scroll Up</b> <i class="fa-solid fa-angle-up fa-xl"></i> or <b>Scroll Down</b> <i class="fa-solid fa-angle-down fa-xl"></i></p>'
}

function draw4(){
    document.getElementById('cardHeader').innerHTML = 'Unsurprising Rates'
    document.getElementById('cardBody').innerHTML = '<p class="card-text" style="background: #fff;">Sales rates that are not surprising usually occur when a county has a smaller population. <br />For example, if 9 out of 10 people in a small county buy the product, the sales rate is 90%. <br />' +
    'This is not as surprising as if we were to find a county where 9,000 out of 10,000 people buy the product. <br /></p><p class="text-center mb-0" style="background: #fff;"><b>Scroll Up</b> <i class="fa-solid fa-angle-up fa-xl"></i> or <b>Scroll Down</b> <i class="fa-solid fa-angle-down fa-xl"></i></p>'
}

function draw5(){
    document.getElementById('cardHeader').innerHTML = 'How Surprise Appears on the Map'
    document.getElementById('cardBody').innerHTML = '<p class="card-text" style="background: #fff;">The Data Science team has produced a color scale that shows both sales rate and surprise. <br />At the upper left of the wedge are counties with low rates that are considered surprising. <br />' +
    'At the upper right of the wedge are counties with high rates that are considered surprising. <br />At the bottom of the wedge are counties with either low or high rates, but are not considered surprising.</p><div class="row"><div class="col"><p class="float-start" style="background: #fff;"><b>Scroll Up</b> <i class="fa-solid fa-angle-up fa-xl fa-bounce"></i></p>' +
    '<span class="float-end"><a href="identify.html" class="btn btn-success">Begin Experiment</a></span></div></div>'
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