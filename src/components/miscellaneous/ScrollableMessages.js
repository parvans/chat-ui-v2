import React, { useRef, useState } from "react";
import { OverlayTrigger, Tooltip, Image, Button } from "react-bootstrap";
import ScrollableFeed from "react-scrollable-feed";
import moment from "moment";
import {jwtDecode} from "jwt-decode";
import { MdDone, MdDoneAll, MdAccessTime, MdKeyboardDoubleArrowDown } from "react-icons/md";

import { isLastMessage, isSameSender, isSameSenderMargin, isSameUser } from "../../config/ChatLogic";
import ReadMore from "./ReadMore";
import "./styles.css";

export default function ScrollableMessages({ messages }) {
  const uId = jwtDecode(localStorage.getItem("auth-token"))?.id;
  const [scrollUp, setScrollUp] = useState(false);
  const EndMessage = useRef(null);

  const groupedDays = messages.reduce((groups, message) => {
    const isSameorAfter = moment(message.createdAt).calendar({
      sameDay: "[Today]",
      nextDay: "[Tomorrow]",
      nextWeek: "dddd",
      lastDay: "[Yesterday]",
      lastWeek: "[Last] dddd",
      sameElse: "DD/MM/YYYY",
    });
    const date = isSameorAfter;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {});

  const groupArrays = Object.keys(groupedDays).map((date) => ({
    date,
    messages: groupedDays[date],
  }));

  const doClick = () => EndMessage.current?.scrollIntoView({ behavior: "smooth" });

  const handleScrollToFindTop = () => {
    let endMessage = EndMessage.current?.getBoundingClientRect();
    let spaceBelow = Math.floor(window.innerHeight - endMessage?.bottom - 70);
    setScrollUp(spaceBelow < -100);
  };

  return (
    <ScrollableFeed className="scroll-vard" onScroll={handleScrollToFindTop}>
      <>
        {groupArrays.map((group, index) => (
          <div key={index}>
            <div className="date">
              <span className="date-span">{group.date}</span>
            </div>
            <div className="messages">
              {group.messages.map((message, index) => (
                <div
                  key={message._id}
                  style={{
                    display: "flex",
                    position: "relative",
                    marginTop: isSameUser(group.messages, message, index, uId) ? 10 : 15,
                  }}
                >
                  {(isSameSender(group.messages, message, index, uId) ||
                    isLastMessage(group.messages, index, uId)) &&
                    message.chat.isGroupChat && (
                      <OverlayTrigger
                        placement="top"
                        overlay={<Tooltip>{message.sender.name}</Tooltip>}
                      >
                        <Image
                          src={message.sender?.image}
                          roundedCircle
                          style={{
                            width: 40,
                            height: 40,
                            marginBottom: "10px",
                            marginRight: "10px",
                          }}
                        />
                      </OverlayTrigger>
                    )}

                  <div
                    className={
                      message.sender._id === uId ? "userMessage" : "recieverMessage"
                    }
                    style={{
                      marginLeft: isSameSenderMargin(group.messages, message, index, uId),
                      position: "relative",
                    }}
                  >
                    <div className="messageContent" style={{ wordBreak: "break-word" }}>
                      <ReadMore item={message} user={uId}>
                        {message.content}
                      </ReadMore>

                      <div className="time-stamp">
                        <small>{moment(message.createdAt).format("LT")}</small>

                        {message.sender._id === uId && (
                          <>
                            {message.status === "pending" && (
                              <MdAccessTime
                                style={{
                                  fontSize: ".6879rem",
                                  color: "rgb(223 205 205)",
                                  marginLeft: "5px",
                                }}
                              />
                            )}
                            {message.status === "send" && (
                              <MdDone
                                style={{
                                  fontSize: "15px",
                                  color: "rgb(223 205 205)",
                                  marginLeft: "5px",
                                }}
                              />
                            )}
                            {message.status === "received" && (
                              <MdDoneAll
                                style={{
                                  fontSize: "15px",
                                  color: "rgb(223 205 205)",
                                  marginLeft: "5px",
                                }}
                              />
                            )}
                            {message.status === "seen" && (
                              <MdDoneAll
                                style={{
                                  fontSize: "15px",
                                  color: "rgb(0 230 255)",
                                  marginLeft: "5px",
                                }}
                              />
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div
                    className={
                      message.sender._id === uId ? "cornerRigth" : "cornerLeft"
                    }
                  ></div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {scrollUp && (
          <Button
            variant="secondary"
            id="scrollBB"
            onClick={doClick}
            style={{
              borderRadius: "50%",
              width: "40px",
              height: "40px",
              position: "absolute",
              bottom: "80px",
              right: "20px",
            }}
          >
            <MdKeyboardDoubleArrowDown style={{ fontSize: "1.4rem", color: "white" }} />
          </Button>
        )}

        <div ref={EndMessage}></div>
      </>
    </ScrollableFeed>
  );
}
