let steps;

function c_identify(){
    steps = [{
        title: 'Practice makes perfect! - Trial 1/2',
        text: 'In this section, we explain how to navigate through the experiment as well as respond to the given tasks.',
        attachTo: {
            on: 'center'
        },
        buttons: [{
                text: 'Exit',
                action: tour.cancel
            },
			{
            text: 'Next',
            action: tour.next
        }],
    },

	{
        title: 'Choropleth Map',
        text: 'This Choropleth Map shows sales rates by county for the USA. <br/> Note: You can pan the map by clicking on it then dragging the map left or right. ',
        attachTo: {
            element: '#visualsx',
            on: 'left'
        },
        buttons: [{
                text: 'Exit',
                action: tour.cancel
            },{
                text: 'Back',
                action: tour.back
            },
            {
                text: 'Next',
                classes: 'shepherd-button-close',
                action: tour.next
            }
        ]
    },

    {
        title: 'Zoom Effect',
        text: 'You can use the +/- buttons to zoom in an out of interesting regions on the map. The - button is disabled by default and will only be enabled after you zoom into a region on the map. Click on the map and drag to pan left or right.',
        attachTo: {
            element: '#visualsx',
            on: 'bottom'
        },
        buttons: [{
                text: 'Exit',
                action: tour.cancel
            },{
                text: 'Back',
                action: tour.back
            },
            {
                text: 'Next',
                classes: 'shepherd-button-close',
                action: tour.next
            }
        ]
    },

    {
        title: 'Task',
        text: 'You will be required to complete the task described in this section.',
        attachTo: {
            element: '.task',
            on: 'top'
        },
        buttons: [{
                text: 'Exit',
                action: tour.cancel
            },{
                text: 'Back',
                action: tour.back
            },
            {
                text: 'Next',
                classes: 'shepherd-button-close',
                action: tour.next
            }
        ]
    },

    {
        title: 'Select counties',
        text: '<b>Select 5 counties by clicking on the map.</b>',
        attachTo: {
            element: '#visualsx',
            on: 'bottom'
        },
        buttons: [ {text: 'Exit',
                action: () => {
						document.getElementById("rowCounties").innerHTML = ""
						document.getElementById("ccount").innerText = "Selected Counties [0/5]"
						counties = []
						count = 0
						row = ""
						Shepherd.activeTour.cancel()
					}
			},{
                text: 'Back',
                action: tour.back
            },
            {
                text: 'Next',
                classes: 'shepherd-button-close',
                action: () => {
                    if (count == 5){
                        return Shepherd.activeTour.next()
                    }
                }
            }
        ]
    },

    {
        title: 'Remove County',
        text: 'A county can be removed from the list by clicking on the respective button. However, you will be required to select a total of 5 counties to proceed to the next task. <br/>' +
                '<b>Click to remove!</b>',
        attachTo: {
            element: '#rowCounties',
            on: 'top'
        },
        buttons: [ {text: 'Exit',
                action: () => {
						document.getElementById("rowCounties").innerHTML = ""
						document.getElementById("ccount").innerText = "Selected Counties [0/5]"
						counties = []
						count = 0
						row = ""
						Shepherd.activeTour.cancel()
					}
				},{
                text: 'Back',
                action: tour.back
            },
            {
                text: 'Next',
                classes: 'shepherd-button-close',
                action: () => {
                    if (count  < 5) {
                        return Shepherd.activeTour.next()
                    }
                }
            }
        ]
    },

    {
        title: 'County Removed',
        text: 'Now that the county has been removed, <b>Select another county to complete the given task. </b>',
        attachTo: {
            element: '#visualsx',
            on: 'bottom'
        },
        buttons: [ {text: 'Exit',
                action: () => {
						document.getElementById("rowCounties").innerHTML = ""
						document.getElementById("ccount").innerText = "Selected Counties [0/5]"
						counties = []
						count = 0
						row = ""
						Shepherd.activeTour.cancel()
					}
				},{
                text: 'Back',
                action: tour.back
            },
            {
                text: 'Next',
                classes: 'shepherd-button-close',
                action: () =>{
                    if (count == 5)
                        return Shepherd.activeTour.next()
                }
            }
        ]
    },

    {
        title: 'All Set!',
        text: 'You are all set and ready to continue. <br/><b>Click Exit!</b>',
        attachTo: {
            on: 'center'
        },
        buttons: [{
                text: 'Exit',
                action: () => {
						document.getElementById("rowCounties").innerHTML = ""
						document.getElementById("ccount").innerText = "Selected Counties [0/5]"
						counties = []
						count = 0
						row = ""
						Shepherd.activeTour.cancel()
					}
				}, {
                text: 'Back',
                action: tour.back
            }
        ]
    },
]
}

