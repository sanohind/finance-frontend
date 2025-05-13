import React, { useEffect, useState } from 'react';
import DashboardSuperAdmin from './Pages/Admin/SuperAdmin';
import DashboardAdminAccounting from './Pages/Admin/AdminAccounting';
import DashboardSupplier from './Pages/Customer/Supplier';
import { useAuth } from '../../pages/Authentication/AuthContext'; // Adjusted path

const Dashboard: React.FC = () => {
  const { userRole, isLoading } = useAuth(); // userRole is '1', '2', or '3', or null
  const [roleToRender, setRoleToRender] = useState<string>('');

  useEffect(() => {
    if (!isLoading) {
      let mappedRole = '';
      if (userRole) {
        switch (userRole) {
          case '1':
            mappedRole = 'super-admin';
            break;
          case '2':
            mappedRole = 'finance'; // As per your confirmation
            break;
          case '3':
            mappedRole = 'supplier-finance';
            break;
          default:
            mappedRole = 'unknown'; // Should not happen if role is '1', '2', or '3'
        }
      } else {
        mappedRole = 'none'; // No user role found after loading
      }
      setRoleToRender(mappedRole);
    }
  }, [isLoading, userRole]);

  if (isLoading) {
    // You might want to use your common Loader component here
    return <div>Loading Dashboard...</div>; 
  }

  if (roleToRender === 'super-admin') {
    return <DashboardSuperAdmin />;
  } else if (roleToRender === 'finance') {
    return <DashboardAdminAccounting />;
  } else if (roleToRender === 'supplier-finance') {
    return <DashboardSupplier />;
  } else {
    return <div>No dashboard available for your role. (Role state: {roleToRender}, AuthContext role: {userRole || 'null'})</div>;
  }
  
};

export default Dashboard;
