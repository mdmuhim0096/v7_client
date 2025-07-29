import React, { useEffect, useState, useRef } from 'react'
import axios from 'axios';
import { server_port, myfriends_api } from './api';
import { Ellipsis, X, Share2, MessageSquareIcon, ThumbsUp, Save, Link2Icon } from "lucide-react";
import Seemore from './Seemore';
import { Link, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import { formatNumber } from '../utils/formatenumber';
import LoaderContainer from './LoaderContainer';

const PublicVideo = () => {
    const location = useLocation();
    const [videos, setVideos] = useState([]);
    const [endLoad, setEndLoad] = useState(true);
    const [friends, setFriends] = useState(null);

    useEffect(() => {
        try {
            const getPublicVideo = async () => {
                setEndLoad(false);
                await axios.get(server_port + "/api/post/read_all_video/" + localStorage.getItem("myId")).then(res => {
                    setVideos(res.data.videos);
                    setEndLoad(true);
                });
                const res = await axios.get(myfriends_api, { withCredentials: true });
                setFriends(res.data.data);
            }
            getPublicVideo();
        } catch (error) {
            console.log(error)
        }
    }, []);

    const remove_post = (postId) => {
        axios.post(server_port + "/api/people/remove_video_post", { postId }, { withCredentials: true });
    };


    const doLike = (postId) => {
        axios.post(server_port + "/api/post/addlike", { postId }, { withCredentials: true })
    }

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

    return (
        <div className='sm:p-4 h-screen overflow-y-auto text-sm p-1' id='postInnerContainer' >
            <LoaderContainer type={"load"} loadEnd={endLoad} />
            <div className='sticky top-0 z-50'>
                <Navbar />
            </div>
            {
                videos?.map((data, index) => (
                    <div key={index} className='mx-auto w-full h-[450px] sm:w-7/12 md:h-[88vh] lg:h-[82vh] rounded-lg p-2 backdrop-blur-md my-5 bg-slate-900'>
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
                        <footer className='flex w-full justify-between items-end h-10'>
                            <span onClick={() => {
                                doLike(data?._id)
                            }} className='post_footer w-4/12 '>
                                <ThumbsUp />
                                <span>{formatNumber(data?.likes?.length)}</span>
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

export default PublicVideo;