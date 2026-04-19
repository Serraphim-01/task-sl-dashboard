import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.tsx';
import { changePassword, getKMSStatus, listKMSSecrets } from '../services/api.ts';
import api from '../services/api.ts';
import { FaArrowLeft, FaUser, FaKey, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';

const AdminSettings: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [userData, setUserData] = useState({
    email: ''
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'credentials'>('profile');
  
  // Password change state
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
  
  // KMS/Credentials state
  const [kmsStatus, setKmsStatus] = useState<any>(null);
  const [kmsSecrets, setKmsSecrets] = useState<any[]>([]);
  const [kmsLoading, setKmsLoading] = useState(false);

  useEffect(() => {
    fetchUserData();
    if (activeTab === 'credentials') {
      fetchKMSData();
    }
  }, [activeTab]);

  const fetchUserData = async () => {
    try {
      const response = await api.get('/auth/me');
      setUserData({
        email: response.data.email || ''
      });
    } catch (err) {
      setError('Failed to load user data');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchKMSData = async () => {
    setKmsLoading(true);
    setError(null);
    try {
      // Fetch KMS status and secrets in parallel
      const [statusResponse, secretsResponse] = await Promise.all([
        getKMSStatus(),
        listKMSSecrets()
      ]);
      
      setKmsStatus(statusResponse);
      setKmsSecrets(secretsResponse.secrets || []);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load KMS data');
    } finally {
      setKmsLoading(false);
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
    if (strength <= 75) return 'bg-gray-600';
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
    <div className="min-h-screen bg-starlink-darker p-3 md:p-6 lg:p-8 ml-[25px] md:ml-0">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-2 md:mb-4">
          <button
            onClick={() => navigate('/admin/customers')}
            className="flex items-center gap-2 text-starlink-text-secondary hover:text-starlink-text transition-colors mb-3 text-sm"
          >
            <FaArrowLeft />
            <span>Back to Portal</span>
          </button>
          <h1 className="text-xl md:text-3xl font-bold text-starlink-text">Admin Settings</h1>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-700 text-red-200 px-3 py-2 rounded mb-4 text-sm flex items-center gap-2">
            <FaExclamationTriangle />
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-900/20 border border-green-700 text-green-200 px-3 py-2 rounded mb-4 text-sm flex items-center gap-2">
            <FaCheckCircle />
            {success}
          </div>
        )}
        
        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-starlink-border">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'profile'
                ? 'border-starlink-accent text-starlink-accent'
                : 'border-transparent text-starlink-text-secondary hover:text-starlink-text'
            }`}
          >
            <FaUser className="inline mr-2" />
            Profile
          </button>
          <button
            onClick={() => setActiveTab('credentials')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'credentials'
                ? 'border-starlink-accent text-starlink-accent'
                : 'border-transparent text-starlink-text-secondary hover:text-starlink-text'
            }`}
          >
            <FaKey className="inline mr-2" />
            Starlink Credentials
          </button>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && !showChangePassword && (
          <div className="space-y-4 md:space-y-6">
            {/* Profile Information */}
            <div className="card p-4 md:p-6">
              <h2 className="text-lg md:text-xl font-semibold text-starlink-text mb-3 md:mb-4">Profile Information</h2>
              <div className="space-y-3 md:space-y-4">
                <div className="flex items-start gap-3 p-3 bg-starlink-light rounded-lg">
                  <FaUser className="text-starlink-text mt-0.5" size={16} />
                  <div className="flex-1">
                    <p className="text-[10px] md:text-xs text-starlink-text-secondary uppercase tracking-wide mb-1">Email</p>
                    <p className="text-sm md:text-base text-starlink-text font-medium">{userData.email || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Change Password Button */}
            <button
              onClick={() => setShowChangePassword(true)}
              className="w-full btn-primary py-2.5 px-4 md:py-3 md:px-6 text-sm"
            >
              Change Password
            </button>
          </div>
        )}
        
        {/* Change Password Form */}
        {activeTab === 'profile' && showChangePassword && (
          <div className="card p-4 md:p-6">
            <h2 className="text-lg md:text-xl font-semibold text-starlink-text mb-4 md:mb-6">Change Password</h2>
            <form onSubmit={handleSubmitPassword} className="space-y-3 md:space-y-4">
              {/* Current Password */}
              <div>
                <label className="block text-xs md:text-sm text-starlink-text-secondary mb-1.5">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 md:px-4 md:py-3 bg-starlink-light border border-starlink-border rounded text-starlink-text text-sm focus:outline-none focus:border-starlink-text-secondary"
                  placeholder="Enter current password"
                />
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs md:text-sm text-starlink-text-secondary mb-1.5">
                  New Password
                </label>
                <input
                  type="password"
                  name="new_password"
                  value={passwordData.new_password}
                  onChange={handlePasswordChange}
                  required
                  className="w-full px-3 py-2.5 md:px-4 md:py-3 bg-starlink-light border border-starlink-border rounded text-starlink-text text-sm focus:outline-none focus:border-starlink-text-secondary"
                  placeholder="Enter new password"
                />
                {passwordData.new_password && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-[10px] md:text-xs mb-1">
                      <span className="text-starlink-text-secondary">Password Strength</span>
                      <span className="text-starlink-text">{getStrengthText(passwordStrength)}</span>
                    </div>
                    <div className="w-full bg-starlink-gray rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all duration-300 ${getStrengthColor(passwordStrength)}`}
                        style={{ width: `${passwordStrength}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs md:text-sm text-starlink-text-secondary mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  name="confirm_password"
                  value={passwordData.confirm_password}
                  onChange={handleConfirmPasswordChange}
                  required
                  className={`w-full px-3 py-2.5 md:px-4 md:py-3 bg-starlink-light border rounded text-starlink-text text-sm focus:outline-none ${
                    passwordMatch === null
                      ? 'border-starlink-border focus:border-starlink-text-secondary'
                      : passwordMatch
                      ? 'border-green-600 focus:border-green-600'
                      : 'border-red-600 focus:border-red-600'
                  }`}
                  placeholder="Confirm new password"
                />
                {passwordMatch === false && (
                  <p className="text-[10px] md:text-xs text-red-500 mt-1.5">Passwords do not match</p>
                )}
                {passwordMatch === true && (
                  <p className="text-[10px] md:text-xs text-green-500 mt-1.5">Passwords match</p>
                )}
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-3">
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
                  className="flex-1 py-2.5 px-4 bg-starlink-light border border-starlink-border text-starlink-text rounded hover:bg-starlink-gray transition-colors text-sm"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={saving || !passwordMatch || passwordStrength < 75}
                  className="flex-1 btn-primary py-2.5 px-4 md:py-3 md:px-6 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {saving ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        )}
        
        {/* Credentials Tab */}
        {activeTab === 'credentials' && (
          <div className="space-y-4 md:space-y-6">
            {/* KMS Status */}
            {kmsStatus && (
              <div className="card p-4 md:p-6">
                <h3 className="text-lg font-semibold text-starlink-text mb-4">Azure Key Vault Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-starlink-light rounded border border-starlink-border">
                    <p className="text-xs text-starlink-text-secondary uppercase mb-1">Vault URL</p>
                    <p className="text-sm text-starlink-text font-mono break-all">
                      {kmsStatus.vault_url || 'Not configured'}
                    </p>
                  </div>
                  <div className="p-3 bg-starlink-light rounded border border-starlink-border">
                    <p className="text-xs text-starlink-text-secondary uppercase mb-1">Connection</p>
                    <p className={`text-sm font-semibold ${
                      kmsStatus.vault_connected ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {kmsStatus.vault_connected ? '✓ Connected' : '✗ Not Connected'}
                    </p>
                  </div>
                  <div className="p-3 bg-starlink-light rounded border border-starlink-border">
                    <p className="text-xs text-starlink-text-secondary uppercase mb-1">Credentials Configured</p>
                    <p className={`text-sm font-semibold ${
                      kmsStatus.has_credentials_configured ? 'text-green-400' : 'text-yellow-400'
                    }`}>
                      {kmsStatus.has_credentials_configured ? '✓ Yes' : '✗ No'}
                    </p>
                  </div>
                  <div className="p-3 bg-starlink-light rounded border border-starlink-border">
                    <p className="text-xs text-starlink-text-secondary uppercase mb-1">Credentials Accessible</p>
                    <p className={`text-sm font-semibold ${
                      kmsStatus.credentials_accessible ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {kmsStatus.credentials_accessible ? '✓ Accessible' : '✗ Not Accessible'}
                    </p>
                  </div>
                </div>
                
                
                {kmsStatus.client_id_secret_name && (
                  <div className="mt-4 p-3 bg-starlink-light rounded border border-starlink-border">
                    <p className="text-xs text-starlink-text-secondary uppercase mb-1">Current Client ID Secret</p>
                    <p className="text-sm text-starlink-text font-mono">{kmsStatus.client_id_secret_name}</p>
                  </div>
                )}
                {kmsStatus.client_secret_secret_name && (
                  <div className="mt-2 p-3 bg-starlink-light rounded border border-starlink-border">
                    <p className="text-xs text-starlink-text-secondary uppercase mb-1">Current Client Secret</p>
                    <p className="text-sm text-starlink-text font-mono">{kmsStatus.client_secret_secret_name}</p>
                  </div>
                )}
              </div>
            )}
            

          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSettings;
