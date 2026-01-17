# Living 3D City Environment
## Data-Driven Urban Visualization System

---

## 🏙️ Overview

The Urban Risk Intelligence Platform now features a **persistent, living 3D city environment** that serves as the primary visual layer behind the entire interface. This city is not decorative—it visually represents the system state and reacts intelligently to user input, scenarios, and risk levels.

---

## 🎨 Visual Design

### Color Palette
- **Primary**: Black (#0a0a1a) - Deep, immersive background
- **Lighting**: Violet (#a78bfa) - Main directional light
- **Secondary**: Cyan (#06b6d4) - Point light accent
- **Heat**: Orange (#ff6b35) - Temperature-driven effects
- **Zones**:
  - Agriculture: Dark green (#2d5016)
  - Health: Dark red (#4a1a1a)
  - Industrial: Dark purple (#2a2a3e)
  - Residential: Deep purple (#1e1e3f)

### Atmospheric Effects
- **Fog**: Dynamic depth fade based on AQI
- **Lighting**: Violet + cyan directional lights
- **Particles**: 500 ambient particles for air/data visualization
- **Shadows**: PCF shadow mapping for depth
- **Emissive Materials**: Subtle glow on buildings

---

## 🏗️ City Architecture

### Procedural Generation
- **Grid-based layout**: 5x5 grid of city blocks
- **Block size**: 8 units with 12-unit spacing
- **Zone distribution**:
  - Center: Residential + Health facilities
  - Mid-ring: Industrial zones
  - Outer-ring: Agriculture zones

### Building System
- **Procedural generation**: Random height (5-20 units), width (1-3 units), depth (1-3 units)
- **Material system**: Zone-specific colors with emissive properties
- **Shadow casting**: All buildings cast and receive shadows
- **Total buildings**: ~100-150 procedurally generated

### Zone Types
1. **Agriculture** (Outer ring)
   - Green-tinted buildings
   - Responds to crop supply changes
   - Visual growth/wilting animations

2. **Health** (Mid-ring)
   - Red-tinted buildings
   - Pulsing effects during high hospital load
   - Heartbeat-like animations

3. **Industrial** (Mid-ring)
   - Purple-tinted buildings
   - Responds to environmental risk
   - Smoke/haze effects

4. **Residential** (Center)
   - Purple-tinted buildings
   - General risk indicators
   - Lighting intensity changes

---

## 📊 Data-Driven Reactions

### Environmental Risk (AQI)
```
AQI 0-100:    Clear visibility, minimal fog
AQI 100-250:  Moderate fog, slight haze
AQI 250-400:  Heavy fog, reduced visibility
AQI 400-500:  Extreme fog, dark atmosphere
```

**Visual Effects**:
- Fog far distance decreases with AQI
- Particle density increases
- Overall lighting dims
- Color grading shifts toward orange/red

### Temperature
```
20°C:  Cool, normal lighting
25°C:  Neutral state
30°C:  Warm tones begin
40°C:  Strong heat effects
50°C:  Extreme heat visualization
```

**Visual Effects**:
- Heat light intensity increases
- Color temperature shifts warm
- Building emissive intensity increases
- Subtle shimmer effect

### Hospital Load
```
0-30%:   Normal, no pulsing
30-60%:  Subtle pulsing in health zones
60-80%:  Moderate pulsing, increased glow
80-100%: Intense pulsing, critical state
```

**Visual Effects**:
- Health zone buildings pulse
- Emissive intensity oscillates
- Color shifts toward red
- Frequency increases with load

### Crop Supply
```
0-30%:   Severe drought, zones dim
30-60%:  Moderate stress, muted colors
60-100%: Healthy, vibrant green
```

**Visual Effects**:
- Agriculture zone color shifts
- HSL saturation changes
- Growth animations trigger
- Brightness correlates with supply

---

## 🎬 Animation System

### Idle State
- **Camera drift**: Slow, cinematic movement
- **Building sway**: Subtle vertical bobbing
- **Particle flow**: Continuous ambient movement
- **Lighting**: Gentle pulsing

### User Interaction
- **Mouse parallax**: Camera responds to mouse position
- **Smooth transitions**: GSAP-powered animations
- **No jarring changes**: All transitions are 1.5 seconds

### Scenario Transitions
When user enters a scenario via chat:
1. Fog animates to new AQI level (1.5s)
2. Heat light intensity updates (1.5s)
3. Building colors transition (1.5s)
4. Pulsing effects activate/deactivate
5. All changes are smooth and coordinated

---

## 🔧 Technical Implementation

### CityEnvironment Class (`utils/CityEnvironment.js`)

#### Constructor
```javascript
new CityEnvironment(container)
```
- Creates Three.js scene, camera, renderer
- Generates procedural city
- Sets up lighting and atmosphere
- Initializes particle system

#### Key Methods

**generateCity()**
- Creates grid of city blocks
- Procedurally generates buildings
- Assigns zone types
- Organizes buildings by zone

**createBuilding(x, z, zoneType)**
- Generates random building geometry
- Applies zone-specific material
- Sets up shadows
- Stores metadata

**updateCityState(scenarioData)**
- Parses scenario data
- Calculates new city state
- Triggers animations

**animateCityTransition(newState)**
- Animates fog changes
- Updates heat light
- Transitions building colors
- Manages pulsing effects

**animate()**
- Continuous render loop
- Camera parallax
- Particle movement
- Building animations

### Integration Points

**Global Access**
```javascript
window.cityEnvironment  // Accessible from anywhere
```

**Event Listening**
```javascript
window.addEventListener('scenario-updated', (e) => {
  cityEnvironment.updateCityState(e.detail);
});
```

**Persistent Across Pages**
- City created once in `main.js`
- Persists across all page navigation
- Updates state without reload
- Maintains animation loop

---

## 🎯 Performance Optimizations

### Geometry Optimization
- **Instancing**: Buildings use shared geometries
- **LOD**: Potential for level-of-detail in future
- **Culling**: Frustum culling enabled
- **Shadows**: Optimized shadow map resolution

### Rendering
- **Target**: 60 FPS
- **Pixel ratio**: Respects device pixel ratio
- **Fog**: Reduces far-plane rendering
- **Particles**: Efficient point rendering

### Memory Management
- **Proper disposal**: All geometries disposed on cleanup
- **No memory leaks**: Event listeners cleaned up
- **Efficient updates**: Only necessary properties animated

---

## 🌍 Zone-Specific Behaviors

### Agriculture Zone
- **Base color**: Dark green (#2d5016)
- **Responds to**: Crop supply percentage
- **Animation**: Growth/wilting based on supply
- **Color shift**: HSL saturation increases with supply
- **Brightness**: Correlates with crop health

### Health Zone
- **Base color**: Dark red (#4a1a1a)
- **Responds to**: Hospital load percentage
- **Animation**: Pulsing heartbeat effect
- **Pulse frequency**: Increases with load
- **Glow intensity**: Proportional to stress

### Industrial Zone
- **Base color**: Dark purple (#2a2a3e)
- **Responds to**: Environmental risk (AQI)
- **Animation**: Subtle glow changes
- **Emissive**: Increases with risk
- **Fog interaction**: Most affected by AQI

### Residential Zone
- **Base color**: Deep purple (#1e1e3f)
- **Responds to**: Overall risk level
- **Animation**: General lighting changes
- **Emissive**: Reflects average risk
- **Stability**: Most stable zone

---

## 💬 Chat Integration

### Scenario Flow
1. User enters query in chat: "What if a heatwave hits Delhi?"
2. Chat component parses scenario
3. API call triggered with scenario parameters
4. Response dispatches `scenario-updated` event
5. City environment listens and updates
6. All visualizations animate smoothly

### Example Scenarios
- **Heatwave**: AQI 400, Temp 45°C, Hospital Load 85%
- **Drought**: AQI 250, Temp 38°C, Crop Supply 20%
- **Crisis**: AQI 450, Temp 48°C, Hospital Load 95%
- **Normal**: AQI 100, Temp 25°C, Crop Supply 85%

---

## 🎮 User Interaction

### Mouse Movement
- Affects camera rotation
- Parallax effect on city
- Smooth, responsive
- No performance impact

### Scroll
- Doesn't affect city directly
- City remains visible behind UI
- Glassmorphism UI floats above

### Page Navigation
- City persists across pages
- No scene reset
- Smooth transitions
- State maintained

---

## 📱 Responsive Design

### Desktop
- Full 3D city visible
- Optimal camera angle
- All effects enabled
- 60 FPS target

### Tablet
- Scaled appropriately
- Touch-friendly
- Reduced particle count (optional)
- Maintained performance

### Mobile
- Responsive canvas sizing
- Optimized for smaller screens
- Reduced complexity (optional)
- Touch parallax disabled

---

## 🚀 Future Enhancements

1. **Advanced Interactions**
   - Click on buildings for details
   - Hover tooltips for zones
   - Drag to rotate city

2. **More Animations**
   - Traffic flow visualization
   - Population density waves
   - Supply chain animations

3. **Advanced Scenarios**
   - Flood visualization
   - Earthquake effects
   - Pandemic spread

4. **Performance**
   - Instanced rendering
   - WebGL 2.0 features
   - Worker threads for calculations

5. **Accessibility**
   - Reduced motion option
   - High contrast mode
   - Screen reader support

---

## ✅ Quality Checklist

✅ Real 3D geometry (not images/videos)
✅ Procedurally generated city
✅ Data-driven visual reactions
✅ Smooth animations (GSAP)
✅ Persistent across pages
✅ Responsive to scenarios
✅ Atmospheric lighting
✅ Zone-specific behaviors
✅ Performance optimized
✅ No UI blocking
✅ Cinematic feel
✅ Living, intelligent system

---

## 🎬 The Result

The city environment is a **living, intelligent urban organism** that:
- Responds to every data point
- Animates smoothly to scenarios
- Maintains atmosphere and mood
- Persists across the entire platform
- Feels cinematic and immersive
- Supports data-driven decision making

It's not a game, not a decoration—it's a **visual representation of urban systems responding to intelligence and intervention**.
