import React, { useState, useEffect } from "react";
import image from "../assets/avatar.png"; // Assuming this path is correct for a placeholder image
import { useLocation } from "react-router-dom"; // Assuming react-router-dom is installed

const ChatApp = () => {
  const location = useLocation(); // Hook to access URL parameters
  const [activeTab, setActiveTab] = useState("All"); // State for managing sidebar tabs
  const [activeChat, setActiveChat] = useState(null); // State for the currently selected chat session
  const [newMessage, setNewMessage] = useState(""); // State for the input field message
  const [chats, setChats] = useState([]); // State for the list of chat sessions in the sidebar
  const [messages, setMessages] = useState([]); // State for messages in the active chat
  const [loading, setLoading] = useState(false); // State for general loading indicator
  const [error, setError] = useState(null); // State for handling errors
  const [socket, setSocket] = useState(null); // State for the WebSocket connection
  const [renteeIdFromParams, setRenteeIdFromParams] = useState(null); // State to track if we came from a direct link
  // State to temporarily hold the ID of the chat that should be active after fetching chats
  const [chatIdToActivate, setChatIdToActivate] = useState(null);

  // --- API and User Configuration ---
  const API_BASE_URL =
    "https://oy0bs62jx8.execute-api.us-east-1.amazonaws.com/Prod"; // Your API Gateway URL

  // Assuming 'customer' object is stored in localStorage after login/auth
  const customer = JSON.parse(localStorage.getItem("admin"));

  // Extract user ID from customer object (adjust based on your auth structure)
  const USER_ID =
    customer?.userAttributes?.find((attr) => attr.Name === "sub")?.Value || "";
  // Extract user name details (adjust based on your auth structure)
  const USER_FIRST_NAME =
    customer?.userAttributes?.find((attr) => attr.Name === "given_name")
      ?.Value || "";
  const USER_LAST_NAME =
    customer?.userAttributes?.find((attr) => attr.Name === "family_name")
      ?.Value || "";
  // Placeholder bio - replace with actual user profile data if available
  const USER_BIO = "Rentee"; // Example placeholder

  // WebSocket URL with user ID
  const WEBSOCKET_URL = `wss://0a1xxqdv9b.execute-api.us-east-1.amazonaws.com/production/?id=${USER_ID}`;

  // --- Effects ---

  // Effect to handle initial load and URL parameter changes
  useEffect(() => {
    // Ensure USER_ID is available before proceeding
    if (!USER_ID) {
      console.warn(
        "USER_ID is not available. Cannot fetch chats or setup WebSocket."
      );
      setError("User not authenticated."); // Set an error state
      return; // Exit the effect if user ID is missing
    }

    const params = new URLSearchParams(location.search);
    const renteeId = params.get("renteeId");
    const reservationId = params.get("reservationId");
    const given_name = params.get("given_name");
    const family_name = params.get("family_name");

    setRenteeIdFromParams(renteeId); // Keep track if we came from a direct link

    if (renteeId) {
      // *** IMPORTANT: You MUST fetch the details (first_name, last_name, bio) of the renteeId here ***
      // This is crucial for the POST request to create a new chat session if one doesn't exist.
      // Replace this placeholder logic with an actual API call to get rentee details.
      const renteeDetails = {
        id: renteeId,
        first_name: given_name, // Placeholder - REPLACE with actual data fetch
        last_name: family_name, // Placeholder - REPLACE with actual data fetch
        bio: "Rentee", // Placeholder - REPLACE with actual data fetch
      };

      // Call the function to fetch or create the direct chat session
      fetchChatSessionWithRentee(
        USER_ID,
        USER_FIRST_NAME,
        USER_LAST_NAME,
        USER_BIO, // Current user's details
        renteeDetails.id,
        renteeDetails.first_name,
        renteeDetails.last_name,
        renteeDetails.bio, // Rentee's details
        reservationId // Reservation ID
      );
    } else {
      // If no renteeId param, just fetch all sessions for the current user
      fetchChatSessions(USER_ID);
    }

    // Setup WebSocket connection
    setupWebSocket();

    // Cleanup function for WebSocket connection when the component unmounts or dependencies change
    return () => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        console.log("Cleaning up WebSocket connection.");
        socket.close();
      }
    };

    // Dependencies for this effect:
    // location.search: To react to changes in URL parameters
    // USER_ID, USER_FIRST_NAME, USER_LAST_NAME, USER_BIO: Needed for fetching/creating chats
    // socket: To ensure the cleanup function is correct if the socket instance changes
    // renteeIdFromParams: The logic inside depends on this state
  }, [location.search, USER_ID, USER_FIRST_NAME, USER_LAST_NAME, USER_BIO]); // Removed socket from dependencies to prevent unnecessary reconnects

  // Effect to set the active chat after the chats list is updated
  useEffect(() => {
    console.log(
      "useEffect [chats, chatIdToActivate, renteeIdFromParams, activeChat] triggered."
    );
    console.log(
      "Current chats state:",
      chats.map((c) => c.id)
    );
    console.log("Current chatIdToActivate:", chatIdToActivate);
    console.log("Current renteeIdFromParams:", renteeIdFromParams);
    console.log("Current activeChat ID:", activeChat?.id);

    // If there's a chat ID we intended to activate from a direct link
    if (chatIdToActivate && chats.length > 0) {
      console.log(`Attempting to activate chat with ID: ${chatIdToActivate}`);
      // Find the chat object in the updated chats list
      const chatToSet = chats.find((chat) => chat.id === chatIdToActivate);
      if (chatToSet) {
        console.log("Found chat to activate:", chatToSet.id);
        setActiveChat(chatToSet); // Set it as the active chat
        setMessages(chatToSet.messages || []); // Set its messages
        // Clear the temporary state after setting the active chat
        setChatIdToActivate(null);
      } else {
        // If the specific chat wasn't found (e.g., deleted before fetching completed)
        console.warn(
          `Chat with ID ${chatIdToActivate} not found in the fetched chats.`
        );
        // Decide on fallback: activate the first chat, or clear active chat
        if (chats.length > 0 && !activeChat) {
          // Only activate first if no chat is currently active
          console.log("Activating the first chat in the list as fallback.");
          setActiveChat(chats[0]);
          setMessages(chats[0].messages || []);
        } else if (!activeChat) {
          // If no chats available at all, ensure active chat is null
          setActiveChat(null);
          setMessages([]);
        }
        setChatIdToActivate(null); // Clear the temporary state
      }
    } else if (!renteeIdFromParams && chats.length > 0 && !activeChat) {
      // If we did NOT come from a direct link AND there are chats AND no chat is currently active
      // Automatically activate the first chat in the list
      console.log("Activating the first chat by default.");
      setActiveChat(chats[0]);
      setMessages(chats[0].messages || []);
    } else if (!renteeIdFromParams && chats.length === 0) {
      // If we did NOT come from a direct link AND there are NO chats available
      // Ensure no chat is active
      console.log("No chats available, clearing active chat.");
      setActiveChat(null);
      setMessages([]);
    }

    // Dependencies for this effect:
    // chats: To react when the list of chats is updated
    // chatIdToActivate: To react when a specific chat is marked for activation
    // renteeIdFromParams: The logic depends on whether we came from a direct link
    // activeChat: To avoid unnecessarily resetting the active chat if one is already selected
  }, [chats, chatIdToActivate, renteeIdFromParams, activeChat]);

  // Effect to update messages state when activeChat changes
  // This effect is less critical now as messages are set when activeChat is determined in the effect above,
  // but it can be useful if activeChat is set directly elsewhere.
  useEffect(() => {
    console.log("Active Chat changed:", activeChat?.id);
    // Set messages based on the messages array within the activeChat object
    setMessages(activeChat?.messages || []);
  }, [activeChat]); // Dependency: activeChat

  // --- API Call Functions ---

  // Function to fetch all chat sessions for the current user
  const fetchChatSessions = async (userId) => {
    setLoading(true); // Start loading indicator
    setError(null); // Clear previous errors
    try {
      console.log("Fetching chat sessions for user:", userId);
      const response = await fetch(
        `${API_BASE_URL}/v1/chat/sessions/${userId}`, // Endpoint to get all sessions for a user
        {
          headers: {
            // Include Authorization header
            Authorization: `Bearer ${customer.AccessToken}`,
          },
        }
      );

      // Check if the response was successful
      if (!response.ok) {
        const errorData = await response.json();
        console.error(
          "Failed to fetch chat sessions:",
          response.status,
          errorData
        );
        // Throw an error to be caught by the catch block
        throw new Error(
          `Failed to fetch chat sessions: ${response.status} - ${
            errorData.message || "Unknown Error"
          }`
        );
      }

      const result = await response.json(); // Assume result has { success: true, data: [...] }
      console.log("Chat sessions data received:", result);

      // Check if the API call was successful and 'data' is an array
      if (result && result.success && Array.isArray(result.data)) {
        // Corrected: Use result.data
        // Set the chats state with the array of chat sessions from the 'data' field
        setChats(result.data); // Corrected: Use result.data
      } else {
        // Corrected warning message
        console.warn(
          "Fetch chat sessions response ok but 'data' field is not an array or success is false:",
          result
        );
        setChats([]); // Set chats to empty array if data is not as expected
      }

      // Logic for setting active chat is now primarily handled in the effect above
      // which waits for `chats` to be updated.
    } catch (err) {
      // Handle errors during the fetch
      setError(err.message);
      console.error("Error fetching chat sessions:", err);
      setChats([]); // Clear chats on error
      setActiveChat(null); // Clear active chat on error
      setMessages([]); // Clear messages on error
    } finally {
      // Stop loading indicator regardless of success or failure
      setLoading(false);
    }
  };

  // Function to fetch or create a direct chat session with a specific rentee
  const fetchChatSessionWithRentee = async (
    ownerId,
    ownerFirstName,
    ownerLastName,
    ownerBio, // Current user's details (owner in this context)
    renteeId,
    renteeFirstName,
    renteeLastName,
    renteeBio, // Other participant's details (rentee)
    reservationId // Associated reservation ID
  ) => {
    setLoading(true); // Start loading indicator
    setError(null); // Clear previous errors
    let foundOrCreatedChat = null; // Variable to hold the session object once found or created

    try {
      console.log("Attempting to fetch or create direct chat session:", {
        ownerId,
        renteeId,
        reservationId,
      });

      // --- Step 1: Check for an existing direct session ---
      // Assuming this endpoint checks for a direct chat between two specific participants
      const existingSessionResponse = await fetch(
        `${API_BASE_URL}/v1/chat/sessions/direct?participant1=${ownerId}&participant2=${renteeId}`,
        {
          headers: {
            Authorization: `Bearer ${customer.AccessToken}`,
          },
        }
      );

      if (existingSessionResponse.ok) {
        const result = await existingSessionResponse.json(); // Assume result has { success: true, session: {...} | null }
        console.log("Existing session check response:", result);

        // Check if the API call was successful and 'session' is an object
        if (result && result.success && result.session) {
          foundOrCreatedChat = result.session; // Get the single chat session object
          console.log("Existing chat session found:", foundOrCreatedChat.id);
          setChatIdToActivate(foundOrCreatedChat.id); // Mark this chat's ID to be activated later
        } else if (existingSessionResponse.status !== 404) {
          // Log potential issues if response is 200 but success/session is unexpected (e.g., session is null)
          console.warn(
            "Existing session response ok but 'session' field is null or success is false:",
            result
          );
        }
      } else if (existingSessionResponse.status !== 404) {
        // Handle errors other than 404 (Not Found) during the check
        const errorData = await existingSessionResponse.json();
        console.error(
          "Error checking for existing chat session (status not 404):",
          existingSessionResponse.status,
          errorData
        );
        // Decide whether to throw an error here or attempt to create a new one anyway.
        // For now, we log the error and proceed to try creating if foundOrCreatedChat is still null.
      } else {
        console.log("No existing session found (status 404).");
      }

      // --- Step 2: Create a new session if one was not found ---
      if (!foundOrCreatedChat) {
        // Only create if we didn't find an existing one
        console.log(
          "No existing session found, attempting to create a new one."
        );
        const newSessionResponse = await fetch(
          `${API_BASE_URL}/v1/chat/create/chatSessions`, // Endpoint to create a new session
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${customer.AccessToken}`,
            },
            body: JSON.stringify({
              type: "direct", // Type of chat session
              participants: [
                // Array of participants
                {
                  id: ownerId,
                  firstName: ownerFirstName,
                  lastName: ownerLastName,
                  bio: ownerBio,
                },
                {
                  id: renteeId,
                  firstName: renteeFirstName, // *** REPLACE with actual data fetch ***
                  lastName: renteeLastName, // *** REPLACE with actual data fetch ***
                  bio: renteeBio, // *** REPLACE with actual data fetch ***
                },
              ],
              reservation_id: reservationId, // Associated reservation ID
            }),
          }
        );

        // Check if the response for creating a new session was successful
        if (!newSessionResponse.ok) {
          const errorData = await newSessionResponse.json();
          console.error(
            "Failed to create new chat session:",
            newSessionResponse.status,
            errorData
          );
          // Throw an error to be caught by the catch block
          throw new Error(
            `Failed to create new chat session: ${
              newSessionResponse.status
            } - ${errorData.message || "Unknown Error"}`
          );
        }

        const result = await newSessionResponse.json(); // Assume result has { success: true, session: {...} }
        console.log("New session created response:", result);

        // Check if the API call was successful and 'session' contains the new chat session object
        if (result && result.success && result.session) {
          foundOrCreatedChat = result.session; // Get the new chat session object
          console.log("Newly created chat session:", foundOrCreatedChat.id);
          setChatIdToActivate(foundOrCreatedChat.id); // Mark this new chat's ID to be activated later
        } else {
          console.error(
            "New session response ok but 'session' field is missing or success is false:",
            result
          );
          throw new Error("Failed to get new chat session data from response.");
        }
      }

      // --- Step 3: After finding or creating the chat, fetch all chats ---
      // This is crucial to ensure the sidebar is updated with the new/existing chat
      // and that the chat object we want to activate exists within the 'chats' state.
      console.log("Fetching all chat sessions after handling direct chat.");
      await fetchChatSessions(USER_ID); // Wait for this fetch to complete
    } catch (err) {
      // Handle any errors that occurred during the process
      setError(err.message);
      console.error("Error in fetchChatSessionWithRentee:", err);
      // Ensure loading is false and active chat is cleared on error
      setLoading(false);
      setActiveChat(null);
      setMessages([]);
      setChatIdToActivate(null); // Clear activation intent on error
    } finally {
      // Loading state is primarily managed by fetchChatSessions called within this function,
      // or set to false immediately if an error occurs.
      // This finally block might not be strictly necessary for loading state if fetchChatSessions handles it.
      // If fetchChatSessions fails or isn't called, ensure loading is set to false here.
      if (loading) setLoading(false);
    }
  };

  // Function to delete a chat session
  const deleteChatSession = async (chatId) => {
    // Optional: Add a confirmation dialog before deleting
    if (!window.confirm("Are you sure you want to delete this chat?")) {
      return; // If user cancels, do nothing
    }

    try {
      console.log("Deleting chat session with ID:", chatId);
      // You might want to set a loading state specifically for deletion here
      // setLoadingDeleting(true);
      const response = await fetch(`${API_BASE_URL}/v1/chat/${chatId}`, {
        method: "DELETE", // Use DELETE method
        headers: {
          Authorization: `Bearer ${customer.AccessToken}`, // Include Authorization header
        },
      });

      // Check if the response was successful
      if (!response.ok) {
        const errorData = await response.json();
        console.error(
          "Failed to delete chat session:",
          response.status,
          errorData
        );
        // Throw an error to be caught by the catch block
        throw new Error(
          `Failed to delete chat session: ${response.status} - ${
            errorData.message || "Unknown Error"
          }`
        );
      }

      console.log("Chat session deleted successfully:", chatId);

      // After deletion, refetch the updated list of chat sessions to update the sidebar
      fetchChatSessions(USER_ID);

      // If the deleted chat was the active one, clear the active chat and messages
      if (activeChat?.id === chatId) {
        console.log("Deleted active chat, clearing activeChat state.");
        setActiveChat(null);
        setMessages([]);
      }
    } catch (err) {
      // Handle errors during deletion
      setError(err.message);
      console.error("Error deleting chat session:", err);
      alert(`Failed to delete chat: ${err.message}`); // Provide user feedback
    } finally {
      // Stop deletion loading indicator if used
      // setLoadingDeleting(false);
    }
  };

  // --- WebSocket Setup ---

  const setupWebSocket = () => {
    // Ensure only one socket connection is open at a time
    if (socket && socket.readyState !== WebSocket.CLOSED) {
      console.log(
        "Existing WebSocket found and is not closed, closing before creating new."
      );
      socket.close();
    }

    const newSocket = new WebSocket(WEBSOCKET_URL);

    // Event handler for when the WebSocket connection is opened
    newSocket.onopen = () => {
      console.log("WebSocket connected successfully");
      // You might want to send an initial message or presence update here
    };

    // Event handler for receiving messages from the WebSocket
    newSocket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log("WebSocket message received:", message);

        // Assuming new message events have type 'message', event 'NEW', and message data in 'data' field
        if (
          message.type === "message" &&
          message.event === "NEW" &&
          message.data
        ) {
          const newMessageData = message.data; // The actual message object
          const targetChatId = message.chatId; // The ID of the chat this message belongs to

          // Check if the new message belongs to the currently active chat
          if (activeChat && targetChatId === activeChat.id) {
            console.log(
              "New message for active chat, appending to messages state:",
              newMessageData
            );
            // Append the new message to the messages state for the active chat
            setMessages((prevMessages) => {
              // Prevent duplicate messages if the API also returns the new message
              if (prevMessages.some((msg) => msg.id === newMessageData.id)) {
                console.log("Duplicate message received, not appending.");
                return prevMessages;
              }
              return [...prevMessages, newMessageData];
            });
            // Optional: Scroll to the bottom of the chat window
            // You would need a ref for the messages container div to do this.
          } else {
            // If the message is for a different chat or no chat is active, refetch sessions
            // This updates the sidebar to show the new message and potentially an unread indicator
            console.log(
              `New message for chat ID ${targetChatId}. Refetching sessions.`
            );
            fetchChatSessions(USER_ID);
          }
        } else {
          console.log(
            "Received non-message or unexpected message structure:",
            message
          );
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

    // Event handler for when the WebSocket connection is closed
    newSocket.onclose = (event) => {
      console.log("WebSocket disconnected", event.code, event.reason);
      // You might want to implement a reconnect logic here after a delay
      setSocket(null); // Clear socket state on close
    };

    // Event handler for WebSocket errors
    newSocket.onerror = (error) => {
      console.error("WebSocket error:", error);
      // Close the socket on error to trigger the onclose handler
      if (newSocket.readyState === WebSocket.OPEN) {
        newSocket.close();
      }
      setError("Chat connection error. Please try refreshing."); // Inform the user
    };

    // Set the new socket instance in state
    setSocket(newSocket);

    // The cleanup function is now handled in the main useEffect
  };

  // --- Message Sending ---

  // Function to send a message via WebSocket
  const sendWebSocketMessage = (message) => {
    console.log("Attempting to send message via WebSocket.");
    console.log("Active Chat:", activeChat);
    console.log(
      "WebSocket readyState:",
      socket ? socket.readyState : "Socket not initialized"
    );

    // Check if socket is open and an active chat is selected
    if (
      socket &&
      socket.readyState === WebSocket.OPEN &&
      activeChat &&
      activeChat.id
    ) {
      const messageObject = {
        action: "v1/chat", // Assuming this is the correct action for sending messages
        chatId: activeChat.id, // ID of the active chat
        senderId: USER_ID, // ID of the current user (sender)
        messageContent: message, // The message content
        // You might need to include a timestamp or other fields depending on your backend
        // timestamp: new Date().toISOString(),
      };
      console.log("Message object being sent:", messageObject);
      socket.send(JSON.stringify(messageObject)); // Send the message as a JSON string
      setNewMessage(""); // Clear the input field after sending
    } else if (!socket || socket.readyState !== WebSocket.OPEN) {
      console.warn("Cannot send message: WebSocket is not open.");
      alert("Chat service not connected. Please try again later."); // User feedback
    } else if (!activeChat || !activeChat.id) {
      console.warn(
        "Cannot send message: No active chat or chat ID is undefined."
      );
      alert("Please select or open a chat session first."); // User feedback
    }
  };

  // Handler for sending a message (triggered by button click or Enter key)
  const sendMessage = (message) => {
    // Prevent sending empty messages
    if (message.trim()) {
      sendWebSocketMessage(message);
    }
  };

  // --- Render Logic ---

  // Display loading indicator if chats are being fetched initially or during direct chat logic
  // Use a more specific check to avoid showing "Loading chats..." indefinitely if there are no chats
  if (loading && chats.length === 0 && !activeChat)
    return (
      <div className="flex justify-center items-center h-screen">
        Loading chats...
      </div>
    );
  // Display error message if an error occurred
  if (error)
    return (
      <div className="flex justify-center items-center h-screen text-red-600">
        Error: {error}
      </div>
    );

  return (
    // Main container with flex layout for sidebar and chat window
    <div className="flex   pb-10 h-screen gap-10">
      {/* Sidebar - Chat List */}
      <div className="w-1/4 bg-white shadow-lg rounded-xl p-4 flex flex-col">
        {" "}
        {/* Added flex-col */}
        {/* Tabs */}
        <div className="flex justify-between mb-4  pb-2">
          {" "}
          {/* Added border-b */}
          <button
            className={`flex-1 text-center p-2 ${
              activeTab === "All"
                ? "text-black font-bold border-b-2 border-black ``"
                : "text-gray-500"
            }`}
            onClick={() => setActiveTab("All")}
          >
            All
          </button>
          <button
            className={`flex-1 text-center p-2 ${
              activeTab === "Chat Support"
                ? "text-black font-bold border-b-2 border-black"
                : "text-gray-500"
            }`}
            onClick={() => setActiveTab("Chat Support")}
          >
            Chat Support
          </button>
        </div>
        {/* Chat List Scrollable Area */}
        {/* Added overflow-y-auto and height calculation to make the chat list scrollable */}
        <div className="flex-1 overflow-y-auto pr-2">
          {" "}
          {/* Added pr-2 for scrollbar space */}
          {/* Check if chats is an array before mapping */}
          {Array.isArray(chats) ? (
            chats.length > 0 ? (
              chats.map((chat) => {
                // Find the other participant in the chat
                const otherParticipant = chat.participants.find(
                  (p) => p.id !== USER_ID
                );
                // Determine the chat name (use other participant's name or a default)
                // Use first_name and last_name based on the provided structure
                const chatName = otherParticipant
                  ? `${otherParticipant.first_name || ""} ${
                      otherParticipant.last_name || ""
                    }`.trim()
                  : `Chat ${chat.id}`;
                // Use a default name if the combined name is empty
                const displayChatName = chatName || `Chat ${chat.id}`;

                // Safely access last message content and timestamp from the messages array
                const lastMessage =
                  chat.messages && chat.messages.length > 0
                    ? chat.messages[chat.messages.length - 1] // Get the last message object
                    : null;
                const lastMessageContent = lastMessage
                  ? lastMessage.messageContent
                  : "No messages yet";
                const lastMessageTimestamp = lastMessage
                  ? lastMessage.timestamp
                  : null;

                return (
                  // Individual chat item in the list
                  <div
                    key={chat.id} // Use chat.id as the unique key for list items
                    className={`flex items-center p-3 mb-2 rounded-lg cursor-pointer hover:bg-gray-100 transition duration-150 ease-in-out ${
                      // Added transition
                      activeChat?.id === chat.id ? "bg-gray-200" : ""
                    }`}
                    style={{ height: "65px" }}
                    onClick={() => setActiveChat(chat)} // Set this chat as active when clicked
                  >
                    {/* User Avatar */}
                    <img
                      src={otherParticipant?.profilePictureUrl || image} // Use participant's image if available, fallback to default
                      alt={displayChatName} // Alt text for accessibility
                      style={{ height: "40px" }}
                      className=" rounded-full mr-3 object-cover flex-shrink-0" // Added object-cover and flex-shrink-0
                    />
                    {/* Chat Name and Last Message */}
                    <div className="flex-1 overflow-hidden">
                      {" "}
                      {/* Added overflow-hidden to truncate text */}
                      {/* Display the chat name */}
                      <div className="font-semibold text-sm ml-4">
                        {displayChatName}
                      </div>{" "}
                      {/* Added truncate */}
                      {/* Display the last message content */}
                      <div className="text-gray-500 text-xs ml-4">
                        {" "}
                        {/* Added truncate */}
                        {lastMessageContent}
                      </div>
                    </div>
                    {/* Display the time of the last message if available */}
                    {lastMessageTimestamp && (
                      <div className="text-gray-400 text-xs ml-2 flex-shrink-0">
                        {" "}
                        {/* Added flex-shrink-0 */}
                        {/* Format timestamp */}
                        {new Date(lastMessageTimestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    )}

                    {/* Unread count - you'll need to implement tracking for this */}
                    {/* {chat.unreadCount > 0 && (
                          <div className="ml-2 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                            {chat.unreadCount}
                          </div>
                        )} */}
                  </div>
                );
              })
            ) : (
              // Message displayed when there are no chats
              <div className="text-center text-gray-500 mt-8">
                No chats available
              </div>
            )
          ) : (
            // Message displayed while chats are loading initially
            <div className="text-center text-gray-500 mt-8">
              Loading chats...
            </div>
          )}
        </div>
      </div>

      {/* Chat Window - Render only if a chat is selected (activeChat is truthy) */}
      {activeChat ? ( // Correct syntax: No parenthesis after ?
        <div className="flex-1 bg-white shadow-lg rounded-xl p-6 flex flex-col">
          {/* Chat Header */}
          <div className="flex items-center mb-4 border-b pb-4">
            {" "}
            {/* Added border bottom */}
            {/* Find the other participant in the active chat and display their name */}
            <div className="text-lg font-semibold">
              {
                activeChat.participants.find((p) => p.id !== USER_ID)
                  ? // Use first_name and last_name based on the provided structure
                    `${
                      activeChat.participants.find((p) => p.id !== USER_ID)
                        .first_name || ""
                    } ${
                      activeChat.participants.find((p) => p.id !== USER_ID)
                        .last_name || ""
                    }`.trim()
                  : `Chat ${activeChat.id}` // Fallback if other participant not found
              }
            </div>
            {/* Optional: Add a delete button */}
            {/* <button
              className="ml-auto text-red-500 hover:text-red-700 text-sm p-1 rounded hover:bg-red-100 transition duration-150 ease-in-out" // Added styling
              onClick={() => deleteChatSession(activeChat.id)}
              title="Delete Chat" // Added tooltip
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
            </button> */}
          </div>

          {/* Chat Messages Area - Scrollable */}
          {/* Added overflow-y-auto and space-y for gap between messages */}
          <div className="flex-1 overflow-y-auto mb-4 space-y-3 p-2">
            {" "}
            {/* Added p-2 */}
            {messages.length > 0 ? (
              // Map through messages and render each one
              messages.map((msg) => (
                // Individual message container
                <div
                  key={msg.id || messages.indexOf(msg)} // Use message ID as the key if available, fallback to index
                  className={`flex ${
                    msg.senderId === USER_ID ? "justify-end" : "justify-start" // Align messages based on sender
                  }`}
                >
                  {/* Message Bubble */}
                  <div
                    className={`max-w-[70%] p-3 rounded-xl ${
                      // Limit max width of the bubble
                      msg.senderId === USER_ID
                        ? "bg-blue-500 text-white rounded-br-none" // Blue bubble for current user, tail effect
                        : "bg-gray-200 text-gray-700 rounded-bl-none" // Gray bubble for others, tail effect
                    } break-words shadow`} // Added break-words and shadow
                  >
                    {msg.messageContent} {/* Display the message content */}
                    {/* Optional: Add timestamp below the message */}
                    {msg.timestamp && (
                      <div
                        className={`text-[10px] mt-1 ${
                          msg.senderId === USER_ID
                            ? "text-blue-200"
                            : "text-gray-500"
                        } text-right`}
                      >
                        {/* Format and display timestamp */}
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              // Message displayed when there are no messages in the active chat
              <div className="text-center text-gray-500 italic mt-8">
                No messages yet. Start the conversation!
              </div>
            )}
          </div>

          {/* Predefined Quick Replies */}
          {/* Added overflow-x-auto for horizontal scrolling on small screens */}
          <div className="flex space-x-2 mb-4 overflow-x-auto pb-2">
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded-full hover:bg-blue-600 text-sm flex-shrink-0 transition duration-150 ease-in-out"
              onClick={() => sendMessage("Let's do it!")}
            >
              Let's do it!
            </button>
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded-full hover:bg-blue-600 text-sm flex-shrink-0 transition duration-150 ease-in-out"
              onClick={() => sendMessage("Great!")}
            >
              Great!
            </button>
            {/* Add more quick replies as needed */}
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded-full hover:bg-blue-600 text-sm flex-shrink-0 transition duration-150 ease-in-out"
              onClick={() => sendMessage("When are you available?")}
            >
              When are you available?
            </button>
          </div>

          {/* Chat Input Area */}
          <div className="flex items-center bg-gray-100 p-2 rounded-full shadow-inner">
            {" "}
            {/* Adjusted padding */}
            <input
              type="text"
              placeholder="Type a message..."
              style={{
                backgroundColor: "#F8F0F0",
                padding: "14px",
                width: "100%",
                borderRadius: "10px",
              }} // Adjusted background color
              className="flex-1 bg-transparent outline-none px-3 text-sm" // Adjusted padding and text size
              value={newMessage} // Controlled input value
              onChange={(e) => setNewMessage(e.target.value)} // Update state on change
              onKeyDown={(e) => e.key === "Enter" && sendMessage(newMessage)} // Send on Enter key press
              disabled={!socket || socket.readyState !== WebSocket.OPEN} // Disable input if socket is not open
            />
            <button
              className="ml-2 p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out" // Added disabled styles and transition
              onClick={() => sendMessage(newMessage)} // Send message on button click
              disabled={
                !newMessage.trim() ||
                !socket ||
                socket.readyState !== WebSocket.OPEN
              } // Disable button if input is empty or socket not open
              title="Send Message" // Added tooltip
            >
              {/* Send Icon (example using inline SVG) */}
              {/* <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5 transform rotate-90"
              >
                <path d="M3.478 2.405a.75.75 0 0 0-.926.94l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 109.817 109.817 0 0 0 3.58-1.139L15.15 18a.75.75 0 0 0 1.404-.128 9.74 9.74 0 0 0 5.634-4.35.75.75 0 0 0 0-.752 9.74 9.74 0 0 0-5.634-4.35.75.75 0 0 0-1.404-.128L7.065 3.544a109.817 109.817 0 0 0-3.58-1.139Z" />
              </svg> */}
            </button>
          </div>
        </div>
      ) : (
        // Correct syntax: No parenthesis after :
        // Display a message when no chat is selected
        <div className="flex-1 bg-white shadow-lg rounded-xl p-6 flex flex-col items-center justify-center text-gray-500">
          {/* Show loading indicator if the direct chat logic is still running */}
          {loading ? (
            <div className="flex flex-col items-center">
              <svg
                className="animate-spin h-8 w-8 text-gray-500 mb-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l2-2.647z"
                ></path>
              </svg>
              <div>Loading chat...</div>
            </div>
          ) : (
            // Show guidance message if not loading and no chat is active
            <>
              {/* Chat Icon */}
              {/* <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-16 h-16 mb-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H15.75m2.25-4.125a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H18m2.25 4.125c0 1.15-.19 2.23-.53 3.219L16.5 18a2.25 2.25 0 0 1-1.875 1.039V21.75l-1.581-1.581a1.5 1.5 0 0 0-1.14-.44L9.75 20.25a3.733 3.733 0 0 0-.45-1.495l-1.413 1.413zm-1.413-1.413L5.416 16.17A9.75 9.75 0 0 1 3 12.375V4.5c0-1.036.84-1.875 1.875-1.875h15C20.16 2.625 21 3.464 21 4.5v7.875c0 1.035-.84 1.875-1.875 1.875h-4.5Z"
                />
              </svg> */}
              <div>Select a chat from the sidebar to view messages</div>
              {/* Show an error message if we came from a direct link but couldn't find/create the chat */}
              {renteeIdFromParams && !activeChat && !loading && (
                <div className="mt-4 text-center text-red-500">
                  Could not find or create a chat with the specified user.
                  Please try selecting from the list.
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatApp;
