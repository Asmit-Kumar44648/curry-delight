import React from 'react';
import POSModule from './POSModule';

interface AdminDashboardProps {
  navigateTo: (path: string) => void;
}

/**
 * Legacy AdminDashboard route redirector.
 * All admin and counter operations have been consolidated into POSModule.
 */
export default function AdminDashboard({ navigateTo }: AdminDashboardProps) {
  return <POSModule navigateTo={navigateTo} />;
}
