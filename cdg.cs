using System;
using System.IO;

public class CDG_Test {
	// Read CDG file and print out some of the packets for comparison ...
	public static void Main(string[] args) {
		int packetSize = 24;
		int maxReadBytes = (packetSize * 100); // for debugging
		int packetByteIndicesFilled = 0;
		byte[] packet = new byte[24];

		byte[] bytes = File.ReadAllBytes(args[0]);
		Console.WriteLine("{0} bytes", bytes.Length);

		for (var i = 0; i < maxReadBytes; i++) {
			if (packetByteIndicesFilled < 23) {
				packet[packetByteIndicesFilled] = bytes[i];
				packetByteIndicesFilled++;
			} else {
				processPacket(packet);
				packetByteIndicesFilled = 0;
				packet = new byte[24];
			}
		}
	}

	byte commandMask = 0x3F;

	static void processPacket(byte[] packet) {
		Console.WriteLine("Packet {0}", packet.Length);
		int command = packet[0] & 0x3F;
		int instruction = packet[1] & 0x3F;
		byte[] data = new byte[16];
		Array.Copy(packet, 4, data, 0, 16);

		// Only care about Tile Block Normal/XOR for now ...
		//Console.WriteLine("Command {0}", command);
		//Console.WriteLine("Instruction {0}", instruction);
		if (command == 9 && (instruction == 6 || instruction == 38))
			processTilePacket(data, instruction == 6);
	}

	static void processTilePacket(byte[] data, bool xor) {
		int color0 = data[0] & 0x0F;
		int color1 = data[1] & 0x0F;
		int row = data[2] & 0x1F;
		int column = data[3] & 0x3F;
		//byte[] tilePixels = ...
		string type = xor ? "XOR" : "Normal";
		Console.WriteLine("({0}) Row: {1} Column: {2}", type, row, column);
	}
}
