// src/components/layout/Footer.tsx
export default function Footer() {
  return (
    <footer className="bg-white-900 text-white py-10 text-center">
      <p className="text-black">
        © {new Date().getFullYear()} DERASH - National Bill Aggregation Platform
      </p>
    </footer>
  );
}