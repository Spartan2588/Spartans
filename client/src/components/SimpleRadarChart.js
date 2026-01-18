import Plotly from 'plotly.js-dist-min';

/**
 * Simple Radar Chart (Spider/Web Chart)
 * Clean visualization with 10 risk categories around a circular grid
 */
export class SimpleRadarChart {
    constructor(containerId) {
        this.containerId = containerId;
        this.container = null;
    }

    init(parentContainer) {
        const container = parentContainer.querySelector(`#${this.containerId}`);
        if (!container) {
            console.error(`Container ${this.containerId} not found`);
            return false;
        }

        this.container = container;
        console.log(`✓ Simple Radar Chart initialized: ${this.containerId}`);
        return true;
    }

    /**
     * Render radar chart with 10 risk categories
     * @param {Object} data - Risk data object with individual risk values
     * @param {Object} metadata - Optional metadata with sources and raw values
     */
    render(data, metadata = null) {
        if (!this.container) {
            console.error('❌ Chart container not initialized');
            return;
        }

        // Extract risk values from data (use latest values in time series)
        const getLatestValue = (arr) => arr && arr.length > 0 ? arr[arr.length - 1] : 50;

        // 10 Risk Categories (evenly distributed around circle)
        const categories = [
            'Heatwave',
            'Rainfall',
            'Flood',
            'Power',
            'Traffic',
            'Hospital',
            'Telecom',
            'Air Quality',
            'Fire',
            'Public Health'
        ];

        // Map data to values
        const values = [
            getLatestValue(data.heat_index_risk),
            getLatestValue(data.extreme_rainfall_prob),
            getLatestValue(data.coastal_flooding_risk),
            getLatestValue(data.power_grid_failure),
            getLatestValue(data.traffic_congestion),
            getLatestValue(data.hospital_capacity_stress),
            getLatestValue(data.telecom_failure_risk),
            getLatestValue(data.environmental_risk),
            getLatestValue(data.fire_hazard_risk),
            getLatestValue(data.public_health_outbreak)
        ];

        // Create enhanced hover text with metadata
        const hoverTexts = this.createEnhancedHoverTexts(categories, values, metadata);

        // Create radar trace (scatterpolar for spider/web chart)
        const trace = {
            type: 'scatterpolar',
            r: values,
            theta: categories,
            fill: 'toself',
            fillcolor: 'rgba(59, 130, 246, 0.3)', // Blue with transparency
            line: {
                color: 'rgb(59, 130, 246)',
                width: 2
            },
            marker: {
                size: 6,
                color: 'rgb(59, 130, 246)'
            },
            hovertext: hoverTexts,
            hoverinfo: 'text',
            name: 'Risk Level'
        };

        // Layout configuration for radar chart
        const layout = {
            polar: {
                radialaxis: {
                    visible: true,
                    range: [0, 100],
                    tickvals: [0, 20, 40, 60, 80, 100],
                    ticktext: ['0', '20', '40', '60', '80', '100'],
                    tickfont: {
                        size: 11,
                        color: '#9ca3af'
                    },
                    gridcolor: '#374151',
                    gridwidth: 1,
                    linecolor: '#374151'
                },
                angularaxis: {
                    tickfont: {
                        size: 13,
                        color: '#e5e7eb',
                        family: 'Inter, sans-serif'
                    },
                    gridcolor: '#374151',
                    gridwidth: 1,
                    linecolor: '#374151'
                },
                bgcolor: '#111827'
            },
            plot_bgcolor: '#111827',
            paper_bgcolor: '#1f2937',
            margin: { t: 80, r: 80, b: 60, l: 80 },
            showlegend: false,
            height: 650,
            autosize: true,
            title: {
                text: metadata && metadata.isLive
                    ? '🔴 LIVE - Mumbai Risk Analysis - Real-Time Data'
                    : 'Mumbai Risk Analysis - Radar Chart',
                font: {
                    size: 18,
                    color: metadata && metadata.isLive ? '#10b981' : '#e5e7eb',
                    family: 'Inter, sans-serif',
                    weight: 600
                }
            }
        };

        // Chart configuration
        const config = {
            responsive: true,
            displayModeBar: true,
            displaylogo: false,
            modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d', 'zoom2d'],
            toImageButtonOptions: {
                format: 'png',
                filename: 'mumbai_radar_chart',
                height: 800,
                width: 800,
                scale: 2
            }
        };

        // Render the radar chart
        Plotly.newPlot(this.container, [trace], layout, config);

        console.log('✅ Radar Chart rendered successfully');
    }

