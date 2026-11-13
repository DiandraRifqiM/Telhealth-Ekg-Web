// DB
// const { addEspRecord, readEspRecord } = require("./services/espService");

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

    characteristic.addEventListener(
      "characteristicvaluechanged",
      async (event) => {
        const rawValue = new TextDecoder().decode(event.target.value).trim();

        console.log("Received:", rawValue);

        document.getElementById("value").textContent = `BPM: ${rawValue}`;

        if (rawValue === "--") return;

        const bpm = Number(rawValue);

        if (!Number.isFinite(bpm)) return;

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
            throw new Error(result.message);
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

    alert("Gagal pada tahap: " + stage + "\nError: " + error.message);
  }
});

// Event disconnect
disconnectBtn.addEventListener("click", () => {
  if (device && device.gatt.connected) {
    device.gatt.disconnect();
  }
});
