import { Link } from "react-router-dom";

export default function PublicNavbar() {
  return (
    <nav className="bg-white shadow-md px-8 py-4 flex justify-between items-center">

      <h1 className="text-2xl font-bold text-red-600">
        DERASH
      </h1>

      <div className="flex items-center gap-8">

        <Link to="/" className=" text-black hover:text-red-600">
          Home
        </Link>

        <Link to="/about" className="text-black hover:text-red-600">
          About
        </Link>

        <Link to="/contact" className="text-black hover:text-red-600">
          Contact
        </Link>

        <Link
          to="/login"
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Login
        </Link>

      </div>

    </nav>
  );
}