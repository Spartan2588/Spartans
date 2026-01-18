/**
 * Multi-Domain Risk Calculator
 * Calculates 10+ risk metrics for Mumbai using live weather data and intelligent models
 */
export class RiskDomainCalculator {
    constructor() {
        this.baselinePopulationDensity = 73000; // Mumbai: 73,000 per km²
    }

    /**
     * Calculate all 10+ risk domains from weather and environmental data
     * @param {Object} weatherData - Temperature, rain, AQI, etc.
     * @param {number} timeIndex - Hour of day (0-23)
     * @returns {Object} All risk domain scores
     */
    calculateAllRisks(weatherData, timeIndex = 0) {
        const { temp, rain, aqi, humidity = 70, windSpeed = 10 } = weatherData;

        // Calculate individual risk domains
        const risks = {
            // Original 3 domains
            environmental: this.calculateEnvironmentalRisk(temp, aqi, rain),
            health: this.calculateHealthRisk(aqi, temp, timeIndex),
            foodSecurity: this.calculateFoodSecurityRisk(temp, rain, aqi),

            // New 7+ domains
            heatIndex: this.calculateHeatIndexRisk(temp, humidity, timeIndex),
            extremeRainfall: this.calculateRainfallProbability(rain, temp, humidity),
            coastalFlooding: this.calculateFloodingRisk(rain, timeIndex),
            powerGrid: this.calculatePowerGridRisk(temp, timeIndex, aqi),
            trafficCongestion: this.calculateTrafficRisk(rain, timeIndex, temp),
            hospitalCapacity: this.calculateHospitalStress(aqi, temp, timeIndex),
            populationDensity: this.calculatePopulationStress(timeIndex),
            telecomFailure: this.calculateTelecomRisk(temp, rain, timeIndex),
            fireHazard: this.calculateFireRisk(temp, humidity, windSpeed),
            publicHealth: this.calculateOutbreakRisk(aqi, temp, timeIndex)
        };

        // Calculate composite indices
        risks.compositeUrbanRisk = this.calculateCompositeRisk(risks);
        risks.cascadingFailure = this.calculateCascadingRisk(risks);

        return risks;
    }

    /**
     * Environmental Risk = (temp - 25)² + AQI/5 + rain²
     */
    calculateEnvironmentalRisk(temp, aqi, rain) {
        const tempDiff = temp - 25;
        return Math.min(100, Math.max(0,
            (tempDiff * tempDiff) + (aqi / 5) + (rain * rain)
        ));
    }

    /**
     * Health Risk = AQI/4 + hospital_load + Environmental × 0.4
     */
    calculateHealthRisk(aqi, temp, timeIndex) {
        const hospitalLoad = Math.min(100, aqi / 3);
        const envRisk = this.calculateEnvironmentalRisk(temp, aqi, 0);
        return Math.min(100, Math.max(0,
            (aqi / 4) + hospitalLoad + (envRisk * 0.4)
        ));
    }

    /**
     * Food Security Risk = Environmental × 0.3 + rain³
     */
    calculateFoodSecurityRisk(temp, rain, aqi) {
        const envRisk = this.calculateEnvironmentalRisk(temp, aqi, rain);
        return Math.min(100, Math.max(0,
            (envRisk * 0.3) + (rain * rain * rain)
        ));
    }

    /**
     * Heat Index Risk = (temp - 30)² + (humidity/100) × 20 + solar_radiation
     */
    calculateHeatIndexRisk(temp, humidity, timeIndex) {
        const tempStress = Math.pow(Math.max(0, temp - 30), 2);
        const humidityFactor = (humidity / 100) * 20;

        // Solar radiation proxy based on time of day (peak at noon)
        const solarRadiation = timeIndex >= 10 && timeIndex <= 16
            ? 15 * Math.sin((timeIndex - 10) * Math.PI / 6)
            : 0;

        return Math.min(100, tempStress + humidityFactor + solarRadiation);
    }

    /**
     * Extreme Rainfall Probability = rainfall² × 15 + cloud_cover + pressure_drop
     */
    calculateRainfallProbability(rain, temp, humidity) {
        const rainfallIntensity = Math.pow(rain, 2) * 15;
        const cloudCover = humidity > 80 ? 20 : humidity / 4;
        const pressureDrop = temp < 28 ? 15 : 0; // Proxy for low pressure

        return Math.min(100, rainfallIntensity + cloudCover + pressureDrop);
    }

    /**
     * Coastal Flooding Risk = (tidal_level × 1.5) + rainfall + storm_surge
     */
    calculateFloodingRisk(rain, timeIndex) {
        // Tidal proxy: high tide at 6am and 6pm
        const tidalLevel = Math.abs(Math.sin(timeIndex * Math.PI / 12)) * 30;
        const rainfallContribution = rain * 5;
        const stormSurge = rain > 5 ? 25 : 0;

        return Math.min(100, (tidalLevel * 1.5) + rainfallContribution + stormSurge);
    }

    /**
     * Power Grid Failure = (heat × 0.4) + (peak_load/capacity) × 100 + infrastructure
     */
    calculatePowerGridRisk(temp, timeIndex, aqi) {
        const heatStress = this.calculateHeatIndexRisk(temp, 70, timeIndex) * 0.4;

        // Peak load during evening (6-10pm) and afternoon (2-4pm)
        const isPeak = (timeIndex >= 18 && timeIndex <= 22) || (timeIndex >= 14 && timeIndex <= 16);
        const loadFactor = isPeak ? 45 : 20;

        // Infrastructure stress from pollution
        const infrastructureAge = aqi > 150 ? 15 : aqi / 10;

        return Math.min(100, heatStress + loadFactor + infrastructureAge);
    }

