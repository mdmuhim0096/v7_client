import { useEffect, useState } from "react";
import axios from "axios";
import { server_port, myfriends_api } from "./api";
import { Ellipsis, X, Share2, MessageSquareIcon, Save } from "lucide-react";
import Seemore from "./Seemore";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { submitLength } from "./Home";
import { formatNumber } from "../utils/formatenumber";
import { ToastContainer, toast } from "react-toastify";
import ReactPlate from "./ReactPlate";

const PublicPost = () => {
  const location = useLocation();
  const [posts, setPosts] = useState([]);
  const [load, setLoad] = useState(0);
  const [friends, setFriends] = useState(null);
  const [endLoad, setEndLoad] = useState(true);
  const [postBG, setPostBG] = useState("");
  const navigate = useNavigate();

  // current user ID
  const _id_ = localStorage.getItem("myId");

  /** 🔹 Get current user’s friends */
  const getMyFriends = async () => {
    try {
      const res = await axios.get(myfriends_api, { withCredentials: true });
      setFriends(res.data.data);
    } catch (error) {
      console.log(error);
    }
  };

  /** 🔹 Fetch public posts + style */
  const getPublicPost = async () => {
    try {
      setEndLoad(false);
      const res = await axios.get(
        `${server_port}/api/post/publicpost/${_id_}`,
        { withCredentials: true }
      );
      setPosts(res.data.posts);

      const _res_ = await axios.get(
        `${server_port}/api/people/userStyle`,
        { withCredentials: true }
      );
      setPostBG(_res_.data.data.styles.postbg);
      setEndLoad(true);
    } catch (error) {
      console.log(error);
    }
  };

  /** 🔹 Submit post length to Home once posts change */
  useEffect(() => {
    submitLength(posts.length);
  }, [posts.length]);

  /** 🔹 Initial fetch */
  useEffect(() => {
    getMyFriends();
    getPublicPost();
  }, [load]);

  /** 🔹 Remove post */
  const removePost = async (postId) => {
    await axios.post(
      `${server_port}/api/people/remove_post`,
      { postId },
      { withCredentials: true }
    );
    setLoad((prev) => prev + 1);
  };

  /** 🔹 Save post */
  const savePost = async (id) => {
    await axios.post(`${server_port}/api/save/save`, { id, _id_ });
    toast.success("Post saved!");
  };

  /** 🔹 Show menu toast */
  const showMenuToast = (pid, rid) => {
    toast(() => (
      <div className="flex flex-col gap-2">
        <h6
          className="italic flex justify-start items-center gap-2 cursor-pointer"
          onClick={() => savePost(pid)}
        >
          <Save /> Save this
        </h6>
        <Link
          className="italic flex justify-start items-center gap-2 cursor-pointer"
          state={{ pid, rid }}
          to="/report"
        >
          Report
        </Link>
      </div>
    ));
  };

  /** 🔹 Alert Like */
  async function alertLike(receiverId, senderId, postId, reactType) {
    try {
      const res = await axios.post(`${server_port}/api/noti/likeAlert`, {
        receiverId,
        senderId,
        postId,
        reactType,
      });
      toast.success(res.data.message);
    } catch (err) {
      console.log(err);
    }
  }

  /** 🔹 Auto-play/pause videos on scroll */
  useEffect(() => {
    const videos = document.querySelectorAll(".post-video");
    if (videos.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target;
          if (entry.isIntersecting) {
            video.play().catch(() => { console.log("somthing is wrong") });
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.5 }
    );

    videos.forEach((video) => observer.observe(video));

    return () => {
      videos.forEach((video) => observer.unobserve(video));
      observer.disconnect();
    };
  }, [posts]);

  /** 🔹 Show/hide React Plate */
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

  /** 🔹 Get Top 3 React types */
  function getTop3React(reactArray = []) {
    const reactObject = {};
    reactArray.forEach((item) => {
      const type = item.type;
      reactObject[type] = (reactObject[type] || 0) + 1;
    });
    const sortedArray = Object.entries(reactObject).sort((a, b) => b[1] - a[1]);
    return sortedArray.slice(0, 3);
  }

  function seallreact(postId) {
    navigate("/allreacts", { state: { postId } })
  }

  return (
    <div className="sm:p-4 h-auto" id="postInnerContainer">
      <ToastContainer />
      {posts.map((data, index) => {
        const myLike = data?.likes?.find((like) => like.user === _id_);
        const topReacts = getTop3React(data?.likes);
        if (!data?.isClip) {
          return (
            <div
              key={data._id || index}
              className={`mx-auto w-full rounded-lg p-2 backdrop-blur-md my-5 ${postBG} h-auto`}
            >
              {/* HEADER */}
              <div className="flex justify-between items-center border-b-2 border-cyan-700 mb-3">
                <Link
                  to="/publicprofile"
                  state={{ id: data?.postOwner?._id }}
                  className="flex items-center gap-3"
                  title="profile"
                >
                  <img
                    className="w-10 h-10 rounded-full"
                    src={data?.postOwner?.image}
                    alt="profile"
                  />
                  <h4 className="hover:text-blue-600 duration-200">
                    {data?.postOwner?.name}
                  </h4>
                </Link>

                <div className="flex justify-between items-center gap-2">
                  <span
                    onClick={() =>
                      showMenuToast(data?._id, data?.postOwner?._id)
                    }
                  >
                    <Ellipsis size={32} strokeWidth={1.5} />
                  </span>
                  <span
                    onClick={() => removePost(data._id)}
                    className="hover:text-red-500 cursor-pointer"
                  >
                    <X />
                  </span>
                </div>
              </div>

              {/* CAPTION */}
              <div className="my-2">
                <Seemore text={data.caption} range={200} />
              </div>

              {/* MEDIA */}
              {data?.media?.endsWith(".mp4") ? (
                <video
                  src={data?.media}
                  controls
                  loop
                  muted
                  playsInline
                  className="post-video object-fill w-full h-[250px] sm:h-[300px] md:h-[350px] rounded-lg"
                />
              ) : (
                <img
                  className="rounded-md w-full max-h-96 object-fill"
                  src={data?.media}
                  alt="post"
                />
              )}

              {/* FOOTER */}
              <footer className="h-auto">
                <div className="w-full h-auto flex justify-between items-center">
                  <span className={`flex items-center my-1 rounded-md px-1 cursor-pointer shadow-md ${postBG.split("-").slice(0, 2).join("-")}-600`}
                    onClick={() => { seallreact(data?._id) }}
                  >
                    {topReacts.map(([type], i) => (
                      <img
                        key={i}
                        src={`./assets/react_icons/${type === "love" ? "heart" : type}.png`}
                        className="w-5 h-5"
                        alt={type}
                      />
                    ))}
                    <span className="mx-2">{formatNumber(data?.likes?.length)}</span>
                  </span>
                  <span>
                  </span>
                  <span>
                    <span className="mx-2">share</span>
                    {formatNumber(data?.share.length)}
                  </span>
                </div>

                <div className="flex">
                  {/* LIKE */}
                  <div className="post_footer w-4/12">
                    <div
                      onClick={() => setLoad((prev) => prev + 1)}
                      onMouseEnter={() =>
                        setTimeout(() => showPlate(true, index), 100)
                      }
                      onMouseLeave={() => showPlate(false, index)}
                    >
                      <ReactPlate
                        index={index}
                        postId={data?._id}
                        type="post"
                        onReturn={async (t) =>
                          await alertLike(
                            data?.postOwner?._id,
                            _id_,
                            data?._id,
                            t
                          )
                        }
                        color={postBG}
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
                    state={{ post_id: data?._id }}
                    className="post_footer w-4/12 justify-center"
                    onClick={() =>
                      localStorage.setItem("back_page", location.pathname)
                    }
                  >
                    <MessageSquareIcon />
                    {formatNumber(data?.comments?.length)}
                  </Link>

                  {/* SHARE */}
                  <span className="post_footer w-4/12 justify-end">
                    <Link to="/share" state={{ friends, post: data?._id }}>
                      <Share2 />
                    </Link>
                  </span>
                </div>
              </footer>
            </div>
          );
        }
      })}
    </div>
  );
};

export default PublicPost;
