// Mypost.jsx
import { useEffect, useState } from 'react';
import axios from 'axios';
import { mypost_api, server_port, myfriends_api } from './api';
import { Ellipsis, X, Share2, MessageSquareIcon } from "lucide-react";
import Seemore from './Seemore';
import { Link, useLocation, useNavigate } from "react-router-dom";
import { formatNumber } from '../utils/formatenumber';
import ReactPlate from './ReactPlate';

const Mypost = () => {
    const location = useLocation();
    const navigate = useNavigate();
    // States
    const [posts, setPosts] = useState([]);
    const [friends, setFriends] = useState([]);
    const [updateForm, setUpdateForm] = useState(false);
    const [editPostId, setEditPostId] = useState("");
    const [captionForUpdate, setCaptionForUpdate] = useState("");
    const [updateFile, setUpdateFile] = useState(null);
    const _id_ = localStorage.getItem("myId");
    const [loadData, setLoadData] = useState("");

    const fetchData = async () => {
        try {
            const postsRes = await axios.get(mypost_api, { withCredentials: true });
            setPosts(postsRes.data.data);

            const friendsRes = await axios.get(myfriends_api, { withCredentials: true });
            setFriends(friendsRes.data.data);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchData();
    }, [loadData]);

    // Helpers
    const refreshPosts = () => fetchData();

    const deletePost = async (postId) => {
        try {
            await axios.delete(`${server_port}/api/post/delete/${postId}`, { withCredentials: true });
            refreshPosts();
        } catch (err) {
            console.error(err);
        }
    };

    const updateCaption = async () => {
        try {
            await axios.post(`${server_port}/api/post/upadateCaption/${editPostId}`, { caption: captionForUpdate });
            closeUpdateForm();
            refreshPosts();
        } catch (err) {
            console.error(err);
        }
    };

    const updateMedia = async () => {
        if (!updateFile) return;
        try {
            const fd = new FormData();
            fd.append("media", updateFile);
            await axios.post(`${server_port}/api/post/upadateMedia/${editPostId}`, fd);
            closeUpdateForm();
            refreshPosts();
        } catch (err) {
            console.error(err);
        }
    };

    const openUpdateForm = (post) => {
        setEditPostId(post._id);
        setCaptionForUpdate(post.caption || "");
        setUpdateFile(null);
        setUpdateForm(true);
    };

    const closeUpdateForm = () => {
        setEditPostId("");
        setCaptionForUpdate("");
        setUpdateFile(null);
        setUpdateForm(false);
    };

    function getTop3React(reactArray = []) {
        const reactObject = {};
        reactArray.forEach((item) => {
            const type = item.type;
            reactObject[type] = (reactObject[type] || 0) + 1;
        });
        const sortedArray = Object.entries(reactObject).sort((a, b) => b[1] - a[1]);
        return sortedArray.slice(0, 3);
    }

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

    function reloadData(t = "c") {
        for (let i = 0; i <= 2; i++) {
            setLoadData(t + i);
        }
    }

    function seallreact(postId) {
        navigate("/allreacts", { state: { postId } })
    }

    return (
        <div>
            {/* Update Form Modal */}
            {updateForm && (
                <div className='w-full h-screen px-3 rounded-xl backdrop-blur-md fixed z-50 border top-0 left-0 flex justify-center items-center'>
                    <div className='bg-slate-900 p-4 rounded-lg w-full max-w-md'>
                        <div className='flex justify-end'>
                            <X className='cursor-pointer' onClick={closeUpdateForm} />
                        </div>
                        <textarea
                            className='resize-none h-32 w-full p-2 rounded-md'
                            value={captionForUpdate}
                            onChange={e => setCaptionForUpdate(e.target.value)}
                            placeholder='Update caption'
                        />
                        <div className='my-2 flex justify-between'>
                            <input type="file" onChange={e => setUpdateFile(e.target.files[0])} />
                            <button className='px-4 py-2 bg-blue-500 rounded-md text-white' onClick={updateMedia}>Update Media</button>
                        </div>
                        <button className='px-4 py-2 bg-green-500 rounded-md text-white w-full' onClick={updateCaption}>Update Caption</button>
                    </div>
                </div>
            )}

            {/* Posts List */}
            {posts.map((post, index) => {
                const topReacts = getTop3React(post?.likes);
                const myLike = post?.likes?.find((like) => like.user === _id_);
                return (
                    <div key={post._id} className='mx-auto sm:w-6/12 h-auto rounded-lg p-2 backdrop-blur-md my-5 bg-slate-900'>
                        <div className='flex justify-between items-center border-b-2 border-cyan-700 mb-3'>
                            <div className='flex items-center gap-2'>
                                <img className='w-10 h-10 rounded-full' src={post?.postOwner?.image} alt='owner' />
                                <h4>{post?.postOwner?.name}</h4>
                            </div>
                            <div className='flex items-center gap-2'>
                                <Ellipsis size={24} className='cursor-pointer' onClick={() => openUpdateForm(post)} />
                                <X className='cursor-pointer hover:text-red-500' onClick={() => deletePost(post._id)} />
                            </div>
                        </div>

                        <div className='my-2'>
                            <Seemore text={post.caption} range={200} />
                        </div>

                        {post.image && !post.video ? (
                            <img className='rounded-md w-full max-h-96 object-contain' src={post.media} alt='post media' />
                        ) : (
                            <video src={post.media} controls loop className='w-full rounded-md' />
                        )}

                        <footer className="h-auto">
                            <div className="w-full h-auto flex justify-between items-center">
                                <span
                                    className={`flex items-center my-1 rounded-md px-1 cursor-pointer shadow-md`}
                                    onClick={() => {seallreact(post?._id)}}
                                >
                                    {topReacts.map(([type], i) => (
                                        <img
                                            key={i}
                                            src={`./assets/react_icons/${type === "love" ? "heart" : type}.png`}
                                            className="w-5 h-5"
                                            alt={type}
                                        />
                                    ))}
                                    <span className="mx-2">{formatNumber(post?.likes?.length)}</span>
                                </span>
                                <span>
                                </span>
                                <span>
                                    <span className="mx-2">share</span>
                                    {formatNumber(post?.share.length)}
                                </span>
                            </div>

                            <div className="flex">
                                {/* LIKE */}
                                <div className="post_footer w-4/12">
                                    <div
                                        onMouseEnter={() =>
                                            setTimeout(() => showPlate(true, index + post?._id), 100)
                                        }
                                        onMouseLeave={() => showPlate(false, index + post?._id)}
                                    >
                                        <ReactPlate
                                            index={index + post?._id}
                                            postId={post?._id}
                                            type="post"
                                            onReturn={async (t) => {
                                                await alertLike(
                                                    post?.postOwner?._id,
                                                    _id_,
                                                    post?._id,
                                                    t
                                                );
                                                reloadData(t);
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
                                    state={{ post_id: post?._id }}
                                    className="post_footer w-4/12 justify-center"
                                    onClick={() =>
                                        localStorage.setItem("back_page", location.pathname)
                                    }
                                >
                                    <MessageSquareIcon />
                                    {formatNumber(post?.comments?.length)}
                                </Link>

                                {/* SHARE */}
                                <span className="post_footer w-4/12 justify-end">
                                    <Link to="/share" state={{ friends, post: post?._id }}>
                                        <Share2 />
                                    </Link>
                                </span>
                            </div>
                        </footer>
                    </div>
                )
            })}
        </div>
    );
};

export default Mypost;
