import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.tsx';
import { changePassword, checkForgotPasswordStatus, resetForgotPassword } from '../services/api.ts';
import { FaUserShield } from 'react-icons/fa';
import Toast from '../components/Toast.tsx';

const CustomerLogin: React.FC = () => {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  
  // Login form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // First login mode toggle
  const [isFirstLoginMode, setIsFirstLoginMode] = useState(false);
  const [firstLoginStep, setFirstLoginStep] = useState(1); // 1: email verification, 2: password setup
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [firstLoginError, setFirstLoginError] = useState<string | null>(null);
  
  // Password strength tracking
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordMatch, setPasswordMatch] = useState<boolean | null>(null);
  
  // First login password setup
  const [showPasswordSetup, setShowPasswordSetup] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [changingPassword, setChangingPassword] = useState(false);
  
  // Forgot password flow
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStep, setForgotStep] = useState(1); // 1: email, 2: reset password
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [resetPasswordData, setResetPasswordData] = useState({
    new_password: '',
    confirm_password: '',
  });
  const [resettingPassword, setResettingPassword] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [resetPasswordStrength, setResetPasswordStrength] = useState(0);
  const [resetPasswordMatch, setResetPasswordMatch] = useState<boolean | null>(null);
  
  // Toast state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePasswordChangeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPasswordData({
      ...passwordData,
      [e.target.name]: newPassword,
    });
    
    // Calculate password strength
    calculatePasswordStrength(newPassword);
    
    // Check password match
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
    
    // Check password match
    setPasswordMatch(passwordData.new_password === confirmPassword);
  };

  const calculatePasswordStrength = (password: string) => {
    let strength = 0;
    
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[a-z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    
    setPasswordStrength(strength);
  };

  const calculateResetPasswordStrength = (password: string) => {
    let strength = 0;
    
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[a-z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    
    setResetPasswordStrength(strength);
  };

  const handleResetPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setResetPasswordData({
      ...resetPasswordData,
      [e.target.name]: newPassword,
    });
    
    calculateResetPasswordStrength(newPassword);
    
    if (resetPasswordData.confirm_password) {
      setResetPasswordMatch(newPassword === resetPasswordData.confirm_password);
    } else {
      setResetPasswordMatch(null);
    }
  };

  const handleResetConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const confirmPassword = e.target.value;
    setResetPasswordData({
      ...resetPasswordData,
      confirm_password: confirmPassword,
    });
    
    setResetPasswordMatch(resetPasswordData.new_password === confirmPassword);
  };

  const handleFirstLoginEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifyingEmail(true);
    setFirstLoginError(null);

    try {
      const response = await checkForgotPasswordStatus(formData.email);
      
      if (response.status === 'unactivated') {
        // Email is unactivated, proceed to password setup
        setFirstLoginStep(2);
      } else if (response.status === 'not_found') {
        setFirstLoginError('No account found with this email. Please contact your administrator.');
      } else if (response.status === 'active' || response.status === 'inactive') {
        setFirstLoginError('This account is already activated. Please use the regular login with your password, or use Forgot Password to reset it.');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Failed to verify email.';
      setFirstLoginError(errorMessage);
    } finally {
      setVerifyingEmail(false);
    }
  };

  const handleFirstLoginPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangingPassword(true);
    setError(null);

    try {
      await changePassword(passwordData);
      setShowPasswordSetup(false);
      // Redirect to customer portal after password change
      navigate('/customer/portal');
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Failed to set password.';
      setError(errorMessage);
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await login(formData.email, formData.password);
      
      // Check if user must change password (unactivated account)
      if (user.mustChangePassword) {
        setShowPasswordSetup(true);
      } else {
        // Redirect to customer portal on successful login
        navigate('/customer/portal');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Login failed. Please check your credentials.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangingPassword(true);
    setError(null);

    try {
      await changePassword(passwordData);
      setShowPasswordSetup(false);
      // Redirect to customer portal after password change
      navigate('/customer/portal');
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Failed to change password.';
      setError(errorMessage);
    } finally {
      setChangingPassword(false);
    }
  };

  const handleForgotPasswordCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckingStatus(true);
    setForgotError(null);

    try {
      const response = await checkForgotPasswordStatus(forgotEmail);
      
      if (response.status === 'unactivated') {
        setForgotError(response.message);
        // Switch to first login mode
        setTimeout(() => {
          setShowForgotPassword(false);
          setIsFirstLoginMode(true);
          setFormData({ ...formData, email: forgotEmail });
        }, 2000);
      } else if (response.status === 'not_found') {
        setForgotError(response.message);
      } else if (response.can_reset) {
        // Active or inactive - proceed to step 2
        setForgotStep(2);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Failed to check account status.';
      setForgotError(errorMessage);
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResettingPassword(true);
    setForgotError(null);

    try {
      await resetForgotPassword(
        forgotEmail,
        resetPasswordData.new_password,
        resetPasswordData.confirm_password
      );
      
      setShowForgotPassword(false);
      setForgotStep(1);
      setForgotEmail('');
      setResetPasswordData({ new_password: '', confirm_password: '' });
      setError(null);
      
      // Show success toast
      setToastMessage('Password reset successfully! You can now login with your new password.');
      setToastType('success');
      setShowToast(true);
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Failed to reset password.';
      setForgotError(errorMessage);
    } finally {
      setResettingPassword(false);
    }
  };

  const getStrengthColor = (strength: number) => {
    if (strength === 0) return 'bg-gray-600';
    if (strength <= 25) return 'bg-red-600';
    if (strength <= 50) return 'bg-yellow-600';
    if (strength <= 75) return 'bg-blue-600';
    return 'bg-green-600';
  };

  const getStrengthLabel = (strength: number) => {
    if (strength === 0) return '';
    if (strength <= 25) return 'Weak';
    if (strength <= 50) return 'Fair';
    if (strength <= 75) return 'Good';
    return 'Strong';
  };

  return (
    <div className="min-h-screen bg-starlink-dark flex items-center justify-center relative">
      {/* Admin Login Icon - Top Right */}
      <Link 
        to="/admin/login" 
        className="absolute top-6 right-6 text-starlink-text-muted hover:text-starlink-text transition-colors duration-200"
        title="Admin Login"
      >
        <FaUserShield size={28} />
      </Link>

      <div className="w-full max-w-md p-8 card">
        <h2 className="text-3xl font-bold text-center mb-8 text-starlink-text">Customer Login</h2>
        
        {error && (
          <div className="p-4 mb-6 rounded bg-red-900/50 border border-red-700 text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={isFirstLoginMode && firstLoginStep === 1 ? handleFirstLoginEmailSubmit : handleSubmit} className="space-y-6">
          {/* Email field - shared between regular login and first login */}
          <div>
            <label className="block mb-2 font-semibold text-starlink-text">
              {isFirstLoginMode ? 'Email Address:' : 'Email:'}
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="input-field"
              placeholder={isFirstLoginMode ? "Enter your email" : ""}
            />
          </div>

          {!isFirstLoginMode ? (
            <>
              <div>
                <label className="block mb-2 font-semibold text-starlink-text">
                  Password:
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="input-field"
                />
                
                {/* First Login and Forgot Password links */}
                <div className="flex justify-between items-center mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsFirstLoginMode(true);
                      setFirstLoginStep(1);
                      setFirstLoginError(null);
                    }}
                    className="text-sm text-gray-400 hover:text-gray-300 transition-colors"
                  >
                    First Login?
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm text-gray-400 hover:text-gray-300 transition-colors underline"
                  >
                    Forgot Password?
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* First Login - Step 1: Email Verification */}
              {firstLoginStep === 1 && (
                <>
                  {/* Back to Login link under email field */}
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsFirstLoginMode(false);
                        setFirstLoginStep(1);
                        setFirstLoginError(null);
                        setFormData({ ...formData, password: '' });
                      }}
                      className="text-sm text-gray-400 hover:text-gray-300 transition-colors"
                    >
                      ← Back to Login
                    </button>
                  </div>

                  {firstLoginError && (
                    <div className="p-4 rounded bg-red-900/50 border border-red-700 text-red-200">
                      {firstLoginError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={verifyingEmail}
                    className="btn-primary w-full py-3 text-base disabled:opacity-50"
                  >
                    {verifyingEmail ? 'Verifying...' : 'Continue'}
                  </button>
                </>
              )}

              {/* First Login - Step 2: Password Setup */}
              {firstLoginStep === 2 && (
                <form onSubmit={handleFirstLoginPasswordSubmit} className="space-y-6">
                  <div className="bg-green-900/30 border border-green-700 p-4 rounded">
                    <p className="text-green-200 text-sm">
                      ✓ Account verified. Please set your password.
                    </p>
                  </div>

                  <div>
                    <label className="block mb-2 font-semibold text-starlink-text">
                      Set Your Password:
                    </label>
                    <input
                      type="password"
                      name="new_password"
                      value={passwordData.new_password}
                      onChange={handlePasswordChangeInput}
                      required
                      minLength={8}
                      className="input-field"
                      placeholder="Enter your password"
                    />
                    
                    {/* Password Strength Indicator */}
                    {passwordData.new_password && (
                      <div className="mt-2">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-gray-400">Password Strength:</span>
                          <span className={`text-xs font-semibold ${
                            passwordStrength <= 25 ? 'text-red-400' :
                            passwordStrength <= 50 ? 'text-yellow-400' :
                            passwordStrength <= 75 ? 'text-blue-400' : 'text-green-400'
                          }`}>
                            {getStrengthLabel(passwordStrength)}
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor(passwordStrength)}`}
                            style={{ width: `${passwordStrength}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block mb-2 font-semibold text-starlink-text">
                      Confirm Password:
                    </label>
                    <input
                      type="password"
                      name="confirm_password"
                      value={passwordData.confirm_password}
                      onChange={handleConfirmPasswordChange}
                      required
                      className="input-field"
                      placeholder="Confirm your password"
                    />
                    
                    {/* Password Match Confirmation */}
                    {passwordData.confirm_password && (
                      <div className="mt-2">
                        {passwordMatch === true ? (
                          <p className="text-sm text-green-400">✓ Passwords match</p>
                        ) : passwordMatch === false ? (
                          <p className="text-sm text-red-400">✗ Passwords do not match</p>
                        ) : null}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        setFirstLoginStep(1);
                        setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
                        setPasswordStrength(0);
                        setPasswordMatch(null);
                        setFirstLoginError(null);
                      }}
                      className="flex-1 py-3 px-4 border border-starlink-border text-starlink-text rounded hover:bg-starlink-light transition-colors"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={changingPassword || !passwordMatch}
                      className="flex-1 btn-primary py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {changingPassword ? 'Setting Password...' : 'Set Password & Login'}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}

          {!isFirstLoginMode && (
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-base"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          )}
        </form>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-starlink-gray rounded-lg p-8 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-starlink-text">
                {forgotStep === 1 ? 'Forgot Password' : 'Reset Password'}
              </h3>
              <button
                onClick={() => {
                  setShowForgotPassword(false);
                  setForgotStep(1);
                  setForgotEmail('');
                  setForgotError(null);
                  setResetPasswordData({ new_password: '', confirm_password: '' });
                  setResetPasswordStrength(0);
                  setResetPasswordMatch(null);
                }}
                className="text-starlink-text hover:text-starlink-text-secondary text-2xl"
              >
                ×
              </button>
            </div>

            {forgotError && (
              <div className="p-4 mb-6 rounded bg-red-900/50 border border-red-700 text-red-200">
                {forgotError}
              </div>
            )}

            {forgotStep === 1 ? (
              /* Step 1: Enter Email */
              <form onSubmit={handleForgotPasswordCheck} className="space-y-6">
                <div>
                  <label className="block mb-2 font-semibold text-starlink-text">
                    Email Address:
                  </label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    className="input-field"
                    placeholder="Enter your email"
                  />
                </div>

                <button
                  type="submit"
                  disabled={checkingStatus}
                  className="btn-primary w-full py-3 text-base disabled:opacity-50"
                >
                  {checkingStatus ? 'Checking...' : 'Continue'}
                </button>
              </form>
            ) : (
              /* Step 2: Reset Password */
              <form onSubmit={handleResetPasswordSubmit} className="space-y-6">
                <div>
                  <label className="block mb-2 font-semibold text-starlink-text">
                    New Password:
                  </label>
                  <input
                    type="password"
                    name="new_password"
                    value={resetPasswordData.new_password}
                    onChange={handleResetPasswordChange}
                    required
                    minLength={8}
                    className="input-field"
                  />
                  
                  {/* Password Strength Indicator */}
                  {resetPasswordData.new_password && (
                    <div className="mt-2">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-gray-400">Password Strength:</span>
                        <span className={`text-xs font-semibold ${
                          resetPasswordStrength <= 25 ? 'text-red-400' :
                          resetPasswordStrength <= 50 ? 'text-yellow-400' :
                          resetPasswordStrength <= 75 ? 'text-blue-400' : 'text-green-400'
                        }`}>
                          {getStrengthLabel(resetPasswordStrength)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor(resetPasswordStrength)}`}
                          style={{ width: `${resetPasswordStrength}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block mb-2 font-semibold text-starlink-text">
                    Confirm Password:
                  </label>
                  <input
                    type="password"
                    name="confirm_password"
                    value={resetPasswordData.confirm_password}
                    onChange={handleResetConfirmPasswordChange}
                    required
                    className="input-field"
                  />
                  
                  {/* Password Match Confirmation */}
                  {resetPasswordData.confirm_password && (
                    <div className="mt-2">
                      {resetPasswordMatch === true ? (
                        <p className="text-sm text-green-400">✓ Passwords match</p>
                      ) : resetPasswordMatch === false ? (
                        <p className="text-sm text-red-400">✗ Passwords do not match</p>
                      ) : null}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={resettingPassword || !resetPasswordMatch}
                  className="btn-primary w-full py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resettingPassword ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Toast Notification */}
      <Toast
        message={toastMessage}
        type={toastType}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
        duration={5000}
      />
    </div>
  );
};

export default CustomerLogin;
