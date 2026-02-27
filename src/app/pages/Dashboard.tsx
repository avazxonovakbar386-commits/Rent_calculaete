import { Building2, Users, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { StatCard } from '../components/StatCard';
import { useApp } from '../contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

export default function Dashboard() {
  const { properties, tenants, getTotalActualIncome } = useApp();

  const totalIncome = getTotalActualIncome();
  // Note: totalIncome now reflects actual payments made in the current month
  const paidTenants = tenants.filter((t) => t.isPaid).length;
  const unpaidTenants = tenants.filter((t) => !t.isPaid).length;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('uz-UZ').format(amount) + ' so\'m';
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl mb-2">Dashboard</h1>
          <p className="text-gray-600">
            Biznesingiz haqida umumiy ma'lumot va statistika
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Jami Uylar"
            value={properties.length}
            icon={Building2}
            iconColor="#2563EB"
          />
          <StatCard
            title="Faol Ijarachilar"
            value={tenants.length}
            icon={Users}
            iconColor="#10B981"
          />
          <StatCard
            title="Oylik Daromad"
            value={formatCurrency(totalIncome)}
            icon={DollarSign}
            iconColor="#F59E0B"
          />
          <StatCard
            title="To'lov Holati"
            value={`${paidTenants}/${tenants.length}`}
            icon={TrendingUp}
            iconColor="#8B5CF6"
          />
        </div>

        {/* Recent Properties and Tenants */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Properties Card */}
          <Card>
            <CardHeader>
              <CardTitle>So'nggi Uylar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {properties.slice(0, 5).map((property) => {
                  const tenantCount = tenants.filter(
                    (t) => t.propertyId === property.id
                  ).length;

                  return (
                    <div
                      key={property.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <div
                          className="p-2 rounded-lg"
                          style={{ backgroundColor: '#2563EB20' }}
                        >
                          <Building2
                            className="h-5 w-5"
                            style={{ color: '#2563EB' }}
                          />
                        </div>
                        <div>
                          <p className="font-medium">{property.name}</p>
                          <p className="text-sm text-gray-600">
                            {property.address}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {formatCurrency(property.monthlyRent)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {tenantCount} ijarachi
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Tenants Card */}
          <Card>
            <CardHeader>
              <CardTitle>So'nggi Ijarachilar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tenants.slice(0, 5).map((tenant) => {
                  const property = properties.find(
                    (p) => p.id === tenant.propertyId
                  );

                  return (
                    <div
                      key={tenant.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <div
                          className="p-2 rounded-lg"
                          style={{ backgroundColor: '#10B98120' }}
                        >
                          <Users
                            className="h-5 w-5"
                            style={{ color: '#10B981' }}
                          />
                        </div>
                        <div>
                          <p className="font-medium">{tenant.name}</p>
                          <p className="text-sm text-gray-600">
                            {property?.name || 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {formatCurrency(tenant.monthlyRent)}
                        </p>
                        <Badge
                          variant={tenant.isPaid ? 'default' : 'destructive'}
                        >
                          {tenant.isPaid ? 'To\'landi' : 'To\'lanmagan'}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Status Overview */}
        {unpaidTenants > 0 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-6">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-6 w-6 text-orange-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-lg text-orange-900 mb-1">
                    To'lov Eslatmasi
                  </h3>
                  <p className="text-orange-800">
                    {unpaidTenants} ta ijarachi hali to'lovni amalga oshirmagan.
                    Ularni xabardor qilishni unutmang.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
