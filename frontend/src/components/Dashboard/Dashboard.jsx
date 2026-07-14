// src/Dashboard.jsx
import { useEffect } from "react";
import LeftPanel from "../LeftPanel/LeftPanel";
import AnalizePanel from "../AnalizePanel/AnalizePanel";
import Toast from "../Toast/Toast";
import "./Dashboard.css"; // Keep your dashboard-specific styles here
import { DashboardHooks } from "../../hooks/DashboardHooks";
import { getProfile } from "../../services/profileApi";


function Dashboard() {
  useEffect(() => {
    async function loadProfile() {
      try {
        const profile = await getProfile();
        console.log("Authenticated profile:", profile);
      } catch (error) {
        console.error("Profile error:", error.message);
      }
    }

    loadProfile();
  }, []);

  // Destructure from DashboardHooks directly
  const {
    stocks,
    selectedStock,
    loading,
    watchlistLoading,
    analoading,
    newsLoading,
    analysisData,
    currentNews,
    chartData,
    toasts,
    getData,
    DeleteStock,
    handleSelectStock,
    onTimeframeChange,
    dismissToast,
    CurrTimeframe,
    ChartLoading
  } = DashboardHooks();
  
  return (
    <div className="main-body-wrapper">
      {/* Left Column: Brand + Watchlist Panel */}
      <LeftPanel 
        getData={getData} 
        loading={loading} 
        watchlistLoading={watchlistLoading}
        stocks={stocks} 
        DeleteStock={DeleteStock} 
        handleSelectStock={handleSelectStock} 
        selectedStock={selectedStock}
        chartData={chartData}
        timeframe={CurrTimeframe}
        chartLoading={ChartLoading}
      />
      {/* Main Content Dashboard Area */}
      <main className="main-content">
        <AnalizePanel 
          selectedstock={selectedStock} 
          analize={analysisData} 
          load={analoading} 
          currnews={currentNews} 
          newsloadingStatus={newsLoading} 
          chartData={chartData}
          onTimeframeChange={onTimeframeChange}
          CurrTimeframe={CurrTimeframe}
          ChartLoading={ChartLoading}
        />
      </main>
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default Dashboard;
