import React, { useEffect, useState, useRef } from 'react'
import axios from 'axios';
import { mypost_api, server_port, myfriends_api } from './api';
import { Ellipsis, X, Share2, MessageSquareIcon, ThumbsUp, Rocket } from "lucide-react";
import Seemore from './Seemore';
import { Link, useLocation } from "react-router-dom";
import { formatNumber } from '../utils/formatenumber';

const Mypost = () => {
    const location = useLocation();
    const [posts, setPost] = useState([]);
    const [load, setLoad] = useState(0);
    const [friends, setFriends] = useState(null);

    useEffect(() => {
        try {
            const getMyPost = async () => {
                const res = await axios.get(mypost_api, { withCredentials: true })
                setPost(res.data.data);
                const res_ = await axios.get(myfriends_api, { withCredentials: true });
                setFriends(res_.data.data);
            }
            getMyPost();
        } catch (error) {
            console.log(error)
        }
    }, [load]);


    const doLike = (postId) => {
        axios.post(server_port + "/api/post/addlike", { postId }, { withCredentials: true })
    }

    const [captionForUpdate, setCaptionForUpdate] = useState("");
    const [updatebleFile, setFileForUpdate] = useState(null);
    const [updateForm, setUpdateForm] = useState(false);
    const [idForUpdateHandel, setIdForUpdateHandel] = useState("");

    const updateCption = (postId) => {
        axios.post(server_port + "/api/post/upadateCaption/" + postId, { caption: captionForUpdate });
        setLoad(load + 1)
    }

    const updateFile = (postId) => {
        const fd = new FormData();
        fd.append("media", updatebleFile);
        axios.post(server_port + "/api/post/upadateMedia/" + postId, fd);
        setLoad(load + 1)
    }

    const deletePost = (postId) => {
        axios.delete(server_port + "/api/post/delete/" + postId);
        setLoad(load + 1)
    }

    const [scrollTop, setScrollTop] = useState(window.scrollY);
    useEffect(() => {
        const handelScrollY = () => setScrollTop(window.scrollY);
        window.addEventListener("scroll", handelScrollY)

        return () => window.removeEventListener("scroll", handelScrollY)
    }, []);

    return (
        <div>
            <div className={`${updateForm ? "" : "hidden"} w-full h-screen px-3 rounded-xl backdrop-blur-md fixed z-50 border top-0 left-0 flex justify-center items-center`}>
                <div>
                    <div onClick={() => { setUpdateForm(false) }} className='float-right my-4'><X />
                    </div>
                    <div>
                        <textarea className='resize-none h-32 overflow-y-auto' value={captionForUpdate} onChange={(e) => { setCaptionForUpdate(e.target.value) }}></textarea>
                        <button onClick={() => { updateCption(idForUpdateHandel) }}>update</button>
                    </div>
                    <div>
                        <input type="file" name='media' onChange={(e) => { setFileForUpdate(e.target.files[0]) }} />
                        <button onClick={() => { updateFile(idForUpdateHandel) }}>update</button>
                    </div>
                </div>
            </div>
            {
                posts.map((data, index) => (
                    <div key={index} className='mx-auto sm:w-6/12 h-auto rounded-lg p-2 backdrop-blur-md my-5 bg-slate-900'>
                        <div className='flex justify-between items-center border-b-2 border-cyan-700 mb-3'>
                            <div className='flex justify-between items-center gap-2'>
                                <img className='w-10 h-10 rounded-full' src={data?.postOwner?.image} />
                                <h4>{data?.postOwner?.name}</h4>
                            </div>
                            <div className='flex justify-between items-center gap-2'>
                                <span onClick={() => {
                                    setIdForUpdateHandel(data?._id);
                                    setUpdateForm(true);
                                    setCaptionForUpdate(data?.caption);
                                    handelPosition()
                                }} >
                                    <Ellipsis size={48} strokeWidth={1.5} absoluteStrokeWidth />
                                </span>
                                <span className='hover:text-red-500' onClick={() => {
                                    deletePost(data._id);
                                    setTimeout(() => { setLoad(load + 1) }, 200);
                                }}>
                                    <X />
                                </span>
                            </div>
                        </div>
                        <div className='my-2'>
                            <Seemore text={data.caption} range={200} />
                        </div>
                        {data.image && !data.video ? <img className='rounded-md w-full max-h-96 object-contain' src={data?.media} /> : <video src={data?.media} controls loop ></video>}
                        <footer className='flex w-full justify-between items-end h-10'>
                            <span onClick={() => {
                                doLike(data._id)
                                setLoad(load + 1);
                            }} className='post_footer w-4/12'>
                                <ThumbsUp />
                                <span>{data?.likes?.length}</span>
                            </span>
                            <Link
                                to={"/commentplate"}
                                state={{ post_id: data?._id }}
                                className='post_footer w-4/12 justify-center'
                                onClick={() => { localStorage.setItem("back_page", location.pathname) }}
                            >
                                <MessageSquareIcon />
                                <span>{formatNumber(data?.comments?.length)}</span>
                            </Link>
                            <Link to={"/share"} state={{ friends, post: data?._id }}
                                className=' w-4/12 flex justify-end'>
                                <Share2 />
                            </Link>
                        </footer>
                    </div>
                ))
            }
        </div>
    )
}

export default Mypost