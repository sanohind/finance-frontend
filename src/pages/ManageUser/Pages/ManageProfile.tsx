import { useEffect, useState } from "react";
import Breadcrumb from "../../../components/Breadcrumbs/Breadcrumb";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { toast, ToastContainer } from 'react-toastify';
import Button from "../../../components/Forms/Button";
import { API_Edit_Profile, API_Update_Profile } from "../../../api/api";

const ManageProfile = () => {
  const [firstName, setFirstName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  // No userId needed, just call fetchUserData on mount
  useEffect(() => {
    fetchUserData();
    // eslint-disable-next-line
  }, []);

  const fetchUserData = async () => {
    const token = localStorage.getItem('access_token');
    try {
      const response = await fetch(API_Edit_Profile(), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Error fetching user data');
      const dataResponse = await response.json();
      populateForm(dataResponse.data);
    } catch (error) {
      console.error('Error fetching user data:', error);
      if (error instanceof Error) {
        toast.error(`Error fetching user data: ${error.message}`);
      } else {
        toast.error('Error fetching user data');
      }
    }
  };

  const populateForm = (data: { name: string; username: string; email: string }) => {
    if (!data) return;
    setFirstName(data.name || "");
    setUsername(data.username || "");
    setEmail(data.email || "");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!firstName || !username || !email) {
      Swal.fire('Error', 'Please fill all required fields correctly.', 'error');
      return;
    }
    // Only send password if provided, otherwise omit it
    const payload: any = {
      name: firstName,
      username,
      email: email.trim(),
    };
    if (password) {
      payload.password = password;
    }
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(API_Update_Profile(), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (response.ok && (result.status || result.message === 'Personal data updated successfully')) {
        toast.success('Profile successfully updated!');
        setTimeout(() => navigate('/profile'), 1000);
      } else {
        if (result.errors?.username) {
          toast.error(result.errors.username[0]);
        } else {
          toast.error(result.message || 'Failed to update profile');
        }
      }
    } catch (error) {
      console.error('Error during profile update:', error);
      toast.error('An error occurred while updating the profile.');
    }
  };

  return (
    <>
      <ToastContainer position="top-right" />
      <Breadcrumb pageName="Profile" />
      <div className="rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto">
          <div className="p-6 flex flex-col gap-4">
            {/* Name */}
            <label className="block">
              <span className="block text-black dark:text-white font-medium mb-1">Name <span className="text-meta-1">*</span></span>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Enter name"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-form-strokedark bg-transparent py-2 px-3 text-black dark:text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
              />
            </label>
            {/* Username */}
            <label className="block">
              <span className="block text-black dark:text-white font-medium mb-1">Username <span className="text-meta-1">*</span></span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-form-strokedark bg-transparent py-2 px-3 text-black dark:text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
              />
            </label>
            {/* Email */}
            <label className="block">
              <span className="block text-black dark:text-white font-medium mb-1">Email <span className="text-meta-1">*</span></span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-form-strokedark bg-transparent py-2 px-3 text-black dark:text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
              />
            </label>
            {/* Password */}
            <label className="block">
              <span className="block text-black dark:text-white font-medium mb-1">Password</span>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Leave blank to keep current"
                  className="mt-1 block w-full rounded-md border border-gray-300 dark:border-form-strokedark bg-transparent py-2 px-3 text-black dark:text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition pr-10"
                />
                <button
                  type="button"
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-500"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <FaEye /> : <FaEyeSlash />}
                </button>
              </div>
              {password.length > 0 && password.length < 8 && (
                <span className="text-meta-1 text-xs mt-1 block">
                  Password must be at least 8 characters
                </span>
              )}
            </label>
            {/* Submit Button */}
            <div className="pt-2">
              <Button 
                type="submit"
                title="Save Changes"
                className="w-full justify-center bg-fuchsia-900 hover:bg-opacity-90 text-white"
              />
            </div>
          </div>
        </form>
      </div>
    </>
  );
};

export default ManageProfile;