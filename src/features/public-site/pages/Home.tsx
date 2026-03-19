import { Link } from "react-router-dom";
import PublicLayout from "../../../shared/components/layout/PublicLayout";

export default function Home() {
  return (
    <PublicLayout>
      {/* HERO */}
      <section className="bg-gradient-to-r from-red-700 to-red-500 text-white py-32">
        <div className="max-w-4x mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-5xl font-bold leading-tight mb-6">
              National Bill Aggregation Platform
            </h1>

            <p className="text-lg text-red-100 mb-8">
              DERASH is Ethiopia’s unified digital billing platform that
              connects billers, banks, and payment providers to enable
              secure and seamless bill payments for millions of customers.
            </p>

            <div className="flex gap-4">
              <Link
                to="/login"
                className="bg-white text-red-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100"
              >
                Access Platform
              </Link>

              <Link
                to="/about"
                className="bg-white text-red-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100"
              >
                Learn More
              </Link>
            </div>
          </div>

          {/* Hero Card */}
          <div className="bg-white rounded-xl shadow-xl p-8 text-black">
            <h3 className="text-xl font-semibold text-red-600 mb-4">
              DERASH Platform
            </h3>

            <ul className="space-y-3 text-gray-700">
              <li>✔ Unified billing infrastructure</li>
              <li>✔ Secure digital payments</li>
              <li>✔ Integration with banks and wallets</li>
              <li>✔ Real-time transaction reporting</li>
            </ul>
          </div>
        </div>
      </section>

      {/* PLATFORM FLOW */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-12">How DERASH Works</h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="font-semibold text-red-600">Billers</h3>
              <p className="text-sm text-gray-700 mt-2">
                Service providers upload bill data to the platform.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="font-semibold text-red-600">DERASH</h3>
              <p className="text-sm text-gray-700 mt-2">
                The platform securely distributes bill data to agents.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="font-semibold text-red-600">Agents</h3>
              <p className="text-sm text-gray-700 mt-2">
                Banks and operators collect payments from customers.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="font-semibold text-red-600">Customers</h3>
              <p className="text-sm text-gray-700 mt-2">
                Receive bill payment confirmation via SMS.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PLATFORM STATS */}
      <section className="bg-red-50 py-20">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-12">DERASH Platform Impact</h2>
          <div className="grid md:grid-cols-4 gap-10">
            <div>
              <h3 className="text-4xl font-bold text-red-600">370K+</h3>
              <p className="text-gray-700 mt-2">Users</p>
            </div>
            <div>
              <h3 className="text-4xl font-bold text-red-600">650K+</h3>
              <p className="text-gray-700 mt-2">Transactions</p>
            </div>
            <div>
              <h3 className="text-4xl font-bold text-red-600">60B+</h3>
              <p className="text-gray-700 mt-2">Birr Processed</p>
            </div>
            <div>
              <h3 className="text-4xl font-bold text-red-600">16</h3>
              <p className="text-gray-700 mt-2">Integrated Banks</p>
            </div>
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Benefits of DERASH</h2>
          <div className="grid md:grid-cols-3 gap-10">
            <div className="p-8 border rounded-xl hover:shadow-lg transition">
              <h3 className="text-xl font-semibold text-red-600 mb-3">Digital Transformation</h3>
              <p className="text-gray-700">
                Supports the national digital economy by enabling secure electronic payments.
              </p>
            </div>
            <div className="p-8 border rounded-xl hover:shadow-lg transition">
              <h3 className="text-xl font-semibold text-red-600 mb-3">Cashless Economy</h3>
              <p className="text-gray-700">
                Promotes cashless transactions and improves financial accessibility across the country.
              </p>
            </div>
            <div className="p-8 border rounded-xl hover:shadow-lg transition">
              <h3 className="text-xl font-semibold text-red-600 mb-3">Secure Financial Ecosystem</h3>
              <p className="text-gray-700 mb-6">
                Ensures secure payment processing and transparent financial settlement for billers and agents.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-red-50 text-black py-20 text-center">
        <h2 className="text-3xl font-bold mb-12">Access the DERASH Platform</h2>
        <p className="text-gray-700 mb-6">
          Log in to manage bills, payments, and financial reports.
        </p>
        <Link
          to="/login"
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Go to Login
        </Link>
      </section>
    </PublicLayout>
  );
}