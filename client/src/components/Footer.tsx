import { Link } from "wouter";
import { APP_LOGO, getLoginUrl } from "@/const";
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <img src="/KCOLogo_white.png" alt="KCO Properties" className="h-12 w-auto mb-4" />
            <p className="text-sm text-primary-foreground/80 mb-4">
              Quality rental homes backed by friendly, local management and responsive service.
            </p>
            <div className="flex gap-4">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-secondary transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-secondary transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-secondary transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/properties" className="text-sm text-primary-foreground/80 hover:text-secondary transition-colors">
                  All Properties
                </Link>
              </li>
              <li>
                <Link href="/vacancies" className="text-sm text-primary-foreground/80 hover:text-secondary transition-colors">
                  Available Rentals
                </Link>
              </li>
              <li>
                <Link href="/apply" className="text-sm text-primary-foreground/80 hover:text-secondary transition-colors">
                  Apply Online
                </Link>
              </li>
              <li>
              <a href={getLoginUrl()} target="_blank" className="text-sm text-primary-foreground/80 hover:text-secondary transition-colors">
                   Tenant Portal 
              </a>
              
              </li>
              <li>
                <Link href="/about" className="text-sm text-primary-foreground/80 hover:text-secondary transition-colors">
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm text-primary-foreground/80">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>123 Main Street<br />Your City, ST 12345</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-primary-foreground/80">
                <Phone className="h-4 w-4 flex-shrink-0" />
                <a href="tel:+1234567890" className="hover:text-secondary transition-colors">
                  (901) 607-7890
                </a>
              </li>
              <li className="flex items-center gap-2 text-sm text-primary-foreground/80">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <a href="mailto:info@kcoproperties.com" className="hover:text-secondary transition-colors">
                  info@kcoproperties.com
                </a>
              </li>
            </ul>
            <div className="mt-4">
              <p className="text-sm font-medium">Office Hours</p>
              <p className="text-sm text-primary-foreground/80">Mon-Fri: 9:00 AM - 5:00 PM</p>
              <p className="text-sm text-primary-foreground/80">Sat: 10:00 AM - 2:00 PM</p>
            </div>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Stay Updated</h3>
            <p className="text-sm text-primary-foreground/80 mb-4">
              Subscribe to receive updates on new vacancies and property news.
            </p>
            <form className="flex flex-col gap-2">
              <input
                type="email"
                placeholder="Your email"
                className="px-4 py-2 rounded bg-white/10 border border-white/20 text-primary-foreground placeholder:text-primary-foreground/50 focus:outline-none focus:ring-2 focus:ring-secondary"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded bg-secondary text-secondary-foreground hover:bg-secondary/90 font-medium transition-colors"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-primary-foreground/80">
            © {new Date().getFullYear()} KCO Properties, LLC. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link href="/privacy" className="text-sm text-primary-foreground/80 hover:text-secondary transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-sm text-primary-foreground/80 hover:text-secondary transition-colors">
              Terms & Conditions
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
