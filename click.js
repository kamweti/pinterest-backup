var fs = require('fs'),
    boards = [],
    pins = [],
    _board_elems,
    _pin_elems;

var casper = require('casper').create({
  verbose: true,
  logLevel: "debug",
  pageSettings : {
    loadImages:  false,
    webSecurityEnabled : false
  }
});


casper
.start('http://www.pinterest.com/kamweti/')
.then(function(){
  this.click('.GridItems .item:first-child .boardLinkWrapper');
})
.then(function(){
  //wait for 5 seconds for the pins to load
  casper.wait(5000, function(){
    //casper.capture('pins.png');
    var _pin_elems = this.evaluate(function(){
      return document.querySelectorAll('.pinWrapper');
    });
    //this.echo(_pin_elems.length + ' pins');
  });
})
.then(function(){
  this.click('.pinWrapper:first-child .pinImageWrapper');
})
.then(function(){
  // wait for 5 seconds for the pin
  casper.wait(5000, function(){
    //casper.capture('pin.png');
  });
})
.then(function(){
  pin_image_src = this.evaluate(function(){
    return document.querySelector('.appendedContainer .pinImage').getAttribute('src');
  });

  casper.download(pin_image_src, 'pins/pin.png');
})

casper.run();
