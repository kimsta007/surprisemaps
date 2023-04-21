	  let duration =  new Date(new Date().getTime() - sessionStorage.getItem('startTime'))
	  let diagnisticData = {'identify': sessionStorage.getItem('identifyDiagnostic'), 'explore': sessionStorage.getItem('exploreDiagnostic'), 'duration': String(duration).slice(19,24)}

	  function sendData(){
		let idata, edata, identifyLog, exploreLog, mapType, url, feedback;
		idata = sessionStorage.getItem('identify')
		edata = sessionStorage.getItem('explore')
		identifyLog = sessionStorage.getItem('identifyLog')
		identifyClickLog = sessionStorage.getItem('identifyClickLog')
		exploreLog = sessionStorage.getItem('exploreLog')
		mapType = sessionStorage.getItem('mapType')
		feedback = sessionStorage.getItem('experimentFeedback')

		url = 'vsup-best-vaccine'.concat('-').concat( sessionStorage.getItem('pid'))
		if (sessionStorage.getItem('submitted').substring(1,6) == 'false'){
				let data = {'url': url, 'identify': idata, 'explore': edata, 'iLog': identifyLog, 'cLog': identifyClickLog,'eLog': exploreLog, 'dData': diagnisticData, 'feedback': feedback};
				let options = {
					method : 'POST',
					headers : {'Content-Type':'application/json'},
					body : JSON.stringify(data)
				};
				fetch('/dbdata', options);
				}
			sessionStorage.setItem('submitted', JSON.stringify('true'))
	  }
	  
	 