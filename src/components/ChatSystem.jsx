import React, { useState, useEffect } from 'react';
import { useStateContext } from '../../Context/index.jsx';
import '../styles/ChatSystem.css';
import { 
  GET_MY_FRIEND_LIST, 
  GET_READ_MESSAGE, 
  GET_USERNAME_TYPE,
  GET_ALL_APP_USER
} from '../../Context/constants.jsx';
import { FaComments, FaPaperPlane, FaUser, FaSearch } from 'react-icons/fa';

const ChatSystem = () => {
  const { address, SEND_MESSAGE, loader } = useStateContext();
  const [friends, setFriends] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (address) {
      loadChatData();
    }
  }, [address]);

  useEffect(() => {
    if (selectedChat) {
      loadMessages();
    }
  }, [selectedChat]);

  const loadChatData = async () => {
    try {
      setLoading(true);
      const [friendsList, usersList] = await Promise.all([
        GET_MY_FRIEND_LIST(address),
        GET_ALL_APP_USER()
      ]);
      setFriends(friendsList);
      setAllUsers(usersList);
    } catch (error) {
      console.error('Error loading chat data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    if (!selectedChat) return;
    
    try {
      const messagesList = await GET_READ_MESSAGE(selectedChat.userAddress);
      setMessages(messagesList);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat) return;

    try {
      await SEND_MESSAGE(selectedChat, { message: newMessage });
      setNewMessage('');
      loadMessages(); // Refresh messages
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const filteredFriends = friends.filter(friend =>
    friend.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div style={loadingStyle}>
        <div>Loading chat system...</div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h2>
          <FaComments style={{ marginRight: '10px' }} />
          Chat System
        </h2>
      </div>

      <div style={chatContainerStyle}>
        {/* Friends List */}
        <div style={friendsListStyle}>
          <div style={searchContainerStyle}>
            <FaSearch style={searchIconStyle} />
            <input
              type="text"
              placeholder="Search friends..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={searchInputStyle}
            />
          </div>

          <div style={friendsHeaderStyle}>
            <h3>Your Contacts</h3>
            <span style={countStyle}>{friends.length}</span>
          </div>

          <div style={friendsListContainerStyle}>
            {filteredFriends.length === 0 ? (
              <div style={emptyStateStyle}>
                <FaUser style={{ fontSize: '32px', color: '#6c757d', marginBottom: '10px' }} />
                <p>No contacts found</p>
              </div>
            ) : (
              filteredFriends.map((friend) => (
                <div
                  key={friend.userAddress}
                  onClick={() => setSelectedChat(friend)}
                  style={{
                    ...friendItemStyle,
                    backgroundColor: selectedChat?.userAddress === friend.userAddress ? '#e3f2fd' : 'white'
                  }}
                >
                  <div style={friendAvatarStyle}>
                    <FaUser />
                  </div>
                  <div style={friendInfoStyle}>
                    <h4>{friend.name}</h4>
                    <p style={friendAddressStyle}>{friend.userAddress}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div style={chatAreaStyle}>
          {selectedChat ? (
            <>
              <div style={chatHeaderStyle}>
                <div style={chatUserInfoStyle}>
                  <div style={chatAvatarStyle}>
                    <FaUser />
                  </div>
                  <div>
                    <h3>{selectedChat.name}</h3>
                    <p style={chatStatusStyle}>Online</p>
                  </div>
                </div>
              </div>

              <div style={messagesContainerStyle}>
                {messages.length === 0 ? (
                  <div style={noMessagesStyle}>
                    <FaComments style={{ fontSize: '48px', color: '#6c757d', marginBottom: '20px' }} />
                    <p>No messages yet. Start a conversation!</p>
                  </div>
                ) : (
                  messages.map((message, index) => (
                    <div
                      key={index}
                      style={{
                        ...messageStyle,
                        alignSelf: message.sender === address ? 'flex-end' : 'flex-start',
                        backgroundColor: message.sender === address ? '#007bff' : '#f1f3f4',
                        color: message.sender === address ? 'white' : 'black'
                      }}
                    >
                      <div style={messageContentStyle}>
                        <p>{message.msg}</p>
                        <span style={messageTimeStyle}>{message.timestamp}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleSendMessage} style={messageFormStyle}>
                <div style={inputContainerStyle}>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    style={messageInputStyle}
                    disabled={loader}
                  />
                  <button
                    type="submit"
                    style={sendButtonStyle}
                    disabled={loader || !newMessage.trim()}
                  >
                    <FaPaperPlane />
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div style={noChatSelectedStyle}>
              <FaComments style={{ fontSize: '64px', color: '#6c757d', marginBottom: '20px' }} />
              <h3>Select a contact to start chatting</h3>
              <p>Choose a friend from the list to begin your conversation</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Styles
const containerStyle = {
  minHeight: '100vh',
  backgroundColor: '#f8f9fa',
  padding: '20px'
};

const headerStyle = {
  backgroundColor: 'white',
  borderRadius: '12px',
  padding: '20px',
  marginBottom: '20px',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  textAlign: 'center'
};

const loadingStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '50vh',
  fontSize: '18px'
};

const chatContainerStyle = {
  display: 'grid',
  gridTemplateColumns: '300px 1fr',
  gap: '20px',
  height: '70vh',
  backgroundColor: 'white',
  borderRadius: '12px',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  overflow: 'hidden'
};

const friendsListStyle = {
  borderRight: '1px solid #dee2e6',
  display: 'flex',
  flexDirection: 'column'
};

const searchContainerStyle = {
  position: 'relative',
  padding: '15px',
  borderBottom: '1px solid #dee2e6'
};

const searchIconStyle = {
  position: 'absolute',
  left: '25px',
  top: '50%',
  transform: 'translateY(-50%)',
  color: '#6c757d'
};

const searchInputStyle = {
  width: '100%',
  padding: '10px 10px 10px 35px',
  border: '1px solid #dee2e6',
  borderRadius: '20px',
  outline: 'none',
  fontSize: '14px'
};

const friendsHeaderStyle = {
  padding: '15px',
  borderBottom: '1px solid #dee2e6',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
};

const countStyle = {
  backgroundColor: '#007bff',
  color: 'white',
  padding: '4px 8px',
  borderRadius: '12px',
  fontSize: '12px',
  fontWeight: 'bold'
};

const friendsListContainerStyle = {
  flex: 1,
  overflowY: 'auto'
};

const emptyStateStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '200px',
  color: '#6c757d'
};

const friendItemStyle = {
  display: 'flex',
  alignItems: 'center',
  padding: '15px',
  cursor: 'pointer',
  borderBottom: '1px solid #f1f3f4',
  transition: 'background-color 0.2s ease'
};

const friendAvatarStyle = {
  width: '40px',
  height: '40px',
  borderRadius: '50%',
  backgroundColor: '#007bff',
  color: 'white',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: '12px'
};

const friendInfoStyle = {
  flex: 1
};

const friendAddressStyle = {
  fontSize: '12px',
  color: '#6c757d',
  margin: '2px 0 0 0'
};

const chatAreaStyle = {
  display: 'flex',
  flexDirection: 'column'
};

const chatHeaderStyle = {
  padding: '15px',
  borderBottom: '1px solid #dee2e6',
  backgroundColor: '#f8f9fa'
};

const chatUserInfoStyle = {
  display: 'flex',
  alignItems: 'center'
};

const chatAvatarStyle = {
  width: '40px',
  height: '40px',
  borderRadius: '50%',
  backgroundColor: '#28a745',
  color: 'white',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: '12px'
};

const chatStatusStyle = {
  fontSize: '12px',
  color: '#28a745',
  margin: '2px 0 0 0'
};

const messagesContainerStyle = {
  flex: 1,
  padding: '20px',
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: '10px'
};

const noMessagesStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  color: '#6c757d'
};

const noChatSelectedStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  color: '#6c757d'
};

const messageStyle = {
  maxWidth: '70%',
  padding: '10px 15px',
  borderRadius: '18px',
  marginBottom: '5px'
};

const messageContentStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '5px'
};

const messageTimeStyle = {
  fontSize: '11px',
  opacity: 0.7
};

const messageFormStyle = {
  padding: '15px',
  borderTop: '1px solid #dee2e6',
  backgroundColor: '#f8f9fa'
};

const inputContainerStyle = {
  display: 'flex',
  gap: '10px',
  alignItems: 'center'
};

const messageInputStyle = {
  flex: 1,
  padding: '10px 15px',
  border: '1px solid #dee2e6',
  borderRadius: '20px',
  outline: 'none',
  fontSize: '14px'
};

const sendButtonStyle = {
  width: '40px',
  height: '40px',
  borderRadius: '50%',
  backgroundColor: '#007bff',
  color: 'white',
  border: 'none',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'background-color 0.2s ease'
};

export default ChatSystem;

