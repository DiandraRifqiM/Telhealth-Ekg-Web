const ctx = document.getElementById("ecgChart").getContext("2d");

const ecgChart = new Chart(ctx, {
  type: "line",
  data: {
    labels: ["0s", "1s", "2s", "3s", "4s", "5s", "6s", "7s", "8s", "9s"],
    datasets: [
      {
        label: "Sinyal EKG (mV)",
        data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        borderColor: "#0d6efd",
        backgroundColor: "rgba(13, 110, 253, 0.05)",
        borderWidth: 2,
        tension: 0.3,
        fill: true,
        pointRadius: 2,
      },
    ],
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        suggestedMax: 50,
        grid: { color: "rgba(0,0,0,0.05)" },
      },
      x: {
        grid: { display: false },
      },
    },
    plugins: {
      legend: { display: false },
    },
  },
});

// Bluetooth EKG Button

const connectBtn = document.getElementById("connectBtn");
const disconnectBtn = document.getElementById("disconnectBtn");
const status = document.getElementById("status");
const statusBadge = document.getElementById("statusBadge");

let device;
let characteristic;

connectBtn.addEventListener("click", async () => {
  let stage = "Searching device";

  try {
    status.textContent = "Searching for ESP32...";

    device = await navigator.bluetooth.requestDevice({
      filters: [{ name: "ESP32-BLE" }],
      optionalServices: ["12345678-1234-1234-1234-123456789abc"],
    });

    console.log("Device selected:", device);

    device.addEventListener("gattserverdisconnected", () => {
      console.log("ESP32 disconnected");
      status.textContent = "Belum Terhubung";

      statusBadge.textContent = "Disconnected";
      statusBadge.classList.remove("bg-success");
      statusBadge.classList.add("bg-danger");
    });

    stage = "Connecting GATT";

    const server = await device.gatt.connect();

    console.log("GATT connected:", server);

    stage = "Getting service";

    const service = await server.getPrimaryService(
      "12345678-1234-1234-1234-123456789abc"
    );

    console.log("Service:", service);

    stage = "Getting characteristic";

    characteristic = await service.getCharacteristic(
      "abcdefab-1234-1234-1234-123456789abc"
    );

    console.log("Characteristic:", characteristic);

    stage = "Starting notifications";

    // Listener realtime Firestore

    const unsubscribe = readEspRecord("<%= patientId %>", (value) => {
      document.getElementById("value").innerText = `BPM: ${value}`;
    });

    characteristic.addEventListener(
      "characteristicvaluechanged",
      async (event) => {
        const rawValue = new TextDecoder().decode(event.target.value);

        console.log("Received:", rawValue);

        // Mengabaikan BPM yang belum tersedia
        if (rawValue === "--") {
          document.getElementById("value").textContent = "BPM: --";
          return;
        }

        const bpm = Number(rawValue);

        // if (!Number.isFinite(bpm)) {
        //   console.error("Invalid BPM:", rawValue);
        //   return;
        // }

        // document.getElementById("value").textContent = `BPM: ${bpm}`;

        // Simpan data ke Firestore
        try {
          const response = await fetch("/pasienDashboard/api/esp-data", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              deviceId: "esp32_a1b2c3d4",
              value: bpm,
            }),
          });

          const result = await response.json();

          if (!response.ok) {
            throw new Error(result.message || "Failed to save data");
          }

          console.log("Data saved:", result);
        } catch (error) {
          console.error("Fetch error:", error);
        }
      }
    );

    await characteristic.startNotifications();

    console.log("Notifications started!");

    status.textContent = "Perangkat Terhubung";
    statusBadge.textContent = "Connected";
    statusBadge.classList.remove("bg-danger");
    statusBadge.classList.add("bg-success");
  } catch (error) {
    console.error("BLE Error at:", stage);
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);

    status.textContent = "Gagal Terhubung";
  }
});

// Event disconnect
disconnectBtn.addEventListener("click", () => {
  if (device && device.gatt.connected) {
    device.gatt.disconnect();
  }
});
