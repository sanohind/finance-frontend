import { FaFileCirclePlus } from "react-icons/fa6";
import { NavLink } from "react-router-dom";

const InvoiceCreationSup = () => {
    return (
        <li>
            <NavLink
                to="/invoicecreation"
                className={({ isActive }) =>
                    `group relative flex items-center gap-2.5 rounded-sm py-2 px-4 font-medium duration-300 ease-in-out ${
                        isActive
                            ? 'bg-fuchsia-900 text-white'
                            : 'text-black-2 dark:text-bodydark2 hover:bg-fuchsia-100 hover:text-fuchsia-900 dark:hover:bg-meta-4'
                    }`
                }
            >
                <FaFileCirclePlus className="fill-current" size={18} />
                Invoice Creation
            </NavLink>
        </li>
    );
};

export default InvoiceCreationSup;
