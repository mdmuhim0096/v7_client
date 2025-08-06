// import { database, ref, set, remove, onChildAdded, onValue, push, off } from "../firebase";
// import socket from "../component/socket";

// let localStream = null;
// let peerConnections = {};
// let myId = null;

// export const startMedia = async () => {
//   localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
//   console.log("🎤 Local audio stream tracks:", localStream.getTracks());
//   return localStream;
// };

// const createPeerConnection = (peerId, onRemoteStream, callId) => {
//   const pc = new RTCPeerConnection({
//     iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
//   });

//   localStream.getTracks().forEach((track) => {
//     pc.addTrack(track, localStream);
//   });

//   pc.ontrack = (event) => {
//     const [remoteStream] = event.streams;
//     if (!remoteStream) return;

//     const hasAudio = remoteStream.getAudioTracks().some((track) => track.enabled);
//     console.log("📡 Incoming audio stream from", peerId, { hasAudio });

//     if (hasAudio) {
//       onRemoteStream(remoteStream);
//     }
//   };

//   pc.onicecandidate = (event) => {
//     if (event.candidate) {
//       push(ref(database, `calls/${callId}/candidates/${myId}_to_${peerId}`), event.candidate.toJSON());
//     }
//   };

//   peerConnections[peerId] = pc;
//   return pc;
// };

// export const joinCall = async (callId, onRemoteStream) => {
//   myId = crypto.randomUUID();
//   await set(ref(database, `calls/${callId}/users/${myId}`), { joinedAt: Date.now() });
//   socket.emit("join_audio_room", callId);

//   const usersRef = ref(database, `calls/${callId}/users`);

//   onChildAdded(usersRef, async (snapshot) => {
//     const peerId = snapshot.key;
//     if (peerId === myId || peerConnections[peerId]) return;

//     const isOfferer = myId > peerId;
//     const pc = createPeerConnection(peerId, onRemoteStream, callId);
//     const candidateQueue = [];

//     const flushCandidates = async () => {
//       for (const candidate of candidateQueue) {
//         try {
//           await pc.addIceCandidate(candidate);
//         } catch (err) {
//           console.error("🧨 Failed to add queued candidate:", err);
//         }
//       }
//       candidateQueue.length = 0;
//     };

//     if (isOfferer) {
//       const offer = await pc.createOffer();
//       await pc.setLocalDescription(offer);
//       await set(ref(database, `calls/${callId}/offers/${myId}_to_${peerId}`), offer);
//     }

//     const offerRef = ref(database, `calls/${callId}/offers/${peerId}_to_${myId}`);
//     onValue(offerRef, async (snapshot) => {
//       const data = snapshot.val();
//       if (data?.type === "offer" && !pc.currentRemoteDescription) {
//         await pc.setRemoteDescription(new RTCSessionDescription(data));
//         const answer = await pc.createAnswer();
//         await pc.setLocalDescription(answer);
//         await set(ref(database, `calls/${callId}/answers/${myId}_to_${peerId}`), answer);
//         await flushCandidates();
//       }
//     });

//     const answerRef = ref(database, `calls/${callId}/answers/${peerId}_to_${myId}`);
//     onValue(answerRef, async (snapshot) => {
//       const data = snapshot.val();
//       if (data?.type === "answer" && !pc.currentRemoteDescription) {
//         await pc.setRemoteDescription(new RTCSessionDescription(data));
//         await flushCandidates();
//       }
//     });

//     const candidateRef = ref(database, `calls/${callId}/candidates/${peerId}_to_${myId}`);
//     onChildAdded(candidateRef, async (snapshot) => {
//       const candidateData = snapshot.val();
//       const candidate = new RTCIceCandidate(candidateData);

//       if (pc.remoteDescription && pc.remoteDescription.type) {
//         try {
//           await pc.addIceCandidate(candidate);
//         } catch (err) {
//           console.error("🧨 Failed to add candidate immediately:", err);
//         }
//       } else {
//         candidateQueue.push(candidate);
//       }
//     });
//   });
// };

// export const hangUp = async (callId) => {
//   Object.values(peerConnections).forEach((pc) => pc.close());
//   peerConnections = {};
//   localStream?.getTracks()?.forEach((track) => track.stop());
//   localStream = null;

//   await remove(ref(database, `calls/${callId}/users/${myId}`));

//   const pathsToClear = [
//     `calls/${callId}/offers`,
//     `calls/${callId}/answers`,
//     `calls/${callId}/candidates`,
//     `calls/${callId}/users`,
//   ];

//   pathsToClear.forEach((path) => {
//     off(ref(database, path));
//   });

