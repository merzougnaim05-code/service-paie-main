import React, { useState, useEffect } from 'react';
import { Employee, Settings } from './types';
import {
  loadData,
  loadSettings,
  loadLastModified,
  saveEmployee,
  deleteEmployee,
  saveSettings,
  resetToDefault
} from './utils/storage';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { EmployeeRegistry } from './components/EmployeeRegistry';
import { PensionDocument } from './components/PensionDocument';
import { PayslipView } from './components/PayslipView';
import { PayrollSheets } from './components/PayrollSheets';
import { AdminDocs } from './components/AdminDocs';
import { DataHub } from './components/DataHub';
import { SettingsView } from './components/SettingsView';

export default function App() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [settings, setSettings] = useState<Settings>(loadSettings());
  const [lastModified, setLastModified] = useState<string>(loadLastModified());

  // Device display mode (phone preview vs full desktop)
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'mobile'>(() => {
    try {
      const saved = localStorage.getItem('dz_device_mode');
      return saved === 'mobile' ? 'mobile' : 'desktop';
    } catch {
      return 'desktop';
    }
  });

  const handleDeviceMode = (mode: 'desktop' | 'mobile') => {
    setDeviceMode(mode);
    try {
      localStorage.setItem('dz_device_mode', mode);
    } catch {
      // ignore
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Active view states
  const [activeTab, setActiveTab] = useState<string>('landing');
  const [activeDoc, setActiveDoc] = useState<string>('ats-front');
  const [selectedSector, setSelectedSector] = useState<string>('admin');
  const [selectedEmpId, setSelectedEmpId] = useState<string>('');

  // Initial load
  useEffect(() => {
    const emps = loadData();
    setEmployees(emps);
    setSettings(loadSettings());
    setLastModified(loadLastModified());
    if (emps.length > 0 && !selectedEmpId) {
      setSelectedEmpId(emps[0].id);
    }
  }, []);

  // Handlers for employees
  const handleSaveEmployee = (emp: Employee) => {
    saveEmployee(emp);
    const updated = loadData();
    setEmployees(updated);
    setLastModified(loadLastModified());
    setSelectedEmpId(emp.id);
  };

  const handleDeleteEmployee = (id: string) => {
    deleteEmployee(id);
    const updated = loadData();
    setEmployees(updated);
    setLastModified(loadLastModified());
    if (selectedEmpId === id) {
      setSelectedEmpId(updated[0]?.id || '');
    }
  };

  const handleSaveSettings = (newSettings: Settings) => {
    saveSettings(newSettings);
    setSettings(newSettings);
    setLastModified(loadLastModified());
  };

  const handleResetAllData = () => {
    resetToDefault();
    const emps = loadData();
    setEmployees(emps);
    setSettings(loadSettings());
    setLastModified(loadLastModified());
    if (emps.length > 0) {
      setSelectedEmpId(emps[0].id);
    }
  };

  // Quick navigation handlers
  const handleOpenPayslip = (empId: string) => {
    setSelectedEmpId(empId);
    setActiveTab('payslip');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenPension = (empId: string) => {
    setSelectedEmpId(empId);
    setActiveTab('pension');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDocSelect = (doc: string) => {
    // map navbar doc keys to AdminDocs doc types
    const mapping: Record<string, string> = {
      cert_recto: 'ats-front',
      cert_verso: 'ats-back',
      res: 'drt',
      form: 'form',
      req: 'request-docs',
      nr: 'family-cert',
      salary_disclosure: 'salary-disclosure'
    };
    setActiveDoc(mapping[doc] || 'ats-front');
    setActiveTab('docs');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLandingEnter = (tab: string, doc?: string, sector?: string) => {
    if (sector) {
      setSelectedSector(sector);
    }
    if (doc) {
      handleDocSelect(doc);
      return;
    }
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-stone-50 to-emerald-50 text-[#0f172a] flex flex-col" style={{ direction: 'rtl' }}>
      {/* Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        activeDoc={activeDoc}
        deviceMode={deviceMode}
        onSelectDeviceMode={handleDeviceMode}
        onSelectTab={tab => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onSelectDoc={handleDocSelect}
        institutionName={settings.institution}
      />

      {/* Main View Router */}
      <main className="flex-1 pb-16">
        <div
          className={
            deviceMode === 'mobile'
              ? 'mx-auto w-full max-w-[430px] min-h-full bg-[#ffffff] border-x border-[#a7f3d0] shadow-lg'
              : ''
          }
        >
        {activeTab === 'landing' && (
          <LandingPage
            employees={employees}
            settings={settings}
            lastModified={lastModified}
            onEnter={handleLandingEnter}
          />
        )}

        {activeTab === 'employees' && (
          <EmployeeRegistry
            employees={employees}
            settings={settings}
            onSaveEmployee={handleSaveEmployee}
            onDeleteEmployee={handleDeleteEmployee}
            onOpenPayslip={handleOpenPayslip}
            onOpenPension={handleOpenPension}
          />
        )}

        {activeTab === 'pension' && (
          <PensionDocument
            employees={employees}
            settings={settings}
            selectedEmpId={selectedEmpId}
            onUpdateEmployee={handleSaveEmployee}
          />
        )}

        {activeTab === 'payslip' && (
          <PayslipView
            employees={employees}
            settings={settings}
            selectedEmpId={selectedEmpId}
          />
        )}

        {activeTab === 'payrollTables' && (
          <PayrollSheets
            employees={employees}
            settings={settings}
            onOpenPayslip={handleOpenPayslip}
            initialSector={selectedSector}
          />
        )}

        {activeTab === 'docs' && (
          <AdminDocs
            employees={employees}
            settings={settings}
            selectedEmpId={selectedEmpId}
            initialDocType={activeDoc}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            settings={settings}
            onSaveSettings={handleSaveSettings}
            onResetAllData={handleResetAllData}
          />
        )}

        {activeTab === 'datahub' && (
          <DataHub
            settings={settings}
            onSaveSettings={handleSaveSettings}
          />
        )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#ffffff] border-t border-[#a7f3d0] py-6 text-center text-xs text-[#64748b] print:hidden">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            الجمهورية الجزائرية الديمقراطية الشعبية — وزارة التربية الوطنية — قطاع الوظيفة العمومية
          </div>
          <div className="font-mono text-[11px] text-[#64748b]">
            نظام تسيير الرواتب والتقاعد © 2026 | مطابقة لقوانين الضمان الاجتماعي والصندوق الوطني للتقاعد CNR
          </div>
        </div>
      </footer>
    </div>
  );
}