function s_identify(){
    steps = [{
        title: 'Practice makes perfect! - Trial 1/2',
        text: 'In this section, we explain how to navigate through the experiment as well as respond to the given task.',
        attachTo: {
            on: 'center'
        },
        buttons: [{
            text: 'Next',
            action: tour.next
        }],
    },

    {
        title: 'Surprise Map',
        text: 'This Surprise Map shows surprise by county for the USA. <br/> Note: You can pan the map by clicking on it then dragging the map left or right.',
        attachTo: {
            element: 'svg',
            on: 'left'
        },
       buttons: [{
                text: 'Exit',
                action: tour.cancel
            },{
                text: 'Back',
                action: tour.back
            },
            {
                text: 'Next',
                classes: 'shepherd-button-close',
                action: tour.next
            }
        ]
    },

        {
        title: 'Zoom Effect',
        text: 'You can use the +/- buttons to also zoom in an out of the interesting regions on the maps. The - button is disabled by default and will only be enabled after you zoom into a region on the map. Click on the map and drag to pan left or right.',
        attachTo: {
            element: 'svg',
            on: 'bottom'
        },
        buttons: [{
                text: 'Exit',
                action: tour.cancel
            },{
                text: 'Back',
                action: tour.back
            },
            {
                text: 'Next',
                classes: 'shepherd-button-close',
                action: tour.next
            }
        ]
    },

    {
        title: 'Task',
        text: 'You will be required to complete the task described in this section.',
        attachTo: {
            element: '.task',
            on: 'top'
        },
        buttons: [{
                text: 'Exit',
                action: tour.cancel
            },{
                text: 'Back',
                action: tour.back
            },
            {
                text: 'Next',
                classes: 'shepherd-button-close',
                action: tour.next
            }
        ]
    },

    {
        title: 'Select counties',
        text: '<b>Select 5 counties by clicking on the map.</b>',
        attachTo: {
            element: '#visualsx',
            on: 'bottom'
        },
        buttons: [ {text: 'Exit',
                action: () => {
						document.getElementById("rowCounties").innerHTML = ""
						document.getElementById("ccount").innerText = "Selected Counties [0/5]"
						counties = []
						count = 0
						row = ""
						Shepherd.activeTour.cancel()
					}
			},{
                text: 'Back',
                action: tour.back
            },
            {
                text: 'Next',
                classes: 'shepherd-button-close',
                action: () => {
                    if (count == 5){
                        return Shepherd.activeTour.next()
                    }
                }
            }
        ]
    },

    {
        title: 'Remove County',
        text: 'A county can be removed from the list by clicking on the respective button. However, you will be required to select a total of 5 counties to proceed to the next task. <br/>' +
                '<b>Click to remove!</b>',
        attachTo: {
            element: '#rowCounties',
            on: 'top'
        },
        buttons: [ {text: 'Exit',
                action: () => {
						document.getElementById("rowCounties").innerHTML = ""
						document.getElementById("ccount").innerText = "Selected Counties [0/5]"
						counties = []
						count = 0
						row = ""
						Shepherd.activeTour.cancel()
					}
				},{
                text: 'Back',
                action: tour.back
            },
            {
                text: 'Next',
                classes: 'shepherd-button-close',
                action: () => {
                    if (count  < 5) {
                        return Shepherd.activeTour.next()
                    }
                }
            }
        ]
    },

    {
        title: 'County Removed',
        text: 'Now that the county has been removed, <b>Select another county to complete the given task. </b>',
        attachTo: {
            element: '#visualsx',
            on: 'bottom'
        },
        buttons: [ {text: 'Exit',
                action: () => {
						document.getElementById("rowCounties").innerHTML = ""
						document.getElementById("ccount").innerText = "Selected Counties [0/5]"
						counties = []
						count = 0
						row = ""
						Shepherd.activeTour.cancel()
					}
				},{
                text: 'Back',
                action: tour.back
            },
            {
                text: 'Next',
                classes: 'shepherd-button-close',
                action: () =>{
                    if (count == 5)
                        return Shepherd.activeTour.next()
                }
            }
        ]
    },

    {
        title: 'All Set!',
        text: 'You are all set and ready to continue. <br/><b>Click Exit!</b>',
        attachTo: {
            on: 'center'
        },
        buttons: [{
                text: 'Exit',
                action: () => {
						document.getElementById("rowCounties").innerHTML = ""
						document.getElementById("ccount").innerText = "Selected Counties [0/5]"
						counties = []
						count = 0
						row = ""
						Shepherd.activeTour.cancel()
					}
				}, {
                text: 'Back',
                action: tour.back
            }
        ]
    },
]
}

