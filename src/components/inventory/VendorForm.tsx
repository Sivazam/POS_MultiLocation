import React, { useState } from 'react';
import { Vendor, VendorFormData } from '../../types';
import Input from '../ui/Input';
import Button from '../ui/Button';
import ErrorAlert from '../ui/ErrorAlert';

interface VendorFormProps {
  onSubmit: (data: VendorFormData) => Promise<void>;
  initialData?: Vendor;
  onCancel?: () => void;
}

const VendorForm: React.FC<VendorFormProps> = ({
  onSubmit,
  initialData,
  onCancel
}) => {
  const [formData, setFormData] = useState<VendorFormData>({
    name: initialData?.name || '',
    phone: initialData?.phone || '',
    address: initialData?.address || '',
    gstNumber: initialData?.gstNumber || '',
    email: initialData?.email || ''
  });
  
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validation
    if (!formData.name.trim()) {
      setError('Vendor name is required');
      return;
    }
    
    if (!formData.phone.trim()) {
      setError('Phone number is required');
      return;
    }
    
    if (!formData.address.trim()) {
      setError('Address is required');
      return;
    }
    
    try {
      setLoading(true);
      await onSubmit(formData);
    } catch (err: any) {
      setError(err.message || 'Failed to save vendor');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <ErrorAlert
          message={error}
          onClose={() => setError('')}
        />
      )}
      
      <Input
        label="Vendor Name"
        name="name"
        value={formData.name}
        onChange={handleChange}
        placeholder="Enter vendor name"
        required
      />
      
      <Input
        label="Phone Number"
        name="phone"
        value={formData.phone}
        onChange={handleChange}
        placeholder="Enter phone number"
        required
      />
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Address
        </label>
        <textarea
          name="address"
          value={formData.address}
          onChange={handleChange}
          placeholder="Enter vendor address"
          className="w-full rounded-md border border-gray-300 py-2 px-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          rows={3}
          required
        />
      </div>
      
      <Input
        label="GST Number (Optional)"
        name="gstNumber"
        value={formData.gstNumber}
        onChange={handleChange}
        placeholder="Enter GST number"
      />
      
      <Input
        label="Email (Optional)"
        type="email"
        name="email"
        value={formData.email}
        onChange={handleChange}
        placeholder="Enter email address"
      />
      
      <div className="flex justify-end space-x-2 pt-4">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          isLoading={loading}
        >
          {initialData ? 'Update' : 'Add'} Vendor
        </Button>
      </div>
    </form>
  );
};

export default VendorForm;