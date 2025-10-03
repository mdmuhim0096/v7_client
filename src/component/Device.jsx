import React, { useEffect, useState } from "react";

async function getDeviceInfo() {
    const info = {};

    info.userAgent = navigator.userAgent || null;
    info.platform = navigator.platform || null;
    info.vendor = navigator.vendor || null;

    try {
        if (navigator.userAgentData) {
            const ua = navigator.userAgentData;
            info.uaBrands = ua.brands || null;
            if (ua.getHighEntropyValues) {
                const vals = await ua.getHighEntropyValues([
                    "platform",
                    "platformVersion",
                    "architecture",
                    "model",
                    "uaFullVersion",
                ]);
                Object.assign(info, vals);
            }
        }
    } catch { }

    info.screen = {
        width: screen?.width ?? null,
        height: screen?.height ?? null,
        availWidth: screen?.availWidth ?? null,
        availHeight: screen?.availHeight ?? null,
        colorDepth: screen?.colorDepth ?? null,
        pixelRatio: window.devicePixelRatio ?? 1,
        orientation: screen?.orientation?.type ?? null,
    };

    info.viewport = { innerWidth: innerWidth, innerHeight: innerHeight };

    const ua = (navigator.userAgent || "").toLowerCase();
    const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    info.deviceType =
        /mobile|iphone|ipod|android.*mobile|windows phone/.test(ua)
            ? "mobile"
            : /tablet|ipad|android(?!.*mobile)/.test(ua)
                ? "tablet"
                : isTouch && Math.min(screen.width, screen.height) <= 1024
                    ? "tablet/phone"
                    : "desktop";

    info.deviceMemoryGB = navigator.deviceMemory || null;
    info.hardwareConcurrency = navigator.hardwareConcurrency || null;

    try {
        if (navigator.getBattery) {
            const batt = await navigator.getBattery();
            info.battery = {
                charging: batt.charging,
                level: batt.level,
                chargingTime: batt.chargingTime,
                dischargingTime: batt.dischargingTime,
            };
        }
    } catch { }

    info.features = {
        touch: isTouch,
        serviceWorker: "serviceWorker" in navigator,
        cookies: navigator.cookieEnabled,
        localStorage: typeof localStorage !== "undefined",
        sessionStorage: typeof sessionStorage !== "undefined",
    };

    info.collectedAt = new Date().toISOString();
    return info;
}

const Section = ({ title, children }) => (
    <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2 border-b border-gray-700 pb-1">{title}</h3>
        <div className="space-y-1">{children}</div>
    </div>
);

const Item = ({ label, value }) => (
    <div className="flex justify-between bg-gray-800 px-3 py-2 rounded-md">
        <span className="font-medium text-gray-300">{label}</span>
        <span className="text-gray-100">{value ?? "N/A"}</span>
    </div>
);

const DeviceInfo = () => {
    const [deviceInfo, setDeviceInfo] = useState(null);

    useEffect(() => {
        (async () => {
            const info = await getDeviceInfo();
            setDeviceInfo(info);
        })();
    }, []);

    if (!deviceInfo) return <p className="p-4">Collecting device info...</p>;

    return (
        <div className="w-full h-60 p-6 bg-zinc-700/10 text-gray-100 rounded-xl shadow-lg max-w-xl mx-auto overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">📱 Device Information</h2>

            <Section title="Basic Info">
                <Item label="Platform" value={deviceInfo.platform} />
                <Item label="Vendor" value={deviceInfo.vendor} />
                <Item label="Device Type" value={deviceInfo.deviceType} />
                <Item label="User Agent" value={deviceInfo.userAgent} />
            </Section>

            <Section title="Screen Info">
                <Item label="Resolution" value={`${deviceInfo.screen.width} × ${deviceInfo.screen.height}`} />
                <Item label="Pixel Ratio" value={deviceInfo.screen.pixelRatio} />
                <Item label="Orientation" value={deviceInfo.screen.orientation} />
            </Section>

            <Section title="Performance">
                <Item label="Memory (GB)" value={deviceInfo.deviceMemoryGB} />
                <Item label="CPU Cores" value={deviceInfo.hardwareConcurrency} />
            </Section>

            {deviceInfo.battery && (
                <Section title="Battery">
                    <Item label="Charging" value={deviceInfo.battery.charging ? "Yes" : "No"} />
                    <Item label="Level" value={`${Math.round(deviceInfo.battery.level * 100)}%`} />
                </Section>
            )}

            <Section title="Features">
                <Item label="Touch Support" value={deviceInfo.features.touch ? "Yes" : "No"} />
                <Item label="Cookies Enabled" value={deviceInfo.features.cookies ? "Yes" : "No"} />
                <Item label="LocalStorage" value={deviceInfo.features.localStorage ? "Yes" : "No"} />
                <Item label="SessionStorage" value={deviceInfo.features.sessionStorage ? "Yes" : "No"} />
                <Item label="Service Worker" value={deviceInfo.features.serviceWorker ? "Yes" : "No"} />
            </Section>

            <p className="text-xs text-gray-400 mt-4">
                Collected at: {new Date(deviceInfo.collectedAt).toLocaleString()}
            </p>
        </div>
    );
};

export default DeviceInfo;
