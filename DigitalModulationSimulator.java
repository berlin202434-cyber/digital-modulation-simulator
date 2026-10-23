import java.util.Scanner;
import java.util.Locale;

public class DigitalModulationSimulator {

    private static final int SAMPLES_PER_BIT = 24;
    private static final int CARRIER_CYCLES = 2;
    private static final int FSK_ZERO_CYCLES = 1;
    private static final int FSK_ONE_CYCLES = 3;
    private static final double AMPLITUDE = 1.0;

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        sc.useLocale(Locale.US);

        System.out.println("======================================");
        System.out.println("  DIGITAL MODULATION SIMULATOR");
        System.out.println("  ASK | FSK | BPSK");
        System.out.println("======================================");

        System.out.print("Enter binary data: ");
        String bits = sc.nextLine().trim();

        if (bits.isEmpty() || !bits.matches("[01]+")) {
            System.out.println("Error: Enter binary bits containing only 0 and 1.");
            sc.close();
            return;
        }

        System.out.println("\\nChoose modulation:");
        System.out.println("1. ASK (Amplitude Shift Keying)");
        System.out.println("2. FSK (Frequency Shift Keying)");
        System.out.println("3. BPSK (Binary Phase Shift Keying)");
        System.out.print("Enter choice (1-3): ");

        String choice = sc.nextLine().trim();
        String type;

        switch (choice) {
            case "1": type = "ASK"; break;
            case "2": type = "FSK"; break;
            case "3": type = "BPSK"; break;
            default:
                System.out.println("Invalid choice!");
                sc.close();
                return;
        }

        double[] signal = modulate(bits, type);

        System.out.println("\\nOriginal bits : " + bits);
        System.out.println("Modulation    : " + type);
        printBitMapping(type);
        printWaveform(signal, bits.length());

        String recovered = demodulate(signal, bits.length(), type);
        System.out.println("\\nRecovered bits: " + recovered);
        System.out.println("Original bits : " + bits);

        int errors = 0;
        for (int i = 0; i < bits.length(); i++) {
            if (bits.charAt(i) != recovered.charAt(i)) errors++;
        }

        System.out.println("\\n========== RESULTS ==========");
        System.out.println("Total bits       : " + bits.length());
        System.out.println("Bit errors       : " + errors);
        System.out.printf(Locale.US, "Bit error rate   : %.2f%%%n",
                100.0 * errors / bits.length());

        if (errors == 0) {
            System.out.println("Status           : SUCCESS");
            System.out.println("Data recovered correctly.");
        } else {
            System.out.println("Status           : ERRORS DETECTED");
        }
        sc.close();
    }

    private static double[] modulate(String bits, String type) {
        double[] signal = new double[bits.length() * SAMPLES_PER_BIT];

        for (int b = 0; b < bits.length(); b++) {
            int bit = bits.charAt(b) - '0';

            for (int n = 0; n < SAMPLES_PER_BIT; n++) {
                int index = b * SAMPLES_PER_BIT + n;
                double phase = 2.0 * Math.PI * CARRIER_CYCLES
                        * n / SAMPLES_PER_BIT;

                switch (type) {
                    case "ASK":
                        signal[index] = bit == 1
                                ? AMPLITUDE * Math.sin(phase) : 0.0;
                        break;
                    case "FSK":
                        int cycles = bit == 1 ? FSK_ONE_CYCLES : FSK_ZERO_CYCLES;
                        signal[index] = AMPLITUDE * Math.sin(
                                2.0 * Math.PI * cycles * n / SAMPLES_PER_BIT);
                        break;
                    case "BPSK":
                        signal[index] = bit == 1
                                ? AMPLITUDE * Math.sin(phase)
                                : -AMPLITUDE * Math.sin(phase);
                        break;
                }
            }
        }
        return signal;
    }

    private static String demodulate(double[] signal, int bitCount, String type) {
        StringBuilder recovered = new StringBuilder();

        for (int b = 0; b < bitCount; b++) {
            if (type.equals("ASK")) {
                double score = correlate(signal, b, CARRIER_CYCLES);
                recovered.append(score > 0.5 ? '1' : '0');
            } else if (type.equals("BPSK")) {
                double score = correlate(signal, b, CARRIER_CYCLES);
                recovered.append(score >= 0.0 ? '1' : '0');
            } else {
                double zeroScore = correlate(signal, b, FSK_ZERO_CYCLES);
                double oneScore = correlate(signal, b, FSK_ONE_CYCLES);
                recovered.append(oneScore > zeroScore ? '1' : '0');
            }
        }
        return recovered.toString();
    }

    private static double correlate(double[] signal, int bitIndex, int cycles) {
        double sum = 0.0;
        for (int n = 0; n < SAMPLES_PER_BIT; n++) {
            int index = bitIndex * SAMPLES_PER_BIT + n;
            double reference = Math.sin(
                    2.0 * Math.PI * cycles * n / SAMPLES_PER_BIT);
            sum += signal[index] * reference;
        }
        return sum;
    }

    private static void printBitMapping(String type) {
        System.out.println("\\nSignal encoding:");
        switch (type) {
            case "ASK":
                System.out.println("Bit 1 = Carrier present");
                System.out.println("Bit 0 = Zero amplitude");
                break;
            case "FSK":
                System.out.println("Bit 1 = 3 cycles per bit");
                System.out.println("Bit 0 = 1 cycle per bit");
                break;
            case "BPSK":
                System.out.println("Bit 1 = Phase 0 degrees");
                System.out.println("Bit 0 = Phase 180 degrees");
                break;
        }
    }

    private static void printWaveform(double[] signal, int bitCount) {
        int rows = 17;
        int cols = signal.length;
        char[][] plot = new char[rows][cols];

        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) plot[r][c] = ' ';
        }

        for (int b = 1; b < bitCount; b++) {
            int x = b * SAMPLES_PER_BIT;
            for (int r = 0; r < rows; r++) plot[r][x] = ':';
        }

        for (int x = 0; x < cols; x++) {
            double value = Math.max(-1.0, Math.min(1.0, signal[x]));
            int y = (int) Math.round((1.0 - value) * (rows - 1) / 2.0);
            plot[y][x] = '*';
        }

        System.out.println("\\nModulated waveform:");
        System.out.println("Amplitude versus time");
        for (int r = 0; r < rows; r++) {
            double level = 1.0 - 2.0 * r / (rows - 1);
            System.out.printf(Locale.US, "%5.2f |", level);
            for (int c = 0; c < cols; c++) System.out.print(plot[r][c]);
            System.out.println();
        }
        System.out.print("      +");
        for (int c = 0; c < cols; c++) System.out.print('-');
        System.out.println("\\n       Time -->  ( : = bit boundary )");
    }
}
