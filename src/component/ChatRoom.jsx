import React, { useEffect, useState, useRef } from 'react';
import { myfriends_api, server_port } from './api';
import { ArrowLeft, Rocket, Reply, Ellipsis, Trash, RemoveFormatting, X, Settings, ArrowUp, FolderUp, ArrowDown, ShieldBan, Video, Phone, UserMinus, UserPlus, Plus, MoveRight, LogOut } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import axios from "axios";
import socket from './socket';
import ToggleBtn from './ToggleBtn';
import color from "./color";
import Navbar from './Navbar';
import ShortText from "./ShortText";
import { Link } from "react-router-dom";
import { __callId__ } from "./api"
import { active } from "../utils/utils";
import { chatbgImage } from "../utils/chatbg";
import VoiceButton from './Vioce';
import Animation from './Animation';
import Emoji from './Emoji';
import { toast, ToastContainer } from "react-toastify";
import LoaderContainer from "./LoaderContainer";

const ChatRoom = () => {

    const [safarateUserState, setSafarateUser] = useState("");
    const navigate = useNavigate();
    const [message, setMessage] = useState('');
    const [friends, setFriends] = useState([]);
    const [groups, setGroups] = useState([]);
    const [chats, setChat] = useState([]);
    const [load, setLoad] = useState(0);
    const [replay, setRplay] = useState("");
    const [isReplay, setIsRplay] = useState(false);
    const [repId, setRepId] = useState(null);
    const [media, setMedia] = useState(undefined);
    const [fileUrl, setFileUrl] = useState(null);
    const [scrollDown, setScrollDown] = useState(null);
    const [inputText, setInputText] = useState("");
    const [groupName, setGroupName] = useState("");
    const [isCreatingGroup, setCreatingroup] = useState(false);
    const [isCahtTab, setIsChatTap] = useState(false);
    const [endLoad, setLoadEnd] = useState(true);
    const [isUploading, setIsUploading] = useState(false);

    const inputRef = useRef();
    const focus = () => { inputRef.current.focus() };

    async function myData_() {
        const res = await axios.get(server_port + "/api/people/userData", { withCredentials: true });
        localStorage.setItem("myId", res?.data?.data?._id);
        localStorage.setItem("myImage", res?.data?.data?.image);
        localStorage.setItem("myName", res?.data?.data?.name);
    }

    useEffect(() => {
        socket.emit("__load_data__");
        const containerHeigh = document.getElementById("chat_container");
        containerHeigh.onscroll = () => {
            containerHeigh.scrollTop === 0 ? setScrollDown(true) : setScrollDown(false);
        }
        myData_();
        get_chats(localStorage.getItem("userId"), localStorage.getItem("myId"));
        active();
        window.onscroll = () => { socket.emit("__load_data__"); }
    }, []);

    window.onload = () => { myData_(); }

    async function get_my_friends() {
        try {
            const res = await axios.get(myfriends_api, { withCredentials: true });
            setFriends(res?.data?.data);
        } catch (error) {
            console.log(error);
        }
    }

    async function get_my_groups() {
        try {
            const res = await axios.get(server_port + "/api/group/myGroup/" + localStorage.getItem("myId"));
            setGroups(res?.data?.groups?.groups)
        } catch (error) {
            console.log(error);
        }
    }

    useEffect(() => {
        get_my_groups();
        get_my_friends();
        setInputText(isReplay ? "write you'r replay text" : "write message...!");
    }, [load, isReplay]);

    useEffect(() => {
        const reciveMessage = (e) => {
            get_chats(localStorage.getItem("userId"), localStorage.getItem("myId"));
        }
        socket.on("aftersent", reciveMessage);
        return () => { socket.off("aftersent", reciveMessage) }
    }, [])

    useEffect(() => {
        const greceiveMessage = (e) => {
            get_group_chats(localStorage.getItem("groupId"));
        }
        socket.on("gaftersent", greceiveMessage)
        return () => { socket.off("gaftersent", greceiveMessage) }
    }, [])

    useEffect(() => {
        const handelBlock = (e) => {
            toast.error(e);
            setTimeout(() => { window.location.reload() }, 2020);
        }
        socket.on("block_user", handelBlock);
        return () => { socket.off("block_user", handelBlock) }
    }, [])

    useEffect(() => {
        const handleIncomingCall = (data) => {

            if (data.userId === localStorage.getItem("myId")) {
                navigate("/v", { state: { callId: data.callId } });
            };
        }
        socket.on("____incoming_call____", handleIncomingCall);
        return () => {
            socket.off("____incoming_call____", handleIncomingCall);
        };
    }, []);

    useEffect(() => {
        const handleIncomingCall = (data) => {
            if (data.userId === localStorage.getItem("myId")) {
                navigate("/audiocall", { state: { callId: data.callId, userId: data.userId, role: "receiver", info: data.info } });
            }
        }

        socket.on("incoming_call_a", handleIncomingCall);
        return () => {
            socket.off("incoming_call_a", handleIncomingCall);
        }
    }, []);

    async function isMatchGroup(id) {
        const res = await axios.get(server_port + `/api/group/isMatchGroup/${id}/${localStorage.getItem("myId")}`);
        return res.data?.isMatch;
    }

    useEffect(() => {
        const handelRoom = async (data) => {

            const isMatch = await isMatchGroup(data);
            if (isMatch) {
                navigate("/groupvideocall", { state: { callId: data, role: "receiver" } });
            }
        }

        socket.on("join_room", handelRoom);
        return () => {
            socket.off("join_room", handelRoom);
        }
    }, [])

    async function get_chats(riciver, sender) {
        await axios.post(server_port + "/api/people/getChat", { riciver, sender })
            .then(res => {
                setChat(res?.data?.data);
                setTimeout(() => {
                    setLoadEnd(true);

                    setTimeout(() => {
                        goToBottom();
                    }, 120)
                }, 300);
            })
    }

    useEffect(() => {
        get_chats(localStorage.getItem("userId"), localStorage.getItem("myId"));
    }, [load, safarateUserState]);

    useEffect(() => {
        const handleReceiveMessage = (data) => {
            get_chats(localStorage.getItem("userId"), localStorage.getItem("myId"));
            const notifications = document.getElementById("notifications");
            if (notifications) {
                notifications?.play();
            }
            setTimeout(() => {
                try {
                    const chat_container = document.getElementById("chat_container");
                    chat_container.scrollTo({ top: chat_container.scrollHeight, behavior: "smooth" })
                } catch (err) {
                    console.log(err);
                }
            }, 400);
        };
        socket.on('receive_message', handleReceiveMessage);
        return () => {
            socket.off('receive_message', handleReceiveMessage);
        };
    }, [load]);

    useEffect(() => {
        if (isCahtTab === true) {
            get_chats(localStorage.getItem("userId"), localStorage.getItem("myId"));
        } else {
            get_group_chats(localStorage.getItem("groupId"));
        }
        getOurDesign(localStorage.getItem("myId"), localStorage.getItem("userId"));
    }, [load])


    function goToBottom() {
        const chat_container = document.getElementById("chat_container");
        chat_container.scrollTo({ top: chat_container.scrollHeight, behavior: "smooth" })
    }

    const getTime = () => {
        const time = new Date();
        const actual_time = time.toLocaleTimeString();
        const date = time.toDateString();
        return { actual_time, date };
    }

    const [ourDesign, setOurDesign] = useState({
        styles: {
            text: {
                color: null,
                family: null,
                italic: false
            },
            bg: {
                bgType: null,
                bg: null
            }
        }
    });

    async function getOurDesign(myId, _userId_) {

        try {
            const res = await axios.get(server_port + `/api/friend/ourstyle/${myId}/${_userId_}`);
            setOurDesign(res?.data?.design)
        } catch (err) {
            console.log(err);
        }
    };


    function getMediaType(___media___, file) {
        const type_ = ___media___.type;
        const type = type_.startsWith("image/") ? "image" : type_.startsWith("audio/") ? "audio" : type_.startsWith("video/") ? "video" : null;
        const fd = new FormData();
        fd.append(type, ___media___);
        return file === true ? fd : type;
    }

    async function handelMedia() {
        try {
            setIsUploading(true);
            const dateTime = getTime();
            const realtime = dateTime.date + " " + dateTime.actual_time;
            const receiver = localStorage.getItem("userId");
            const sender = localStorage.getItem("myId");
            const mtype = getMediaType(media, false);
            const fd = new FormData();
            fd.append("senderId", sender);
            fd.append(mtype, media);
            fd.append("recevireId", receiver);
            fd.append("time", realtime);
            fd.append("type", mtype);
            axios.post(server_port + `/api/chat/${mtype === "video" ? "upload-video" : "upload"}`, fd).then(res => {
                setIsUploading(false);
                toast.success("uploaded");
                socket.emit("aftersent", null);

                setTimeout(() => {
                    get_chats(localStorage.getItem("userId"), localStorage.getItem("myId"));
                }, 100);
            })
            setMedia(undefined);
            setFileUrl(null);


        } catch (error) {
            console.log(error)
        }
    }


    function sendMessage() {
        const dateTime = getTime();
        const realtime = dateTime.date + " " + dateTime.actual_time;
        if (message.trim()) {
            const riciver = localStorage.getItem("userId");
            const sender = localStorage.getItem("myId");
            const data = { riciver, sender, message, realtime };
            setTimeout(() => {
                socket.emit('send_message', data);
                get_chats(localStorage.getItem("userId"), localStorage.getItem("myId"));
            }, 300);
            setMessage('');
        }

        if (media) {
            handelMedia();
        }
    };

    function deleteMessage(chatId) {
        axios.post(server_port + "/api/chat/delete", { chatId });
        socket.emit("__load_data__")
    }

    function unsentMessage(chatId) {
        axios.post(server_port + "/api/chat/unsent", { chatId });
        socket.emit("__load_data__");
    }

    function replayMessage(chatId) {
        const dateTime = getTime();
        const time = dateTime.date + " " + dateTime.actual_time;
        axios.post(server_port + "/api/chat/replaychat",
            { recevireId: localStorage.getItem("userId"), senderId: localStorage.getItem("myId"), time, user: localStorage.getItem("myId"), chatId, replay: message })
        socket.emit("__load_data__");
        setIsRplay(false);
        setLoad(load + 1);
    }

    const sender = localStorage.getItem("myId");
    const [showSetting, setShowSetting] = useState(false);

    const [isItalic, setIsItalic] = useState(localStorage.getItem("______isItalic"));

    function doMessageTextItalic() {
        const myId = sender;
        const myfriendId = localStorage.getItem("userId");
        axios.post(server_port + "/api/friend/doMessageItalic", { isToggleForBase: isItalic === true || isItalic === "true" ? false : true, myId, myfriendId }).then(res => {
            localStorage.setItem("______isItalic", res?.data?.isItalic);
            setIsItalic(res?.data?.isItalic);
        });
        setLoad(load + 1);
    };

    function doChangeTextColor(mycolor) {
        try {
            const myId = sender;
            const myFriendId = localStorage.getItem("userId");
            const colorNameArray = mycolor.split("-");
            colorNameArray[0] = "text";
            const color = colorNameArray.join("-");
            axios.post(server_port + "/api/friend/doFontColorChange", { color, myId, myFriendId });
            setLoad(load + 1);
        } catch (err) {
            console.log(err)
        }
    }

    function doChangeBgColor(bgColor, bgImage, bgType) {
        const myId = sender;
        const myFriendId = localStorage.getItem("userId");
        axios.post(server_port + "/api/friend/doChatBgChange", { bgColor, bgImage, bgType, myId, myFriendId });
        setLoad(load + 1);
    }

    function doChangeFontFamily(family) {
        const myId = localStorage.getItem("myId");
        const myFriendId = localStorage.getItem("userId");
        axios.post(server_port + "/api/friend/doFontFamilyChange", { family, myId, myFriendId });
        setLoad(load + 6);
    }

    const fontFamilyArray = [
        "font-sans",
        "font-serif",
        "font-mono",
        "font-inter",
        "font-roboto",
        "font-poppins",
        "font-open-sans",
        "font-lato",
        "font-ubuntu",
        "font-josefin",
        "font-raleway"];

    const [isBar, setIsBar] = useState(true);

    async function safarateUser(id) {
        const res = await axios.get(server_port + "/api/people/friendData/" + id);
        setSafarateUser(res.data.user);
        localStorage.setItem("userImage", res?.data?.user?.image)
        localStorage.setItem("userName", res?.data?.user?.name)
    }

    function hiddenReplayPlate(index) {
        const thisMessage = document.getElementById(`message${index}`);
        if (!thisMessage.classList.contains("hidden")) {
            thisMessage.classList.remove("flex");
            thisMessage.classList.add("hidden");
        }
    }

    function blockUser(key) {
        const friendId = localStorage.getItem("userId"), myId = localStorage.getItem("myId");
        axios.post(server_port + "/api/friend/" + key, { friendId, myId })
        socket.emit("block_user", localStorage.getItem("myName") + " " + key + " you");
        get_chats(localStorage.getItem("userId"), localStorage.getItem("myId"));
        getOurDesign(localStorage.getItem("myId"), localStorage.getItem("userId"));

    }

    function createGroup() {
        const myId = localStorage.getItem("myId");
        const dateTime = getTime();
        const firstuser = [localStorage.getItem("myId"), localStorage.getItem("userId")]
        const realTime = dateTime.date + " " + dateTime.actual_time;
        axios.post(server_port + "/api/group/create", { myId, realTime, groupName, firstuser });
        setGroupName("");
    }

    const [groupChats, setGroupChat] = useState([]);

    async function get_group_chats(id) {
        await axios.get(server_port + "/api/gchat/getchat/" + id).then(res => {
            setGroupChat(res.data.chats);
            setLoadEnd(true);
            setTimeout(() => {
                goToBottom();
            }, 100)
        })

    }

    function uploadmediaInGroup(group, file) {
        const type = getMediaType(file, false);
        const dateTime = getTime();
        const realTime = dateTime.date + " " + dateTime.actual_time;
        const fd = new FormData();
        setIsUploading(true);
        fd.append(`${type}`, media);
        fd.append("group", group);
        fd.append("messageType", type);
        fd.append("sender", localStorage.getItem("myId"));
        fd.append("realTime", realTime);
        axios.post(server_port + "/api/gchat/createmedia", fd).then(res => {
            socket.emit("gmessage", null);
            setIsUploading(false);
            toast.success("uploaded");
            get_group_chats(localStorage.getItem("groupId"));
        });
        setMedia(undefined);
        setFileUrl(null);
    }

    function sendMsaageInGroup(group) {
        if (media) {
            uploadmediaInGroup(group, media);
            return;
        }

        const dateTime = getTime();
        const realTime = dateTime.date + " " + dateTime.actual_time;
        axios.post(server_port + "/api/gchat/createtext", { group, messageType: "text", sender: localStorage.getItem("myId"), content: message, realTime }).then(res => {
            socket.emit("gmessage", null);
        })
        setMessage("");
        get_group_chats(localStorage.getItem("groupId"));
    }

    useEffect(() => {
        const handelGroupChat = (e) => {
            get_group_chats(localStorage.getItem("groupId"));
        }

        socket.on("gmessage", handelGroupChat);
        return () => { socket.off("gmessage", handelGroupChat) }
    }, [])

    useEffect(() => {
        if (isCahtTab === false) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        axios.post(server_port + "/api/gchat/seenby", { messageId: entry?.target?.id, userId: localStorage.getItem("myId") });
                        observer.unobserve(entry.target);
                        setTimeout(() => {
                            socket.emit("__load_data__");
                        }, 100);

                    }
                });
            });

            const messageElements = document.querySelectorAll(".chat");
            messageElements.forEach((el) => observer.observe(el));

            return () => observer.disconnect();
        }
    }, [load]);

    function topToBottom() {
        const chat_container = document.getElementById("chat_container");
        chat_container.scrollTo({ top: chat_container.scrollHeight, behavior: "smooth" });
    }

    const [isMenu, setIsMenu] = useState(false);
    const [gChatId, setGChatId] = useState(null);
    const [messageWoner, setMesageWoner] = useState(null);
    const [GCR, setGCR] = useState(false);
    const [msgText, setMsgText] = useState("");
    const [msgWonerImage, setMsgWonerImage] = useState("");
    const [groupDesign, setGroupDesign] = useState("");

    function deleteGMesage(message) {
        axios.post(server_port + "/api/gchat/deleteMessage", { group: localStorage.getItem("groupId"), message });
        setTimeout(() => {
            socket.emit("__load_data__");
        }, 70)
    }

    function replayGChat(rtext, mtext, image) {
        const dateTime = getTime();
        const realTime = dateTime.date + " " + dateTime.actual_time;
        axios.post(server_port + "/api/gchat/reply", { rtext, messageType: "reply", sender, image, mtext, realTime, group: localStorage.getItem("groupId") });
        setIsRplay(false);
        setMessage("");
        setTimeout(() => {
            socket.emit("__load_data__");
        }, 70)
    };

    function changeBgGroup(bgColor, bgImage, bgType) {
        axios.post(server_port + "/api/group/changebg", { bgColor, bgImage, bgType, group: localStorage.getItem("groupId") });
    }

    async function vioceHandeler(e) {
        setIsUploading(true);
        const dateTime = getTime();
        const realTime = dateTime.date + " " + dateTime.actual_time;
        let formData = new FormData();
        const sender = localStorage.getItem("myId"), riciver = localStorage.getItem("userId");
        const url = server_port + `/api/${isCahtTab ? "chat/upload" : "gchat/createmedia"}`
        formData.append("audio", e, "voice.mp3");

        if (!isCahtTab) {
            formData.append("group", localStorage.getItem("groupId"));
            formData.append("messageType", "audio");
            formData.append("sender", sender);
            formData.append("realTime", realTime);
        }
        formData.append("time", realTime);
        formData.append("senderId", sender)
        formData.append("recevireId", riciver)
        await axios.post(url, formData).then(res => {
            setTimeout(() => {
                setIsUploading(false);
                if (isCahtTab === true) {
                    socket.emit("aftersent", null);
                } else {
                    socket.emit("gaftersent", null);
                    get_group_chats(localStorage.getItem("groupId"));
                }
                get_chats(localStorage.getItem("userId"), localStorage.getItem("myId"));
            }, 100)
        });
    }

    useEffect(() => {
        const handleKeyUp = (e) => {
            e.preventDefault();
            if (e.key === "Enter") {
                const el = document.getElementById("rocketsender");
                if (el) {
                    el.click();
                    setMessage("");
                    setRplay("");
                }
            }
        };
        window.addEventListener("mouseup", () => { setRecording(false) })
        window.addEventListener("keyup", handleKeyUp);
        return () => {
            window.removeEventListener("keyup", handleKeyUp);
            window.removeEventListener("mouseup", () => { setRecording(false) })
        };
    }, []);

    const [isRecording, setRecording] = useState(false);

    const [groupImage, setGroupImage] = useState(null);
    const [gname, setGname] = useState(false);
    const [pgname, setPGname] = useState("");

    async function changeGroupImage() {
        const fd = new FormData();
        fd.append("img", groupImage)
        await axios.post(server_port + "/api/group/changeImage/" + localStorage.getItem("groupId"), fd).then(res => localStorage.setItem("userImage", res?.data?.img))
        setGroupImage(null)
        setLoad(load + 2)
    }

    async function changeGeroupName() {
        await axios.post(server_port + "/api/group/changeName", { groupName: pgname, groupId: localStorage.getItem("groupId") }).then(res => localStorage.setItem("userName", res?.data?.name));
        setGname(false);
        setLoad(load + 1);
        setPGname("")
    }

    async function leftfromgroup() {
        await axios.post(server_port + "/api/people/leftfromgroup", { user: localStorage.getItem("myId"), group: localStorage.getItem("groupId") });
        setLoad(load + 1);
    }

    function handelEmogi(e) {
        setMessage(prev => prev + e);
    }

    useEffect(() => {
        const groupvideoCall = (e) => {
            localStorage.setItem("groom", e);
            navigate("/groupcallvideo");
        }
        socket.on("groupvideocall", groupvideoCall);
        return () => socket.off("groupvideocall", groupvideoCall);
    }, []);

    return (
        <div className='sm:flex h-screen overflow-y-auto'>
            <ToastContainer
                position="top-right"
                autoClose={1000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
            />

            <span className={`sm:hidden sticky top-0 ${!isBar ? "hidden" : ""}`}><Navbar /></span>
            <div className={`flex flex-col sm:w-3/12 lg:block overflow-y-auto h-[91.4%] sm:h-screen  ${isBar ? "" : "hidden"}`}>
                <div className={`w-full h-auto text-white`} >{friends?.map((data, index) => (
                    <div onClick={() => {
                        localStorage.setItem("userId", data?._id);
                        myData_();
                        safarateUser(data?._id);
                        setLoad(load + 1);
                        getOurDesign(localStorage.getItem("myId"), localStorage.getItem("userId"));
                        doChangeTextColor();
                        get_chats(localStorage.getItem("userId"), localStorage.getItem("myId"));
                        setIsBar(false);
                        setIsChatTap(true)
                        setLoadEnd(false);
                    }}
                        className='flex justify-between items-center cursor-pointer my-3 hover:bg-gray-800 p-2' key={index}>

                        <div className='flex w-full items-center gap-2'>
                            <img className='w-12 h-12 rounded-full' src={data?.image} />
                            <div>
                                <h6 className='text-xs py-1 text-gray-600'>your friend</h6>
                                <h4 className='text-sm'>{data?.name}</h4>
                            </div>
                        </div>
                        <div className='flex justify-center items-center w-[15%] '>{data?.isActive ? <span className='w-3 h-3 rounded-full bg-green-500 inline-block'></span> : null}</div>
                    </div>
                ))}
                </div>

                <div className={`${groups?.length <= 0 ? "hidden" : ""}`}>
                    <hr />
                    <h5 className='my-1 mb-4'>Groups</h5>
                    {groups?.map((data, index) => (
                        <div key={index} className='cursor-pointer' onClick={() => {
                            localStorage.setItem("userImage", data?.groupImage);
                            localStorage.setItem("userName", data?.name);
                            localStorage.setItem("groupId", data?._id);
                            setLoad(load + 1);
                            get_group_chats(data?._id);
                            setIsChatTap(false);
                            setGroupDesign(data?.style);
                            localStorage.setItem("admin", data?.admin);
                            setIsBar(false);
                            setLoadEnd(false);
                        }}>
                            <div className='flex justify-start items-center gap-4 hover:bg-gray-800 p-2'>
                                <img className='w-12 h-12 rounded-full' src={data?.groupImage.includes("group.png") ? server_port + "/" + data?.groupImage : data?.groupImage} />
                                <h3>{data?.name}</h3>
                            </div>

                        </div>
                    ))}
                </div>
            </div>

            <div className={`w-full h-full bg-purple-800 justify-center hidden items-center ${isBar ? "sm:flex" : "hidden"}`}>
                <h1>select one</h1>
            </div>

            <div className={`w-full h-full relative overflow-x-hidden text-white ${!isBar ? "" : "hidden"}`}>

                <div id='ourSettings' className={`w-full sm:w-10/12 h-[90vh] border fixed backdrop-blur-sm z-50 duration-500 ${showSetting && isCahtTab ? "ml-0" : "ml-[100%]"} overflow-y-auto`}>
                    <div className='sticky top-0 left-0 w-full h-auto backdrop-blur-3xl' onClick={() => { setShowSetting(false) }}>
                        <X />
                    </div>
                    <div className='w-full sm:w-11/12 h-auto flex flex-col gap-5 px-5 my-5'>
                        <span className='flex justify-between w-full items-center'>
                            <span>message text italic</span>
                            <span onClick={() => { doMessageTextItalic(); setLoad(load + 1); }} ><ToggleBtn condition={isItalic === true || isItalic === "true" ? true : false} /></span>
                        </span>
                        <div>
                            <span className='capitalize'>chat background color</span>
                            <hr className='my-4' />
                            <div className={`w-full h-52 overflow-x-auto flex`}>{color?.map((colors, index) => (
                                <div key={index} className={`w-full h-40 my-3 mx-2 rounded-lg ${colors}`}
                                    onClick={() => { doChangeBgColor(colors, null, "color") }}
                                >
                                    <div className={`w-52 h-full`}></div>
                                </div>
                            ))}</div>

                            <div className={`w-full h-52 overflow-x-auto flex`}>
                                {chatbgImage?.map((img, index) => (
                                    <img key={index} src={img} className='w-4/12 h-full rounded-xl' onClick={() => { doChangeBgColor(null, img, "image") }} />
                                ))}
                            </div>
                        </div>
                        <span>font-family</span>
                        <hr className='my-1' />
                        <div className='flex justify-start items-center gap-4 w-full flex-wrap'>{fontFamilyArray?.map((family, index) => (
                            <span
                                key={index}
                                onClick={() => {
                                    doChangeFontFamily(family);
                                    setShowSetting(false);
                                }}
                                className='px-2 flex justify-center items-center bg-slate-700 border rounded-xl cursor-pointer'>{family}</span>
                        ))}</div>
                        <div>
                            <span className='capitalize'>text color</span>
                            <hr className='my-4' />
                            <div className={`w-full h-52 overflow-x-auto flex`}>{color?.map((colors, index) => (
                                <div key={index} className={`w-full h-40 my-3 mx-2 rounded-lg ${colors}`}
                                    onClick={() => { doChangeTextColor(colors); setShowSetting(false) }}>
                                    <div className={`w-52 h-full`}></div>
                                </div>
                            ))}</div>
                        </div>
                    </div>
                    <div onClick={() => { blockUser(ourDesign?.block?.isBlock == true && ourDesign?.block?.blocker == localStorage.getItem("myId") ? "unblock" : "block") }} className={`${ourDesign?.block?.blocker == localStorage.getItem("myId") ? "" : ourDesign?.block?.blocker == null ? "" : "hidden"} bg-blue-500 cursor-pointer`}>
                        {ourDesign?.block?.isBlock == true && ourDesign?.block?.blocker == localStorage.getItem("myId") ? "unblock" : "block"}
                    </div>


                    <div className='flex justify-start gap-4 items-center w-[80%]'>
                        <div className='flex flex-col justify-center items-center cursor-pointer bg-emerald-600' onClick={() => { setCreatingroup(true) }}>
                            <UserPlus />
                            <span className='text-xs'>create group</span>
                        </div>
                        <div className={`${isCreatingGroup == true ? "flex" : "hidden"} justify-start gap-4 items-center`}>
                            <input className='w-[50%]' type="text" value={groupName} onChange={(e) => { setGroupName(e.target.value) }} placeholder='group name' />
                            <button onClick={() => { createGroup(); setCreatingroup(false) }}>create</button>
                            <X className='duration-200 hover:text-red-500 cursor-pointer' onClick={() => { setCreatingroup(false) }} />
                        </div>
                    </div>

                </div>


                <div id='groupSettings' className={`w-full sm:w-10/12 h-[90vh] border fixed backdrop-blur-sm z-50 duration-500 ${showSetting && !isCahtTab ? "ml-0" : "ml-[100%]"} overflow-y-auto`}>
                    <div className='sticky top-0 left-0 w-full h-auto backdrop-blur-3xl' onClick={() => { setShowSetting(false) }}>
                        <X />
                    </div>

                    <div>
                        <span className='capitalize'>chat background color</span>
                        <hr className='my-4' />
                        <div className={`w-full h-52 overflow-x-auto flex`}>{color?.map((colors, index) => (
                            <div key={index} className={`w-full h-40 my-3 mx-2 rounded-lg ${colors}`}
                                onClick={() => { changeBgGroup(colors, null, "color") }}
                            >
                                <div className={`w-52 h-full`}></div>
                            </div>
                        ))}</div>

                        <div className={`w-full h-52 overflow-x-auto flex`}>
                            {chatbgImage?.map((img, index) => (
                                <img key={index} src={img} className='w-4/12 h-full rounded-xl' onClick={() => { changeBgGroup(null, img, "image") }} />
                            ))}
                        </div>
                        <h5 className='my-2'>change group information</h5>

                        <div className='flex justify-start items-center w-full'>
                            <div className='flex justify-start items-center gap-5'>
                                <div className='w-12 h-12 relative rounded-xl flex justify-center items-center'>
                                    <input type="file" className='absolute w-full h-full bg-slate-800 z-50 opacity-0' onChange={(e) => { setGroupImage(e.target.files[0]) }} />
                                    <Plus className='absolute z-10' />
                                    <img src={localStorage.getItem("userImage")} className='absolute w-full h-full rounded-xl' />
                                </div>
                                <div className={`${groupImage ? "" : "hidden"} flex items-center gap-5`}>
                                    <button onClick={changeGroupImage} >update</button>
                                    <X className='w-10 text-red-500 cursor-pointer' onClick={(() => { setGroupImage(null) })} />
                                </div>
                                <h4>{localStorage.getItem("userName")}</h4>
                            </div>
                            <div className='flex items-center'>
                                <Ellipsis className='w-10 pt-1 cursor-pointer' onClick={(() => { setGname(true) })} />
                                <div className={`${gname ? "flex" : "hidden"} justify-start items-center gap-5 px-2`}>
                                    <input type="text" placeholder='type group name' value={pgname} onChange={(e) => { setPGname(e.target.value) }} />
                                    <button onClick={(() => { changeGeroupName() })} >update</button>
                                    <X className='w-10 text-red-500 cursor-pointer' onClick={(() => { setGname(false); setPGname("") })} />
                                </div>
                            </div>
                            <div onClick={() => { leftfromgroup() }} className='cursor-pointer'>
                                <LogOut />
                            </div>
                            <div className={`${localStorage.getItem("admin") === localStorage.getItem("myId") ? "" : "hidden"}`}>
                                <Link to={"/removeuser"}>
                                    <UserMinus />
                                </Link>
                            </div>
                        </div>

                    </div>
                </div>

                <div className={`w-full h-[90vh] relative`} >

                    <div className={`${isRecording ? "" : "hidden"}`}>
                        <Animation />
                    </div>
                    <div className={`w-full h-full ${isCahtTab ? ourDesign?.styles?.bg?.bgType == "color" ? ourDesign?.styles?.bg?.bg : "" : groupDesign?.background?.bgType == "color" ? groupDesign?.background?.bgDesign : ""}`}>

                        {isCahtTab ? ourDesign?.styles?.bg?.bgType == "image" ? <img src={ourDesign?.styles?.bg?.bg} className='w-full h-full' /> : "" : groupDesign?.background?.bgType == "image" ? <img className='w-full h-full' src={groupDesign?.background?.bgDesign} /> : ""}
                    </div>

                    <div className={`w-full h-full z-10 absolute overflow-y-auto top-0 p-2 scroll-smooth`} id='chat_container'>
                        <LoaderContainer type={"load"} loadEnd={endLoad} />
                        <span className={`${isUploading ? "" : "hidden"} fixed top-16 mt-1 right-7 z-30 w-32 h-7`}>
                            <LoaderContainer type={"upload"} loadEnd={isUploading ? false : true} />
                        </span>
                        <div className='w-full flex items-center p-2 bg-indigo-950 rounded-lg justify-between sticky top-0 z-20'>
                            <ArrowLeft className='lg:hidden' onClick={() => { setIsBar(true) }} />
                            <div className='flex items-center justify-start gap-4'>
                                <img className='rounded-full w-10 h-10' src={localStorage.getItem("userImage").includes("group.png") ? server_port + "/" + localStorage.getItem("userImage") : localStorage.getItem("userImage")} alt="" />
                                <h1 className='text-center my-2'>{localStorage.getItem("userName")}</h1>
                            </div>
                            <div className='flex gap-5'>
                                <Link to={isCahtTab ? "/v" : "/groupvideocall"} state={isCahtTab ? { userId: localStorage.getItem("userId"), isDail: true, callId: __callId__ + localStorage.getItem("userId") } : { callId: localStorage.getItem("groupId"), role: "caller" }} >
                                    <Video />
                                </Link>
                                <Link to={"/audiocall"} state={{ callId: __callId__ + localStorage.getItem("userId"), userId: localStorage.getItem("userId"), isDail: true, info: { img: localStorage.getItem("myImage"), name_: localStorage.getItem("myName") }, role: "caller" }}>
                                    <Phone />
                                </Link>

                                <Settings onClick={() => {
                                    setShowSetting(true);
                                }} />
                            </div>
                        </div>

                        <div className={isCahtTab ? "" : "hidden"}>
                            {chats.map((message, index) => (
                                <div
                                    key={message?._id}
                                    className={`chat ${message?.senderId === sender ? "chat-end" : "chat-start"}`}
                                >
                                    <div className='relative my-4'>
                                        <img className={`w-7 h-7 user rounded-full absolute bottom-1 ${message?.senderId === sender ? "float-right right-0" : "float-left"}`} src={message?.user?.image} />
                                        <div className={`mx-10 chat-bubble cursor-pointer sm:max-w-96`}>
                                            {
                                                message?.mediaUrl?.includes("image") ? (<img src={message?.mediaUrl} className={`rounded-xl w-full hover:scale-105 duration-150 ${!message?.mediaUrl?.includes("image") ?
                                                    "hidden" : ""}`} />) :
                                                    message?.mediaUrl?.includes(".mp3") ||
                                                        message?.mediaUrl?.includes(".webm") ?
                                                        <audio src={message?.mediaUrl} controls className='w-full h-6' ></audio>
                                                        : message?.mediaUrl?.includes(".mp4") ? (<video className={`${!message?.mediaUrl?.includes(".mp4") ? "hidden" : ""}`} controls>
                                                            <source src={message?.mediaUrl} type="video/mp4" />
                                                        </video>) : message?.mediaUrl === "unsent" ? "unsent" :
                                                            message?.link?.isLink ? (<a href={message?.link?.link} target='_blank' className='text-blue italic underline'><ShortText text={message?.link?.link} dot={4} width={window.innerWidth} range={15} /></a>) : message?.link?.link === "unsent" ? "unsent" : message?.call?.callType ? (<div>
                                                                <div className='flex justify-between items-center'>
                                                                    <span className='capitalize'>{message?.call?.callType}</span>
                                                                    <h6>{message?.call?.duration}</h6>
                                                                    {message.call?.callType === "audio" ? <Phone className='' /> : <Video />}
                                                                </div>
                                                            </div>) : message?.mediaUrl == "share" ?

                                                                <div>
                                                                    {message?.share?.image == true ? <img src={message?.share?.media} className='w-full h-full rounded-xl' /> : message?.share?.video == true ? <video src={message?.share?.media} controls className='w-full h-full rounded-xl'></video> : null}
                                                                    <Link to={"/get_post_by_notification"} state={{ postId: message?.share?._id }}>go to comment</Link>
                                                                </div>

                                                                : message?.isReplay === true ?
                                                                    <div>
                                                                        <h4 className={`absolute text-green-400 ${message?.senderId === sender ? "-top-4 -left-4 -rotate-45" : "-top-4 -right-4 rotate-45"}`}>reply</h4>
                                                                        {message?.replay?.chatId?.mediaUrl == "share" ?
                                                                            <div>
                                                                                {message?.replay?.chatId?.share?.image == true ? <img src={server_port + "/" + message?.replay?.chatId?.share?.media} className='w-full h-full rounded-xl' /> : <video src={server_port + message?.replay.chatId?.share?.media} controls className='w-full h-full rounded-xl'></video>}
                                                                            </div> :
                                                                            <div>
                                                                                {message?.replay?.chatId?.mediaUrl?.includes("image") ?
                                                                                    <img src={server_port + "/" + message?.replay?.chatId?.mediaUrl} alt="" /> : message?.replay?.chatId?.mediaUrl?.includes("video") ? <video src={server_port + "/" + message?.replay.chatId?.mediaUrl} controls></video> : message?.replay?.chatId?.mediaUrl?.includes("audio") ? <audio src={message?.replay.chatId?.mediaUrl} controls /> : message?.replay.chatId.messageTextull}

                                                                            </div>
                                                                        }
                                                                        <div className='flex items-center justify-between'>
                                                                            <h4>{message?.replay?.chatId?.messageText}</h4>
                                                                            <span>{message?.replay?.text}</span>
                                                                            {message?.replay?.chatId?.mediaUrl == "share" ? <Link className='text-blue-300' to={"/get_post_by_notification"} state={{ postId: message?.replay.chatId?.share?._id }}>go to comment</Link> : null}
                                                                            {console.log(chats)}
                                                                        </div>
                                                                    </div>
                                                                    : (<span className={`${ourDesign?.styles?.text?.italic ? "italic" : ""} ${ourDesign?.styles?.text?.color} ${ourDesign?.styles?.text?.family}`}>{message?.messageText}</span>)
                                            }

                                            <i className='text-xs text-indigo-500 block'>{message?.time}</i>
                                        </div>

                                        {message?.senderId === sender ? (<div className='absolute left-0 top-1/3 scale-90 border p-1 rounded-full opacity-45 hover:opacity-100 hover:bg-slate-700' onClick={() => {
                                            const thisMessage = document.getElementById(`message${index}`);
                                            if (thisMessage.classList.contains("hidden")) {
                                                thisMessage.classList.remove("hidden");
                                                thisMessage.classList.add("flex");
                                            }
                                        }}>
                                            <Ellipsis />
                                        </div>) : (<div className='absolute right-0 top-1/3 scale-90 border p-1 rounded-full opacity-45 hover:opacity-100 hover:bg-slate-700' onClick={() => {
                                            const thisMessage = document.getElementById(`message${index}`);
                                            if (thisMessage.classList.contains("hidden")) {
                                                thisMessage.classList.remove("hidden");
                                                thisMessage.classList.add("flex");
                                            }
                                        }}>
                                            <Ellipsis />
                                        </div>)}
                                        <div className={`w-52 h-auto border border-gray-100 rounded-sm absolute p-2 backdrop-blur-md hidden flex-col justify-center items-start gap-3 z-50 ${message?.senderId === sender ? "" : "ml-40"} top-5 rounded-xl text-sm`} id={`message${index}`}>
                                            <div className='w-full flex justify-end items-center'>
                                                <div onClick={() => {
                                                    hiddenReplayPlate(index);
                                                }} className="scale-75 hover:text-red-500" ><X /></div>
                                            </div>
                                            <div className={`flex items-center justify-start gap-3 cursor-pointer hover:bg-slate-500 p-[4px] rounded-md w-full ${message?.senderId === sender ? "hidden" : ""}`}
                                                onClick={() => {
                                                    setIsRplay(true);
                                                    setRepId(message?._id);
                                                    hiddenReplayPlate(index);
                                                    focus();
                                                }}>
                                                <Reply /> <span>reply</span>
                                            </div>
                                            <div className='flex items-center justify-start gap-3 cursor-pointer hover:bg-slate-500 p-[4px] rounded-md w-full'
                                                onClick={() => {
                                                    deleteMessage(message?._id);
                                                    setLoad(load + 2);
                                                    hiddenReplayPlate(index);
                                                }}>
                                                <Trash /><span>delete this</span>
                                            </div>
                                            <div className='flex items-center justify-start gap-3 cursor-pointer hover:bg-slate-500 p-[4px] rounded-md w-full'
                                                onClick={() => { hiddenReplayPlate(index); }}>
                                                <RemoveFormatting /> <span>remove this</span>
                                            </div>
                                            <div onClick={() => {
                                                unsentMessage(message?._id);
                                                hiddenReplayPlate(index);
                                            }} className={`flex items-center justify-start gap-3 cursor-pointer hover:bg-slate-500 p-[4px] rounded-md w-full ${message?.senderId === sender ? "" : "hidden"}`}>
                                                <ShieldBan /> <span>unsent this</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>














                        <div id='gchat' className={`${isCahtTab ? "hidden" : ""} relative ${groupDesign?.background?.bgType == "color" ? `${groupDesign?.background?.bgDesign}` : ""}`} >
                            <Link to={"/groupsettings"} state={{ friends }} className='w-10 h-10 flex justify-center items-center rounded-full bg-green-500 sticky top-16 z-50'><Plus /></Link>
                            {groupChats?.map((data, index) => (
                                <div key={index} id={data?._id} className={`chat ${data?.sender?._id === sender ? "chat-end" : "chat-start"} flex flex-col `}>

                                    <div className={`sm:max-w-[50%] max-w-[90%] min-w-[20%] h-auto rounded-xl ${data.sender?._id === sender ? " rounded-br-none" : "rounded-bl-none"} p-1 relative bg-slate-700/60`}>
                                        {data?.messageType == "reply" ? <span className={`inline-block absolute z-30 ${data.sender?._id === sender ? "-left-5 -top-4 -rotate-45" : "-right-5 -top-4 rotate-45"}`}>reply</span> : null}
                                        {data?.messageType == "text" ? <h4 className='px-2'>{data?.content}</h4> : data?.messageType == "image" ? <img src={data?.content} className='rounded-3xl' /> : data?.messageType == "video" ? <video src={data?.content} controls className='rounded-3xl' ></video> : data?.messageType == "audio" && data?.content.includes(".mp3") || data?.content.includes(".webm") ? <audio className='w-full h-6' src={data?.content} controls /> : data?.messageType == "link" ? <a href={data.content} target='_blank' className='italic text-indigo-800 px-2'>{data?.content}</a> : data?.messageType == "reply" ?
                                            <div>
                                                <div className={`flex items-center gap-2 p-1 rounded-2xl ${data?.sender?._id === sender ? "justify-end" : "justify-start"}`}>
                                                    <img src={data?.replyTo?.senderImg} className={`rounded-full w-5 h-5`} />
                                                    {data?.replyTo?.mtext.includes("image") ? <img src={data?.replyTo?.mtext} className='w-5/12 rounded-xl' /> : data?.replyTo?.mtext.includes(".mp4") ? <video src={data?.replyTo?.mtext} controls className='rounded-3xl w-5/12' ></video> : data?.replyTo?.mtext.includes(".mp3") || data?.replyTo?.mtext.includes(".webm") ? <audio className='w-full h-6' src={data?.replyTo?.mtext} controls id='groupreplyaudio' /> : <h6>{data?.replyTo?.mtext}</h6>}
                                                    <MoveRight />
                                                    <img src={data?.sender?.image} className={`w-5 h-5 rounded-full ${data.sender?._id === sender ? "float-right" : ""}`} />
                                                    <h4 className=''>{data?.content}</h4>
                                                </div>
                                            </div> : data?.messageType == "share" ?
                                                <div className='relative'>
                                                    <div>
                                                        {data?.share?.media.includes("/postImage/") ?
                                                            <img src={server_port + "/" + data?.share?.media} className='rounded-xl' /> :
                                                            data?.share?.media.includes("/postVideo/") ?
                                                                <video src={server_port + "/" + data?.share?.media} className='rounded-xl' controls ></video> :
                                                                ""}
                                                    </div>
                                                    <div className='py-2 flex items-center justify-center gap-3'>
                                                        <h4>{data.content} that share by</h4>
                                                        <MoveRight />
                                                        <img src={data?.sender?.image} className={`w-5 h-5 rounded-full`} />
                                                        <h5>{data?.sender?.name}</h5>
                                                    </div>
                                                </div> : ""}
                                        <div className={`flex ${data.sender?._id === sender ? "flex-row-reverse" : ""} items-center justify-start gap-3`}>
                                            <img src={data?.sender?.image} className={`w-5 h-5 rounded-full ${data.sender?._id === sender ? "float-right" : ""}`} />
                                            <h5 className='italic text-xs my-2'>{data?.createdAt}</h5>
                                            <Link to={"/get_post_by_notification"} state={{ postId: data?.share?._id }} className={`text-green-500 mx-5 hover:text-blue-600 underline ${data?.messageType == "share" ? "" : "hidden"}`}>go to comment</Link>
                                        </div>
                                        <Ellipsis className={`absolute top-[40%] ${data?.sender?._id === sender && data?.messageType == "text" ? "left-[-10%]" : data?.sender?._id === sender && data?.messageType != "text" ? "left-[-10%]" : data?.messageType == "text" ? "right-[-22%]" : "right-[-10%]"}`}
                                            onClick={() => { setIsMenu(true); setGChatId(data?._id); setMesageWoner(data?.sender?._id); setMsgText(data?.content); setMsgWonerImage(data?.sender?.image); }} />
                                    </div>
                                    <div className='flex items-center justify-start my-2 '> {data?.seenBy?.map((seeUser, index) => (
                                        <img key={index} src={seeUser?.image} className='w-4 h-4 rounded-full' />
                                    ))}</div>
                                </div>
                            ))}
                            <div className={`${isMenu ? "block" : "hidden"} w-[80%] h-[90vh] rounded-3xl fixed flex justify-center items-center top-0 backdrop-blur-xl`} onClick={() => { setIsMenu(false) }}>
                                <div className='w-52 h-auto bg-green-800 rounded-md py-2' >
                                    <h3 onClick={() => { deleteGMesage(gChatId) }} className={`hover:bg-blue-800 cursor-pointer px-2 ${messageWoner === sender ? "" : "hidden"}`}>delete this</h3>
                                    <h3 className='hover:bg-blue-800 cursor-pointer px-2' onClick={() => { setGCR(true); setIsRplay(true) }}>replay</h3>
                                </div>
                            </div>
                        </div>

















                        <div className='fixed bottom-14 left-1 sm:left-auto sm:bottom-16 w-44 h-10 flex justify-between items-center text-white'
                        >
                            <div className={`cursor-pointer w-10 h-10 bg-blue-500 rounded-md ${chats?.length <= 4 ? "hidden" : "flex"} justify-center items-center text-white`} onClick={() => {
                                const containerHeight = document.getElementById("chat_container");
                                scrollDown ? goToBottom() :
                                    containerHeight.scrollTop = 0;
                            }}>
                                {scrollDown ? <ArrowDown /> : <ArrowUp />}
                            </div>
                            <div className={`mb-20 relative ${fileUrl ? "block" : "hidden"}`}>
                                <div className='absolute -top-2 -right-2 p-1 bg-slate-600 rounded-full z-40' onClick={() => {
                                    setFileUrl(null);
                                    setMedia(undefined)
                                }} >
                                    <X />
                                </div>
                                {media ? (
                                    media.type.startsWith("image/") ? (
                                        <img className='w-32 h-32 rounded-md' src={fileUrl} alt="preview" />
                                    ) : media.type.startsWith("video/") ? (
                                        <video className='w-32 h-32 rounded-md object-fill' src={fileUrl} controls />
                                    ) : media.type.startsWith("audio/") ? (
                                        <audio className='w-40' src={fileUrl} controls ></audio>
                                    ) : ""
                                ) : null}
                            </div>
                        </div>
                    </div>
                </div>

                <div className={`absolute bottom-0 w-full gap-1 items-center ${ourDesign?.block?.isBlock == true ? "hidden" : ""} ${isBar ? "hodden" : "flex"}`}>
                    <div className='w-auto border flex justify-center items-center bg-gradient-to-r from-emerald-400 to-cyan-400 p-2 rounded-md'>
                        <input type="file" className='absolute w-10 opacity-0' onChange={(e) => {
                            setMedia(e.target.files[0])
                            setFileUrl(URL.createObjectURL(e.target.files[0]))
                        }} />
                        <div className=''>
                            <FolderUp />
                        </div>
                    </div>
                    <div>

                    </div>
                    <div onMouseDown={() => { setRecording(true) }} onTouchStart={() => { setRecording(true) }} onTouchEnd={() => { setRecording(false) }}>
                        <VoiceButton onAudioReady={(e) => { vioceHandeler(e) }} />
                    </div>
                    <div>
                        <Emoji onSelect={(e) => { handelEmogi(e) }} />
                    </div>
                    <input type="text"
                        value={message}
                        ref={inputRef}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder={inputText} className='w-11/12 rounded-e-none' />
                    <div className='border-none pr-3 rounded-s-none h-auto w-20 bg-gradient-to-r from-fuchsia-500 to-cyan-500 flex justify-center items-center p-2 
                    rounded-e-lg text-white cursor-pointer' id='rocketsender' onClick={() => {
                            if (isCahtTab) {
                                isReplay === true ? replayMessage(repId, replay) : sendMessage();
                                setTimeout(() => { goToBottom() }, 1000);
                            } else {
                                if (GCR === true) {
                                    replayGChat(message, msgText, msgWonerImage);
                                    setGCR(false)
                                } else {
                                    sendMsaageInGroup(localStorage.getItem("groupId"), message);
                                }
                            }
                        }}>
                        <Rocket />
                    </div>
                </div>
            </div>
            <div className={`absolute bottom-2 cursor-pointer left-1 w-10 h-10 bg-blue-500 rounded-md sm:flex hidden justify-center items-center text-white  `}
                onClick={() => { navigate("/") }}>
                <ArrowLeft />
            </div>
        </div >
    );
};

export default ChatRoom;
