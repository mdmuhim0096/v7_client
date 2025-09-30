import React, { useEffect, useRef, useState } from "react";
import { startMedia, joinCall, hangUp } from "../utils/groupAudioCallUtils";
import { useLocation, useNavigate } from "react-router-dom";
import { tone } from "../utils/soundprovider";
import { Phone, PhoneOff } from "lucide-react";
import socket from "./socket";
import Timer from "./Timer";
import { isMatchGroup } from "../utils/utils";

const GroupAudioCall = () => {

  const { callId, isCaller } = useLocation()?.state || {};
  const navigate = useNavigate();
  const [remoteStreams, setRemoteStreams] = useState([]); // but now store objects
  const [peerInfo, setPeerInfo] = useState({});
  const remoteAudioRefs = useRef({});
  const [inCall, setInCall] = useState(false);

  const image = localStorage.getItem("myImage"), name = localStorage.getItem("myName"), groupId = localStorage.getItem("groupId"), groupName = localStorage.getItem("userName");

  const handleRemoteStream = (stream, peerId, info) => {
    setRemoteStreams((prev) => {
      if (prev.find((s) => s.stream.id === stream.id)) return prev;
      return [...prev, { peerId, stream }];
    });

    if (peerId && info) {
      setPeerInfo((prev) => ({
        ...prev,
        [peerId]: info
      }));
    }
  };

  const handleStart = async () => {
    if (tone.callTone) tone.callTone.pause();
    await startMedia();
    await joinCall(callId, handleRemoteStream, {
      name,
      image,
      role: isCaller ? "caller" : "participant",
    });
    setInCall(true);
  };

  const handleLeave = async () => {
    if (tone.callTone) tone.callTone.pause();
    await hangUp(callId);
    setRemoteStreams([]);
    setInCall(false);
    navigate("/chatroom");
    window.location.reload();
  };

  useEffect(() => {
    if (isCaller === true || isCaller === "true") {
      handleStart();
    }

    const handelTimer = async (data) => {
      const isMatch = await isMatchGroup(data.id);
      if (isMatch && data.id === groupId) setInCall(data.timer);
    }

    const onlyTowMember = (data) => {
      if (data.id === groupId) {
        setTimeout(() => {
          navigate("/chatroom");
        }, 500)
      }
    }

    socket.on("onRGAC", handelTimer);
    socket.on("onRGACM2E", onlyTowMember);

    return () => {
      socket.off("onRGAC", handelTimer);
      socket.off("onRGACM2E", onlyTowMember);
    }

  }, []);

  useEffect(() => {
    remoteStreams.forEach(({ stream, peerId }) => {
      const audioEl = remoteAudioRefs.current[peerId];
      if (audioEl && audioEl.srcObject !== stream) {
        audioEl.srcObject = stream;
        audioEl.play().catch((e) => console.warn("Audio playback error:", e));
      }
    });

  }, [remoteStreams]);

  return (
    <div className="h-screen bg-zinc-900 text-white p-4 relative">
      <h1 className="text-center my-5">{groupName}</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">

        {remoteStreams.map(({ stream, peerId }) => {
          const peer = peerInfo[peerId] || {};
          return (
            <div key={peerId} className="bg-zinc-700 p-4 rounded">
              <div className="flex items-center gap-2 ">
                <img
                  src={peer?.image}
                  alt={peer?.name}
                  className="w-8 h-8 rounded-full"
                />
                <p className="text-sm font-medium">
                  <span>{peer?.name || "Peer"} {peer?.role}</span>
                </p>
              </div>
              <audio
                autoPlay
                ref={(el) => {
                  if (el) remoteAudioRefs.current[peerId] = el;
                }}
              />
              {inCall ? <Timer isCallActive={inCall} /> : null}
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex gap-4 absolute bottom-4 left-[50%] translate-x-[-50%]">
        {isCaller === true || isCaller === "true" ? (
          <span className="p-2 hover:bg-zinc-700 duration-100 rounded-full">
            <PhoneOff className="text-red-500" onClick={() => {
                handleLeave();
                if (remoteStreams.length === 1) {
                  socket.emit("onRGACM2E", { id: groupId });
                }
                socket.emit("onRGAC", { id: groupId, timer: false });
              }} />
          </span>

        ) : (
          <div className="flex w-28 h-auto items-center justify-between">
            <span className="p-2 hover:bg-zinc-700 duration-100 rounded-full">
              <PhoneOff className="text-red-500" onClick={() => {
                handleLeave();
                if (remoteStreams.length === 1) {
                  socket.emit("onRGACM2E", { id: groupId });
                }
                socket.emit("onRGAC", { id: groupId, timer: false });
              }} />
            </span>
            <span className="p-2 hover:bg-zinc-700 duration-100 rounded-full">
              <Phone className="text-green-500" onClick={() => {
                handleStart();
                socket.emit("onRGAC", { id: groupId, timer: true })
              }} />
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupAudioCall;
