import { useEffect, useState } from "react";
import Breadcrumb from "../../../components/Breadcrumbs/Breadcrumb";
import Swal from "sweetalert2";
import Select from "react-select";
import { useLocation, useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { toast, ToastContainer } from 'react-toastify';
import Button from "../../../components/Forms/Button";
import { roles } from "../../Authentication/Role";
import { API_List_Partner_Admin, API_Edit_User_Admin, API_Update_User_Admin } from "../../../api/api";

const EditUser = () => {
  const [suppliers, setSuppliers] = useState<{ value: string; label: string }[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<{ value: string; label: string } | null>(null);
  const [firstName, setFirstName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState(""); // Changed to single email string
  const [originalUsername, setOriginalUsername] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const userId = queryParams.get('userId');

  useEffect(() => {
    fetchSuppliers();
  }, []);

  useEffect(() => {
    if (userId && suppliers.length > 0) {
      fetchUserData(userId);
    }
  }, [userId, suppliers]);

  const fetchSuppliers = async () => {
    const token = localStorage.getItem('access_token');
    try {
      const response = await fetch(API_List_Partner_Admin(), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const result = await response.json();
      console.log('API Response:', result);
  
      let suppliersData = [];
      
      if (result.data) {
        suppliersData = result.data;
      } else if (Array.isArray(result)) {
        suppliersData = result;
      } else {
        throw new Error('Unexpected response format');
      }
  
      if (!Array.isArray(suppliersData)) {
        throw new Error('Suppliers data is not an array');
      }
  
      const suppliersList = suppliersData
        .filter(sup => sup && typeof sup === 'object' && 'bp_code' in sup && 'bp_name' in sup)
        .map(sup => ({
          value: sup.bp_code,
          label: `${sup.bp_code} | ${sup.bp_name}`
        }));
  
      if (suppliersList.length === 0) {
        console.warn('No valid suppliers found in the response');
      }
  
      setSuppliers(suppliersList);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      if (error instanceof Error) {
        toast.error(`Error fetching suppliers: ${error.message}`);
      } else {
        toast.error('Error fetching suppliers');
      }
      setSuppliers([]);
    }
  };

  const fetchUserData = async (id: string) => {
    const token = localStorage.getItem('access_token');
    try {
      const response = await fetch(`${API_Edit_User_Admin()}${id}`, {
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

  const populateForm = (data: { bp_code: string; name: string; role: string; username: string; email: string }) => {
    if (!data) return;
    const matchedSupplier = suppliers.find((sup) => sup.value === data.bp_code);
    setSelectedSupplier(matchedSupplier || null);
    setFirstName(data.name || "");
    setRole(data.role || "");
    setOriginalUsername(data.username || "");
    setUsername(data.username || "");
    setEmail(data.email || "");
  };

  const generateRandomPassword = () => {
    if (selectedSupplier) {
      const bpCode = selectedSupplier.value;
      const codeAfterThree = bpCode.substring(3, 7);
      const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';
      const randomChars = Array.from({ length: 6 }, () => 
        characters[Math.floor(Math.random() * characters.length)]
      ).join('');
      const finalPassword = codeAfterThree + randomChars;
      setPassword(finalPassword);
    } else {
      Swal.fire('Error', 'Please select a supplier first', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedSupplier || !firstName || !role || !username || !email) {
      Swal.fire('Error', 'Please fill all required fields correctly.', 'error');
      return;
    }

    const payload = {
      bp_code: selectedSupplier.value,
      username: username === originalUsername ? "" : username,
      name: firstName,
      role,
      password: password,
      email: email.trim()
    };

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_Update_User_Admin()}${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      if (response.ok && (result.status || result.message === 'User updated')) {
        toast.success('User successfully updated!');
        setTimeout(() => navigate('/list-user'), 1000);
      } else {
        if (result.errors?.username) {
          toast.error(result.errors.username[0]);
        } else {
          toast.error(result.message || 'Failed to update user');
        }
      }
    } catch (error) {
      console.error('Error during user update:', error);
      toast.error('An error occurred while updating the user.');
    }
  };

  return (
    <>
      <ToastContainer position="top-right" />
      <Breadcrumb
        pageName="Edit User"
        isSubMenu={true}
        parentMenu={{
          name: "Manage User",
          link: "/list-user"
        }}
      />
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <form onSubmit={handleSubmit} className="max-w-[1024px] mx-auto">
          <div className="p-4 md:p-6.5">
            {/* Supplier Selection */}
            <div className="mb-4.5 w-full">
              <label className="mb-2.5 block text-black dark:text-white">
                Select Supplier <span className="text-meta-1">*</span>
              </label>
              <div className="w-full">
                <Select
                  id="supplier_id"
                  options={suppliers}
                  value={selectedSupplier}
                  onChange={setSelectedSupplier}
                  placeholder="Search Supplier"
                  className="w-full"
                  isClearable
                />
              </div>
            </div>

            {/* Name and Role in one row */}
            <div className="mb-4.5 flex flex-col md:flex-row gap-4 md:gap-6">
              <div className="w-full md:w-[300px]">
                <label className="mb-2.5 block text-black dark:text-white">
                  Name <span className="text-meta-1">*</span>
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Enter name"
                  required
                  className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                />
              </div>

              <div className="w-full md:w-[300px]">
                <label className="mb-2.5 block text-black dark:text-white">
                  Role <span className="text-meta-1">*</span>
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                  required
                >
                  <option value="" disabled>Select a role</option>
                  {roles.map((roleObj) => (
                    <option key={roleObj.value} value={roleObj.value}>
                      {roleObj.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Username and Email in one row */}
            <div className="mb-4.5 flex flex-col md:flex-row gap-4 md:gap-6">
              <div className="w-full md:w-[300px]">
                <label className="mb-2.5 block text-black dark:text-white">
                  Username <span className="text-meta-1">*</span>
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  required
                  className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                />
              </div>

              {/* Email Field */}
              <div className="w-full md:w-[600px]">
                <label className="mb-2.5 block text-black dark:text-white">
                  Email <span className="text-meta-1">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email address"
                  required
                  className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="mb-6">
              <label className="mb-2.5 block text-black dark:text-white">
                Password
              </label>
              <div className="flex flex-col md:flex-row gap-4 md:gap-6">
                <div className="relative w-full md:w-[300px]">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Leave blank to keep current"
                    className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                  />
                  <button
                    type="button"
                    className="absolute top-1/2 right-3 transform -translate-y-1/2"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <FaEye /> : <FaEyeSlash />}
                  </button>
                </div>
                <Button
                  type="button"
                  onClick={generateRandomPassword}
                  title="Generate Random Password"
                />
              </div>
              {password.length > 0 && password.length < 8 && (
                <span className="text-meta-1 text-sm mt-1">
                  Password must be at least 8 characters
                </span>
              )}
            </div>

            {/* Submit Button */}
            <Button 
              type="submit"
              title="Save Changes"
              className="w-full justify-center bg-fuchsia-900 hover:bg-opacity-90 text-white"
            />
          </div>
        </form>
      </div>
    </>
  );
};

export default EditUser;