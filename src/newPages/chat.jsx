import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Typography, Box, CircularProgress } from "@mui/material"; // Using MUI for loading/error indicators
import { v4 as uuidv4 } from "uuid"; // Import uuid for temporary client-side IDs
import { ArrowPathIcon } from "@heroicons/react/24/outline";
// Define a color palette using CSS variables or Tailwind config if needed
// For simplicity, using direct Tailwind colors here

const ChatApp = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("All");
  const [activeChat, setActiveChat] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState([]);

  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [directChatLoading, setDirectChatLoading] = useState(false);
  const [error, setError] = useState(null);

  const [socket, setSocket] = useState(null);
  const [chatIdToActivate, setChatIdToActivate] = useState(null);
  const [renteeIdFromParams, setRenteeIdFromParams] = useState(null);

  const messagesEndRef = useRef(null);

  const activeChatRef = useRef(activeChat);
  const chatsRef = useRef(chats);
  const messagesRef = useRef(messages);
  const socketRef = useRef(socket);

  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);
  useEffect(() => {
    chatsRef.current = chats;
  }, [chats]);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);
  useEffect(() => {
    socketRef.current = socket;
  }, [socket]);

  // --- API and User Configuration ---
  const API_BASE_URL =
    "https://oy0bs62jx8.execute-api.us-east-1.amazonaws.com/Prod";
  const SEND_MESSAGE_ENDPOINT = `${API_BASE_URL}/v1/chat`;
  const MARK_AS_READ_ENDPOINT = `${API_BASE_URL}/v1/vehicle/read_messages`;

  const admin = JSON.parse(localStorage.getItem("admin"));

  const USER_ID =
    admin?.username ||
    admin?.userAttributes?.find((attr) => attr.Name === "sub")?.Value ||
    "";
  const USER_FIRST_NAME =
    admin?.userAttributes?.find((attr) => attr.Name === "given_name")?.Value ||
    "Admin";
  const USER_LAST_NAME =
    admin?.userAttributes?.find((attr) => attr.Name === "family_name")?.Value ||
    "User";
  const USER_BIO = "Admin";

  const WEBSOCKET_URL = `wss://0a1xxqdv9b.execute-api.us-east-1.amazonaws.com/production/?id=${USER_ID}`;

  // --- Helper to format fetched messages ---
  const formatFetchedMessages = useCallback((messagesArray) => {
    if (!Array.isArray(messagesArray)) return [];
    const formatted = messagesArray.map((msg) => ({
      id: msg.id,
      senderId: msg.sender?.id,
      content: msg.message,
      timestamp: new Date(msg.created_at).getTime(),
      media_url: msg.media_url,
      is_read: msg.is_read,
      ttl: msg.ttl,
      status: "sent",
    }));
    formatted.sort((a, b) => a.timestamp - b.timestamp);
    return formatted;
  }, []);

  // --- Helper to format messages received via WebSocket ---
  const formatWebSocketMessage = useCallback((messageData) => {
    if (
      !messageData ||
      messageData.messageContent === undefined ||
      !messageData.senderId
    )
      return null;
    return {
      id: messageData.id || `ws-msg-${Date.now()}-${Math.random()}`,
      senderId: messageData.senderId,
      content: messageData.messageContent,
      timestamp: new Date(messageData.timestamp).getTime(),
      media_url: messageData.media_url || "",
      is_read: messageData.is_read || false,
      ttl: messageData.ttl,
      status: "delivered",
    };
  }, []);

  // --- API Functions ---

  const fetchChatSessions = useCallback(
    async (userId) => {
      console.log("Fetching chat sessions for user:", userId);
      if (chatsRef.current.length === 0) setLoading(true);
      setError(null);

      if (!admin?.AccessToken) {
        console.warn(
          "Authentication token not found during fetchChatSessions."
        );
        setError("User not authenticated.");
        setLoading(false);
        setDirectChatLoading(false);
        return;
      }
      try {
        const response = await fetch(
          `${API_BASE_URL}/v1/chat/sessions/${userId}`,
          { headers: { Authorization: `Bearer ${admin.AccessToken}` } }
        );

        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({ message: "Failed to parse error response" }));
          console.error(
            "Failed to fetch chat sessions:",
            response.status,
            errorData
          );
          throw new Error(
            `Failed to load chats: ${response.status} - ${
              errorData.message || "Unknown Error"
            }`
          );
        }

        const result = await response.json();
        console.log("Chat sessions data received:", result);

        if (result && result.success && Array.isArray(result.data)) {
          const chatsWithFormattedMessages = result.data.map((chat) => ({
            ...chat,
            messages: formatFetchedMessages(chat.messages),
          }));
          setChats(chatsWithFormattedMessages);
          console.log(
            "Chats state updated successfully after fetch with formatted messages."
          );
        } else {
          console.warn(
            "Fetch chat sessions response ok but 'data' field is not an array or success is false:",
            result
          );
          setChats([]);
          console.log("Chats state set to empty array after fetch issue.");
        }
        setError(null);
      } catch (err) {
        console.error("Error fetching chat sessions:", err);
        setError(err.message);
        setChats([]);
        console.log("Chats state set to empty array after fetch error.");
      } finally {
        setLoading(false);
        setDirectChatLoading(false);
        console.log("fetchChatSessions finished.");
      }
    },
    [admin?.AccessToken, USER_ID, formatFetchedMessages]
  );

  const fetchChatSessionWithTargetUser = useCallback(
    async (
      initiatorId,
      initiatorFirst_name,
      initiatorLast_name,
      initiatorBio,
      targetId,
      targetFirst_name,
      targetLast_name,
      targetBio,
      reservationId
    ) => {
      setDirectChatLoading(true);
      setError(null);
      let foundOrCreatedChat = null;

      try {
        console.log("Attempting to fetch or create direct chat session:", {
          initiatorId,
          targetId,
          reservationId,
        });

        if (!admin?.AccessToken) {
          console.warn(
            "Authentication token not found during fetchChatSessionWithTargetUser."
          );
          setError("User not authenticated.");
          setDirectChatLoading(false);
          setChatIdToActivate(null);
          console.log(
            "fetchChatSessionWithTargetUser aborted due to missing auth token."
          );
          return;
        }

        if (!targetId) {
          console.error(
            "Target user ID is missing. Cannot check for existing chat."
          );
          setError("Target user ID missing. Cannot start chat.");
          setDirectChatLoading(false);
          setChatIdToActivate(null);
          console.log(
            "fetchChatSessionWithTargetUser aborted due to missing target ID."
          );
          return;
        }
        // --- Step 1: Check for an existing direct session ---
        console.log(
          `Checking for existing direct session between ${initiatorId} and ${targetId}`
        );
        const existingSessionResponse = await fetch(
          `${API_BASE_URL}/v1/chat/sessions/direct?participant1=${initiatorId}&participant2=${targetId}`,
          { headers: { Authorization: `Bearer ${admin.AccessToken}` } }
        );

        if (existingSessionResponse.ok) {
          const result = await existingSessionResponse.json();
          console.log("Existing session check response:", result);

          if (
            result &&
            result.success &&
            Array.isArray(result.data) &&
            result.data.length > 0
          ) {
            foundOrCreatedChat = result.data[0];
            console.log("Existing chat session found:", foundOrCreatedChat.id);
            setChatIdToActivate(foundOrCreatedChat.id);
            console.log(
              "Chat ID marked for activation:",
              foundOrCreatedChat.id
            );
          } else {
            console.log("No existing session found.");
          }
        } else if (existingSessionResponse.status === 404) {
          console.log(
            "Existing session check returned 404. No existing session found."
          );
        } else {
          const errorData = await existingSessionResponse
            .json()
            .catch(() => ({ message: "Failed to parse error response." }));
          console.error(
            "Error checking for existing chat session (non-404, non-2xx error):",
            existingSessionResponse.status,
            errorData
          );
          setError(
            `Failed to check for existing chat: ${
              errorData.message || existingSessionResponse.status
            }`
          );
          setDirectChatLoading(false);
          setChatIdToActivate(null);
          console.log(
            "fetchChatSessionWithTargetUser aborted due to existing chat check error."
          );
          return;
        }

        // --- Step 2: Create a new session ONLY IF one was not found ---
        if (!foundOrCreatedChat) {
          console.log(
            "No existing session found, attempting to create a new one."
          );
          const requestBody = {
            type: "direct",
            participantIds: [initiatorId, targetId],
            reservation_id: reservationId,
          };

          const newSessionResponse = await fetch(
            `${API_BASE_URL}/v1/chat/create/chatSessions`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${admin.AccessToken}`,
              },
              body: JSON.stringify(requestBody),
            }
          );

          if (!newSessionResponse.ok) {
            const errorData = await newSessionResponse
              .json()
              .catch(() => ({ message: "Failed to parse error response" }));
            console.error(
              "Failed to create new chat session:",
              newSessionResponse.status,
              errorData
            );
            throw new Error(
              `Failed to create chat: ${newSessionResponse.status} - ${
                errorData.message || "Unknown Error"
              }`
            );
          }

          const result = await newSessionResponse.json();
          console.log("New session created response:", result);

          if (
            result &&
            result.success &&
            result.session &&
            typeof result.session === "object" &&
            result.session !== null
          ) {
            foundOrCreatedChat = result.session;
            console.log("Newly created chat session:", foundOrCreatedChat.id);
            setChatIdToActivate(foundOrCreatedChat.id);
            console.log(
              "New chat ID marked for activation:",
              foundOrCreatedChat.id
            );
          } else {
            console.error(
              "New session response ok but 'session' field is missing or success is false:",
              result
            );
            throw new Error(
              "Failed to get new chat session data from response."
            );
          }
        }

        // --- Step 3: After finding or creating the chat, fetch all chats ---
        console.log("Fetching all chat sessions after handling direct chat.");
        await fetchChatSessions(USER_ID);
        console.log(
          "fetchChatSessionWithTargetUser finished, fetchChatSessions completed."
        );
      } catch (err) {
        console.error("Error in fetchChatSessionWithTargetUser:", err);
        setError(err.message);
        setDirectChatLoading(false);
        setChatIdToActivate(null);
        console.log("fetchChatSessionWithTargetUser finished with error.");
      } finally {
        setDirectChatLoading(false);
        console.log("fetchChatSessionWithTargetUser finally block.");
      }
    },
    [admin?.AccessToken, USER_ID, fetchChatSessions]
  );

  const deleteChatSession = useCallback(
    async (chatId) => {
      if (!window.confirm("Are you sure you want to delete this chat?")) {
        return;
      }

      try {
        console.log("Deleting chat session with ID:", chatId);
        setError(null);

        if (!admin?.AccessToken) {
          console.warn(
            "Authentication token not found during deleteChatSession."
          );
          setError("User not authenticated.");
          return;
        }

        const response = await fetch(`${API_BASE_URL}/v1/chat/${chatId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${admin.AccessToken}` },
        });

        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({ message: "Failed to parse error response" }));
          console.error(
            "Failed to delete chat session:",
            response.status,
            errorData
          );
          throw new Error(
            `Failed to delete chat session: ${response.status} - ${
              errorData.message || "Unknown Error"
            }`
          );
        }

        console.log("Chat session deleted successfully:", chatId);
        await fetchChatSessions(USER_ID);
        console.log("deleteChatSession finished, fetchChatSessions completed.");

        if (activeChatRef.current?.id === chatId) {
          console.log("Deleted active chat, clearing activeChat state.");
          setActiveChat(null);
          setMessages([]);
          setChatIdToActivate(null);
          console.log("Active chat cleared after deletion.");
        } else {
          console.log(
            "Deleted non-active chat. No need to change activeChat state."
          );
        }
        setError(null);
      } catch (err) {
        setError(err.message);
        console.error("Error deleting chat session:", err);
        alert(`Failed to delete chat: ${err.message}`);
        console.log("deleteChatSession finished with error.");
      }
    },
    [admin?.AccessToken, USER_ID, fetchChatSessions]
  );

  // --- Mark Chat As Read Function ---
  const markChatAsRead = useCallback(
    async (chatId) => {
      if (!chatId || !USER_ID || !admin?.AccessToken) {
        console.warn(
          "Cannot mark chat as read: Missing chat ID, user ID, or auth token."
        );
        return;
      }
      console.log(
        `Attempting to mark chat session ${chatId} as read for user ${USER_ID}.`
      );
      try {
        const response = await fetch(`${MARK_AS_READ_ENDPOINT}/${chatId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${admin.AccessToken}`,
          },
          body: JSON.stringify({ currentUserId: USER_ID }),
        });

        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({ message: "Failed to parse error response" }));
          console.error(
            `Failed to mark chat ${chatId} as read:`,
            response.status,
            errorData
          );
        } else {
          console.log(`Chat session ${chatId} marked as read successfully.`);
          // Refetch sessions to update unread counts in the sidebar
          // Do NOT await here if we want the UI to feel responsive
          fetchChatSessions(USER_ID).catch((err) =>
            console.error("Error refetching chats after marking as read:", err)
          );
        }
      } catch (err) {
        console.error(`Network error marking chat ${chatId} as read:`, err);
      }
    },
    [admin?.AccessToken, USER_ID, fetchChatSessions, MARK_AS_READ_ENDPOINT]
  );

  // --- WebSocket Setup Effect (Remains for Receiving Messages) ---
  useEffect(() => {
    console.log("WebSocket useEffect triggered.");

    if (!USER_ID) {
      console.warn("USER_ID not available. Cannot setup WebSocket.");
      if (
        socketRef.current &&
        socketRef.current.readyState < WebSocket.CLOSING
      ) {
        console.log("Closing WebSocket due to missing USER_ID.");
        socketRef.current.close(1000, "User ID missing");
      }
      return;
    }

    const connectWebSocket = () => {
      console.log(`Attempting to connect WebSocket to ${WEBSOCKET_URL}`);
      if (
        socketRef.current &&
        (socketRef.current.readyState === WebSocket.CONNECTING ||
          socketRef.current.readyState === WebSocket.OPEN)
      ) {
        console.log(
          "WebSocket already exists and is connecting or open via ref. Skipping creation attempt."
        );
        return;
      }

      console.log(
        `Attempting to create NEW WebSocket instance to ${WEBSOCKET_URL}`
      );
      const newSocket = new WebSocket(WEBSOCKET_URL);

      newSocket.onopen = () => {
        console.log("WebSocket connected successfully");
        setSocket(newSocket);
        setError(null);
      };

      newSocket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log("WebSocket message received:", message);

          // Handle incoming new messages from *other* users
          // We are using HTTP POST for sending our own messages now
          if (
            message.type === "message" &&
            message.event === "NEW" &&
            message.data &&
            message.data.chatId &&
            message.data.senderId &&
            message.data.messageContent !== undefined &&
            message.data.senderId !== USER_ID // <<< IMPORTANT: Only process messages from others
          ) {
            const newMessageData = message.data;
            const targetChatId = newMessageData.chatId;

            // Format the incoming WS message
            const formattedNewMessage = formatWebSocketMessage(newMessageData);
            if (!formattedNewMessage) {
              console.warn(
                "Received invalid message structure from WS:",
                newMessageData
              );
              return;
            }

            // Check if the message is for the currently active chat using ref
            if (
              activeChatRef.current &&
              targetChatId === activeChatRef.current.id
            ) {
              console.log(
                "New message for active chat received via WS, appending:",
                formattedNewMessage
              );
              setMessages((prevMessages) => {
                // Check if the message is already present (shouldn't be if senderId !== USER_ID filter works)
                if (
                  formattedNewMessage.id &&
                  prevMessages.some((msg) => msg.id === formattedNewMessage.id)
                ) {
                  console.log(
                    `Duplicate WS message ID ${formattedNewMessage.id} received (or senderId filter issue), skipping append.`
                  );
                  return prevMessages;
                }
                const updatedMessages = [...prevMessages, formattedNewMessage];
                updatedMessages.sort((a, b) => a.timestamp - b.timestamp);
                return updatedMessages;
              });
              // If a new message arrives for the *active* chat from another user, mark it as read
              markChatAsRead(targetChatId);
            } else {
              console.log(
                `New message received via WS for chat ID ${targetChatId}. This is not the active chat. Refetching sessions to update sidebar.`
              );
              // Refetch sessions to update unread counts when a new message arrives for a non-active chat
              fetchChatSessions(USER_ID).catch(console.error);
            }
          } else if (message.data?.senderId === USER_ID) {
            console.log(
              "Received WS message from self, ignoring as HTTP POST handles sends:",
              message
            );
          } else {
            console.log(
              "Received non-message or unexpected message structure via WS:",
              message
            );
            if (message.message === "Internal server error") {
              console.error(
                "Backend reported Internal server error over WebSocket."
              );
            }
          }
        } catch (e) {
          console.error(
            "Error processing WebSocket message:",
            e,
            "Raw Data:",
            event.data
          );
        }
      };

      newSocket.onclose = (event) => {
        console.log("WebSocket disconnected", event.code, event.reason);
        setSocket(null);

        if (!event.wasClean && event.code !== 1000) {
          console.warn(
            "WebSocket closed uncleanly or due to error. Attempting to reconnect in 3s..."
          );
          if (!directChatLoading) {
            setError("Chat connection lost. Reconnecting...");
          }
          setTimeout(connectWebSocket, 3000);
        } else {
          console.log("WebSocket closed cleanly.");
          setError(null);
        }
      };

      newSocket.onerror = (error) => {
        console.error("WebSocket error:", error);
        if (!directChatLoading) {
          setError("Chat connection error. Please wait for reconnect...");
        }
      };

      return newSocket;
    };

    const socketInstanceForCleanup = connectWebSocket();

    return () => {
      console.log("WebSocket useEffect cleanup: Closing socket if needed.");
      if (
        socketInstanceForCleanup &&
        socketInstanceForCleanup.readyState !== WebSocket.CLOSING &&
        socketInstanceForCleanup.readyState !== WebSocket.CLOSED
      ) {
        console.log("Closing WebSocket cleanly during cleanup.");
        socketInstanceForCleanup.close(
          1000,
          "Component Unmount/Dependency Change"
        );
      }
      console.log("WebSocket useEffect cleanup finished.");
    };
  }, [
    USER_ID,
    WEBSOCKET_URL,
    fetchChatSessions, // fetchChatSessions is called in WS handler
    directChatLoading,
    markChatAsRead, // markChatAsRead is called in WS handler
    formatWebSocketMessage,
  ]);

  // --- Send Message Via HTTP POST (Handles Optimistic Update) ---
  const sendMessageViaHttp = useCallback(
    async (chatId, senderId, text, tempId, mediaUrl = "") => {
      console.log(
        `Attempting to send message via HTTP POST to chat ${chatId} with tempId ${tempId}:`,
        text
      );

      if (!admin?.AccessToken) {
        console.warn(
          "Authentication token not found during sendMessageViaHttp."
        );
        setError("User not authenticated. Cannot send message.");
        // Mark the optimistic message as failed
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === tempId
              ? { ...msg, status: "failed", error: "Authentication Error" }
              : msg
          )
        );
        return;
      }

      try {
        const response = await fetch(SEND_MESSAGE_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${admin.AccessToken}`,
          },
          body: JSON.stringify({
            chatId: chatId,
            senderId: senderId,
            messageContent: text,
            mediaUrl: mediaUrl,
          }),
        });

        if (response.status !== 201) {
          const errorData = await response
            .json()
            .catch(() => ({ message: "Failed to parse error response" }));
          console.error(
            `Failed to send message (HTTP status ${response.status}) for tempId ${tempId}:`,
            errorData
          );
          const errorMessage =
            errorData.message ||
            `Failed to send message (status ${response.status})`;
          setError(errorMessage);
          setMessages((prevMessages) =>
            prevMessages.map((msg) =>
              msg.id === tempId
                ? { ...msg, status: "failed", error: errorMessage }
                : msg
            )
          );
        } else {
          const result = await response.json();
          console.log(
            `Message sent successfully via HTTP for tempId ${tempId}:`,
            result
          );

          if (result && result.success && result.data) {
            const serverMessageData = result.data;
            const formattedServerMessage = {
              id: serverMessageData.id,
              senderId: serverMessageData.sender?.id || senderId,
              content: serverMessageData.message,
              timestamp: new Date(serverMessageData.created_at).getTime(),
              media_url: serverMessageData.media_url,
              is_read: serverMessageData.is_read,
              ttl: serverMessageData.ttl,
              status: "sent",
            };

            setMessages((prevMessages) => {
              const index = prevMessages.findIndex((msg) => msg.id === tempId);
              if (index > -1) {
                console.log(
                  `Replacing optimistic message ${tempId} with server message ${formattedServerMessage.id}.`
                );
                const updatedMessages = [...prevMessages];
                updatedMessages[index] = formattedServerMessage;
                updatedMessages.sort((a, b) => a.timestamp - b.timestamp);
                return updatedMessages;
              } else {
                if (
                  formattedServerMessage.id &&
                  prevMessages.some(
                    (msg) => msg.id === formattedServerMessage.id
                  )
                ) {
                  console.log(
                    `Server message ${formattedServerMessage.id} already exists in state (tempId ${tempId} not found). Skipping append.`
                  );
                  return prevMessages;
                }
                console.warn(
                  `Optimistic message with tempId ${tempId} not found in state. Appending server message ${formattedServerMessage.id} as fallback.`
                );
                const updatedMessages = [
                  ...prevMessages,
                  formattedServerMessage,
                ];
                updatedMessages.sort((a, b) => a.timestamp - b.timestamp);
                return updatedMessages;
              }
            });
            setError(null);

            // --- Call fetchChatSessions here on successful send ---
            console.log("Message sent successfully, refetching chat sessions.");
            fetchChatSessions(USER_ID).catch((err) =>
              console.error(
                "Error refetching chats after successful send:",
                err
              )
            );
          } else {
            console.error(
              "Message sent response ok but 'data' field missing or success is false:",
              result
            );
            const errorMessage =
              "Failed to get sent message data from response.";
            setError(errorMessage);
            setMessages((prevMessages) =>
              prevMessages.map((msg) =>
                msg.id === tempId
                  ? { ...msg, status: "failed", error: errorMessage }
                  : msg
              )
            );
          }
        }
      } catch (err) {
        console.error(
          `Error sending message via HTTP for tempId ${tempId}:`,
          err
        );
        const errorMessage = err.message || "Failed to send message.";
        setError(errorMessage);
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === tempId
              ? { ...msg, status: "failed", error: errorMessage }
              : msg
          )
        );
      }
    },
    [admin?.AccessToken, USER_ID, SEND_MESSAGE_ENDPOINT, fetchChatSessions] // Added fetchChatSessions dependency
  );

  const sendMessage = useCallback(
    (message) => {
      const trimmedMessage = message.trim();
      if (trimmedMessage && activeChat?.id && USER_ID) {
        const tempId = `client:${uuidv4()}`; // Generate a unique client-side ID

        // 1. Add message to state optimistically
        const optimisticMessage = {
          id: tempId,
          senderId: USER_ID,
          content: trimmedMessage,
          timestamp: Date.now(), // Use client timestamp for immediate display
          media_url: "",
          is_read: true, // Your message is read by you
          ttl: undefined,
          status: "sending",
        };

        setMessages((prevMessages) => {
          const updatedMessages = [...prevMessages, optimisticMessage];
          updatedMessages.sort((a, b) => a.timestamp - b.timestamp);
          return updatedMessages;
        });
        setNewMessage(""); // Clear input field immediately
        setError(null); // Clear any previous error when starting a new send

        // 2. Send message via HTTP POST asynchronously
        sendMessageViaHttp(activeChat.id, USER_ID, trimmedMessage, tempId);
      } else if (!activeChat?.id) {
        setError("Please select a chat to send messages.");
      } else if (!USER_ID) {
        setError("User ID is not available. Cannot send message.");
      }
    },
    [sendMessageViaHttp, activeChat?.id, USER_ID]
  );

  useEffect(() => {
    console.log("Main data fetching useEffect triggered based on URL/User.");
    if (!USER_ID) {
      console.warn("USER_ID is not available. Cannot fetch chats.");
      setError("User not authenticated. Please log in as admin.");
      setLoading(false);
      setDirectChatLoading(false);
      setChats([]);
      setActiveChat(null);
      setMessages([]);
      setChatIdToActivate(null);
      setRenteeIdFromParams(null);
      console.log("Main data fetching useEffect aborted: USER_ID missing.");
      return;
    }

    const params = new URLSearchParams(location.search);
    const targetUserId = params.get("renteeId");
    const reservationId = params.get("reservationId");
    const targetUserFirstName = params.get("given_name");
    const targetUserLastName = params.get("family_name");

    console.log("targetUserId (from renteeId param):", targetUserId);

    setChatIdToActivate(null);
    setRenteeIdFromParams(targetUserId);

    if (targetUserId) {
      console.log(`Direct chat requested with target ID: ${targetUserId}`);
      fetchChatSessionWithTargetUser(
        USER_ID,
        USER_FIRST_NAME,
        USER_LAST_NAME,
        USER_BIO,
        targetUserId,
        targetUserFirstName,
        targetUserLastName,
        "User",
        reservationId
      );
    } else {
      console.log(
        "No renteeId param found. Fetching all chat sessions for admin."
      );
      fetchChatSessions(USER_ID);
    }

    return () => {
      console.log("Main data fetching useEffect cleanup.");
      if (!USER_ID) {
        console.log(
          "Main data fetching useEffect cleanup: Clearing state due to missing USER_ID."
        );
        setChats([]);
        setActiveChat(null);
        setMessages([]);
        setChatIdToActivate(null);
        setRenteeIdFromParams(null);
        setError(null);
      }
    };
  }, [
    location.search,
    USER_ID,
    USER_FIRST_NAME,
    USER_LAST_NAME,
    USER_BIO,
    admin?.AccessToken,
    fetchChatSessions,
    fetchChatSessionWithTargetUser,
  ]);

  useEffect(() => {
    console.log("Chat activation useEffect triggered.");
    console.log(
      "Current chats state IDs:",
      chats.map((c) => c.id)
    );
    console.log("Current chatIdToActivate:", chatIdToActivate);
    console.log("Current activeChat ID:", activeChat?.id);

    if (chatIdToActivate && Array.isArray(chats) && chats.length > 0) {
      console.log(
        `Attempting to find chat with ID ${chatIdToActivate} in chats list.`
      );
      const chatToSet = chats.find((chat) => chat.id === chatIdToActivate);
      if (chatToSet) {
        console.log(
          `Attempting to activate chat with ID: ${chatIdToActivate}. Found it.`
        );
        if (activeChat?.id !== chatToSet.id) {
          console.log("Setting active chat and messages from found chat.");
          setActiveChat(chatToSet);
          setMessages(chatToSet.messages || []);
          setError(null);
          markChatAsRead(chatToSet.id);
        } else {
          console.log(
            "Chat ID to activate is already the active chat. No state change needed."
          );
          const currentActiveChatInList = chats.find(
            (chat) => chat.id === activeChat.id
          );
          if (currentActiveChatInList) {
            if (
              currentActiveChatInList.messages.length !== messages.length ||
              currentActiveChatInList.messages.some((msg, i) =>
                messages[i] ? msg.id !== messages[i].id : true
              )
            ) {
              console.log(
                "Updating messages for the currently active chat based on latest fetch."
              );
              setMessages(currentActiveChatInList.messages || []);
            }
          }
          setError(null);
        }
        console.log(`Clearing chatIdToActivate (${chatIdToActivate}).`);
        setChatIdToActivate(null);
      } else {
        console.warn(
          `Chat with ID ${chatIdToActivate} not found in the fetched chats. Cannot auto-activate.`
        );
        console.log(
          `Clearing chatIdToActivate (${chatIdToActivate}) because chat was not found in the list.`
        );
        setChatIdToActivate(null);
      }
    } else if (
      chatIdToActivate === null &&
      Array.isArray(chats) &&
      chats.length > 0 &&
      !activeChat
    ) {
      console.log(
        "No specific chat requested, no active chat. Activating the first chat by default."
      );
      const firstChat = chats[0];
      setActiveChat(firstChat);
      setMessages(firstChat.messages || []);
      setError(null);
      markChatAsRead(firstChat.id);
    } else if (Array.isArray(chats) && chats.length === 0 && activeChat) {
      console.log("Chats list is empty, clearing active chat.");
      setActiveChat(null);
      setMessages([]);
      setChatIdToActivate(null);
    } else if (Array.isArray(chats) && chats.length > 0 && activeChat) {
      const currentActiveChatInList = chats.find(
        (chat) => chat.id === activeChat.id
      );
      if (currentActiveChatInList) {
        if (
          currentActiveChatInList.messages.length !== messages.length ||
          currentActiveChatInList.messages.some((msg, i) =>
            messages[i] ? msg.id !== messages[i].id : true
          )
        ) {
          console.log(
            "Updating messages for the currently active chat based on latest fetch."
          );
          setMessages(currentActiveChatInList.messages || []);
        }
      }
    } else {
      console.log(
        "Chat activation useEffect: No action needed based on current state."
      );
    }
  }, [chats, chatIdToActivate, activeChat, messages.length, markChatAsRead]);

  useEffect(() => {
    if (messagesEndRef.current && activeChat) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, activeChat]);

  const getChatDisplayName = useCallback(
    (chat) => {
      if (!chat) return "Loading Chat...";
      if (!Array.isArray(chat.participants)) {
        console.warn(
          `Chat object for ID ${chat.id} has no valid participants array.`,
          chat
        );
        return `Chat ${chat.id}` || "Unnamed Chat";
      }
      const otherParticipant = chat.participants.find((p) => p.id !== USER_ID);

      if (!otherParticipant) {
        if (chat.participants.length === 0) {
          console.warn(
            `Chat object for ID ${chat.id} has an empty participants array.`
          );
          return `Chat ${chat.id} (No Participants)` || "Unnamed Chat";
        }
        console.warn(
          `Could not find participant other than USER_ID (${USER_ID}) in chat ID ${chat.id}. Assuming chat with self.`
        );
        const selfParticipant = chat.participants.find((p) => p.id === USER_ID);
        if (selfParticipant?.first_name || selfParticipant?.last_name) {
          const selfFullName = [
            selfParticipant.first_name,
            selfParticipant.last_name,
          ]
            .filter(Boolean)
            .join(" ")
            .trim();
          if (selfFullName) return `${selfFullName} (You)`;
        }
        return `Chat ${chat.id} (Self)`;
      }

      const firstName = otherParticipant.first_name;
      const lastName = otherParticipant.last_name;
      const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();

      if (fullName) {
        return fullName;
      }

      console.warn(
        `Participant names missing/empty for chat ID ${chat.id}, participant ID ${otherParticipant.id}. Falling back to ID.`
      );
      return otherParticipant.id;
    },
    [USER_ID]
  );

  const getParticipantById = useCallback(
    (participantId) => {
      if (!activeChat || !Array.isArray(activeChat.participants)) {
        return null;
      }
      return activeChat.participants.find((p) => p.id === participantId);
    },
    [activeChat]
  );

  // --- Render Logic ---

  const showInitialLoading =
    loading && chats.length === 0 && !activeChat && !directChatLoading;
  const showDirectChatLoading = directChatLoading && !activeChat;
  const showChatWindowPlaceholder = !activeChat && !showDirectChatLoading;

  const isInputDisabled =
    !socket ||
    socket.readyState !== WebSocket.OPEN ||
    !activeChat ||
    directChatLoading;
  const isSendDisabled = !newMessage.trim() || isInputDisabled;

  if (showInitialLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        flexDirection="column"
        className="bg-gray-50"
      >
        <CircularProgress />
        <Typography sx={{ ml: 2, mt: 2 }} variant="h6" color="textSecondary">
          Loading chats...
        </Typography>
      </Box>
    );
  }

  if (
    error &&
    chats.length === 0 &&
    !loading &&
    !directChatLoading &&
    !activeChat
  ) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        flexDirection="column"
        color="error.main"
        className="bg-gray-50"
      >
        <Typography variant="h6">Error Loading Chats</Typography>
        <Typography color="error">{error}</Typography>
        <button
          onClick={() => fetchChatSessions(USER_ID)}
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading || directChatLoading}
        >
          Retry Loading Chats
        </button>
      </Box>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 -p-40 border rounded-xl overflow-hidden shadow-xl">
      {" "}
      {/* Main Container Styling */}
      {/* Sidebar - Chat List */}
      <div className="w-1/4 bg-white rounded-l-xl p-4 flex flex-col border-r border-gray-200">
        {" "}
        {/* Sidebar Styling */}
        <div className="flex items-center justify-between mb-4  pb-3">
          {" "}
          {/* Title */}
          <button
            className="p-1 text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-100 transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => fetchChatSessions(USER_ID)}
            disabled={loading || directChatLoading}
            title="Refresh Chats"
          >
            <ArrowPathIcon className="w-6 h-6 text-gray-600 " />
          </button>
        </div>
        {/* Optional Tab Section - Keeping for now */}
        <div className="flex justify-between mb-4 border-b pb-2">
          <button
            className={`flex-1 text-center p-2 text-sm ${
              activeTab === "All"
                ? "text-black font-semibold "
                : "text-gray-600 hover:text-gray-800"
            }`}
            onClick={() => setActiveTab("All")}
          >
            All Chats
          </button>
          {/* Add other tabs like "Groups" here if needed */}
        </div>
        {(loading || (directChatLoading && chats.length === 0)) && !error && (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            minHeight="100px"
          >
            <CircularProgress size={20} />
          </Box>
        )}
        {error &&
          !loading &&
          !directChatLoading &&
          Array.isArray(chats) &&
          chats.length > 0 && (
            <div className="text-center text-red-500 text-sm mb-4">
              Error listing chats: {error}
            </div>
          )}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {" "}
          {/* Added custom-scrollbar class */}
          {Array.isArray(chats) && chats.length > 0
            ? chats.map((chat) => {
                if (!chat || !chat.id) {
                  console.warn("Skipping chat item due to missing ID:", chat);
                  return null;
                }
                if (!Array.isArray(chat.participants)) {
                  console.warn(
                    `Skipping chat ${chat.id} in list render: participants is not an array.`,
                    chat
                  );
                  return null;
                }

                const otherParticipant = chat.participants.find(
                  (p) => p.id !== USER_ID
                );
                const avatarUrl = otherParticipant?.avatar;
                const displayChat_name = getChatDisplayName(chat);

                const latestMessage =
                  Array.isArray(chat.messages) && chat.messages.length > 0
                    ? chat.messages[chat.messages.length - 1]
                    : null;

                const lastMessageContent = latestMessage
                  ? latestMessage.content
                  : "No messages yet";
                const lastMessageTimestamp = latestMessage
                  ? latestMessage.timestamp
                  : null;

                const hasUnread =
                  Array.isArray(chat.messages) &&
                  chat.messages.some(
                    (msg) => msg.senderId !== USER_ID && !msg.is_read
                  );

                return (
                  <div
                    key={chat.id}
                    className={`flex items-center p-3 mb-3 rounded-lg cursor-pointer transition duration-200 ease-in-out ${
                      activeChat?.id === chat.id
                        ? "bg-blue-100"
                        : "bg-gray-50 hover:bg-gray-100"
                    }`}
                    onClick={() => {
                      console.log("Chat sidebar clicked:", chat.id);
                      if (activeChat?.id !== chat.id) {
                        setActiveChat(chat);
                        setMessages(chat.messages || []);
                        setError(null);
                        markChatAsRead(chat.id);
                      } else {
                        setMessages(chat.messages || []);
                        console.log(
                          "Clicked active chat, messages state should already be up-to-date from fetch."
                        );
                      }
                      setChatIdToActivate(null);
                    }}
                  >
                    {/* Profile Picture / Avatar */}
                    <div className="w-12 h-12 rounded-full mr-4 object-cover flex-shrink-0 shadow-sm">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt={displayChat_name || "Avatar"}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-blue-500 flex items-center justify-center text-white font-bold text-xl rounded-full">
                          {displayChat_name
                            ? displayChat_name.charAt(0).toUpperCase()
                            : "?"}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <div className="font-semibold text-sm text-gray-800 truncate flex items-center">
                        {displayChat_name}
                        {hasUnread && (
                          <span className="ml-2 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-medium">
                            New
                          </span>
                        )}
                      </div>
                      <div className="text-gray-500 text-xs truncate mt-0.5">
                        {lastMessageContent}
                      </div>
                    </div>
                    {lastMessageTimestamp && (
                      <div className="text-gray-400 text-xs ml-2 flex-shrink-0 self-start">
                        {!isNaN(new Date(lastMessageTimestamp).getTime())
                          ? new Date(lastMessageTimestamp).toLocaleTimeString(
                              [],
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )
                          : ""}
                      </div>
                    )}
                  </div>
                );
              })
            : !loading &&
              !directChatLoading &&
              Array.isArray(chats) &&
              chats.length === 0 && (
                <div className="text-center text-gray-500 mt-8 text-sm">
                  No chats available
                </div>
              )}
        </div>
      </div>
      {/* Chat Window */}
      {showChatWindowPlaceholder ? (
        <div className="flex-1 bg-white rounded-r-xl p-6 flex flex-col items-center justify-center text-gray-500 border-l border-gray-200">
          {showDirectChatLoading ? (
            <div className="flex flex-col items-center">
              <CircularProgress className="mb-4" />
              <Typography variant="h6" color="textSecondary">
                Loading or creating chat...
              </Typography>
              {error && renteeIdFromParams && (
                <Typography
                  variant="body2"
                  color="error"
                  className="mt-4 text-center"
                >
                  Error setting up chat with rentee: {error}
                </Typography>
              )}
              {error && !renteeIdFromParams && (
                <Typography
                  variant="body2"
                  color="error"
                  className="mt-4 text-center"
                >
                  Error: {error}
                </Typography>
              )}
            </div>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-16 h-16 mb-4 text-gray-400"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H15.75m2.25-4.125a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H18m2.25 4.125c0 1.15-.19 2.23-.53 3.219L16.5 18a2.25 2.25 0 0 1-1.875 1.039V21.75l-1.581-1.581a1.5 1.5 0 0 0-1.14-.44L9.75 20.25a3.733 3.733 0 0 0-.45-1.495l-1.413 1.413zm-1.413-1.413L5.416 16.17A9.75 9.75 0 0 1 3 12.375V4.5c0-1.036.84-1.875 1.875-1.875h15C20.16 2.625 21 3.464 21 4.5v7.875c0 1.035-.84 1.875-1.875 1.875h-4.5Z"
                />
              </svg>
              <Typography
                variant="h6"
                color="textSecondary"
                className="text-center"
              >
                Select a chat from the sidebar to view messages
              </Typography>
              {error &&
                renteeIdFromParams &&
                !loading &&
                !directChatLoading &&
                !activeChat &&
                Array.isArray(chats) &&
                chats.length > 0 && (
                  <Typography
                    variant="body2"
                    color="error"
                    className="mt-4 text-center"
                  >
                    Could not find or create a chat with the specified user.
                    Error: {error}. Please try selecting an existing chat.
                  </Typography>
                )}
              {error &&
                renteeIdFromParams &&
                !loading &&
                !directChatLoading &&
                !activeChat &&
                Array.isArray(chats) &&
                chats.length === 0 && (
                  <Typography
                    variant="body2"
                    color="error"
                    className="mt-4 text-center"
                  >
                    Could not set up chat with the specified user. Error:{" "}
                    {error}. No other chats available.
                  </Typography>
                )}
            </>
          )}
        </div>
      ) : (
        // Chat Window - Active Chat View
        <div className="flex-1 bg-white rounded-r-xl p-6 flex flex-col border-l border-gray-200">
          {error && !showDirectChatLoading && (
            <div className="text-center text-red-500 mb-4 text-sm">
              Error: {error}
            </div>
          )}
          <div className="flex items-center mb-4 border-b pb-4">
            <div className="text-xl font-bold text-gray-800 flex-1">
              {getChatDisplayName(activeChat)}
            </div>
            {/* {activeChat?.id && (
              <button
                className="ml-auto text-red-500 hover:text-red-700 text-sm p-1 rounded-md hover:bg-red-100 transition duration-150 ease-in-out"
                onClick={() => deleteChatSession(activeChat.id)}
                title="Delete Chat"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.924a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.14-2.006-2.292a48.078 48.078 0 0 0-1.91-.148 48.078 48.078 0 0 0-1.91.148C9.11 2.55 8.2 3.51 8.2 4.694v.916m12 0a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-.75.75H5.25a.75.75 0 0 1-.75-.75v-1.5a.75.75 0 0 1-.75-.75m6.75 0H12"
                  />
                </svg>
              </button>
            )} */}
          </div>

          {/* Messages Display Area */}
          <div className="flex-1 overflow-y-auto mb-4 space-y-4 p-2 custom-scrollbar">
            {messages.length > 0 ? (
              messages.map((msg, index) => {
                const senderId = msg.senderId;
                const isSentByCurrentUser = senderId === USER_ID;
                const senderParticipant = getParticipantById(senderId);
                const senderName = senderParticipant
                  ? [senderParticipant.first_name, senderParticipant.last_name]
                      .filter(Boolean)
                      .join(" ") || senderId
                  : senderId || "Unknown Sender";

                return (
                  <div
                    key={msg.id || `msg-${index}`}
                    className={`flex my-4 ${
                      isSentByCurrentUser ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`flex items-end ${
                        isSentByCurrentUser ? "" : "flex-row-reverse"
                      }`}
                    >
                      {" "}
                      {/* Reverse flex for received message layout */}
                      {/* Avatar */}
                      {(isSentByCurrentUser
                        ? getParticipantById(USER_ID)?.avatar
                        : senderParticipant?.avatar) && (
                        <img
                          src={
                            isSentByCurrentUser
                              ? getParticipantById(USER_ID)?.avatar
                              : senderParticipant?.avatar
                          }
                          alt={isSentByCurrentUser ? "You" : senderName}
                          className={`w-8 h-8 rounded-full object-cover shadow-sm flex-shrink-0 ${
                            isSentByCurrentUser ? "ml-2" : "mr-2"
                          }`}
                        />
                      )}
                      <div
                        className={`max-w-[50%] p-3 bg-blue-500  rounded-xl shadow-sm break-words flex flex-col ${
                          // Applied max-w-[50%], added flex-col for status below
                          isSentByCurrentUser
                            ? "bg-[#04FFBB] text-white rounded-br-none" // Darker blue for sent
                            : "bg-gray-200 text-gray-800 rounded-bl-none" // Lighter gray for received, darker text
                        } ${
                          msg.status === "failed" ? "border border-red-500" : ""
                        }`}
                      >
                        {msg.content} {/* Use standardized content field */}
                        {/* Sending status */}
                        {msg.status === "sending" && (
                          <div className="text-[10px] mt-1 text-blue-200 self-end">
                            Sending...
                          </div> // Status aligned to end
                        )}
                        {msg.status === "failed" && (
                          <div
                            className="text-[10px] mt-1 text-red-300 self-end"
                            title={msg.error}
                          >
                            Failed!
                          </div> // Status aligned to end
                        )}
                        {/* Timestamp */}
                        {msg.timestamp &&
                          !isNaN(new Date(msg.timestamp).getTime()) && (
                            <div
                              className={`text-[10px] mt-1 ${
                                isSentByCurrentUser
                                  ? "text-blue-300" // Lighter timestamp for sent
                                  : "text-gray-500" // Darker timestamp for received
                              } self-end`}
                            >
                              {new Date(msg.timestamp).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center text-gray-500 italic mt-8 text-sm">
                No messages yet. Start the conversation!
              </div>
            )}
            {/* Ref for auto-scrolling */}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Reply Buttons */}
          <div className="flex space-x-2 mb-4 overflow-x-auto pb-2">
            {[
              "Let's do it!",
              "Great!",
              "When are you available?",
              "Sounds good",
            ].map((reply, index) => (
              <button
                key={index}
                className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full hover:bg-blue-200 text-sm flex-shrink-0 transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => sendMessage(reply)}
                disabled={isSendDisabled}
              >
                {reply}
              </button>
            ))}
          </div>

          {/* Message Input Area */}
          <div className="flex items-center bg-gray-100 p-3 rounded-lg shadow-inner">
            {" "}
            {/* Adjusted padding/rounding */}
            <input
              type="text"
              placeholder={
                isInputDisabled
                  ? !socket ||
                    (socket.readyState !== WebSocket.OPEN &&
                      socket.readyState !== WebSocket.CONNECTING)
                    ? "Chat service unavailable"
                    : "Connecting to chat service..."
                  : !activeChat
                  ? "Select a chat to type"
                  : "Type your message..."
              }
              className="flex-1 bg-transparent outline-none px-3 text-sm text-gray-800 placeholder-gray-500"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage(newMessage)}
              disabled={isInputDisabled}
            />
            <button
              className="ml-3 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out"
              onClick={() => sendMessage(newMessage)}
              disabled={isSendDisabled}
              title="Send Message"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5 transform rotate-90"
              >
                <path d="M3.478 2.405a.75.75 0 0 0-.926.94l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 109.817 109.817 0 0 0 3.58-1.139L15.15 18a.75.75 0 0 0 1.404-.128 9.74 9.74 0 0 0 5.634-4.35.75.75 0 0 0 0-.752 9.74 9.74 0 0 0-5.634-4.35.75.75 0 0 0-1.404-.128L7.065 3.544a109.817 109.817 0 0 0-3.58-1.139Z" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatApp;
