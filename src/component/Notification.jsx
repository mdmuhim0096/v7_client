import { useEffect, useState } from 'react';
import axios from 'axios';
import Navbar from './Navbar';
import { server_port } from "./api";
import { Link } from "react-router-dom";
import { X } from "lucide-react"
import ShortText from './ShortText';
import { ToastContainer, toast } from 'react-toastify';
import LoaderContainer from './LoaderContainer';
import { isMatchGroup } from '../utils/utils';
import { tone } from "../utils/soundprovider";
import { useNavigate } from 'react-router-dom';
import socket from "./socket";

const Notification = () => {
    const navigate = useNavigate();
    const { callTone } = tone;
    const myId = localStorage.getItem("myId");
    const [notifications, setNoti] = useState([]);
    const [load, setLoad] = useState(0);
    const [endLoad, setEndLoad] = useState(true);

    useEffect(() => {
        const get_noti = async () => {
            setEndLoad(false);
            await axios.get(server_port + `/api/noti/get_noti/${myId}`).then(res => {
                setNoti(res.data);
                setEndLoad(true);
            })
        }
        get_noti();
    }, [load]);


    const deleteNotification = (id) => {
        axios.post(server_port + "/api/noti/delete", { id }).then(res => {
            toast.success(res?.data?.message);
        })
        setLoad(load + 1);
    }

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

    return (
        <div className='overflow-hidden'>
            <LoaderContainer type={"load"} loadEnd={endLoad} />
            {/* <ToastContainer /> */}
            <div className='px-[2.4px] h-screen overflow-y-auto'>
                <div className='sticky top-0'>
                    <Navbar />
                </div>
                {
                    notifications.map((data, index) => (
                        <div key={index} className='flex justify-between md:items-center w-full h-auto my-4 pb-2 bg-zinc-900 rounded-md p-1 border-b border-fuchsia-700'>
                            <Link
                                to={"/get_post_by_notification"} state={{ postId: data?.type === "comment" ? data?.commentId : data.postId?._id }} key={index}
                                className='flex items-center'
                            >
                                <div className='flex flex-col md:flex-row items-start gap-4'>
                                    <div className='flex gap-4 items-center'>
                                        <img src={data?.senderId?.image} className='w-7 h-7 rounded-full' />
                                        <h4>
                                            {data?.senderId?.name}
                                        </h4>
                                        <img
                                            src={`./assets/react_icons/${data?.type === "like" || data?.type === "cLike" ? "like.png" : data?.type === "comment" || data?.type === "reply" ? "chat.png" : data?.type === "post" && data?.postId?.video == true ? "video.png" : data?.type === "post" && data?.postId?.video == false ? "post.png" : data?.type === "follw" ? "bell.png" : data?.type === "report" ? "alert.png" : data?.type === "mention" ? "tag.png" : data?.type === "live" ? "live.png" : data?.type === "love" || data?.type === "cLove" ? "heart.png" : data?.type === "wow" || data?.type === "cWow" ? "wow.png" : data?.type === "sad" || data?.type === "cSad" ? "sad.png" : data?.type === "angry" || data?.type === "cAngry" ? "angry.png" : data?.type === "care" || data?.type === "cCare" ? "care.png" : "haha.png"}`}
                                            className='w-8 h-8'
                                        />
                                    </div>

                                    <h4 className='underline font-bold'>{data?.type === "cAngry" || data?.type === "cLike" || data?.type === "cSad" || data?.type === "cLove" || data?.type === "cWow" || data?.type === "cHaha" || data?.type === "cCare" || data?.type === "reply" || data?.type === "comment" ? data?.text : data?.type === "like" || data?.type === "love" || data?.type === "haha" || data?.type === "care" || data?.type === "angry" || data?.type === "sad"|| data?.type === "wow" || data?.type === "post" ? <ShortText text={ data?.type + " react you'r post " +data?.postId?.caption} width={window.innerWidth} dot={4} type={"long noti"} range={window.innerWidth < 321 && window.innerWidth < 475 ? 50 : window.innerWidth < 476 && window.innerWidth < 620 ? 15 : 50} /> : data?.type === "report" && !data?.postId ? "post already deleted" + `${data?.text.includes("we remove") ? " because " : " resone "}` + data?.text : data?.type === "mention" ? "" : data?.type === "report" && data?.postId ? data?.text : ""}</h4>

                                    <i className='text-sm lg:text-[16px]'>{data?.type === "comment" ? "comment on your post" : data?.type === "like" ? "like your post" : data?.type === "cLike" || data?.type === "cLove" || data?.type === "cCare" || data?.type === "cHaha" || data?.type === "cWow" || data?.type === "cSad" || data?.type === "cAngry" ? `${data?.type?.slice(1)} react you'r comment` : data?.type === "post" ? "make a post" : data?.type === "report" ? "make a report on you'r post" : data?.type === "reply" ? "reply of you'r comment" : data?.type === "mention" ? "mention you" : ""}
                                        <img
                                            src="./assets/react_icons/clock.png"
                                            className='w-4 h-4 mx-2 inline'
                                        />
                                        {new Date(data?.createdAt).toLocaleString()}</i>

                                </div>
                            </Link>
                            <div className='hover:text-red-500 duration-300 cursor-pointer' onClick={() => { deleteNotification(data?._id) }} >
                                <X />
                            </div>
                        </div>
                    )).reverse()
                }
            </div>
        </div>
    );
};

export default Notification;