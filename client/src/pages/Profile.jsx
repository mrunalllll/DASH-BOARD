import React, { useState } from 'react';
import { Camera, User, Mail, Lock, Save, AtSign } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import Avatar from '../components/ui/Avatar';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [pwErrors, setPwErrors] = useState({});

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await authAPI.updateProfile(profileForm);
      updateUser(res.data.user);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!passwordForm.currentPassword) errs.currentPassword = 'Required';
    if (!passwordForm.newPassword) errs.newPassword = 'Required';
    else if (passwordForm.newPassword.length < 6) errs.newPassword = 'Min 6 characters';
    if (passwordForm.newPassword !== passwordForm.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    if (Object.keys(errs).length) { setPwErrors(errs); return; }

    setSavingPassword(true);
    try {
      await authAPI.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success('Password changed!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPwErrors({});
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to change password');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Profile Settings</h1>

      {/* Profile Info */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-5">Personal Information</h2>

        {/* Avatar */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-200 dark:border-slate-700">
          <div className="relative">
            <Avatar name={user?.name} avatar={user?.avatar} size="xl" />
            <button className="absolute bottom-0 right-0 w-7 h-7 bg-primary-500 rounded-full flex items-center justify-center text-white shadow-md hover:bg-primary-600 transition-colors">
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>
          <div>
            <p className="font-semibold text-slate-800 dark:text-slate-100">{user?.name}</p>
            <p className="text-sm text-slate-400">@{user?.username}</p>
            <p className="text-sm text-slate-400">{user?.email}</p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className="label">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                className="input pl-10"
                value={profileForm.name}
                onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="label">Username</label>
            <div className="relative">
              <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input className="input pl-10 opacity-60 cursor-not-allowed" value={user?.username} disabled />
            </div>
            <p className="text-xs text-slate-400 mt-1">Username cannot be changed</p>
          </div>

          <div>
            <label className="label">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input className="input pl-10 opacity-60 cursor-not-allowed" value={user?.email} disabled />
            </div>
          </div>

          <div>
            <label className="label">Bio</label>
            <textarea
              className="input min-h-[90px] resize-none"
              placeholder="Tell your team about yourself..."
              value={profileForm.bio}
              onChange={e => setProfileForm(p => ({ ...p, bio: e.target.value }))}
            />
          </div>

          <button type="submit" disabled={savingProfile} className="btn-primary">
            <Save className="w-4 h-4" />
            {savingProfile ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Change Password */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-5 flex items-center gap-2">
          <Lock className="w-5 h-5 text-primary-500" /> Change Password
        </h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="label">Current Password</label>
            <input
              type="password"
              className={`input ${pwErrors.currentPassword ? 'border-red-400' : ''}`}
              placeholder="••••••••"
              value={passwordForm.currentPassword}
              onChange={e => { setPasswordForm(p => ({ ...p, currentPassword: e.target.value })); setPwErrors(p => ({ ...p, currentPassword: '' })); }}
            />
            {pwErrors.currentPassword && <p className="text-xs text-red-500 mt-1">{pwErrors.currentPassword}</p>}
          </div>
          <div>
            <label className="label">New Password</label>
            <input
              type="password"
              className={`input ${pwErrors.newPassword ? 'border-red-400' : ''}`}
              placeholder="Min. 6 characters"
              value={passwordForm.newPassword}
              onChange={e => { setPasswordForm(p => ({ ...p, newPassword: e.target.value })); setPwErrors(p => ({ ...p, newPassword: '' })); }}
            />
            {pwErrors.newPassword && <p className="text-xs text-red-500 mt-1">{pwErrors.newPassword}</p>}
          </div>
          <div>
            <label className="label">Confirm New Password</label>
            <input
              type="password"
              className={`input ${pwErrors.confirmPassword ? 'border-red-400' : ''}`}
              placeholder="Confirm password"
              value={passwordForm.confirmPassword}
              onChange={e => { setPasswordForm(p => ({ ...p, confirmPassword: e.target.value })); setPwErrors(p => ({ ...p, confirmPassword: '' })); }}
            />
            {pwErrors.confirmPassword && <p className="text-xs text-red-500 mt-1">{pwErrors.confirmPassword}</p>}
          </div>
          <button type="submit" disabled={savingPassword} className="btn-primary">
            <Lock className="w-4 h-4" />
            {savingPassword ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
