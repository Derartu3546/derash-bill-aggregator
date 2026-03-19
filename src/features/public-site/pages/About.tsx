// src/features/public-site/pages/About.tsx
import PublicLayout from "../../../shared/components/layout/PublicLayout";
import { FaUsers, FaCreditCard, FaShieldAlt } from "react-icons/fa";

export default function About() {
  return (
    <PublicLayout>
      {/* HERO */}
      <section className="bg-red-600 text-white py-20 flex items-center">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">About DERASH</h1>
          <p className="text-red-100 text-lg md:text-xl">
            Ethiopia’s unified digital billing platform connecting billers, banks, and customers for secure, efficient, and transparent transactions.
          </p>
        </div>
      </section>

      {/* PLATFORM OVERVIEW */}
      <section className="py-16 bg-gray-50 flex-1">
        <div className="max-w-4xl mx-auto px-6 space-y-6 text-gray-700">
          <p>
            DERASH is a unified bill aggregation platform that empowers service providers, billers, and payment agents by simplifying the billing and payment process.
            It allows various service providers to generate bills and enables agents such as banks and payment systems to process payments seamlessly on a single platform.
          </p>
          <p>
            With DERASH, transactions are faster, secure, and fully traceable, contributing to Ethiopia’s digital economy and promoting a cashless ecosystem.
          </p>
        </div>
      </section>

      {/* KEY FEATURES */}
      <section className="py-16 flex-1">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="p-8 bg-white rounded-xl shadow hover:shadow-lg transition">
              <FaUsers className="text-red-600 mx-auto mb-4 text-4xl" />
              <h3 className="font-semibold text-red-600 mb-2">Unified Users</h3>
              <p className="text-gray-600 text-sm">
                Connects billers, banks, agents, and customers under one platform for seamless transactions.
              </p>
            </div>

            <div className="p-8 bg-white rounded-xl shadow hover:shadow-lg transition">
              <FaCreditCard className="text-red-600 mx-auto mb-4 text-4xl" />
              <h3 className="font-semibold text-red-600 mb-2">Secure Payments</h3>
              <p className="text-gray-600 text-sm">
                Supports secure, real-time digital payments and reporting for all integrated services.
              </p>
            </div>

            <div className="p-8 bg-white rounded-xl shadow hover:shadow-lg transition">
              <FaShieldAlt className="text-red-600 mx-auto mb-4 text-4xl" />
              <h3 className="font-semibold text-red-600 mb-2">Trusted & Transparent</h3>
              <p className="text-gray-600 text-sm">
                Provides full transparency and accountability for billers, agents, and regulators.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* MISSION & VISION */}
      <section className="py-16 bg-red flex-1">
        <div className="max-w-4xl mx-auto px-6 space-y-10">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
            <p className="text-gray-700">
              To simplify payments in Ethiopia by providing a secure, reliable, and unified digital billing platform for all service providers and customers.
            </p>
          </div>

          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">Our Vision</h2>
            <p className="text-gray-700">
              To lead Ethiopia towards a cashless economy and become the most trusted digital payments infrastructure nationwide.
            </p>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}