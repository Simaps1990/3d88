import { useEffect } from 'react';
import Navigation from '../components/Navigation';
import Hero from '../components/Hero';
import Services from '../components/Services';
import About from '../components/About';
import Realizations from '../components/Realizations';
import GoogleReviews from '../components/GoogleReviews';
import Contact from '../components/Contact';
import Footer from '../components/Footer';

export default function Home() {
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;

    const id = hash.replace('#', '');
    const target = document.getElementById(id);

    if (target) {
      setTimeout(() => {
        const nav = document.querySelector('nav');
        const navOffset = nav ? nav.getBoundingClientRect().height : 0;
        const rect = target.getBoundingClientRect();
        const offsetTop = rect.top + window.scrollY - navOffset;
        window.scrollTo({ top: offsetTop, behavior: 'smooth' });
      }, 100);
    }
  }, []);

  return (
    <div className="relative">
      <Navigation />
      <Hero />
      <Services />
      <About />
      <Realizations limit={3} showViewAllButton />
      <GoogleReviews />
      <Contact />
      <Footer />
    </div>
  );
}