function c_compare(){
    steps = [{
        title: 'Practice makes perfect! - Trial 3/12',
        text: 'In this section, we explain how to navigate through the experiment as well as respond to the given task.',
        attachTo: {
            element: '',
            on: 'center'
        },
        buttons: [{
            text: 'Next',
            action: tour.next
        }],
    },

    {
        title: 'Choropleth Map',
        text: 'This Choropleth Map shows sales rates by county for the USA. <br/> Note: You can also pan the map by clicking on it then dragging the map left or right. ',
        attachTo: {
            element: '#csvg',
            on: 'left'
        },
        buttons: [{
                text: 'Back',
                action: tour.back
            },
            {
                text: 'Next',
                classes: 'shepherd-button-close',
                action: tour.next
            }
        ]
    },

    {
        title: 'Zoom Effect',
        text: 'You can also use the +/- buttons to also zoom in an out of the interesting regions on the maps. The - button is disabled by default and will only be enabled after you zoom into a region on the map. Click on the either map and drag to pan left or right.',
        attachTo: {
            element: '#csvg',
            on: 'bottom'
        },
        buttons: [{
                text: 'Back',
                action: tour.back
            },
            {
                text: 'Next',
                classes: 'shepherd-button-close',
                action: tour.next
            }
        ]
    },

    {
        title: 'Task',
        text: 'You will be required to complete the task described in this section.',
        attachTo: {
            element: '.task',
            on: 'right'
        },        
        buttons: [{
                text: 'Back',
                action: tour.back
            },
            {
                text: 'Next',
                classes: 'shepherd-button-close',
                action: tour.next
            }
        ]
    },

    {
        title: 'Compare States',
        text: '<b>Which state shows the highest sales perfomance.</b>',
        attachTo: {
            element: '.hstates',
            on: 'right'
        },
        buttons: [{
                text: 'Back',
                action: tour.back
            },
            {
                text: 'Next',
                classes: 'shepherd-button-close',
                action: tour.next
            }
        ]
    },

    {
        title: 'Select Choice',
        text: '<b>Click on one of the options to select your response.</b> ',
        attachTo: {
            element: '.btn-group-vertical',
            on: 'right'
        },
        buttons: [{
                text: 'Back',
                action: tour.back
            },
            {
                text: 'Next',
                classes: 'shepherd-button-close',
                action: () => {
                    if (document.getElementById('inlineRadioX').checked || document.getElementById('inlineRadioY').checked){
                        return Shepherd.activeTour.next()
                    }
                }
            }
        ]
    },


    {
        title: 'All Set!',
        text: 'You are all set and ready to continue. <br/><b>Click Exit!</b>',
        attachTo: {
            element: '#btnContinue',
            on: 'right'
        },
        buttons: [{
                text: 'Back',
                action: tour.back
            }
        ]
    },
]

}

function s_compare(){
    steps = [{
        title: 'Practice makes perfect! - Trial 4/12',
        text: 'In this section, we explain how to navigate through the experiment as well as respond to the given task.',
        attachTo: {
            element: '',
            on: 'center'
        },
        buttons: [{
            text: 'Next',
            action: tour.next
        }],
    },

    {
        title: 'Surprise Map',
        text: 'This Surprise Map shows surprise by county for the USA. <br/> Note: You can also pan the map by clicking on it then dragging the map left or right.',
        attachTo: {
            element: 'svg',
            on: 'left'
        },
        buttons: [{
                text: 'Back',
                action: tour.back
            },
            {
                text: 'Next',
                classes: 'shepherd-button-close',
                action: tour.next
            }
        ]
    },

    {
        title: 'Zoom Effect',
        text: 'You can also use the +/- buttons to also zoom in an out of the interesting regions on the maps. The - button is disabled by default and will only be enabled after you zoom into a region on the map. Click on the either map and drag to pan left or right.',
        attachTo: {
            element: 'svg',
            on: 'bottom'
        },
        buttons: [{
                text: 'Back',
                action: tour.back
            },
            {
                text: 'Next',
                classes: 'shepherd-button-close',
                action: tour.next
            }
        ]
    },

    {
        title: 'Task',
        text: 'You will be required to complete the task described in this section.',
        attachTo: {
            element: '.task',
            on: 'right'
        },        
        buttons: [{
                text: 'Back',
                action: tour.back
            },
            {
                text: 'Next',
                classes: 'shepherd-button-close',
                action: tour.next
            }
        ]
    },

    {
        title: 'Compare States',
        text: '<b>Which state shows the highest surprise.</b>',
        attachTo: {
            element: '.hstates',
            on: 'right'
        },
        buttons: [{
                text: 'Back',
                action: tour.back
            },
            {
                text: 'Next',
                classes: 'shepherd-button-close',
                action: tour.next
            }
        ]
    },

    {
        title: 'Select Choice',
        text: '<b>Click on one of the options to select your response.</b>',
        attachTo: {
            element: '.btn-group-vertical',
            on: 'right'
        },
        buttons: [{
                text: 'Back',
                action: tour.back
            },
            {
                text: 'Next',
                classes: 'shepherd-button-close',
                action: () => {
                    if (document.getElementById('inlineRadioX').checked || document.getElementById('inlineRadioY').checked){
                        return Shepherd.activeTour.next()
                    }
                }
            }
        ]
    },


    {
        title: 'All Set!',
        text: 'You are all set and ready to continue. <br/><b>Click Exit!</b>',
        attachTo: {
            element: '#btnContinue',
            on: 'right'
        },
        buttons: [{
                text: 'Back',
                action: tour.back
            }
        ]
    },
]
}

