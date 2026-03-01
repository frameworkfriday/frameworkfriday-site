import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { navLinks } from "../../data/navigation";
import logo from "../../assets/images/logo.png";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white">
      {/* Announcement Banner */}
      <div className="bg-gray-950 text-white text-center text-sm py-2 px-4">
        <a
          href="https://start.frameworkfriday.ai"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline"
        >
          <span className="inline-block bg-white text-gray-950 text-xs font-semibold px-2 py-0.5 rounded mr-2">
            New
          </span>
          Upcoming Decision Sprint Cohorts Announced: Find out if you are a fit →
        </a>
      </div>

      {/* Main Nav */}
      <nav className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link to="/" className="flex-shrink-0">
            <img src={logo} alt="Framework Friday" className="h-8" />
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) =>
              link.external ? (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-600 hover:text-gray-950 transition-colors"
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.label}
                  to={link.href}
                  className="text-sm text-gray-600 hover:text-gray-950 transition-colors"
                >
                  {link.label}
                </Link>
              )
            )}
            <a
              href="https://start.frameworkfriday.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gray-950 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Get Started
            </a>
          </div>

          {/* Mobile Toggle */}
          <button
            className="md:hidden p-2 text-gray-600"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white px-4 py-4 space-y-3">
            {navLinks.map((link) =>
              link.external ? (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm text-gray-600 hover:text-gray-950"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.label}
                  to={link.href}
                  className="block text-sm text-gray-600 hover:text-gray-950"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              )
            )}
            <a
              href="https://start.frameworkfriday.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center bg-gray-950 text-white text-sm font-medium px-5 py-2.5 rounded-lg"
              onClick={() => setMobileOpen(false)}
            >
              Get Started
            </a>
          </div>
        )}
      </nav>
    </header>
  );
}
