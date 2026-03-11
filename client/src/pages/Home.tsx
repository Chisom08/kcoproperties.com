import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PropertyCard from "@/components/PropertyCard";
import { trpc } from "@/lib/trpc";
import { CheckCircle, Home as HomeIcon, MapPin, Bed, Bath, Square, ArrowRight } from "lucide-react";
import SEO from "@/components/SEO";

export default function Home() {
  const { data: availableProperties, isLoading } = trpc.properties.available.useQuery();
  
  // Show first 3 featured properties
  const featuredProperties = availableProperties?.slice(0, 3) || [];

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    "name": "KCO Properties, LLC",
    "description": "Quality rental homes backed by friendly, local management and responsive service.",
    "telephone": "(123) 456-7890",
    "email": "info@kcoproperties.com",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "123 Main Street",
      "addressLocality": "Your City",
      "addressRegion": "ST",
      "postalCode": "12345",
      "addressCountry": "US"
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SEO 
        title="KCO Properties - Quality Rental Homes"
        description="Find your perfect rental home with KCO Properties. Comfortable, convenient, and customer-focused rental homes backed by responsive local management."
        structuredData={organizationSchema}
      />
      <Header />
      
      <main className="flex-1">
        {/* Full-Screen Hero Section */}
        <section className="relative h-screen flex items-center justify-center bg-gray-900">
          <div className="absolute inset-0 overflow-hidden">
            <img 
              src="/hero-building.jpg" 
              alt="Modern apartment building" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70"></div>
          </div>
          
          <div className="container relative z-10 text-center text-white px-4">
            <p className="text-sm md:text-base uppercase tracking-[0.3em] mb-4 text-sky-blue font-medium">WELCOME</p>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              Find Your Next Home<br />with KCO Properties
            </h1>
            <p className="text-lg md:text-xl mb-10 max-w-2xl mx-auto text-gray-200 leading-relaxed">
              Comfortable, convenient, and customer-focused rental homes backed by responsive local management.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/vacancies">
                <Button size="lg" className="bg-sky-blue hover:bg-sky-blue/90 text-white px-8 py-6 text-lg">
                  View Available Rentals
                </Button>
              </Link>
              <Link href="/rental">
                <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-primary px-8 py-6 text-lg">
                  Apply Now
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Welcome Section */}
        <section className="py-20 md:py-32 bg-white">
          <div className="container">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] mb-4 text-sky-blue font-medium">YOUR NEW HOME AWAITS</p>
                <h2 className="text-3xl md:text-5xl font-bold mb-6 text-primary">
                  A Perfect Blend of Comfort and Convenience
                </h2>
                <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                  KCO Properties offers a quality lifestyle at an affordable price point. Enjoy beautifully maintained properties with modern amenities and responsive service. Our rental homes are located in prime neighborhoods with easy access to shopping, dining, and entertainment.
                </p>
                <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                  Whether you're seeking open spaces for entertaining or cozy nooks for relaxation, our range of properties ensures you'll find the perfect place to call home.
                </p>
                <Link href="/about">
                  <Button variant="outline" size="lg" className="border-primary text-primary hover:bg-primary hover:text-white">
                    Learn More About Us
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
              <div className="relative h-[500px] rounded-lg overflow-hidden shadow-2xl">
                <img 
                  src="/luxury-interior.webp" 
                  alt="Luxury apartment interior" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Find Your Place Section */}
        <section className="py-20 md:py-32 bg-gray-50">
          <div className="container text-center">
            <p className="text-sm uppercase tracking-[0.3em] mb-4 text-sky-blue font-medium">FIND YOUR PLACE</p>
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-primary">
              Discover Your Perfect Home
            </h2>
            <p className="text-lg text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
              Browse our available properties and schedule your tour today. From studios to spacious multi-bedroom homes, we have options to fit every lifestyle and budget.
            </p>

            {/* Bedroom Filter Cards */}
            <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto mb-16">
              <Link href="/properties">
                <Card className="group cursor-pointer hover:shadow-xl transition-all duration-300 border-2 hover:border-sky-blue">
                  <CardContent className="p-8 text-center">
                    <div className="text-5xl font-bold text-sky-blue mb-2">S</div>
                    <div className="text-xl font-semibold text-primary">STUDIOS</div>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/properties">
                <Card className="group cursor-pointer hover:shadow-xl transition-all duration-300 border-2 hover:border-sky-blue">
                  <CardContent className="p-8 text-center">
                    <div className="text-5xl font-bold text-sky-blue mb-2">1</div>
                    <div className="text-xl font-semibold text-primary">BEDS</div>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/properties">
                <Card className="group cursor-pointer hover:shadow-xl transition-all duration-300 border-2 hover:border-sky-blue">
                  <CardContent className="p-8 text-center">
                    <div className="text-5xl font-bold text-sky-blue mb-2">2+</div>
                    <div className="text-xl font-semibold text-primary">BEDS</div>
                  </CardContent>
                </Card>
              </Link>
            </div>

            {/* Featured Properties */}
            {!isLoading && featuredProperties.length > 0 && (
              <div>
                <h3 className="text-2xl font-bold mb-8 text-primary">Featured Vacancies</h3>
                <div className="grid md:grid-cols-3 gap-8">
                  {featuredProperties.map((property) => (
                    <PropertyCard key={property.id} property={property} />
                  ))}
                </div>
                <div className="mt-12">
                  <Link href="/vacancies">
                    <Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-8">
                      View All Available Properties
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Amenities Section */}
        <section className="py-20 md:py-32 bg-white">
          <div className="container text-center">
            <p className="text-sm uppercase tracking-[0.3em] mb-4 text-sky-blue font-medium">AMENITIES THAT EXCITE</p>
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-primary">
              Elegant Styling & Modern Comfort
            </h2>
            <p className="text-lg text-gray-600 mb-16 max-w-3xl mx-auto leading-relaxed">
              Enjoy a number of must-have amenities to make home feel like home. Our properties provide the perfect blend of convenience and luxury for an enriched living experience.
            </p>

            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              <Card className="group hover:shadow-xl transition-all duration-300">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-sky-blue/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <HomeIcon className="h-8 w-8 text-sky-blue" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-primary">EXPERIENCE</h3>
                  <p className="text-gray-600 leading-relaxed">
                    We are more than four walls and a roof. We create living spaces that enhance your lifestyle and provide comfort you deserve.
                  </p>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-xl transition-all duration-300">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-sky-blue/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="h-8 w-8 text-sky-blue" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-primary">SERVICE</h3>
                  <p className="text-gray-600 leading-relaxed">
                    We will be the bridge from a potential challenge to a perfect solution. Responsive maintenance and dedicated support.
                  </p>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-xl transition-all duration-300">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-sky-blue/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Square className="h-8 w-8 text-sky-blue" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-primary">QUALITY</h3>
                  <p className="text-gray-600 leading-relaxed">
                    We believe the difference is in the details. Well-maintained properties with modern finishes and thoughtful upgrades.
                  </p>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-xl transition-all duration-300">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-sky-blue/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <MapPin className="h-8 w-8 text-sky-blue" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-primary">ACCOUNTABILITY</h3>
                  <p className="text-gray-600 leading-relaxed">
                    We do what we say we will do. Transparent communication and reliable service you can count on.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative py-32 bg-gray-900">
          <div className="absolute inset-0 overflow-hidden">
            <img 
              src="/modern-living.jpg" 
              alt="Modern living space" 
              className="w-full h-full object-cover opacity-40"
            />
          </div>
          
          <div className="container relative z-10 text-center text-white">
            <p className="text-sm uppercase tracking-[0.3em] mb-4 text-sky-blue font-medium">READY TO MOVE IN</p>
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Now Leasing
            </h2>
            <p className="text-lg md:text-xl mb-10 max-w-2xl mx-auto text-gray-200 leading-relaxed">
              Submit your application today. Not quite sure which property is right for you? No problem! Easily schedule an appointment with our exceptional leasing team.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/apply">
                <Button size="lg" className="bg-sky-blue hover:bg-sky-blue/90 text-white px-8 py-6 text-lg">
                  Apply Now
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-primary px-8 py-6 text-lg">
                  Schedule a Tour
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
