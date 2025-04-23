import { FaClipboardList } from "react-icons/fa";
import { NavLink } from "react-router-dom";

const GRTrackingSup = () => {
    return (
        <li>
            <NavLink
                to="/grtracking"
                className={({ isActive }) =>
                    `group relative flex items-center gap-2.5 rounded-sm py-2 px-4 font-medium duration-300 ease-in-out ${
                        isActive
                            ? 'bg-fuchsia-900 text-white'
                            : 'text-black-2 dark:text-bodydark2 hover:bg-fuchsia-100 hover:text-fuchsia-900 dark:hover:bg-meta-4'
                    }`
                }
            >
                <FaClipboardList className="fill-current" size={18} />
                GR Tracking
            </NavLink>
        </li>
    );
};

export default GRTrackingSup;
