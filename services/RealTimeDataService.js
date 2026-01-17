/**
 * Real-Time Data Service
 * Fetches live data from various APIs for urban risk assessment
 */

export class RealTimeDataService {
  constructor() {
    // API Keys - In production, these should be in environment variables
    this.apiKeys = {
      openWeather: process.env.OPENWEATHER_API_KEY || null,
      aqicn: process.env.AQICN_API_KEY || null
    };

    // City coordinates for API calls
    this.cityCoordinates = {
      1: { lat: 19.0760, lng: 72.8777, name: 'Mumbai' },
      2: { lat: 28.7041, lng: 77.1025, name: 'Delhi' },
      3: { lat: 12.9716, lng: 77.5946, name: 'Bangalore' }
    };

    // Cache for data (5 minute TTL)
    this.cache = new Map();
    this.cacheTTL = 5 * 60 * 1000; // 5 minutes

    // Fallback data generators (used when APIs fail)
    this.fallbackEnabled = true;
  }

  /**
   * Get cached data or fetch new data
   */
  async getCachedOrFetch(key, fetchFn) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      console.log(`[RealTimeData] Using cached data for ${key}`);
      return cached.data;
    }

    try {
      const data = await fetchFn();
      this.cache.set(key, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      console.error(`[RealTimeData] Error fetching ${key}:`, error);
      // Return cached data even if expired, or fallback
      if (cached) {
        console.log(`[RealTimeData] Using expired cache for ${key}`);
        return cached.data;
      }
      throw error;
    }
  }

  /**
   * Fetch weather data from OpenWeatherMap API
   */
  async fetchWeatherData(cityId) {
    const city = this.cityCoordinates[cityId];
    if (!city) throw new Error(`Invalid city ID: ${cityId}`);

    const cacheKey = `weather_${cityId}`;

    return this.getCachedOrFetch(cacheKey, async () => {
      // If no API key, use fallback
      if (!this.apiKeys.openWeather) {
        console.log(`[RealTimeData] No OpenWeather API key, using fallback`);
        return this.generateFallbackWeather(cityId);
      }

      try {
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${city.lat}&lon=${city.lng}&appid=${this.apiKeys.openWeather}&units=metric`;
        
        // Use Promise.race for timeout (more compatible)
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 5000)
        );
        
        const response = await Promise.race([
          fetch(url),
          timeoutPromise
        ]);

        if (!response.ok) {
          throw new Error(`Weather API returned ${response.status}`);
        }

        const data = await response.json();
        return {
          temperature: data.main.temp,
          humidity: data.main.humidity,
          pressure: data.main.pressure,
          windSpeed: data.wind?.speed || 0,
          visibility: data.visibility ? data.visibility / 1000 : 10, // Convert to km
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        console.error(`[RealTimeData] Weather API error:`, error);
        if (this.fallbackEnabled) {
          return this.generateFallbackWeather(cityId);
        }
        throw error;
      }
    });
  }

  /**
   * Fetch AQI data from AQICN API (or OpenWeatherMap Air Pollution)
   */
  async fetchAQIData(cityId) {
    const city = this.cityCoordinates[cityId];
    if (!city) throw new Error(`Invalid city ID: ${cityId}`);

    const cacheKey = `aqi_${cityId}`;

    return this.getCachedOrFetch(cacheKey, async () => {
      // Try OpenWeatherMap Air Pollution API first
      if (this.apiKeys.openWeather) {
        try {
          const url = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${city.lat}&lon=${city.lng}&appid=${this.apiKeys.openWeather}`;
          
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout')), 5000)
          );
          
          const response = await Promise.race([
            fetch(url),
            timeoutPromise
          ]);

          if (response.ok) {
            const data = await response.json();
            const aqi = data.list[0]?.main?.aqi || 1; // 1-5 scale
            // Convert to 0-500 scale (approximate)
            const aqiValue = aqi === 1 ? 50 : aqi === 2 ? 100 : aqi === 3 ? 150 : aqi === 4 ? 200 : 300;
            
            return {
              aqi: aqiValue,
              pm25: data.list[0]?.components?.pm2_5 || 0,
              pm10: data.list[0]?.components?.pm10 || 0,
              timestamp: new Date().toISOString()
            };
          }
        } catch (error) {
          console.warn(`[RealTimeData] OpenWeather AQI failed:`, error);
        }
      }

      // Fallback: Use AQICN API (no key required for basic usage)
      try {
        // AQICN uses city name or coordinates
        const url = `https://api.waqi.info/feed/geo:${city.lat};${city.lng}/?token=${this.apiKeys.aqicn || 'demo'}`;
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 5000)
        );
        
        const response = await Promise.race([
          fetch(url),
          timeoutPromise
        ]);

        if (response.ok) {
          const data = await response.json();
          if (data.status === 'ok' && data.data) {
            return {
              aqi: data.data.aqi || 100,
              pm25: data.data.iaqi?.pm25?.v || 0,
              pm10: data.data.iaqi?.pm10?.v || 0,
              timestamp: new Date().toISOString()
            };
          }
        }
      } catch (error) {
        console.warn(`[RealTimeData] AQICN API failed:`, error);
      }

      // Final fallback
      if (this.fallbackEnabled) {
        return this.generateFallbackAQI(cityId);
      }

      throw new Error('All AQI APIs failed');
    });
  }

  /**
   * Fetch traffic data (using Google Maps or similar)
   * For now, we'll use a combination of time-based patterns and real-time estimation
   */
  async fetchTrafficData(cityId) {
    const cacheKey = `traffic_${cityId}`;
    
    return this.getCachedOrFetch(cacheKey, async () => {
      // Real-time traffic APIs typically require paid services
      // For now, use time-based patterns with some randomness
      const hour = new Date().getHours();
      let density = 'medium';
      
      // Rush hours: 7-10 AM and 5-8 PM
      if ((hour >= 7 && hour <= 10) || (hour >= 17 && hour <= 20)) {
        density = 'high';
      } else if (hour >= 22 || hour <= 5) {
        density = 'low';
      }

      return {
        density,
        level: density === 'low' ? 30 : density === 'medium' ? 60 : 85,
        timestamp: new Date().toISOString()
      };
    });
  }

  /**
   * Fetch hospital load data
   * This would typically come from health department APIs
   * For now, we'll use time-based patterns
   */
  async fetchHospitalLoad(cityId) {
    const cacheKey = `hospital_${cityId}`;
    
    return this.getCachedOrFetch(cacheKey, async () => {
      // Real hospital data would come from health APIs
      // Using time-based patterns with some variation
      const hour = new Date().getHours();
      const baseLoad = 40 + Math.sin(hour / 12 * Math.PI) * 20;
      const load = Math.max(10, Math.min(100, baseLoad + (Math.random() * 10 - 5)));

      return {
        load: Math.round(load),
        timestamp: new Date().toISOString()
      };
    });
  }

  /**
   * Fetch crop supply data
   * This would come from agricultural/commodity APIs
   */
  async fetchCropSupply(cityId) {
    const cacheKey = `crop_${cityId}`;
    
    return this.getCachedOrFetch(cacheKey, async () => {
      // Real crop data would come from agricultural APIs
      // Using seasonal patterns
      const month = new Date().getMonth();
      const seasonalFactor = 0.7 + (Math.sin((month - 3) / 6 * Math.PI) * 0.2);
      const supply = Math.max(20, Math.min(100, 70 * seasonalFactor + (Math.random() * 10 - 5)));

      return {
        supply: Math.round(supply),
        timestamp: new Date().toISOString()
      };
    });
  }

  /**
   * Fetch food price index
   * This would come from economic/commodity APIs
   */
  async fetchFoodPriceIndex(cityId) {
    const cacheKey = `food_price_${cityId}`;
    
    return this.getCachedOrFetch(cacheKey, async () => {
      // Real food price data would come from economic APIs
      // Using base index with some variation
      const baseIndex = 100 + (Math.random() * 20 - 10);
      const index = Math.max(80, Math.min(150, baseIndex));

      return {
        index: parseFloat(index.toFixed(1)),
        timestamp: new Date().toISOString()
      };
    });
  }

  /**
   * Get complete current state for a city
   */
  async getCurrentState(cityId) {
    try {
      const [weather, aqi, traffic, hospital, crop, foodPrice] = await Promise.allSettled([
        this.fetchWeatherData(cityId),
        this.fetchAQIData(cityId),
        this.fetchTrafficData(cityId),
        this.fetchHospitalLoad(cityId),
        this.fetchCropSupply(cityId),
        this.fetchFoodPriceIndex(cityId)
      ]);

      const city = this.cityCoordinates[cityId];

      return {
        city: city.name,
        timestamp: new Date().toISOString(),
        aqi: aqi.status === 'fulfilled' ? aqi.value.aqi : 150,
        temperature: weather.status === 'fulfilled' ? weather.value.temperature : 25,
        hospital_load: hospital.status === 'fulfilled' ? hospital.value.load : 50,
        crop_supply: crop.status === 'fulfilled' ? crop.value.supply : 70,
        food_price_index: foodPrice.status === 'fulfilled' ? foodPrice.value.index : 100,
        traffic_density: traffic.status === 'fulfilled' ? traffic.value.density : 'medium',
        // Additional real-time data
        humidity: weather.status === 'fulfilled' ? weather.value.humidity : null,
        wind_speed: weather.status === 'fulfilled' ? weather.value.windSpeed : null,
        visibility: weather.status === 'fulfilled' ? weather.value.visibility : null
      };
    } catch (error) {
      console.error(`[RealTimeData] Error getting current state for city ${cityId}:`, error);
      throw error;
    }
  }

  /**
   * Get historical data (last 24 hours)
   * For real-time, we'll generate based on current data with trends
   */
  async getHistoricalData(cityId, hours = 24) {
    const currentState = await this.getCurrentState(cityId);
    const now = Date.now();
    const data = {
      aqi: [],
      hospital_load: [],
      crop_supply: [],
      temperature: [],
      food_price_index: []
    };

    // Generate historical data based on current state with realistic trends
    for (let i = hours; i >= 0; i--) {
      const timestamp = new Date(now - i * 3600000).toISOString();
      const hour = new Date(now - i * 3600000).getHours();
      
      // Add variation based on time of day
      const hourFactor = 1 + Math.sin((hour - 6) / 12 * Math.PI) * 0.1;

      data.aqi.push({
        timestamp,
        value: Math.max(50, Math.min(500, currentState.aqi * hourFactor + (Math.random() * 20 - 10)))
      });

      data.temperature.push({
        timestamp,
        value: currentState.temperature + Math.sin((hour - 6) / 12 * Math.PI) * 5 + (Math.random() * 3 - 1.5)
      });

      data.hospital_load.push({
        timestamp,
        value: Math.max(10, Math.min(100, currentState.hospital_load * hourFactor + (Math.random() * 10 - 5)))
      });

      data.crop_supply.push({
        timestamp,
        value: Math.max(20, Math.min(100, currentState.crop_supply + (Math.random() * 5 - 2.5)))
      });

      data.food_price_index.push({
        timestamp,
        value: Math.max(80, Math.min(150, currentState.food_price_index + (Math.random() * 3 - 1.5)))
      });
    }

    return data;
  }

  // Fallback generators
  generateFallbackWeather(cityId) {
    const cityFactors = { 1: 5, 2: 3, 3: 0 }; // Temperature adjustments
    const baseTemp = 25 + cityFactors[cityId] || 0;
    return {
      temperature: baseTemp + (Math.random() * 5 - 2.5),
      humidity: 60 + Math.random() * 20,
      pressure: 1013 + Math.random() * 10,
      windSpeed: 5 + Math.random() * 10,
      visibility: 10,
      timestamp: new Date().toISOString()
    };
  }

  generateFallbackAQI(cityId) {
    const cityFactors = { 1: 1.2, 2: 1.1, 3: 0.9 };
    const baseAQI = 150 * (cityFactors[cityId] || 1);
    return {
      aqi: Math.max(50, Math.min(500, baseAQI + (Math.random() * 50 - 25))),
      pm25: 50 + Math.random() * 30,
      pm10: 80 + Math.random() * 40,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Clear cache (useful for testing or forced refresh)
   */
  clearCache() {
    this.cache.clear();
    console.log('[RealTimeData] Cache cleared');
  }
}
