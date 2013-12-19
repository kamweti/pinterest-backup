var fs = require('fs');


var casper = require('casper').create({
    verbose: true,
    logLevel: "debug"
});

casper.start('http://www.pinterest.com/vintageea/vintage-east-africa-car-badges/', function(){

  var pins = this.evaluate(getPins);

});

casper.waitFor(function(){
  return this.evaluate(function() {
    return document.querySelectorAll('.pinWrapper').length > 0;
  });
}, function then() {
  var _pin_elems = document.querySelectorAll('.pinWrapper');

  pins.map.call(_pin_elems, function(elem){
    return {
      'name' : elem.querySelector('.pinMeta .pinDescription').textContent,
      'link' : 'http://pinterest.com/' + elem.querySelector('.pinImageWrapper').getAttribute('href'),
    };
  });

  fs.write('pins.txt', JSON.stringify(pins), 'w');
});


casper.run();
