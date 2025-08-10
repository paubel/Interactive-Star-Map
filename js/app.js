class StarMapApp {
  constructor() {
    this.starMap = new StarMap("star-map", STARS);
    this.setupEventListeners();
    this.setupDualSliders();
    this.updateAllDisplays();
    this.updateFilters();
  }

  setupEventListeners() {
    // Dual range sliders
    [
      "magnitude",
      "distance",
      "age",
      "mass",
      "luminosity",
      "temperature",
    ].forEach((type) => {
      document.getElementById(`${type}-min`).addEventListener("input", () => {
        this.handleDualSliderChange(type);
        this.updateFilters();
      });
      document.getElementById(`${type}-max`).addEventListener("input", () => {
        this.handleDualSliderChange(type);
        this.updateFilters();
      });
    });

    // Reset filters button
    document.getElementById("reset-filters").addEventListener("click", () => {
      this.resetFilters();
    });

    // Location button
    document.getElementById("get-location").addEventListener("click", () => {
      this.getUserLocation();
    });

    // Show modal button
    document.getElementById("show-info").addEventListener("click", () => {
      this.showModal();
    });

    // Close modal button
    document.getElementById("close-modal").addEventListener("click", () => {
      this.closeModal();
    });

    // Star selection and filtering events
    document.addEventListener("starSelected", (e) => {
      this.showStarInfo(e.detail);
    });

    document.addEventListener("starsFiltered", (e) => {
      this.updateVisibleCount(e.detail.count, e.detail.total);
    });

    document.getElementById("close-info").addEventListener("click", () => {
      this.hideStarInfo();
    });

    // Zoom controls
    document.getElementById("zoom-in").addEventListener("click", () => {
      this.starMap.zoomIn();
    });

    document.getElementById("zoom-out").addEventListener("click", () => {
      this.starMap.zoomOut();
    });

    document.getElementById("zoom-reset").addEventListener("click", () => {
      this.starMap.resetZoom();
    });
  }

  // ✅ LÄGG TILL DESSA METODER LÄNGST NER I KLASSEN (efter hideStarInfo)
  showModal() {
    const modal = document.getElementById("modal");
    modal.showModal();
  }

  closeModal() {
    const modal = document.getElementById("modal");
    modal.close();
  }

  setupDualSliders() {
    // Initialize dual slider functionality
    [
      "magnitude",
      "distance",
      "age",
      "mass",
      "luminosity",
      "temperature",
    ].forEach((type) => {
      this.updateSliderBackground(type);
    });
  }

  handleDualSliderChange(type) {
    const minSlider = document.getElementById(`${type}-min`);
    const maxSlider = document.getElementById(`${type}-max`);

    let minVal = parseFloat(minSlider.value);
    let maxVal = parseFloat(maxSlider.value);

    // Ensure min is not greater than max
    if (minVal > maxVal) {
      if (minSlider === document.activeElement) {
        maxVal = minVal;
        maxSlider.value = maxVal;
      } else {
        minVal = maxVal;
        minSlider.value = minVal;
      }
    }

    this.updateSliderDisplays(type);
    this.updateSliderBackground(type);
  }

  updateSliderDisplays(type) {
    const minVal = parseFloat(document.getElementById(`${type}-min`).value);
    const maxVal = parseFloat(document.getElementById(`${type}-max`).value);

    let minDisplay, maxDisplay;

    switch (type) {
      case "magnitude":
        minDisplay = minVal.toFixed(1);
        maxDisplay = maxVal.toFixed(1);
        break;
      case "distance":
        minDisplay = Math.round(minVal);
        maxDisplay = Math.round(maxVal);
        break;
      case "age":
        minDisplay = minVal.toFixed(1);
        maxDisplay = maxVal.toFixed(1);
        break;
      case "mass":
        minDisplay = minVal.toFixed(1);
        maxDisplay = maxVal.toFixed(1);
        break;
      case "luminosity":
        if (minVal >= 1000) {
          minDisplay = (minVal / 1000).toFixed(0) + "k";
        } else {
          minDisplay = minVal.toFixed(1);
        }
        if (maxVal >= 1000) {
          maxDisplay = (maxVal / 1000).toFixed(0) + "k";
        } else {
          maxDisplay = maxVal.toFixed(1);
        }
        break;
      case "temperature":
        if (minVal >= 1000) {
          minDisplay = (minVal / 1000).toFixed(0) + "k";
        } else {
          minDisplay = Math.round(minVal);
        }
        if (maxVal >= 1000) {
          maxDisplay = (maxVal / 1000).toFixed(0) + "k";
        } else {
          maxDisplay = Math.round(maxVal);
        }
        break;
    }

    document.getElementById(`${type}-min-value`).textContent = minDisplay;
    document.getElementById(`${type}-max-value`).textContent = maxDisplay;
  }

  updateSliderBackground(type) {
    const minSlider = document.getElementById(`${type}-min`);
    const maxSlider = document.getElementById(`${type}-max`);
    const min = parseFloat(minSlider.min);
    const max = parseFloat(minSlider.max);
    const minVal = parseFloat(minSlider.value);
    const maxVal = parseFloat(maxSlider.value);

    const minPercent = ((minVal - min) / (max - min)) * 100;
    const maxPercent = ((maxVal - min) / (max - min)) * 100;

    const track = minSlider.parentElement;
    track.style.background = `linear-gradient(to right, 
            rgba(255, 255, 255, 0.1) 0%, 
            rgba(255, 255, 255, 0.1) ${minPercent}%, 
            rgba(135, 206, 235, 0.6) ${minPercent}%, 
            rgba(135, 206, 235, 0.6) ${maxPercent}%, 
            rgba(255, 255, 255, 0.1) ${maxPercent}%, 
            rgba(255, 255, 255, 0.1) 100%)`;
  }

  updateFilters() {
    const magnitudeRange = {
      min: parseFloat(document.getElementById("magnitude-min").value),
      max: parseFloat(document.getElementById("magnitude-max").value),
    };

    const distanceRange = {
      min: parseFloat(document.getElementById("distance-min").value),
      max: parseFloat(document.getElementById("distance-max").value),
    };

    const ageRange = {
      min: parseFloat(document.getElementById("age-min").value),
      max: parseFloat(document.getElementById("age-max").value),
    };

    const massRange = {
      min: parseFloat(document.getElementById("mass-min").value),
      max: parseFloat(document.getElementById("mass-max").value),
    };

    const luminosityRange = {
      min: parseFloat(document.getElementById("luminosity-min").value),
      max: parseFloat(document.getElementById("luminosity-max").value),
    };

    const temperatureRange = {
      min: parseFloat(document.getElementById("temperature-min").value),
      max: parseFloat(document.getElementById("temperature-max").value),
    };

    this.starMap.setRangeFilters(
      magnitudeRange,
      distanceRange,
      ageRange,
      massRange,
      luminosityRange,
      temperatureRange
    );
  }

  updateAllDisplays() {
    [
      "magnitude",
      "distance",
      "age",
      "mass",
      "luminosity",
      "temperature",
    ].forEach((type) => {
      this.updateSliderDisplays(type);
      this.updateSliderBackground(type);
    });
  }

  // Update resetFilters method:

  resetFilters() {
    // ✅ OPTIMIZED reset values based on actual data ranges
    document.getElementById("magnitude-min").value = -2;
    document.getElementById("magnitude-max").value = 4;
    document.getElementById("distance-min").value = 1;
    document.getElementById("distance-max").value = 3000;
    document.getElementById("age-min").value = 0;
    document.getElementById("age-max").value = 8;
    document.getElementById("mass-min").value = 0.5;
    document.getElementById("mass-max").value = 35;
    document.getElementById("luminosity-min").value = 0.1;
    document.getElementById("luminosity-max").value = 1000000;
    document.getElementById("temperature-min").value = 3000;
    document.getElementById("temperature-max").value = 45000;

    this.updateAllDisplays();
    this.updateFilters();
  }

  getUserLocation() {
    if (navigator.geolocation) {
      const button = document.getElementById("get-location");
      button.textContent = "📡 Getting location...";
      button.disabled = true;

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;

          this.starMap.setUserLocation(lat, lon);
          this.showLocationInfo(lat, lon);

          button.textContent = "📍 Location Updated";
          setTimeout(() => {
            button.textContent = "📍 Use My Location";
            button.disabled = false;
          }, 2000);
        },
        (error) => {
          console.error("Geolocation error:", error);
          button.textContent = "❌ Location Error";
          setTimeout(() => {
            button.textContent = "📍 Use My Location";
            button.disabled = false;
          }, 2000);
        }
      );
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  }

  showLocationInfo(lat, lon) {
    document.getElementById("user-lat").textContent = lat.toFixed(4);
    document.getElementById("user-lon").textContent = lon.toFixed(4);
    document.getElementById("location-info").classList.remove("hidden");
  }

  updateVisibleCount(visible, total) {
    document.getElementById("visible-count").textContent = visible;
    document.getElementById("total-count").textContent = total;
  }

  showStarInfo(star) {
    const infoElement = document.getElementById("star-info");
    const nameElement = document.getElementById("star-name");
    const detailsElement = document.getElementById("star-details");

    nameElement.textContent = star.name;
    detailsElement.innerHTML = `
            <strong>Constellation:</strong> ${star.constellation}<br>
            <strong>Spectral Class:</strong> ${star.spectralClass}<br>
            <strong>Magnitude:</strong> ${star.magnitude.toFixed(1)}<br>
            <strong>Distance:</strong> ${star.distance.toFixed(
              1
            )} light years<br>
            <strong>Age:</strong> ${star.age.toFixed(1)} billion years<br>
            <strong>Mass:</strong> ${star.mass.toFixed(1)} solar masses<br>
            <strong>Luminosity:</strong> ${star.luminosity.toFixed(1)} L☉<br>
            <strong>Temperature:</strong> ${star.temperature.toLocaleString()} K<br>
            <strong>Radius:</strong> ${star.radius.toFixed(
              1
            )} solar radii<br><br>
            ${star.description}
        `;

    infoElement.classList.remove("hidden");
  }

  hideStarInfo() {
    document.getElementById("star-info").classList.add("hidden");
  }
}

// Initialize the app when the page loads
document.addEventListener("DOMContentLoaded", () => {
  new StarMapApp();
});
