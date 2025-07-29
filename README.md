# Star Map Filter

An interactive web-based star map that allows users to explore and filter stars based on various astronomical properties. Users can visualize stars in real-time, apply filters, and get detailed information about individual stars.

![Star Map Filter Screenshot](screenshot.png)

## Features

### 🌟 Interactive Star Map

- **Real-time sky visualization** based on your location and current time
- **Zoom controls** - zoom in/out and reset view
- **Pan functionality** - drag to explore different areas of the sky
- **Responsive design** - works on desktop, tablet, and mobile devices

### 🔍 Advanced Filtering

Filter stars by multiple criteria:

- **Brightness (Magnitude)**: -2.0 to 6.0 - from very bright to dim stars
- **Distance**: 1 to 3000 light years - from nearby to distant stars
- **Age**: 0 to 15 billion years - from young to ancient stars
- **Mass**: 0.1 to 50 solar masses - from lightweight to massive stars

### 📍 Location-Based Viewing

- **Automatic location detection** using browser geolocation
- **Manual location input** for any coordinates
- **Real-time sky updates** based on your location and time

### ⭐ Star Information

- **Click any star** to view detailed information
- **Star properties**: constellation, spectral class, distance, age, mass
- **Educational descriptions** for each star

### 📱 Mobile-Friendly

- **Touch controls** optimized for mobile devices
- **Responsive layout** adapts to all screen sizes
- **Large touch targets** for easy star selection on mobile

## Live Demo

Visit the live application: [Star Map Filter](https://your-domain.com)

## Technologies Used

- **HTML5 Canvas** - for high-performance star rendering
- **Vanilla JavaScript** - no external frameworks
- **CSS3** - modern responsive design with CSS Grid and Flexbox
- **Geolocation API** - for automatic location detection
- **Astronomical calculations** - real-time celestial coordinate transformations

## Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/paubel/Interactive-Star-Map.git
   cd Interactive-Star-Map/starmap-app
   ```

2. **Serve the files**

   Using Python (recommended):

   ```bash
   # Python 3
   python -m http.server 8000

   # Python 2
   python -m SimpleHTTPServer 8000
   ```

   Using Node.js:

   ```bash
   npx serve src
   ```

   Using Live Server (VS Code extension):

   - Install Live Server extension
   - Right-click on `src/index.html`
   - Select "Open with Live Server"

3. **Open in browser**
   ```
   http://localhost:8000
   ```

## Project Structure

```
starmap-app/
├── src/
│   ├── index.html          # Main HTML file
│   ├── css/
│   │   └── styles.css      # All styling and responsive design
│   ├── js/
│   │   ├── app.js          # Main application logic and event handlers
│   │   ├── starmap.js      # StarMap class - canvas rendering and astronomy
│   │   ├── stardata.js     # Star database with 100+ stars
│   │   └── geolocation.js  # Location detection and coordinate handling
│   └── star_map_favicon.ico
├── README.md
└── screenshot.png
```

## Usage

### Basic Navigation

1. **View the sky** - The map shows stars visible from your location
2. **Zoom** - Use the +/- buttons or mouse wheel to zoom in/out
3. **Pan** - Click and drag to move around the sky
4. **Reset** - Click the home button to reset zoom and position

### Filtering Stars

1. **Adjust sliders** - Use the dual-range sliders to filter stars
2. **Real-time updates** - The map updates immediately as you change filters
3. **Reset filters** - Click "Reset All Filters" to show all stars
4. **View count** - See how many stars match your current filters

### Star Information

1. **Click any star** - Tap or click to select a star
2. **View details** - See constellation, distance, age, mass, and description
3. **Close info** - Click the × to close the information panel

### Location Settings

1. **Auto-detect** - Click "Get My Location" for automatic detection
2. **Manual input** - Enter coordinates manually if needed
3. **Privacy** - Location is only used locally, never stored or transmitted

## Star Database

The application includes detailed data for 100+ notable stars including:

- **Bright stars**: Sirius, Canopus, Arcturus, Vega, Capella
- **Famous stars**: Polaris (North Star), Betelgeuse, Rigel, Antares
- **Star systems**: Alpha Centauri, Castor, Algol
- **Navigation stars**: Used historically for celestial navigation

Each star includes:

- Accurate celestial coordinates (RA/Dec)
- Visual magnitude (brightness)
- Distance in light years
- Estimated age and mass
- Spectral classification
- Constellation membership
- Educational description

## Browser Support

- **Chrome/Edge**: Full support
- **Firefox**: Full support
- **Safari**: Full support
- **Mobile browsers**: Optimized for iOS Safari and Chrome Android

**Requirements**: Modern browser with Canvas and Geolocation API support

## Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Ideas for Contributions

- Add more stars to the database
- Implement constellation line drawing
- Add planet positions
- Create different sky themes
- Add deep space objects (nebulae, galaxies)
- Implement time controls (show sky at different times)

## Astronomy Details

### Coordinate System

- Uses **equatorial coordinates** (Right Ascension/Declination)
- Converts to **horizontal coordinates** (Altitude/Azimuth) for display
- Calculates **Local Sidereal Time** for accurate star positions
- Accounts for **observer location** and **current time**

### Star Properties

- **Magnitude**: Apparent brightness as seen from Earth
- **Distance**: Measured in light years using parallax and other methods
- **Age**: Stellar age estimates based on stellar evolution models
- **Mass**: Solar masses (☉) - how many times heavier than our Sun
- **Spectral Class**: Star temperature and composition (O, B, A, F, G, K, M)

## Version History

- **v0.91** (Current)

  - Improved mobile responsiveness
  - Enhanced touch controls
  - Better star selection on mobile
  - Responsive canvas sizing

- **v0.9**
  - Added zoom and pan functionality
  - Implemented dual-range filter sliders
  - Added star information panels
  - Mobile-optimized interface

## License

This project is open source and available under the [MIT License](LICENSE).

## Contact

**Paul Belfrage**

- GitHub: [@paubel](https://github.com/paubel)
- Project Link: [https://github.com/paubel/Interactive-Star-Map](https://github.com/paubel/Interactive-Star-Map)

## Acknowledgments

- Star data compiled from various astronomical catalogs
- Astronomical calculations based on standard celestial mechanics
- Inspired by traditional star charts and modern planetarium software
- Special thanks to the open-source astronomy community

---

**Explore the cosmos from your browser! 🌌**
