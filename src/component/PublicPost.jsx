import React, { useEffect, useState, useRef } from 'react'
import axios from 'axios';
import { server_port, myfriends_api } from './api';
import { Ellipsis, X, Share2, MessageSquareIcon, ThumbsUp, Save, Link2Icon } from "lucide-react";
import Seemore from './Seemore';
import { Link, useLocation } from "react-router-dom";
import { submitLength } from './Home';
import { formatNumber } from "../utils/formatenumber";
import LoaderContainer from './LoaderContainer';
import { ToastContainer, toast } from "react-toastify"
const PublicPost = () => {
    const location = useLocation();
    const [posts, setPost] = useState([]);
    const [load, setLoad] = useState(0);
    const [friends, setFriends] = useState(null);
    const [endLoad, setEndLoad] = useState(true);

    const get_my_friends = async () => {
        try {
            const res = await axios.get(myfriends_api, { withCredentials: true });
            setFriends(res.data.data);
        } catch (error) {
            console.log(error);
        }
    }

    submitLength(posts.length);
    const [postBG, setPostBG] = useState("");
    useEffect(() => {
        const Myid = localStorage.getItem("myId");
        get_my_friends();
        try {
            const getPublicPost = async () => {
                setEndLoad(false);
                const res = await axios.get(server_port + "/api/post/publicpost/" + Myid, { withCredentials: true });
                setPost(res.data.posts);
                const _res_ = await axios.get(server_port + "/api/people/userStyle", { withCredentials: true })
                setPostBG(_res_.data.data.styles.postbg);
                setEndLoad(true);
            }
            getPublicPost();
        } catch (error) {
            console.log(error)
        }
    }, [load]);

    const doLike = (postId) => {
        axios.post(server_port + "/api/post/addlike", { postId }, { withCredentials: true })
    };

    const remove_post = (postId) => {
        axios.post(server_port + "/api/people/remove_post", { postId }, { withCredentials: true });
        setLoad(load + 1);
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
    return (
        <div className='sm:p-4 h-auto' id='postInnerContainer' >
            <LoaderContainer type={"load"} loadEnd={endLoad} />
            <ToastContainer />
            {
                posts.map((data, index) => (
                    <div key={index} className={`mx-auto w-full rounded-lg p-2 backdrop-blur-md my-5 ${postBG} h-auto`}>
                        <div className='flex justify-between items-center border-b-2 border-cyan-700 mb-3'>
                            <Link to={"/publicprofile"} state={{ id: data?.postOwner?._id }}
                                className='flex items-center gap-3' title='profile'
                            >
                                <img className='w-10 h-10 rounded-full' src={data?.postOwner?.image} />
                                <h4 className='hover:text-blue-600 duration-200'>{data?.postOwner?.name}</h4>
                            </Link>
                            <div className='flex justify-between items-center gap-2'>
                                <span onClick={() => { setIsSave(true); setIdForSave(data._id); menuContext() }}>
                                    <Ellipsis size={48} strokeWidth={1.5} absoluteStrokeWidth />
                                </span>
                                <span onClick={() => {
                                    remove_post(data._id);
                                }} className='hover:text-red-500'>
                                    <X />
                                </span>
                            </div>
                        </div>
                        <div className='my-2'>
                            <Seemore text={data.caption} range={200} />
                        </div>
                        {data?.image && !data?.video ? <img className='rounded-md w-full max-h-96 object-fill rounded-ls' src={data?.media} /> : <video src={data?.media} controls loop className='object-fill w-full h-[250px] sm:h-[300px] md:h-[350px] rounded-lg'></video>}
                        <footer className='flex w-full justify-between items-end h-10'>
                            <span onClick={() => {
                                doLike(data?._id)
                                setLoad(load + 1);
                            }} className='post_footer w-4/12'>
                                <ThumbsUp />
                                <span>Like</span>
                                <span>{formatNumber(data?.likes?.length)}</span>
                            </span>
                            <Link
                                to={"/commentplate"}
                                state={{ post_id: data?._id }}
                                className='post_footer w-4/12 justify-center'
                                onClick={() => { localStorage.setItem("back_page", location.pathname) }}
                            >
                                <MessageSquareIcon />
                                <span> {formatNumber(data?.comments?.length)}</span>
                            </Link>

                            <span className='post_footer w-4/12  justify-end'>
                                <Link to={"/share"} state={{ friends, post: data?._id }}>
                                    <Share2 />
                                </Link>
                            </span>
                        </footer>
                    </div>
                ))
            }
        </div>
    )
}

export default PublicPost;