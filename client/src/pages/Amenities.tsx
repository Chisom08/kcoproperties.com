import { Shield, Car, Wrench, Home, MapPin, Heart, Utensils, ShoppingBag } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import SEO from "@/components/SEO";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface Amenity {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const amenities: Amenity[] = [
  {
    icon: <Shield className="w-12 h-12" />,
    title: "Safe Neighborhood",
    description: "Our properties are located on safe and family-friendly neighborhoods.",
  },
  {
    icon: <Car className="w-12 h-12" />,
    title: "Parking Spaces",
    description: "We have designate parking spaces in our properties.",
  },
  {
    icon: <Wrench className="w-12 h-12" />,
    title: "Maintenance",
    description: "We have a team of maintenance support that respond promptly.",
  },
  {
    icon: <Home className="w-12 h-12" />,
    title: "Family-Friendly Floorplans",
    description: "Our properties have plan that guarantee your comfort and privacy.",
  },
  {
    icon: <MapPin className="w-12 h-12" />,
    title: "Great Location",
    description: "Our properties are located in quiet and serene environments. neighborhoods",
  },
  {
    icon: <Heart className="w-12 h-12" />,
    title: "Medical Centers",
    description: "Our properties are located near medical and healthcare centers.",
  },
  {
    icon: <Utensils className="w-12 h-12" />,
    title: "Equipped with Appliances",
    description: "Our units are equipped with home appliances.",
  },
  {
    icon: <ShoppingBag className="w-12 h-12" />,
    title: "Close to Shopping Areas",
    description: "Our properties close to shopping areas, restaurants and recreational activities.",
  },
];

export default function Amenities() {
  return (
    <>
    
    <div className="min-h-screen bg-white">
      <Header />
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#0B2545] to-[#134074] text-white py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-6">Our Amenities</h1>
            <p className="text-xl text-gray-200 leading-relaxed">
              Discover the exceptional features and benefits that make KCO Properties the perfect choice for your next home. We're committed to providing comfortable, convenient, and quality living spaces.
            </p>
          </div>
        </div>
      </section>

      {/* Amenities Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {amenities.map((amenity, index) => (
              <div
                key={index}
                className="group bg-white border border-gray-200 rounded-lg p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="mb-6 text-[#70C4ED] group-hover:text-[#0B2545] transition-colors duration-300">
                    {amenity.icon}
                  </div>
                  <h3 className="text-xl font-bold text-[#0B2545] mb-3">
                    {amenity.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {amenity.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-[#0B2545] mb-6">
              Why Choose KCO Properties?
            </h2>
            <p className="text-lg text-gray-700 leading-relaxed mb-8">
              At KCO Properties, we understand that finding the right home is about more than just four walls and a roof. It's about finding a place where you feel safe, comfortable, and connected to your community. Our commitment to quality, service, and tenant satisfaction sets us apart.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="text-5xl font-bold text-[#70C4ED] mb-2">10+</div>
                <div className="text-gray-600">Years of Experience</div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="text-5xl font-bold text-[#70C4ED] mb-2">100+</div>
                <div className="text-gray-600">Happy Tenants</div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="text-5xl font-bold text-[#70C4ED] mb-2">24/7</div>
                <div className="text-gray-600">Maintenance Support</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[#0B2545] text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6">
              Ready to Find Your Perfect Home?
            </h2>
            <p className="text-xl text-gray-200 mb-8 leading-relaxed">
              Browse our available properties and discover the comfort and convenience of living with KCO Properties.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/properties">
                <Button
                  size="lg"
                  className="bg-[#70C4ED] hover:bg-[#5ab3dc] text-white px-8 py-6 text-lg"
                >
                  View Properties
                </Button>
              </Link>
              <Link href="/schedule-tour">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white hover:text-[#0B2545] px-8 py-6 text-lg"
                >
                  Schedule a Tour
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    
    </div>
    </>
  );
}
