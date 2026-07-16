import { useState } from "react";
import "./AnalizePanel.css"
import AnalizePanelES from "../AnalizePanelES/AnalizePanelES";
import HBMW from "../HBMW/HBMW";
import LoaderStats from "../loader_stats/LoaderStats";
import Stats from "../stats/Stats";
import News from "../News/News"; 
import ChartData from "../Chart/ChartData";
import SelectedStockSummary from "../SelectedStockSummary/SelectedStockSummary";
import CompanyDetailsModal from "../CompanyDetailsModal/CompanyDetailsModal";

function AnalizePanel({selectedstock,analize,load,currnews,newsloadingStatus,chartData,onTimeframeChange,CurrTimeframe,ChartLoading,onSimulationBuySuccess,
}) {
  const [detailsOpen, setDetailsOpen] = useState(false);

  return (
    <>
      <HBMW
        selectedstock={selectedstock}
        onTimeframeChange={onTimeframeChange}
      />
      {!selectedstock ? (
        <AnalizePanelES />
      ) : (
        <>
          <SelectedStockSummary
            stock={selectedstock}
            timeframe={CurrTimeframe}
            onDetailsClick={() => setDetailsOpen(true)}
            onSimulationBuySuccess={onSimulationBuySuccess}
            detailsLoading={load}
          />
          <CompanyDetailsModal
            open={detailsOpen}
            stock={selectedstock}
            analysis={analize}
            onClose={() => setDetailsOpen(false)}
          />
          <ChartData
            data={chartData}
            ChartLoading={ChartLoading}
          />
          {load ? (
            <LoaderStats />
          ) : (
            <Stats
              selectedstock={selectedstock}
              analize={analize}
              chartData={chartData}
              timeframe={CurrTimeframe}
            />
          )}
          <News
            news={currnews}
            newsloading={newsloadingStatus}
          />
        </>
      )}
    </>
  );
}

export default AnalizePanel;
