var board, visiblepins, pins = [];

var fs = require('fs');

var casper = require('casper').create({
  httpStatusHandlers: {
    404: function(self, resource) {
      this.echo("Resource at " + resource.url + " not found (404)", " please check the url");
    }
  },
  verbose: true,
  logLevel: "debug",
  pageSettings : {
    loadImages:  false, // offers a faster pageload
    webSecurityEnabled : false
  }
});


if( casper.cli.has('account') ) {
  var account_url = casper.cli.raw.get('account');

}

if( casper.cli.has('board') ) {
  var board_url = casper.cli.raw.get('board');
  getboard(board_url);
}

casper.on('pins.loaded', function () {
  tryAndScroll(this);
});

// http://www.andykelk.net/tech/web-scraping-with-casperjs
function tryAndScroll(casper){
  casper.waitFor(function check(){
    this.page.scrollPosition = {
      top: this.page.scrollPosition["top"] + 4000,
      left: 0
    };
    return true;
  }, function then(){
    visiblepins = this.evaluate(function(){
      return document.querySelectorAll('.item .pinWrapper').length;
    });

    if( visiblepins < board.totalpins ) {
      this.emit('pins.loaded');
    }
  }, function() {
    this.echo("Scrolling failed. Sorry.").exit();
  });
}

function getboard(url){
  // might be good to validate the url here
  casper
    .start(url, function(){

      board = this.evaluate(function(){
        return  {
          'name' :  document.querySelector('.boardName').textContent,
          'totalpins' : parseFloat(document.querySelector('.PinCount').textContent)
        };
      });

      visiblepins = this.evaluate(function(){
        return document.querySelectorAll('.item .pinWrapper').length;
      });

      if( visiblepins < board.totalpins ) {
        tryAndScroll(this); //scroll down the board
      }

      //all clear now
      //create an object of all pins
      pins = this.evaluate(function(){
        var pinelems = document.querySelectorAll('.item .pinWrapper');

        return [].map.call(pinelems, function(elem, index){
          index++; //increment index since there is no child index 0
          return {
            'click_target' : '.item:nth-child('+index+') .pinImageWrapper',
            'name' : elem.querySelector('.pinMeta .pinDescription').textContent,
            'link' : 'https://pinterest.com/' + elem.querySelector('.pinImageWrapper').getAttribute('href')
          };
        });
      });

    })
    .then(function(){
      casper.each(pins, function(self, pin){
        // click on each pin
        self.then(function(){
          this.click(pin.click_target);
        })
        .then(function(){
          casper.waitFor(function check(){
            return this.evaluate(function() {
              return document.querySelector('.appendedContainer .pinImage') ? true : false;
            });
          },function then() {
            // download pin
            var pin_image_src = this.evaluate(function(){
              return document.querySelector('.appendedContainer .pinImage').getAttribute('src');
            });
            var _filename = pin_image_src.split('/').pop(); //splits url to array, pops lat index

            casper.download(pin_image_src, 'backup/'+board.name+'/'+_filename);

          }, function() {
            this.echo("Failed to load one or more pins, please try again later").exit();
          }, 5000)
        });

      })
    })

}

casper.run();

