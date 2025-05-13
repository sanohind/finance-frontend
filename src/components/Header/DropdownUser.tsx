import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import UserLogo from '../../images/user/user_logo_default.png';
import { useAuth } from '../../pages/Authentication/AuthContext';
import ClickOutside from '../../components/ClickOutside';

const DropdownUser = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [name, setName] = useState('');
  const [userRoleDisplay, setUserRoleDisplay] = useState('');
  const [supplierImage, setSupplierImage] = useState('');
  const { logout, userRole, isLoading } = useAuth(); // Destructure isLoading

  useEffect(() => {
    const storedName = localStorage.getItem('name');
    if (storedName) {
      setName(storedName);
    }

    let roleForSwitch: string | null = null;

    if (isLoading) {
      // While auth state is loading, try to use localStorage for an optimistic update
      const lsRole = localStorage.getItem('role'); // lsRole is string or null
      if (lsRole) { // If lsRole is a non-empty string (could be '1', '2', '3', or other)
        roleForSwitch = lsRole;
      }
    } else {
      // Auth state loading is complete, userRole from context is the source of truth
      if (userRole !== null) { // userRole is '1', '2', or '3'
        roleForSwitch = userRole; // userRole is already a string '1', '2', or '3'
      }
      // if userRole is null, roleForSwitch remains null
    }

    let newRoleText = 'User'; // Default display text

    if (roleForSwitch) {
      switch (roleForSwitch) {
        case '1':
          newRoleText = 'Super Admin';
          break;
        case '2':
          newRoleText = 'Finance';
          break;
        case '3':
          newRoleText = 'Supplier Finance';
          break;
        // default: newRoleText remains 'User' for unknown non-empty string roles from localStorage
      }
    } else {
      // roleForSwitch is null. This means:
      // 1. isLoading is true, and no valid role in localStorage.
      // 2. isLoading is false, and userRole from context is null (indicating no role or logged out).
      if (!isLoading && userRole === null) {
        newRoleText = 'Guest'; // Explicitly 'Guest' if confirmed logged out or no role after loading.
      }
      // else (e.g., isLoading is true and no lsRole), newRoleText remains 'User' as a placeholder.
    }
    
    setUserRoleDisplay(newRoleText);

    // Logic for supplier image
    const storedSupplierNameForImage = localStorage.getItem('supplier_name');
    if (storedSupplierNameForImage) {
      setSupplierImage(`https://picsum.photos/seed/${storedSupplierNameForImage}/200`);
    } else {
      setSupplierImage(''); // Clear previous image if no supplier_name, to allow UserLogo fallback
    }
  }, [userRole, isLoading]); // Dependencies for the effect

  const handleLogout = async () => {
    // SweetAlert2 for logout confirmation
    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you really want to log out?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#1e3a8a',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, log out!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        logout(); // Memanggil fungsi logout Anda
      }
    });
  };

  return (
    <ClickOutside onClick={() => setDropdownOpen(false)} className="relative">
      <Link
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-4"
        to="#"
      >
        <span className="hidden text-right lg:block">
          <span className="block text-sm font-medium text-black dark:text-white">
            {name || 'User Testing'} {/* Menampilkan nama dari localStorage */}
          </span>
          <span className="block text-xs">
            {userRoleDisplay} {/* Display the mapped role name here */}
          </span>
        </span>

        <span className="h-12 w-12 rounded-full">
          <img
            src={supplierImage || UserLogo}
            alt="User"
            onError={(e) => {
              e.currentTarget.src = UserLogo;
            }}
            className="rounded-full"
          />
        </span>

        <svg
          className="hidden fill-current sm:block"
          width="12"
          height="8"
          viewBox="0 0 12 8"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M0.410765 0.910734C0.736202 0.585297 1.26384 0.585297 1.58928 0.910734L6.00002 5.32148L10.4108 0.910734C10.7362 0.585297 11.2638 0.585297 11.5893 0.910734C11.9147 1.23617 11.9147 1.76381 11.5893 2.08924L6.58928 7.08924C6.26384 7.41468 5.7362 7.41468 5.41077 7.08924L0.410765 2.08924C0.0853277 1.76381 0.0853277 1.23617 0.410765 0.910734Z"
            fill=""
          />
        </svg>
      </Link>

      {/* Dropdown Start */}
      {dropdownOpen && (
        <div
          className={`absolute right-0 mt-4 flex w-62.5 flex-col rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark`}
        > 
          <button
            onClick={handleLogout} // Panggil handleLogout ketika diklik
            className="flex items-center gap-3.5 px-6 py-4 text-sm font-medium duration-300 ease-in-out hover:text-primary lg:text-base"
          >
            <svg
              className="fill-current"
              width="22"
              height="22"
              viewBox="0 0 22 22"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M15.5375 0.618744H11.6531C10.7594 0.618744 10.0031 1.37499 10.0031 2.26874V4.64062C10.0031 5.05312 10.3469 5.39687 10.7594 5.39687C11.1719 5.39687 11.55 5.05312 11.55 4.64062V2.23437C11.55 2.16562 11.5844 2.13124 11.6531 2.13124H15.5375C16.3625 2.13124 17.0156 2.78437 17.0156 3.60937V18.3562C17.0156 19.1812 16.3625 19.8344 15.5375 19.8344H11.6531C11.5844 19.8344 11.55 19.8 11.55 19.7312V17.3594C11.55 16.9469 11.2062 16.6031 10.7594 16.6031C10.3125 16.6031 10.0031 16.9469 10.0031 17.3594V19.7312C10.0031 20.625 10.7594 21.3812 11.6531 21.3812H15.5375C17.2219 21.3812 18.5625 20.0062 18.5625 18.3562V3.64374C18.5625 1.95937 17.1875 0.618744 15.5375 0.618744Z"
                fill=""
              />
              <path
                d="M6.05001 11.7563H12.2031C12.6156 11.7563 12.9594 11.4125 12.9594 11C12.9594 10.5875 12.6156 10.2438 12.2031 10.2438H6.08439L8.21564 8.07813C8.52501 7.76875 8.52501 7.2875 8.21564 6.97812C7.90626 6.66875 7.42501 6.66875 7.11564 6.97812L3.67814 10.4844C3.36876 10.7938 3.36876 11.275 3.67814 11.5844L7.11564 15.0906C7.25314 15.2281 7.45939 15.3312 7.66564 15.3312C7.87189 15.3312 8.04376 15.2625 8.21564 15.125C8.52501 14.8156 8.52501 14.3344 8.21564 14.025L6.05001 11.7563Z"
                fill=""
              />
            </svg>
            Log Out
          </button>
        </div>
      )}
      {/* Dropdown End */}
    </ClickOutside>
  );
};

export default DropdownUser;
