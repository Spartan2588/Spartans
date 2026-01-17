import React from 'react';
import './CustomSliders.css';

function CustomSliders({ values, onChange, onCalculate }) {
  const sliders = [
    { key: 'aqi', label: 'AQI', min: 0, max: 500, unit: '' },
    { key: 'hospital_load', label: 'Hospital Load', min: 0, max: 100, unit: '%' },
    { key: 'crop_supply', label: 'Crop Supply', min: 0, max: 100, unit: '%' },
    { key: 'temperature', label: 'Temperature', min: 20, max: 50, unit: '°C' }
  ];

  const handleSliderChange = (key, value) => {
    onChange({ ...values, [key]: parseFloat(value) });
  };

  return (
    <div className="custom-sliders">
      <div className="sliders-container">
        {sliders.map((slider) => (
          <div key={slider.key} className="slider-group">
            <div className="slider-header">
              <label>{slider.label}</label>
              <span className="slider-value">
                {values[slider.key]}{slider.unit}
              </span>
            </div>
            <input
              type="range"
              min={slider.min}
              max={slider.max}
              step={slider.key === 'temperature' ? 0.1 : 1}
              value={values[slider.key]}
              onChange={(e) => handleSliderChange(slider.key, e.target.value)}
              className="slider"
            />
            <div className="slider-range">
              <span>{slider.min}</span>
              <span>{slider.max}</span>
            </div>
          </div>
        ))}
      </div>
      <button className="calculate-btn" onClick={onCalculate}>
        Calculate Impact
      </button>
    </div>
  );
}

export default CustomSliders;
