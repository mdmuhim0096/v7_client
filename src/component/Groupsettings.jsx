import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { MoveLeft, Plus } from 'lucide-react';
import { server_port } from './api';
import { useNavigate } from 'react-router-dom';
import LoaderContainer from "./LoaderContainer";
const Groupsettings = () => {
    const [members, setMembers] = useState([]);
    const [isLoadEnd, setIsLoadEnd] = useState(false); // Don't use [null], just []
    const navigate = useNavigate();
    const [load, setLoad] = useState(0);

    function getMembers() {
        const groupId = localStorage.getItem("groupId");
        const adminId = localStorage.getItem("myId");
        axios.post(`${server_port}/api/group/filteruser`, { gid: groupId, admin: adminId })
            .then(res => {
                setMembers(res.data.friends);
                setIsLoadEnd(true);
            })
            .catch(err => {
                console.error("Error fetching members:", err);
            });
    }
    useEffect(() => {
        getMembers()
    }, [load]);

    const add = (membersToAdd) => {
        const groupId = localStorage.getItem("groupId");
        axios.post(`${server_port}/api/group/addmember/${groupId}`, { members: membersToAdd })
            .then(res => {
                console.log("Member(s) added:", res.data);
            })
            .catch(err => {
                console.error("Error adding members:", err);
            });
    };

    return (
        <div className='flex flex-wrap gap-5 p-2 h-screen relative'>
            <LoaderContainer type={"load"} loadEnd={isLoadEnd} />
            {members.length === 0 ? (
                <p>No members found</p>
            ) : (
                members.map((member, index) => (
                    <div onClick={(() => { add(member._id); })} key={index} className='cursor-pointer flex items-center justify-between gap-5 w-3/12 py-1 px-2 rounded-md hover:bg-gray-800 duration-300 h-10'>
                        <div className='flex items-center justify-center gap-2'>
                            <img src={member.image} className='w-7 h-7 rounded-full' />
                            <h5>{member.name}</h5>
                        </div>

                        <Plus className='hover:text-green-500 duration-150' />
                    </div>
                ))
            )}
            <div className='w-10 h-10 rounded-md bg-blue-500 cursor-pointer flex justify-center items-center absolute bottom-1 left-1'
                onClick={() => { navigate("/chatroom") }}>
                <MoveLeft />
            </div>
        </div>
    );
};

export default Groupsettings;
