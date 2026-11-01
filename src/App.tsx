import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/layout/Header';
import { Sidebar, ActiveTab } from './components/layout/Sidebar';
import { RoleBanner } from './components/layout/RoleBanner';
import { SummaryCards } from './components/dashboard/SummaryCards';
import { ConsumptionChart } from './components/dashboard/ConsumptionChart';
import { SectionGrid } from './components/dashboard/SectionGrid';
import { DailyReadingForm } from './components/readings/DailyReadingForm';
import { TransformerAnalysis } from './components/transformers/TransformerAnalysis';
import { SectionManager } from './components/sections/SectionManager';
import { HistoricalReports } from './components/reports/HistoricalReports';
import { AlertCenter } from './components/alerts/AlertCenter';
import { CostSettingsView } from './components/costing/CostSettings';
import { DatabaseView } from './components/database/DatabaseView';
import { SupabaseConfigModal } from './components/auth/SupabaseConfigModal';

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased selection:bg-cyan-500/20 selection:text-cyan-200">
      {/* Top Navigation Header */}
      <Header
        onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
        onOpenAlerts={() => setActiveTab('alerts')}
      />

      {/* Role & Permissions Banner */}
      <RoleBanner />

      {/* Main Layout Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Dynamic View Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
          {activeTab === 'dashboard' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <SummaryCards />
              <ConsumptionChart />
              <SectionGrid />
            </div>
          )}

          {activeTab === 'readings' && (
            <div className="max-w-7xl mx-auto">
              <DailyReadingForm />
            </div>
          )}

          {activeTab === 'transformers' && (
            <div className="max-w-7xl mx-auto">
              <TransformerAnalysis />
            </div>
          )}

          {activeTab === 'sections' && (
            <div className="max-w-7xl mx-auto">
              <SectionManager />
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="max-w-7xl mx-auto">
              <HistoricalReports />
            </div>
          )}

          {activeTab === 'alerts' && (
            <div className="max-w-7xl mx-auto">
              <AlertCenter />
            </div>
          )}

          {activeTab === 'costing' && (
            <div className="max-w-7xl mx-auto">
              <CostSettingsView />
            </div>
          )}

          {activeTab === 'database' && (
            <div className="max-w-7xl mx-auto">
              <DatabaseView onOpenConfigModal={() => setIsSupabaseModalOpen(true)} />
            </div>
          )}
        </main>
      </div>

      {/* 1-Click Supabase Config Modal */}
      <SupabaseConfigModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
