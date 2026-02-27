import { Link } from 'react-router-dom';
import { Building2, TrendingUp, Users, Calculator, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Navbar } from '../components/Navbar';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

export default function Home() {
  return (
    <div className="min-h-screen bg-white pt-16">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl mb-6" style={{ color: '#1f2937' }}>
                Ijara Uylaringizni Oson Boshqaring
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Rent Calculate bilan ijara uylaringizni boshqaring, ijarachilarni
                kuzating va oylik daromadingizni hisoblang. Hammasi bir joyda.
              </p>
              <div className="flex space-x-4">
                <Link to="/signup">
                  <Button size="lg" style={{ backgroundColor: '#2563EB' }}>
                    Boshlanish
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="outline">
                    Kirish
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1515263487990-61b07816b324?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBhcGFydG1lbnQlMjBidWlsZGluZ3xlbnwxfHx8fDE3NzAzMTMzNTN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Modern Apartment Building"
                className="rounded-lg shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl mb-4">Asosiy Imkoniyatlar</h2>
            <p className="text-xl text-gray-600">
              Ijara biznesingizni boshqarish uchun barcha kerakli vositalar
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
                style={{ backgroundColor: '#2563EB20' }}
              >
                <Building2 className="h-6 w-6" style={{ color: '#2563EB' }} />
              </div>
              <h3 className="text-xl mb-2">Uylarni Boshqarish</h3>
              <p className="text-gray-600">
                Barcha ijara uylaringizni bir joyda boshqaring va kuzatib boring
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
                style={{ backgroundColor: '#2563EB20' }}
              >
                <Users className="h-6 w-6" style={{ color: '#2563EB' }} />
              </div>
              <h3 className="text-xl mb-2">Ijarachilar</h3>
              <p className="text-gray-600">
                Ijarachilar ma'lumotlarini saqlang va to'lovlarni kuzating
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
                style={{ backgroundColor: '#2563EB20' }}
              >
                <Calculator className="h-6 w-6" style={{ color: '#2563EB' }} />
              </div>
              <h3 className="text-xl mb-2">Daromad Kalkulyatori</h3>
              <p className="text-gray-600">
                Oylik daromadingizni avtomatik hisoblang va tahlil qiling
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
                style={{ backgroundColor: '#2563EB20' }}
              >
                <TrendingUp className="h-6 w-6" style={{ color: '#2563EB' }} />
              </div>
              <h3 className="text-xl mb-2">Dashboard</h3>
              <p className="text-gray-600">
                Real-time statistika va hisobotlarni ko'ring
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl mb-6">
                Nima Uchun Rent Calculate?
              </h2>
              <div className="space-y-4">
                <div className="flex items-start">
                  <CheckCircle
                    className="h-6 w-6 mr-3 mt-1 flex-shrink-0"
                    style={{ color: '#2563EB' }}
                  />
                  <div>
                    <h4 className="text-lg mb-1">Oson va Qulay</h4>
                    <p className="text-gray-600">
                      Intuitiv interfeys bilan bir necha daqiqada ishni boshlang
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle
                    className="h-6 w-6 mr-3 mt-1 flex-shrink-0"
                    style={{ color: '#2563EB' }}
                  />
                  <div>
                    <h4 className="text-lg mb-1">Vaqtni Tejaydi</h4>
                    <p className="text-gray-600">
                      Barcha ma'lumotlar bir joyda, qog'ozlar bilan urinish yo'q
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle
                    className="h-6 w-6 mr-3 mt-1 flex-shrink-0"
                    style={{ color: '#2563EB' }}
                  />
                  <div>
                    <h4 className="text-lg mb-1">Xavfsiz</h4>
                    <p className="text-gray-600">
                      Ma'lumotlaringiz xavfsiz saqlanadi va himoyalanadi
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle
                    className="h-6 w-6 mr-3 mt-1 flex-shrink-0"
                    style={{ color: '#2563EB' }}
                  />
                  <div>
                    <h4 className="text-lg mb-1">Bepul Boshlang</h4>
                    <p className="text-gray-600">
                      Hoziroq boshqarishni osonlashtirishni boshlang
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-blue-50 p-12 rounded-lg">
              <h3 className="text-3xl mb-6 text-center">
                Hoziroq Boshlang
              </h3>
              <p className="text-center text-gray-600 mb-8">
                Bir necha daqiqada ro'yxatdan o'ting va ijara biznesingizni
                boshqarishni osonlashtiring
              </p>
              <div className="flex justify-center">
                <Link to="/signup">
                  <Button size="lg" style={{ backgroundColor: '#2563EB' }}>
                    Ro'yxatdan O'tish
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; 2026 Rent Calculate. Barcha huquqlar himoyalangan.</p>
        </div>
      </footer>
    </div>
  );
}
