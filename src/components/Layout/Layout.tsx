import { Outlet } from 'react-router-dom';
import Header from '../Header/Header';
import Footer from '../Footer/Footer';

export default function Layout() {
  return (
    <div className="App grid grid-cols-1 overflow-x-hidden w-full">
      <Header />
      <main>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
