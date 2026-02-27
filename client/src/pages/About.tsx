import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Shield, Clock, Users, Award, CheckCircle, Home } from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-[#0B2545] to-[#134074] text-white py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">About KCO Properties</h1>
              <p className="text-xl text-gray-200 leading-relaxed">
                Your trusted partner for quality rental homes and professional property management
              </p>
            </div>
          </div>
        </section>

        {/* Mission Statement */}
        <section className="py-16">
          <div className="container max-w-4xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">Our Mission</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                KCO Properties, LLC is a locally owned property management company dedicated to providing safe, 
                comfortable rental homes backed by friendly, local management. Our mission is to offer quality 
                living with transparent service and fast maintenance response. We believe that finding the right 
                home should be simple, and living in it should be even better.
              </p>
            </div>
          </div>
        </section>

        {/* Service Pillars */}
        <section className="py-16 bg-gray-50">
          <div className="container">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-foreground">
              What Sets Us Apart
            </h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <Card>
                <CardContent className="p-6">
                  <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mb-4">
                    <Shield className="h-8 w-8 text-secondary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Responsive Maintenance</h3>
                  <p className="text-muted-foreground">
                    Our dedicated maintenance team responds quickly to keep your home in excellent condition. 
                    Submit requests online and track progress through your tenant portal.
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mb-4">
                    <Clock className="h-8 w-8 text-secondary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Online Services</h3>
                  <p className="text-muted-foreground">
                    Convenient online rent payments, maintenance requests, and document access. 
                    Manage everything from your secure tenant portal 24/7.
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mb-4">
                    <Users className="h-8 w-8 text-secondary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Tenant Support</h3>
                  <p className="text-muted-foreground">
                    Our friendly team is here to help. From move-in to move-out, we provide personalized 
                    support and clear communication every step of the way.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Our Values */}
        <section className="py-16">
          <div className="container max-w-4xl">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-foreground">
              Our Core Values
            </h2>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-6 w-6 text-secondary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Quality & Safety</h3>
                  <p className="text-muted-foreground">
                    We maintain our properties to the highest standards, ensuring safe and comfortable living 
                    environments for all our residents.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-6 w-6 text-secondary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Transparency</h3>
                  <p className="text-muted-foreground">
                    Clear lease terms, upfront pricing, and honest communication. We believe in building 
                    trust through transparency.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-6 w-6 text-secondary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Community Focus</h3>
                  <p className="text-muted-foreground">
                    As a locally owned company, we're invested in our community. We carefully select 
                    properties in great neighborhoods with convenient access to amenities.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-6 w-6 text-secondary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Innovation</h3>
                  <p className="text-muted-foreground">
                    We leverage technology to make renting easier, from online applications to digital 
                    payments and maintenance tracking.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Certifications & Commitment */}
        <section className="py-16 bg-gray-50">
          <div className="container max-w-4xl text-center">
            <div className="w-20 h-20 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Award className="h-10 w-10 text-secondary" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
              Licensed & Committed
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed mb-8">
              KCO Properties, LLC is fully licensed and insured, operating in compliance with all local 
              and state regulations. We're committed to fair housing practices and equal opportunity for 
              all applicants. Our team stays current with industry best practices and local housing laws 
              to serve you better.
            </p>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-16 bg-primary text-primary-foreground">
          <div className="container text-center">
            <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Home className="h-10 w-10 text-primary-foreground" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Make KCO Properties Your Home?
            </h2>
            <p className="text-xl mb-8 text-primary-foreground/90 max-w-2xl mx-auto">
              Browse our available properties or get in touch with our team to learn more about 
              what makes KCO Properties the right choice for you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/vacancies">
                <Button size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
                  View Available Rentals
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="bg-white/10 border-white/20 text-primary-foreground hover:bg-white/20">
                  Contact Us
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
