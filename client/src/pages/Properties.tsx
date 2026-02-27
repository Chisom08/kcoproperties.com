import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PropertyCard from "@/components/PropertyCard";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PROPERTY_TYPES } from "@/const";
import { Search, SlidersHorizontal } from "lucide-react";

export default function Properties() {
  const { data: properties, isLoading } = trpc.properties.list.useQuery();
  
  const [searchCity, setSearchCity] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterBedrooms, setFilterBedrooms] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");

  // Filter and sort properties
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
    return true;
  }).sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return a.rentAmount - b.rentAmount;
      case "price-high":
        return b.rentAmount - a.rentAmount;
      case "bedrooms":
        return b.bedrooms - a.bedrooms;
      case "newest":
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  }) || [];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Page Header with Background */}
        <section className="relative bg-gradient-to-br from-[#0B2545] to-[#134074] text-white py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-6">All Properties</h1>
              <p className="text-xl text-gray-200 leading-relaxed">
                Browse our complete collection of rental properties
              </p>
            </div>
          </div>
        </section>

        {/* Search and Filter Section */}
        <section className="bg-white py-8 border-b sticky top-0 z-40 shadow-sm">
          <div className="container">
            <div className="grid md:grid-cols-4 gap-4">
              {/* Search by City */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search by city..."
                  value={searchCity}
                  onChange={(e) => setSearchCity(e.target.value)}
                  className="pl-10 h-12"
                />
              </div>

              {/* Property Type Filter */}
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {PROPERTY_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Bedrooms Filter */}
              <Select value={filterBedrooms} onValueChange={setFilterBedrooms}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Any Bedrooms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any Bedrooms</SelectItem>
                  <SelectItem value="0">Studio</SelectItem>
                  <SelectItem value="1">1 Bedroom</SelectItem>
                  <SelectItem value="2">2 Bedrooms</SelectItem>
                  <SelectItem value="3">3 Bedrooms</SelectItem>
                  <SelectItem value="4">4+ Bedrooms</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort By */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="bedrooms">Most Bedrooms</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Results Count */}
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing <span className="font-semibold text-foreground">{filteredProperties.length}</span> of{" "}
                <span className="font-semibold text-foreground">{properties?.length || 0}</span> properties
              </p>
              {(searchCity || filterType !== "all" || filterBedrooms !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchCity("");
                    setFilterType("all");
                    setFilterBedrooms("all");
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        </section>

        {/* Properties Grid */}
        <section className="py-12 bg-gray-50">
          <div className="container">
            {isLoading ? (
              <div className="text-center py-20">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
                <p className="mt-4 text-muted-foreground">Loading properties...</p>
              </div>
            ) : filteredProperties.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-2xl font-bold mb-2">No properties found matching your criteria.</h3>
                <p className="text-muted-foreground mb-6">Try adjusting your filters or search terms.</p>
                <Button
                  onClick={() => {
                    setSearchCity("");
                    setFilterType("all");
                    setFilterBedrooms("all");
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
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
