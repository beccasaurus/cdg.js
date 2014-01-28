function CDG() {
  // CDG can keep its own current .colorTable (private) and use it to return true colors with each packet

  var packetSizeInBytes = 24;
  var validPacketInstruction = 9;

  // TODO normalize better (less low-level) for end-users once we have pixels/etc ...
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
    packet.instructionName = instructions[packet.instructionId];

    // inline instructions - TODO refactor
    if (packet.instructionId == instructions.MemoryPreset) {
      // read data bytes from packet
      var dataBytes = new Uint8Array(packetBytes, 4, 16); // 4 is offset.  0/command, 1/instruction, 2-3/parityQ, 4-12/data, 13-16/parityP
      var color = dataBytes[0] & 0x0F; // only first 4 bits
      var repeat = dataBytes[1] & 0x0F; // ignore if repeat != 0 (? - all 1 tho ...)
      packet.color = color;
      packet.repeat = repeat;

    } else if (packet.instructionId == instructions.LoadColorTable1) {
      var dataBytes = new Uint8Array(packetBytes, 4, 16); // 4 is offset.  0/command, 1/instruction, 2-3/parityQ, 4-12/data, 13-16/parityP
      // each color table contains 8 colors in 16 bytes
      // the high byte contains the RRRRGG bits and the low contains GGBBBB
      // the full CDG "program" color table stores 16 colors for instructions to utilize
      var colorTable = {};
      for (var i = 0; i < 8; i++) {
        var color = (dataBytes[2*i] << 6) + (dataBytes[2*1 + 1] & 0x3F); // hmm ... why mask/shift these ones ...
        var red = (color >> 8) & 0x000F;
        var green = (color >> 4) & 0x000F;
        var blue = (color) & 0x000F;
        colorTable[i] = [red, green, blue];
      }
      packet.colorTable = colorTable;

    } else if (packet.instructionId == instructions.LoadColorTable2) {
      var dataBytes = new Uint8Array(packetBytes, 4, 16); // 4 is offset.  0/command, 1/instruction, 2-3/parityQ, 4-12/data, 13-16/parityP
      var colorTable = {};
      for (var i = 0; i < 8; i++) {
        var color = (dataBytes[2*i] << 6) + (dataBytes[2*1 + 1] & 0x3F);
        var red = (color >> 8) & 0x000F;
        var green = (color >> 4) & 0x000F;
        var blue = (color) & 0x000F;
        colorTable[i + 8] = [red, green, blue];
      }
      packet.colorTable = colorTable;
    }

    return packet;
  }
}

function CDGPacket() {
}
