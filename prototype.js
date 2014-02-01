var FULL_WIDTH = 300
var FULL_HEIGHT = 216
var DISPLAY_WIDTH = 288;
var DISPLAY_HEIGHT = 192;
var TILES_PER_ROW = 6;
var TILES_PER_COL = 4;
var TILE_WIDTH = DISPLAY_WIDTH / TILES_PER_ROW;
var TILE_HEIGHT = DISPLAY_HEIGHT / TILES_PER_COL;

// Print parsed commands to <pre> when file input is updated
window.onload = function() {
  var stopButton = document.getElementById("stop");
  var uploadField = document.getElementById("upload-field");
  var debugOutput = document.getElementById("debug-output");
  var audio = document.getElementById("audio");
  var canvas = document.getElementById("display");
  var drawingCanvas = canvas.getContext("2d");

  var lastFillColor = null;

  var currentPixels = {};

  window.theCanvas = canvas;
  window.theAudio = audio;

  function rgbColor(arrayOfRGB) {
    return "rgb(" + arrayOfRGB[0] + "," + arrayOfRGB[1] + "," + arrayOfRGB[2] + ")";
  }

  var cdg = new CDG();

  stopButton.addEventListener("click", function(e) {
    cdg.stopped = true;
  });

  uploadField.addEventListener("change", function(e) {
    var packetLimit = 2000; // only print some packets
    // TODO it might not be a "packet" concept we want to return ... 
    // it's likely that we'll have / I'll want:
    //  - low-level pure CDG (needs to exist to provide higher-level simple interface for <canvas>)
    //  - higher-level callbacks per packet ??? don't focus on ...
    //  - something ideal to use to render a <canvas> ... this design will sort itself out
    cdg.onPacket = function(packet) {
      if (packetLimit == 0) return;
      // debugOutput.textContent = JSON.stringify(packet) + "\n" + debugOutput.textContent;

      if (packet.colorTable) {
        for (var colorIndex in cdg.colorTable) {
          var colorElementId = "color" + (parseInt(colorIndex) + 1);
          document.getElementById(colorElementId).style.backgroundColor = rgbColor(cdg.colorTable[colorIndex]);
        }
      } else if (packet.fillColor && lastFillColor != packet.fillColor) {
        drawingCanvas.fillStyle = rgbColor(packet.fillColor);
        drawingCanvas.fillRect(0, 0, FULL_WIDTH, FULL_HEIGHT);
        drawingCanvas.save();
      } else if (packet.borderColor) {
        drawingCanvas.fillStyle = rgbColor(packet.borderColor);
        drawingCanvas.fillRect(0, 0, FULL_WIDTH, 3);
        drawingCanvas.fillRect(0, FULL_HEIGHT - 3, FULL_WIDTH, 3);
        drawingCanvas.fillRect(0, 0, 6, FULL_HEIGHT);
        drawingCanvas.fillRect(FULL_WIDTH - 6, 0, 6, FULL_HEIGHT);
        drawingCanvas.save();
      } else if (packet.pixels) {
        for (var i in packet.pixels) {
          var pixel = packet.pixels[i];
          if (currentPixels[pixel.position] != pixel.color) {
            currentPixels[pixel.position] = pixel.color;
              drawingCanvas.fillStyle = rgbColor(pixel.color);
              drawingCanvas.fillRect(pixel.position[0], pixel.position[1], 1, 1);
              drawingCanvas.save();
          }
        }
      }

      packetLimit--;
    };

    window.currentFile = uploadField.files[0];
    cdg.loadFile(uploadField.files[0]);
  });
};

// load file input into audio[src] as data URL (base64 encoded)
function loadMp3() {
  // miroseconds: theAudio.currentTime * 1000000
  var reader = new FileReader();
  reader.onload = function(e) {
    window.theAudio.src = e.target.result;
  };
  reader.readAsDataURL(window.currentFile);
}

// new FileReader().readAsDataURL(document.getElementById("upload-field").files[0])
