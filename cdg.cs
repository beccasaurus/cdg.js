using System;
using System.IO;

public class CDG_Test {

	// Read CDG file and print out some of the packets for comparison ...
	public static void Main(string[] args) {
		int packetSize = 24;
		int maxReadBytes = (packetSize * 30); // for debugging
		int packetByteIndicesFilled = 0;
		byte[] packet = new byte[24];
		byte[] bytes = File.ReadAllBytes(args[0]);

		for (var i = 0; i < maxReadBytes; i++) {
			packet[packetByteIndicesFilled] = bytes[i];
			packetByteIndicesFilled++;
			if (packetByteIndicesFilled == 24) {
				processPacket(packet);
				packetByteIndicesFilled = 0;
				packet = new byte[24];
			}
		}
	}

	static void processPacket(byte[] packet) {
		int command = packet[0] & 0x3F;
		int instruction = packet[1] & 0x3F;
		byte[] data = new byte[16];
		Array.Copy(packet, 4, data, 0, 16);

		Console.WriteLine("Command {0}", command);
		Console.WriteLine("Instruction {0}", instruction);

		if (command == 9 && (instruction == 6 || instruction == 38))
			processTilePacket(data, instruction == 6);
	}

	static void processTilePacket(byte[] data, bool xor) {
		int color0 = data[0] & 0x0F;
		int color1 = data[1] & 0x0F;
		int row = data[2] & 0x1F;
		int column = data[3] & 0x3F;
		string type = xor ? "XOR" : "Normal";
		Console.WriteLine("({0}) Row: {1} Column: {2}", type, row, column);
	}
}
