	  let duration =  new Date(new Date().getTime() - sessionStorage.getItem('startTime'))
	  let diagnisticData = {'identify': sessionStorage.getItem('identifyDiagnostic'), 'explore': sessionStorage.getItem('exploreDiagnostic'), 'duration': String(duration).slice(19,24)}

	  function sendData(){
		let idata, edata, identifyLog, exploreLog, mapType, url;
		idata = sessionStorage.getItem('identify')
		edata = sessionStorage.getItem('explore')
		identifyLog = sessionStorage.getItem('identifyLog')
		exploreLog = sessionStorage.getItem('exploreLog')
		mapType = sessionStorage.getItem('mapType')

		if (+sessionStorage.getItem('lrValue') % 2 == 0) {
			url = 'choropleth'.concat('-').concat( sessionStorage.getItem('pid')) //Use Prolific ID instead
		}
		else {
			url = 'surprise'.concat('-').concat( sessionStorage.getItem('pid'))
		}
		if (sessionStorage.getItem('submitted').substring(1,6) == 'false'){
				let data = {'url': url, 'identify': idata, 'explore': edata, 'iLog': identifyLog, 'eLog': exploreLog, 'dData': diagnisticData};
				let options = {
					method : 'POST',
					headers : {'Content-Type':'application/json'},
					body : JSON.stringify(data)
				};
				fetch('/dbdata', options);
				}
			sessionStorage.setItem('submitted', JSON.stringify('true'))
	  }
	  
	 