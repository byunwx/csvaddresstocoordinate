var LineByLineReader = require('line-by-line');
var CSV = require('csv-string');
var Mustache = require('mustache');
var request = require('request');
var fs = require('fs');

var firstLine = true;

//pass in source csv and Mapzen search API Key:  node script.js myfile.csv search-XXXXXXX
var options = {
  sourceFile: process.argv[2]
}


var output = fs.createWriteStream('output.csv');
output.write('Address,formatted_address,Lat,Lon\n'); //write the header row of the output csv

lr = new LineByLineReader(options.sourceFile);

lr.on('line', function (line) {

  if (firstLine) {
    firstLine = false;
  } else {
    lr.pause();
    geoCode(line);
  }
});

lr.on('error', function (err) {
    // 'err' contains error object
    console.log(err);
});

lr.on('end', function () {
    console.log('Done!')


});

function geoCode(line) {

  console.log("Geocoding " + line + '...');

  var urlTemplate = 'https://maps.googleapis.com/maps/api/geocode/json?address={{searchText}}&key=AIzaSyCoUORF4kCVuSh_GVZvcJEU9hkEjg84icg';

  var url = Mustache.render(urlTemplate, {
    searchText: line,
    api_key: 'AIzaSyCoUORF4kCVuSh_GVZvcJEU9hkEjg84icg'
  });

  request(url, function(err, res, body) {
    if(err) {
      console.log(err);
      lr.resume();
    } else {
      var data = JSON.parse(body);

      if(data.results[0].geometry.location.lat && data.results[0].geometry.location.lng) {
        var newArr=[];
        newArr.push(data.results[0].geometry.location.lat);
        newArr.push(data.results[0].geometry.location.lng);
        newArr.push(data.results[0].formatted_address.replace(",", ".").replace(",", ".").replace(",", ".").replace(",", ".").replace(",", "."))
        var coords = newArr;


      } else {
        var coords = ['null','null'];
        console.log('error, no geometries found')
      }

      var outputLine = Mustache.render('{{line}},{{formatted_address}},{{lat}},{{lon}}\n',{
        line: line,
        formatted_address: newArr[2],
        lat: coords[0],
        lon: coords[1]
      });

      output.write(outputLine);

      setTimeout(function() {
        lr.resume();
      }, 200)
    }
  })
}