function c_delineate(){
    steps = [{
        title: 'Practice makes perfect! - Trial 7/12',
        text: 'In this section, we explain how to navigate through the experiment as well as respond to the given task.',
        attachTo: {
            element: '',
            on: 'center'
        },
        buttons: [{
            text: 'Next',
            action: tour.next
        }],
    },

    {
        title: 'Choropleth Map',
        text: 'This Choropleth Map shows sales rate by county for the USA. <br/> Note: You can also pan the map by clicking on it then dragging the map left or right. ',
        attachTo: {
            element: 'svg',
            on: 'left'
        },
        buttons: [{
                text: 'Back',
                action: tour.back
            },
            {
                text: 'Next',
                classes: 'shepherd-button-close',
                action: tour.next
            }
        ]
    },

    {
        title: 'Zoom Effect',
        text: 'You can also use the +/- buttons to also zoom in an out of the interesting regions on the maps. The - button is disabled by default and will only be enabled after you zoom into a region on the map. Click on the either map and drag to pan left or right.',
        attachTo: {
            element: 'svg',
            on: 'bottom'
        },
        buttons: [{
                text: 'Back',
                action: tour.back
            },
            {
                text: 'Next',
                classes: 'shepherd-button-close',
                action: tour.next
            }
        ]
    },

    {
        title: 'Task',
        text: 'You will be required to complete the task described in this section.',
        attachTo: {
            element: '.task',
            on: 'right'
        },        
        buttons: [{
                text: 'Back',
                action: tour.back
            },
            {
                text: 'Next',
                classes: 'shepherd-button-close',
                action: tour.next
            }
        ]
    },

    {
        title: 'Delineate',
        text: '<b>Identify two states with similar sales performance.</b>',
        attachTo: {
            element: '.hstates',
            on: 'left'
        },
        buttons: [{
                text: 'Back',
                action: tour.back
            },
            {
                text: 'Next',
                classes: 'shepherd-button-close',
                action: tour.next
            }
        ]
    },

    {
        title: 'Select Choice',
        text: '<b>Click on two of the options to select your response.</b>',
        attachTo: {
            element: '.btn-group-vertical',
            on: 'right'
        },
        buttons: [{
                text: 'Back',
                action: tour.back
            },
            {
                text: 'Next',
                classes: 'shepherd-button-close',
                action: () => {
                    if (document.getElementById('flexRadioDefault1').checked || document.getElementById('flexRadioDefault2').checked || document.getElementById('flexRadioDefault3').checked
                    || document.getElementById('flexRadioDefault4').checked || document.getElementById('flexRadioDefault5').checked || document.getElementById('flexRadioDefault6').checked){
                        return Shepherd.activeTour.next()
                    }
                }
            }
        ]
    },


    {
        title: 'All Set!',
        text: 'You are all set and ready to continue. <br/><b>Click Exit!</b>',
        attachTo: {
            element: '#btnC',
            on: 'right'
        },
        buttons: [{
                text: 'Back',
                action: tour.back
            }
        ]
    },
]
}

