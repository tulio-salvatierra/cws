import "./App.css";
import Footer from "./components/Footer/Footer";
import Header from "./components/Header/Header";
import Problem from "./components/Problem";
import Hero from "./components/Hero";
import Services from "./components/Services";
import WhoAreWe from "./components/WhoAreWe";

function App() {
  return (
    <div className="App grid grid-cols-1">
      <div>
        <Header />
        <Hero />
      </div>

      <div>
        <Problem />
      </div>

      <div>
        <Services />
      </div>

      <div>
        <WhoAreWe />
      </div>

      <div>
        <Footer />
      </div>
    </div>
  );
}

export default App;
