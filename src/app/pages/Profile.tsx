import { useState } from 'react';
import { User, Mail, Phone, Building2, Calendar, Settings, Lock } from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Separator } from '../components/ui/separator';
import { toast } from 'sonner';
import { Toaster } from '../components/ui/sonner';

export default function Profile() {
  // Auth state comes from AuthContext, not AppContext
  const { user, updateUserProfile, changePassword } = useAuth();
  const { properties, tenants, getTotalActualIncome } = useApp();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');

  const totalIncome = getTotalActualIncome();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('uz-UZ').format(amount) + ' so\'m';
  };

  // Save profile to backend via updateUserProfile
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateUserProfile({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
      });
      toast.success('Profil muvaffaqiyatli yangilandi');
      setIsEditing(false);
    } catch (error: any) {
      const msg =
        error?.response?.data?.detail ||
        error?.response?.data?.error ||
        'Profilni yangilashda xatolik yuz berdi';
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
    });
  };

  // Change password via backend
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('Yangi parollar mos kelmadi');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setPasswordError('Yangi parol kamida 6 ta belgidan iborat bo\'lishi kerak');
      return;
    }

    setIsChangingPassword(true);
    try {
      await changePassword(passwordData.oldPassword, passwordData.newPassword);
      toast.success('Parol muvaffaqiyatli o\'zgartirildi');
      setShowPasswordForm(false);
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      const msg =
        error?.response?.data?.error ||
        error?.response?.data?.detail ||
        'Parolni o\'zgartirishda xatolik yuz berdi';
      setPasswordError(msg);
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <DashboardLayout>
      <Toaster />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl mb-2">Profil</h1>
          <p className="text-gray-600">
            Shaxsiy ma'lumotlaringiz va hisob sozlamalari
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Shaxsiy Ma'lumotlar</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Ism</Label>
                    <div className="mt-1 relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        disabled={!isEditing}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <div className="mt-1 relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        disabled={!isEditing}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="phone">Telefon</Label>
                    <div className="mt-1 relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        disabled={!isEditing}
                        className="pl-10"
                        placeholder="+998 90 123 45 67"
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-end space-x-3">
                    {isEditing ? (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleCancelEdit}
                          disabled={isSaving}
                        >
                          Bekor qilish
                        </Button>
                        <Button
                          type="submit"
                          style={{ backgroundColor: '#2563EB' }}
                          disabled={isSaving}
                        >
                          {isSaving ? 'Saqlanmoqda...' : 'Saqlash'}
                        </Button>
                      </>
                    ) : (
                      <Button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        style={{ backgroundColor: '#2563EB' }}
                      >
                        Tahrirlash
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Account Settings Card */}
            <Card>
              <CardHeader>
                <CardTitle>Hisob Sozlamalari</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Settings className="h-5 w-5 text-gray-600" />
                    <div>
                      <p className="font-medium">Parolni o'zgartirish</p>
                      <p className="text-sm text-gray-600">
                        Hisob xavfsizligini oshirish uchun parolni yangilang
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowPasswordForm((v) => !v);
                      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
                      setPasswordError('');
                    }}
                  >
                    {showPasswordForm ? 'Yopish' : 'O\'zgartirish'}
                  </Button>
                </div>

                {showPasswordForm && (
                  <form onSubmit={handlePasswordChange} className="space-y-3 pt-2 border-t">
                    <div>
                      <Label htmlFor="oldPassword">Joriy parol</Label>
                      <div className="mt-1 relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="oldPassword"
                          type="password"
                          value={passwordData.oldPassword}
                          onChange={(e) =>
                            setPasswordData({ ...passwordData, oldPassword: e.target.value })
                          }
                          className="pl-9"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="newPassword">Yangi parol</Label>
                      <div className="mt-1 relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="newPassword"
                          type="password"
                          value={passwordData.newPassword}
                          onChange={(e) =>
                            setPasswordData({ ...passwordData, newPassword: e.target.value })
                          }
                          className="pl-9"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="confirmPassword">Yangi parolni tasdiqlang</Label>
                      <div className="mt-1 relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={passwordData.confirmPassword}
                          onChange={(e) =>
                            setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                          }
                          className="pl-9"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                    {passwordError && (
                      <p className="text-sm text-red-600">{passwordError}</p>
                    )}
                    <div className="flex justify-end space-x-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowPasswordForm(false)}
                        disabled={isChangingPassword}
                      >
                        Bekor qilish
                      </Button>
                      <Button
                        type="submit"
                        style={{ backgroundColor: '#2563EB' }}
                        disabled={isChangingPassword}
                      >
                        {isChangingPassword ? 'Saqlanmoqda...' : 'Saqlash'}
                      </Button>
                    </div>
                  </form>
                )}

                <Separator />

                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-gray-600" />
                  <div>
                    <p className="font-medium">Hisob roli</p>
                    <p className="text-sm text-gray-600 capitalize">{user?.role || '—'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Stats Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Statistika</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: '#2563EB20' }}>
                      <Building2 className="h-5 w-5" style={{ color: '#2563EB' }} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Uylar</p>
                      <p className="text-xl">{properties.length}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: '#10B98120' }}>
                      <User className="h-5 w-5" style={{ color: '#10B981' }} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Ijarachilar</p>
                      <p className="text-xl">{tenants.length}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="text-sm text-gray-600 mb-1">Oylik Daromad</p>
                  <p className="text-xl">{formatCurrency(totalIncome)}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-6">
                <h3 className="font-medium mb-2" style={{ color: '#2563EB' }}>
                  Yordam kerakmi?
                </h3>
                <p className="text-sm text-gray-700 mb-4">
                  Platformadan foydalanish bo'yicha savollaringiz bo'lsa,
                  biz bilan bog'laning
                </p>
                <Button variant="outline" className="w-full">
                  Yordam Markazi
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
