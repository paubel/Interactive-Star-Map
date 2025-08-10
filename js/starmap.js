class StarMap {
  constructor(canvasId, stars) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext("2d");
    this.stars = stars;

    // View state
    this.offsetX = 0;
    this.offsetY = 0;
    this.scale = 1;
    this.isDragging = false;
    this.lastMouseX = 0;
    this.lastMouseY = 0;

    // User location (default to somewhere reasonable)
    this.userLat = 59.334; // Stockholm som default
    this.userLon = 18.063;

    // Initialize range filters
    // ✅ OPTIMIZED range filters based on actual data
    this.magnitudeRange = { min: -2.0, max: 4.0 }; // -1.46 to 3.58 + buffer
    this.distanceRange = { min: 0, max: 3000 }; // 4.4 to 2600 + buffer
    this.ageRange = { min: 0, max: 8.0 }; // 0.004 to 7.1 + buffer
    this.massRange = { min: 0.5, max: 35.0 }; // 0.863 to 33 + buffer
    this.luminosityRange = { min: 0.1, max: 1000000 }; // 0.5002 to 813000 + buffer
    this.temperatureRange = { min: 3000, max: 45000 }; // 3200 to 42000 + buffer

    this.setupCanvas();
    this.setupEventListeners();
    this.render();
  }

  setupCanvas() {
    // Make canvas responsive
    this.resizeCanvas();
    window.addEventListener("resize", () => this.resizeCanvas());
  }

  resizeCanvas() {
    const container = this.canvas.parentElement;
    const rect = container.getBoundingClientRect();

    this.canvas.width = rect.width;
    this.canvas.height = rect.height;

    this.render();
  }

  setupEventListeners() {
    // Mouse events
    this.canvas.addEventListener("mousedown", (e) => this.handleMouseDown(e));
    this.canvas.addEventListener("mousemove", (e) => this.handleMouseMove(e));
    this.canvas.addEventListener("mouseup", () => this.handleMouseUp());
    this.canvas.addEventListener("mouseleave", () => this.handleMouseUp());
    this.canvas.addEventListener("wheel", (e) => this.handleWheel(e));
    this.canvas.addEventListener("click", (e) => this.handleClick(e));

    // Touch events for mobile - ✅ FIX: Add event parameter
    this.canvas.addEventListener("touchstart", (e) => this.handleTouchStart(e));
    this.canvas.addEventListener("touchmove", (e) => this.handleTouchMove(e));
    this.canvas.addEventListener("touchend", (e) => this.handleTouchEnd(e));
  }

  handleMouseDown(e) {
    this.isDragging = true;
    this.lastMouseX = e.offsetX;
    this.lastMouseY = e.offsetY;
    this.canvas.style.cursor = "grabbing";
  }

  handleMouseMove(e) {
    if (this.isDragging) {
      const deltaX = e.offsetX - this.lastMouseX;
      const deltaY = e.offsetY - this.lastMouseY;

      this.offsetX += deltaX;
      this.offsetY += deltaY;

      this.lastMouseX = e.offsetX;
      this.lastMouseY = e.offsetY;

      this.render();
    }
  }

  handleMouseUp() {
    this.isDragging = false;
    this.canvas.style.cursor = "grab";
  }

  handleWheel(e) {
    e.preventDefault();

    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.1, Math.min(5, this.scale * zoomFactor));

    if (newScale !== this.scale) {
      // Zoom towards mouse position
      this.offsetX = mouseX - (mouseX - this.offsetX) * (newScale / this.scale);
      this.offsetY = mouseY - (mouseY - this.offsetY) * (newScale / this.scale);
      this.scale = newScale;
      this.render();
    }
  }

  handleClick(e) {
    if (this.isDragging) return;

    const rect = this.canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const clickedStar = this.getStarAtPosition(clickX, clickY);
    if (clickedStar) {
      this.selectStar(clickedStar);
    }
  }

  // Touch event handlers
  handleTouchStart(e) {
    e.preventDefault();
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const rect = this.canvas.getBoundingClientRect();
      this.handleMouseDown({
        offsetX: touch.clientX - rect.left,
        offsetY: touch.clientY - rect.top,
      });
    }
  }

  handleTouchMove(e) {
    e.preventDefault();
    if (e.touches.length === 1 && this.isDragging) {
      const touch = e.touches[0];
      const rect = this.canvas.getBoundingClientRect();
      this.handleMouseMove({
        offsetX: touch.clientX - rect.left,
        offsetY: touch.clientY - rect.top,
      });
    }
  }

  // ✅ FIX: Add event parameter and null check
  handleTouchEnd(e) {
    if (e) {
      e.preventDefault();
    }
    this.handleMouseUp();
  }

  // Konvertera RA/Dec till altitude/azimuth baserat på användarens position
  getHorizontalCoordinates(ra, dec) {
    if (!this.userLat || !this.userLon) {
      // Bättre fallback - använd en representativ fördelning
      const altitude = Math.max(0, 90 * Math.random());
      const azimuth = 360 * Math.random();
      return { altitude, azimuth };
    }

    const now = new Date();
    const julianDay = this.getJulianDay(now);
    const lst = this.getLocalSiderealTime(julianDay, this.userLon);

    // ✅ VIKTIGT: Konvertera RA från grader till timmar
    const raHours = ra / 15; // RA är i grader i databasen, konvertera till timmar
    const hourAngle = lst - raHours;

    const latRad = (this.userLat * Math.PI) / 180;
    const decRad = (dec * Math.PI) / 180;
    const haRad = (hourAngle * 15 * Math.PI) / 180; // Konvertera tillbaka till grader för beräkning

    // Beräkna altitude
    const sinAlt =
      Math.sin(decRad) * Math.sin(latRad) +
      Math.cos(decRad) * Math.cos(latRad) * Math.cos(haRad);
    const altitude =
      (Math.asin(Math.max(-1, Math.min(1, sinAlt))) * 180) / Math.PI;

    // Beräkna azimuth
    const cosAltitude = Math.cos((altitude * Math.PI) / 180);
    let azimuth = 0;

    if (Math.abs(cosAltitude) > 0.001) {
      const cosA =
        (Math.sin(decRad) -
          Math.sin(latRad) * Math.sin((altitude * Math.PI) / 180)) /
        (Math.cos(latRad) * cosAltitude);
      azimuth = (Math.acos(Math.max(-1, Math.min(1, cosA))) * 180) / Math.PI;

      if (Math.sin(haRad) > 0) {
        azimuth = 360 - azimuth;
      }
    }

    return { altitude, azimuth };
  }

  getJulianDay(date) {
    return date.getTime() / 86400000 + 2440587.5;
  }

  getLocalSiderealTime(julianDay, longitude) {
    const t = (julianDay - 2451545.0) / 36525;
    let theta =
      280.46061837 +
      360.98564736629 * (julianDay - 2451545) +
      0.000387933 * t * t -
      (t * t * t) / 38710000;
    theta = theta % 360;
    if (theta < 0) theta += 360;
    return (theta + longitude) / 15; // Konvertera till timmar
  }

  // ✅ UPPDATERAD getScreenPosition med spegling
  getScreenPosition(star) {
    const coords = this.getHorizontalCoordinates(star.ra, star.dec);

    // Visa bara stjärnor över horisonten
    if (coords.altitude < 0) {
      return { x: -1000, y: -1000, visible: false };
    }

    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const radius = Math.min(centerX, centerY) * 0.85; // Lite mindre för att få plats med etiketter

    // Stereografisk projektion - korrekt formel
    const zenithAngle = ((90 - coords.altitude) * Math.PI) / 180;

    // ✅ FLIPPA AZIMUTH så att West är till höger och East till vänster
    // I astronomiska koordinater: 0° = Nord, 90° = Öst, 180° = Syd, 270° = Väst
    // Men vi vill spegla så azimuth blir negativt för korrekt orientering
    const azimuthRad = (-coords.azimuth * Math.PI) / 180; // MINUS-tecken lägger till speglingen

    // Projektion
    let r;
    if (coords.altitude > 89.9) {
      r = 0; // Stjärna i zenit
    } else {
      r = radius * Math.tan(zenithAngle / 2) * this.scale;
    }

    const x = centerX + r * Math.sin(azimuthRad) + this.offsetX;
    const y = centerY - r * Math.cos(azimuthRad) + this.offsetY;

    return { x, y, visible: true };
  }

  getStarAtPosition(x, y) {
    const visibleStars = this.getVisibleStars();

    for (const star of visibleStars) {
      const screenPos = this.getScreenPosition(star);
      if (!screenPos.visible) continue;

      const size = this.getStarSize(star.magnitude);
      const distance = Math.sqrt(
        (x - screenPos.x) ** 2 + (y - screenPos.y) ** 2
      );

      if (distance <= size + 5) {
        return star;
      }
    }
    return null;
  }

  selectStar(star) {
    // Dispatch custom event
    const event = new CustomEvent("starSelected", { detail: star });
    document.dispatchEvent(event);
  }

  getStarSize(magnitude) {
    // Brighter stars (lower magnitude) are larger
    return Math.max(2, 8 - magnitude * 1.5) * this.scale;
  }

  getStarColor(spectralClass, temperature) {
    // Simplified color mapping based on temperature
    if (temperature > 30000) return "#9bb0ff"; // Blue
    if (temperature > 10000) return "#aabfff"; // Blue-white
    if (temperature > 7500) return "#cad7ff"; // White
    if (temperature > 6000) return "#f8f7ff"; // Yellow-white
    if (temperature > 5200) return "#fff4ea"; // Yellow
    if (temperature > 3700) return "#ffcc6f"; // Orange
    return "#ffcc6f"; // Red
  }

  setRangeFilters(magnitude, distance, age, mass, luminosity, temperature) {
    this.magnitudeRange = magnitude;
    this.distanceRange = distance;
    this.ageRange = age;
    this.massRange = mass;
    this.luminosityRange = luminosity;
    this.temperatureRange = temperature;
    this.render();
  }

  getVisibleStars() {
    const filtered = this.stars.filter(
      (star) =>
        star.magnitude >= this.magnitudeRange.min &&
        star.magnitude <= this.magnitudeRange.max &&
        star.distance >= this.distanceRange.min &&
        star.distance <= this.distanceRange.max &&
        star.age >= this.ageRange.min &&
        star.age <= this.ageRange.max &&
        star.mass >= this.massRange.min &&
        star.mass <= this.massRange.max &&
        star.luminosity >= this.luminosityRange.min &&
        star.luminosity <= this.luminosityRange.max &&
        star.temperature >= this.temperatureRange.min &&
        star.temperature <= this.temperatureRange.max
    );

    // Dispatch filtered event
    const event = new CustomEvent("starsFiltered", {
      detail: { count: filtered.length, total: this.stars.length },
    });
    document.dispatchEvent(event);

    return filtered;
  }

  setUserLocation(lat, lon) {
    this.userLat = lat;
    this.userLon = lon;
    this.render();
  }

  zoomIn() {
    this.scale = Math.min(5, this.scale * 1.2);
    this.render();
  }

  zoomOut() {
    this.scale = Math.max(0.1, this.scale * 0.8);
    this.render();
  }

  resetZoom() {
    this.scale = 1;
    this.offsetX = 0;
    this.offsetY = 0;
    this.render();
  }

  render() {
    const ctx = this.ctx;

    // Clear canvas med mörk bakgrund
    ctx.fillStyle = "#000011";
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Rita cirklar för höjdvinkel
    this.renderAltitudeCircles();

    // Rita kompassriktningar
    this.renderCompassDirections();

    // Get visible stars
    const visibleStars = this.getVisibleStars();

    // Render stars (inga konstellation-linjer)
    visibleStars.forEach((star) => this.renderStar(star));
  }

  renderAltitudeCircles() {
    const ctx = this.ctx;
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const maxRadius = Math.min(centerX, centerY) * 0.85;

    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.lineWidth = 1;

    // Rita cirklar för 30° och 60° höjdvinkel
    for (let alt = 30; alt <= 60; alt += 30) {
      const zenithAngle = ((90 - alt) * Math.PI) / 180;
      const radius = maxRadius * Math.tan(zenithAngle / 2) * this.scale;

      if (radius > 0 && radius < maxRadius * 2) {
        ctx.beginPath();
        ctx.arc(
          centerX + this.offsetX,
          centerY + this.offsetY,
          radius,
          0,
          Math.PI * 2
        );
        ctx.stroke();
      }
    }

    // Rita horisont-cirkeln (90°)
    ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(
      centerX + this.offsetX,
      centerY + this.offsetY,
      maxRadius * this.scale,
      0,
      Math.PI * 2
    );
    ctx.stroke();
  }

  // ✅ UPPDATERAD renderCompassDirections med spegling
  renderCompassDirections() {
    const ctx = this.ctx;
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const radius = Math.min(centerX, centerY) * 0.85 * this.scale;

    ctx.fillStyle = "#87ceeb";
    ctx.font = "bold 18px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // ✅ KORRIGERAD ordning efter spegling: N→W→S→E (medurs efter spegling)
    const directions = [
      { label: "N", angle: 0 },
      { label: "E", angle: 90 }, // W ska nu vara till höger
      { label: "S", angle: 180 },
      { label: "W", angle: 270 }, // E ska nu vara till vänster
    ];

    directions.forEach(({ label, angle }) => {
      // ✅ SAMMA SPEGLING HÄR - minus-tecken för att matcha stjärnpositionerna
      const angleRad = (-angle * Math.PI) / 180;
      const x = centerX + this.offsetX + radius * Math.sin(angleRad);
      const y = centerY + this.offsetY - radius * Math.cos(angleRad);

      // Kontrollera att etiketten är inom synligt område
      if (
        x > 15 &&
        x < this.canvas.width - 15 &&
        y > 15 &&
        y < this.canvas.height - 15
      ) {
        // Rita bakgrund för bättre läsbarhet
        ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
        ctx.beginPath();
        ctx.arc(x, y, 15, 0, Math.PI * 2);
        ctx.fill();

        // Rita text
        ctx.fillStyle = "#87ceeb";
        ctx.fillText(label, x, y);
      }
    });
  }

  renderStar(star) {
    const ctx = this.ctx;
    const pos = this.getScreenPosition(star);

    // Skip if star is not visible or outside canvas
    if (
      !pos.visible ||
      pos.x < -50 ||
      pos.x > this.canvas.width + 50 ||
      pos.y < -50 ||
      pos.y > this.canvas.height + 50
    ) {
      return;
    }

    const size = this.getStarSize(star.magnitude);
    const color = this.getStarColor(star.spectralClass, star.temperature);

    // Draw star glow
    const gradient = ctx.createRadialGradient(
      pos.x,
      pos.y,
      0,
      pos.x,
      pos.y,
      size * 2
    );
    gradient.addColorStop(0, color);
    gradient.addColorStop(0.5, color + "80");
    gradient.addColorStop(1, "transparent");

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, size * 2, 0, Math.PI * 2);
    ctx.fill();

    // Draw star core
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, size, 0, Math.PI * 2);
    ctx.fill();

    // ✅ LÄGG TILLBAKA STJÄRNNAMN
    // Visa namn för ljusa stjärnor (magnitude < 2.5) och när zoomad in
    if (star.magnitude < 2.5 || this.scale > 1.5) {
      ctx.fillStyle = "#ffffff";
      ctx.font = `${Math.max(10, 12 * this.scale)}px Arial`;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";

      // Placera text lite till höger om stjärnan
      const textX = pos.x + size + 8;
      const textY = pos.y;

      // Rita bakgrund för bättre läsbarhet
      const textWidth = ctx.measureText(star.name).width;
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.fillRect(textX - 2, textY - 8, textWidth + 4, 16);

      // Rita stjärnnamnet
      ctx.fillStyle = "#ffffff";
      ctx.fillText(star.name, textX, textY);
    }
  }
}
