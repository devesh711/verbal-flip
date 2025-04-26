import React from 'react';
import { useChat } from '../context/ChatContext';
import { Settings } from 'lucide-react';

const UserSettings: React.FC = () => {
  const { currentUser, updateUserLanguage } = useChat();

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-lg font-semibold mb-4 flex items-center">
        <Settings className="mr-2" size={20} />
        Settings
      </h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Preferred Language
          </label>
          <select
            value={currentUser.preferredLanguage}
            onChange={(e) => updateUserLanguage(e.target.value as 'en' | 'ta')}
            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="en">English</option>
            <option value="ta">தமிழ் (Tamil)</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default UserSettings;