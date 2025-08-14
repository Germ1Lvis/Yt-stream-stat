
import React, { useState, useCallback, useEffect } from 'react';
import { ChannelAnalytics } from '../types';
import { analyzeVideosFromImage } from '../services/youtubeImageAnalysisService';
import { getChannelAnalytics } from '../services/youtubeAnalyticsService';
import ChannelCard from './ChannelCard';
import AddChannelModal from './AddChannelModal';
import { RefreshIcon, DownloadIcon, PlusIcon } from './icons';

// --- Helper Functions ---

const fileToBase64 = (file: File): Promise<{mimeType: string, data: string}> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
        const result = reader.result as string;
        const [header, data] = result.split(',');
        const mimeType = header.match(/:(.*?);/)?.[1] || 'application/octet-stream';
        resolve({ mimeType, data });
    }
    reader.onerror = (error) => reject(error);
  });

const parseDurationToHours = (durationStr: string): number => {
  if (!durationStr || typeof durationStr !== 'string') return 0;
  const parts = durationStr.split(':').map(part => parseInt(part, 10));
  if (parts.some(isNaN)) return 0;
  let hours = 0;
  if (parts.length === 3) {
    hours = parts[0] + (parts[1] / 60) + (parts[2] / 3600);
  } else if (parts.length === 2) {
    hours = (parts[0] / 60) + (parts[1] / 3600);
  } else if (parts.length === 1) {
    hours = parts[0] / 3600;
  }
  return hours;
};

