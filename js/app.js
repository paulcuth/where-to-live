
void function () {
  var ui;
  var templates;
  var location = {};

  function init () {
    initTemplates();
    initUI();
    initMap();
    render();
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


  function getPostcode (lat, lng) {
    var url='http://postcodes.io/postcodes?lat=' + lat + '&lon=' + lng;

    return window.fetch(url, {
        method: 'GET',
        mode: 'cors',
        headers: {
            'Accept': 'text/json'
        }
    }).then(function (res) {
      return res.json();
    }).then(function (json) {
      if (json.result && json.result[0]) {
        return json.result[0].postcode;
      }
    });
  }


  function handleMapClick (e) {
    getPostcode(e.latlng.lat, e.latlng.lng).then(function (postcode) {
      location.name = postcode;
      render();
    });
  }



  window.addEventListener('load', init);



}()
