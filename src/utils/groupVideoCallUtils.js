// ✅ groupVideoCallUtils.js
import { database, ref, set, remove, onValue, push, onChildAdded } from "../firebase";
import socket from "../component/socket"
let localStream = null;
let peerConnections = {};
let remoteStreams = {};
let myId = null;

export const startMedia = async (videoRef) => {
  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  if (videoRef) videoRef.srcObject = localStream;
  return localStream;
};

const createPeerConnection = (peerId, onRemoteStream, callId) => {
  const pc = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
  });

  localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

  pc.ontrack = (event) => {
    const [remoteStream] = event.streams;
    if (remoteStream && !remoteStreams[peerId]) {
      remoteStreams[peerId] = remoteStream;
      onRemoteStream(remoteStream);
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

export const joinCall = async (callId, onRemoteStream) => {
  myId = crypto.randomUUID();
  await set(ref(database, `calls/${callId}/users/${myId}`), { joinedAt: Date.now() });
  socket.emit("join_room", callId);

  const usersRef = ref(database, `calls/${callId}/users`);
  onChildAdded(usersRef, async (snapshot) => {
    console.log("📨 Offer snapshot received:", snapshot.val());
    const peerId = snapshot.key;
    if (peerId === myId || peerConnections[peerId]) return;

    const isOfferer = myId > peerId;
    const pc = createPeerConnection(peerId, onRemoteStream, callId);

    if (isOfferer) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await set(ref(database, `calls/${callId}/offers/${myId}_to_${peerId}`), offer);
    }

    onValue(ref(database, `calls/${callId}/offers/${peerId}_to_${myId}`), async (snapshot) => {
      const data = snapshot.val();
      if (data && data.type === "offer" && data.sdp && !pc.currentRemoteDescription) {
        await pc.setRemoteDescription(new RTCSessionDescription(data));

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await set(ref(database, `calls/${callId}/answers/${myId}_to_${peerId}`), answer);
      }
    }, { onlyOnce: true });


    onValue(ref(database, `calls/${callId}/answers/${peerId}_to_${myId}`), async (snapshot) => {
      const data = snapshot.val();
      if (data && !pc.currentRemoteDescription) {
        await pc.setRemoteDescription(new RTCSessionDescription(data));
      }
    }, { onlyOnce: true });

    onChildAdded(ref(database, `calls/${callId}/candidates/${peerId}_to_${myId}`), async (snapshot) => {
      const candidate = new RTCIceCandidate(snapshot.val());
      await pc.addIceCandidate(candidate);
    });
  });
};

export const hangUp = async (callId) => {
  Object.values(peerConnections).forEach(pc => pc.close());
  peerConnections = {};
  remoteStreams = {};

  await remove(ref(database, `calls/${callId}/users/${myId}`));

  const usersRef = ref(database, `calls/${callId}/users`);
  onValue(usersRef, async (snapshot) => {
    const users = snapshot.val();
    if (!users || Object.keys(users).length === 0) {
      await remove(ref(database, `calls/${callId}`));
    }
  }, { onlyOnce: true });
};
