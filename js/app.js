
void function () {
	var API_KEY = '5eec3a52201d4802af6fa487025b0669c3da9015c7cd9b971ef9f3cb8e6645c042a3ba852f4ef0e58bf30db5e6cc04fa9e27bb140a9955977279ae0cf92a9d7e34a9e75ce84a3cd19f184be381035f50';
  var ui;
  var templates;
  var location;

  function init () {
  	initLocation();
    initTemplates();
    initUI();
    initMap();
    render();
  }

  function initLocation () {
  	location = {
    	commute: {},
    	pubs: {},
			housing: {}
  	};
  }

  function initTemplates () {
    templates = {
      commute: Handlebars.compile(document.querySelector('#commute-template').innerHTML),
      housing: Handlebars.compile(document.querySelector('#housing-template').innerHTML),
      schools: Handlebars.compile(document.querySelector('#schools-template').innerHTML),
      pubs: Handlebars.compile(document.querySelector('#pubs-template').innerHTML),
    };
  }


  function initUI () {
    ui = {
      locationName: document.querySelector('#location-name'),
      sections: {
        commute: document.querySelector('#commute'),
        housing: document.querySelector('#housing'),
        schools: document.querySelector('#schools'),
        pubs: document.querySelector('#pubs'),
      },
    };
  }


  function initMap () {
    var map = L.map('map').setView([51.505, -0.09], 9);
    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
        maxZoom: 18,
        id: 'paulcuth.o5b8k4jd',
        accessToken: 'pk.eyJ1IjoicGF1bGN1dGgiLCJhIjoiY2lneGZqYngxMDBiaXYwa3JodnkzYms2cCJ9.dcD_UgOC_uxtd83QO47dNA'
    }).addTo(map);

    map.on('click', handleMapClick);
  }


  function renderSection (section) {
    ui.sections[section].innerHTML = templates[section](location[section]);
  }


  function render () {
    if (location.name) {
      ui.locationName.textContent = location.name;

      renderSection('commute');
      renderSection('housing');
      renderSection('schools');
      renderSection('pubs');
    }
  }


  function getJSON (url) {
    return window.fetch(url, {
      method: 'GET',
      mode: 'cors',
      headers: {
          'Accept': 'text/json'
      }
    }).then(function (res) {
      return res.json();
    });
  }

  function getPostcode (lat, lng) {
    var url='http://postcodes.io/postcodes?lat=' + lat + '&lon=' + lng;

    return getJSON(url).then(function (json) {
      if (json.result && json.result[0]) {
        return json.result[0].postcode;
      }
    });
  }


  function handleMapClick (e) {
  	initLocation();
  	render();
    getPostcode(e.latlng.lat, e.latlng.lng).then(function (postcode) {
      location.name = postcode;
			console.log(postcode)
      getCommuteInfo(postcode);
      getPubInfo(postcode);
			getHousingCosts(postcode);
      render();
    });
  }





  function getCommuteInfo(postcode) {
    location.commute.time = '<span class="loading">Searching...</span>';
    location.commute.station = '<span class="loading">Searching...</span>';
    location.commute.cost = '<span class="loading">Searching...</span>';

    var API_GUID_PROPERTY_SEARCH = '6093274c-6b22-4dc4-89bc-c3af3b1eaf62';
    var API_GUID_RAIL_STATION_FINDER = 'aa832bae-d298-4943-844d-10cb71bc2a64';
    var API_GUID_TRAIN_TIME_FINDER = '8e7df55d-a278-4e96-a83e-1e87f245ba82';
    var API_GUID_TICKET_PRICES_FINDER = '5bb3976c-7b53-4f38-a0c7-b76f7a88d47c';
    var traintime = '800'; // 8am
    var traindate = '13-nov-2015' // day of the datathlon!

    var propSearchApi = 'https://api.import.io/store/data/' + API_GUID_PROPERTY_SEARCH + '/_query?input/webpage/url=http://www.zoopla.co.uk/for-sale/property/' + postcode + '&_apikey=' + API_KEY;

    getJSON(propSearchApi).then(function(data) {
      var propertyUrl = data.results[0].property_link;
      var railStationFinder = 'https://api.import.io/store/data/' + API_GUID_RAIL_STATION_FINDER + '/_query?input/webpage/url=' + propertyUrl + '&_apikey=' + API_KEY;
      return getJSON(railStationFinder);

    }).then(function(data) {
      location.commute.station = data.results[0].station;
      render();
      var trainTimeFinder = 'https://api.import.io/store/data/' + API_GUID_TRAIN_TIME_FINDER + '/_query?input/webpage/url=https://www.thetrainline.com/train-times/' + location.commute.station.replace(' ', '-') + '-to-london-liverpool-street/' + traindate + '/' + traintime + '&_apikey=' + API_KEY;
      return getJSON(trainTimeFinder);

    }).then(function(data) {
      if (data.results && data.results[0]) {
        location.commute.time = data.results[0].duration;
        render();
      }

    }).then(function(data) {
      var ticketPricesFinder = 'https://api.import.io/store/data/' + API_GUID_TICKET_PRICES_FINDER + '/_query?input/webpage/url=http://tickets.northernrail.org/s/season-tickets/' + location.commute.station.replace(' ', '%20') + '/London%20Liverpool%20Street/adult/2015-11-14/0100,1200&_apikey=' + API_KEY;
			return getJSON(ticketPricesFinder);

    }).then(function(data) {
      location.commute.cost = getAnnualCost(data.results);
      render();

    }).catch(function (e) {
      console.error(e);
      location.commute.time = 'Unknown';
      render();
    });
  }


  function getAnnualCost(prices) {
  	for(var i = 0; i < prices.length; i++) {
  		if(prices[i].length == '12 months') return prices[i]['cost/_source'];
  	}
  }

  function getPubInfo(postcode) {
    location.pubs.name = '<span class="loading">Searching...</span>';
    location.pubs.rating = '<span class="loading">Searching...</span>';

    var API_GUID_PUB_SEARCH = '90845a10-7b0a-4f25-8da4-c9b3b93aeae4';
    
    var pubSearchApi = 'https://api.import.io/store/data/' + API_GUID_PUB_SEARCH + '/_query?input/webpage/url=http://www.beerintheevening.com/pubs/results.shtml?l=' + postcode + '&_apikey=' + API_KEY;
    
    getJSON(pubSearchApi).then(function(data) {
      if (data.results && data.results[0]) {
				location.pubs.name = data.results[0]['name/_text'];
				location.pubs.rating = data.results[0].rating;
			}
			render();
    });
  }

	function getHousingCosts(postcode){
		var API_GUID_RENT_PRICES = '65872983-e460-4542-8345-1e8c3b61a28b';
		var API_GUID_SALE_PRICES = 'e4b633fc-93a3-45ba-b622-eb03e93dc219';

		var propSearchApi = 'https://api.import.io/store/data/' + API_GUID_SALE_PRICES + '/_query?input/webpage/url=http://www.zoopla.co.uk/market/uk/' + postcode + '&_apikey=' + API_KEY;

		getJSON(propSearchApi).then(function(data) {
			console.log(data);
			if (data.results && data.results[0]) {
				location.housing.record = [];
				for (i = 0; i < data.results.length; i++) {
					location.housing.record.push({
						two_beds: data.results[i].two_beds,
						dwelling_type: data.results[i]["dwelling_type/_text"],
						one_bed: data.results[i].one_beds,
						three_beds: data.results[i].three_beds,
						four_beds: data.results[i].four_beds,
						five_beds: data.results[i].five_beds
					});
				}
			render();
			}
		}).catch(function (e) {
			console.error(e);
				//location.housing.record.two_beds = '',
				//location.housing.record.one_bed = '',
				//location.housing.record.three_beds = '',
				//location.housing.record.four_beds = '',
				//location.housing.record.five_beds = ''
			render();
		});

	}

  window.addEventListener('load', init);
}();
