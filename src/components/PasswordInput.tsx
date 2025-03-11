import { FC, useState } from 'react';

interface PasswordInputProps {
  password: string;
  setPassword: (password: string) => void;
  isRequired?: boolean;
}

const PasswordInput: FC<PasswordInputProps> = ({ password, setPassword, isRequired }) => {
  const [showPassword, setShowPassword] = useState(false);

  const togglePassword = () => setShowPassword(!showPassword);

  return (
    <>
      <label htmlFor="password" className="mb-2 text-base text-slate-800">
        Password
      </label>
      <div className="flex justify-between">
        <div className="flex gap-5 justify-between items-center min-h-[48px] w-full relative">
          <input
            type={showPassword ? 'text' : 'password'}
            id="password"
            placeholder="Enter Password"
            className="px-4 py-3.5 w-full bg-white rounded-lg border border-solid border-indigo-600 border-opacity-40 min-h-[48px] text-base text-black shadow-[0px_4px_8px_rgba(70,95,241,0.1)]"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required={isRequired}
          />
          <button
            type="button"
            onClick={togglePassword}
            className="absolute inset-y-0 right-0 flex items-center z-20 px-3 cursor-pointer text-gray-400 rounded-e-md focus:outline-none focus:text-blue-600"
          >
            <svg
              id="eye-icon"
              className="shrink-0 size-3.5"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {showPassword ? (
                <>
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </>
              ) : (
                <>
                  <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path>
                  <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path>
                  <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path>
                  <line x1="2" y1="2" x2="22" y2="22"></line>
                </>
              )}
            </svg>
          </button>
        </div>
      </div>
    </>
  );
};

export default PasswordInput;
