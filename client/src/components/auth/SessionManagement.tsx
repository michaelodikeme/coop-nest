import React, { useEffect } from 'react';
import { useAuth } from '@/lib/api/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

export const SessionStatusIndicator = () => {
  const { currentSession } = useAuth();
  
  return (
    <div className="session-status">
      <div className={`status-indicator ${currentSession ? 'active' : 'inactive'}`}>
        {currentSession ? 'Session Active' : 'No Active Session'}
      </div>
    </div>
  );
};

export const SessionManagement = () => {
  const { 
    userSessions, 
    invalidateSession, 
    isCurrentSession, 
    getActiveSessions,
    logout
  } = useAuth();
  
  useEffect(() => {
    // Refresh sessions when component mounts
    getActiveSessions();
  }, [getActiveSessions]);
  
  return (
    <div className="session-management">
      <h3>Active Sessions</h3>
      {userSessions.length === 0 ? (
        <p>No active sessions found.</p>
      ) : (
        <>
          <ul className="session-list">
            {userSessions.map(session => (
              <li key={session.id} className={''}>
                <div className="session-info">
                  <div className="device">{session.userAgent || 'Unknown device'}</div>
                  <div className="ip">{session.ipAddress}</div>
                  <div className="last-active">
                    Last active: {formatDistanceToNow(new Date(session.lastActive || session.createdAt))} ago
                  </div>
                </div>
                <button
                  onClick={() => invalidateSession(session.id)}
                  disabled={false}
                  className={'terminate-session'}
                >
                  Terminate
                </button>
              </li>
            ))}
          </ul>
          <div className="session-actions">
            <button 
              onClick={() => logout({ invalidateAll: true, reason: 'user_terminated_all' })}
              className="terminate-all-sessions"
            >
              Terminate All Sessions
            </button>
          </div>
        </>
      )}
    </div>
  );
};