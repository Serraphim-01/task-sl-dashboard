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

  if (loading) return <div className="p-10 text-center"><h2 className="text-xl text-starlink-text">Loading tasks...</h2></div>;

  if (error) {
    return (
      <div className="p-10">
        <div className="p-4 bg-red-900/50 border border-red-700 text-red-200 rounded">Error: {error}</div>
        <button onClick={fetchTasks} className="mt-5 btn-secondary">Retry</button>
      </div>
    );
  }

  return (
    <div className="p-10 max-w-6xl mx-auto">
      <h2 className="text-3xl font-bold mb-8 text-starlink-text">Tasks ({tasks.length})</h2>
      {tasks.length === 0 ? (
        <div className="card text-center py-10"><p className="text-starlink-text-secondary">No tasks found</p></div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-starlink-light border-b-2 border-starlink-border">
                <th className="p-3 text-left text-starlink-text">Task ID</th>
                <th className="p-3 text-left text-starlink-text">Type</th>
                <th className="p-3 text-left text-starlink-text">Status</th>
                <th className="p-3 text-left text-starlink-text">Created</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task: any, index: number) => (
                <tr key={task.id || index} className="border-b border-starlink-border hover:bg-starlink-light/50 transition-colors">
                  <td className="p-3 text-starlink-text">{task.id || 'N/A'}</td>
                  <td className="p-3 text-starlink-text">{task.type || task.taskType || 'N/A'}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs ${
                      task.status === 'completed' ? 'bg-green-600 text-white' : 
                      task.status === 'pending' ? 'bg-yellow-500 text-black' : 
                      'bg-gray-600 text-white'
                    }`}>{task.status || 'Unknown'}</span>
                  </td>
                  <td className="p-3 text-starlink-text">{task.createdAt ? new Date(task.createdAt).toLocaleString() : 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <button onClick={fetchTasks} className="btn-primary mt-5">Refresh</button>
    </div>
  );
};

export default TaskViewer;
