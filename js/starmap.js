class StarMap {
  constructor(canvasId, stars) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext("2d");
    this.stars = stars;

    // Initialize range filters
    this.magnitudeRange = { min: -2.0, max: 6.0 };
    this.distanceRange = { min: 0, max: 3000 };
    this.ageRange = { min: 0, max: 15.0 };
    this.massRange = { min: 0.1, max: 50.0 };

    this.latitude = 59.3293; // Default to Stockholm
    this.longitude = 18.0686;
    this.selectedStar = null;

    // Sky dome parameters
    this.centerX = this.canvas.width / 2;
    this.centerY = this.canvas.height / 2;
    this.horizonRadius =
      Math.min(this.canvas.width, this.canvas.height) / 2 - 30;

    this.setupEventListeners();
    this.render();
  }

  setLocation(latitude, longitude) {
    this.latitude = latitude;
    this.longitude = longitude;
    this.render();
  }

  setRangeFilters(magnitude, distance, age, mass) {
    this.magnitudeRange = magnitude;
    this.distanceRange = distance;
    this.ageRange = age;
    this.massRange = mass;
    this.render();
  }

  getVisibleStars() {
    return this.stars.filter(
      (star) =>
        star.magnitude >= this.magnitudeRange.min &&
        star.magnitude <= this.magnitudeRange.max &&
        star.distance >= this.distanceRange.min &&
        star.distance <= this.distanceRange.max &&
        star.age >= this.ageRange.min &&
        star.age <= this.ageRange.max &&
        star.mass >= this.massRange.min &&
        star.mass <= this.massRange.max
    );
  }

  // Convert celestial coordinates to realistic azimuth/elevation projection
  celestialToCanvas(ra, dec) {
    // Get current time for proper star positions
    const now = new Date();
    const lst = this.getLocalSiderealTime(now);

    // Convert RA/Dec to Alt/Az coordinates based on observer location and time
    const coords = this.equatorialToHorizontal(ra, dec, lst, this.latitude);

    // Store altitude for alpha calculation
    const altitude = coords.altitude;

    // Convert to canvas coordinates regardless of altitude (for below-horizon rendering)
    // Azimuth: 0° = North, 90° = East, 180° = South, 270° = West
    const azimuthRad = (coords.azimuth * Math.PI) / 180;

    // Project altitude to radius (90° = center, 0° = horizon, negative = below horizon)
    let radius;
    if (altitude >= 0) {
      radius = this.horizonRadius * (1 - altitude / 90);
    } else {
      // For stars below horizon, extend beyond the horizon circle
      radius = this.horizonRadius * (1 - altitude / 90);
    }

    // Azimuth to angle (rotate so North is up)
    const angle = azimuthRad - Math.PI / 2; // Rotate 90° so North is up

    const x = this.centerX + radius * Math.cos(angle);
    const y = this.centerY + radius * Math.sin(angle);

    return { x, y, altitude };
  }

  // Calculate Local Sidereal Time
  getLocalSiderealTime(date) {
    const J2000 = new Date("2000-01-01T12:00:00Z");
    const daysSinceJ2000 =
      (date.getTime() - J2000.getTime()) / (1000 * 60 * 60 * 24);

    // Greenwich Sidereal Time at 0h UT
    const GST0 = (280.46061837 + 360.98564736629 * daysSinceJ2000) % 360;

    // Current Greenwich Sidereal Time
    const hours =
      date.getUTCHours() +
      date.getUTCMinutes() / 60 +
      date.getUTCSeconds() / 3600;
    const GST = (GST0 + 15.04107 * hours) % 360;

    // Local Sidereal Time
    const LST = (GST + this.longitude) % 360;

    return LST;
  }

  // Convert Equatorial coordinates (RA/Dec) to Horizontal coordinates (Alt/Az)
  equatorialToHorizontal(ra, dec, lst, latitude) {
    // Hour Angle
    const hourAngle = (lst - ra + 360) % 360;
    const H = (hourAngle * Math.PI) / 180;
    const decRad = (dec * Math.PI) / 180;
    const latRad = (latitude * Math.PI) / 180;

    // Calculate altitude
    const sinAlt =
      Math.sin(decRad) * Math.sin(latRad) +
      Math.cos(decRad) * Math.cos(latRad) * Math.cos(H);
    const altitude = (Math.asin(sinAlt) * 180) / Math.PI;

    // Calculate azimuth
    const cosAz =
      (Math.sin(decRad) - Math.sin(latRad) * sinAlt) /
      (Math.cos(latRad) * Math.cos(Math.asin(sinAlt)));
    let azimuth = (Math.acos(Math.max(-1, Math.min(1, cosAz))) * 180) / Math.PI;

    // Adjust azimuth based on hour angle
    if (Math.sin(H) >= 0) {
      azimuth = 360 - azimuth;
    }

    return { altitude, azimuth };
  }

  getStarSize(magnitude) {
    // More dramatic size differences
    return Math.max(1, 10 - magnitude * 3);
  }

  render() {
    console.log("Rendering with filters:", {
      magnitude: this.magnitudeRange,
      distance: this.distanceRange,
      age: this.ageRange,
      mass: this.massRange,
    });

    // Clear canvas with dark sky gradient
    this.drawSkyBackground();

    // Draw horizon circle and compass
    this.drawHorizonAndCompass();

    // Add background stars
    this.drawBackground();

    // Filter stars by all criteria
    const visibleStars = this.getVisibleStars();

    console.log(`Showing ${visibleStars.length} stars with current filters`);

    // Draw each visible star
    visibleStars.forEach((star) => {
      const pos = this.celestialToCanvas(star.ra, star.dec);

      // Only draw stars within reasonable distance from center
      const distFromCenter = Math.sqrt(
        Math.pow(pos.x - this.centerX, 2) + Math.pow(pos.y - this.centerY, 2)
      );

      if (distFromCenter <= this.horizonRadius * 1.5 && pos.x > -500) {
        // Calculate alpha based on altitude
        const alpha = pos.altitude < 0 ? 0.3 : 1.0;
        this.drawStar(star, pos.x, pos.y, alpha);
      }
    });

    // Highlight selected star
    if (this.selectedStar) {
      const pos = this.celestialToCanvas(
        this.selectedStar.ra,
        this.selectedStar.dec
      );
      if (pos.x > -500) {
        this.drawSelectionRing(pos.x, pos.y);
      }
    }

    // Update visible count
    const event = new CustomEvent("starsFiltered", {
      detail: { count: visibleStars.length, total: this.stars.length },
    });
    document.dispatchEvent(event);
  }

  drawSkyBackground() {
    // Create radial gradient from center (zenith) to edge (horizon)
    const gradient = this.ctx.createRadialGradient(
      this.centerX,
      this.centerY,
      0,
      this.centerX,
      this.centerY,
      this.horizonRadius
    );
    gradient.addColorStop(0, "#001133"); // Dark blue at zenith
    gradient.addColorStop(0.7, "#000822"); // Darker towards horizon
    gradient.addColorStop(1, "#000511"); // Very dark at horizon

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawHorizonAndCompass() {
    // Draw horizon circle
    this.ctx.strokeStyle = "#444444";
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.arc(
      this.centerX,
      this.centerY,
      this.horizonRadius,
      0,
      2 * Math.PI
    );
    this.ctx.stroke();

    // Draw compass directions
    this.ctx.fillStyle = "#cccccc";
    this.ctx.font = "16px Arial";
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";

    const compassOffset = 20;

    // North (top)
    this.ctx.fillText(
      "N",
      this.centerX,
      this.centerY - this.horizonRadius - compassOffset
    );

    // South (bottom)
    this.ctx.fillText(
      "S",
      this.centerX,
      this.centerY + this.horizonRadius + compassOffset
    );

    // East (right)
    this.ctx.fillText(
      "E",
      this.centerX + this.horizonRadius + compassOffset,
      this.centerY
    );

    // West (left)
    this.ctx.fillText(
      "W",
      this.centerX - this.horizonRadius - compassOffset,
      this.centerY
    );

    // Draw cardinal direction lines
    this.ctx.strokeStyle = "#666666";
    this.ctx.lineWidth = 1;

    // North-South line
    this.ctx.beginPath();
    this.ctx.moveTo(this.centerX, this.centerY - this.horizonRadius);
    this.ctx.lineTo(this.centerX, this.centerY + this.horizonRadius);
    this.ctx.stroke();

    // East-West line
    this.ctx.beginPath();
    this.ctx.moveTo(this.centerX - this.horizonRadius, this.centerY);
    this.ctx.lineTo(this.centerX + this.horizonRadius, this.centerY);
    this.ctx.stroke();

    // Draw elevation circles (30°, 60°)
    this.ctx.strokeStyle = "#333333";
    this.ctx.lineWidth = 1;

    // 60° elevation (30° from zenith)
    this.ctx.beginPath();
    this.ctx.arc(
      this.centerX,
      this.centerY,
      this.horizonRadius * 0.33,
      0,
      2 * Math.PI
    );
    this.ctx.stroke();

    // 30° elevation (60° from zenith)
    this.ctx.beginPath();
    this.ctx.arc(
      this.centerX,
      this.centerY,
      this.horizonRadius * 0.67,
      0,
      2 * Math.PI
    );
    this.ctx.stroke();
  }

  drawBackground() {
    // Add random background stars within horizon circle
    this.ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
    for (let i = 0; i < 200; i++) {
      const angle = Math.random() * 2 * Math.PI;
      const radius = Math.random() * this.horizonRadius;
      const x = this.centerX + radius * Math.cos(angle);
      const y = this.centerY + radius * Math.sin(angle);
      const size = Math.random() * 0.5 + 0.2;

      this.ctx.beginPath();
      this.ctx.arc(x, y, size, 0, 2 * Math.PI);
      this.ctx.fill();
    }
  }

  drawStar(star, x, y, alpha = 1.0) {
    const size = this.getStarSize(star.magnitude);

    // Star color based on spectral class
    let color = "#ffffff";
    if (star.spectralClass.startsWith("M")) color = "#ffaa77"; // Red
    else if (star.spectralClass.startsWith("K")) color = "#ffcc88"; // Orange
    else if (star.spectralClass.startsWith("G")) color = "#ffff88"; // Yellow
    else if (star.spectralClass.startsWith("F")) color = "#ffffff"; // White
    else if (star.spectralClass.startsWith("A"))
      color = "#aaccff"; // Blue-white
    else if (star.spectralClass.startsWith("B")) color = "#88aaff"; // Blue

    // Apply alpha for stars below horizon
    const alphaHex = Math.round(alpha * 255)
      .toString(16)
      .padStart(2, "0");

    // Draw star glow effect
    const glowSize = size * 2;
    const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, glowSize);
    gradient.addColorStop(0, color + alphaHex);
    gradient.addColorStop(
      0.5,
      color +
        Math.round(alpha * 128)
          .toString(16)
          .padStart(2, "0")
    );
    gradient.addColorStop(1, "transparent");

    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(x, y, glowSize, 0, 2 * Math.PI);
    this.ctx.fill();

    // Draw bright star core
    this.ctx.fillStyle = color + alphaHex;
    this.ctx.beginPath();
    this.ctx.arc(x, y, size, 0, 2 * Math.PI);
    this.ctx.fill();

    // Draw star name with appropriate alpha
    this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    this.ctx.font = "10px Arial";
    this.ctx.textAlign = "left";
    this.ctx.textBaseline = "middle";
    this.ctx.fillText(star.name, x + size + 5, y);

    // Store position for click detection
    star.canvasX = x;
    star.canvasY = y;
    star.radius = glowSize;
  }

  drawSelectionRing(x, y) {
    this.ctx.strokeStyle = "#ffd700";
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.arc(x, y, 25, 0, 2 * Math.PI);
    this.ctx.stroke();

    // Add pulsing effect
    this.ctx.strokeStyle = "rgba(255, 215, 0, 0.5)";
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.arc(x, y, 35, 0, 2 * Math.PI);
    this.ctx.stroke();
  }

  setupEventListeners() {
    this.canvas.addEventListener("click", (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      // Allow clicks within a larger area to include below-horizon stars
      const distFromCenter = Math.sqrt(
        Math.pow(clickX - this.centerX, 2) + Math.pow(clickY - this.centerY, 2)
      );

      if (distFromCenter > this.horizonRadius * 1.5) return;

      // Find clicked star from currently visible stars
      const visibleStars = this.getVisibleStars();

      for (let star of visibleStars) {
        if (star.canvasX && star.canvasY) {
          const distance = Math.sqrt(
            Math.pow(clickX - star.canvasX, 2) +
              Math.pow(clickY - star.canvasY, 2)
          );

          if (distance <= star.radius) {
            this.selectStar(star);
            break;
          }
        }
      }
    });

    // Add hover effect
    this.canvas.addEventListener("mousemove", (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      let overStar = false;
      const visibleStars = this.getVisibleStars();

      for (let star of visibleStars) {
        if (star.canvasX && star.canvasY) {
          const distance = Math.sqrt(
            Math.pow(mouseX - star.canvasX, 2) +
              Math.pow(mouseY - star.canvasY, 2)
          );

          if (distance <= star.radius) {
            overStar = true;
            break;
          }
        }
      }

      this.canvas.style.cursor = overStar ? "pointer" : "crosshair";
    });
  }

  selectStar(star) {
    console.log("Selected star:", star.name);
    this.selectedStar = star;
    this.render();

    // Trigger star info display
    const event = new CustomEvent("starSelected", { detail: star });
    document.dispatchEvent(event);
  }
}
