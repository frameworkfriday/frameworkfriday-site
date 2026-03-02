import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { navLinks } from "../../data/navigation";
import logo from "../../assets/images/logo.png";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [bannerVisible, setBannerVisible] = useState(true);
  const location = useLocation();

  function isActive(href: string) {
    if (href === "/") return location.pathname === "/";
    return location.pathname.startsWith(href);
  }

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md">
      {/* Announcement Banner */}
      {bannerVisible && (
        <div className="bg-gray-950 text-white text-center text-sm py-2.5 px-10 sm:px-4 relative">
          <a
            href="https://start.frameworkfriday.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors inline-flex items-center gap-2 flex-wrap justify-center"
          >
            <span className="inline-block bg-primary text-white text-xs font-bold px-2 py-0.5 rounded">
              NEW
            </span>
            <span className="font-semibold">
              <span className="hidden sm:inline">Upcoming Decision Sprint Cohorts Announced: </span>
              <span className="sm:hidden">Decision Sprint Cohorts: </span>
            </span>
            <span className="font-normal">Find out if you are a fit</span>
            <span className="ml-0.5">&rarr;</span>
          </a>
          <button
            onClick={() => setBannerVisible(false)}
            className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-white/80 hover:text-white transition-colors p-1"
            aria-label="Dismiss banner"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Main Nav */}
      <nav className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14 sm:h-16">
          <Link to="/" className="flex-shrink-0">
            <img src={logo} alt="Framework Friday" className="h-7 sm:h-8" />
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => {
              const active = !link.external && isActive(link.href);
              const className = `text-sm font-medium transition-colors ${
                active
                  ? "text-primary"
                  : "text-gray-600 hover:text-primary"
              }`;

              return link.external ? (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={className}
                >
                  {link.label}
                </a>
              ) : (
                <Link key={link.label} to={link.href} className={className}>
                  {link.label}
                </Link>
              );
            })}
            <a
              href="https://start.frameworkfriday.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-primary text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-primary-hover transition-colors shadow-sm"
            >
              Get Started
            </a>
          </div>

          {/* Mobile Toggle */}
          <button
            className="md:hidden p-2 -mr-2 text-gray-600 hover:text-gray-950 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1">
            {navLinks.map((link) =>
              link.external ? (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-base font-medium text-gray-600 hover:text-gray-950 py-3 px-3 rounded-lg hover:bg-gray-50 transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.label}
                  to={link.href}
                  className={`block text-base font-medium py-3 px-3 rounded-lg transition-colors ${
                    isActive(link.href)
                      ? "text-primary bg-primary-light"
                      : "text-gray-600 hover:text-gray-950 hover:bg-gray-50"
                  }`}
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              )
            )}
            <div className="pt-2 pb-1">
              <a
                href="https://start.frameworkfriday.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center bg-primary text-white text-base font-semibold px-5 py-3.5 rounded-lg hover:bg-primary-hover transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                Get Started
              </a>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
