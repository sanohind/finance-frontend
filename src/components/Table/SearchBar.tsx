import { FaSearch } from 'react-icons/fa';

interface SearchBarProps {
  placeholder: string;
  onSearchChange: (value: string) => void;
}

const SearchBar = ({ placeholder, onSearchChange }: SearchBarProps) => {
  return (
    <div className="flex items-center shadow border border-gray-300 rounded-lg px-2 py-1 w-full">
      <FaSearch className="text-gray-600 mr-1 ml-2" />
      <input
        type="text"
        className="w-full px-2 py-1 outline-none"
        placeholder={placeholder}
        onChange={(e) => onSearchChange(e.target.value)}
      />
    </div>
  );
};

export default SearchBar;
