import React from 'react';

const Footer: React.FC = () => {
    return (
        <footer className="w-full py-4 text-center bg-purple-50 text-black dark:bg-boxdark dark:text-white">
            &copy; {new Date().getFullYear()}. All rights reserved | <a href="https://sanohindonesia.co.id/" target="_blank" className='text-primary'>Sanoh Indonesia</a>
        </footer>
    );
};

export default Footer;