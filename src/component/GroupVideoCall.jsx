import React, { useEffect, useRef, useState } from "react";
import { startMedia, joinCall, hangUp } from "../utils/groupVideoCallUtils";
import { useLocation, useNavigate } from "react-router-dom";
import { tone } from "../utils/soundprovider";
import { Phone, PhoneOff } from "lucide-react";
import socket from "../component/socket";
import Timer from "../component/Timer";

const GroupVideoCall = () => {

  const { callId, isCaller } = useLocation()?.state || {};
  const navigate = useNavigate();
  const localVideoRef = useRef(null);
  const remoteVideoRefs = useRef({});
  const [inCall, setInCall] = useState(false);
  const [remoteStreams, setRemoteStreams] = useState([]);

  const [peerInfo, setPeerInfo] = useState({});
  const name = localStorage.getItem("myName"),
    image = localStorage.getItem("myImage");

  const handleRemoteStream = (stream, peerId, info) => {
    setRemoteStreams((prev) => {
      if (prev.find((s) => s.peerId === peerId)) return prev;
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
    await startMedia(localVideoRef.current);
    await joinCall(callId, handleRemoteStream, {
      name,
      image,
      role: isCaller ? "caller" : "participant",
    });
    socket.emit("onGVC", { timer: true });
  };

  useEffect(() => {
    if (isCaller === true || isCaller === "true") {
      handleStart();
    }
  }, [isCaller]);

  const handleLeave = async () => {
    if (tone.callTone) tone.callTone.pause();
    socket.emit("onGVCE", { timer: false });
    await hangUp(callId);
    setRemoteStreams([]);
    setInCall(false);
    navigate("/chatroom");
    window.location.reload();
  };

  useEffect(() => {
    remoteStreams.forEach(({ stream, peerId }) => {
      const videoEl = remoteVideoRefs.current[peerId];
      if (videoEl && videoEl.srcObject !== stream) {
        videoEl.srcObject = stream;
        videoEl.play().catch((e) => console.warn("Playback error:", e));
      }
    });
  }, [remoteStreams]);

  useEffect(() => {
    const handelTimer = (data) => {
      setInCall(data.timer)
    },
      handelCallend = (data) => {
        setInCall(data.timer)
      }

    socket.on("onGVC", handelTimer)
    socket.on("onGVCE", handelCallend)

    return () => {
      socket.off("onGVC", handelTimer)
      socket.off("onGVCE", handelCallend)
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <h2 className="text-2xl mb-4">Group Video Call</h2>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-black rounded overflow-hidden">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-48 object-cover transform scale-x-[-1]"
          />
          <div className="text-xs p-1 bg-gray-800 text-white text-center">You</div>
        </div>

        {remoteStreams.map(({ stream, peerId }) => {
          const peer = peerInfo[peerId] || {};

          return (
            <div key={peerId} className="bg-black rounded overflow-hidden">
              <video
                autoPlay
                playsInline
                className="w-full h-48 object-cover bg-gray-700 transform scale-x-[-1]"
                ref={(el) => {
                  if (el) remoteVideoRefs.current[peerId] = el;
                }}
              />
              <div className="flex items-center gap-2 ">

                <img
                  src={peer.image}
                  alt={peer.name}
                  className="w-6 h-6 rounded-full"
                />

                <span>{peer.name || "Peer"} {peer.role}</span>

                {inCall ? <Timer isCallActive={inCall} /> : null}
              </div>
            </div>
          );
        })}

      </div>

      <div className="mt-6 flex gap-4 absolute bottom-4 left-[50%] translate-x-[-50%]">
        {isCaller === true || isCaller === "true" ? <span className="p-2 hover:bg-zinc-700 duration-100 rounded-full">
          <PhoneOff className="text-red-500" onClick={() => { handleLeave() }} />
        </span> :
          <div className="flex w-28 h-auto items-center justify-between">
            <span className="p-2 hover:bg-zinc-700 duration-100 rounded-full">
              <PhoneOff className="text-red-500" onClick={() => { handleLeave() }} />
            </span>
            <span className="p-2 hover:bg-zinc-700 duration-100 rounded-full">
              <Phone className="text-green-500" onClick={() => { handleStart() }} />
            </span>
          </div>}
      </div>
    </div>
  );
};

export default GroupVideoCall;
