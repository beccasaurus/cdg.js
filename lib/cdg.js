function CDG() {
  // CDG can keep its own current .colorTable (private) and use it to return true colors with each packet

  var packetSizeInBytes = 24;
  var validPacketInstruction = 9;

  this.onPacket = null;

  this.loadFile = function(file) {
    var reader = new FileReader();
    var packetCallback = this.onPacket;
    reader.onload = function(e) {
      var arrayBuffer = reader.result;
      var readPackets = 0;
      // TODO implement timer - you want each packet for the appropriate microsecond, not to while() thru them
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
    var command = packetBytes[0] & 0x3F; // only first 6 bits
    if (command != validPacketInstruction)
      return null;

    var packet = new CDGPacket();
    packet.instructionId = packetBytes[1] & 0x3F;
    packet.instruction = instructions[packet.instructionId]; // currently just for debugging
    instructionRoutines[packet.instructionId](packetBytes, packet);

    return packet;
  };

  var onMemoryPreset = function(packetBytes, packet) {
    var dataBytes = new Uint8Array(packetBytes, 4, 16); // 4 is offset.  0/command, 1/instruction, 2-3/parityQ, 4-12/data, 13-16/parityP
    var color = dataBytes[0] & 0x0F; // only first 4 bits
    var repeat = dataBytes[1] & 0x0F; // ignore if repeat != 0 (? - all 1 tho ...)
    packet.color = color;
    packet.repeat = repeat;
  };

  var onLoadColorTable1 = function(packetBytes, packet, offset) {
    if (! offset) offset = 0;
    var dataBytes = new Uint8Array(packetBytes, 4, 16); // 4 is offset.  0/command, 1/instruction, 2-3/parityQ, 4-12/data, 13-16/parityP
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

  var onLoadColorTable2 = function(packetBytes, packet) {
    onLoadColorTable1(packetBytes, packet, 8);
  };

  var onBorderPreset = function(packetBytes, packet) { packet.unsupportedInstruction = true; }
  var onTileBlockNormal = function(packetBytes, packet) { packet.unsupportedInstruction = true; }
  var onScrollPreset = function(packetBytes, packet) { packet.unsupportedInstruction = true; }
  var onScrollCopy = function(packetBytes, packet) { packet.unsupportedInstruction = true; }
  var onDefineTransparentColor = function(packetBytes, packet) { packet.unsupportedInstruction = true; }
  var onTileBlockXOR = function(packetBytes, packet) { packet.unsupportedInstruction = true; }

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
