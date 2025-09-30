import axios from 'axios';
import { useEffect, useRef, useState, useMemo } from 'react';
import { myfriends_api, server_port } from './api';
import { useLocation, useNavigate } from 'react-router-dom';
import { formatNumber } from '../utils/formatenumber';
import { ChevronDown, ChevronUp, MessageCircle, Share2, ThumbsUp } from 'lucide-react';
import ReactPlate from "./ReactPlate";

const Clip = () => {
    const myId = localStorage.getItem('myId');
    const { index: initialIndex = 0 } = useLocation()?.state || {};
    const [clips, setClips] = useState([]);
    const [localClips, setLocalClips] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [isLocal, setIsLocal] = useState(false);
    const [actualUser, setActualUser] = useState('');
    const [friends, setFriends] = useState(null);
    const [load, setLoad] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);
    const videoRef = useRef(null);
    const navigate = useNavigate();
    const id = myId;

    // derived visibleClip list
    const visibleClip = useMemo(() => (isLocal ? localClips : clips), [isLocal, localClips, clips]);

    // fetch clips + friends
    useEffect(() => {
        const fetchClips = async () => {
            try {
                const res = await axios.get(`${server_port}/api/post/getclips/${myId}`);
                setClips(res.data?.clip || []);
            } catch (err) {
                console.error(err);
            }
        };
        fetchClips();

        const getMyFriends = async () => {
            try {
                const res = await axios.get(myfriends_api, { withCredentials: true });
                setFriends(res.data.data);
            } catch (error) {
                console.log(error);
            }
        };
        getMyFriends();
    }, [myId, load]);

    // update actual user when switching or index changes
    useEffect(() => {
        if (!isLocal && clips[currentIndex]?.postOwner?._id) {
            const ownerId = clips[currentIndex]?.postOwner?._id;
            if (ownerId !== actualUser) {
                setActualUser(ownerId);
                setLocalClips([]);
            }
        }
    }, [clips, currentIndex, isLocal]);

    // fetch local clips when actualUser changes
    useEffect(() => {
        const fetchLocalClips = async () => {
            if (!actualUser) return;
            try {
                const res_ = await axios.get(`${server_port}/api/post/getMyClips/${actualUser}`);
                setLocalClips(res_.data?.clip || []);
            } catch (err) {
                console.error(err);
            }
        };
        fetchLocalClips();
    }, [actualUser]);

    const next = () => {
        setCurrentIndex((prev) => {
            const arr = visibleClip;
            if (prev < arr.length - 1) return prev + 1;
            return prev;
        });
    };

    const prev = () => {
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : prev));
    };

    function showPlate(e) {
        const Plate = document.getElementById(`react_plate_clip${visibleClip[currentIndex]?._id}`);
        if (!Plate) return;
        if (e) {
            Plate.classList.remove("hidden");
            Plate.classList.add("flex");
        } else {
            Plate.classList.remove("flex");
            Plate.classList.add("hidden");
        }
    }

    function getTop3React(reactArray = []) {
        const reactObject = {};
        (reactArray || []).forEach((item) => {
            const type = item.type;
            reactObject[type] = (reactObject[type] || 0) + 1;
        });
        const sortedArray = Object.entries(reactObject).sort((a, b) => b[1] - a[1]);
        return sortedArray.slice(0, 3);
    }

    const myLike = visibleClip[currentIndex]?.likes?.find(item => item.user === id);

    function controlVideo() {
        if (!videoRef.current) return;
        if (isPlaying) {
            videoRef.current.pause();
            setIsPlaying(false);
        } else {
            videoRef.current.play();
            setIsPlaying(true);
        }
    }

    function telepot(post_id) {
        navigate("/commentplate", { state: { post_id } })
    }

    function share(friends, post) {
        navigate("/share", { state: { friends, post } })
    }

    function loadData() {
        // trigger reload once
        setLoad((l) => l + 1);
    }

    return (
        <div className='w-full h-screen flex items-center justify-between'>
            {/* Left side */}
            <div className='w-[50%] h-full flex items-center relative'>
                <div className='w-32 h-7 border absolute top-2 left-[50%] translate-x-[-50%] flex justify-between items-center z-50 text-white rounded-xl border-zinc-800'>
                    <span
                        className={`text-center w-full h-full p-1 capitalize cursor-pointer rounded-xl ${!isLocal ? 'text-black bg-white' : 'text-white'}`}
                        onClick={() => {
                            setIsLocal(false);
                            setCurrentIndex(0);
                        }}
                    >
                        public
                    </span>
                    <span
                        className={`text-center w-full h-full p-1 capitalize cursor-pointer rounded-xl ${isLocal ? 'text-black bg-white' : 'text-white'}`}
                        onClick={() => {
                            setIsLocal(true);
                            setCurrentIndex(0);
                            if (visibleClip[0]?.postOwner?._id) {
                                setActualUser(visibleClip[0]?.postOwner?._id);
                            }
                        }}
                    >
                        local
                    </span>
                </div>
                <video
                    src={visibleClip[currentIndex]?.media}
                    autoPlay
                    loop
                    playsInline
                    className='w-full h-full'
                    ref={videoRef}
                    onPlaying={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                ></video>
                <div
                    className='w-full h-full absolute z-10 top-0 left-0'
                    onClick={controlVideo}
                >
                    <div className='w-10 h-auto absolute top-[45%] right-0 flex flex-col gap-4'>
                        <ChevronUp
                            className='border cursor-pointer rounded-full p-1 w-7 h-7 backdrop-blur-lg bg-white/25 transition-all duration-150 hover:-translate-y-2'
                            onClick={prev}
                        />
                        <ChevronDown
                            className='border cursor-pointer rounded-full p-1 w-7 h-7 backdrop-blur-lg bg-white/25 transition-all duration-150 hover:translate-y-2'
                            onClick={next}
                        />
                    </div>
                    <div className='w-full h-auto absolute bottom-4 left-0'>
                        <div className='w-full h-auto flex justify-between items-center'>
                            <div className='flex items-center px-2'>
                                {getTop3React(visibleClip[currentIndex]?.likes)
                                    ?.map((icon, idx) => (
                                        <img
                                            src={`./assets/react_icons/${icon[0] === "love" ? "heart" : icon[0]}.png`}
                                            key={icon[0] + idx}
                                            className='w-7 h-7'
                                        />
                                    ))}
                                {visibleClip[currentIndex]?.likes?.length > 0
                                    ? formatNumber(visibleClip[currentIndex]?.likes?.length)
                                    : null}
                            </div>
                            <div>

                            </div>
                            <div className='flex items-center gap-2'>
                                {visibleClip[currentIndex]?.share?.length > 0
                                    ? "share " + formatNumber(visibleClip[currentIndex]?.share?.length)
                                    : null}
                            </div>
                        </div>
                        <div className='w-full h-10 flex items-center justify-around gap-10'>
                            <span
                                onMouseEnter={() => showPlate(true)}
                                onMouseLeave={() => showPlate(false)}
                            >
                                <ReactPlate
                                    type='post'
                                    index={"clip" + visibleClip[currentIndex]?._id}
                                    postId={visibleClip[currentIndex]?._id}
                                    color={"bg-zinc-500"}
                                    onReturn={() => { loadData() }}
                                />
                                {myLike ? (
                                    <img
                                        src={`./assets/react_icons/${myLike?.type === "love" ? "heart" : myLike?.type}.png`}
                                        className="w-8 h-8"
                                    />
                                ) : (
                                    <ThumbsUp />
                                )}
                            </span>
                            <span
                                className='cursor-pointer flex gap-1'
                                onClick={() => { telepot(visibleClip[currentIndex]?._id) }}
                            >
                                <MessageCircle />
                                {visibleClip[currentIndex]?.comments?.length > 0 ? formatNumber(visibleClip[currentIndex]?.comments?.length) : null}
                            </span>
                            <span
                                className='cursor-pointer'
                                onClick={() => { share(friends, visibleClip[currentIndex]?._id) }}
                            >
                                <Share2 />
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right side */}
            <div className='w-[50%] h-full p-2'>
                <div className='h-[12vh] flex items-center gap-2 cursor-pointer'>
                    <img
                        src={visibleClip[currentIndex]?.postOwner?.image}
                        className='w-10 h-10 md:w-14 md:h-14 rounded-full'
                    />
                    <h2>{visibleClip[currentIndex]?.postOwner?.name}</h2>
                </div>

                <div className='h-[83.5vh] w-full overflow-y-auto overflow-x-hidden grid grid-cols-4 mt-[2.7vh] gap-1 content-start'>
                    {localClips.map((clip, idx) => (
                        <div
                            key={idx}
                            className='w-full h-48 rounded-md cursor-pointer relative'
                            onClick={() => {
                                setIsLocal(true);
                                setCurrentIndex(idx);
                                setActualUser(clip?.postOwner?._id || actualUser);
                            }}
                        >
                            <video src={clip?.media} className='object-cover w-full h-full'></video>
                            <div className='w-full h-full absolute top-0 left-0 flex justify-end items-end flex-col bg-zinc-800/40'>
                                <h4 className='text-xs'>
                                    views {formatNumber(clip?.views?.counter || 0)}
                                </h4>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Clip;
