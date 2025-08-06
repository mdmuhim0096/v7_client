// import React, { useEffect, useRef, useState } from "react";
// import { startMedia, joinCall, hangUp } from "../utils/groupAudioCallUtils";
// import { useLocation, useNavigate } from "react-router-dom";
// import { tone } from "../utils/soundprovider";
// import { Phone, PhoneOff } from "lucide-react";

// const GroupAudioCall = () => {
//     const { callId, isCaller, image, name } = useLocation()?.state || {};
//     const navigate = useNavigate();
//     const [remoteStreams, setRemoteStreams] = useState([]);
//     const remoteAudioRefs = useRef({});
//     const [inCall, setInCall] = useState(false);

//     const handleRemoteStream = (stream) => {
//         setRemoteStreams((prev) => {
//             if (prev.find((s) => s.id === stream.id)) return prev;
//             return [...prev, stream];
//         });
//     };

//     const handleStart = async () => {
//         if (tone.callTone)
//             tone.callTone.pause();
//         await startMedia();
//         await joinCall(callId, handleRemoteStream, {
//             name, image, role: isCaller
//         });
//         setInCall(true);
//     };

//     const handleLeave = async () => {
//         if (tone.callTone);
//             tone.callTone.pause();
//         await hangUp(callId);
//         setRemoteStreams([]);
//         setInCall(false);
//         navigate("/chatroom");
//         window.location.reload();
//     };

//     useEffect(() => {
//         if (isCaller === true) {
//             handleStart();
//         }
//     }, [])

//     useEffect(() => {
//         remoteStreams.forEach((stream) => {
//             const audioEl = remoteAudioRefs.current[stream.id];
//             if (audioEl && audioEl.srcObject !== stream) {
//                 audioEl.srcObject = stream;
//                 audioEl.play().catch((e) => console.warn("Audio playback error:", e));
//             }
//         });
//     }, [remoteStreams]);

//     return (
//         <div className="h-screen bg-zinc-900 text-white p-4 relative border">
//             <h2 className="text-2xl mb-4">Group Audio Call</h2>

//             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
//                 <div className="p-4 rounded">
//                     <p className="text-lg">🎤 You (Audio only)</p>
//                 </div>

//                 {remoteStreams.map((stream) => (
//                     <div key={stream.id} className="bg-zinc-600 p-4 rounded">
//                         <p className="text-sm">🔊 Peer (Audio only)</p>
//                         <audio
//                             autoPlay
//                             controls
//                             ref={(el) => {
//                                 if (el) remoteAudioRefs.current[stream.id] = el;
//                             }}

//                         />
//                     </div>
//                 ))}
//             </div>

//             <div className="mt-6 flex gap-4 absolute bottom-4 left-[50%] translate-x-[-50%]">
//                 {isCaller === true || isCaller === "true" ? <span className="p-2 hover:bg-zinc-700 duration-100 rounded-full">
//                     <PhoneOff className="text-red-500 " onClick={() => { handleLeave() }} />
//                 </span> :
//                     <div className="flex w-28 h-auto items-center justify-between">
//                         <span className="p-2 hover:bg-zinc-700 duration-100 rounded-full">
//                             <PhoneOff className="text-red-500 " onClick={() => { handleLeave() }} />
//                         </span>
//                         <span className="p-2 hover:bg-zinc-700 duration-100 rounded-full">
//                             <Phone className="text-green-500" onClick={() => { handleStart() }} />
//                         </span>
//                     </div>}
//             </div>
//         </div>
//     );
// };

// export default GroupAudioCall;

import React, { useEffect, useRef, useState } from "react";
import { startMedia, joinCall, hangUp } from "../utils/groupAudioCallUtils";
import { useLocation, useNavigate } from "react-router-dom";
import { tone } from "../utils/soundprovider";
import { Phone, PhoneOff } from "lucide-react";

const GroupAudioCall = () => {
  const { callId, isCaller, image, name } = useLocation()?.state || {};
  const navigate = useNavigate();
  const [remoteStreams, setRemoteStreams] = useState([]);
  const [peerInfo, setPeerInfo] = useState({});
  const remoteAudioRefs = useRef({});
  const [inCall, setInCall] = useState(false);

  const handleRemoteStream = (stream, peerId, info) => {
    setRemoteStreams((prev) => {
      if (prev.find((s) => s.id === stream.id)) return prev;
      return [...prev, stream];
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
  }, []);

  useEffect(() => {
    remoteStreams.forEach((stream) => {
      const audioEl = remoteAudioRefs.current[stream.id];
      if (audioEl && audioEl.srcObject !== stream) {
        audioEl.srcObject = stream;
        audioEl.play().catch((e) => console.warn("Audio playback error:", e));
      }
    });
  }, [remoteStreams]);

  return (
    <div className="h-screen bg-zinc-900 text-white p-4 relative">
      <h2 className="text-2xl mb-4">Group Audio Call</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <div className="p-4 rounded bg-zinc-800">
          <p className="text-lg">🎤 You (Audio only)</p>
        </div>

        {remoteStreams.map((stream) => {
          const peer = peerInfo[stream.id] || {};
          return (
            <div key={stream.id} className="bg-zinc-700 p-4 rounded">
              <div className="flex items-center gap-2 ">
                {peer.image && (
                  <img
                    src={peer?.image}
                    alt={peer?.name}
                    className="w-6 h-6 rounded-full"
                  />
                )}
                <p className="text-sm font-medium">
                   <span>{peer?.name || "Peer"} {peer?.role}</span>
                </p>
              </div>
              <audio
                autoPlay
                controls
                ref={(el) => {
                  if (el) remoteAudioRefs.current[stream.id] = el;
                }}
              />
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex gap-4 absolute bottom-4 left-[50%] translate-x-[-50%]">
        {isCaller === true || isCaller === "true" ? (
          <span className="p-2 hover:bg-zinc-700 duration-100 rounded-full">
            <PhoneOff className="text-red-500" onClick={handleLeave} />
          </span>
        ) : (
          <div className="flex w-28 h-auto items-center justify-between">
            <span className="p-2 hover:bg-zinc-700 duration-100 rounded-full">
              <PhoneOff className="text-red-500" onClick={handleLeave} />
            </span>
            <span className="p-2 hover:bg-zinc-700 duration-100 rounded-full">
              <Phone className="text-green-500" onClick={handleStart} />
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupAudioCall;
