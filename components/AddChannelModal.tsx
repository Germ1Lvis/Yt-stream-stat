
import React, { useState, useEffect } from 'react';
import { PlusIcon } from './icons';

interface AddChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddChannel: (channelHandle: string) => Promise<void>;
  isAdding: boolean;
  error: string | null;
}

const AddChannelModal: React.FC<AddChannelModalProps> = ({ isOpen, onClose, onAddChannel, isAdding, error }) => {
  const [channelHandle, setChannelHandle] = useState('');

  useEffect(() => {
    if (isOpen) {
      setChannelHandle('');
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (channelHandle.trim()) {
      onAddChannel(channelHandle.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" aria-modal="true" role="dialog">
      <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md m-4">
        <h2 className="text-2xl font-bold text-white mb-4">Add a New Channel</h2>
        <form onSubmit={handleSubmit}>
          <p className="text-gray-400 mb-4 text-sm">
            Enter the channel's handle (e.g., @MrBeast) or the full channel name.
          </p>
          <input
            type="text"
            value={channelHandle}
            onChange={(e) => setChannelHandle(e.target.value)}
            placeholder="@channelhandle"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            autoFocus
            disabled={isAdding}
          />
          {error && <p className="text-red-400 mt-2 text-sm">{error}</p>}
          <div className="mt-6 flex justify-end gap-x-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isAdding}
              className="px-4 py-2 text-sm font-medium rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-gray-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!channelHandle.trim() || isAdding}
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed"
            >
              {isAdding ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Adding...
                </>
              ) : (
                <>
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Add Channel
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddChannelModal;