//   const usersRef = ref(database, `calls/${callId}/users`);
//   onValue(usersRef, async (snapshot) => {
//     const users = snapshot.val();
//     if (!users || Object.keys(users).length === 0) {
//       await remove(ref(database, `calls/${callId}`));
//     }
//   }, { onlyOnce: true });
// };


// groupAudioCallUtils.js
import { database, ref, set, remove, onChildAdded, onValue, push, off } from "../firebase";
import socket from "../component/socket";

let localStream = null;
let peerConnections = {};
let myId = null;

export const startMedia = async () => {
  localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  console.log("🎤 Local audio stream tracks:", localStream.getTracks());
  return localStream;
};

const createPeerConnection = (peerId, onRemoteStream, callId, peerMeta) => {
  const pc = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  });

  localStream.getTracks().forEach((track) => {
    pc.addTrack(track, localStream);
  });

  pc.ontrack = (event) => {
    const [remoteStream] = event.streams;
    if (!remoteStream) return;

    const hasAudio = remoteStream.getAudioTracks().some((track) => track.enabled);
    console.log("📡 Incoming audio stream from", peerId, { hasAudio });

    if (hasAudio) {
      onRemoteStream(remoteStream, peerId, peerMeta);
    }
  };

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      push(ref(database, `calls/${callId}/candidates/${myId}_to_${peerId}`), event.candidate.toJSON());
    }
  };

  peerConnections[peerId] = pc;
  return pc;
};

export const joinCall = async (callId, onRemoteStream, info = {}) => {
  myId = crypto.randomUUID();
  await set(ref(database, `calls/${callId}/users/${myId}`), { joinedAt: Date.now(), ...info });
  socket.emit("join_audio_room", callId);

  const usersRef = ref(database, `calls/${callId}/users`);

  onChildAdded(usersRef, async (snapshot) => {
    const peerId = snapshot.key;
    const peerData = snapshot.val();

    if (peerId === myId || peerConnections[peerId]) return;

    const isOfferer = myId > peerId;
    const pc = createPeerConnection(peerId, onRemoteStream, callId, peerData);
    const candidateQueue = [];

    const flushCandidates = async () => {
      for (const candidate of candidateQueue) {
        try {
          await pc.addIceCandidate(candidate);
        } catch (err) {
          console.error("🧨 Failed to add queued candidate:", err);
        }
      }
      candidateQueue.length = 0;
    };

    if (isOfferer) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await set(ref(database, `calls/${callId}/offers/${myId}_to_${peerId}`), offer);
    }

    const offerRef = ref(database, `calls/${callId}/offers/${peerId}_to_${myId}`);
    onValue(offerRef, async (snapshot) => {
      const data = snapshot.val();
      if (data?.type === "offer" && !pc.currentRemoteDescription) {
        await pc.setRemoteDescription(new RTCSessionDescription(data));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await set(ref(database, `calls/${callId}/answers/${myId}_to_${peerId}`), answer);
        await flushCandidates();
      }
    });

    const answerRef = ref(database, `calls/${callId}/answers/${peerId}_to_${myId}`);
    onValue(answerRef, async (snapshot) => {
      const data = snapshot.val();
      if (data?.type === "answer" && !pc.currentRemoteDescription) {
        await pc.setRemoteDescription(new RTCSessionDescription(data));
        await flushCandidates();
      }
    });

    const candidateRef = ref(database, `calls/${callId}/candidates/${peerId}_to_${myId}`);
    onChildAdded(candidateRef, async (snapshot) => {
      const candidateData = snapshot.val();
      const candidate = new RTCIceCandidate(candidateData);

      if (pc.remoteDescription && pc.remoteDescription.type) {
        try {
          await pc.addIceCandidate(candidate);
        } catch (err) {
          console.error("🧨 Failed to add candidate immediately:", err);
        }
      } else {
        candidateQueue.push(candidate);
      }
    });
  });
};

export const hangUp = async (callId) => {
  Object.values(peerConnections).forEach((pc) => pc.close());
  peerConnections = {};
  localStream?.getTracks()?.forEach((track) => track.stop());
  localStream = null;

  await remove(ref(database, `calls/${callId}/users/${myId}`));

  const pathsToClear = [
    `calls/${callId}/offers`,
    `calls/${callId}/answers`,
    `calls/${callId}/candidates`,
    `calls/${callId}/users`,
  ];

  pathsToClear.forEach((path) => {
    off(ref(database, path));
  });

  const usersRef = ref(database, `calls/${callId}/users`);
  onValue(usersRef, async (snapshot) => {
    const users = snapshot.val();
    if (!users || Object.keys(users).length === 0) {
      await remove(ref(database, `calls/${callId}`));
    }
  }, { onlyOnce: true });
};
