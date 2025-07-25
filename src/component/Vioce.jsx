
import React, { useRef, useState } from "react";
import { Mic } from "lucide-react";

// Open IndexedDB
const openDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open("VoiceAudioDB", 1);
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains("audios")) {
                db.createObjectStore("audios", { keyPath: "id" });
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

// Save audio blob to IndexedDB
const saveAudioBlob = async (id, blob) => {
    const db = await openDB();
    const tx = db.transaction("audios", "readwrite");
    const store = tx.objectStore("audios");
    store.put({ id, blob });
    return tx.done;
};

// Retrieve audio blob from IndexedDB
const getAudioBlob = async (id) => {
    const db = await openDB();
    const tx = db.transaction("audios", "readonly");
    const store = tx.objectStore("audios");

    return new Promise((resolve, reject) => {
        const req = store.get(id);
        req.onsuccess = () => resolve(req.result?.blob || null);
        req.onerror = () => reject(req.error);
    });
};

// Main Component
export default function VoiceButton({ onAudioReady }) {
    const mediaRecorderRef = useRef(null);
    const streamRef = useRef(null);
    const audioChunks = useRef([]);
    const audioIdRef = useRef(null);
    const [isRecording, setIsRecording] = useState(false);

    const handleMouseDown = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            audioChunks.current = [];
            audioIdRef.current = `audio_${Date.now()}`;

            // Select supported MIME type
            const mimeType =
                MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" :
                MediaRecorder.isTypeSupported("audio/ogg;codecs=opus") ? "audio/ogg;codecs=opus" :
                "";

            if (!mimeType) {
                alert("No supported audio format found.");
                return;
            }

            mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });

            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    audioChunks.current.push(e.data);
                }
            };

            mediaRecorderRef.current.onstop = async () => {
                const blob = new Blob(audioChunks.current, { type: mimeType });
                await saveAudioBlob(audioIdRef.current, blob);
                const storedBlob = await getAudioBlob(audioIdRef.current);

                if (typeof onAudioReady === "function" && storedBlob) {
                    onAudioReady(storedBlob);
                }

                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Microphone access failed:", err);
            alert("Microphone permission is required.");
        }
    };

    const handleMouseUp = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    return (
        <div
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onTouchStart={handleMouseDown}
            onTouchEnd={handleMouseUp}
            className="w-12 h-10 rounded-lg bg-rose-500 flex justify-center items-center cursor-pointer"
            id="mic"
        >
            <Mic className={isRecording ? "text-white animate-pulse" : "text-white"} />
        </div>
    );
}
