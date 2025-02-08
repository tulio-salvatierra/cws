import "./App.css";
import Footer from "./components/Footer/Footer";
import Header from "./components/Header/Header";
import Hero from "./components/Hero";
import Services from "./components/Services";
import WhoAreWe from "./components/WhoAreWe";

function App() {
  return (
    <div className="App grid grid-cols-1">
      
      <Header />
      
      <div className="h-screen">
      <Hero />
      </div>
      <div className="h-screen">
        <Services />
      </div>
      <div className="h-screen">
        <WhoAreWe />
      </div>
      <Footer />
    </div>
  );
}

export default App;
