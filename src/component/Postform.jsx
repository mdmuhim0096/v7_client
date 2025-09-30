import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { createPost_api, server_port } from "./api";
import { useNavigate } from 'react-router-dom';
import LoaderContainer from "./LoaderContainer";
import { MoveLeft } from 'lucide-react';
import socket from "./socket";
import { isMatchGroup } from '../utils/utils';
import { tone } from "../utils/soundprovider";

const Postform = () => {
    const { callTone } = tone;
    const [media, setMedia] = useState(null);
    const [caption, setCaption] = useState("");
    const [loadEnd, setLoadEnd] = useState(true);
    const [isClip, setClip] = useState(false);
    const myId = localStorage.getItem("myId");

    const navigate = useNavigate();
    const handelPost = (e) => {
        e.preventDefault();
        setLoadEnd(false);
        const fd = new FormData();
        fd.append("media", media);
        fd.append("caption", caption);
        axios.post(isClip ? server_port + "/api/post/createClip/" + myId : createPost_api, fd, { withCredentials: true }).then(res => {
            setLoadEnd(true);
            navigate("/");
        })
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
        <div className="flex flex-col items-center gap-20 h-screen">
            <div className="relative mt-12 sm:mt-16 md:mt-32" >
                <form onSubmit={handelPost}>
                    <textarea required placeholder='write your cation' onChange={(e) => { setCaption(e.target.value) }} value={caption}></textarea>
                    <input type="file" required id="file" onChange={(e) => { setMedia(e.target.files[0]) }} />
                    <div className='flex items-center justify-between gap-3'>
                        <button type="submit" id="clickBtn">upload</button>
                        <LoaderContainer type={"upload"} loadEnd={loadEnd} />
                        <span className='cursor-pointer' onClick={() => { setClip(isClip ? false : true) }}>{isClip ? "post" : "clip"}</span>
                    </div>
                </form>
            </div>
            <div className='w-10 h-10 rounded-md bg-zinc-900 flex justify-center items-center hover:bg-zinc-800 duration-100 fixed bottom-2 left-2'
                onClick={() => { navigate("/") }}>
                <MoveLeft />
            </div>
        </div>
    )
}

export default Postform;