    /**
     * Create enhanced hover texts with metadata
     */
    createEnhancedHoverTexts(categories, values, metadata) {
        if (!metadata || !metadata.rawData) {
            // Simple tooltips if no metadata
            return categories.map((cat, i) =>
                `<b>${cat}</b><br>${values[i]}% Risk`
            );
        }

        const rawData = metadata.rawData;
        const sources = metadata.sources || {};

        // Detailed tooltips with raw data and sources
        const tooltipMap = {
            'Heatwave': `<b>Heatwave Risk</b><br>Risk Score: <b>${values[0]}%</b><br>Temperature: ${rawData.temperature?.toFixed(1)}°C<br>Humidity: ${rawData.humidity}%<br>Source: ${sources.weather || 'Model'}`,
            'Rainfall': `<b>Rainfall Risk</b><br>Risk Score: <b>${values[1]}%</b><br>Rain: ${rawData.rainfall?.toFixed(1)} mm/hr<br>Humidity: ${rawData.humidity}%<br>Source: ${sources.weather || 'Model'}`,
            'Flood': `<b>Flood Risk</b><br>Risk Score: <b>${values[2]}%</b><br>Rainfall: ${rawData.rainfall?.toFixed(1)} mm/hr<br>Tidal Factor<br>Source: Calculated`,
            'Power': `<b>Power Grid Risk</b><br>Risk Score: <b>${values[3]}%</b><br>Temperature: ${rawData.temperature?.toFixed(1)}°C<br>Peak Load Factor<br>Source: Calculated`,
            'Traffic': `<b>Traffic Risk</b><br>Risk Score: <b>${values[4]}%</b><br>Time-based + Weather<br>Rain: ${rawData.rainfall?.toFixed(1)} mm/hr<br>Source: Model`,
            'Hospital': `<b>Hospital Capacity</b><br>Risk Score: <b>${values[5]}%</b><br>AQI: ${rawData.aqi}<br>Temperature: ${rawData.temperature?.toFixed(1)}°C<br>Source: ${sources.aqi || 'Model'}`,
            'Telecom': `<b>Telecom Network</b><br>Risk Score: <b>${values[6]}%</b><br>Weather Impact<br>Power Dependency<br>Source: Calculated`,
            'Air Quality': `<b>Air Quality Health</b><br>Risk Score: <b>${values[7]}%</b><br>AQI: ${rawData.aqi}<br>PM2.5: ${rawData.pm25?.toFixed(1)} µg/m³<br>Source: ${sources.aqi || 'Model'}`,
            'Fire': `<b>Fire Hazard</b><br>Risk Score: <b>${values[8]}%</b><br>Temperature: ${rawData.temperature?.toFixed(1)}°C<br>Humidity: ${rawData.humidity}%<br>Wind: ${rawData.windSpeed?.toFixed(1)} m/s<br>Source: Calculated`,
            'Public Health': `<b>Public Health</b><br>Risk Score: <b>${values[9]}%</b><br>AQI: ${rawData.aqi}<br>Temperature: ${rawData.temperature?.toFixed(1)}°C<br>Source: ${sources.aqi || 'Model'}`
        };

        return categories.map(cat => tooltipMap[cat] || `<b>${cat}</b><br>${values[categories.indexOf(cat)]}% Risk`);
    }

    /**
     * Update chart with new data and metadata
     */
    updateData(data, metadata = null) {
        this.render(data, metadata);
    }

    /**
     * Clean up chart
     */
    destroy() {
        if (this.container) {
            Plotly.purge(this.container);
        }
    }
}
