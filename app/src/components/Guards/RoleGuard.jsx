import React, { useEffect } from 'react';
import { useRoleRedirect } from '../../hooks/useRoleRedirect.js';

export function RoleGuard({ children }) {
  const { role, account, isLoadingRole } = useRoleRedirect();

  // Show loading while determining role
  if (isLoadingRole) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Detecting wallet role...</p>
        </div>
      </div>
    );
  }

  // Show connect prompt if no wallet is connected
  if (!account) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="empty-icon">🔗</div>
          <h3>Wallet Not Connected</h3>
          <p>Please connect your wallet to access this feature.</p>
        </div>
      </div>
    );
  }

  // Show role registration prompt if no role is detected
  if (!role) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="empty-icon">👤</div>
          <h3>Account Not Registered</h3>
          <p>Please register as a doctor or patient to continue.</p>
          <div className="action-buttons" style={{ marginTop: '20px' }}>
            <a href="/register/doctor" className="btn-primary">
              👨‍⚕️ Register as Doctor
            </a>
            <a href="/register/patient" className="btn-secondary">
              👤 Register as Patient
            </a>
          </div>
        </div>
      </div>
    );
  }

  return children;
}

export default RoleGuard;