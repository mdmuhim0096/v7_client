import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Ellipsis, MoveUp, Rocket } from "lucide-react";
import { Link } from "react-router-dom";
import { ToastContainer, toast } from 'react-toastify';
import { server_port } from './api';
import Navbar from "./Navbar";
import ShortText from './ShortText';
import socket from "./socket";
import { isMatchGroup } from '../utils/utils';
import { tone } from "../utils/soundprovider";
import ReactPlate from './ReactPlate';


const CommentRenderer = () => {

    const { post_id, id } = useLocation()?.state || {};
    const navigate = useNavigate();
    const [commentOrReplay, setCommentOrReplay] = useState("");
    const [doreplay, setDoReoplay] = useState(false);
    const [commentId, setCommentId] = useState("");
    const [innerReplay, setInnerReplay] = useState(false);
    const [innerReplayId, setInnerReplayId] = useState("");
    const [commentWoner, setComentWoner] = useState(null);
    const [post_info, setPost_info] = useState([]);
    const notify = (m) => { toast.success(m) };
    const { callTone } = tone;
    const myId = localStorage.getItem("myId");


    const [commentReplay, setCommentReplay] = useState([
        {
            "text": "hello",
            "user": "67d7a8c65a7e8be20ce47cbc",
            "_id": "67dc0b2c1f5cee2eaa24d9aa",
            "replies": []
        }
    ]);

    async function getPostInfo(id) {
        try {
            const res = await axios.get(server_port + `/api/post/postinfo/${id}`);
            setPost_info(res.data.singlePost);
            setCommentReplay(res.data.singlePost.comments);
        } catch (error) {
            console.log(error)
        }
    }

    useEffect(() => {
        const handleIncomingCall = (data) => {
            if (data.userId === myId) {
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

    useEffect(() => {
        getPostInfo(post_id);
    }, []);

    useEffect(() => {
        const loadComment = (e) => {
            getPostInfo(post_id);
            goToBottom();
        }
        socket.on("comment", loadComment)
        return () => { socket.off("comment", loadComment) }
    }, [])

    const addComment = () => {
        if (commentOrReplay.trim()) {
            axios.post(server_port + "/api/post/addcomment", { comment: commentOrReplay, post_id }, { withCredentials: true });
            addNoti(post_id, commentOrReplay, post_info?.postOwner._id, "comment");
            setCommentOrReplay("")
            notify("comment added ☺");
        }
    }

    const doReplay = () => {
        if (commentOrReplay.trim()) {
            axios.post(server_port + "/api/post/addreplay", { replyText: commentOrReplay, postId: post_id, commentId }, { withCredentials: true })
        }
        addNoti(post_id, commentOrReplay, commentWoner, "reply");
        setCommentOrReplay("")
        notify("replay added ☺");
    }

    const doInnerRplay = () => {
        if (commentOrReplay.trim()) {
            axios.post(server_port + "/api/post/addinnerreplay", { replyText: commentOrReplay, postId: post_id, commentId, repId: innerReplayId }, { withCredentials: true })
        }
        addNoti(post_id, commentOrReplay, commentWoner, "reply");
        setCommentOrReplay("");
        notify("replay added ☺");
        setInnerReplay(false);
    }
    const [replayOf, setReplayOf] = useState("");
    const [nestedId, setNestedId] = useState("");
    const [nsetReplay, setNestReplay] = useState(false);

    function goToBottom() {
        setTimeout(() => {
            const chat_container = document.getElementById("commentplate2");
            chat_container?.scrollTo({ top: chat_container.scrollHeight, behavior: "smooth" })
        }, 700)
    }

    const doNestedInnerReplay = () => {
        if (commentOrReplay.trim()) {
            axios.post(server_port + "/api/post/addNestedInnerReplay", { replyText: commentOrReplay, postId: post_id, commentId, repId: innerReplayId, replayOf, nestedId }, { withCredentials: true })
        }
        addNoti(post_id, commentOrReplay, commentWoner, "reply");
        setCommentOrReplay("")
        notify("reply added ☺")
        setInnerReplay(false);
    }

    function addNoti(commentId_, commentText, receiverId, type) {
        axios.post(server_port + "/api/addNoti/add", { receiverId, senderId: localStorage.getItem("myId"), type, commentId: commentId_, text: commentText, postId: null })
    }

    const inputRef = useRef();
    const focus = () => {
        inputRef.current.focus();
    }

    async function alertCommentLike(receiverId, senderId, postId, commentId, text, __reactType__) {

        const reactType = __reactType__ === "love" ? "cLove" : __reactType__ === "sad" ? "cSad" : __reactType__ === "angry" ? "cAngry" : __reactType__ === "wow" ? "cWow" : __reactType__ === "haha" ? "cHaha" : __reactType__ === "care" ? "cCare" : "cLike";

        await axios.post(server_port + "/api/noti/commentLikeAlert", { receiverId, senderId, postId, commentId, text, reactType }).then(res => {
            toast.success(res.data.message);
            socket.emit("comment", null)
        });

    }

    function showPlate(e, index, _key_) {

        try {
            const Plate = document.getElementById(`react_plate_${index + _key_?.toString()}`);

            if (e) {
                Plate.classList.remove("hidden");
                Plate.classList.add("flex");
            } else {
                Plate.classList.remove("flex");
                Plate.classList.add("hidden");
            }
        } catch (error) {
            console.log(error);
        }

    }


    return (
        <div >
            <Navbar />
            <ToastContainer />
            <div className={`w-full h-full backdrop-blur-sm fixed top-0 left-0 flex justify-center items-center z-10`} id='commentplate'>
                <div className="w-full h-full rounded-md bg-teal-950 shadow-xl p-2">
                    <header className='flex justify-between items-center gap-3 pb-1 mb-1'>
                        <span className='-rotate-90 ml-2 cursor-pointer' onClick={() => { navigate(localStorage.getItem("back_page"), { state: { postId: post_id, id } }) }}>
                            <MoveUp className='animate-bounce' />
                        </span>
                        <span>
                            <Ellipsis />
                        </span>
                    </header>
                    <div className='w-full h-[82vh] overflow-y-auto' id='commentplate2'>
                        <div className='w-full h-auto rounded-lg bg-gray-700'>
                            {post_info?.image && !post_info?.video ? <img className='rounded-md w-full max-h-96 object-contain' src={post_info?.media} /> : <video src={post_info.media} controls loop ></video>}
                            <p className='p-2 text-teal-300'>{post_info.caption}</p>
                        </div>
                        <div className='w-full h-auto mt-2 rounded-md text-sm relative'>
                            {commentReplay?.map((data, index) => (
                                <div key={index} className='my-2 bg-gray-700 rounded-md p-2 border-b-4 text-sm '>
                                    <div className='border-s border-b w-full p-1 sm:p-2 rounded-sm'>
                                        <div className='flex justify-start items-center gap-1'>
                                            <div className='flex justify-start items-center gap-1 cursor-pointer'>
                                                <img src={data?.user?.image} className='w-6 h-6 rounded-full' />
                                                <Link to={"/publicprofile"} state={{ id: data?.user?._id }} className='text-sm text-ellipsis font-extrabold text-sky-600 duration-200
                        hover:text-cyan-500'>
                                                    <ShortText text={data?.user?.name} width={window.innerWidth} dot={3} /></Link>
                                            </div>
                                            <span>|</span>
                                            <span

                                                onMouseEnter={() => { showPlate(true, index, data?._id) }}
                                                onMouseLeave={() => { showPlate(false, index, data?._id) }}
                                                className='cursor-pointer text-indigo-600 duration-200 hover:text-indigo-400'
                                                onClick={() => {
                                                    setCommentId(data?._id);
                                                }}

                                            >like
                                                <ReactPlate commentId={data?._id} postId={post_id} type={'comment'} index={index + data?._id} onReturn={async (t) => { await alertCommentLike(data?.user?._id, myId, post_id, data?._id, data?.text, t) }} />

                                                {data?.likes?.length}</span>
                                            <span>|</span>
                                            <span className='cursor-pointer text-green-500 duration-200 hover:text-green-300'
                                                onClick={() => {
                                                    setCommentId(data?._id);
                                                    setDoReoplay(true);
                                                    focus();
                                                    setComentWoner(data?.user?._id);
                                                }}>replay</span>
                                            <span>|</span>
                                            <span className='text-orange-600 duration-200
                hover:text-orange-500 cursor-pointer'
                                                onClick={() => { document.getElementById(`replayPlate${index}`).style.display = "block" }}>
                                                <ShortText text={"view replay"} width={window.innerWidth} dot={2} />
                                            </span>
                                        </div>
                                        <h5 className='ml-6 mt-1'>{data?.text}</h5>
                                    </div>
                                    <div className={`ml-1 mt-0 hidden relative`} id={`replayPlate${index}`}>{data?.replies?.map((rep, index_) => (
                                        <div key={index_} className='my-1 relative'>
                                            <div className='p-1 sm:p-2 border-s border-b w-full rounded-sm'>
                                                <div className='flex items-center gap-1'>

                                                    <Link to={"/publicprofile"} state={{ id: rep?.user?._id }} className='flex justify-start items-center gap-1 cursor-pointer'>
                                                        <img src={rep?.user?.image} className='w-6 h-6 rounded-full' />
                                                        <h5 className='text-sm text-ellipsis font-extrabold
                                 text-pink-600 duration-200
                            hover:text-pink-400'>
                                                            <ShortText text={rep?.user?.name} width={window.innerWidth} dot={3} range={8} />
                                                        </h5>
                                                    </Link>

                                                    <span>|</span>
                                                    <span className='cursor-pointer text-blue duration-200 hover:text-indigo-600'

                                                        onMouseEnter={() => { showPlate(true, index_, rep?._id) }}
                                                        onMouseLeave={() => { showPlate(false, index_, rep?._id) }}

                                                    >
                                                        <ReactPlate commentId={data?._id} postId={post_id} repId={rep?._id} type={'reply'} index={index_ + rep?._id} onReturn={async (t) => { await alertCommentLike(rep?.user?._id, myId, post_id, rep?._id, rep?.text, t) }} />
                                                        like
                                                        {rep?.likes?.length}</span>
                                                    <span>|</span>
                                                    <span className='cursor-pointer text-lime-500 
                    duration-200 hover:text-lime-300'
                                                        onClick={() => {
                                                            setInnerReplay(true);
                                                            setNestReplay(false);
                                                            setInnerReplayId(rep?._id);
                                                            setCommentId(data?._id);
                                                            setDoReoplay(true)
                                                            focus();
                                                            setComentWoner(rep?.user?._id);
                                                        }}>replay</span>
                                                </div>
                                                <h5 className='ml-6 mt-1'>{rep?.text}</h5>
                                            </div>
                                            <div className='relative'>{rep.replay.map((innerRep, _index) => (
                                                <div key={_index} className='border-s border-b ml-1 sm:ml-8 p-2 rounded-sm'>
                                                    <div className='flex justify-start items-center gap-1 cursor-pointer'>
                                                        <Link to={"/publicprofile"} state={{ id: innerRep?.user?._id }}
                                                            className='flex justify-start items-center gap-1'>
                                                            <img src={innerRep?.user?.image} className='w-6 h-6 rounded-full' />
                                                            <h5 className='text-sm text-ellipsis font-extrabold
                                                        text-pink-600 duration-200
                                                    hover:text-pink-400'
                                                            ><ShortText text={innerRep?.user?.name} range={8} dot={3} width={window.innerWidth} /></h5>
                                                        </Link>
                                                        <span>|</span>
                                                        <span className='cursor-pointer
                                                                text-blue duration-200
                                                                hover:text-indigo-600'

                                                            onMouseEnter={() => { showPlate(true, _index, innerRep?._id) }}
                                                            onMouseLeave={() => { showPlate(false, _index, innerRep?._id) }}
                                                        >
                                                            like
                                                            <ReactPlate commentId={data?._id} postId={post_id} repId={rep?._id} nestId={innerRep?._id} type={'innerReplyLike'} index={_index + innerRep?._id} onReturn={async (t) => {
                                                                await alertCommentLike(innerRep?.user?._id, myId, post_id, innerRep?._id, innerRep?.text, t)
                                                            }} />
                                                            {innerRep?.likes?.length}</span>
                                                        <span>|</span>
                                                        <span className='cursor-pointer text-lime-500 
                                                                        duration-200 hover:text-lime-300'
                                                            onClick={() => {
                                                                setInnerReplay(false);
                                                                setNestReplay(true);
                                                                setNestedId(innerRep?._id);
                                                                setReplayOf(innerRep?.text);
                                                                setCommentId(data?._id);
                                                                setInnerReplayId(rep?._id);
                                                                setDoReoplay(true);
                                                                focus();
                                                                setComentWoner(innerRep?.user?._id);
                                                            }}>replay</span>
                                                    </div>
                                                    <h5 className='ml-6 mt-1'>{innerRep?.text}</h5>
                                                    <div className='relative'>{innerRep?.replay?.map((nest, _index_) => (<div key={_index_} className='p-0 '>
                                                        <hr />
                                                        <div className='sm:ml-6 mt-1 flex flex-wrap justify-start items-center '>

                                                            <span className='italic text-sky-500 pr-2'>reply of</span>
                                                            <span className=''>[{nest?.replayOf}]</span>
                                                            <Link to={"/publicprofile"} state={{ id: nest?.user?._id }} className='flex items-center px-2 cursor-pointer hover:underline hover:text-sky-500'>
                                                                <img className='w-4 h-4 rounded-full' src={nest?.user?.image} />
                                                                <span className='px-1 text-xs'>{nest?.user?.name}</span>
                                                            </Link>
                                                            <span className='px-1 text-orange-400'>{nest?.user?.gender === "male" ? `his reply is:-` : `shis reply is:-`}</span>
                                                            <span className='underline animate-pulse'>{nest?.text}</span>

                                                            <span className='cursor-pointer text-lime-500 px-2
                                                                            duration-200 hover:text-lime-300'
                                                                onClick={() => {
                                                                    setInnerReplay(false);
                                                                    setNestReplay(true);
                                                                    setNestedId(innerRep?._id);
                                                                    setReplayOf(nest?.text);
                                                                    setCommentId(data?._id);
                                                                    setInnerReplayId(rep?._id);
                                                                    setDoReoplay(true);
                                                                    focus();
                                                                    setComentWoner(nest?.user?._id);
                                                                }}>replay</span>
                                                        </div>
                                                    </div>))}</div>
                                                </div>
                                            ))}</div>
                                        </div>
                                    ))}
                                    </div>

                                </div>
                            ))}
                        </div>
                    </div>
                    <div className='flex justify-between items-center gap-1'>
                        <input
                            type="text"
                            placeholder={`write ${doreplay ? "replay" : "comment"} text`}
                            className='w-[100%] rounded-e-none p-1 placeholder:text-sm text-white'
                            onChange={(e) => { setCommentOrReplay(e.target.value) }}
                            value={commentOrReplay}
                            ref={inputRef} />
                        <div
                            className='border-none pr-3 rounded-s-none 
                                    h-auto w-16 bg-gradient-to-r from-fuchsia-500
                                 to-cyan-500 flex justify-center items-center p-1 
                                    rounded-e-lg text-white cursor-pointer'
                            onClick={() => {
                                if (innerReplay) {
                                    doInnerRplay();
                                } else if (nsetReplay) {
                                    doNestedInnerReplay();
                                } else {
                                    doreplay ? doReplay() : addComment();
                                }
                                setTimeout(() => {
                                    setDoReoplay(false);
                                    socket.emit("comment", null);
                                    goToBottom();
                                }, 60);
                            }}>
                            <Rocket />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
};


export default CommentRenderer;