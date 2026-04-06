import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.tsx';
import { changePassword } from '../services/api.ts';
import { FaCog, FaTimes, FaUser } from 'react-icons/fa';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { user, isAdmin } = useAuth();
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [passwordData, setPasswordData] = useState({
    new_password: '',
    confirm_password: '',
  });
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordMatch, setPasswordMatch] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

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
    setLoading(true);
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
      setLoading(false);
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-starlink-black border border-starlink-border rounded-lg shadow-2xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-starlink-border">
          <h2 className="text-xl font-semibold text-starlink-text flex items-center gap-2">
            <FaCog className="text-starlink-accent" />
            Settings
          </h2>
          <button
            onClick={onClose}
            className="text-starlink-text-secondary hover:text-starlink-text transition-colors"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!showChangePassword ? (
            <>
              {/* Profile Information */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-starlink-text-muted uppercase mb-3">
                  Profile Information
                </h3>
                <div className="bg-starlink-light rounded-lg p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <FaUser className="text-starlink-accent mt-1" />
                    <div>
                      <p className="text-xs text-starlink-text-secondary">Email</p>
                      <p className="text-starlink-text font-medium">{user?.email || 'N/A'}</p>
                    </div>
                  </div>
                  {!isAdmin && (
                    <div className="flex items-start gap-3">
                      <FaUser className="text-starlink-accent mt-1" />
                      <div>
                        <p className="text-xs text-starlink-text-secondary">Organization</p>
                        <p className="text-starlink-text font-medium">{user?.enterpriseName || 'N/A'}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Change Password Button */}
              <button
                onClick={() => setShowChangePassword(true)}
                className="w-full btn-primary py-3 px-4 text-sm"
              >
                Change Password
              </button>
            </>
          ) : (
            <>
              {/* Change Password Form */}
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-starlink-text-muted uppercase mb-3">
                  Change Password
                </h3>
                
                {error && (
                  <div className="bg-red-900/20 border border-red-700 text-red-200 px-4 py-2 rounded mb-4 text-sm">
                    {error}
                  </div>
                )}
                
                {success && (
                  <div className="bg-green-900/20 border border-green-700 text-green-200 px-4 py-2 rounded mb-4 text-sm">
                    {success}
                  </div>
                )}

                <form onSubmit={handleSubmitPassword} className="space-y-4">
                  {/* Current Password */}
                  <div>
                    <label className="block text-xs text-starlink-text-secondary mb-1">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-starlink-light border border-starlink-border rounded text-starlink-text text-sm focus:outline-none focus:border-starlink-accent"
                      placeholder="Enter current password"
                    />
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-xs text-starlink-text-secondary mb-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      name="new_password"
                      value={passwordData.new_password}
                      onChange={handlePasswordChange}
                      required
                      className="w-full px-3 py-2 bg-starlink-light border border-starlink-border rounded text-starlink-text text-sm focus:outline-none focus:border-starlink-accent"
                      placeholder="Enter new password"
                    />
                    {passwordData.new_password && (
                      <div className="mt-2">
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
                    <label className="block text-xs text-starlink-text-secondary mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      name="confirm_password"
                      value={passwordData.confirm_password}
                      onChange={handleConfirmPasswordChange}
                      required
                      className={`w-full px-3 py-2 bg-starlink-light border rounded text-starlink-text text-sm focus:outline-none ${
                        passwordMatch === null
                          ? 'border-starlink-border focus:border-starlink-accent'
                          : passwordMatch
                          ? 'border-green-600 focus:border-green-600'
                          : 'border-red-600 focus:border-red-600'
                      }`}
                      placeholder="Confirm new password"
                    />
                    {passwordMatch === false && (
                      <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                    )}
                    {passwordMatch === true && (
                      <p className="text-xs text-green-500 mt-1">Passwords match</p>
                    )}
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3 pt-2">
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
                      className="flex-1 py-2 px-4 bg-starlink-light border border-starlink-border text-starlink-text rounded hover:bg-starlink-gray transition-colors text-sm"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading || !passwordMatch || passwordStrength < 75}
                      className="flex-1 btn-primary py-2 px-4 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Changing...' : 'Change Password'}
                    </button>
                  </div>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
