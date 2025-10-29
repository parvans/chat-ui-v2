import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { Badge, Form, Spinner, Button, InputGroup, Image } from "react-bootstrap";
import { ChatState } from "../../context/ChatProvider";
import { jwtDecode } from "jwt-decode";
import {
  sendUserMessage,
  fetcheMessages,
  readMessage,
} from "../../utilities/apiService";
import ScrollableMessages from "./ScrollableMessages";
// import selcetchat from "../../assets/img/selectchat.png";
// import data from "@emoji-mart/data";
// import Picker from "@emoji-mart/react";
import moment from "moment";
import {
  FaArrowLeft,
  FaVideo,
  FaPhone,
  FaSmile,
  FaPaperPlane,
} from "react-icons/fa";

import "./styles.css";
import { getAvatarColor, getInitial } from "./ChatUserItem";

const ENDPOINT = "ws://localhost:9000";
let socket, selectedChatCompare;

export default function SingleChat({ fetchAgain, setFetchAgain }) {
  const {
    selectedChat,
    setSelectedChat,
    notifications,
    setNotifications,
    isRefresh,
    setIsRefresh,
  } = ChatState();

  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [latestMessage, setLatestMessage] = useState("");
  const [socketConnection, setSocketConnection] = useState(false);
  const [typing, setTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isEmoji, setIsEmoji] = useState(false);
  const [chatReload, setChatReload] = useState(false);

  const user = jwtDecode(localStorage.getItem("auth-token")).id;

  const mediaSet = () => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => console.log(stream));
  };

  const handleMessageSend = (messageId) => socket.emit("messageSend", messageId);
  const handleMessageSeen = (messageId) => socket.emit("messageSeen", messageId);
  const handleMessageReceived = (messageId) =>
    socket.emit("messageReceived", messageId);
  const handleAllMessagesSeen = () =>
    socket.emit("allMessageSeen", selectedChat?._id);

  const getMessages = async () => {
    if (!selectedChat) return;
    try {
      setLoading(true);
      const res = await fetcheMessages(selectedChat._id);
      if (res.ok) {
        setMessages(res.data.data);

        const unread = res.data.data.filter(
          (msg) =>
            msg.sender._id !== user &&
            !msg.readBy.some((r) => r.user === user)
        );

        const promises = unread.map(async (msg) =>
          readMessage({ chatId: msg.chat._id, messgId: msg._id })
        );

        const results = await Promise.all(promises);
        if (results.length) socket.emit("readMessage", results.at(-1).data.data);

        setLoading(false);
        socket.emit("join room", selectedChat._id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const sendMessage = async () => {
    if (!latestMessage.trim()) return;
    socket.emit("stop typing", selectedChat._id);
    try {
      const res = await sendUserMessage({
        chatId: selectedChat._id,
        content: latestMessage,
      });
      setLatestMessage("");
      if (res.ok) {
        setIsRefresh(!isRefresh);
        setIsEmoji(false);
        handleMessageSend(res.data.data._id);
        setMessages([...messages, res.data.data]);
        socket.emit("new message", res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOnlineStatus = (chat) => {
    if (!chat) return false;
    const member = chat.users.find((u) => u._id !== user);
    return onlineUsers.some((u) => u.userId === member._id);
  };

  useEffect(() => {
    socket = io(ENDPOINT);
    socket.emit("setup", user);
    socket.emit("newUser", user);
    socket.on("getUsers", (users) => setOnlineUsers(users));
    socket.on("connected", () => setSocketConnection(true));
    socket.on("typing", () => setIsTyping(true));
    socket.on("stop typing", () => setIsTyping(false));
  }, []);

  useEffect(() => {
    getMessages();
    selectedChatCompare = selectedChat;
    handleOnlineStatus();
  }, [selectedChat]);

  useEffect(() => {
    socket.on("message received", (newMessage) => {
      if (!selectedChatCompare || selectedChatCompare._id !== newMessage.chat._id) {
        if (!notifications.includes(newMessage)) {
          setNotifications([newMessage, ...notifications]);
          setFetchAgain(!fetchAgain);
        }
        handleMessageSend(newMessage._id);
        setTimeout(() => handleMessageReceived(newMessage._id), 1000);
      } else {
        setMessages([...messages, newMessage]);
        handleMessageSeen(newMessage._id);
        handleAllMessagesSeen();
      }
    });
  });

  const handleTyping = (e) => {
    setLatestMessage(e.target.value);
    if (!socketConnection) return;

    if (!typing) {
      setTyping(true);
      socket.emit("typing", selectedChat._id);
    }
    const lastTypingTime = Date.now();
    const timerLength = 3000;
    setTimeout(() => {
      const timeNow = Date.now();
      if (timeNow - lastTypingTime >= timerLength && typing) {
        socket.emit("stop typing", selectedChat._id);
        setTyping(false);
      }
    }, timerLength);
  };

  const onEmojiClick = (e) => {
    const emoji = String.fromCodePoint(...e.unified.split("_").map((u) => "0x" + u));
    setLatestMessage((prev) => prev + emoji);
  };

  const theUser = React.useMemo(() => {
  if (!selectedChat) return null; // if no chat selected yet

  // If it's a group chat
  if (selectedChat.isGroupChat) {
    return {
      name: selectedChat.chatName,
      image: selectedChat.chatImage,
    };
  }

  // If it's a private (1-to-1) chat
  if (Array.isArray(selectedChat.users)) {
    return selectedChat.users.find((u) => u._id !== user);
  }

  return null;
}, [selectedChat, user]);


  return (
    <div className="rightChatBox">
      {selectedChat ? (
        <>
          {/* ===== Header ===== */}
          <div className="chatboxHeader d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <FaArrowLeft
                size={22}
                color="#aebac1"
                style={{ cursor: "pointer", marginRight: "1rem" }}
                onClick={() => setSelectedChat("")}
              />
              {theUser ?(
                <>
                  {theUser?.image ? (
                  <Image
                    src={theUser?.image}
                    roundedCircle
                    width={50}
                    height={50}
                    className="me-2"
                  />): (
                    <div
                      className="d-flex align-items-center justify-content-center me-3"
                      style={{
                        width: 50,
                        height: 50,
                        borderRadius: "50%",
                        backgroundColor: getAvatarColor(theUser?.name),
                        color: "white",
                        fontWeight: "bold",
                        fontSize: "1.2rem",
                        textTransform: "uppercase",
                      }}
                    >
                      {getInitial(theUser?.name)}
                    </div>
                  )}
                </>
                ): (
                <div className="text-muted">No chat selected</div>
              )}
              <div>
                <h5 className="mb-0 text-light">
                  {theUser?.name}
                </h5>
                <small className="text-muted">
                  {isTyping ? "Typing..." : handleOnlineStatus(selectedChat) ? "Online" : "Offline"}
                </small>
              </div>
            </div>

            <div>
              <Button variant="link" onClick={mediaSet}>
                <FaVideo color="#aebac1" size={20} />
              </Button>
              <Button variant="link">
                <FaPhone color="#aebac1" size={20} />
              </Button>
            </div>
          </div>

          {/* ===== Messages ===== */}
          <div className="chatboxChat">
            {loading ? (
              <div className="text-center mt-5">
                <Spinner animation="border" variant="success" />
              </div>
            ) : (
              <>
                <ScrollableMessages messages={messages} />
                <div className="chatboxFooter position-relative">
                  <InputGroup>
                    <Form.Control
                      placeholder="Type a message..."
                      as="textarea"
                      rows={1}
                      value={latestMessage}
                      onChange={handleTyping}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      style={{
                        resize: "none",
                        backgroundColor: "#202c33",
                        border: "none",
                        color: "#aebac1",
                        borderRadius: "1rem",
                      }}
                    />
                    <Button variant="link" onClick={() => setIsEmoji(!isEmoji)}>
                      <FaSmile color="#aebac1" size={20} />
                    </Button>
                    {latestMessage && (
                      <Button variant="link" onClick={sendMessage}>
                        <FaPaperPlane color="#aebac1" size={20} />
                      </Button>
                    )}
                  </InputGroup>

                  {/* {isEmoji && (
                    <div
                      style={{
                        position: "absolute",
                        bottom: "60px",
                        right: "10px",
                        zIndex: 2,
                      }}
                    >
                      <Picker data={data} onEmojiSelect={onEmojiClick} width={300} />
                    </div>
                  )} */}
                </div>
              </>
            )}
          </div>
        </>
      ) : (
        <div className="text-center mt-5">
          {/* <img src={selcetchat} alt="Select chat" width={400} height={400} /> */}
          <h3 className="text-muted">
            Chatbot <Badge bg="secondary">Beta</Badge>
          </h3>
          <p className="text-muted">
            Send and receive messages seamlessly.<br />
            Chat with your friends easily and conveniently.
          </p>
        </div>
      )}
    </div>
  );
}
