// src/features/public-site/pages/Contact.tsx
import PublicLayout from "../../../shared/components/layout/PublicLayout";
import { EnvelopeIcon, PhoneIcon, ChatBubbleLeftEllipsisIcon } from "@heroicons/react/24/solid";
import { FaTelegramPlane, FaFacebookF } from "react-icons/fa";

export default function Contact() {
  return (
    <PublicLayout>
      {/* HERO */}
      <section className="bg-red-600 text-white py-20 flex items-center">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Contact DERASH</h1>
          <p className="text-red-100 text-lg md:text-xl">
            Have questions or need support? Reach out to us through any of the channels below.
          </p>
        </div>
      </section>

      {/* CONTACT INFO */}
      <section className="py-20 bg-gray-50 flex-1">
        <div className="max-w-4xl mx-auto px-6 grid md:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-xl shadow flex items-start gap-4 hover:shadow-lg transition">
            <EnvelopeIcon className="w-8 h-8 text-red-600" />
            <div>
              <h3 className="font-semibold text-red-600 mb-1">Email</h3>
              <p>
                <a href="mailto:support@derash.gov.et" className="text-gray-700 hover:text-red-600">
                  support@derash.gov.et
                </a>
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow flex items-start gap-4 hover:shadow-lg transition">
            <PhoneIcon className="w-8 h-8 text-red-600" />
            <div>
              <h3 className="font-semibold text-red-600 mb-1">Phone</h3>
              <p>
                <a href="tel:+251110000000" className="text-gray-700 hover:text-red-600">
                  +251 11 000 0000
                </a>
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow flex items-start gap-4 hover:shadow-lg transition">
            <FaTelegramPlane className="w-8 h-8 text-red-600" />
            <div>
              <h3 className="font-semibold text-red-600 mb-1">Telegram</h3>
              <p>
                <a href="https://t.me/derash_official" target="_blank" className="text-gray-700 hover:text-red-600">
                  @derash_official
                </a>
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow flex items-start gap-4 hover:shadow-lg transition">
            <FaFacebookF className="w-8 h-8 text-red-600" />
            <div>
              <h3 className="font-semibold text-red-600 mb-1">Facebook</h3>
              <p>
                <a href="https://facebook.com/derashgov" target="_blank" className="text-gray-700 hover:text-red-600">
                  facebook.com/derashgov
                </a>
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow flex items-start gap-4 hover:shadow-lg transition md:col-span-2">
            <ChatBubbleLeftEllipsisIcon className="w-8 h-8 text-red-600" />
            <div>
              <h3 className="font-semibold text-red-600 mb-1">Address</h3>
              <p className="text-gray-700">
                National Information Security Agency, Addis Ababa, Ethiopia
              </p>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}