(() => {
  "use strict";

  const SAMPLES_PER_BIT = 48;
  const CARRIER_CYCLES = 4;
  const FSK_ZERO_CYCLES = 2;
  const FSK_ONE_CYCLES = 6;

  const bitsInput = document.getElementById("bits");
  const modulationInput = document.getElementById("modulation");
  const simulateButton = document.getElementById("simulate");
  const errorBox = document.getElementById("error");
  const canvas = document.getElementById("waveform");
  const ctx = canvas.getContext("2d");

  function modulate(bits, type) {
    const signal = [];
    for (let b = 0; b < bits.length; b++) {
      const bit = Number(bits[b]);
      for (let n = 0; n < SAMPLES_PER_BIT; n++) {
        let value;
        if (type === "ASK") {
          value = bit === 1
            ? Math.sin(2 * Math.PI * CARRIER_CYCLES * n / SAMPLES_PER_BIT)
            : 0;
        } else if (type === "FSK") {
          const cycles = bit === 1 ? FSK_ONE_CYCLES : FSK_ZERO_CYCLES;
          value = Math.sin(2 * Math.PI * cycles * n / SAMPLES_PER_BIT);
        } else {
          const carrier = Math.sin(2 * Math.PI * CARRIER_CYCLES * n / SAMPLES_PER_BIT);
          value = bit === 1 ? carrier : -carrier;
        }
        signal.push(value);
      }
    }
    return signal;
  }

  function correlate(signal, bitIndex, cycles) {
    let sum = 0;
    for (let n = 0; n < SAMPLES_PER_BIT; n++) {
      const sample = signal[bitIndex * SAMPLES_PER_BIT + n];
      const reference = Math.sin(2 * Math.PI * cycles * n / SAMPLES_PER_BIT);
      sum += sample * reference;
    }
    return sum;
  }

  function demodulate(signal, bitCount, type) {
    let recovered = "";
    for (let b = 0; b < bitCount; b++) {
      if (type === "ASK") {
        recovered += correlate(signal, b, CARRIER_CYCLES) > 0.5 ? "1" : "0";
      } else if (type === "BPSK") {
        recovered += correlate(signal, b, CARRIER_CYCLES) >= 0 ? "1" : "0";
      } else {
        const zeroScore = correlate(signal, b, FSK_ZERO_CYCLES);
        const oneScore = correlate(signal, b, FSK_ONE_CYCLES);
        recovered += oneScore > zeroScore ? "1" : "0";
      }
    }
    return recovered;
  }

  function drawWaveform(signal, bits) {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const width = rect.width;
    const height = rect.height;
    const left = 46, right = 14, top = 18, bottom = 28;
    const plotW = width - left - right;
    const plotH = height - top - bottom;
    ctx.clearRect(0, 0, width, height);

    ctx.font = "12px sans-serif";
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#e2e8f0";
    ctx.fillStyle = "#64748b";
    for (let i = -1; i <= 1.001; i += 0.5) {
      const y = top + (1 - i) / 2 * plotH;
      ctx.beginPath(); ctx.moveTo(left, y); ctx.lineTo(width - right, y); ctx.stroke();
      ctx.textAlign = "right"; ctx.textBaseline = "middle";
      ctx.fillText(i.toFixed(1), left - 8, y);
    }

    for (let b = 0; b <= bits.length; b++) {
      const x = left + (b / bits.length) * plotW;
      ctx.save();
      ctx.strokeStyle = b === 0 || b === bits.length ? "#cbd5e1" : "#b9c7ef";
      ctx.setLineDash(b === 0 || b === bits.length ? [] : [4, 4]);
      ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x, top + plotH); ctx.stroke();
      ctx.restore();
    }

    ctx.beginPath();
    ctx.strokeStyle = "#3659e3";
    ctx.lineWidth = 2;
    signal.forEach((sample, i) => {
      const x = left + (i / Math.max(1, signal.length - 1)) * plotW;
      const y = top + (1 - sample) / 2 * plotH;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();

    ctx.fillStyle = "#64748b";
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillText("Time →", left + plotW / 2, height - 5);
  }

  function renderComparison(original, recovered) {
    const container = document.getElementById("comparison");
    container.innerHTML = "";
    [
      ["Original", original, null],
      ["Recovered", recovered, original]
    ].forEach(([label, value, compare]) => {
      const row = document.createElement("div");
      row.className = "compare-row";
      const labelEl = document.createElement("span");
      labelEl.className = "compare-label";
      labelEl.textContent = label;
      const strip = document.createElement("div");
      strip.className = "bit-strip";
      [...value].forEach((bit, i) => {
        const el = document.createElement("span");
        el.className = "bit" + (bit === "0" ? " zero" : "");
        if (compare && compare[i] !== bit) el.classList.add("mismatch");
        el.textContent = bit;
        strip.appendChild(el);
      });
      row.append(labelEl, strip);
      container.appendChild(row);
    });
  }

  function simulate() {
    const bits = bitsInput.value.trim();
    const type = modulationInput.value;
    errorBox.textContent = "";

    if (!/^[01]{1,64}$/.test(bits)) {
      errorBox.textContent = "Please enter 1–64 binary digits using only 0 and 1.";
      return;
    }

    const signal = modulate(bits, type);
    const recovered = demodulate(signal, bits.length, type);
    let errors = 0;
    for (let i = 0; i < bits.length; i++) {
      if (bits[i] !== recovered[i]) errors++;
    }

    document.getElementById("original").textContent = bits;
    document.getElementById("recovered").textContent = recovered;
    document.getElementById("errors").textContent = errors;
    document.getElementById("ber").textContent = (100 * errors / bits.length).toFixed(2) + "%";
    document.getElementById("techBadge").textContent = type;

    const descriptions = {
      ASK: "Bit 1: carrier present · Bit 0: zero amplitude",
      FSK: "Bit 1: higher frequency · Bit 0: lower frequency",
      BPSK: "Bit 1: 0° phase · Bit 0: 180° phase"
    };
    document.getElementById("description").textContent = descriptions[type];

    const labels = document.getElementById("bitLabels");
    labels.innerHTML = "";
    [...bits].forEach((bit, i) => {
      const item = document.createElement("span");
      item.className = "bit-label" + (bit === "0" ? " zero" : "");
      item.textContent = `Bit ${i + 1}: ${bit}`;
      labels.appendChild(item);
    });

    renderComparison(bits, recovered);
    const status = document.getElementById("status");
    if (errors === 0) {
      status.className = "status success";
      status.textContent = "SUCCESS — data recovered correctly.";
    } else {
      status.className = "status failure";
      status.textContent = `ERROR — ${errors} bit(s) did not match.`;
    }
    drawWaveform(signal, bits);
  }

  simulateButton.addEventListener("click", simulate);
  bitsInput.addEventListener("keydown", event => {
    if (event.key === "Enter") simulate();
  });
  window.addEventListener("resize", simulate);
  simulate();
})();
