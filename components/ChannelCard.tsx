
import React, { useRef } from 'react';
import { ChannelAnalytics } from '../types';
import StatCard from './StatCard';
import { ClockIcon, UserGroupIcon, VideoCameraIcon, LinkIcon, UserCircleIcon, UploadIcon, ExternalLinkIcon, EyeIcon, TrashIcon } from './icons';

interface ChannelCardProps {
  channel: ChannelAnalytics;
  onAnalyze: (channelId: string, file: File) => void;
  isAnalyzing: boolean;
  onDelete: (channelId: string) => void;
}

const formatNumber = (num: number | null | undefined): string => {
  if (typeof num !== 'number' || isNaN(num)) {
    return '0';
  }
  return num.toLocaleString('fr-FR');
};

const formatHoursAndMinutes = (totalHours: number): string => {
    if (typeof totalHours !== 'number' || isNaN(totalHours) || totalHours < 0) {
        return '0m';
    }

    let hours = Math.floor(totalHours);
    let minutes = Math.round((totalHours - hours) * 60);

    if (minutes === 60) {
        hours += 1;
        minutes = 0;
    }

    const hoursPart = hours > 0 ? `${hours}h` : '';
    const minutesPart = minutes > 0 ? `${minutes}m` : '';

    if (hoursPart && minutesPart) {
        return `${hoursPart} ${minutesPart}`;
    }
    
    return hoursPart || minutesPart || '0m';
};


const ChannelCard: React.FC<ChannelCardProps> = ({ channel, onAnalyze, isAnalyzing, onDelete }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAnalyzeClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onAnalyze(channel.id, file);
    }
  };

  const handleDeleteClick = () => {
      if (window.confirm(`Are you sure you want to remove the channel "${channel.channelName}"? This action cannot be undone.`)) {
          onDelete(channel.id);
      }
  };

  return (
    <div className="bg-gray-800 rounded-xl shadow-lg flex flex-col overflow-hidden transition-transform transform hover:scale-[1.02] duration-300 ease-in-out relative group">
      <button 
        onClick={handleDeleteClick}
        className="absolute top-3 right-3 z-20 p-2 rounded-full bg-gray-900/50 text-gray-400 hover:bg-red-500/80 hover:text-white transition-colors duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none"
        aria-label={`Delete ${channel.channelName}`}
      >
        <TrashIcon className="h-5 w-5" />
      </button>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        className="hidden"
        accept="image/*"
        aria-hidden="true"
      />

      <div className="p-6 flex-grow flex flex-col">
        <div className="flex items-center space-x-4 mb-6">
          {channel.profileImageUrl ? (
            <img src={channel.profileImageUrl} alt={channel.channelName} className="w-16 h-16 rounded-full border-2 border-indigo-500 object-cover bg-gray-700" />
          ) : (
            <div className="w-16 h-16 rounded-full border-2 border-indigo-500 bg-gray-700 flex items-center justify-center">
              <UserCircleIcon className="w-12 h-12 text-gray-500" />
            </div>
          )}
          <div>
            <h3 className="text-xl font-bold text-white">{channel.channelName}</h3>
            <a
              href={`https://www.youtube.com/${channel.channelHandle.replace('@', '')}/streams`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-indigo-400 hover:text-indigo-200 hover:underline transition-colors group/link inline-flex items-center gap-1.5"
              aria-label={`View live streams for ${channel.channelName}`}
            >
              <span>{channel.channelHandle}</span>
              <ExternalLinkIcon className="h-3.5 w-3.5 opacity-70 group-hover/link:opacity-100 transition-opacity" />
            </a>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6 relative">
           {isAnalyzing && (
            <div className="absolute inset-0 bg-gray-800/80 flex flex-col items-center justify-center rounded-lg z-10">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-2"></div>
                <p className="text-indigo-300 text-sm">Analyzing...</p>
            </div>
          )}
          <StatCard 
            icon={<UserGroupIcon className="h-6 w-6 text-white" />} 
            value={formatNumber(channel.totalFollowers)}
            label="Total Followers"
            color="bg-red-500/80"
          />
          <StatCard 
            icon={<EyeIcon className="h-6 w-6 text-white" />} 
            value={formatNumber(channel.averageViews)}
            label="Average Viewers"
            color="bg-blue-500/80"
          />
           <StatCard 
            icon={<ClockIcon className="h-6 w-6 text-white" />} 
            value={formatHoursAndMinutes(channel.hoursStreamed)}
            label="Hours Streamed"
            color="bg-yellow-500/80"
          />
          <StatCard 
            icon={<VideoCameraIcon className="h-6 w-6 text-white" />} 
            value={formatNumber(channel.totalStreams)}
            label="Total Streams"
            color="bg-pink-500/80"
          />
        </div>

        {channel.lastUpdatedAt && (
            <div className="text-center text-xs text-gray-400 mb-4">
                Dernière mise à jour: {new Date(channel.lastUpdatedAt).toLocaleString('fr-FR', {
                    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                })}
            </div>
        )}

        <div className="mt-auto">
            <button
                onClick={handleAnalyzeClick}
                disabled={isAnalyzing}
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-all duration-200"
                aria-label="Analyze streams from screenshot"
            >
                <UploadIcon className="h-5 w-5 mr-2" />
                Analyze with Screenshot
            </button>
        </div>
      </div>
      
      {channel.sources && channel.sources.length > 0 && (
        <div className="bg-gray-900/50 p-4 border-t border-gray-700">
            <h4 className="text-sm font-semibold text-gray-300 mb-2 flex items-center">
                <LinkIcon className="h-4 w-4 mr-2" />
                Data Sources
            </h4>
            <ul className="space-y-1">
                {channel.sources.map(source => (
                    <li key={source.uri}>
                        <a 
                            href={source.uri} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-indigo-400 hover:text-indigo-300 truncate block transition-colors"
                            title={source.title}
                        >
                           {source.title || new URL(source.uri).hostname}
                        </a>
                    </li>
                ))}
            </ul>
        </div>
      )}
    </div>
  );
};

export default ChannelCard;
