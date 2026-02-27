import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PropertyCard from "@/components/PropertyCard";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PROPERTY_TYPES } from "@/const";
import { Search, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Vacancies() {
  const { data: properties, isLoading } = trpc.properties.available.useQuery();
  
  const [searchCity, setSearchCity] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterBedrooms, setFilterBedrooms] = useState<string>("all");
  const [maxPrice, setMaxPrice] = useState<string>("");

  // Filter properties
  const filteredProperties = properties?.filter((property) => {
    if (searchCity && !property.city.toLowerCase().includes(searchCity.toLowerCase())) {
      return false;
    }
    if (filterType !== "all" && property.propertyType !== filterType) {
      return false;
    }
    if (filterBedrooms !== "all" && property.bedrooms !== parseInt(filterBedrooms)) {
      return false;
    }
    if (maxPrice && property.rentAmount > parseInt(maxPrice) * 100) {
      return false;
    }
    return true;
  }) || [];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Page Header */}
        <section className="relative bg-gradient-to-br from-[#0B2545] to-[#134074] text-white py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">Available Vacancies</h1>
              <p className="text-xl text-gray-200 leading-relaxed">
                Find your perfect home from our currently available rental properties
              </p>
            </div>
          </div>
        </section>

        {/* Filters */}
        <section className="py-8 bg-gray-50 border-b">
          <div className="container">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by city..."
                  value={searchCity}
                  onChange={(e) => setSearchCity(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="Property Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {PROPERTY_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={filterBedrooms} onValueChange={setFilterBedrooms}>
                <SelectTrigger>
                  <SelectValue placeholder="Bedrooms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any Bedrooms</SelectItem>
                  <SelectItem value="1">1 Bedroom</SelectItem>
                  <SelectItem value="2">2 Bedrooms</SelectItem>
                  <SelectItem value="3">3 Bedrooms</SelectItem>
                  <SelectItem value="4">4+ Bedrooms</SelectItem>
                </SelectContent>
              </Select>
              
              <Input
                type="number"
                placeholder="Max price per month"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
              
              <Button
                variant="outline"
                onClick={() => {
                  setSearchCity("");
                  setFilterType("all");
                  setFilterBedrooms("all");
                  setMaxPrice("");
                }}
              >
                Clear Filters
              </Button>
            </div>
            
            <p className="text-sm text-muted-foreground mt-4">
              Showing {filteredProperties.length} available {filteredProperties.length === 1 ? 'property' : 'properties'}
            </p>
          </div>
        </section>

        {/* Alert for vacancy notifications */}
        <section className="py-6">
          <div className="container">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Don't see what you're looking for? Contact us to be notified when new properties become available in your preferred area.
              </AlertDescription>
            </Alert>
          </div>
        </section>

        {/* Properties Grid */}
        <section className="py-12">
          <div className="container">
            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading available properties...</p>
              </div>
            ) : filteredProperties.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg mb-4">
                  {properties?.length === 0 
                    ? "No properties are currently available. Please check back soon!"
                    : "No properties found matching your criteria."}
                </p>
                {properties && properties.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchCity("");
                      setFilterType("all");
                      setFilterBedrooms("all");
                      setMaxPrice("");
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProperties.map((property) => (
                  <PropertyCard key={property.id} property={property} />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
