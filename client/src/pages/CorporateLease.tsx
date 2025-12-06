import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Home, 
  MapPin, 
  Wifi, 
  Palmtree, 
  GraduationCap, 
  Activity, 
  Hospital, 
  Building2,
  ChevronLeft,
  ChevronRight,
  Download
} from "lucide-react";

export default function CorporateLease() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentGalleryImage, setCurrentGalleryImage] = useState(0);

  const heroSlides = [
    {
      title: "RENT HOUSES",
      subtitle: "THAT FEEL LIKE",
      highlight: "HOME",
      image: "https://images.unsplash.com/photo-1556912173-3bb406ef7e77?w=1920&h=1080&fit=crop"
    },
    {
      title: "FULLY FURNISHED",
      subtitle: "CORPORATE",
      highlight: "HOUSING",
      image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1920&h=1080&fit=crop"
    },
    {
      title: "COMFORTABLE",
      subtitle: "& FUNCTIONAL",
      highlight: "LIVING",
      image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1920&h=1080&fit=crop"
    }
  ];

  const galleryImages = [
    "https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=1200&h=800&fit=crop",
    "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&h=800&fit=crop",
    "https://images.unsplash.com/photo-1556912173-46c336c7fd55?w=1200&h=800&fit=crop"
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  const nextGalleryImage = () => {
    setCurrentGalleryImage((prev) => (prev + 1) % galleryImages.length);
  };

  const prevGalleryImage = () => {
    setCurrentGalleryImage((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero Slider Section */}
      <section className="relative h-[600px] overflow-hidden">
        {heroSlides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-700 ${
              index === currentSlide ? "opacity-100" : "opacity-0"
            }`}
          >
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${slide.image})` }}
            >
              <div className="absolute inset-0 bg-black/30" />
            </div>
            <div className="relative container h-full flex items-center">
              <div className="max-w-2xl">
                <h1 className="text-6xl md:text-7xl font-bold mb-4 font-serif">
                  <span className="text-[#0B2545] block">{slide.title}</span>
                  <span className="text-[#0B2545] block">{slide.subtitle}</span>
                  <span className="text-[#E89B3C]">{slide.highlight}</span>
                </h1>
              </div>
            </div>
          </div>
        ))}

        {/* Slider Controls */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-3 z-10">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                index === currentSlide ? "bg-[#E89B3C] w-8" : "bg-white/50"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </section>

      {/* Three Feature Cards */}
      <section className="py-16">
        <div className="container">
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-[#F5F1ED] border-none">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold text-[#0B2545] mb-4 font-serif">
                  Elegantly Furnished
                </h3>
                <p className="text-gray-700">
                  Fully furnished Living room, Bedrooms and an equipped Kitchen.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-[#0B2545] border-none">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold text-white mb-4 font-serif">
                  Conveniently Located
                </h3>
                <p className="text-white/90">
                  Located in a quiet neighborhood close to restaurants, shopping outlets and Blue Oval City.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-[#F5F1ED] border-none">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold text-[#0B2545] mb-4 font-serif">
                  Equipped with Amenities
                </h3>
                <p className="text-gray-700">
                  Central Heat/Air, High Speed Internet, Smart TV and Streaming services and Appliances.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Live Comfortable Section */}
      <section className="py-16 bg-white">
        <div className="container max-w-4xl">
          <p className="text-[#E89B3C] uppercase tracking-wider text-sm mb-4">
            WITH FAMILY IN MIND
          </p>
          <h2 className="text-5xl font-bold mb-8 font-serif">
            <span className="text-[#0B2545]">Live </span>
            <span className="text-[#E89B3C]">Comfortable</span>
          </h2>
          
          <div className="space-y-6 text-gray-700 leading-relaxed">
            <p>
              These gorgeously furnished 2 bedroom 1 bathroom properties could your home away from home for you! 
              It's provide a secluded and intimate escape from the everyday stress. There free parking spaces on 
              premises and utilities.
            </p>
            <p>
              Great amenities include recently installed central heat/air, large capacity gas water heater, brand 
              new refrigerator, dishwasher, range, washer and dryer units, windows with ample natural light, 
              laminate and ceramic tile floorings.
            </p>
            <p>
              The neighborhood is very quiet, close to tourist attractions, restaurants, shopping and 19 minutes 
              to Blue Oval City, Stanton, TN and 30 minutes to Jackson, TN. You have the entire house to yourself 
              or as a shared space. Unfortunately, there is a no pet policy.
            </p>
          </div>
        </div>
      </section>

      {/* Comfortable & Functional Living Section */}
      <section className="py-16 bg-[#F5F1ED]">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-5xl font-bold mb-6 font-serif">
                <span className="text-[#0B2545]">Comfortable &</span>
                <br />
                <span className="text-[#0B2545]">Functional </span>
                <span className="text-[#E89B3C]">Living</span>
              </h2>
              <p className="text-gray-700 mb-8 leading-relaxed">
                Energy efficiency simply means using less energy to perform the same task – that is, 
                eliminating energy waste. Energy efficiency brings a variety of ecological benefits.
              </p>
              <Button className="bg-[#E89B3C] hover:bg-[#d88a2b] text-white px-8 py-6 text-lg">
                <Download className="mr-2 h-5 w-5" />
                Download
              </Button>
            </div>

            <div className="relative">
              <div className="relative aspect-[4/3] rounded-lg overflow-hidden shadow-2xl">
                <img
                  src={galleryImages[currentGalleryImage]}
                  alt="Property interior"
                  className="w-full h-full object-cover"
                />
                
                {/* Gallery Navigation */}
                <button
                  onClick={prevGalleryImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-6 w-6 text-[#0B2545]" />
                </button>
                <button
                  onClick={nextGalleryImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-6 w-6 text-[#0B2545]" />
                </button>

                {/* Gallery Dots */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {galleryImages.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentGalleryImage(index)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        index === currentGalleryImage ? "bg-[#E89B3C] w-6" : "bg-white/70"
                      }`}
                      aria-label={`View image ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Property Showcase Section */}
      <section className="py-16 bg-white">
        <div className="container">
          <p className="text-[#E89B3C] uppercase tracking-wider text-sm mb-4">
            Fully Furnished
          </p>
          <h2 className="text-5xl font-bold mb-12 font-serif max-w-3xl">
            <span className="text-[#0B2545]">Two gorgeously furnished properties to </span>
            <span className="text-[#E89B3C]">choose from</span>
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Penny Lane Property */}
            <Card className="overflow-hidden border-none shadow-xl">
              <div className="aspect-square bg-gray-100">
                <img
                  src="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=800&fit=crop"
                  alt="Penny Lane floor plan"
                  className="w-full h-full object-cover"
                />
              </div>
              <CardContent className="p-0">
                <div className="bg-[#0B2545] text-white p-6">
                  <p className="text-[#E89B3C] text-sm mb-2">Penny Lane</p>
                  <h3 className="text-2xl font-bold mb-2">2 Bedroom, 2 Bathroom</h3>
                  <p className="text-white/80">1240 sq. ft</p>
                </div>
              </CardContent>
            </Card>

            {/* Hatchie Street Property */}
            <Card className="overflow-hidden border-none shadow-xl">
              <div className="aspect-square bg-gray-100">
                <img
                  src="https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=800&fit=crop"
                  alt="Hatchie Street floor plan"
                  className="w-full h-full object-cover"
                />
              </div>
              <CardContent className="p-0">
                <div className="bg-[#0B2545] text-white p-6">
                  <p className="text-[#E89B3C] text-sm mb-2">Hatchie Street</p>
                  <h3 className="text-2xl font-bold mb-2">2 Bedroom, 2 Bathroom</h3>
                  <p className="text-white/80">860 sq. ft</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Downtown Brownsville Section */}
      <section className="py-16 bg-[#F5F1ED]">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <h2 className="text-5xl font-bold font-serif">
              <span className="text-[#0B2545]">Downtown </span>
              <span className="text-[#E89B3C]">Brownsville, TN</span>
            </h2>
            <Button className="bg-[#E89B3C] hover:bg-[#d88a2b] text-white px-8 py-6 text-lg">
              <Download className="mr-2 h-5 w-5" />
              Download Brochure
            </Button>
          </div>
        </div>
      </section>

      {/* Numbered Features Section */}
      <section className="py-16 bg-white">
        <div className="container">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Tourism */}
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-[#E89B3C]/10 flex items-center justify-center">
                  <span className="text-[#E89B3C] font-bold text-lg">01</span>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#0B2545] mb-2 uppercase">Tourism</h3>
                <p className="text-gray-700 text-sm leading-relaxed">
                  Brownsville features rich culture heritage and tourist attractions in West Tennessee. 
                  From the Hatchie National Wildlife Refuge to historic Museums and Heritage Centers.
                </p>
              </div>
            </div>

            {/* Schools */}
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-[#E89B3C]/10 flex items-center justify-center">
                  <span className="text-[#E89B3C] font-bold text-lg">02</span>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#0B2545] mb-2 uppercase">Schools</h3>
                <p className="text-gray-700 text-sm leading-relaxed">
                  Haywood County High School, Sunny Hill Elementary and Haywood County Middle are learning 
                  centers in Brownsville for your kids in addition to Tennessee College of Applied Technology.
                </p>
              </div>
            </div>

            {/* Recreation */}
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-[#E89B3C]/10 flex items-center justify-center">
                  <span className="text-[#E89B3C] font-bold text-lg">03</span>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#0B2545] mb-2 uppercase">Recreation</h3>
                <p className="text-gray-700 text-sm leading-relaxed">
                  Looking for recreational activities? Check out the Brownsville Amphitheater, Volunteer 
                  Park Complex, or tour the historic Properties within the city limits.
                </p>
              </div>
            </div>

            {/* Medical Centers */}
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-[#E89B3C]/10 flex items-center justify-center">
                  <span className="text-[#E89B3C] font-bold text-lg">04</span>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#0B2545] mb-2 uppercase">Medical Centers</h3>
                <p className="text-gray-700 text-sm leading-relaxed">
                  Brownsville and Haywood County is home quality medical centers like the Haywood County 
                  Community Hospital, Faith Family Medical Clinic, and Fastpace urgent care.
                </p>
              </div>
            </div>

            {/* Blue Oval City */}
            <div className="flex gap-4 lg:col-span-2">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-[#E89B3C]/10 flex items-center justify-center">
                  <span className="text-[#E89B3C] font-bold text-lg">05</span>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#0B2545] mb-2 uppercase">Blue Oval City</h3>
                <p className="text-gray-700 text-sm leading-relaxed">
                  Ford Motor Company's $5.6 billion dollar 4,100-acre Blue Oval City manufacturing facility 
                  is located 15 minutes from Brownsville poise to provide employment opportunities for over 
                  6,000 Tennesseans.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Target Audience Section */}
      <section className="py-16 bg-[#F5F1ED]">
        <div className="container">
          <h2 className="text-4xl font-bold text-[#0B2545] mb-12 text-center font-serif">
            Perfect For
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-white border-none shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-[#E89B3C]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Hospital className="h-8 w-8 text-[#E89B3C]" />
                </div>
                <h3 className="font-bold text-[#0B2545] mb-2">Traveling Nurses</h3>
                <p className="text-gray-600 text-sm">
                  On assignments at local medical centers.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border-none shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-[#E89B3C]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building2 className="h-8 w-8 text-[#E89B3C]" />
                </div>
                <h3 className="font-bold text-[#0B2545] mb-2">Out-of-State Contractors</h3>
                <p className="text-gray-600 text-sm">
                  Working at Blue Oval City or other local project sites.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border-none shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-[#E89B3C]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Palmtree className="h-8 w-8 text-[#E89B3C]" />
                </div>
                <h3 className="font-bold text-[#0B2545] mb-2">Tourists</h3>
                <p className="text-gray-600 text-sm">
                  Exploring the beautiful West Tennessee heritage and landscapes.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border-none shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-[#E89B3C]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Home className="h-8 w-8 text-[#E89B3C]" />
                </div>
                <h3 className="font-bold text-[#0B2545] mb-2">Families</h3>
                <p className="text-gray-600 text-sm">
                  Seeking serene abode away from home to relax and recharge.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact CTA Section */}
      <section className="py-16 bg-[#0B2545] text-white">
        <div className="container text-center">
          <h2 className="text-4xl font-bold mb-6 font-serif">
            Ready to Make It Your Home?
          </h2>
          <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
            Contact us today to schedule a tour or learn more about our corporate lease options.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-[#E89B3C]" />
              <span>Brownsville, TN</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#E89B3C]">•</span>
              <span>+1 901 438 7660</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#E89B3C]">•</span>
              <span>corporatelease@kcoproperties.com</span>
            </div>
          </div>
          <p className="mt-6 text-white/70">Tue – Sun: 9 AM – 6 PM</p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