const isWithinLast365Days = (dateStr: string): boolean => {
    try {
        if (!dateStr || typeof dateStr !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
        const videoDate = new Date(`${dateStr}T00:00:00Z`);
        if (isNaN(videoDate.getTime())) return false;
        const oneYearAgo = new Date();
        oneYearAgo.setDate(oneYearAgo.getDate() - 365);
        oneYearAgo.setHours(0, 0, 0, 0);
        return videoDate >= oneYearAgo;
    } catch {
        return false;
    }
};

const CHANNELS_STORAGE_KEY = 'youtube-stream-analyzer-channels';

const Dashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<ChannelAnalytics[]>([]);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [analyzingChannelId, setAnalyzingChannelId] = useState<string | null>(null);
  
  // State for Add Channel Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddingChannel, setIsAddingChannel] = useState(false);
  const [addChannelError, setAddChannelError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setError(null);
        setInitialLoading(true);
        const storedData = localStorage.getItem(CHANNELS_STORAGE_KEY);
        if (storedData) {
            console.log("Loading channels from localStorage");
            setAnalytics(JSON.parse(storedData));
        } else {
            console.log("No localStorage data found, loading from initial file.");
            const response = await fetch('./youtube-analytics-export.json');
            
            if (!response.ok) {
                throw new Error(`Failed to fetch ${response.url}: ${response.statusText}`);
            }

            const initialData = await response.json();

            if (!Array.isArray(initialData)) {
                throw new Error("Initial data file is not a valid JSON array.");
            }

            setAnalytics(initialData);
            localStorage.setItem(CHANNELS_STORAGE_KEY, JSON.stringify(initialData));
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred while loading channel data.';
        setError(`Failed to load initial data: ${errorMessage}`);
        console.error(err);
      } finally {
        setInitialLoading(false);
      }
    };

    fetchInitialData();
  }, []);
  
  const updateAnalyticsAndStorage = useCallback((newAnalytics: ChannelAnalytics[]) => {
    setAnalytics(newAnalytics);
    try {
        localStorage.setItem(CHANNELS_STORAGE_KEY, JSON.stringify(newAnalytics));
    } catch (e) {
        console.error("Failed to save data to localStorage", e);
        setError("Could not save updated channel list locally. Changes may be lost on refresh.");
    }
  }, []);


  const handleAnalyzeImage = useCallback(async (channelId: string, imageFile: File) => {
      setAnalyzingChannelId(channelId);
      setError(null);
      try {
          const { mimeType, data: base64Data } = await fileToBase64(imageFile);
          const { videos, totalFollowers: extractedFollowers } = await analyzeVideosFromImage(base64Data, mimeType);
          
          const recentVideos = videos.filter(video => isWithinLast365Days(video.publishedAt));
          
          const totalStreams = recentVideos.length;
          const hoursStreamed = recentVideos.reduce((total, video) => {
              return total + parseDurationToHours(video.duration);
          }, 0);
          
          const totalViews = recentVideos.reduce((total, video) => total + (video.views || 0), 0);
          const averageViews = totalStreams > 0 ? Math.round(totalViews / totalStreams) : 0;

          const lastUpdatedAt = new Date().toISOString();

          const newAnalytics = analytics.map(channel => {
            if (channel.id === channelId) {
              const updatedFollowers = typeof extractedFollowers === 'number' && extractedFollowers > 0 
                ? extractedFollowers 
                : channel.totalFollowers;

              return { 
                  ...channel, 
                  totalStreams, 
                  hoursStreamed, 
                  averageViews,
                  totalFollowers: updatedFollowers,
                  lastUpdatedAt 
              };
            }
            return channel;
          });
          updateAnalyticsAndStorage(newAnalytics);

      } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during image analysis.';
          setError(`Analysis failed for channel ${channelId}: ${errorMessage}`);
          console.error(err);
      } finally {
          setAnalyzingChannelId(null);
      }
  }, [analytics, updateAnalyticsAndStorage]);
  
  const handleExportAllData = useCallback(() => {
    try {
      const dataStr = JSON.stringify(analytics, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'youtube-analytics-export.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch(e) {
      console.error("Failed to export data:", e);
      setError("Could not export data due to a browser error.");
    }
  }, [analytics]);

  const handleResetToOriginalData = useCallback(() => {
    if (window.confirm("Are you sure you want to reset all channel data? This will remove all added channels and clear any updates. This action cannot be undone.")) {
      try {
        localStorage.removeItem(CHANNELS_STORAGE_KEY);
        alert("Local cache cleared. The application will now reload with the original data set.");
        window.location.reload();
      } catch (e) {
        console.error("Failed to clear localStorage:", e);
        setError("Could not clear local cache. Please clear your browser's site data manually.");
      }
    }
  }, []);

  const handleAddChannel = async (channelHandle: string) => {
      setIsAddingChannel(true);
      setAddChannelError(null);
      setError(null);
      try {
          if (analytics.some(c => c.channelHandle.toLowerCase() === channelHandle.toLowerCase() || c.channelName.toLowerCase() === channelHandle.toLowerCase())) {
              throw new Error(`Channel "${channelHandle}" is already in the list.`);
          }
          const channelData = await getChannelAnalytics(channelHandle);
          const newChannel: ChannelAnalytics = {
              ...channelData,
              hoursStreamed: 0,
              totalStreams: 0,
              averageViews: 0,
              lastUpdatedAt: null,
          };
          updateAnalyticsAndStorage([...analytics, newChannel]);
          setIsAddModalOpen(false);
      } catch(err) {
          const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
          setAddChannelError(`Failed to add channel: ${errorMessage}`);
          console.error(err);
      } finally {
          setIsAddingChannel(false);
      }
  };

  const handleDeleteChannel = (channelId: string) => {
      setError(null);
      const newAnalytics = analytics.filter(channel => channel.id !== channelId);
      updateAnalyticsAndStorage(newAnalytics);
  };

  if (initialLoading) {
    return (
        <div className="text-center text-gray-400 p-10">
            <div className="flex justify-center items-center mb-4">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Loading Channels...</h2>
        </div>
    );
  }

  return (
    <>
      <AddChannelModal 
        isOpen={isAddModalOpen}
        onClose={() => {
            setIsAddModalOpen(false);
            setAddChannelError(null);
        }}
        onAddChannel={handleAddChannel}
        isAdding={isAddingChannel}
        error={addChannelError}
      />

      {error && (
        <div className="text-center text-red-400 bg-red-900/50 p-6 rounded-lg mb-8 text-xl whitespace-pre-wrap">{error}</div>
      )}

      <div className="flex justify-end mb-6 gap-x-4">
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-green-500 transition-all duration-200"
          aria-label="Add a new channel to the list"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Channel
        </button>
        <button 
          onClick={handleExportAllData}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500 transition-all duration-200"
          aria-label="Export all updated channel data to a JSON file"
        >
          <DownloadIcon className="h-5 w-5 mr-2" />
          Export Updated Data
        </button>
        <button 
          onClick={handleResetToOriginalData}
          className="inline-flex items-center px-4 py-2 border border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-red-500 transition-all duration-200"
          aria-label="Clear local cache and reset all channel data to original"
        >
          <RefreshIcon className="h-5 w-5 mr-2" />
          Reset Data
        </button>
      </div>

      {analytics.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {analytics.map(channel => (
            <ChannelCard 
                key={channel.id} 
                channel={channel} 
                onAnalyze={handleAnalyzeImage}
                isAnalyzing={analyzingChannelId === channel.id}
                onDelete={handleDeleteChannel}
            />
          ))}
        </div>
      ) : (
         !error && (
            <div className="text-center text-gray-400 bg-gray-800/50 p-10 rounded-lg mt-10">
                <h2 className="text-2xl font-bold text-white mb-2">No channels found</h2>
                <p className="mb-4">Add a channel to get started, or reset data to restore the default channels.</p>
            </div>
         )
      )}
    </>
  );
};

export default Dashboard;