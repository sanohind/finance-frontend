import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from './Header';
import Footer from './Footer/Footer';
import { useAuth } from '../pages/Authentication/AuthContext';  // Import the useAuth hook

const DefaultLayout: React.FC = () => {
  const { userRole, isLoading: authLoading } = useAuth();  // Use AuthContext to get the userRole and isAuthenticated
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Wait until authentication context is ready
  useEffect(() => {
    if (authLoading === false) {
      // Additional logic can go here if needed when loading is false
    }
  }, [authLoading]);

  // If still loading from AuthContext, show loading state
  if (authLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-purple-50"> {/* Added bg-red-50 */}
      {/* Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} role={userRole || ''} /> {/* Ensure role is a string */}
      
      <div className="relative flex-1 flex flex-col overflow-y-auto overflow-x-hidden">
        {/* Header */}
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        
        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 xl:p-10 2xl:p-12">
          <Outlet />
        </main>
        
        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
};

export default DefaultLayout;
