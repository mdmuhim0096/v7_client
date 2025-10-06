import { useEffect, useState } from 'react';
import axios from 'axios';
import Seemore from './Seemore';
import { server_port, send_request_api, myfriends_api } from './api';
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Ellipsis, X, Share2, MessageSquareIcon, Copy, CopyCheck, MoveLeft, MoveRight } from "lucide-react";
import { formatNumber } from '../utils/formatenumber';
import socket from "./socket";
import { tone } from "../utils/soundprovider";
import ReactPlate from "./ReactPlate";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BatteryInfo from './BattryInfo';
import LocationInfo from "./LocationInfo";
import DeviceInfo from './Device';

const Publicprofile = () => {
    const navigate = useNavigate();
    const { callTone } = tone;
    const location_ = useLocation();
    const userId = location_.state?.id;

    const [posts, setPost] = useState([]);
    const [user, setUser] = useState("");
    const [requestStatus, setStatus] = useState("");
    const [friends, setFriends] = useState(null);
    const [isCopy, setIsCopy] = useState(false);

    if (!localStorage.getItem("isForword")) {
        localStorage.setItem("isForword", "false");
    }

    const _id_ = localStorage.getItem("myId");
    const isForWord = localStorage.getItem("isForword") === "true";

    /** 🔹 Notify */
    const notify = (m) => toast.success(m);

    /** 🔹 Incoming audio call */
    useEffect(() => {
        const handleIncomingCall = (data) => {
            if (data.userId === localStorage.getItem("myId")) {
                navigate("/audiocall", { state: { callId: data.callId, userId: data.userId, role: "receiver", info: data.info } });
                callTone?.play?.();
            }
        };
        socket.on("incoming_call_a", handleIncomingCall);
        return () => socket.off("incoming_call_a", handleIncomingCall);
    }, [navigate, callTone]);

    /** 🔹 Incoming video call */
    useEffect(() => {
        const handleIncomingCall = (data) => {
            if (data.userId === localStorage.getItem("myId")) {
                navigate("/v", { state: { callId: data.callId } });
                callTone?.play?.();
            }
        };
        socket.on("____incoming_call____", handleIncomingCall);
        return () => socket.off("____incoming_call____", handleIncomingCall);
    }, [navigate, callTone]);

    /** 🔹 Group video call */
    useEffect(() => {
        const handleRoom = async (data) => {
            const isMatch = await isMatchGroup(data);
            if (isMatch) {
                navigate("/groupvideocall", { state: { callId: data, isCaller: false, image: localStorage.getItem("myImage"), name: localStorage.getItem("myName") } });
                callTone?.play?.();
            }
        };
        socket.on("join_room", handleRoom);
        return () => socket.off("join_room", handleRoom);
    }, [navigate, callTone]);

    /** 🔹 Group audio call */
    useEffect(() => {
        const handleRoom = async (data) => {
            const isMatch = await isMatchGroup(data);
            if (isMatch) {
                navigate("/groupaudiocall", { state: { callId: data, isCaller: false, image: localStorage.getItem("myImage"), name: localStorage.getItem("myName") } });
                callTone?.play?.();
            }
        };
        socket.on("join_audio_room", handleRoom);
        return () => socket.off("join_audio_room", handleRoom);
    }, [navigate, callTone]);

    /** 🔹 Fetch all profile information */
    async function get_all_information() {
        try {
            const res_ = await axios.get(`${server_port}/api/post/randompost/${userId}`);
            const _res = await axios.get(`${server_port}/api/people/randomuser/${userId}`);
            setUser(_res.data.user);
            setPost(res_.data.posts);

            const ___res = await axios.get(`${server_port}/api/friend/checkIsFriend/${localStorage.getItem("myId")}/${userId}`);
            setStatus(___res.data.status);
        } catch (error) {
            console.error("Failed to fetch profile info:", error);
        }
    }

    useEffect(() => {
        get_all_information();
        const get_my_friends = async () => {
            try {
                const res = await axios.get(myfriends_api, { withCredentials: true });
                setFriends(res.data.data);
            } catch (error) {
                console.error("Failed to fetch friends:", error);
            }
        };
        get_my_friends();
    }, [userId]);

    /** 🔹 Friend request */
    async function sendFriendRquest(receiverId) {
        try {
            const res = await axios.post(send_request_api, { receiverId }, { withCredentials: true });
            setStatus(res.data.status);
        } catch (error) {
            console.error("Friend request failed:", error);
        }
    }

    /** 🔹 Profile like */
    function addLike() {
        axios.post(`${server_port}/api/people/profileLike`, { userId })
    }

    /** 🔹 Get public posts */
    async function getPublicPost() {
        try {
            const res = await axios.get(`${server_port}/api/post/publicpost`, { withCredentials: true });
            setPost(res.data.posts);
        } catch (error) {
            console.error("Failed to load public posts:", error);
        }
    }

    useEffect(() => {
        getPublicPost();
    }, []);

    /** 🔹 Alert like */
    async function alertLike(receiverId, senderId, postId, reactType) {
        try {
            const res = await axios.post(`${server_port}/api/noti/likeAlert`, {
                receiverId,
                senderId,
                postId,
                reactType,
            });
            toast.success(res.data.message);
        } catch (err) {
            console.error("Like alert failed:", err);
        }
    }

    /** 🔹 Show/hide React Plate */
    function showPlate(e, index) {
        const Plate = document.getElementById(`react_plate_${index}`);
        if (!Plate) return;
        if (e) {
            Plate.classList.remove("hidden");
            Plate.classList.add("flex");
        } else {
            Plate.classList.remove("flex");
            Plate.classList.add("hidden");
        }
    }

    /** 🔹 Get Top 3 React types */
    function getTop3React(reactArray = []) {
        const reactObject = {};
        reactArray.forEach((item) => {
            const type = item.type;
            reactObject[type] = (reactObject[type] || 0) + 1;
        });
        const sortedArray = Object.entries(reactObject).sort((a, b) => b[1] - a[1]);
        return sortedArray.slice(0, 3);
    }

    function seallreact(postId) {
        navigate("/allreacts", { state: { postId } });
    }

    const postBG = "";

    return (
        <div>
            {/* Top nav */}
            <div className='w-full h-auto flex justify-between items-center sticky top-0 z-40 px-2 bg-zinc-900'>
                <MoveLeft onClick={() => { navigate(localStorage.getItem("back_page")); localStorage.setItem("isForword", "false"); }} />
                {isForWord && (
                    <MoveRight
                        onClick={() => {
                            navigate("/mutualfriends", { state: { id: user._id, friends: user?.friends } });
                            localStorage.setItem("back_page_", "/publicprofile");
                        }}
                    />
                )}
            </div>

            <div className='text-white p-2'>
                {/* Profile image */}
                <div className='w-full h-full overflow-hidden flex justify-center items-center '>
                    <img src={user?.image} className='absolute z-50 mt-10 w-96 h-96 rounded-full' />
                    <div className="h-screen w-full"></div>
                </div>

                {/* Profile details */}
                <div className='h-auto flex justify-between items-center'>
                    <h4 className='text-5xl font-semibold'>{user?.name}</h4>
                    <button
                        className={requestStatus === "accepted" ? "hidden" : ""}
                        onClick={() => sendFriendRquest(userId)}
                    >
                        {requestStatus}
                    </button>
                    <h1 className='cursor-pointer' onClick={addLike}>
                        Likes: {user?.like}
                    </h1>
                </div>

                <hr className='w-full h-[2px] bg-indigo-900 my-5 border-none' />

                {/* User info */}
                <div className='grid md:grid-cols-2 lg:grid-cols-3 my-5 gap-5'>
                    {/* Email */}
                    <div className='p-[3px] border w-full h-[87.5px] rounded-lg bg-gradient-to-r from-green-400 to-blue-500 flex justify-center items-center'>
                        <div className='bg-slate-800 h-auto w-full rounded-md p-1'>
                            <span className='flex items-center justify-start gap-3'>
                                <h1>Email:- <span className='italic text-indigo-600'>{user?.email}</span></h1>
                                <span
                                    className='scale-75 cursor-pointer'
                                    onClick={() => {
                                        navigator.clipboard.writeText(user?.email);
                                        setIsCopy(true);
                                        notify(`Copied ${user?.email}`);
                                        setTimeout(() => setIsCopy(false), 1000);
                                    }}
                                >
                                    {!isCopy ? <Copy /> : <CopyCheck />}
                                </span>
                            </span>
                            <h4>Age:- {user?.age}</h4>
                            <h4>Gender:- {user?.gender}</h4>
                        </div>
                    </div>

                    {/* Friends */}
                    <div className='p-[3px] border w-full h-[87.5px] rounded-lg bg-gradient-to-r from-green-400 to-blue-500 flex justify-center items-center'>
                        <div className='bg-slate-800 h-full w-full rounded-md p-1'>
                            <h1>Friends</h1>
                            <Link
                                to={"/mutualfriends"}
                                state={{ friends: user?.friends, id: userId }}
                                className='my-3 flex justify-start items-center'
                                onClick={() => {
                                    localStorage.setItem("back_page_", location_.pathname);
                                    localStorage.setItem("isForword", "true");
                                }}
                            >
                                {user?.friends?.map((data, index) => (
                                    <img key={data?._id || index} className={`w-5 h-5 rounded-full ${index > 0 ? "-ml-2" : ""}`} src={data?.image} />
                                ))}
                            </Link>
                        </div>
                    </div>

                    {/* Bio */}
                    <div className='p-[3px] border w-full rounded-lg bg-gradient-to-r from-green-400 to-blue-500 flex justify-center items-center max-h-auto'>
                        <div className='bg-slate-800 h-full w-full rounded-md p-1 max-h-auto'>
                            <h1>Bio</h1>
                            <p>{user?.bio || "No bio available"}</p>
                        </div>
                    </div>
                </div>

                {/* Posts */}
                <div className='relative flex flex-col-reverse w-full'>
                    <div className='w-full'>
                        <h1 className='text-xl capitalize my-3'>{user?.gender === "male" ? "his" : "her"} posts</h1>
                        {posts?.length === 0 ? (
                            <span className='text-3xl text-gray-600 text-center block capitalize font-bold my-5'>No posts</span>
                        ) : (
                            <div className='w-full flex flex-wrap'>
                                {posts?.map((data, index) => {
                                    const myLike = data?.likes?.find((like) => like.user === _id_);
                                    const topReacts = getTop3React(data?.likes);

                                    return (
                                        <div key={data?._id || index} className='mx-auto w-full md:w-[48%] h-auto rounded-lg p-2 backdrop-blur-md my-5 bg-slate-900'>
                                            {/* Post header */}
                                            <div className='flex justify-between items-center border-b-2 border-cyan-700 mb-3'>
                                                <div className='flex justify-between items-center gap-2'>
                                                    <img className='w-10 h-10 rounded-full' src={data?.postOwner?.image} />
                                                    <h4>{data?.postOwner?.name}</h4>
                                                </div>
                                                <div className='flex justify-between items-center gap-2'>
                                                    <Ellipsis size={48} strokeWidth={1.5} />
                                                    <X className='hover:text-red-500' />
                                                </div>
                                            </div>

                                            {/* Post content */}
                                            <div className='my-2'>
                                                <Seemore text={data.caption} range={200} />
                                            </div>
                                            {data.media && (
                                                data.video
                                                    ? <video src={data?.media} controls loop playsInline muted className='w-full rounded-md object-fill h-96' />
                                                    : <img src={data?.media} className='rounded-md w-full max-h-96 object-contain' />
                                            )}

                                            {/* Post footer */}
                                            <footer className="h-auto">
                                                <div className="w-full h-auto flex justify-between items-center">
                                                    <span
                                                        className={`flex items-center my-1 rounded-md px-1 cursor-pointer shadow-md ${postBG.split("-").slice(0, 2).join("-")}-600`}
                                                        onClick={() => seallreact(data?._id)}
                                                    >
                                                        {topReacts.map(([type], i) => (
                                                            <img
                                                                key={i}
                                                                src={`./assets/react_icons/${type === "love" ? "heart" : type}.png`}
                                                                className="w-5 h-5"
                                                                alt={type}
                                                            />
                                                        ))}
                                                        <span className="mx-2">{formatNumber(data?.likes?.length)}</span>
                                                    </span>
                                                    <span>
                                                        <span className="mx-2">share</span>
                                                        {formatNumber(data?.share.length)}
                                                    </span>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex">
                                                    {/* LIKE */}
                                                    <div
                                                        className="post_footer w-4/12"
                                                        onMouseEnter={() => setTimeout(() => showPlate(true, index), 100)}
                                                        onMouseLeave={() => showPlate(false, index)}
                                                    >
                                                        <ReactPlate
                                                            index={index}
                                                            postId={data?._id}
                                                            type="post"
                                                            onReturn={async (t) => await alertLike(data?.postOwner?._id, _id_, data?._id, t)}
                                                            color={postBG}
                                                        />

                                                        {myLike ? (
                                                            <img
                                                                src={`./assets/react_icons/${myLike.type === "love" ? "heart" : myLike.type}.png`}
                                                                className="w-8 h-8"
                                                                alt="my-like"
                                                            />
                                                        ) : (
                                                            <img
                                                                src="./assets/react_icons/beforelike.png"
                                                                className="w-8 h-8"
                                                                alt="before-like"
                                                            />
                                                        )}
                                                    </div>

                                                    {/* COMMENT */}
                                                    <Link
                                                        to="/commentplate"
                                                        state={{ post_id: data?._id }}
                                                        className="post_footer w-4/12 justify-center"
                                                        onClick={() => localStorage.setItem("back_page", location.pathname)}
                                                    >
                                                        <MessageSquareIcon />
                                                        {formatNumber(data?.comments?.length)}
                                                    </Link>

                                                    {/* SHARE */}
                                                    <span className="post_footer w-4/12 justify-end">
                                                        <Link to="/share" state={{ friends, post: data?._id }}>
                                                            <Share2 />
                                                        </Link>
                                                    </span>
                                                </div>
                                            </footer>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className='w-[100%] h-56 gap-2 grid sm:grid-cols-2 md:grid-cols-3 '>
                        <BatteryInfo />
                        <LocationInfo />
                        <DeviceInfo />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Publicprofile;
