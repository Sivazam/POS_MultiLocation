import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, ToggleLeft, ToggleRight, MapPin, Users, TrendingUp } from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { useFranchises } from '../../contexts/FranchiseContext';
import { Franchise } from '../../types';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import ErrorAlert from '../../components/ui/ErrorAlert';
import FranchiseForm from '../../components/franchise/FranchiseForm';
import FranchiseDetailsModal from '../../components/franchise/FranchiseDetailsModal';

const FranchisesPage: React.FC = () => {
  const { franchises, loading, error, addFranchise, updateFranchise, approveFranchise, suspendFranchise } = useFranchises();
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedFranchise, setSelectedFranchise] = useState<Franchise | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Helper function to safely get plan badge color
  const getPlanBadgeColor = (plan: string | undefined) => {
    switch (plan) {
      case 'basic':
        return 'bg-gray-100 text-gray-800';
      case 'premium':
        return 'bg-blue-100 text-blue-800';
      case 'enterprise':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Helper function to safely display plan name
  const getPlanDisplayName = (plan: string | undefined) => {
    return plan ? plan.charAt(0).toUpperCase() + plan.slice(1) : 'N/A';
  };

  const filteredFranchises = franchises.filter(franchise =>
    franchise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    franchise.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    franchise.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalRevenue = franchises.reduce((sum, franchise) => sum + 0, 0); // Would be calculated from sales data
  const activeFranchises = franchises.filter(f => f.isActive).length;
  const totalLocations = 0; // Would be calculated from locations data
  const totalUsers = 0; // Would be calculated from users data

  const handleViewDetails = (franchise: Franchise) => {
    setSelectedFranchise(franchise);
    setShowDetails(true);
  };

  const handleEditFranchise = (franchise: Franchise) => {
    setSelectedFranchise(franchise);
    setIsEditing(true);
    setShowForm(true);
  };

  const handleToggleStatus = async (franchise: Franchise) => {
    try {
      if (franchise.isActive) {
        await suspendFranchise(franchise.id);
      } else {
        await updateFranchise(franchise.id, { isActive: true });
      }
    } catch (err) {
      console.error('Failed to toggle franchise status:', err);
    }
  };

  const handleApprove = async (franchise: Franchise) => {
    try {
      await approveFranchise(franchise.id);
    } catch (err) {
      console.error('Failed to approve franchise:', err);
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      if (isEditing && selectedFranchise) {
        await updateFranchise(selectedFranchise.id, data);
      } else {
        await addFranchise(data);
      }
      setShowForm(false);
      setIsEditing(false);
      setSelectedFranchise(null);
    } catch (err) {
      console.error('Failed to save franchise:', err);
    }
  };

  return (
    <DashboardLayout title="Franchise Management">
      <div className="space-y-6">
        {error && <ErrorAlert message={error} onClose={() => {}} />}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <h3 className="text-2xl font-semibold text-gray-900">₹{(totalRevenue / 100000).toFixed(1)}L</h3>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Franchises</p>
                <h3 className="text-2xl font-semibold text-gray-900">{activeFranchises}</h3>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-full">
                <MapPin className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Locations</p>
                <h3 className="text-2xl font-semibold text-gray-900">{totalLocations}</h3>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 bg-amber-100 rounded-full">
                <Users className="h-6 w-6 text-amber-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <h3 className="text-2xl font-semibold text-gray-900">{totalUsers}</h3>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="w-full sm:w-96">
            <Input
              placeholder="Search franchises..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search size={18} className="text-gray-500" />}
            />
          </div>
          <Button
            variant="primary"
            onClick={() => {
              setSelectedFranchise(null);
              setIsEditing(false);
              setShowForm(true);
            }}
          >
            <Plus size={18} className="mr-1" />
            Add Franchise
          </Button>
        </div>

        {/* Franchise Form */}
        {showForm && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">{isEditing ? 'Edit Franchise' : 'Add New Franchise'}</h2>
            <FranchiseForm
              onSubmit={handleSubmit}
              initialData={isEditing ? selectedFranchise || undefined : undefined}
              onCancel={() => {
                setShowForm(false);
                setIsEditing(false);
                setSelectedFranchise(null);
              }}
            />
          </div>
        )}

        {/* Franchise Details Modal */}
        {showDetails && selectedFranchise && (
          <FranchiseDetailsModal
            franchise={selectedFranchise}
            onClose={() => setShowDetails(false)}
          />
        )}

        {/* Franchises Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Franchise
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Owner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                      Loading franchises...
                    </td>
                  </tr>
                ) : filteredFranchises.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                      No franchises found
                    </td>
                  </tr>
                ) : (
                  filteredFranchises.map(franchise => {
                    const plan = franchise.subscriptionPlan || franchise.plan;
                    return (
                      <tr key={franchise.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{franchise.name}</div>
                            <div className="text-sm text-gray-500">{franchise.address}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{franchise.ownerName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{franchise.email}</div>
                          <div className="text-sm text-gray-500">{franchise.phone}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPlanBadgeColor(plan)}`}>
                            {getPlanDisplayName(plan)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleToggleStatus(franchise)}
                            className="inline-flex items-center"
                          >
                            {franchise.isActive ? (
                              <>
                                <ToggleRight className="h-5 w-5 text-green-500 mr-1" />
                                <span className="text-sm text-green-700">Active</span>
                              </>
                            ) : (
                              <>
                                <ToggleLeft className="h-5 w-5 text-red-500 mr-1" />
                                <span className="text-sm text-red-700">Inactive</span>
                              </>
                            )}
                          </button>
                          {!franchise.isApproved && (
                            <div className="mt-1">
                              <button
                                onClick={() => handleApprove(franchise)}
                                className="text-xs text-blue-600 hover:text-blue-800"
                              >
                                Approve
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(franchise)}
                            className="mr-2"
                          >
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditFranchise(franchise)}
                          >
                            <Edit2 size={16} className="mr-1" />
                            Edit
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default FranchisesPage;