function s_delineate(){
    steps = [{
        title: 'Practice makes perfect! - Trial 8/12',
        text: 'In this section, we explain how to navigate through the experiment as well as respond to the given task.',
        attachTo: {
            element: '',
            on: 'center'
        },
        buttons: [{
            text: 'Next',
            action: tour.next
        }],
    },

    {
        title: 'Surprise Map',
        text: 'This Surprise Map shows surprise by county for the USA. <br/> Note: You can also pan the map by clicking on it then dragging the map left or right.',
        attachTo: {
            element: 'svg',
            on: 'left'
        },
        buttons: [{
                text: 'Back',
                action: tour.back
            },
            {
                text: 'Next',
                classes: 'shepherd-button-close',
                action: tour.next
            }
        ]
    },

    {
        title: 'Zoom Effect',
        text: 'You can also use the +/- buttons to also zoom in an out of the interesting regions on the maps. The - button is disabled by default and will only be enabled after you zoom into a region on the map. Click on the either map and drag to pan left or right.',
        attachTo: {
            element: 'svg',
            on: 'bottom'
        },
        buttons: [{
                text: 'Back',
                action: tour.back
            },
            {
                text: 'Next',
                classes: 'shepherd-button-close',
                action: tour.next
            }
        ]
    },

    {
        title: 'Task',
        text: 'You will be required to complete the task described in this section.',
        attachTo: {
            element: '.task',
            on: 'left'
        },        
        buttons: [{
                text: 'Back',
                action: tour.back
            },
            {
                text: 'Next',
                classes: 'shepherd-button-close',
                action: tour.next
            }
        ]
    },

    {
        title: 'Delineate',
        text: '<b>Identify two states that have similar sales performance.</b>',
        attachTo: {
            element: '.hstates',
            on: 'left'
        },
        buttons: [{
                text: 'Back',
                action: tour.back
            },
            {
                text: 'Next',
                classes: 'shepherd-button-close',
                action: tour.next
            }
        ]
    },

    {
        title: 'Select Choice',
        text: '<b>Click on one of the options to select your response.</b>',
        attachTo: {
            element: '.btn-group-vertical',
            on: 'right'
        },
        buttons: [{
                text: 'Back',
                action: tour.back
            },
            {
                text: 'Next',
                classes: 'shepherd-button-close',
                action: () => {
                    if (document.getElementById('flexRadioDefault1').checked || document.getElementById('flexRadioDefault2').checked || document.getElementById('flexRadioDefault3').checked
                    || document.getElementById('flexRadioDefault4').checked || document.getElementById('flexRadioDefault5').checked || document.getElementById('flexRadioDefault6').checked){
                        return Shepherd.activeTour.next()
                    }
                }
            }
        ]
    },


    {
        title: 'All Set!',
        text: 'You are all set and ready to continue. <br/><b>Click Exit!</b>',
        attachTo: {
            element: '#btnC',
            on: 'right'
        },
        buttons: [{
                text: 'Back',
                action: tour.back
            }
        ]
    },
]

}

function c_summarize(){
    steps = [{
        title: 'Practice makes perfect! - Trial 9/12',
        text: 'In this section, we explain how to navigate through the experiment as well as respond to the given task.',
        attachTo: {
            element: '',
            on: 'center'
        },
        buttons: [{
            text: 'Next',
            action: tour.next
        }],
    },

    {
        title: 'Choropleth Map',
        text: 'This Choropleth Map shows sales rate by county for the USA. <br/> Note: You can also pan the map by clicking on it then dragging the map left or right.',
        attachTo: {
            element: '#csvg',
            on: 'left'
        },
        buttons: [{
                text: 'Back',
                action: tour.back
            },
            {
                text: 'Next',
                classes: 'shepherd-button-close',
                action: tour.next
            }
        ]
    },

    {
        title: 'Zoom Effect',
        text: 'You can also use the +/- buttons to also zoom in an out of the interesting regions on the maps. The - button is disabled by default and will only be enabled after you zoom into a region on the map. Click on the either map and drag to pan left or right.',
        attachTo: {
            element: '#csvg',
            on: 'bottom'
        },
        buttons: [{
                text: 'Back',
                action: tour.back
            },
            {
                text: 'Next',
                classes: 'shepherd-button-close',
                action: tour.next
            }
        ]
    },

    {
        title: 'Task',
        text: 'You will be required to complete the task described in this section.',
        attachTo: {
            element: '.task',
            on: 'right'
        },        
        buttons: [{
                text: 'Back',
                action: tour.back
            },
            {
                text: 'Next',
                classes: 'shepherd-button-close',
                action: tour.next
            }
        ]
    },

    {
        title: 'Summarize',
        text: '<b>Which state shows the worst sales performance?</b>',
        attachTo: {
            element: '.hstates',
            on: 'right'
        },
        buttons: [{
                text: 'Back',
                action: tour.back
            },
            {
                text: 'Next',
                classes: 'shepherd-button-close',
                action: tour.next
            }
        ]
    },

    {
        title: 'Select Choice',
        text: '<b>Click on one of the options to select your response.</b>',
        attachTo: {
            element: '.btn-group-vertical',
            on: 'right'
        },
        buttons: [{
                text: 'Back',
                action: tour.back
            },
            {
                text: 'Next',
                classes: 'shepherd-button-close',
                action: () => {
                    if (document.getElementById('inlineRadioX').checked || document.getElementById('inlineRadioY').checked){
                        return Shepherd.activeTour.next()
                    }
                }
            }
        ]
    },


    {
        title: 'All Set!',
        text: 'You are all set and ready to continue. <br/><b>Click Exit!</b>',
        attachTo: {
            element: '#btnContinue',
            on: 'right'
        },
        buttons: [{
                text: 'Back',
                action: tour.back
            }
        ]
    },
]
}

