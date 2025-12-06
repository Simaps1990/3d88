import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import Realizations from '../components/Realizations';

export default function RealizationsPage() {
  return (
    <div className="relative">
      <Navigation />
      <main className="pt-20">
        <Realizations variant="page" />
      </main>
      <Footer />
    </div>
  );
}
