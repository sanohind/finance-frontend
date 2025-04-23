import { FaUsers } from "react-icons/fa";
import { NavLink, useLocation } from "react-router-dom";

const ListUser = () => {

    const location = useLocation();
    const currentPath = location.pathname;
    
    const userManagementPaths = ['/list-user', '/edit-user'];
    const isUserManagementActive = userManagementPaths.some(path => 
        currentPath.startsWith(path) || currentPath.includes(path)
    );
    
    return (
        <li>
            <NavLink
                to="/list-user"
                className={
                    `group relative flex items-center gap-2.5 rounded-sm py-2 px-4 font-medium duration-300 ease-in-out ${
                        isUserManagementActive
                        ? 'bg-purple-900 text-white'
                        : 'text-black-2 dark:text-bodydark2 hover:bg-purple-100 hover:text-purple-900 dark:hover:bg-meta-4'
                    }`
                }
            >
            <FaUsers className="fill-current" size={18} />
            List User
            </NavLink>
        </li>
    );
};

export default ListUser;