function s_summarize(){
    steps = [{
        title: 'Practice makes perfect! - Trial 10/12',
        text: 'In this section, we explain how to navigate through the experiment as well as respond to the given task.',
        attachTo: {
            element: '',
            on: 'center'
        },
        buttons: [{
            text: 'Next',
            action: tour.next
        }],
    },

    {
        title: 'Surprise Map',
        text: 'This Surprise Map shows surprise by county for the USA. <br/> Note: You can also pan the map by clicking on it then dragging the map left or right.',
        attachTo: {
            element: 'svg',
            on: 'left'
        },
        buttons: [{
                text: 'Back',
                action: tour.back
            },
            {
                text: 'Next',
                classes: 'shepherd-button-close',
                action: tour.next
            }
        ]
    },

    {
        title: 'Zoom Effect',
        text: 'You can also use the +/- buttons to also zoom in an out of the interesting regions on the maps. The - button is disabled by default and will only be enabled after you zoom into a region on the map. Click on the either map and drag to pan left or right.',
        attachTo: {
            element: 'svg',
            on: 'bottom'
        },
        buttons: [{
                text: 'Back',
                action: tour.back
            },
            {
                text: 'Next',
                classes: 'shepherd-button-close',
                action: tour.next
            }
        ]
    },

    {
        title: 'Task',
        text: 'You will be required to complete the task described in this section.',
        attachTo: {
            element: '.task',
            on: 'right'
        },        
        buttons: [{
                text: 'Back',
                action: tour.back
            },
            {
                text: 'Next',
                classes: 'shepherd-button-close',
                action: tour.next
            }
        ]
    },

    {
        title: 'Summamrize',
        text: '<b>Which state shows the highest surprise.</b>',
        attachTo: {
            element: '.hstates',
            on: 'right'
        },
        buttons: [{
                text: 'Back',
                action: tour.back
            },
            {
                text: 'Next',
                classes: 'shepherd-button-close',
                action: tour.next
            }
        ]
    },

    {
        title: 'Select Choice',
        text: '<b>Click on one of the options to select your response.</b>',
        attachTo: {
            element: '.btn-group-vertical',
            on: 'right'
        },
        buttons: [{
                text: 'Back',
                action: tour.back
            },
            {
                text: 'Next',
                classes: 'shepherd-button-close',
                action: () => {
                    if (document.getElementById('inlineRadioX').checked || document.getElementById('inlineRadioY').checked){
                        return Shepherd.activeTour.next()
                    }
                }
            }
        ]
    },


    {
        title: 'All Set!',
        text: 'You are all set and ready to continue. <br/><b>Click Exit!</b>',
        attachTo: {
            element: '#btnContinue',
            on: 'right'
        },
        buttons: [{
                text: 'Back',
                action: tour.back
            }
        ]
    },
]
}

function c_explore(){
    steps = [
	
	{
        title: 'Practice makes perfect! - Trial 2/2',
        text: 'In this section, we explain how to navigate through the experiment as well as respond to the given task.',
        attachTo: {
            on: 'center'
        },
        buttons: [{
            text: 'Next',
            action: tour.next
        }],
    },
	
	{
        title: 'Choropleth Map',
        text: 'This Choropleth Map shows the sales rates by county for the USA. <br/> Note: You can pan the map by clicking on it then dragging the map left or right.',
        attachTo: {
            element: '#visualsx',
            on: 'left'
        },
        buttons: [{
                text: 'Exit',
                action: tour.cancel
				},
				{
                text: 'Back',
                action: tour.back
				},
				{
					text: 'Next',
					classes: 'shepherd-button-close',
					action: tour.next
				}
        ]
    },

    {
        title: 'Zoom Effect',
        text: 'You can use the +/- buttons to also zoom in an out of the interesting regions on the maps. The - button is disabled by default and will only be enabled after you zoom into a region on the map. Click on the map and drag to pan left or right.',
        attachTo: {
            element: '#visualsx',
            on: 'bottom'
        },
        buttons: [{
                text: 'Exit',
                action: tour.cancel
				},{
                text: 'Back',
                action: tour.back
            },
            {
                text: 'Next',
                classes: 'shepherd-button-close',
                action: tour.next
            }
        ]
    },

    {
        title: 'Task',
        text: 'You will be required to complete the task described in this section.',
        attachTo: {
            element: '.task',
            on: 'top'
        },        
        buttons: [{
                text: 'Exit',
                action: tour.cancel
				},{
                text: 'Back',
                action: tour.back
            },
            {
                text: 'Next',
                classes: 'shepherd-button-close',
                action: tour.next
            }
        ]
    },

    {
        title: 'Narrative',
        text: 'Provide a short narrative of sales across the USA.',
        attachTo: {
            element: '#summary',
            on: 'top'
        },
        buttons: [{
                text: 'Exit',
                action: tour.cancel
				},{
                text: 'Back',
                action: tour.back
            },
            {
                text: 'Next',
                classes: 'shepherd-button-close',
                action: () => {
                    if (document.getElementById('summary').value != ''){
                        return Shepherd.activeTour.next()
                    }
                }
            }
        ]
    },


    {
        title: 'All Set!',
        text: 'You are all set and ready to continue. <br/><b>Click Exit!</b>',
        attachTo: {
            on: 'center'
        },
        buttons: [{
                text: 'Exit',
                action: () => {
					document.getElementById('summary').value = ''
					Shepherd.activeTour.cancel()
					}
				},{
                text: 'Back',
                action: tour.back
            }
        ]
    },
]

}

