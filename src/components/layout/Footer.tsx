import React from 'react';
import { Link } from 'react-router-dom';
import { Leaf, Mail, Phone, MapPin } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-sidebar text-sidebar-foreground">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-primary">
                <Leaf className="h-6 w-6 text-sidebar-primary-foreground" />
              </div>
              <span className="font-display text-xl font-bold">FarmGenius</span>
            </div>
            <p className="text-sm text-sidebar-foreground/80">
              Empowering farmers with AI-driven insights for better crop management, disease detection, and market intelligence.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-display font-semibold text-lg mb-4 text-sidebar-primary">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link to="/dashboard" className="text-sm hover:text-sidebar-primary transition-colors">Dashboard</Link></li>
              <li><Link to="/crop-scan" className="text-sm hover:text-sidebar-primary transition-colors">Crop Disease Detection</Link></li>
              <li><Link to="/yield-prediction" className="text-sm hover:text-sidebar-primary transition-colors">Yield Prediction</Link></li>
              <li><Link to="/market-prices" className="text-sm hover:text-sidebar-primary transition-colors">Market Prices</Link></li>
              <li><Link to="/policies" className="text-sm hover:text-sidebar-primary transition-colors">Government Policies</Link></li>
            </ul>
          </div>

          {/* Help & Support */}
          <div>
            <h3 className="font-display font-semibold text-lg mb-4 text-sidebar-primary">Help & Support</h3>
            <ul className="space-y-2">
              <li><Link to="/help" className="text-sm hover:text-sidebar-primary transition-colors">FAQ</Link></li>
              <li><Link to="/contact" className="text-sm hover:text-sidebar-primary transition-colors">Contact Us</Link></li>
              <li><Link to="/tutorials" className="text-sm hover:text-sidebar-primary transition-colors">Tutorials</Link></li>
              <li><Link to="/feedback" className="text-sm hover:text-sidebar-primary transition-colors">Feedback</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-display font-semibold text-lg mb-4 text-sidebar-primary">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-sidebar-primary" />
                support@farmgenius.in
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-sidebar-primary" />
                +91 1800-XXX-XXXX
              </li>
              <li className="flex items-start gap-2 text-sm">
                <MapPin className="h-4 w-4 text-sidebar-primary mt-0.5" />
                Agricultural Innovation Hub,<br />New Delhi, India
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-sidebar-border mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-sidebar-foreground/60">
            © 2025 FarmGenius. All rights reserved.
          </p>
          <div className="flex gap-4 text-sm text-sidebar-foreground/60">
            <Link to="/privacy" className="hover:text-sidebar-primary transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-sidebar-primary transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
