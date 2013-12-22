var board, visiblepins, backup_folder_name, pins = [];

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
  }, 20000);
}

function getboard(url){
  // might be good to validate the url here
  casper
    .start(url, function(){

      var d = new Date();
      var _string_timestamp = d.getFullYear()+'-'+d.getMonth()+' '+d.getHours()+'-'+d.getMinutes()+'-'+d.getSeconds();

      board = this.evaluate(function(){
        return  {
          'name' :  document.querySelector('.boardName').textContent,
          'totalpins' : parseFloat(document.querySelector('.PinCount').textContent)
        };
      });

      backup_folder_name = _string_timestamp +' '+ board.name; //folder name: {timestamp} {board name}

      visiblepins = this.evaluate(function(){
        return document.querySelectorAll('.item .pinWrapper').length;
      });

      if( visiblepins < board.totalpins ) {
        tryAndScroll(this); //scroll down the board
      }
    })
    .then(function(){
      //all clear now
      //create an object of all pins
      pins = this.evaluate(function(){

        var pinelems = document.querySelectorAll('.item .pinWrapper');

        var index = 0;
        return [].map.call(pinelems, function(elem, index){

          // there are times when there is no pin description
          var _decription = elem.querySelector('.pinMeta .pinDescription');
          if( _decription ) {
            pin_title = _decription.textContent;
          } else {
            pin_title = '';
          }

          index++; //increment index since there is no child index 0
          return {
            'click_target' : '.item:nth-child('+index+') .pinImageWrapper',
            'name' : pin_title,
            'link' : 'https://pinterest.com' + elem.querySelector('.pinImageWrapper').getAttribute('href')
          };
        });
      });

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


            casper.download(pin_image_src, 'backup/'+backup_folder_name+'/'+_filename);

            if (fs.exists('backup/'+backup_folder_name+'/'+_filename)) {
              board.downloaded_pins = board.downloaded_pins || [];

              //record this pin has been downloaded
              board.downloaded_pins.push({
                'title' : pin.name,
                'url' : pin.link,
                'image_name' : _filename,
              });

            }

          }, function() {
            this.echo("Failed to load one or more pins, please try again later").exit();
          }, 5000);
        });
      });

    })
    .then(function(){
      // once the backup is done, store a json containing the
      // backup data
      fs.write('backup/' + backup_folder_name + '/backup.json', JSON.stringify(board), 'w');
    });

}

casper.run();

