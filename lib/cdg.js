// TODO use requestAnimationFrame
// TODO make prototypical
function CDG() {

  var packetSizeInBytes = 24;
  var validPacketInstruction = 9;

  var masks = {
    lower4bits: 0x0F,
    lower5bits: 0x1F,
    lower6bits: 0x3F
  };

  this.colorTable = {};

  this.onPacket = null;

  this._arrayBuffer = null;
  this._readPackets = 0;
  this.stopped = false;

  this._read = function() {
    if (this.stopped) return;
    if ((this._readPackets * packetSizeInBytes) < this._arrayBuffer.byteLength) {
      var startByte = this._readPackets * 24;
      var bytesRemaining = this._arrayBuffer.byteLength - (this._readPackets * packetSizeInBytes);
      if (bytesRemaining < 24) {
        console.log("Only " + bytesRemaining + " left to read");
        return;
      }
      var packetBytes = new Uint8Array(this._arrayBuffer, startByte, 24);
      this._readPackets++;
      var packet = packetFromBytes.call(this, packetBytes);
      if (packet && this.onPacket)
        this.onPacket(packet);

      var cdg = this;
      setTimeout(function() { cdg._read.call(cdg); }, 10);
    }
  };

  // TODO implement timer - you want each packet for the appropriate microsecond, not to while() thru them
  this.loadFile = function(file) {
    var reader = new FileReader();
    var cdg = this;
    reader.onload = function(e) {
      cdg._arrayBuffer = reader.result;
      cdg._read();
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

    instructionRoutines[packet.instructionId].call(this, dataBytes, packet);

    return packet;
  };

  var onMemoryPreset = function(dataBytes, packet) {
    var color = dataBytes[0] & masks.lower4bits;
    var repeat = dataBytes[1] & masks.lower4bits;
    packet.fillColor = this.colorTable[color]; // NOTE some CDGs might draw before defining colors!
    packet.repeat = repeat;
  };

  var onBorderPreset = function(dataBytes, packet) {
    var color = dataBytes[0] & masks.lower4bits;
    packet.borderColor = this.colorTable[color]; // NOTE some CDGs might draw before defining colors!
  }

  var onLoadColorTable1 = function(dataBytes, packet, offset) {
    if (! offset) offset = 0;
    for (var i = 0; i < 8; i++) {
      var color = (dataBytes[2 * i] & masks.lower6bits) << 8
      color = (dataBytes[(2 * i) + 1] & masks.lower6bits)
      color = ((color & 0x3F00) >> 2) | (color & 0x003F)
      red = ((color & 0x0F00) >> 8) * 17
      green = ((color & 0x00F0) >> 4) * 17
      blue = ((color & 0x000F)) * 17
      this.colorTable[i + offset] = [red, green, blue];
    }
    packet.colorTable = this.colorTable;
  };

  var onLoadColorTable2 = function(dataBytes, packet) {
    onLoadColorTable1.call(this, dataBytes, packet, 8);
  };

  var onTileBlockNormal = function(dataBytes, packet) {
    var color0 = dataBytes[0] & masks.lower4bits;
    var color1 = dataBytes[1] & masks.lower4bits;
    var columnIndex = (dataBytes[2] & 0x1F) * 12;
    var rowIndex = (dataBytes[3] & 0x3F) * 6;
    
    packet.pixels = [];

    for (var i = 0; i < 12; i++) {
      var byte = dataBytes[4 + i] & masks.lower6bits;
      for (var j = 0; j < 6; j++) {
        var position = [rowIndex + j, columnIndex + i];
        var pixelChoice = (byte >> (5 - j)) & 0x01;
        var colorIndex = pixelChoice == 0 ? color0 : color1;
        packet.pixels.push({ position: position, color: this.colorTable[colorIndex] });
      }
    }
  }

  var onTileBlockXOR = function(dataBytes, packet) { packet.unsupportedInstruction = true; }
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
