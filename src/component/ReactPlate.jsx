import axios from "axios";
import { server_port } from "./api";

const icon = [
    { link: "./assets/react_icons/like.gif", name: "like" },
    { link: "./assets/react_icons/love.gif", name: "love" },
    { link: "./assets/react_icons/care.png", name: "care" },
    { link: "./assets/react_icons/haha.gif", name: "haha" },
    { link: "./assets/react_icons/wow.gif", name: "wow" },
    { link: "./assets/react_icons/sad.gif", name: "sad" },
    { link: "./assets/react_icons/angry.gif", name: "angry" },
];

const ReactPlate = ({ index = 0, postId = null, commentId = null, repId = null, nestId = null, type = "post", onReturn, color }) => {

    const contentType = type;
    const doLike = (postId, type) => {
        contentType === "post" ? axios.post(server_port + "/api/post/addlike", { postId, type }, { withCredentials: true }) : contentType === "comment" ? addLike_comment(type) : contentType === "reply" ? addlike_replay(type) : inner_addlike_replay(type);
        if (contentType === "post" && typeof onReturn === "function") {
            onReturn(type)
        }
    };

    function addLike_comment(type) {
        axios.post(server_port + "/api/post/addlike_comment", { postId, commentId, type }, { withCredentials: true });
        if (typeof onReturn === "function") {
            onReturn(type);
        }
    }

    function addlike_replay(type) {
        axios.post(server_port + "/api/post/addlike_replay", { postId, commentId, repId, type }, { withCredentials: true });
        if (typeof onReturn === "function") {
            onReturn(type);
        }
    }

    function inner_addlike_replay(type) {
        axios.post(server_port + "/api/post/inner_addlike_replay", { postId, commentId, repId, nestId, type }, { withCredentials: true });
        if (typeof onReturn === "function") {
            onReturn(type);
        }
    }

    function hidePlate() {
        const plate = document.getElementById(`react_plate_${index}`);
        plate.classList.remove("flex");
        plate.classList.add("hidden");
    }

    return (
        <div
            id={`react_plate_${index}`}
            className={`items-center gap-3 absolute z-50 left-0 ${color} p-1 rounded-md hidden`}
        >
            {
                icon.map((icon, index) => (
                    <div
                        key={index}
                        className='emote w-8 h-8 hover:scale-150 transition-all duration-75 relative flex justify-center'
                        onClick={() => {
                            doLike(postId, icon.name);
                            hidePlate();
                        }}
                    >
                        <h5 className='emote-name text-xs text-center hidden absolute'>{icon.name}</h5>
                        <img src={icon.link} className='w-full h-full object-fill' />
                    </div>
                ))
            }
        </div>
    )
}

export default ReactPlate;