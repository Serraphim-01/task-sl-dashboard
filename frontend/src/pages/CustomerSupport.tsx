import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaExternalLinkAlt, FaEnvelope, FaGlobe, FaTicketAlt } from 'react-icons/fa';

const CustomerSupport: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-starlink-darker p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <button
            onClick={() => navigate('/customer/portal')}
            className="flex items-center gap-2 text-starlink-text-secondary hover:text-starlink-text transition-colors mb-4"
          >
            <FaArrowLeft />
            <span>Back to Portal</span>
          </button>
          <h1 className="text-2xl md:text-3xl font-bold text-starlink-text">Support</h1>
          <p className="text-sm md:text-base text-starlink-text-secondary mt-2">Need help? We're here to assist you.</p>
        </div>

        <div className="space-y-4 md:space-y-6">
          {/* Create Ticket Card */}
          <div className="card p-6 md:p-8 border-2 border-starlink-border hover:border-starlink-text-secondary/50 transition-colors">
            <div className="flex flex-col md:flex-row items-start gap-4 md:gap-6">
              <div className="bg-starlink-light p-4 rounded-lg">
                <FaTicketAlt className="text-starlink-text" size={32} />
              </div>
              <div className="flex-1">
                <h2 className="text-lg md:text-xl font-semibold text-starlink-text mb-2">
                  Create a Support Ticket
                </h2>
                <p className="text-sm md:text-base text-starlink-text-secondary mb-6">
                  Need technical assistance? Create a ticket on our support portal and our team will get back to you as soon as possible.
                </p>
                <a
                  href="https://support.tasksystems.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary inline-flex items-center gap-2 py-3 px-6 text-sm md:text-base"
                >
                  <FaTicketAlt />
                  <span>Create Ticket on Support Portal</span>
                  <FaExternalLinkAlt size={12} />
                </a>
              </div>
            </div>
          </div>

          {/* Contact Email Card */}
          <div className="card p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-start gap-4 md:gap-6">
              <div className="bg-starlink-light p-4 rounded-lg">
                <FaEnvelope className="text-starlink-text" size={32} />
              </div>
              <div className="flex-1">
                <h2 className="text-lg md:text-xl font-semibold text-starlink-text mb-2">
                  Email Support
                </h2>
                <p className="text-sm md:text-base text-starlink-text-secondary mb-4">
                  Have questions or need assistance? Send us an email and we'll respond within 24 hours.
                </p>
                <a
                  href="mailto:support@tasksystems.com"
                  className="text-starlink-text hover:underline text-base md:text-lg font-medium inline-flex items-center gap-2"
                >
                  <FaEnvelope />
                  support@tasksystems.com
                </a>
              </div>
            </div>
          </div>

          {/* Website Card */}
          <div className="card p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-start gap-4 md:gap-6">
              <div className="bg-starlink-light p-4 rounded-lg">
                <FaGlobe className="text-starlink-text" size={32} />
              </div>
              <div className="flex-1">
                <h2 className="text-lg md:text-xl font-semibold text-starlink-text mb-2">
                  Learn More About Us
                </h2>
                <p className="text-sm md:text-base text-starlink-text-secondary mb-4">
                  Discover our full range of services, solutions, and resources on our official website.
                </p>
                <a
                  href="https://www.tasksystems.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-starlink-text hover:underline text-base md:text-lg font-medium inline-flex items-center gap-2"
                >
                  <FaGlobe />
                  Visit Our Website
                  <FaExternalLinkAlt size={14} />
                </a>
              </div>
            </div>
          </div>

          {/* Quick Info */}
          <div className="card p-4 md:p-6 bg-starlink-light/50">
            <h3 className="text-base md:text-lg font-semibold text-starlink-text mb-4">Support Hours</h3>
            <div className="space-y-2 text-sm md:text-base text-starlink-text-secondary">
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
