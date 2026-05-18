import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';

export function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-slate-900 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 to-slate-900/50"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 flex flex-col items-center text-center">
          <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-8">
            Premium Tyres for <br />
            <span className="text-blue-500">Every Journey</span>
          </h1>
          <p className="mt-4 text-xl text-slate-300 max-w-2xl mb-10">
            Discover the perfect fit for your vehicle from our massive inventory of top-tier brands. Unbeatable prices, guaranteed safety.
          </p>
          <div className="flex gap-4">
            <Link to="/products">
              <Button size="lg" className="text-lg bg-blue-600 hover:bg-blue-500 rounded-full px-8">
                Shop Now
              </Button>
            </Link>
            <Link to="/track-order">
              <Button size="lg" variant="outline" className="text-lg text-white border-white hover:bg-white/10 rounded-full px-8">
                Track Order
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-3 gap-12 text-center">
          <div>
            <div className="mx-auto h-16 w-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Quality Assured</h3>
            <p className="text-slate-600">All our tyres undergo strict safety and performance checks before reaching you.</p>
          </div>
          <div>
            <div className="mx-auto h-16 w-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Fast Fitting</h3>
            <p className="text-slate-600">Book an appointment online and get your tyres fitted in minutes at our shop.</p>
          </div>
          <div>
            <div className="mx-auto h-16 w-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Best Prices Guarenteed</h3>
            <p className="text-slate-600">We price match all local competitors. Find a better price? Let us know!</p>
          </div>
        </div>
      </section>
    </div>
  );
}
