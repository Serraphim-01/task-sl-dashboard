import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaExternalLinkAlt, FaEnvelope, FaGlobe, FaTicketAlt } from 'react-icons/fa';

const CustomerSupport: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-starlink-darker p-3 md:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-4 md:mb-8">
          <button
            onClick={() => navigate('/customer/portal')}
            className="flex items-center gap-2 text-starlink-text-secondary hover:text-starlink-text transition-colors mb-3 text-sm"
          >
            <FaArrowLeft />
            <span>Back to Portal</span>
          </button>
          <h1 className="text-xl md:text-3xl font-bold text-starlink-text">Support</h1>
          <p className="text-xs md:text-base text-starlink-text-secondary mt-2">Need help? We're here to assist you.</p>
        </div>

        <div className="space-y-3 md:space-y-6">
          {/* Create Ticket Card */}
          <div className="card p-4 md:p-6 lg:p-8 border-2 border-starlink-border hover:border-starlink-text-secondary/50 transition-colors">
            <div className="flex flex-col md:flex-row items-start gap-3 md:gap-6">
              <div className="bg-starlink-light p-3 rounded-lg">
                <FaTicketAlt className="text-starlink-text" size={24} />
              </div>
              <div className="flex-1">
                <h2 className="text-base md:text-xl font-semibold text-starlink-text mb-2">
                  Create a Support Ticket
                </h2>
                <p className="text-xs md:text-base text-starlink-text-secondary mb-4">
                  Need technical assistance? Create a ticket on our support portal and our team will get back to you as soon as possible.
                </p>
                <a
                  href="https://support.tasksystems.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary inline-flex items-center gap-2 py-2.5 px-4 md:py-3 md:px-6 text-xs md:text-sm"
                >
                  <FaTicketAlt />
                  <span>Create Ticket on Support Portal</span>
                  <FaExternalLinkAlt size={10} />
                </a>
              </div>
            </div>
          </div>

          {/* Contact Email Card */}
          <div className="card p-4 md:p-6 lg:p-8">
            <div className="flex flex-col md:flex-row items-start gap-3 md:gap-6">
              <div className="bg-starlink-light p-3 rounded-lg">
                <FaEnvelope className="text-starlink-text" size={24} />
              </div>
              <div className="flex-1">
                <h2 className="text-base md:text-xl font-semibold text-starlink-text mb-2">
                  Email Support
                </h2>
                <p className="text-xs md:text-base text-starlink-text-secondary mb-3">
                  Have questions or need assistance? Send us an email and we'll respond within 24 hours.
                </p>
                <a
                  href="mailto:support@tasksystems.com"
                  className="text-starlink-text hover:underline text-sm md:text-lg font-medium inline-flex items-center gap-2"
                >
                  <FaEnvelope />
                  support@tasksystems.com
                </a>
              </div>
            </div>
          </div>

          {/* Website Card */}
          <div className="card p-4 md:p-6 lg:p-8">
            <div className="flex flex-col md:flex-row items-start gap-3 md:gap-6">
              <div className="bg-starlink-light p-3 rounded-lg">
                <FaGlobe className="text-starlink-text" size={24} />
              </div>
              <div className="flex-1">
                <h2 className="text-base md:text-xl font-semibold text-starlink-text mb-2">
                  Learn More About Us
                </h2>
                <p className="text-xs md:text-base text-starlink-text-secondary mb-3">
                  Discover our full range of services, solutions, and resources on our official website.
                </p>
                <a
                  href="https://www.tasksystems.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-starlink-text hover:underline text-sm md:text-lg font-medium inline-flex items-center gap-2"
                >
                  <FaGlobe />
                  Visit Our Website
                  <FaExternalLinkAlt size={12} />
                </a>
              </div>
            </div>
          </div>

          {/* Quick Info */}
          <div className="card p-3 md:p-6 bg-starlink-light/50">
            <h3 className="text-sm md:text-lg font-semibold text-starlink-text mb-3">Support Hours</h3>
            <div className="space-y-1.5 text-xs md:text-base text-starlink-text-secondary">
              <p>Monday - Friday: 9:00 AM - 6:00 PM (EST)</p>
              <p>Saturday: 10:00 AM - 2:00 PM (EST)</p>
              <p>Sunday: Closed</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerSupport;
