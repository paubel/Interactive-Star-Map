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

  celestialToCanvas(ra, dec) {
    const now = new Date();
    const lst = this.getLocalSiderealTime(now);
    const coords = this.equatorialToHorizontal(ra, dec, lst, this.latitude);
    const altitude = coords.altitude;
    const azimuthRad = (coords.azimuth * Math.PI) / 180;

    let radius;
    if (altitude >= 0) {
      radius = this.horizonRadius * (1 - altitude / 90);
    } else {
      radius = this.horizonRadius * (1 - altitude / 90);
    }

    const angle = azimuthRad - Math.PI / 2;
    const x = this.centerX + radius * Math.cos(angle);
    const y = this.centerY + radius * Math.sin(angle);

    return { x, y, altitude };
  }

  getLocalSiderealTime(date) {
    const J2000 = new Date("2000-01-01T12:00:00Z");
    const daysSinceJ2000 =
      (date.getTime() - J2000.getTime()) / (1000 * 60 * 60 * 24);

    const GST0 = (280.46061837 + 360.98564736629 * daysSinceJ2000) % 360;
    const hours =
      date.getUTCHours() +
      date.getUTCMinutes() / 60 +
      date.getUTCSeconds() / 3600;
    const GST = (GST0 + 15.04107 * hours) % 360;
    const LST = (GST + this.longitude) % 360;

    return LST;
  }

  equatorialToHorizontal(ra, dec, lst, latitude) {
    const hourAngle = (lst - ra + 360) % 360;
    const H = (hourAngle * Math.PI) / 180;
    const decRad = (dec * Math.PI) / 180;
    const latRad = (latitude * Math.PI) / 180;

    const sinAlt =
      Math.sin(decRad) * Math.sin(latRad) +
      Math.cos(decRad) * Math.cos(latRad) * Math.cos(H);
    const altitude = (Math.asin(sinAlt) * 180) / Math.PI;

    const cosAz =
      (Math.sin(decRad) - Math.sin(latRad) * sinAlt) /
      (Math.cos(latRad) * Math.cos(Math.asin(sinAlt)));
    let azimuth = (Math.acos(Math.max(-1, Math.min(1, cosAz))) * 180) / Math.PI;

    if (Math.sin(H) >= 0) {
      azimuth = 360 - azimuth;
    }

    return { altitude, azimuth };
  }

  getStarSize(magnitude) {
    return Math.max(1, 10 - magnitude * 3);
  }

  render() {
    this.drawSkyBackground();
    this.drawHorizonAndCompass();
    this.drawBackground();

    const visibleStars = this.getVisibleStars();

    visibleStars.forEach((star) => {
      const pos = this.celestialToCanvas(star.ra, star.dec);
      const distFromCenter = Math.sqrt(
        Math.pow(pos.x - this.centerX, 2) + Math.pow(pos.y - this.centerY, 2)
      );

      if (distFromCenter <= this.horizonRadius * 1.5 && pos.x > -500) {
        const alpha = pos.altitude < 0 ? 0.3 : 1.0;
        this.drawStar(star, pos.x, pos.y, alpha);
      }
    });

    if (this.selectedStar) {
      const pos = this.celestialToCanvas(
        this.selectedStar.ra,
        this.selectedStar.dec
      );
      if (pos.x > -500) {
        this.drawSelectionRing(pos.x, pos.y);
      }
    }

    const event = new CustomEvent("starsFiltered", {
      detail: { count: visibleStars.length, total: this.stars.length },
    });
    document.dispatchEvent(event);
  }

  drawSkyBackground() {
    const gradient = this.ctx.createRadialGradient(
      this.centerX,
      this.centerY,
      0,
      this.centerX,
      this.centerY,
      this.horizonRadius
    );
    gradient.addColorStop(0, "#001133");
    gradient.addColorStop(0.7, "#000822");
    gradient.addColorStop(1, "#000511");

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawHorizonAndCompass() {
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

    this.ctx.fillStyle = "#cccccc";
    this.ctx.font = "16px Arial";
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";

    const compassOffset = 20;

    this.ctx.fillText(
      "N",
      this.centerX,
      this.centerY - this.horizonRadius - compassOffset
    );
    this.ctx.fillText(
      "S",
      this.centerX,
      this.centerY + this.horizonRadius + compassOffset
    );
    this.ctx.fillText(
      "E",
      this.centerX + this.horizonRadius + compassOffset,
      this.centerY
    );
    this.ctx.fillText(
      "W",
      this.centerX - this.horizonRadius - compassOffset,
      this.centerY
    );

    this.ctx.strokeStyle = "#666666";
    this.ctx.lineWidth = 1;

    this.ctx.beginPath();
    this.ctx.moveTo(this.centerX, this.centerY - this.horizonRadius);
    this.ctx.lineTo(this.centerX, this.centerY + this.horizonRadius);
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.moveTo(this.centerX - this.horizonRadius, this.centerY);
    this.ctx.lineTo(this.centerX + this.horizonRadius, this.centerY);
    this.ctx.stroke();

    this.ctx.strokeStyle = "#333333";
    this.ctx.lineWidth = 1;

    this.ctx.beginPath();
    this.ctx.arc(
      this.centerX,
      this.centerY,
      this.horizonRadius * 0.33,
      0,
      2 * Math.PI
    );
    this.ctx.stroke();

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

    let color = "#ffffff";
    if (star.spectralClass.startsWith("M")) color = "#ffaa77";
    else if (star.spectralClass.startsWith("K")) color = "#ffcc88";
    else if (star.spectralClass.startsWith("G")) color = "#ffff88";
    else if (star.spectralClass.startsWith("F")) color = "#ffffff";
    else if (star.spectralClass.startsWith("A")) color = "#aaccff";
    else if (star.spectralClass.startsWith("B")) color = "#88aaff";

    const alphaHex = Math.round(alpha * 255)
      .toString(16)
      .padStart(2, "0");

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

    this.ctx.fillStyle = color + alphaHex;
    this.ctx.beginPath();
    this.ctx.arc(x, y, size, 0, 2 * Math.PI);
    this.ctx.fill();

    // Förbättrad text-rendering
    this.ctx.save();

    const fontSize = window.innerWidth <= 768 ? "12px" : "10px";
    this.ctx.font = `${fontSize} Arial`;
    this.ctx.textAlign = "left";
    this.ctx.textBaseline = "middle";

    this.ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
    this.ctx.shadowBlur = 3;
    this.ctx.shadowOffsetX = 1;
    this.ctx.shadowOffsetY = 1;

    if (star.magnitude <= 2.5 || this.selectedStar === star) {
      this.ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(alpha * 0.9, 0.9)})`;
      this.ctx.fillText(star.name, x + size + 6, y);
    }

    this.ctx.restore();

    star.canvasX = x;
    star.canvasY = y;
    star.radius = Math.max(glowSize, 12);
  }

  drawSelectionRing(x, y) {
    this.ctx.strokeStyle = "#ffd700";
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.arc(x, y, 25, 0, 2 * Math.PI);
    this.ctx.stroke();

    this.ctx.strokeStyle = "rgba(255, 215, 0, 0.5)";
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.arc(x, y, 35, 0, 2 * Math.PI);
    this.ctx.stroke();
  }

  setupEventListeners() {
    // Desktop click
    this.canvas.addEventListener("click", (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      this.handleStarSelection(clickX, clickY);
    });

    // Touch events
    this.canvas.addEventListener("touchstart", (e) => {
      e.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      const touch = e.touches[0];
      const touchX = touch.clientX - rect.left;
      const touchY = touch.clientY - rect.top;
      this.handleStarSelection(touchX, touchY);
    });

    this.canvas.addEventListener("touchend", (e) => {
      e.preventDefault();
    });

    // Mouse hover (desktop only)
    this.canvas.addEventListener("mousemove", (e) => {
      if (window.innerWidth <= 768) return;

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

  handleStarSelection(x, y) {
    const distFromCenter = Math.sqrt(
      Math.pow(x - this.centerX, 2) + Math.pow(y - this.centerY, 2)
    );

    if (distFromCenter > this.horizonRadius * 1.5) return;

    const visibleStars = this.getVisibleStars();

    for (let star of visibleStars) {
      if (star.canvasX && star.canvasY) {
        const distance = Math.sqrt(
          Math.pow(x - star.canvasX, 2) + Math.pow(y - star.canvasY, 2)
        );

        const hitRadius =
          window.innerWidth <= 768 ? star.radius + 8 : star.radius;

        if (distance <= hitRadius) {
          this.selectStar(star);
          return;
        }
      }
    }
  }

  selectStar(star) {
    this.selectedStar = star;
    this.render();

    const event = new CustomEvent("starSelected", { detail: star });
    document.dispatchEvent(event);
  }
}
