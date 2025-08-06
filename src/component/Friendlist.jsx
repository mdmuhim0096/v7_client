import React, { useEffect, useState } from 'react';
import axios from "axios";
import { friendlist_api, send_request_api, remove_friend } from './api';
import socket from './socket';
import Navbar from "./Navbar";
import { Link, useNavigate } from "react-router-dom";
import ShortText from './ShortText';
import { Plus } from 'lucide-react';
import LoaderContainer from './LoaderContainer';
import { isMatchGroup } from '../utils/utils.js';
import {tone} from "../utils/soundprovider.js";

const Friendlist = () => {
    const [friends, setFriends] = useState([]);
    const [endLoad, setEndLoad] = useState(true);
    const {callTone} = tone;
    const navigate = useNavigate();

    useEffect(() => {
        const getAll_friend = async () => {
            try {
                setEndLoad(false);
                await axios.get(friendlist_api, { withCredentials: true }).then(res => {
                    setFriends(res.data.data);
                    setEndLoad(true);
                })
            } catch (error) {
                console.log(error)
            }
        }
        getAll_friend();
    }, []);
    
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


    const sendFriendRquest = async (receiverId) => {
        await axios.post(send_request_api, { receiverId }, { withCredentials: true });
    }

    const remove_user = (userId) => {
        axios.post(remove_friend, { userId }, { withCredentials: true })
    }

    return (
        <div className='text-white text-sm h-screen p-1 overflow-y-auto'>
            <LoaderContainer type={"load"} loadEnd={endLoad} />
            <div className='sticky top-0'>
                <Navbar />
            </div>
            <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mt-5'>
                {friends.map((data, index) => (
                    <div className='flex justify-between items-center w-full mx-auto rounded-md px-2 bg-zinc-900 py-1' key={index}>
                        <Link to={"/publicprofile"} state={{ id: data?._id }} className='flex justify-around items-center gap-5'>
                            <img className='w-12 h-12  rounded-full' src={data?.image} />
                            <ShortText text={data?.name} width={window.innerWidth} dot={3} range={3} />
                        </Link>

                        <div className='flex justify-around items-center gap-2 sm:gap-4'>
                            <button className='capitalize' onClick={(() => {
                                remove_user(data?._id)
                            })}>remove</button>
                            <button className='capitalize flex items-center justify-between' onClick={() => {
                                sendFriendRquest(data?._id)
                                socket.emit("__load_data__");
                            }}><span>friend</span> <Plus className='mx-1 w-4 h-4 inline' /></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default Friendlist;