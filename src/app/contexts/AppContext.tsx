import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';
import axiosInstance from '../api/axios';
import { useAuth } from './AuthContext';

export interface Property {
  id: string;
  name: string;
  address: string;
  monthlyRent: number;
  type: string;
  rooms: number;
  status: string;
}

export interface Tenant {
  id: string;
  name: string;
  email: string;
  phone: string;
  propertyId: string;
  monthlyRent: number;
  isPaid: boolean;
  moveInDate: string;
  status: string;
}

export interface Payment {
  id: string;
  userId: number;
  propertyId: string;
  tenantId: string;
  amount: number;
  date: string;
  note?: string;
  method: string;
}

interface AppContextType {
  properties: Property[];
  tenants: Tenant[];
  payments: Payment[];
  addProperty: (property: Omit<Property, 'id' | 'status'>) => Promise<void>;
  updateProperty: (id: string, property: Partial<Property>) => Promise<void>;
  deleteProperty: (id: string) => Promise<void>;
  addTenant: (tenant: Omit<Tenant, 'id' | 'status'>) => Promise<void>;
  updateTenant: (id: string, tenant: Partial<Tenant>) => Promise<void>;
  deleteTenant: (id: string) => Promise<void>;
  addPayment: (payment: Omit<Payment, 'id' | 'userId'>) => Promise<void>;
  getTotalActualIncome: () => number;
  getTotalExpectedIncome: () => number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  // Load data when authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      fetchProperties();
      fetchTenants();
      fetchPayments();
    } else if (!isAuthenticated && !authLoading) {
      // Clear data when not authenticated
      setProperties([]);
      setTenants([]);
      setPayments([]);
    }
  }, [isAuthenticated, authLoading]);

  const fetchProperties = async () => {
    try {
      const res = await axiosInstance.get('/api/properties/');
      const mapped = res.data.map((p: any) => ({
        id: String(p.id),
        name: p.name,
        address: p.address,
        type: p.type,
        rooms: p.rooms,
        monthlyRent: parseFloat(p.monthly_rent) || 0,
        status: p.status,
      }));
      setProperties(mapped);
    } catch (error) {
      console.error('Properties fetch error:', error);
    }
  };

  const fetchTenants = async () => {
    try {
      const res = await axiosInstance.get('/api/tenants/');
      const mapped = res.data.map((t: any) => ({
        id: String(t.id),
        name: t.name,
        email: t.email,
        phone: t.phone,
        propertyId: String(t.property_id),
        monthlyRent: parseFloat(t.monthly_rent) || 0,
        isPaid: Boolean(t.is_paid),
        moveInDate: t.move_in_date,
        status: t.status,
      }));
      setTenants(mapped);
    } catch (error) {
      console.error('Tenants fetch error:', error);
    }
  };

  const fetchPayments = async () => {
    try {
      const res = await axiosInstance.get('/api/payments/');
      const mapped = res.data.map((p: any) => ({
        id: String(p.id),
        userId: p.user_id,
        propertyId: String(p.property_id),
        tenantId: String(p.tenant_id),
        amount: parseFloat(p.amount) || 0,
        date: p.payment_date,
        note: p.notes,
        method: p.payment_method,
      }));
      setPayments(mapped);
    } catch (error) {
      console.error('Payments fetch error:', error);
    }
  };

  const addProperty = async (property: Omit<Property, 'id' | 'status'>) => {
    try {
      const payload = {
        name: property.name,
        address: property.address,
        type: property.type || 'apartment',
        rooms: property.rooms || 1,
        monthly_rent: property.monthlyRent,
      };

      await axiosInstance.post('/api/properties/', payload);
      fetchProperties();
      toast.success('Uy muvaffaqiyatli qo\'shildi');
    } catch (error) {
      console.error('Add property error:', error);
      toast.error('Xatolik yuz berdi');
    }
  };

  const updateProperty = async (id: string, property: Partial<Property>) => {
    try {
      const payload: any = { ...property };
      if (property.monthlyRent !== undefined) payload.monthly_rent = property.monthlyRent;
      delete payload.monthlyRent; // remove camelCase version

      await axiosInstance.patch(`/api/properties/${id}`, payload);
      fetchProperties();
    } catch (error) {
      console.error('Update property error:', error);
    }
  };

  const deleteProperty = async (id: string) => {
    try {
      await axiosInstance.delete(`/api/properties/${id}`);
      fetchProperties();
    } catch (error) {
      console.error('Delete property error:', error);
    }
  };

  const addTenant = async (tenant: Omit<Tenant, 'id' | 'status'>) => {
    try {
      const payload = {
        name: tenant.name,
        email: tenant.email,
        phone: tenant.phone,
        property_id: tenant.propertyId,
        monthly_rent: tenant.monthlyRent,
        is_paid: tenant.isPaid ? 1 : 0,
        move_in_date: tenant.moveInDate,
      };

      await axiosInstance.post('/api/tenants/', payload);
      fetchTenants();
      toast.success('Ijarachi muvaffaqiyatli qo\'shildi');
    } catch (error) {
      console.error('Add tenant error:', error);
      toast.error('Xatolik yuz berdi');
    }
  };

  const updateTenant = async (id: string, tenant: Partial<Tenant>) => {
    try {
      const payload: any = { ...tenant };
      if (tenant.propertyId !== undefined) payload.property_id = tenant.propertyId;
      if (tenant.monthlyRent !== undefined) payload.monthly_rent = tenant.monthlyRent;
      if (tenant.isPaid !== undefined) payload.is_paid = tenant.isPaid ? 1 : 0;

      delete payload.propertyId;
      delete payload.monthlyRent;
      delete payload.isPaid;

      await axiosInstance.patch(`/api/tenants/${id}`, payload);
      fetchTenants();
    } catch (error) {
      console.error('Update tenant error:', error);
    }
  };

  const deleteTenant = async (id: string) => {
    try {
      await axiosInstance.delete(`/api/tenants/${id}`);
      fetchTenants();
    } catch (error) {
      console.error('Delete tenant error:', error);
    }
  };

  const addPayment = async (payment: Omit<Payment, 'id' | 'userId'>) => {
    try {
      const payload = {
        property_id: payment.propertyId,
        tenant_id: payment.tenantId,
        amount: payment.amount,
        payment_date: payment.date,
        notes: payment.note,
        payment_method: payment.method || 'cash',
      };
      await axiosInstance.post('/api/payments/', payload);
      fetchPayments();
      // Also update tenant's paid status if relevant
      // We'll let the user manage isPaid manually or handle it here
      toast.success('To\'lov muvaffaqiyatli qo\'shildi');
    } catch (error) {
      console.error('Add payment error:', error);
      toast.error('Xatolik yuz berdi');
    }
  };

  const getTotalActualIncome = () => {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    return payments
      .filter((p) => p.date && p.date.startsWith(currentMonth))
      .reduce((total, p) => total + p.amount, 0);
  };

  const getTotalExpectedIncome = () => {
    return tenants.reduce((total, t) => total + (t.monthlyRent || 0), 0);
  };

  return (
    <AppContext.Provider
      value={{
        properties,
        tenants,
        payments,
        addProperty,
        updateProperty,
        deleteProperty,
        addTenant,
        updateTenant,
        deleteTenant,
        addPayment,
        getTotalActualIncome,
        getTotalExpectedIncome,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