function s_explore(){
    steps = [{
        title: 'Practice makes perfect! - Trial 2/2',
        text: 'In this section, we explain how to navigate through the experiment as well as respond to the given task.',
        attachTo: {
            element: '',
            on: 'center'
        },
        buttons: [{
            text: 'Next',
            action: tour.next
        }],
    },

    {
        title: 'Surprise Map',
        text: 'This Surprise Map shows surprise by county for the USA. <br/> Note: You can pan the map by clicking on it then dragging the map left or right.',
        attachTo: {
            element: 'svg',
            on: 'left'
        },
       buttons: [{
                text: 'Exit',
                action: tour.cancel
				},
				{
                text: 'Back',
                action: tour.back
				},
				{
					text: 'Next',
					classes: 'shepherd-button-close',
					action: tour.next
				}
        ]
    },

 {
        title: 'Zoom Effect',
        text: 'You can use the +/- buttons to zoom in an out of the interesting regions on the maps. The - button is disabled by default and will only be enabled after you zoom into a region on the map. Click on the map and drag to pan left or right.',
        attachTo: {
            element: 'svg',
            on: 'bottom'
        },
        buttons: [{
                text: 'Exit',
                action: tour.cancel
				},{
                text: 'Back',
                action: tour.back
            },
            {
                text: 'Next',
                classes: 'shepherd-button-close',
                action: tour.next
            }
        ]
    },

    {
        title: 'Task',
        text: 'You will be required to complete the task described in this section.',
        attachTo: {
            element: '.task',
            on: 'top'
        },        
        buttons: [{
                text: 'Exit',
                action: tour.cancel
				},{
                text: 'Back',
                action: tour.back
            },
            {
                text: 'Next',
                classes: 'shepherd-button-close',
                action: tour.next
            }
        ]
    },

    {
        title: 'Narrative',
        text: 'Provide a short narrative of sales across the USA.',
        attachTo: {
            element: '#summary',
            on: 'top'
        },
        buttons: [{
                text: 'Exit',
                action: tour.cancel
				},{
                text: 'Back',
                action: tour.back
            },
            {
                text: 'Next',
                classes: 'shepherd-button-close',
                action: () => {
                    if (document.getElementById('summary').value != ''){
                        return Shepherd.activeTour.next()
                    }
                }
            }
        ]
    },


    {
        title: 'All Set!',
        text: 'You are all set and ready to continue. <br/><b>Click Exit!</b>',
        attachTo: {
            on: 'center'
        },
        buttons: [{
                text: 'Exit',
                action: () => {
					document.getElementById('summary').value = ''
					Shepherd.activeTour.cancel()
					}
				},{
                text: 'Back',
                action: tour.back
            }
        ]
    },
]

}


