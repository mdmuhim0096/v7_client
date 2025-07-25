// components/EmojiPicker.js
import React, { useState } from 'react';
import Picker from 'emoji-picker-react';

const Emoji = ({ onSelect }) => {
  const handleEmojiClick = (emojiObject) => {
    onSelect(emojiObject.emoji);
  };

  return (
    <div>
      <div id='Picker'>
        <Picker onEmojiClick={handleEmojiClick} />
      </div>
    </div>
  );
};

export default Emoji;
