import axios from 'axios';
import { useEffect, useRef, useState, useMemo } from 'react';
import { myfriends_api, server_port } from './api';
import { useLocation, useNavigate } from 'react-router-dom';
import { formatNumber } from '../utils/formatenumber';
import { ChevronDown, ChevronUp, MessageCircle, MoveLeft, Share2, ThumbsUp } from 'lucide-react';
import ReactPlate from "./ReactPlate";
import Seemore from './Seemore';

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
    const [publicIndex, setPublicIndex] = useState(initialIndex);
    const [isBluer, setIsBluer] = useState(false);

    const videoRef = useRef(null);
    const navigate = useNavigate();
    const id = myId;

    const visibleClip = useMemo(() => (isLocal ? localClips : clips), [isLocal, localClips, clips]);

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

    // track previous id for change detection
    const prevIdRef = useRef(null);

    useEffect(() => {
        const currentId = visibleClip[currentIndex]?._id;
        if (currentId && prevIdRef.current !== currentId) {
            // when post changes
            if (!isLocal) {
                setPublicIndex(currentIndex);
            }
            prevIdRef.current = currentId;
        }
    }, [currentIndex, visibleClip, isLocal]);

    // navigation handlers
    const next = () => {
        setCurrentIndex((prev) => {
            const arr = visibleClip;
            return prev < arr.length - 1 ? prev + 1 : prev;
        });
    };

    const prev = () => {
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : prev));
    };

    // utility functions
    function showPlate(e) {
        const Plate = document.getElementById(`react_plate_clip${visibleClip[currentIndex]?._id}`);
        if (!Plate) return;
        Plate.classList.toggle("hidden", !e);
        Plate.classList.toggle("flex", e);
    }

    function getTop3React(reactArray = []) {
        const reactObject = {};
        (reactArray || []).forEach((item) => {
            const type = item.type;
            reactObject[type] = (reactObject[type] || 0) + 1;
        });
        return Object.entries(reactObject).sort((a, b) => b[1] - a[1]).slice(0, 3);
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
        setLoad((l) => l + 1);
    }

    function viewProfile() {
        navigate("/publicprofile", { state: { id: visibleClip[currentIndex]?.postOwner?._id } })
    }

    let isCountted = false;
    const width = window.innerWidth;
    const [isLocalClips, setIsLocalClips] = useState(false);

    const clipsContainerRef = useRef(null);

    function handleclipcontainer(e) {
        if (clipsContainerRef.current) {
            if (e) {
                clipsContainerRef.current.classList.remove("translate-x-full");
                clipsContainerRef.current.classList.add("translate-x-0");
            } else {
                clipsContainerRef.current.classList.remove("translate-x-0");
                clipsContainerRef.current.classList.add("translate-x-full");
            }
        }
    }



    async function addView(id, user, isClip = true) {
        await axios.post(server_port + "/api/post/countView", { id, user, isClip });
    }

    return (
        <div className='w-full h-screen flex items-center justify-between relative'>
            <div className='w-full md:w-[50%] h-full flex items-center relative'>
                <MoveLeft
                    className='cursor-pointer absolute top-1 left-2 z-40'
                    onClick={() => { navigate("/") }}
                />
                <div className='w-32 h-7 border absolute top-2 left-[50%] translate-x-[-50%] flex justify-between items-center z-50 text-white rounded-xl border-zinc-800'>
                    <span
                        className={`text-center w-full h-full p-1 capitalize cursor-pointer rounded-xl ${!isLocal ? 'text-black bg-white' : 'text-white'}`}
                        onClick={() => {
                            setIsLocal(false);
                            setCurrentIndex(publicIndex);
                            if (width < 769) {
                                handleclipcontainer(false);
                            }
                        }}
                    >
                        public
                    </span>
                    <span
                        className={`text-center w-full h-full p-1 capitalize cursor-pointer rounded-xl ${isLocal ? 'text-black bg-white' : 'text-white'}`}
                        onClick={() => {
                            setIsLocal(true);
                            if (localClips[0]?.postOwner?._id) {
                                setActualUser(localClips[0]?.postOwner?._id);
                            }
                            setCurrentIndex(0);
                            if (width < 769) {
                                handleclipcontainer(true);
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
                    onTimeUpdate={(e) => {
                        let duration = Math.round(e.currentTarget.duration / 2),
                            currentTime = Math.round(e.currentTarget.currentTime);
                        if (currentTime >= duration && !isCountted) {
                            addView(visibleClip[currentIndex]?._id, myId);
                            isCountted = true;
                        }
                    }}
                ></video>

                <div
                    className='w-full h-full absolute z-10 top-0 left-0'
                    onClick={controlVideo}
                >
                    <div className={`w-full absolute max-h-72 p-2 ${isBluer ? 'backdrop-blur-md' : ''} z-50 bottom-24 overflow-y-auto`}>
                        <Seemore text={visibleClip[currentIndex]?.caption} range={200} onReturn={(e) => { setIsBluer(e) }} />
                    </div>
                    <div className='w-10 h-auto absolute top-[45%] right-0 flex flex-col gap-4'>
                        <ChevronUp onClick={prev} className='border cursor-pointer rounded-full p-1 w-7 h-7 backdrop-blur-lg bg-white/25' />
                        <ChevronDown onClick={next} className='border cursor-pointer rounded-full p-1 w-7 h-7 backdrop-blur-lg bg-white/25' />
                    </div>
                    <div className='w-full h-auto absolute bottom-4 left-0'>
                        <div className='w-full h-auto flex justify-between items-center'>
                            <div
                                className='flex items-center px-2 cursor-pointer'
                                onClick={() => { navigate("/allreacts", { state: { postId: visibleClip[currentIndex]?._id } }) }}
                            >
                                {getTop3React(visibleClip[currentIndex]?.likes)?.map((icon, idx) => (
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
                            <div></div>
                            <div className='flex items-center gap-2'>
                                {visibleClip[currentIndex]?.share?.length > 0
                                    ? "share " + formatNumber(visibleClip[currentIndex]?.share?.length)
                                    : null}
                            </div>
                        </div>
                        <div className='w-full h-10 flex items-center justify-around gap-10'>
                            <span onMouseEnter={() => showPlate(true)} onMouseLeave={() => showPlate(false)}>
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
                            <span className='cursor-pointer flex gap-1' onClick={() => telepot(visibleClip[currentIndex]?._id)}>
                                <MessageCircle />
                                {visibleClip[currentIndex]?.comments?.length > 0
                                    ? formatNumber(visibleClip[currentIndex]?.comments?.length)
                                    : null}
                            </span>
                            <span className='cursor-pointer' onClick={() => share(friends, visibleClip[currentIndex]?._id)}>
                                <Share2 />
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div
                className={`w-full md:w-[50%] h-auto p-2 absolute md:static top-0 z-20 transform transition-transform duration-300 translate-x-full md:translate-x-0`}
                onClick={() => { if (width < 769) { setIsLocalClips(isLocalClips ? false : true) } }}
                ref={clipsContainerRef}
            >
                <div className='h-[12vh] flex items-center gap-2 cursor-pointer'
                    onClick={viewProfile}
                >
                    <img src={visibleClip[currentIndex]?.postOwner?.image} className='w-10 h-10 md:w-14 md:h-14 rounded-full' />
                    <h2>{visibleClip[currentIndex]?.postOwner?.name}</h2>
                </div>

                <div className='h-[83.5vh] w-full overflow-y-auto grid grid-cols-4 mt-[2.7vh] gap-1 content-start bg-zinc-950'>
                    {localClips.map((clip, idx) => (
                        <div
                            key={idx}
                            className='w-full h-48 rounded-md cursor-pointer relative'
                            onClick={() => {
                                setIsLocal(true);
                                setCurrentIndex(idx);
                                setActualUser(clip?.postOwner?._id || actualUser);
                                if (width < 769) {
                                    handleclipcontainer(false);
                                }
                            }}
                        >
                            <video
                                src={clip?.media}
                                className='object-cover w-full h-full'
                            ></video>
                            <div className='w-full h-full absolute top-0 left-0 flex justify-end items-end flex-col bg-zinc-800/40'>
                                <h4 className='text-xs'>views {formatNumber(clip?.views?.length || 0)}</h4>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Clip;