function c_rank(){
    steps = [{
        title: 'Practice makes perfect! - Trial 5/12',
        text: 'In this section, we explain how to navigate through the experiment as well as respond to the given task.',
        attachTo: {
            element: '',
            on: 'center'
        },
        buttons: [{
            text: 'Next',
            action: tour.next
        }],
    },

    {
        title: 'Choropleth Map',
        text: 'This Choropleth Map shows sales rate by county for the USA. <br/> Note: You can also pan the map by clicking on it then dragging the map left or right.',
        attachTo: {
            element: 'svg',
            on: 'left'
        },
        buttons: [{
                text: 'Back',
                action: tour.back
            },
            {
                text: 'Next',
                classes: 'shepherd-button-close',
                action: tour.next
            }
        ]
    },

    {
        title: 'Zoom Effect',
        text: 'You can also use the +/- buttons to also zoom in an out of the interesting regions on the maps. The - button is disabled by default and will only be enabled after you zoom into a region on the map. Click on the either map and drag to pan left or right.',
        attachTo: {
            element: 'svg',
            on: 'bottom'
        },
        buttons: [{
                text: 'Back',
                action: tour.back
            },
            {
                text: 'Next',
                classes: 'shepherd-button-close',
                action: tour.next
            }
        ]
    },

    {
        title: 'Task',
        text: 'You will be required to complete the task described in this section.',
        attachTo: {
            element: '.task',
            on: 'right'
        },        
        buttons: [{
                text: 'Back',
                action: tour.back
            },
            {
                text: 'Next',
                classes: 'shepherd-button-close',
                action: tour.next
            }
        ]
    },

    {
        title: 'Rank States',
        text: '<b>Rank states by sales rate (Highest to Lowest).</b>',
        attachTo: {
            element: '.hstates',
            on: 'bottom'
        },
        buttons: [{
                text: 'Back',
                action: tour.back
            },
            {
                text: 'Next',
                classes: 'shepherd-button-close',
                action: tour.next
            }
        ]
    },

    {
        title: 'Select Choice',
        text: '<b>Click on one of the options to select your response.</b>',
        attachTo: {
            element: '.btn-group-vertical',
            on: 'right'
        },
        buttons: [{
                text: 'Back',
                action: tour.back
            },
            {
                text: 'Next',
                classes: 'shepherd-button-close',
                action: () => {
                    if (document.getElementById('flexRadioDefault1').checked || document.getElementById('flexRadioDefault2').checked || document.getElementById('flexRadioDefault3').checked
                    || document.getElementById('flexRadioDefault4').checked || document.getElementById('flexRadioDefault5').checked || document.getElementById('flexRadioDefault6').checked){
                        return Shepherd.activeTour.next()
                    }
                }
            }
        ]
    },


    {
        title: 'All Set!',
        text: 'You are all set and ready to continue. <br/><b>Click Exit!</b>',
        attachTo: {
            element: '#btnC',
            on: 'right'
        },
        buttons: [{
                text: 'Back',
                action: tour.back
            }
        ]
    },
]
}

function s_rank() {
    steps = [{
        title: 'Practice makes perfect! - Trial 6/12',
        text: 'In this section, we explain how to navigate through the experiment as well as respond to the given task.',
        attachTo: {
            element: '',
            on: 'center'
        },
        buttons: [{
            text: 'Next',
            action: tour.next
        }],
    },

    {
        title: 'Surprise Map',
        text: 'This Surprise Map shows surprise by county for the USA. <br/> Note: You can also pan the map by clicking on it then dragging the map left or right.',
        attachTo: {
            element: 'svg',
            on: 'left'
        },
        buttons: [{
                text: 'Back',
                action: tour.back
            },
            {
                text: 'Next',
                classes: 'shepherd-button-close',
                action: tour.next
            }
        ]
    },

    {
        title: 'Zoom Effect',
        text: 'You can also use the +/- buttons to also zoom in an out of the interesting regions on the maps. The - button is disabled by default and will only be enabled after you zoom into a region on the map. Click on the either map and drag to pan left or right.',
        attachTo: {
            element: 'svg',
            on: 'bottom'
        },
        buttons: [{
                text: 'Back',
                action: tour.back
            },
            {
                text: 'Next',
                classes: 'shepherd-button-close',
                action: tour.next
            }
        ]
    },

    {
        title: 'Task',
        text: 'You will be required to complete the task described in this section.',
        attachTo: {
            element: '.task',
            on: 'right'
        },        
        buttons: [{
                text: 'Back',
                action: tour.back
            },
            {
                text: 'Next',
                classes: 'shepherd-button-close',
                action: tour.next
            }
        ]
    },

    {
        title: 'Rank States',
        text: '<b>Rank states by surprise (Highest to Lowest).</b>',
        attachTo: {
            element: '.hstates',
            on: 'bottom'
        },
        buttons: [{
                text: 'Back',
                action: tour.back
            },
            {
                text: 'Next',
                classes: 'shepherd-button-close',
                action: tour.next
            }
        ]
    },

    {
        title: 'Select Choice',
        text: '<b>Click on one of the options to select your response.</b>',
        attachTo: {
            element: '.btn-group-vertical',
            on: 'right'
        },
        buttons: [{
                text: 'Back',
                action: tour.back
            },
            {
                text: 'Next',
                classes: 'shepherd-button-close',
                action: () => {
                    if (document.getElementById('flexRadioDefault1').checked || document.getElementById('flexRadioDefault2').checked || document.getElementById('flexRadioDefault3').checked
                    || document.getElementById('flexRadioDefault4').checked || document.getElementById('flexRadioDefault5').checked || document.getElementById('flexRadioDefault6').checked){
                        return Shepherd.activeTour.next()
                    }
                }
            }
        ]
    },


    {
        title: 'All Set!',
        text: 'You are all set and ready to continue. <br/><b>Click Exit!</b>',
        attachTo: {
            element: '#btnC',
            on: 'right'
        },
        buttons: [{
                text: 'Back',
                action: tour.back
            }
        ]
    },
]
}