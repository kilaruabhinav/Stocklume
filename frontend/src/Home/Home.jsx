import "./Home.css";
import HomeHero from "./components/HomeHero/HomeHero";
import HomeMarketDashboard from "./components/HomeMarketDashboard/HomeMarketDashboard";
import HomeTickerTape from "./components/HomeTickerTape/HomeTickerTape";

function Home() {
  return (
    <main className="home-page">
      <HomeTickerTape />
      <HomeHero />
      <HomeMarketDashboard />
    </main>
  );
}

export default Home;
