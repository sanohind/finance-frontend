import React, { useEffect, useState } from 'react';
import DashboardSuperAdmin from './Pages/Admin/SuperAdmin';
import DashboardAdminAccounting from './Pages/Admin/AdminAccounting';
import DashboardSupplier from './Pages/Customer/Supplier';

const Dashboard: React.FC = () => {
  const [userRole, setUserRole] = useState<string>('');

  useEffect(() => {
    const role = localStorage.getItem('role') || '';
    setUserRole(role);
  }, []);

  if (userRole === 'super-admin') {
    return <DashboardSuperAdmin />;
  } else if (userRole === 'finance') {
    return <DashboardAdminAccounting />;
  } else if (userRole === 'supplier-finance') {
    return <DashboardSupplier />;
  } else {
    return <div>No dashboard available for your role.</div>;
  }
  
};

export default Dashboard;
