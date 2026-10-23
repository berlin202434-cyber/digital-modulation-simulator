# Digital Modulation Simulator

A small browser-based educational simulator for ASK, FSK, and BPSK.

## Website files
- `index.html` — page structure
- `style.css` — layout and styling
- `script.js` — signal generation, waveform drawing, demodulation, and comparison

## Run in VS Code
1. Install Visual Studio Code.
2. Create/open a folder named `digital-modulation-website`.
3. Put `index.html`, `style.css`, and `script.js` in that folder.
4. Install the **Live Server** extension by Ritwick Dey (optional but convenient).
5. Right-click `index.html` and choose **Open with Live Server**.
6. Enter binary data such as `101101`, choose ASK, FSK, or BPSK, and click **Simulate signal**.

You can also open `index.html` directly in a modern browser. No Node.js, Java server, package manager, or external JavaScript library is required.

## Java console version
`DigitalModulationSimulator.java` is also included. To compile and run it:
```bash
javac DigitalModulationSimulator.java
java DigitalModulationSimulator
```

## Notes
This is an ideal, noise-free simulation. The browser implementation generates discrete samples, draws them on a canvas, and demodulates by correlation against reference carriers. It is an educational model, not a hardware transmitter/receiver or a noisy channel simulation.
