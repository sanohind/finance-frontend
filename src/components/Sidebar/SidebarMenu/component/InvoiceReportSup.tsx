import { FaFileAlt } from 'react-icons/fa';  // Import the appropriate icon for report
import { NavLink } from 'react-router-dom';

const InvoiceReportSup = () => {
    return (
        <li>
            <NavLink
                to="/invoicereport"
                className={({ isActive }) =>
                    `group relative flex items-center gap-2.5 rounded-sm py-2 px-4 font-medium duration-300 ease-in-out ${
                        isActive
                            ? 'bg-fuchsia-900 text-white'
                            : 'text-black-2 dark:text-bodydark2 hover:bg-fuchsia-100 hover:text-fuchsia-900 dark:hover:bg-meta-4'
                    }`
                }
            >
                <FaFileAlt className="fill-current" size={18} />  {/* Use FaFileAlt for report */}
                Invoice Report
            </NavLink>
        </li>
    );
};

export default InvoiceReportSup;
