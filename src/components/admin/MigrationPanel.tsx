import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';
import Button from '../ui/Button';

const MigrationPanel: React.FC = () => {
  const [migrationStatus, setMigrationStatus] = useState<'pending' | 'running' | 'completed' | 'failed'>('pending');
  const [showPanel, setShowPanel] = useState(true);

  const handleRunMigration = () => {
    setMigrationStatus('running');
    
    // Simulate migration process
    setTimeout(() => {
      setMigrationStatus('completed');
    }, 2000);
  };

  if (!showPanel) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {migrationStatus === 'completed' ? (
            <CheckCircle className="h-5 w-5 text-green-400" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-amber-400" />
          )}
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-amber-800">
            {migrationStatus === 'pending' && 'Database Migration Required'}
            {migrationStatus === 'running' && 'Migration in Progress...'}
            {migrationStatus === 'completed' && 'Migration Completed Successfully'}
            {migrationStatus === 'failed' && 'Migration Failed'}
          </h3>
          <div className="mt-2 text-sm text-amber-700">
            {migrationStatus === 'pending' && (
              <p>
                A database migration is required to update the system to the latest version.
                This will update the schema to support the new single franchise model.
              </p>
            )}
            {migrationStatus === 'running' && (
              <div className="flex items-center">
                <div className="mr-2 animate-spin rounded-full h-4 w-4 border-b-2 border-amber-700"></div>
                <p>Migrating database schema. Please do not refresh the page...</p>
              </div>
            )}
            {migrationStatus === 'completed' && (
              <p>
                The database has been successfully migrated to the new schema.
                The system now supports the single franchise model with multiple locations.
              </p>
            )}
            {migrationStatus === 'failed' && (
              <p>
                The migration failed. Please try again or contact system administrator.
              </p>
            )}
          </div>
          {migrationStatus === 'pending' && (
            <div className="mt-4">
              <Button
                variant="primary"
                size="sm"
                onClick={handleRunMigration}
                className="mr-2"
              >
                Run Migration
                <ArrowRight size={16} className="ml-1" />
              </Button>
            </div>
          )}
          {migrationStatus === 'completed' && (
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPanel(false)}
              >
                Dismiss
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MigrationPanel;