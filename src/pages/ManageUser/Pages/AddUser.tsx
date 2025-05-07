import { useEffect, useState } from 'react';
import Select from "react-select";
import Breadcrumb from "../../../components/Breadcrumbs/Breadcrumb";
import Swal from 'sweetalert2';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { toast, ToastContainer } from 'react-toastify';
import { API_Create_User_Admin, API_List_Partner_Admin } from '../../../api/api';
import Button from '../../../components/Forms/Button';
import { roles } from '../../Authentication/Role';

const AddUser = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState<{ value: string; label: string } | null>(null);
  const [firstName, setFirstName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState(""); // Changed to single email string

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    const token = localStorage.getItem('access_token');
    try {
      const response = await fetch(API_List_Partner_Admin(), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch suppliers');
      }
  
      const result = await response.json();
      console.log('Raw API Response:', result);
  
      if (result && typeof result === 'object') {
        let suppliersList = [];
  
        if (result.bp_code && result.bp_name) {
          suppliersList = [{
            value: result.bp_code,
            label: `${result.bp_code} | ${result.bp_name}`,
          }];
        }
        else if (Array.isArray(result.data)) {
          suppliersList = result.data.map((supplier: { bp_code: string; bp_name: string }) => ({
            value: supplier.bp_code,
            label: `${supplier.bp_code} | ${supplier.bp_name}`,
          }));
        }
        else if (result.data && typeof result.data === 'object') {
          suppliersList = Object.values(result.data).map((supplier: any) => ({
            value: supplier.bp_code,
            label: `${supplier.bp_code} | ${supplier.bp_name}`,
          }));
        }
        else if (Array.isArray(result)) {
          suppliersList = result.map((supplier: { bp_code: string; bp_name: string }) => ({
            value: supplier.bp_code,
            label: `${supplier.bp_code} | ${supplier.bp_name}`,
          }));
        }
  
        if (suppliersList.length > 0) {
          setSuppliers(suppliersList);
        } else {
          toast.warn('No suppliers found in the response');
        }
      } else {
        throw new Error('Invalid response structure from API');
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      if (error instanceof Error) {
        toast.error(`Error fetching suppliers: ${error.message}`);
      } else {
        toast.error('Error fetching suppliers');
      }
    }
  };

  const handleSupplierChange = (selectedOption: { value: string; label: string } | null) => {
    setSelectedSupplier(selectedOption);
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
    if (!selectedSupplier || !firstName || !role || !username || !password || !email) {
      Swal.fire('Error', 'Please fill all required fields correctly.', 'error');
      return;
    }

    const payload = {
      bp_code: selectedSupplier.value,
      name: firstName,
      role,
      status: "1",
      username,
      password,
      email: email.trim(),
    };

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(API_Create_User_Admin(), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      console.log(result); // Add this to inspect the response

      if (response.ok && result.message === 'User created') {
        toast.success('User successfully created!');
        resetForm();
      } else {
        const errorMessages = Object.values(result.errors || {}).flat().join(', ');
        toast.error(errorMessages || 'Failed to create user');
      }
    } catch (error) {
      console.error('Error during user creation:', error);
      toast.error('An error occurred while creating the user.');
    }
  };

  const resetForm = () => {
    setSelectedSupplier(null);
    setFirstName("");
    setUsername("");
    setEmail("");
    setPassword("");
    setRole("");
  };

  return (
    <>
      <ToastContainer position="top-right" />
      <Breadcrumb pageName="Add User" />
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <form onSubmit={handleSubmit} className="max-w-[1024px] mx-auto">
          <div className="p-4 md:p-6.5">
            {/* Supplier Selection */}
            <div className="mb-4.5 w-full">
              <label className="mb-2.5 block text-black dark:text-white">
                Select Supplier <span className="text-meta-1">*</span>
              </label>
              <div className="w-full max-w-[600px]">
                <Select
                  id="supplier_id"
                  options={suppliers}
                  value={selectedSupplier}
                  onChange={handleSupplierChange}
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
                  {roles.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
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
                Password <span className="text-meta-1">*</span>
              </label>
              <div className="flex flex-col md:flex-row gap-4 md:gap-6">
                <div className="relative w-full md:w-[300px]">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password (min. 8 characters)"
                    required
                    minLength={8}
                    className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-4"
                  >
                    {showPassword ? (
                      <FaEyeSlash className="text-gray-500" />
                    ) : (
                      <FaEye className="text-gray-500" />
                    )}
                  </button>
                </div>
                <Button
                  title="Generate Password"
                  onClick={generateRandomPassword}
                  className="md:self-center"
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
              title="Create User"
              type="submit"
              className="w-full justify-center"
            />
          </div>
        </form>
      </div>
    </>
  );
};

export default AddUser;