import axios from "axios"
import { server_port } from "../component/api";
import socket from "../component/socket";

export const active = () => {
    const userId = localStorage.getItem("myId");
    const doAction = () => {
        axios.post(server_port + "/api/people/activeuser", { userId });
    }
    const Turn = localStorage.getItem("isTurn");
    Turn === true || Turn === "true" ? doAction() : !!0 ;
};

export async function isMatchGroup(id) {
    const res = await axios.get(server_port + `/api/group/isMatchGroup/${id}/${localStorage.getItem("myId")}`);
    return res.data?.isMatch;
}

export function deactivate() {
  const userId = localStorage.getItem("myId");
  if (!userId) return;
  const data = JSON.stringify({ userId });
  const blob = new Blob([data], { type: "application/json" });
  navigator.sendBeacon(`${server_port}/api/people/dactiveuser`, blob);
  socket.emit("alert", null);
}
