
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
    	commute: {}
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

      getCommuteTime(postcode);
      getCommuteCost();

      render();
    });
  }





  function getCommuteTime(postcode) {
    location.commute.time = '<span class="loading">Searching...</span>';
    location.commute.station = '<span class="loading">Searching...</span>';

    var API_GUID_PROPERTY_SEARCH = '6093274c-6b22-4dc4-89bc-c3af3b1eaf62';
    var API_GUID_TRAIN_TIME_FINDER = '8e7df55d-a278-4e96-a83e-1e87f245ba82';
    var API_GUID_RAIL_STATION_FINDER = 'aa832bae-d298-4943-844d-10cb71bc2a64';
    var traintime = '800'; // 8am
    var traindate = '13-nov-2015' // day of the datathlon!
        
    var propSearchApi = 'https://api.import.io/store/data/' + API_GUID_PROPERTY_SEARCH + '/_query?input/webpage/url=http://www.zoopla.co.uk/for-sale/property/' + postcode + '&_apikey=' + API_KEY;
    
    getJSON(propSearchApi).then(function(data) {
console.log(data);

      var propertyUrl = data.results[0].property_link;
      var railStationFinder = 'https://api.import.io/store/data/' + API_GUID_RAIL_STATION_FINDER + '/_query?input/webpage/url=' + propertyUrl + '&_apikey=' + API_KEY;      
      return getJSON(railStationFinder);

    }).then(function(data) {
      var station = data.results[0].station;
      location.commute.station = station;
      render();
      var trainTimeFinder = 'https://api.import.io/store/data/' + API_GUID_TRAIN_TIME_FINDER + '/_query?input/webpage/url=https://www.thetrainline.com/train-times/' + station.replace(' ', '-') + '-to-london-liverpool-street/' + traindate + '/' + traintime + '&_apikey=' + API_KEY;
      return getJSON(trainTimeFinder);

    }).then(function(data) {
      if (data.results && data.results[0]) {
        location.commute.time = data.results[0].duration;
        render();
      }

    }).catch(function (e) {
      console.error(e);
      location.commute.time = 'Unknown';
      render();
    });
  }  


  function getCommuteCost(postcode) {
    location.commute.cost = '<span class="loading">N/A</span>';
  }




  window.addEventListener('load', init);
}();
