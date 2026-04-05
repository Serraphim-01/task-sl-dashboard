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

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}><h2>Loading tasks...</h2></div>;

  if (error) {
    return (
      <div style={{ padding: '40px' }}>
        <div style={{ padding: '15px', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '4px' }}>Error: {error}</div>
        <button onClick={fetchTasks} style={{ marginTop: '20px', padding: '10px 20px', cursor: 'pointer' }}>Retry</button>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '30px' }}>⚙️ Tasks ({tasks.length})</h2>
      {tasks.length === 0 ? (
        <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '8px', textAlign: 'center' }}><p>No tasks found</p></div>
      ) : (
        <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                <th style={{ padding: '12px', textAlign: 'left' }}>Task ID</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Type</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Created</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task: any, index: number) => (
                <tr key={task.id || index} style={{ borderBottom: '1px solid #dee2e6' }}>
                  <td style={{ padding: '12px' }}>{task.id || 'N/A'}</td>
                  <td style={{ padding: '12px' }}>{task.type || task.taskType || 'N/A'}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      backgroundColor: task.status === 'completed' ? '#28a745' : task.status === 'pending' ? '#ffc107' : '#6c757d',
                      color: task.status === 'pending' ? '#000' : '#fff',
                      fontSize: '12px',
                    }}>{task.status || 'Unknown'}</span>
                  </td>
                  <td style={{ padding: '12px' }}>{task.createdAt ? new Date(task.createdAt).toLocaleString() : 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <button onClick={fetchTasks} style={{ marginTop: '20px', padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px' }}>Refresh</button>
    </div>
  );
};

export default TaskViewer;
