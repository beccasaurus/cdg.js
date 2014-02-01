function CDG() {

  var packetSizeInBytes = 24;
  var validPacketInstruction = 9;

  var masks = {
    lower4bits: 0x0F,
    lower5bits: 0x1F,
    lower6bits: 0x3F
  };

  this.onPacket = null;

  // TODO implement timer - you want each packet for the appropriate microsecond, not to while() thru them
  this.loadFile = function(file) {
    var reader = new FileReader();
    var packetCallback = this.onPacket;
    reader.onload = function(e) {
      var arrayBuffer = reader.result;
      var readPackets = 0;
      while ((readPackets * packetSizeInBytes) < arrayBuffer.byteLength) {
        var startByte = readPackets * 24;
        var bytesRemaining = arrayBuffer.byteLength - (readPackets * packetSizeInBytes);
        if (bytesRemaining < 24) {
          console.log("Only " + bytesRemaining + " left to read");
          break;
        }
        var packetBytes = new Uint8Array(arrayBuffer, startByte, 24);
        readPackets++;
        var packet = packetFromBytes(packetBytes);
        if (packet && packetCallback)
          packetCallback(packet);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  var packetFromBytes = function(packetBytes) {
    var command = packetBytes[0] & masks.lower6bits;
    if (command != validPacketInstruction)
      return null;

    // TODO pass on databytes to functions
    var packet = new CDGPacket();

    packet.instructionId = packetBytes[1] & masks.lower6bits;
    packet.instruction = instructions[packet.instructionId]; // currently just for debugging

    // 4 is offset.  0/command, 1/instruction, 2-3/parityQ, 4-12/data, 13-16/parityP
    var dataBytes = new Uint8Array(packetBytes, 4, 16);

    instructionRoutines[packet.instructionId](dataBytes, packet);

    return packet;
  };

  var onMemoryPreset = function(dataBytes, packet) {
    var color = dataBytes[0] & masks.lower4bits;
    var repeat = dataBytes[1] & masks.lower4bits; // ignore if repeat != 0 (? - all 1 tho ...)
    packet.color = color;
    packet.repeat = repeat;
  };

  var onLoadColorTable1 = function(dataBytes, packet, offset) {
    if (! offset) offset = 0;
    var colorTable = {};
    for (var i = 0; i < 8; i++) {
      var color = (dataBytes[2*i] << 6) + (dataBytes[2*1 + 1] & 0x3F); // hmm ... why mask/shift these ones ...
      var red = (color >> 8) & 0x000F;
      var green = (color >> 4) & 0x000F;
      var blue = (color) & 0x000F;
      colorTable[i + offset] = [red, green, blue];
    }
    packet.colorTable = colorTable;
  };

  var onLoadColorTable2 = function(dataBytes, packet) {
    onLoadColorTable1(dataBytes, packet, 8);
  };

  var onTileBlockNormal = function(dataBytes, packet) {
    packet.color0 = dataBytes[0] & masks.lower4bits;
    packet.color1 = dataBytes[1] & masks.lower4bits;
    packet.row = dataBytes[2] & masks.lower5bits;
    // packet.y = packet.row * 12;
    packet.column = dataBytes[3] & masks.lower6bits;
    // packet.x = packet.column * 6;
    
    // each pixel is for color choice (0 or 1)

    // var tilePixelBytes = new ArrayBuffer(12);
    // var tilePixels = new Int8Array(tilePixelBytes); // new ArrayBufferView(tilePixelBytes);
    // for (var i = 0; i < tilePixelBytes.byteLength; i++) {
    //   var tileByte = dataBytes[i + 4] & masks.lower6bits;
    //   tilePixels[i] = tileByte;
    // }
    // packet.pixels = tilePixels; // grr ... I want bits ...

    // each tilePixelByte contains 6 pixels
    // 0 bits use color0, 1 bits use color1
    // each tile is 6x12 (width*height)
    // only need the first to get the color for scanline?
    // ...
  }

  var onTileBlockXOR = function(dataBytes, packet) { packet.unsupportedInstruction = true; }

  var onBorderPreset = function(dataBytes, packet) { packet.unsupportedInstruction = true; }
  var onScrollPreset = function(dataBytes, packet) { packet.unsupportedInstruction = true; }
  var onScrollCopy = function(dataBytes, packet) { packet.unsupportedInstruction = true; }
  var onDefineTransparentColor = function(dataBytes, packet) { packet.unsupportedInstruction = true; }

  var instructionRoutines = {
    1: onMemoryPreset,
    2: onBorderPreset,
    6: onTileBlockNormal,
    20: onScrollPreset,
    24: onScrollCopy,
    28: onDefineTransparentColor,
    30: onLoadColorTable1,
    31: onLoadColorTable2,
    38: onTileBlockXOR
  };

  // For debugging/etc ... really not needed unless we create low-level command support, instead of just a higher-level API
  var instructions = {
    1: "Memory Preset", MemoryPreset: 1,
    2: "Border Preset", BorderPreset: 2,
    6: "Tile Block (Normal)", TileBlockNormal: 6,
    20: "Scroll Preset", ScrollPreset: 20,
    24: "Scroll Copy", ScrollCopy: 24,
    28: "Define Transparent Color", DefineTransparentColor: 28,
    30: "Load Color Table (0-7)", LoadColorTable1: 30,
    31: "Load Color Table (8-15)", LoadColorTable2: 31,
    38: "Tile Block (XOR)", TileBlockXOR: 38
  };
}

function CDGPacket() {
}
