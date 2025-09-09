import React, { useState, useEffect } from 'react';
import { useStateContext } from '../../Context/index.jsx';
import { GET_NOTIFICATION } from '../../Context/constants';
import { FaBell, FaCheck, FaTimes, FaInfoCircle, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';
import '../styles/NotificationSystem.css';

const NotificationSystem = () => {
  const { address } = useStateContext();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, read

  useEffect(() => {
    if (address) {
      loadNotifications();
    }
  }, [address]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const notificationsList = await GET_NOTIFICATION(address);
      setNotifications(notificationsList);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getNotificationIcon = (categoryType) => {
    switch (categoryType) {
      case 'appointment':
        return <FaCheckCircle style={{ color: '#28a745' }} />;
      case 'prescription':
        return <FaInfoCircle style={{ color: '#007bff' }} />;
      case 'medicine':
        return <FaExclamationTriangle style={{ color: '#ffc107' }} />;
      default:
        return <FaBell style={{ color: '#6c757d' }} />;
    }
  };

  const getNotificationColor = (categoryType) => {
    switch (categoryType) {
      case 'appointment':
        return '#d4edda';
      case 'prescription':
        return '#d1ecf1';
      case 'medicine':
        return '#fff3cd';
      default:
        return '#f8f9fa';
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notification.read;
    if (filter === 'read') return notification.read;
    return true;
  });

  if (loading) {
    return (
      <div style={loadingStyle}>
        <div>Loading notifications...</div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h2>
          <FaBell style={{ marginRight: '10px' }} />
          Notifications
        </h2>
        <div style={filterButtonsStyle}>
          <button
            onClick={() => setFilter('all')}
            style={{
              ...filterButtonStyle,
              backgroundColor: filter === 'all' ? '#007bff' : 'white',
              color: filter === 'all' ? 'white' : '#007bff'
            }}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            style={{
              ...filterButtonStyle,
              backgroundColor: filter === 'unread' ? '#007bff' : 'white',
              color: filter === 'unread' ? 'white' : '#007bff'
            }}
          >
            Unread ({notifications.filter(n => !n.read).length})
          </button>
          <button
            onClick={() => setFilter('read')}
            style={{
              ...filterButtonStyle,
              backgroundColor: filter === 'read' ? '#007bff' : 'white',
              color: filter === 'read' ? 'white' : '#007bff'
            }}
          >
            Read ({notifications.filter(n => n.read).length})
          </button>
        </div>
      </div>

      <div style={notificationsContainerStyle}>
        {filteredNotifications.length === 0 ? (
          <div style={emptyStateStyle}>
            <FaBell style={{ fontSize: '48px', color: '#6c757d', marginBottom: '20px' }} />
            <h3>No Notifications</h3>
            <p>
              {filter === 'all' 
                ? "You don't have any notifications yet."
                : `No ${filter} notifications found.`
              }
            </p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <div
              key={notification.notificationId}
              style={{
                ...notificationCardStyle,
                backgroundColor: getNotificationColor(notification.categoryType),
                borderLeft: `4px solid ${notification.read ? '#6c757d' : '#007bff'}`
              }}
            >
              <div style={notificationHeaderStyle}>
                <div style={notificationIconStyle}>
                  {getNotificationIcon(notification.categoryType)}
                </div>
                <div style={notificationInfoStyle}>
                  <h4 style={notificationTitleStyle}>
                    {notification.categoryType.charAt(0).toUpperCase() + notification.categoryType.slice(1)} Notification
                  </h4>
                  <p style={notificationDateStyle}>{notification.date}</p>
                </div>
                <div style={notificationActionsStyle}>
                  {!notification.read && (
                    <div style={unreadBadgeStyle}>
                      <span>New</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div style={notificationContentStyle}>
                <p style={notificationMessageStyle}>{notification.message}</p>
                <p style={notificationUserStyle}>
                  From: {notification.userAddress}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {notifications.length > 0 && (
        <div style={actionsStyle}>
          <button style={markAllReadButtonStyle}>
            <FaCheck style={{ marginRight: '8px' }} />
            Mark All as Read
          </button>
          <button style={clearAllButtonStyle}>
            <FaTimes style={{ marginRight: '8px' }} />
            Clear All
          </button>
        </div>
      )}
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
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '20px'
};

const filterButtonsStyle = {
  display: 'flex',
  gap: '10px',
  flexWrap: 'wrap'
};

const filterButtonStyle = {
  padding: '8px 16px',
  border: '1px solid #007bff',
  borderRadius: '20px',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: 'bold',
  transition: 'all 0.3s ease'
};

const loadingStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '50vh',
  fontSize: '18px'
};

const notificationsContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '15px',
  maxWidth: '800px',
  margin: '0 auto'
};

const emptyStateStyle = {
  textAlign: 'center',
  padding: '50px',
  backgroundColor: 'white',
  borderRadius: '12px',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  color: '#6c757d'
};

const notificationCardStyle = {
  backgroundColor: 'white',
  borderRadius: '12px',
  padding: '20px',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
};

const notificationHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  marginBottom: '15px'
};

const notificationIconStyle = {
  fontSize: '24px',
  marginRight: '15px',
  display: 'flex',
  alignItems: 'center'
};

const notificationInfoStyle = {
  flex: 1
};

const notificationTitleStyle = {
  margin: '0 0 5px 0',
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#333'
};

const notificationDateStyle = {
  margin: '0',
  fontSize: '12px',
  color: '#6c757d'
};

const notificationActionsStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px'
};

const unreadBadgeStyle = {
  backgroundColor: '#dc3545',
  color: 'white',
  padding: '4px 8px',
  borderRadius: '12px',
  fontSize: '10px',
  fontWeight: 'bold'
};

const notificationContentStyle = {
  marginTop: '10px'
};

const notificationMessageStyle = {
  margin: '0 0 10px 0',
  fontSize: '14px',
  lineHeight: '1.5',
  color: '#333'
};

const notificationUserStyle = {
  margin: '0',
  fontSize: '12px',
  color: '#6c757d',
  fontStyle: 'italic'
};

const actionsStyle = {
  display: 'flex',
  justifyContent: 'center',
  gap: '20px',
  marginTop: '30px',
  padding: '20px',
  backgroundColor: 'white',
  borderRadius: '12px',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  maxWidth: '800px',
  margin: '30px auto 0'
};

const markAllReadButtonStyle = {
  backgroundColor: '#28a745',
  color: 'white',
  border: 'none',
  padding: '10px 20px',
  borderRadius: '6px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  fontSize: '14px',
  fontWeight: 'bold',
  transition: 'background-color 0.3s ease'
};

const clearAllButtonStyle = {
  backgroundColor: '#dc3545',
  color: 'white',
  border: 'none',
  padding: '10px 20px',
  borderRadius: '6px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  fontSize: '14px',
  fontWeight: 'bold',
  transition: 'background-color 0.3s ease'
};

export default NotificationSystem;

