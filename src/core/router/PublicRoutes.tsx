import { Routes, Route } from "react-router-dom";
import Home from "../.././features/public-site/pages/Home";
import About from "../.././features/public-site/pages/About";
import Contact from "../.././features/public-site/pages/Contact";

export default function PublicRoutes() {
  return (
    <Routes>
      <Route index element={<Home />} />          {/* / */}
      <Route path="about" element={<About />} />  {/* /about */}
      <Route path="contact" element={<Contact />} /> {/* /contact */}
    </Routes>
  );
}