import React from "react";
import { ChatState } from "../../context/ChatProvider";
import { FaCheck, FaCheckDouble, FaClock } from "react-icons/fa";
import { jwtDecode } from "jwt-decode";
import moment from "moment";
import "./styles.css";

// Simple color palette
const avatarColors = [
  "#FF6B6B", "#FF8C42", "#FFD93D", "#6BCB77", "#4D96FF",
  "#845EC2", "#FF9671", "#FFC75F", "#008E9B", "#C34A36"
];

// Function to pick a color based on name's first letter
export const getAvatarColor = (name) => {
  if (!name) return "#6C757D";
  const charCode = name.toUpperCase().charCodeAt(0);
  const index = charCode % avatarColors.length;
  return avatarColors[index];
};

// Function to get the first letter
export const getInitial = (name) => (name ? name.charAt(0).toUpperCase() : "?");

export default function ChatUserItem({ type = false, name, image, onClick, chat }) {
  const token = localStorage.getItem("auth-token");
  const uId = jwtDecode(token)?.id;
  const { notifications, setNotifications } = ChatState();

  return (
    <div
      className="chat-user-item border-bottom"
      style={{
        height: type ? "5vh" : "7vh",
        padding: "0.5rem 1rem",
        cursor: "pointer",
      }}
      onClick={onClick}
    >
      <div className="d-flex align-items-center">
        {/* Avatar (image or letter circle) */}
        {image ? (
          <img
            src={image}
            alt={name}
            width={50}
            height={50}
            className="rounded-circle me-3"
          />
        ) : (
          <div
            className="d-flex align-items-center justify-content-center me-3"
            style={{
              width: 50,
              height: 50,
              borderRadius: "50%",
              backgroundColor: getAvatarColor(name),
              color: "white",
              fontWeight: "bold",
              fontSize: "1.2rem",
              textTransform: "uppercase",
            }}
          >
            {getInitial(name)}
          </div>
        )}

        <div
          className="flex-grow-1 d-flex flex-column justify-content-center"
          style={{ overflow: "hidden" }}
        >
          <span
            style={{
              fontSize: "1.1rem",
              fontWeight: "bold",
              color: "white",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {name}
          </span>

          {!type && (
            <div className="d-flex align-items-center text-truncate">
              {chat?.latestMessage?.sender._id === uId && (
                <>
                  {chat?.latestMessage?.status === "pending" && (
                    <FaClock size={12} color="gray" className="me-1" />
                  )}
                  {chat?.latestMessage?.status === "send" && (
                    <FaCheck size={12} color="gray" className="me-1" />
                  )}
                  {chat?.latestMessage?.status === "received" && (
                    <FaCheckDouble size={12} color="gray" className="me-1" />
                  )}
                  {chat?.latestMessage?.status === "seen" && (
                    <FaCheckDouble size={12} color="#2cbae7" className="me-1" />
                  )}
                </>
              )}

              {chat?.isGroupChat && (
                <span style={{ fontSize: "0.8rem", color: "#aebac1" }}>
                  {chat?.latestMessage?.sender._id === uId
                    ? "You: "
                    : `${chat?.latestMessage?.sender?.name}: `}
                </span>
              )}

              <span
                style={{
                  fontSize: "0.8rem",
                  color: "#aebac1",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {chat?.latestMessage?.content}
              </span>
            </div>
          )}
        </div>

        <div
          className="d-flex flex-column align-items-end justify-content-center ms-auto"
          style={{ minWidth: "70px" }}
        >
          <span
            style={{
              fontSize: "0.8rem",
              color: chat?.unReadMsgCount > 0 ? "#00a884" : "#aebac1",
            }}
          >
            {chat?.latestMessage?.createdAt &&
              moment(chat.latestMessage.createdAt).format("hh:mm A")}
          </span>

          {chat?.unReadMsgCount > 0 && (
            <span
              className="badge bg-success mt-1"
              style={{
                borderRadius: "12px",
                fontSize: "0.75rem",
                padding: "0.25rem 0.5rem",
              }}
            >
              {chat.unReadMsgCount > 99 ? "99+" : chat.unReadMsgCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
