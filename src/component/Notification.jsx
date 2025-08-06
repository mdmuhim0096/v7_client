import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Navbar from './Navbar';
import { server_port } from "./api";
import { Link } from "react-router-dom";
import { X } from "lucide-react"
import ShortText from './ShortText';
import { ToastContainer, toast } from 'react-toastify';
import LoaderContainer from './LoaderContainer';
import { isMatchGroup } from '../utils/utils';
import {tone} from "../utils/soundprovider";
import { useNavigate } from 'react-router-dom';
import socket from "./socket";

const Notification = () => {
    const navigate = useNavigate();
    const {callTone} = tone;
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
            <ToastContainer />
            <div className='px-2 h-screen overflow-y-auto'>
                <div className='sticky top-0'>
                    <Navbar />
                </div>
                {
                    notifications.map((data, index) => (
                        <div key={index} className='flex justify-between items-center w-full h-auto my-4 pb-2 border-b'>
                            <Link
                                to={"/get_post_by_notification"} state={{ postId: data?.type === "comment" ? data?.commentId : data.postId?._id }} key={index} className='flex items-center'
                            >
                                <div className='flex items-start gap-4'>
                                    <img src={data?.senderId?.image} className='w-7 h-7 rounded-full' />
                                    <h4><ShortText text={data?.senderId?.name} range={7} dot={2} width={window.innerWidth} /></h4>
                                    <h4 className='underline font-bold'>{data?.text}</h4>
                                    <i>{data?.type === "comment" ? "comment on your post" : "make an post"}</i>
                                </div>
                            </Link>
                            <X className='hover:text-red-500 duration-300 cursor-pointer' onClick={() => { deleteNotification(data?._id) }} />
                        </div>
                    ))
                }
            </div>
        </div>
    );
};

export default Notification;