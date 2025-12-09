import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { APP_LOGO, getLoginUrl } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { Menu, X, Phone } from "lucide-react";
import { useState } from "react";

export default function Header() {
  const { user, isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white/95 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50 shadow-md transition-all duration-300">
      <div className="container">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <img src={APP_LOGO} alt="KCO Properties" className="h-12 w-auto" />
            <span className="text-xl font-bold text-primary hidden sm:inline">KCO Properties</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            <Link href="/" className="text-foreground hover:text-primary font-medium transition-colors">
              Home
            </Link>
            <Link href="/about" className="text-foreground hover:text-primary font-medium transition-colors">
              About Us
            </Link>
            <Link href="/properties" className="text-foreground hover:text-primary font-medium transition-colors">
              Properties
            </Link>
            <Link href="/vacancies" className="text-foreground hover:text-primary font-medium transition-colors">
              Vacancies
            </Link>
            <Link href="/amenities" className="text-foreground hover:text-primary font-medium transition-colors">
              Amenities
            </Link>
            <Link href="/corporate-lease" className="text-foreground hover:text-primary font-medium transition-colors">
              Corporate Lease
            </Link>
            <Link href="/contact" className="text-foreground hover:text-primary font-medium transition-colors">
              Contact
            </Link>
          </nav>

          {/* Right Side Actions */}
          <div className="hidden lg:flex items-center gap-4">
            <a href="tel:+1234567890" className="flex items-center gap-2 text-foreground hover:text-primary transition-colors">
              <Phone className="h-4 w-4" />
              <span className="font-medium">(123) 456-7890</span>
            </a>
            
            {isAuthenticated ? (
              <>
                <Link href="/tenant-portal">
                  <Button variant="outline">Tenant Portal</Button>
                </Link>
                {user?.role === 'admin' && (
                  <Link href="/admin">
                    <Button variant="outline">Admin</Button>
                  </Link>
                )}
              </>
            ) : (
              <a href={getLoginUrl()}>
                <Button variant="outline">Tenant Login</Button>
              </a>
            )}
            
            <Link href="/apply">
              <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
                Apply Now
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-gray-200">
            <nav className="flex flex-col gap-4">
              <Link href="/" className="text-foreground hover:text-primary font-medium transition-colors py-2">
                Home
              </Link>
              <Link href="/about" className="text-foreground hover:text-primary font-medium transition-colors py-2">
                About Us
              </Link>
              <Link href="/properties" className="text-foreground hover:text-primary font-medium transition-colors py-2">
                Properties
              </Link>
              <Link href="/vacancies" className="text-foreground hover:text-primary font-medium transition-colors py-2">
                Vacancies
              </Link>
              <Link href="/amenities" className="text-foreground hover:text-primary font-medium transition-colors py-2">
                Amenities
              </Link>
               <Link href="/corporate-lease" className="text-foreground hover:text-primary font-medium transition-colors">
              Corporate Lease
            </Link>
              <Link href="/contact" className="text-foreground hover:text-primary font-medium transition-colors py-2">
                Contact
              </Link>
              
              <div className="flex flex-col gap-2 pt-4 border-t border-gray-200">
                <a href="tel:+1234567890" className="flex items-center gap-2 text-foreground py-2">
                  <Phone className="h-4 w-4" />
                  <span className="font-medium">(123) 456-7890</span>
                </a>
                
                {isAuthenticated ? (
                  <>
                    <Link href="/tenant-portal">
                      <Button variant="outline" className="w-full">Tenant Portal</Button>
                    </Link>
                    {user?.role === 'admin' && (
                      <Link href="/admin">
                        <Button variant="outline" className="w-full">Admin</Button>
                      </Link>
                    )}
                  </>
                ) : (
                  <a href={getLoginUrl()}>
                    <Button variant="outline" className="w-full">Tenant Login</Button>
                  </a>
                )}
                
                <Link href="/apply">
                  <Button className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90">
                    Apply Now
                  </Button>
                </Link>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
