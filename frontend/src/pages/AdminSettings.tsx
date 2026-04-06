import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.tsx';
import { changePassword } from '../services/api.ts';
import api from '../services/api.ts';
import { FaArrowLeft, FaUser } from 'react-icons/fa';

const AdminSettings: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [userData, setUserData] = useState({
    email: ''
  });
  const [loading, setLoading] = useState(true);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [passwordData, setPasswordData] = useState({
    new_password: '',
    confirm_password: '',
  });
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordMatch, setPasswordMatch] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await api.get('/auth/me');
      setUserData({
        email: response.data.email || ''
      });
    } catch (err) {
      console.error('Failed to fetch user data:', err);
      setError('Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const calculatePasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[a-z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    setPasswordStrength(strength);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPasswordData({
      ...passwordData,
      [e.target.name]: newPassword,
    });
    calculatePasswordStrength(newPassword);
    
    if (passwordData.confirm_password) {
      setPasswordMatch(newPassword === passwordData.confirm_password);
    } else {
      setPasswordMatch(null);
    }
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const confirmPassword = e.target.value;
    setPasswordData({
      ...passwordData,
      confirm_password: confirmPassword,
    });
    setPasswordMatch(passwordData.new_password === confirmPassword);
  };

  const handleSubmitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await changePassword({
        current_password: currentPassword,
        new_password: passwordData.new_password,
        confirm_password: passwordData.confirm_password,
      });
      
      setSuccess('Password changed successfully!');
      setCurrentPassword('');
      setPasswordData({ new_password: '', confirm_password: '' });
      setPasswordStrength(0);
      setPasswordMatch(null);
      
      setTimeout(() => {
        setShowChangePassword(false);
        setSuccess(null);
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const getStrengthColor = (strength: number) => {
    if (strength === 0) return 'bg-gray-600';
    if (strength <= 25) return 'bg-red-600';
    if (strength <= 50) return 'bg-yellow-600';
    if (strength <= 75) return 'bg-blue-600';
    return 'bg-green-600';
  };

  const getStrengthText = (strength: number) => {
    if (strength === 0) return 'Very Weak';
    if (strength <= 25) return 'Weak';
    if (strength <= 50) return 'Fair';
    if (strength <= 75) return 'Good';
    return 'Strong';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-starlink-darker flex items-center justify-center">
        <div className="text-starlink-text text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-starlink-darker p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/admin/customers')}
            className="flex items-center gap-2 text-starlink-text-secondary hover:text-starlink-text transition-colors mb-4"
          >
            <FaArrowLeft />
            <span>Back to Portal</span>
          </button>
          <h1 className="text-3xl font-bold text-starlink-text">Settings</h1>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-700 text-red-200 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-900/20 border border-green-700 text-green-200 px-4 py-3 rounded mb-6">
            {success}
          </div>
        )}

        {!showChangePassword ? (
          <div className="space-y-6">
            {/* Profile Information */}
            <div className="card p-6">
              <h2 className="text-xl font-semibold text-starlink-text mb-4">Profile Information</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-starlink-light rounded-lg">
                  <FaUser className="text-starlink-accent mt-1" size={20} />
                  <div className="flex-1">
                    <p className="text-xs text-starlink-text-secondary uppercase tracking-wide mb-1">Email</p>
                    <p className="text-starlink-text font-medium">{userData.email || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Change Password Button */}
            <button
              onClick={() => setShowChangePassword(true)}
              className="w-full btn-primary py-3 px-6"
            >
              Change Password
            </button>
          </div>
        ) : (
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-starlink-text mb-6">Change Password</h2>
            <form onSubmit={handleSubmitPassword} className="space-y-4">
              {/* Current Password */}
              <div>
                <label className="block text-sm text-starlink-text-secondary mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-starlink-light border border-starlink-border rounded text-starlink-text focus:outline-none focus:border-starlink-accent"
                  placeholder="Enter current password"
                />
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm text-starlink-text-secondary mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  name="new_password"
                  value={passwordData.new_password}
                  onChange={handlePasswordChange}
                  required
                  className="w-full px-4 py-3 bg-starlink-light border border-starlink-border rounded text-starlink-text focus:outline-none focus:border-starlink-accent"
                  placeholder="Enter new password"
                />
                {passwordData.new_password && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-starlink-text-secondary">Password Strength</span>
                      <span className="text-starlink-text">{getStrengthText(passwordStrength)}</span>
                    </div>
                    <div className="w-full bg-starlink-gray rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor(passwordStrength)}`}
                        style={{ width: `${passwordStrength}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm text-starlink-text-secondary mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  name="confirm_password"
                  value={passwordData.confirm_password}
                  onChange={handleConfirmPasswordChange}
                  required
                  className={`w-full px-4 py-3 bg-starlink-light border rounded text-starlink-text focus:outline-none ${
                    passwordMatch === null
                      ? 'border-starlink-border focus:border-starlink-accent'
                      : passwordMatch
                      ? 'border-green-600 focus:border-green-600'
                      : 'border-red-600 focus:border-red-600'
                  }`}
                  placeholder="Confirm new password"
                />
                {passwordMatch === false && (
                  <p className="text-xs text-red-500 mt-2">Passwords do not match</p>
                )}
                {passwordMatch === true && (
                  <p className="text-xs text-green-500 mt-2">Passwords match</p>
                )}
              </div>

              {/* Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowChangePassword(false);
                    setCurrentPassword('');
                    setPasswordData({ new_password: '', confirm_password: '' });
                    setPasswordStrength(0);
                    setPasswordMatch(null);
                    setError(null);
                  }}
                  className="flex-1 py-3 px-6 bg-starlink-light border border-starlink-border text-starlink-text rounded hover:bg-starlink-gray transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={saving || !passwordMatch || passwordStrength < 75}
                  className="flex-1 btn-primary py-3 px-6 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSettings;
