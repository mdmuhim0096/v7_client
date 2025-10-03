import React, { useEffect, useState } from 'react'

const Seemore = ({ text = [], range, onReturn }) => {
    const [isSeMore, setSeeMore] = useState(true);
    const length = text.length;
    const sensitiveText = text.slice(0, range);
    const [event, setEvent] = useState(false);

    useEffect(() => {
        if (typeof onReturn === "function") {
            onReturn(event);
        }
    }, [event]);

    return (
        <div>
            <p className='text-indigo-200'>{length <= range ? text : <p>{isSeMore ? sensitiveText : text}
                <span
                    onClick={() => {
                        setSeeMore(isSeMore ? false : true);
                        setEvent(event ? false : true)
                    }}
                    className='underline px-2 cursor-pointer text-gray-400'
                >
                    {isSeMore ? "semore" : "seless"}
                </span>
            </p>}</p>
        </div>
    )
}

export default Seemore;