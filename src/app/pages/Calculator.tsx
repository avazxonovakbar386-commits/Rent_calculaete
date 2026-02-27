import { useState } from 'react';
import { Calculator as CalcIcon, TrendingUp, DollarSign } from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { useApp } from '../contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

export default function Calculator() {
  const { properties, tenants, getTotalActualIncome, getTotalExpectedIncome } = useApp();
  const [selectedMonth] = useState(new Date().toISOString().slice(0, 7));

  const totalExpected = getTotalExpectedIncome();
  const actualPaid = getTotalActualIncome();

  const unpaidAmount = tenants
    .filter((t) => !t.isPaid)
    .reduce((sum, t) => sum + t.monthlyRent, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('uz-UZ').format(amount) + ' so\'m';
  };

  // Group tenants by property
  const propertyStats = properties.map((property) => {
    const propertyTenants = tenants.filter((t) => t.propertyId === property.id);
    const propertyExpected = propertyTenants.reduce(
      (sum, t) => sum + t.monthlyRent,
      0
    );
    const paidTenants = propertyTenants.filter((t) => t.isPaid).length;

    return {
      property,
      tenantCount: propertyTenants.length,
      income: propertyExpected,
      paidTenants,
      unpaidTenants: propertyTenants.length - paidTenants,
    };
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl mb-2">Daromad Kalkulyatori</h1>
          <p className="text-gray-600">
            Oylik daromadingizni hisoblang va tahlil qiling
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Kutilayotgan Daromad</p>
                  <p className="text-2xl mt-2">{formatCurrency(totalExpected)}</p>
                </div>
                <div
                  className="p-3 rounded-lg"
                  style={{ backgroundColor: '#2563EB20' }}
                >
                  <DollarSign className="h-6 w-6" style={{ color: '#2563EB' }} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Haqiqiy To'langan</p>
                  <p className="text-2xl mt-2">{formatCurrency(actualPaid)}</p>
                </div>
                <div
                  className="p-3 rounded-lg"
                  style={{ backgroundColor: '#10B98120' }}
                >
                  <TrendingUp className="h-6 w-6" style={{ color: '#10B981' }} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Qolgan (Kutilayotgan)</p>
                  <p className="text-2xl mt-2">
                    {formatCurrency(totalExpected - actualPaid)}
                  </p>
                </div>
                <div
                  className="p-3 rounded-lg"
                  style={{ backgroundColor: '#EF444420' }}
                >
                  <CalcIcon className="h-6 w-6" style={{ color: '#EF4444' }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>
              Oylik Hisobot - {new Date(selectedMonth).toLocaleDateString('uz-UZ', { month: 'long', year: 'numeric' })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-4 pb-3 border-b">
                <div className="text-sm text-gray-600">Parametr</div>
                <div className="text-sm text-gray-600 text-right">Ijarachilar</div>
                <div className="text-sm text-gray-600 text-right">Foiz</div>
                <div className="text-sm text-gray-600 text-right">Summa</div>
              </div>

              <div className="grid grid-cols-4 gap-4 items-center">
                <div>
                  <p className="font-medium">Kutilayotgan jami</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-600">{tenants.length}</p>
                </div>
                <div className="text-right">
                  <Badge variant="secondary">100%</Badge>
                </div>
                <div className="text-right font-medium">
                  {formatCurrency(totalExpected)}
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 items-center">
                <div>
                  <p className="font-medium text-green-600">To'langan (Haqiqiy)</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-600">
                    {tenants.filter((t) => t.isPaid).length}
                  </p>
                </div>
                <div className="text-right">
                  <Badge style={{ backgroundColor: '#10B981' }}>
                    {totalExpected > 0
                      ? Math.round((actualPaid / totalExpected) * 100)
                      : 0}
                    %
                  </Badge>
                </div>
                <div className="text-right font-medium text-green-600">
                  {formatCurrency(actualPaid)}
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 items-center">
                <div>
                  <p className="font-medium text-red-600">Qolgan summa</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-600">
                    {tenants.filter((t) => !t.isPaid).length}
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant="destructive">
                    {totalExpected > 0
                      ? Math.round(((totalExpected - actualPaid) / totalExpected) * 100)
                      : 0}
                    %
                  </Badge>
                </div>
                <div className="text-right font-medium text-red-600">
                  {formatCurrency(totalExpected - actualPaid)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Property Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Uylar bo'yicha hisobot</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {propertyStats.map(
                ({ property, tenantCount, income, paidTenants, unpaidTenants }) => (
                  <div
                    key={property.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium mb-1">{property.name}</h4>
                      <p className="text-sm text-gray-600">{property.address}</p>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className="text-sm text-gray-600">
                          Ijarachilar: {tenantCount}
                        </span>
                        <span className="text-sm text-green-600">
                          To'landi: {paidTenants}
                        </span>
                        {unpaidTenants > 0 && (
                          <span className="text-sm text-red-600">
                            To'lanmagan: {unpaidTenants}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-medium">
                        {formatCurrency(income)}
                      </p>
                      <p className="text-sm text-gray-600">
                        {totalExpected > 0
                          ? Math.round((income / totalExpected) * 100)
                          : 0}
                        % jami daromaddan
                      </p>
                    </div>
                  </div>
                )
              )}

              {propertyStats.length === 0 && (
                <div className="text-center py-8 text-gray-600">
                  Hali uylar qo'shilmagan
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
