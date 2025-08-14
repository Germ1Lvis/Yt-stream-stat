import React from 'react';

interface StatCardProps {
  icon: React.ReactNode;
  value: string;
  label: string;
  color: string;
  valueIsApproximated?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ icon, value, label, color, valueIsApproximated = false }) => {
  return (
    <div className="bg-gray-800/50 p-4 rounded-lg flex flex-col items-start justify-between h-full">
      <div className={`rounded-md p-2 mb-4 ${color}`}>
        {icon}
      </div>
      <div className="mt-auto">
        <p className={`text-2xl font-bold ${valueIsApproximated ? 'text-gray-400' : 'text-white'}`}>{value}</p>
        <p className="text-sm text-gray-400">{label}</p>
      </div>
    </div>
  );
};

export default StatCard;