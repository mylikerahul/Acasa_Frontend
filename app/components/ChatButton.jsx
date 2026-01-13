"use client";
import { useState } from "react";
import { MdChatBubbleOutline } from "react-icons/md";
import "./ChatButton.css";

export default function ChatButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
      
      {/* LEFT SIDE POPUP */}
      {isOpen && (
        <div className="bg-white border rounded-lg shadow-lg p-3 w-56 text-sm animate-fade-in">
          <p className="font-medium text-gray-800">We're offline</p>
          <p className="text-gray-500">Leave a message</p>
        </div>
      )}

      {/* CHAT BUTTON */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-[#0059D6] hover:bg-[#004bb5] text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition transform hover:scale-105"
        aria-label="Chat Button"
      >
        <MdChatBubbleOutline className="text-2xl" />
      </button>
    </div>
  );
}
