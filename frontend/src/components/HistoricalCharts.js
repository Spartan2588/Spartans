import React, { useEffect } from 'react';
import './HistoricalCharts.css';

function HistoricalCharts({ data }) {
  const formatTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  useEffect(() => {
    if (window.Plotly) {
      const createChart = (elementId, dataArray, title, color) => {
        const trace = {
          x: dataArray.map(d => formatTime(d.timestamp)),
          y: dataArray.map(d => d.value),
          type: 'scatter',
          mode: 'lines+markers',
          line: { color, width: 2 },
          marker: { size: 4 },
          fill: 'tozeroy',
          fillcolor: color + '33'
        };

        const layout = {
          title: '',
          xaxis: { title: 'Time' },
          yaxis: { title },
          plot_bgcolor: 'rgba(15, 23, 42, 0.5)',
          paper_bgcolor: 'rgba(30, 41, 59, 0.3)',
          font: { color: '#e2e8f0' },
          margin: { l: 50, r: 20, t: 20, b: 50 }
        };

        window.Plotly.newPlot(elementId, [trace], layout, { responsive: true });
      };

      createChart('aqi-chart', data.aqi, 'AQI Level', '#ef4444');
      createChart('hospital-chart', data.hospital_load, 'Load %', '#f59e0b');
      createChart('crop-chart', data.crop_supply, 'Supply %', '#10b981');
    }
  }, [data]);

  return (
    <div className="historical-charts">
      <h2>Historical Trends (Last 24 Hours)</h2>
      <div className="charts-container">
        <div className="chart-wrapper">
          <h3>AQI Trend</h3>
          <div id="aqi-chart" style={{ width: '100%', height: '300px' }}></div>
        </div>

        <div className="chart-wrapper">
          <h3>Hospital Load Trend</h3>
          <div id="hospital-chart" style={{ width: '100%', height: '300px' }}></div>
        </div>

        <div className="chart-wrapper">
          <h3>Crop Supply Trend</h3>
          <div id="crop-chart" style={{ width: '100%', height: '300px' }}></div>
        </div>
      </div>
    </div>
  );
}

export default HistoricalCharts;
