import { useState } from 'react';
import { Users, Plus, Edit, Trash2, Check, X } from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { useApp, Tenant } from '../contexts/AppContext';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { Toaster } from '../components/ui/sonner';

export default function Tenants() {
  const { tenants, properties, addTenant, updateTenant, deleteTenant } =
    useApp();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    propertyId: '',
    monthlyRent: '',
    isPaid: false,
    moveInDate: '',
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('uz-UZ').format(amount) + ' so\'m';
  };

  const handleOpenDialog = (tenant?: Tenant) => {
    if (tenant) {
      setEditingTenant(tenant);
      setFormData({
        name: tenant.name,
        email: tenant.email,
        phone: tenant.phone,
        propertyId: tenant.propertyId,
        monthlyRent: tenant.monthlyRent.toString(),
        isPaid: tenant.isPaid,
        moveInDate: tenant.moveInDate,
      });
    } else {
      setEditingTenant(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        propertyId: '',
        monthlyRent: '',
        isPaid: false,
        moveInDate: new Date().toISOString().split('T')[0],
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingTenant(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.name ||
      !formData.email ||
      !formData.phone ||
      !formData.propertyId ||
      !formData.monthlyRent ||
      !formData.moveInDate
    ) {
      toast.error('Barcha maydonlarni to\'ldiring');
      return;
    }

    const monthlyRent = parseInt(formData.monthlyRent);
    if (isNaN(monthlyRent) || monthlyRent <= 0) {
      toast.error('Noto\'g\'ri ijara narxi');
      return;
    }

    if (editingTenant) {
      updateTenant(editingTenant.id, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        propertyId: formData.propertyId,
        monthlyRent: monthlyRent,
        isPaid: formData.isPaid,
        moveInDate: formData.moveInDate,
      });
      toast.success('Ijarachi muvaffaqiyatli yangilandi');
    } else {
      addTenant({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        propertyId: formData.propertyId,
        monthlyRent: monthlyRent,
        isPaid: formData.isPaid,
        moveInDate: formData.moveInDate,
      });
      toast.success('Ijarachi muvaffaqiyatli qo\'shildi');
    }

    handleCloseDialog();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Ushbu ijarachini o\'chirishga ishonchingiz komilmi?')) {
      deleteTenant(id);
      toast.success('Ijarachi muvaffaqiyatli o\'chirildi');
    }
  };

  const togglePaymentStatus = (tenant: Tenant) => {
    updateTenant(tenant.id, { isPaid: !tenant.isPaid });
    toast.success(
      tenant.isPaid
        ? 'To\'lov holati "To\'lanmagan" ga o\'zgartirildi'
        : 'To\'lov holati "To\'landi" ga o\'zgartirildi'
    );
  };

  return (
    <DashboardLayout>
      <Toaster />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl mb-2">Ijarachilar</h1>
            <p className="text-gray-600">
              Ijarachilaringizni boshqaring va yangilarini qo'shing
            </p>
          </div>
          <Button
            onClick={() => handleOpenDialog()}
            style={{ backgroundColor: '#2563EB' }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Ijarachi Qo'shish
          </Button>
        </div>

        {tenants.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl mb-2">Ijarachilar topilmadi</h3>
              <p className="text-gray-600 mb-4">
                Birinchi ijarachingizni qo'shish uchun yuqoridagi tugmani bosing
              </p>
              <Button
                onClick={() => handleOpenDialog()}
                style={{ backgroundColor: '#2563EB' }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Ijarachi Qo'shish
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-gray-700">
                        Ijarachi
                      </th>
                      <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-gray-700">
                        Uy
                      </th>
                      <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-gray-700">
                        Oylik ijara
                      </th>
                      <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-gray-700">
                        Holat
                      </th>
                      <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-gray-700">
                        Amallar
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {tenants.map((tenant) => {
                      const property = properties.find(
                        (p) => p.id === tenant.propertyId
                      );

                      return (
                        <tr key={tenant.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-medium">{tenant.name}</p>
                              <p className="text-sm text-gray-600">
                                {tenant.email}
                              </p>
                              <p className="text-sm text-gray-600">
                                {tenant.phone}
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-medium">
                              {property?.name || 'N/A'}
                            </p>
                            <p className="text-sm text-gray-600">
                              {property?.address}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-medium">
                              {formatCurrency(tenant.monthlyRent)}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <Badge
                              variant={tenant.isPaid ? 'default' : 'destructive'}
                              className="cursor-pointer"
                              onClick={() => togglePaymentStatus(tenant)}
                            >
                              {tenant.isPaid ? (
                                <>
                                  <Check className="h-3 w-3 mr-1" />
                                  To'landi
                                </>
                              ) : (
                                <>
                                  <X className="h-3 w-3 mr-1" />
                                  To'lanmagan
                                </>
                              )}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenDialog(tenant)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(tenant.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingTenant
                  ? 'Ijarachini Tahrirlash'
                  : 'Yangi Ijarachi Qo\'shish'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Ism</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Masalan: Alisher Karimov"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      placeholder="email@example.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Telefon</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      placeholder="+998901234567"
                    />
                  </div>
                  <div>
                    <Label htmlFor="moveInDate">Kirish sanasi</Label>
                    <Input
                      id="moveInDate"
                      type="date"
                      value={formData.moveInDate}
                      onChange={(e) =>
                        setFormData({ ...formData, moveInDate: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="property">Uy</Label>
                    <Select
                      value={formData.propertyId}
                      onValueChange={(value) =>
                        setFormData({ ...formData, propertyId: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Uyni tanlang" />
                      </SelectTrigger>
                      <SelectContent>
                        {properties.map((property) => (
                          <SelectItem key={property.id} value={property.id}>
                            {property.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="monthlyRent">Oylik ijara (so'm)</Label>
                    <Input
                      id="monthlyRent"
                      type="number"
                      value={formData.monthlyRent}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          monthlyRent: e.target.value,
                        })
                      }
                      placeholder="5000000"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isPaid"
                    checked={formData.isPaid}
                    onChange={(e) =>
                      setFormData({ ...formData, isPaid: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="isPaid" className="cursor-pointer">
                    To'lov amalga oshirilgan
                  </Label>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseDialog}
                >
                  Bekor qilish
                </Button>
                <Button type="submit" style={{ backgroundColor: '#2563EB' }}>
                  {editingTenant ? 'Saqlash' : 'Qo\'shish'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
