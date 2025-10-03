import { useEffect, useState } from "react";

const BatteryInfo = () => {
  const [batteryLevel, setBatteryLevel] = useState(null);
  const [charging, setCharging] = useState(null);

  useEffect(() => {
    let batteryRef;

    const initBattery = async () => {
      if (navigator.getBattery) {
        try {
          const battery = await navigator.getBattery();
          batteryRef = battery;

          // Initial values
          setBatteryLevel(Math.round(battery.level * 100));
          setCharging(battery.charging);

          // Event listeners
          const handleLevelChange = () =>
            setBatteryLevel(Math.round(battery.level * 100));
          const handleChargingChange = () =>
            setCharging(battery.charging);
          battery.addEventListener("levelchange", handleLevelChange);
          battery.addEventListener("chargingchange", handleChargingChange);

          // Cleanup
          return () => {
            battery.removeEventListener("levelchange", handleLevelChange);
            battery.removeEventListener("chargingchange", handleChargingChange);
          };
        } catch (err) {
          console.error("Battery API error:", err);
        }
      } else {
        console.log("Battery API not supported on this browser.");
      }
    };

    initBattery();
  }, []);

  return (
    <div className="p-4 w-full h-auto rounded-xl shadow-md bg-zinc-700/10 text-white text-center">
      <h2 className="text-lg font-semibold mb-2">🔋 Battery Info</h2>
      {batteryLevel !== null ? (
        <>
          <p>Level: {batteryLevel}%</p>
          <p>
            Status:{" "}
            {charging ? (
              <span className="text-green-400">Charging ⚡</span>
            ) : (
              <span className="text-red-400">Not Charging</span>
            )}
          </p>
        </>
      ) : (
        <p>Battery info not available</p>
      )}
    </div>
  );
};

export default BatteryInfo;
