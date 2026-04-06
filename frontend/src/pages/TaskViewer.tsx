import React, { useState, useEffect } from 'react';
import { listTasks } from '../services/api.ts';

const TaskViewer: React.FC = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await listTasks();
      setTasks(response.tasks || response.items || []);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6 text-center"><h2 className="text-lg text-starlink-text">Loading tasks...</h2></div>;

  if (error) {
    return (
      <div className="p-4">
        <div className="p-3 bg-red-900/50 border border-red-700 text-red-200 rounded text-sm">Error: {error}</div>
        <button onClick={fetchTasks} className="mt-3 btn-secondary text-sm">Retry</button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-10 max-w-6xl mx-auto">
      <h2 className="text-xl md:text-3xl font-bold mb-4 md:mb-8 text-starlink-text">Tasks ({tasks.length})</h2>
      {tasks.length === 0 ? (
        <div className="card text-center py-6"><p className="text-starlink-text-secondary text-sm">No tasks found</p></div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[500px]">
              <thead>
                <tr className="bg-starlink-light border-b-2 border-starlink-border">
                  <th className="p-2 md:p-3 text-left text-starlink-text text-xs md:text-sm">Task ID</th>
                  <th className="p-2 md:p-3 text-left text-starlink-text text-xs md:text-sm">Type</th>
                  <th className="p-2 md:p-3 text-left text-starlink-text text-xs md:text-sm">Status</th>
                  <th className="p-2 md:p-3 text-left text-starlink-text text-xs md:text-sm hidden sm:table-cell">Created</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task: any, index: number) => (
                  <tr key={task.id || index} className="border-b border-starlink-border hover:bg-starlink-light/50 transition-colors">
                    <td className="p-2 md:p-3 text-starlink-text text-xs md:text-sm">{task.id || 'N/A'}</td>
                    <td className="p-2 md:p-3 text-starlink-text text-xs md:text-sm">{task.type || task.taskType || 'N/A'}</td>
                    <td className="p-2 md:p-3">
                      <span className={`px-2 py-1 rounded text-[10px] md:text-xs ${
                        task.status === 'completed' ? 'bg-green-600 text-white' : 
                        task.status === 'pending' ? 'bg-yellow-500 text-black' : 
                        'bg-gray-600 text-white'
                      }`}>{task.status || 'Unknown'}</span>
                    </td>
                    <td className="p-2 md:p-3 text-starlink-text text-xs md:text-sm hidden sm:table-cell">{task.createdAt ? new Date(task.createdAt).toLocaleString() : 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <button onClick={fetchTasks} className="btn-primary mt-3 md:mt-5 text-sm">Refresh</button>
    </div>
  );
};

export default TaskViewer;
