function draw1(){    
    setVisibility(0)
}

function draw2(){
     setVisibility(1) 
}

function draw3(){
    setVisibility(2)
}

function draw4(){
    setVisibility(3)
}

function draw5(){
    setVisibility(4)
}

function setVisibility(index){
    Array.from(document.getElementsByClassName('gifs')).forEach(element => {
        element.style.visibility = 'hidden'
    })
    document.getElementsByClassName('gifs')[index].style.visibility = 'visible'
}

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