import React, { useEffect, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import {API_Dashboard, API_User_Online_Admin, API_User_Logout_Admin} from '../../../../api/api';
import CardDataStats from '../../../../components/CardDataStats';
import UserOnline from '../../../../components/UserOnline';
import Pagination from '../../../../components/Table/Pagination';
import { FaUserCheck, FaUserClock, FaUsers, FaUserTimes } from 'react-icons/fa';

const DashboardSuperAdmin: React.FC = () => {
  // Dashboard stats
  const [dashboardData, setDashboardData] = useState({
    user_online: '-',
    total_user: '-',
    user_active: '-',
    user_deactive: '-',
  });

  // Online users
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const [errorCount, setErrorCount] = useState(0);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  // --- Fetching dashboard data ---
  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(API_Dashboard(), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          const data = result.data;
          setDashboardData({
            user_online: data.online_users?.toString() || '-',
            total_user: data.total_users?.toString() || '-',
            user_active: data.active_users?.toString() || '-',
            user_deactive: data.deactive_users?.toString() || '-',
          });
        } else {
          toast.error(`Error fetching dashboard data: ${result.message}`);
          setErrorCount((prevCount) => prevCount + 1);
        }
      } else {
        toast.error(`Gagal mengambil data: ${response.status}`);
        setErrorCount((prevCount) => prevCount + 1);
      }
    } catch (error) {
      setErrorCount((prevCount) => prevCount + 1);
      if (error instanceof Error) {
        toast.error(`Error fetching dashboard data: ${error.message}`);
      } else {
        toast.error('Error fetching dashboard data');
      }
    }
  };

  // --- Fetching online user data ---
  const fetchOnlineUsers = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(API_User_Online_Admin(), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Ensure unique entries
          const uniqueUsers = Array.from(new Set(result.data.map((user: any) => user.token)))
            .map(token => result.data.find((user: any) => user.token === token));
          setOnlineUsers(uniqueUsers);
        } else {
          console.error('Error fetching online users:', result.message);
          setErrorCount((prevCount) => prevCount + 1);
        }
      } else {
        console.error('Error fetching online users:', response.status);
        setErrorCount((prevCount) => prevCount + 1);
      }
    } catch (error) {
      console.error('Error fetching online users:', error);
      setErrorCount((prevCount) => prevCount + 1);
    }
  };

  // --- Logout a user from the online users table ---
  const handleLogoutUser = async (token_id: string) => {
    try {
      const adminToken = localStorage.getItem('access_token');
      const response = await fetch(API_User_Logout_Admin(), {
        method: 'POST', // Ensure this is the correct method
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token_id }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          const loggedOutUser = onlineUsers.find((user) => user.token === token_id);
          toast.success(`User ${loggedOutUser?.name || 'unknown'} logged out successfully`);
          setOnlineUsers((prevUsers) => prevUsers.filter((user) => user.token !== token_id));
        } else {
          toast.error(`Error logging out user: ${result.message}`);
        }
      } else {
        toast.error('Error logging out user');
      }
    } catch (error) {
      console.error('Error logging out user:', error);
      toast.error('Error logging out user');
    }
  };

  // --- Helper to map role IDs to names ---
  const getRoleName = (roleId: string) => {
    const roles: Record<string, string> = {
      '1': 'Super Admin',
      '2': 'Admin Finance',
      '3': 'Supplier',
    };
    return roles[roleId] || 'Unknown';
  };

  // --- Periodic fetching of data on mount and refresh ---
  useEffect(() => {
    fetchDashboardData();
    fetchOnlineUsers();

    const intervalId = setInterval(() => {
      if (errorCount < 3) {
        fetchDashboardData();
        fetchOnlineUsers();
      } else {
        clearInterval(intervalId);
      }
    }, 2000);

    return () => clearInterval(intervalId);
  }, []);

  // --- Pagination logic for user online table ---
  const filteredData = onlineUsers.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <>
      <ToastContainer position="top-right" />
      <div className="space-y-6">
        {/* Cards for dashboard stats */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4 2xl:gap-7.5">
          <CardDataStats
            title="User Online"
            total={dashboardData.user_online}
            rate=""
            levelUp={Number(dashboardData.user_online) > 0}
            levelDown={Number(dashboardData.user_online) <= 0}
          >
            <FaUserClock className="fill-green-500 dark:fill-white" size={24} />
          </CardDataStats>
          <CardDataStats
            title="Total User"
            total={dashboardData.total_user}
            rate=""
            levelUp={Number(dashboardData.total_user) > 0}
            levelDown={Number(dashboardData.total_user) <= 0}
          >
            <FaUsers className="fill-blue-500 dark:fill-white" size={24} />
          </CardDataStats>
          <CardDataStats
            title="User Active"
            total={dashboardData.user_active}
            rate=""
            levelUp={Number(dashboardData.user_active) > 0}
            levelDown={Number(dashboardData.user_active) <= 0}
          >
            <FaUserCheck className="fill-yellow-500 dark:fill-white" size={24} />
          </CardDataStats>
          <CardDataStats
            title="User Deactive"
            total={dashboardData.user_deactive}
            rate=""
            levelUp={Number(dashboardData.user_deactive) > 0}
            levelDown={Number(dashboardData.user_deactive) <= 0}
          >
            <FaUserTimes className="fill-red-500 dark:fill-white" size={24} />
          </CardDataStats>
        </div>

        {/* Table for Users Online */}
        <UserOnline
          onlineUsers={filteredData}
          handleLogoutUser={handleLogoutUser}
          getRoleName={getRoleName}
        />

        {/* Pagination */}
        <Pagination
          totalRows={onlineUsers.length}
          rowsPerPage={rowsPerPage}
          currentPage={currentPage}
          onPageChange={handlePageChange}
        />
      </div>
    </>
  );
};

export default DashboardSuperAdmin;