var fs = require('fs'),
    boards = [],
    pins = [],
    totalpins = 0,
    _board_elems,
    _pin_elems,
    _new_boards = [];

var casper = require('casper').create({
  verbose: true,
  logLevel: "debug",
  pageSettings : {
    loadImages:  false,
    webSecurityEnabled : false
  }
});


function tryAndScroll(casper){
  casper.waitFor(function(){
    this.page.scrollPosition = {
      top: this.page.scrollPosition["top"] + 4000,
      left: 0
    }
    return true;
  }, function(){
    _pin_elems = this.evaluate(function(){
      return document.querySelectorAll('.item .pinWrapper');
    });
    if( _pin_elems.length < totalpins ) {
      this.emit('results.loaded')
    }
  }, function() {
    this.echo("Scrolling failed. Sorry.").exit();
  }, 5000)
}


casper.on('results.loaded', function () {
  tryAndScroll(this);
});



casper
.start('http://www.pinterest.com/vintageea/')
.then(function(){
  boards = this.evaluate(function(){
    // get all boards
    _board_elems = document.querySelectorAll('.GridItems .item');

    return [].map.call(_board_elems, function(elem){
      return {
        'name' : elem.querySelector('.boardName .title').textContent,
        'link' : 'http://pinterest.com' + elem.querySelector('.boardLinkWrapper').getAttribute('href'),
      };
    });
  });
})
.then(function(){

  casper.each(boards, function(self, board){

    self.thenOpen(board.link, function(){

      totalpins = casper.evaluate(function(){
        return parseFloat(document.querySelector('.PinCount').textContent); // total pins
      });

      tryAndScroll(this);

      // done loading all pins
      // construct a map of pin name
      // and link
      var pins = this.evaluate(function(){
        _pin_elems = document.querySelectorAll('.item .pinWrapper');

        return [].map.call(_pin_elems, function(elem){
          return {
            'name' : elem.querySelector('.pinMeta .pinDescription').textContent,
            'link' : 'https://pinterest.com/' + elem.querySelector('.pinImageWrapper').getAttribute('href')
          };
        });
      });

      var counter = 1;
      casper.each(pins, function(self, pin){

        // click on each pin
        self.then(function(){
          this.click('.item:nth-child('+counter+') .pinImageWrapper');
        })
        .then(function(){
          // wait for 2 seconds for the pin overlay to load
          casper.wait(2000, function(){
            //casper.capture('pin.png');
            //casper.log('clicked on a pin, new location is ' + this.getCurrentUrl());
            //casper.capture('pin-'+counter+'.png');
          });
        })
        .then(function(){
          var pin_image_src = this.evaluate(function(){
            return document.querySelector('.appendedContainer .pinImage').getAttribute('src');
          });
          var _filename = pin_image_src.split('/').pop(); //splits url to array, pops lat index

          casper.download(pin_image_src, 'backup/'+board.name+'/'+_filename);

          //increment count and move back
          counter = counter + 1;
        });

      });

    });
  });
  // this.thenOpenAndEvaluate(boards[0].link, function(){
  //   casper.log('clicked ok, new location is ' + this.getCurrentUrl());

  //   _pin_elems = document.querySelectorAll('.pinWrapper');

  //   pins.map.call(_pin_elems, function(elem){
  //     return {
  //       'name' : elem.querySelector('.pinMeta .pinDescription').textContent,
  //       'link' : 'https://pinterest.com/' + elem.querySelector('.pinImageWrapper').getAttribute('href'),
  //     };
  //   });

  //   casper.log('saving pins');
  //   fs.write('pins.txt', JSON.stringify(pins), 'w');
  // });
});
// .then(function(){
//   // casper.log('saving boards and pins');
//   fs.write('boards.json', JSON.stringify(_new_boards), 'w');
// })
// DO THE SAVE
// .then(function(){
//   casper.each(_new_boards, function(self, board){

//     fs.makeDirectory('backup/'+board.name);

//     casper.each(board.pins, function(self, pin){
//       self.thenOpen(pin.link, function(){

//         var pin_image_src = this.evaluate(function(){
//           return document.querySelector('.appendedContainer .pinImage').getAttribute('src');
//         });

//         var _filename = pin_image_src.split('/').pop(); //splits url to array, pops lat index

//         casper.download(pin_image_src, 'backup/'+board.name+'/'+_filename);
//       });
//     })

//   });
// });

// casper.then(function(){
//   casper.log('clicked the first pin');
//   casper.click(_pin_elems[0].querySelector('.pinImageWrapper')); // click the first pin
// });

// casper.waitFor(function(){
//   casper.log('waiting for the popup showing the pin');
//   return this.evaluate(function() {
//     return document.querySelectorAll('.appendedContainer .pinImage').length > 0;
//   });
// }, function then(){
//   casper.log('done waiting for pin');
//   casper.download(document.querySelectorAll('.appendedContainer .pinImage').getAttribute('src'), 'pin.jpg');
//   casper.log('downloaded pin to local succefully');

// });

casper.run();
