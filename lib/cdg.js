function CDG() {
  var packetSizeInBytes = 24;
  var validPacketInstruction = 9;

  // TODO normalize better (less low-level) for end-users once we have pixels/etc ...
  var instructionNames = {
    1: "Memory Preset",
    2: "Border Preset",
    6: "Tile Block (Normal)",
    20: "Scroll Preset",
    24: "Scroll Copy",
    28: "Define Transparent Color",
    30: "Load Color Table (0-7)",
    31: "Load Color Table (8-15)",
    38: "Tile Block (XOR)"
  };

  this.onPacket = null;

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
    var command = packetBytes[0] & 0x3F;
    if (command != validPacketInstruction)
      return null;

    var packet = new CDGPacket();
    packet.instructionId = packetBytes[1] & 0x3F;
    packet.instructionName = instructionNames[packet.instructionId];
    return packet;
  }
}

function CDGPacket() {
  this.instruction = null;
}