    /**
     * Traffic Congestion = base × (1 + rainfall × 0.3) × (1 + heat × 0.2)
     */
    calculateTrafficRisk(rain, timeIndex, temp) {
        // Base congestion by time of day
        const rushHour = (timeIndex >= 8 && timeIndex <= 10) || (timeIndex >= 17 && timeIndex <= 20);
        const baseLevel = rushHour ? 60 : 30;

        // Weather multipliers
        const rainMultiplier = 1 + (rain * 0.3);
        const heatMultiplier = 1 + (Math.max(0, temp - 35) * 0.02);

        return Math.min(100, baseLevel * rainMultiplier * heatMultiplier);
    }

    /**
     * Hospital Capacity = (AQI/4) + (heat × 0.3) + (disease × 0.4) + baseline
     */
    calculateHospitalStress(aqi, temp, timeIndex) {
        const aqiStress = aqi / 4;
        const heatStress = this.calculateHeatIndexRisk(temp, 70, timeIndex) * 0.3;
        const diseaseRisk = this.calculateOutbreakRisk(aqi, temp, timeIndex) * 0.4;
        const baselineDemand = 25; // Normal occupancy

        return Math.min(100, aqiStress + heatStress + diseaseRisk + baselineDemand);
    }

    /**
     * Population Density Stress = base × (1 + event_factor) × time_factor
     */
    calculatePopulationStress(timeIndex) {
        const baseDensity = 50; // Mumbai baseline

        // Higher density during business hours
        const timeFactor = timeIndex >= 9 && timeIndex <= 18 ? 1.4 : 0.8;

        // Random event factor (markets, festivals, etc.)
        const eventFactor = Math.random() > 0.8 ? 1.3 : 1.0;

        return Math.min(100, baseDensity * timeFactor * eventFactor);
    }

    /**
     * Telecom Failure = (power × 0.6) + (demand_spike) × 100 + weather_damage
     */
    calculateTelecomRisk(temp, rain, timeIndex) {
        const powerRisk = this.calculatePowerGridRisk(temp, timeIndex, 150) * 0.6;

        // Network demand peaks during evening
        const demandSpike = timeIndex >= 19 && timeIndex <= 23 ? 25 : 10;

        // Weather damage from heavy rain
        const weatherDamage = rain > 10 ? 20 : rain * 2;

        return Math.min(100, powerRisk + demandSpike + weatherDamage);
    }

    /**
     * Fire Hazard = (heat - 25)² + (1 - humidity/100) × 50 + wind
     */
    calculateFireRisk(temp, humidity, windSpeed) {
        const heatFactor = Math.pow(Math.max(0, temp - 25), 2);
        const drynessFactor = (1 - humidity / 100) * 50;
        const windFactor = Math.min(20, windSpeed * 2);

        return Math.min(100, heatFactor + drynessFactor + windFactor);
    }

    /**
     * Public Health Outbreak = (AQI/3) + density + sanitation + season
     */
    calculateOutbreakRisk(aqi, temp, timeIndex) {
        const airQualityFactor = aqi / 3;
        const densityFactor = this.calculatePopulationStress(timeIndex) * 0.3;

        // Sanitation stress higher in hot weather
        const sanitationStress = temp > 32 ? 15 : 10;

        // Seasonal factor (monsoon months have higher risk)
        const monthProxy = Math.floor(timeIndex / 30) % 12; // Rough month estimate
        const seasonalFactor = [6, 7, 8].includes(monthProxy) ? 15 : 5;

        return Math.min(100, airQualityFactor + densityFactor + sanitationStress + seasonalFactor);
    }

    /**
     * Composite Urban Risk Index (CURI)
     * Weighted sum of all risk domains
     */
    calculateCompositeRisk(risks) {
        const weights = {
            environmental: 0.12,
            health: 0.18,
            foodSecurity: 0.08,
            heatIndex: 0.10,
            extremeRainfall: 0.08,
            coastalFlooding: 0.08,
            powerGrid: 0.12,
            trafficCongestion: 0.05,
            hospitalCapacity: 0.12,
            populationDensity: 0.03,
            telecomFailure: 0.05,
            fireHazard: 0.06,
            publicHealth: 0.10
        };

        let composite = 0;
        for (const [domain, weight] of Object.entries(weights)) {
            composite += (risks[domain] || 0) * weight;
        }

        return Math.min(100, composite);
    }

    /**
     * Cascading Failure Risk Score
     * Probability of failures triggering each other
     */
    calculateCascadingRisk(risks) {
        let cascadeScore = 0;

        // Power → Telecom cascade
        if (risks.powerGrid > 60) {
            cascadeScore += risks.telecomFailure * 0.8;
        }

        // Power → Hospital cascade
        if (risks.powerGrid > 70) {
            cascadeScore += risks.hospitalCapacity * 0.6;
        }

        // Flooding → Traffic → Hospital cascade
        if (risks.coastalFlooding > 50 && risks.trafficCongestion > 60) {
            cascadeScore += risks.hospitalCapacity * 0.7;
        }

        // Heat → Power → Telecom chain
        if (risks.heatIndex > 65) {
            cascadeScore += (risks.powerGrid + risks.telecomFailure) * 0.25;
        }

        // Fire → Multiple services cascade
        if (risks.fireHazard > 70) {
            cascadeScore += (risks.powerGrid + risks.trafficCongestion + risks.telecomFailure) * 0.3;
        }

        return Math.min(100, cascadeScore / 3); // Normalize
    }
}
