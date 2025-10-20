import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useWeb3 } from '../state/Web3Provider.jsx';
import { ROLES } from '../lib/constants.js';

export function useRoleRedirect() {
  const { role, account, isLoadingRole } = useWeb3();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Don't redirect while role is loading or if no account is connected
    if (isLoadingRole || !account) return;

    const currentPath = location.pathname;
    
    // Define role-based default routes
    const roleRoutes = {
      [ROLES.ADMIN]: '/admin',
      [ROLES.DOCTOR]: '/doctor',
      [ROLES.PATIENT]: '/patient'
    };

    // If user has a role and is on home page, redirect to their dashboard
    if (role && currentPath === '/') {
      const targetRoute = roleRoutes[role];
      if (targetRoute) {
        navigate(targetRoute);
        return;
      }
    }

    // Check if user is trying to access a restricted area without proper role
    const pathSegments = currentPath.split('/');
    const routePrefix = pathSegments[1]; // admin, doctor, patient, etc.

    if (routePrefix && roleRoutes[role] && !currentPath.startsWith(roleRoutes[role])) {
      // User is trying to access a different role's area
      if (routePrefix === 'admin' || routePrefix === 'doctor' || routePrefix === 'patient') {
        navigate(roleRoutes[role]);
        return;
      }
    }

    // If user doesn't have a role and is trying to access protected routes
    if (!role && (routePrefix === 'admin' || routePrefix === 'doctor' || routePrefix === 'patient')) {
      navigate('/');
      return;
    }

  }, [role, account, isLoadingRole, navigate, location.pathname]);

  return { role, account, isLoadingRole };
}

export default useRoleRedirect;