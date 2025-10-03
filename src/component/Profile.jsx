// Profile.jsx
import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { server_port } from './api';
import Mypost from './Mypost';
import { ArrowLeft, Ellipsis, Pencil, X, ImagePlus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Seemore from './Seemore';
import socket from "./socket";
import { tone } from "../utils/soundprovider";
import { isMatchGroup } from '../utils/utils';
import BatteryInfo from './BattryInfo';
import LocationInfo from "./LocationInfo";
import DeviceInfo from './Device';

const Profile = () => {
  const navigate = useNavigate();
  const { callTone } = tone;

  // States
  const [user, setUser] = useState({});
  const [load, setLoad] = useState(0);
  const [editState, setEditState] = useState({
    bio: false,
    image: false,
    name: false,
    email: false,
    age: false,
    gender: false,
    maritalStatus: false
  });
  const [formData, setFormData] = useState({
    bio: "",
    file: null,
    name: "",
    email: "",
    age: "",
    gender: "",
    maritalStatus: ""
  });

  // Fetch user data
  useEffect(() => {
    const getUserData = async () => {
      try {
        const res = await axios.get(`${server_port}/api/people/userData`, { withCredentials: true });
        const data = res.data.data;
        setUser(data);
        localStorage.setItem("myId", data._id);
        localStorage.setItem("myImage", data.image);
        localStorage.setItem("myName", data.name);
      } catch (error) {
        console.error(error);
      }
    };
    getUserData();
  }, [load]);

  // Generic socket listener for calls
  const handleSocketCall = useCallback((data, route) => {
    if (data.userId === localStorage.getItem("myId")) {
      navigate(route, { state: { callId: data.callId, userId: data.userId, role: "receiver", info: data.info } });
      callTone?.play?.();
    }
  }, [navigate, callTone]);

  // Group call socket listener
  const handleGroupCall = useCallback(async (data, route) => {
    if (await isMatchGroup(data)) {
      navigate(route, { state: { callId: data, isCaller: false, image: localStorage.getItem("myImage"), name: localStorage.getItem("myName") } });
      callTone?.play?.();
    }
  }, [navigate, callTone]);

  // Attach socket listeners
  useEffect(() => {
    socket.on("incoming_call_a", data => handleSocketCall(data, "/audiocall"));
    socket.on("____incoming_call____", data => handleSocketCall(data, "/v"));
    socket.on("join_room", data => handleGroupCall(data, "/groupvideocall"));
    socket.on("join_audio_room", data => handleGroupCall(data, "/groupaudiocall"));

    return () => {
      socket.off("incoming_call_a");
      socket.off("____incoming_call____");
      socket.off("join_room");
      socket.off("join_audio_room");
    };
  }, [handleSocketCall, handleGroupCall]);

  // Generic profile update
  const updateProfileField = async (field, value, isFile = false) => {
    try {
      if (isFile) {
        const fd = new FormData();
        fd.append("img", value);
        await axios.post(`${server_port}/api/people/updateProfileImage`, fd, { withCredentials: true });
      } else {
        await axios.post(`${server_port}/api/people/updateProfile${field}`, { [field]: value }, { withCredentials: true });
      }
      setEditState(prev => ({ ...prev, [field.toLowerCase()]: false }));
      setLoad(prev => prev + 1);
    } catch (error) {
      console.error(error);
    }
  };

  // Render
  return (
    <section className='text-white'>
      {/* Edit Bio Modal */}
      {editState.bio && (
        <div className='w-full h-screen backdrop-blur-md fixed z-50 top-0 left-0 flex justify-center items-center'>
          <div className='w-full h-full md:w-6/12 md:h-3/4 rounded-md bg-slate-700 p-2 flex flex-col'>
            <textarea
              className='w-full h-5/6 resize-none'
              placeholder='Add bio'
              value={formData.bio}
              onChange={e => setFormData({ ...formData, bio: e.target.value })}
            />
            <div className='flex justify-between items-center mt-4'>
              <button onClick={() => setEditState(prev => ({ ...prev, bio: false }))}>Close</button>
              <button onClick={() => updateProfileField("Bio", formData.bio)}>Add</button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className='w-full sticky top-0 left-0 z-40 p-2'>
        <Link to={"/"}><ArrowLeft /></Link>
      </div>

      {/* Profile Header */}
      <div className='w-full h-[50vh] sm:h-[60vh] md:h-[80vh] relative'>
        <img className='w-full h-full opacity-85 object-cover' src={user?.image} alt='cover' />
        <div className='absolute bottom-0 left-0'>
          <img src={user?.image} className='w-24 h-24 sm:w-44 sm:h-44 md:w-56 md:h-56 rounded-full shadow-2xl m-3' alt='profile' />
          <div onClick={() => setEditState(prev => ({ ...prev, image: true }))}
            className='w-10 h-10 rounded-full bg-slate-600 absolute top-5 right-5 flex justify-center items-center'>
            <Pencil />
          </div>
        </div>

        {/* Edit Profile Image Overlay */}
        {editState.image && (
          <div className='absolute top-0 left-0 w-full h-full z-30 backdrop-blur-lg backdrop-brightness-75 flex flex-col justify-center items-center'>
            <X className='absolute top-5 right-5 cursor-pointer' onClick={() => setEditState(prev => ({ ...prev, image: false }))} />
            <div className='w-12 border flex justify-center items-center bg-gradient-to-r from-emerald-400 to-cyan-400 p-2 rounded-md relative'>
              <input
                type="file"
                className='absolute w-12 h-12 opacity-0 cursor-pointer'
                onChange={(e) => setFormData(prev => ({ ...prev, file: e.target.files[0] }))}
              />
              <ImagePlus />
            </div>
            <button className='my-3 px-4 py-2 bg-blue-500 rounded-md' onClick={() => updateProfileField("Image", formData.file, true)}>Update</button>
          </div>
        )}
      </div>

      {/* Profile Info */}
      <div className='h-auto flex flex-col md:flex-row justify-between items-start md:items-center p-4 gap-4'>
        <div className='flex items-center gap-5'>
          <h4 className='text-2xl md:text-5xl font-semibold'>{user.name}</h4>
          {/* Edit Name */}
          <span onClick={() => { setEditState(prev => ({ ...prev, name: true })); setFormData(prev => ({ ...prev, name: user.name })); }}
            className={`border-2 bg-slate-600 rounded-full w-10 h-10 flex justify-center items-center p-1 ${!editState.name ? "block" : "hidden"}`}>
            <Pencil />
          </span>
          {editState.name && (
            <div className='flex gap-2 items-center'>
              <input type="text" value={formData.name} onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} className='w-5/12' />
              <button onClick={() => updateProfileField("Name", formData.name)}>Update</button>
              <X onClick={() => setEditState(prev => ({ ...prev, name: false }))} />
            </div>
          )}
        </div>

        <div>
          <h1>Likes: {user.like}</h1>
        </div>
      </div>

      <hr className='w-full h-[2px] bg-indigo-900 my-5 border-none' />

      {/* Profile Details */}
      <div className='grid md:grid-cols-2 lg:grid-cols-3 my-5 gap-5 md:p-4'>
        {/* Personal Info Card */}
        {["Email", "Age", "Gender", "MaritalStatus"].map((field, idx) => (
          <InfoCard
            key={idx}
            label={field}
            value={user[field.toLowerCase()]}
            editState={editState}
            formData={formData}
            setFormData={setFormData}
            setEditState={setEditState}
            updateProfileField={updateProfileField}
          />
        ))}

        {/* Friends Card */}
        <div className='p-[3px] border w-full h-[111.5px] rounded-lg bg-gradient-to-r from-green-400 to-blue-500 flex justify-center items-center'>
          <div className='bg-slate-800 h-full w-full rounded-md p-1'>
            <h1>Friends</h1>
            <div className='my-3 flex justify-start items-center'>
              {user?.friends?.map((data, index) => (
                <img key={index} className={`w-5 h-5 rounded-full ${index > 0 ? "-ml-2" : ""}`} src={data?.image} alt='friend' />
              ))}
            </div>
          </div>
        </div>

        {/* Bio Card */}
        <div className='p-[3px] border w-full rounded-lg bg-gradient-to-r from-green-400 to-blue-500 flex justify-center items-center max-h-auto'>
          <div className='bg-slate-800 h-full w-full rounded-md p-1 max-h-auto'>
            <div className='flex justify-between items-center'>
              <h1>Bio</h1>
              <span className='cursor-pointer' onClick={() => setEditState(prev => ({ ...prev, bio: true }))}>
                <Ellipsis />
              </span>
            </div>
            <Seemore text={user.bio} range={150} />
          </div>
        </div>
      </div>
      <div className='w-[100%] h-auto md:h-56 gap-2 grid sm:grid-cols-2 md:grid-cols-3 '>
        <BatteryInfo />
        <LocationInfo />
        <DeviceInfo />
      </div>

      {/* User Posts */}
      <div className='relative md:p-4'>
        <h1 className='capitalize md:text-4xl font-bold mt-14 text-center'>Your Posts</h1>
        <Mypost />
      </div>
    </section>
  );
};

export default Profile;

// --------------------
// InfoCard Component
// --------------------
const InfoCard = ({ label, value, editState, formData, setFormData, setEditState, updateProfileField }) => {
  const fieldKey = label.toLowerCase();
  return (
    <div className='p-[3px] border w-full rounded-lg bg-gradient-to-r from-green-400 to-blue-500 flex justify-center items-center'>
      <div className='bg-slate-800 h-full w-full rounded-md p-1'>
        <div className='flex items-center justify-start'>
          <h4>{label}: {value}</h4>
          <span onClick={() => { setEditState(prev => ({ ...prev, [fieldKey]: true })); setFormData(prev => ({ ...prev, [fieldKey]: value })); }}
            className={`border-2 bg-slate-600 rounded-full w-5 h-5 flex justify-center items-center p-1 mx-3 ${!editState[fieldKey] ? "block" : "hidden"}`}>
            <Pencil />
          </span>
          {editState[fieldKey] && (
            <div className='flex gap-2 items-center'>
              <input type={fieldKey === "age" ? "number" : "text"} className='w-5/12' value={formData[fieldKey]} onChange={e => setFormData(prev => ({ ...prev, [fieldKey]: e.target.value }))} />
              <button onClick={() => updateProfileField(label, formData[fieldKey])}>Update</button>
              <X onClick={() => setEditState(prev => ({ ...prev, [fieldKey]: false }))} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
