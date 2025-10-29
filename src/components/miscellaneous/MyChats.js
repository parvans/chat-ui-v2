import React, { useEffect, useState } from "react";
import {
  Card,
  Col,
  Spinner,
  Form,
  InputGroup,
  Button,
} from "react-bootstrap";
import { ChatState } from "../../context/ChatProvider";
import { getChats, accessChat, getUsers } from "../../utilities/apiService";
import { jwtDecode } from "jwt-decode";
import { getSender } from "../../config/ChatLogic";
import ChatUserItem from "./ChatUserItem";
// import ProfileModal from "./ProfileModal";
// import Group from "components/Group";
import useSound from "use-sound";
import message1 from "../../assets/audio/message1.mp3";
import { FaSearch, FaArrowLeft, FaEllipsisV, FaSignOutAlt, FaUsers, FaUser } from "react-icons/fa";
import { IoMdClose } from "react-icons/io";
import moment from "moment";
import "./styles.css";

export default function MyChats({ fetchAgain, setFetchAgain }) {
  const [loggedUser, setLoggedUser] = useState();
  const {
    selectedChat,
    user,
    setSelectedChat,
    chats,
    setChats,
    windowWidth,
    userDetails,
    isRefresh,
    setIsRefresh,
    notifications,
    setNotifications,
    isDarkMode,
    setIsDarkMode,
  } = ChatState();

  const userId = jwtDecode(localStorage.getItem("auth-token"));
  const [play] = useSound(message1);
  const [searchMode, setSearchMode] = useState(false);
  const [profileMode, setProfileMode] = useState(false);
  const [newGroup, setNewGroup] = useState(false);
  const [searchResult, setSearchResult] = useState([]);
  const [loading, setLoading] = useState(false);
  const [noData, setNoData] = useState(false);
  const [searchText, setSearchText] = useState("");

  const fetchChat = async () => {
    try {
      const res = await getChats();
      if (res?.ok) setChats(res?.data?.data);
    } catch (error) {
      console.log(error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("auth-token");
    window.location.href = "/auth/login";
  };

  const handleSearch = async (value) => {
    try {
      setLoading(true);
      const res = await getUsers(value);
      if (res?.ok) {
        setSearchResult(res?.data?.data);
        setNoData(res?.data?.data?.length === 0);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(searchText);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchText]);

  const accessUserChat = async (id) => {
    try {
      const chatRes = await accessChat(id);
      if (chatRes?.ok) {
        if (!chats?.find((c) => c._id === chatRes?.data?.data?._id)) {
          setChats([chatRes?.data?.data, ...chats]);
        }
        setSelectedChat(chatRes?.data?.data);
        setSearchMode(false);
      }
    } catch (error) {
      console.log(error.message);
    }
  };

  useEffect(() => {
    setLoggedUser(userId);
    fetchChat();
  }, [fetchAgain, isRefresh]);

  return (
    <Col
      className="scroll-vard"
      style={
        windowWidth <= 993
          ? selectedChat
            ? { display: "none" }
            : { display: "block" }
          : { display: "block" }
      }
      md={windowWidth <= 993 ? "12" : "4"}
      
    >
      <Card
        className={`card-user ${isDarkMode ? "bg-dark text-light" : "bg-light"}`}
      >
        <Card.Header
          className="d-flex justify-content-between align-items-center"
          style={{
            backgroundColor: isDarkMode ? "#202c33" : "#f1f1f1",
            borderBottom: "1px solid #333",
          }}
        >
          {newGroup ? (
            <>
              <FaArrowLeft
                onClick={() => setNewGroup(false)}
                style={{ cursor: "pointer", marginRight: "1rem" }}
              />
              <h6 className="m-0">Add Group Participants</h6>
            </>
          ) : profileMode ? (
            <>
              <FaArrowLeft
                onClick={() => setProfileMode(false)}
                style={{ cursor: "pointer", marginRight: "1rem" }}
              />
              <h6 className="m-0">Profile</h6>
            </>
          ) : (
            <>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                {/* <img
                  src={userDetails?.image}
                  alt="user"
                  width="40"
                  height="40"
                  className="rounded-circle"
                  style={{ cursor: "pointer" }}
                  onClick={() => setProfileMode(true)}
                /> */}
                <FaUser onClick={() => setProfileMode(true)}/>
              </div>

              <div className="d-flex align-items-center gap-3">
                <FaUsers
                  title="New Group"
                  onClick={() => setNewGroup(true)}
                  style={{ cursor: "pointer" }}
                />
                <FaSignOutAlt
                  title="Logout"
                  onClick={handleLogout}
                  style={{ cursor: "pointer" }}
                />
              </div>
            </>
          )}
        </Card.Header>

        <Card.Body style={{ padding: "8px" }}>
          {/* {newGroup ? (
            <Group />
          ) : profileMode ? (
            <ProfileModal />
          ) :  */}
          
            <>
              <InputGroup className="mb-3">
                <InputGroup.Text>
                  {searchMode ? (
                    <FaArrowLeft
                      onClick={() => {
                        setSearchMode(false);
                        setSearchText("");
                      }}
                      style={{ cursor: "pointer" }}
                    />
                  ) : (
                    <FaSearch style={{ color: "#6c757d" }} />
                  )}
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search or start a new chat"
                  value={searchText}
                  onChange={(e) => {
                    setSearchText(e.target.value);
                    setSearchMode(true);
                  }}
                />
                {searchMode && (
                  <Button
                    variant="outline-secondary"
                    onClick={() => {
                      setSearchText("");
                      setSearchMode(false);
                    }}
                  >
                    <IoMdClose />
                  </Button>
                )}
              </InputGroup>

              <div
                className="scroll-vard"
                style={{
                  maxHeight: "80vh",
                  overflowY: "auto",
                  scrollbarWidth: "none",
                }}
              >
                {loading ? (
                  <div className="text-center mt-4">
                    <Spinner animation="border" />
                  </div>
                ) : searchMode ? (
                  noData ? (
                    <p className="text-center text-muted mt-3">
                      No users found.
                    </p>
                  ) : (
                    searchResult?.map((item) => (
                      <ChatUserItem
                        key={item._id}
                        chat={item}
                        image={item.image}
                        name={item.name}
                        onClick={() => accessUserChat(item._id)}
                      />
                    ))
                  )
                ) : (
                  chats?.map((item) => (
                    <ChatUserItem
                      key={item._id}
                      chat={item}
                      image={
                        !item.isGroupChat
                          ? item.users[0]._id ===
                            jwtDecode(localStorage.getItem("auth-token")).id
                            ? item.users[1]?.image
                            : item.users[0]?.image
                          : item.image
                      }
                      name={
                        !item.isGroupChat
                          ? item.users[0]._id ===
                            jwtDecode(localStorage.getItem("auth-token")).id
                            ? item.users[1]?.name
                            : item.users[0]?.name
                          : item.chatName
                      }
                      onClick={() => {
                        setSelectedChat(item);
                        setNotifications(
                          notifications.filter(
                            (n) => n.chat._id !== item._id
                          )
                        );
                      }}
                    />
                  ))
                )}
              </div>
            </>
          {/* )} */}
        </Card.Body>
      </Card>
    </Col>
  );
}
