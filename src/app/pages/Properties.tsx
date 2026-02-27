import { useState } from 'react';
import { Building2, Plus, Edit, Trash2 } from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { useApp, Property } from '../contexts/AppContext';
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
import { toast } from 'sonner';
import { Toaster } from '../components/ui/sonner';

export default function Properties() {
  const { properties, addProperty, updateProperty, deleteProperty, tenants } =
    useApp();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    monthlyRent: '',
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('uz-UZ').format(amount) + ' so\'m';
  };

  const handleOpenDialog = (property?: Property) => {
    if (property) {
      setEditingProperty(property);
      setFormData({
        name: property.name,
        address: property.address,
        monthlyRent: property.monthlyRent.toString(),
      });
    } else {
      setEditingProperty(null);
      setFormData({ name: '', address: '', monthlyRent: '' });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingProperty(null);
    setFormData({ name: '', address: '', monthlyRent: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.address || !formData.monthlyRent) {
      toast.error('Barcha maydonlarni to\'ldiring');
      return;
    }

    const monthlyRent = parseInt(formData.monthlyRent);
    if (isNaN(monthlyRent) || monthlyRent <= 0) {
      toast.error('Noto\'g\'ri ijara narxi');
      return;
    }

    if (editingProperty) {
      await updateProperty(editingProperty.id, {
        name: formData.name,
        address: formData.address,
        monthlyRent: monthlyRent,
      });
      toast.success('Uy muvaffaqiyatli yangilandi');
    } else {
      await addProperty({
        name: formData.name,
        address: formData.address,
        monthlyRent: monthlyRent,
      });
      // Toast handled in AppContext for add
    }

    handleCloseDialog();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Ushbu uyni o\'chirishga ishonchingiz komilmi?')) {
      await deleteProperty(id);
      toast.success('Uy muvaffaqiyatli o\'chirildi');
    }
  };

  return (
    <DashboardLayout>
      <Toaster />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl mb-2">Uylar</h1>
            <p className="text-gray-600">
              Ijara uylaringizni boshqaring va yangilarini qo'shing
            </p>
          </div>
          <Button
            onClick={() => handleOpenDialog()}
            style={{ backgroundColor: '#2563EB' }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Uy Qo'shish
          </Button>
        </div>

        {properties.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl mb-2">Uylar topilmadi</h3>
              <p className="text-gray-600 mb-4">
                Birinchi uyingizni qo'shish uchun yuqoridagi tugmani bosing
              </p>
              <Button
                onClick={() => handleOpenDialog()}
                style={{ backgroundColor: '#2563EB' }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Uy Qo'shish
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => {
              const propertyTenants = tenants.filter(
                (t) => t.propertyId === property.id
              );

              return (
                <Card key={property.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className="p-3 rounded-lg"
                        style={{ backgroundColor: '#2563EB20' }}
                      >
                        <Building2
                          className="h-6 w-6"
                          style={{ color: '#2563EB' }}
                        />
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(property)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(property.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>

                    <h3 className="text-xl mb-2">{property.name}</h3>
                    <p className="text-gray-600 text-sm mb-4">
                      {property.address}
                    </p>

                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600">
                          Oylik ijara:
                        </span>
                        <span className="font-medium">
                          {formatCurrency(property.monthlyRent)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Ijarachilar:</span>
                        <span className="font-medium">
                          {propertyTenants.length}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingProperty ? 'Uyni Tahrirlash' : 'Yangi Uy Qo\'shish'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="name">Uy nomi</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Masalan: Sunny Apartment"
                  />
                </div>
                <div>
                  <Label htmlFor="address">Manzil</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    placeholder="Masalan: 123 Main St, Tashkent"
                  />
                </div>
                <div>
                  <Label htmlFor="monthlyRent">Oylik ijara narxi (so'm)</Label>
                  <Input
                    id="monthlyRent"
                    type="number"
                    value={formData.monthlyRent}
                    onChange={(e) =>
                      setFormData({ ...formData, monthlyRent: e.target.value })
                    }
                    placeholder="Masalan: 5000000"
                  />
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
                  {editingProperty ? 'Saqlash' : 'Qo\'shish'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
