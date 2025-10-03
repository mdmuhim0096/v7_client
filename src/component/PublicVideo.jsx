import { useEffect, useState } from 'react'
import axios from 'axios';
import { server_port, myfriends_api } from './api';
import { Ellipsis, X, Share2, MessageSquareIcon, Save, Link2Icon } from "lucide-react";
import Seemore from './Seemore';
import { Link, useLocation, useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import { formatNumber } from '../utils/formatenumber';
import { tone } from "../utils/soundprovider";
import { isMatchGroup } from '../utils/utils';
import socket from "./socket";
import ReactPlate from './ReactPlate';

const PublicVideo = () => {
    const navigate = useNavigate();
    const { callTone } = tone;
    const location = useLocation();
    const [videos, setVideos] = useState([]);
    const [friends, setFriends] = useState(null);
    const _id_ = localStorage.getItem("myId");
    const [loadData, setLoadData] = useState("");

    useEffect(() => {
        try {
            const getPublicVideo = async () => {
                await axios.get(server_port + "/api/post/read_all_video/" + localStorage.getItem("myId")).then(res => {
                    setVideos(res.data.videos);
                });
                const res = await axios.get(myfriends_api, { withCredentials: true });
                setFriends(res.data.data);
            }
            getPublicVideo();
        } catch (error) {
            console.log(error)
        }
    }, [loadData]);


    useEffect(() => {
        const handleIncomingCall = (data) => {
            if (data.userId === localStorage.getItem("myId")) {
                navigate("/audiocall", { state: { callId: data.callId, userId: data.userId, role: "receiver", info: data.info } });
                try {
                    if (callTone) {
                        callTone?.play();
                    }
                } catch (error) {
                    console.log(error);
                }
            }
        }

        socket.on("incoming_call_a", handleIncomingCall);
        return () => {
            socket.off("incoming_call_a", handleIncomingCall);
        }
    }, []);

    useEffect(() => {
        const handleIncomingCall = (data) => {

            if (data.userId === localStorage.getItem("myId")) {
                navigate("/v", { state: { callId: data.callId } });
                try {
                    if (callTone) {
                        callTone?.play();
                    }
                } catch (error) {
                    console.log(error);
                }
            };
        }

        socket.on("____incoming_call____", handleIncomingCall);
        return () => {
            socket.off("____incoming_call____", handleIncomingCall);
        };

    }, []);

    useEffect(() => {
        const handelRoom = async (data) => {

            const isMatch = await isMatchGroup(data);
            if (isMatch) {
                navigate("/groupvideocall", { state: { callId: data, isCaller: false, image: localStorage.getItem("myImage"), name: localStorage.getItem("myName") } });
                try {
                    if (callTone) {
                        callTone?.play();
                    }
                } catch (error) {
                    console.log(error);
                }
            }
        }

        socket.on("join_room", handelRoom);
        return () => {
            socket.off("join_room", handelRoom);
        }
    }, [])

    useEffect(() => {
        const handelRoom = async (data) => {

            const isMatch = await isMatchGroup(data);
            if (isMatch) {
                navigate("/groupaudiocall", { state: { callId: data, isCaller: false, image: localStorage.getItem("myImage"), name: localStorage.getItem("myName") } });
                try {
                    if (callTone) {
                        callTone?.play();
                    }
                } catch (error) {
                    console.log(error);
                }
            }
        }

        socket.on("join_audio_room", handelRoom);
        return () => {
            socket.off("join_audio_room", handelRoom);
        }
    }, []);


    const remove_post = (postId) => {
        axios.post(server_port + "/api/people/remove_video_post", { postId }, { withCredentials: true });
    };

    const save = (id) => {
        const _id_ = localStorage.getItem("myId");
        axios.post(server_port + "/api/save/save", { id, _id_ });
    }

    const [isSave, setIsSave] = useState(false);
    const [idForSave, setIdForSave] = useState("");

    const menuContext = () => {
        isSave ? toast(() => (<div className='flex flex-col gap-2'>
            <h6 className='italic flex justify-start items-center gap-2 cursor-pointer' onClick={() => { save(idForSave) }}><Save /> save this</h6>
            <h6 className='italic flex justify-start items-center gap-2 cursor-pointer' onClick={() => { save(idForSave) }}><Link2Icon /> copy link this</h6>
        </div>)) : () => { return };
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

    async function alertLike(receiverId, senderId, postId, reactType) {
        try {
            const res = await axios.post(`${server_port}/api/noti/likeAlert`, {
                receiverId,
                senderId,
                postId,
                reactType,
            });
        } catch (err) {
            console.log(err);
        }
    }

    function seallreact(postId) {
        navigate("/allreacts", { state: { postId } })
    }

    function reloadData(t = "c") {
        for (let i = 0; i <= 2; i++) {
            setLoadData(t + i);
        }
    }

    return (
        <div className='sm:p-4 h-screen overflow-y-auto text-sm p-1' id='postInnerContainer' >
            <div className='sticky top-0 z-50'>
                <Navbar />
            </div>
            <div className='w-full h-auto flex flex-wrap gap-3'>
                {
                    videos?.map((data, index) => {
                        const myLike = data?.likes?.find((like) => like.user === _id_);
                        const topReacts = getTop3React(data?.likes);

                        return (
                            <div key={index} className='w-full md:w-[48%] h-auto rounded-lg p-2 backdrop-blur-md my-5 bg-slate-900'>
                                <div className='flex justify-between items-center border-b-2 border-cyan-700 mb-3'>
                                    <div className='flex justify-between items-center gap-2'>
                                        <img className='w-10 h-10 rounded-full' src={data?.postOwner?.image} />
                                        <h4>{data?.postOwner?.name}</h4>
                                    </div>
                                    <div className='flex justify-between items-center gap-2'>
                                        <Ellipsis size={48} strokeWidth={1.5} absoluteStrokeWidth onClick={() => { setIsSave(true); setIdForSave(data?._id); menuContext() }} />
                                        <X onClick={() => { remove_post(data?._id) }} className='hover:text-red-500' />
                                    </div>
                                </div>
                                <div className='my-2'>
                                    <Seemore text={data?.caption} range={200} />
                                </div>
                                <video className="object-fill w-full h-[300px] md:h-[58vh] rounded-lg" src={data?.media} controls loop ></video>
                                <footer className="h-auto">
                                    <div className="w-full h-auto flex justify-between items-center">
                                        <span
                                            onClick={() => { seallreact(data?._id) }}
                                            className={`flex items-center my-1 rounded-md px-1 cursor-pointer shadow-md `}>
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
                                        </span>
                                        <span>
                                            <span className="mx-2">share</span>
                                            {formatNumber(data?.share.length)}
                                        </span>
                                    </div>

                                    <div className="flex">
                                        {/* LIKE */}
                                        <div className="post_footer w-4/12">
                                            <div
                                                onMouseEnter={() =>
                                                    setTimeout(() => showPlate(true, index), 100)
                                                }
                                                onMouseLeave={() => showPlate(false, index)}
                                            >
                                                <ReactPlate
                                                    index={index}
                                                    postId={data?._id}
                                                    type="post"

                                                    onReturn={async (t) => {
                                                        await alertLike(
                                                            data?.postOwner?._id,
                                                            _id_,
                                                            data?._id,
                                                            t
                                                        );
                                                        reloadData(t)
                                                    }}

                                                    color={"bg-zinc-800"}
                                                />

                                                {myLike ? (
                                                    <img
                                                        src={`./assets/react_icons/${myLike.type === "love" ? "heart" : myLike.type
                                                            }.png`}
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
                                        </div>

                                        {/* COMMENT */}
                                        <Link
                                            to="/commentplate"
                                            state={{ post_id: data?._id }}
                                            className="post_footer w-4/12 justify-center"
                                            onClick={() =>
                                                localStorage.setItem("back_page", location.pathname)
                                            }
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
                        )
                    })
                }

            </div>
        </div>
    )
}

export default PublicVideo;