class StarMapApp {
  constructor() {
    console.log("Initializing StarMapApp");
    this.geolocation = new GeolocationService();
    this.starMap = new StarMap("starmap", STARS);
    this.setupEventListeners();
    this.updateAllDisplays();
    this.setupDualSliders();
  }

  setupEventListeners() {
    // Dual range sliders
    ["magnitude", "distance", "age", "mass"].forEach((type) => {
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

    // Geolocation button
    document.getElementById("get-location").addEventListener("click", () => {
      this.getLocation();
    });

    // Modal buttons
    document.getElementById("open-modal").addEventListener("click", () => {
      this.openModal();
    });

    document.getElementById("close-modal").addEventListener("click", () => {
      this.closeModal();
    });

    // Close modal on backdrop click
    document.getElementById("modal").addEventListener("click", (e) => {
      if (e.target === document.getElementById("modal")) {
        this.closeModal();
      }
    });

    // Close modal on Escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.closeModal();
      }
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

    // ZOOM CONTROLS - LÄGG TILL DESSA
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

  setupDualSliders() {
    // Initialize dual slider functionality
    ["magnitude", "distance", "age", "mass"].forEach((type) => {
      this.updateSliderBackground(type);
    });
  }

  handleDualSliderChange(type) {
    const minSlider = document.getElementById(`${type}-min`);
    const maxSlider = document.getElementById(`${type}-max`);

    let minVal = parseFloat(minSlider.value);
    let maxVal = parseFloat(maxSlider.value);

    // Ensure min is always less than or equal to max
    if (minVal > maxVal) {
      if (event.target === minSlider) {
        maxSlider.value = minVal;
        maxVal = minVal;
      } else {
        minSlider.value = maxVal;
        minVal = maxVal;
      }
    }

    this.updateSliderBackground(type);
    this.updateSliderDisplays(type);
  }

  updateSliderBackground(type) {
    const minSlider = document.getElementById(`${type}-min`);
    const maxSlider = document.getElementById(`${type}-max`);
    const container = minSlider.parentElement;

    const min = parseFloat(minSlider.min);
    const max = parseFloat(minSlider.max);
    const minVal = parseFloat(minSlider.value);
    const maxVal = parseFloat(maxSlider.value);

    const minPercent = ((minVal - min) / (max - min)) * 100;
    const maxPercent = ((maxVal - min) / (max - min)) * 100;

    // Update CSS custom properties
    container.style.setProperty("--range-left", `${minPercent}%`);
    container.style.setProperty("--range-width", `${maxPercent - minPercent}%`);
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
    }

    document.getElementById(`${type}-min-value`).textContent = minDisplay;
    document.getElementById(`${type}-max-value`).textContent = maxDisplay;
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

    this.starMap.setRangeFilters(
      magnitudeRange,
      distanceRange,
      ageRange,
      massRange
    );
  }

  updateAllDisplays() {
    ["magnitude", "distance", "age", "mass"].forEach((type) => {
      this.updateSliderDisplays(type);
      this.updateSliderBackground(type);
    });
  }

  resetFilters() {
    // Reset to default values
    document.getElementById("magnitude-min").value = -2;
    document.getElementById("magnitude-max").value = 4;
    document.getElementById("distance-min").value = 1;
    document.getElementById("distance-max").value = 1000;
    document.getElementById("age-min").value = 0;
    document.getElementById("age-max").value = 10;
    document.getElementById("mass-min").value = 0.1;
    document.getElementById("mass-max").value = 25;

    this.updateAllDisplays();
    this.updateFilters();
  }

  updateVisibleCount(visible, total) {
    document.getElementById(
      "visible-count"
    ).textContent = `Showing ${visible} of ${total} stars`;
  }

  // Modal functions
  openModal() {
    console.log("Opening modal");
    const modal = document.getElementById("modal");
    modal.showModal();
  }

  closeModal() {
    console.log("Closing modal");
    const modal = document.getElementById("modal");
    modal.close();
  }

  async getLocation() {
    const button = document.getElementById("get-location");
    const coordinates = document.getElementById("coordinates");

    button.textContent = "Getting location...";
    button.disabled = true;

    try {
      const position = await this.geolocation.getCurrentPosition();
      this.starMap.setLocation(position.latitude, position.longitude);

      coordinates.textContent = `Location: ${position.latitude.toFixed(
        4
      )}°N, ${position.longitude.toFixed(4)}°E`;
      button.textContent = "Location Updated";

      setTimeout(() => {
        button.textContent = "Get My Location";
        button.disabled = false;
      }, 2000);
    } catch (error) {
      console.error("Error getting location:", error);
      coordinates.textContent = `Error: ${error.message}`;
      button.textContent = "Try Again";
      button.disabled = false;
    }
  }

  showStarInfo(star) {
    const infoPanel = document.getElementById("star-info");
    const name = document.getElementById("star-name");
    const details = document.getElementById("star-details");

    name.textContent = star.name;
    details.innerHTML = `
      <strong>Constellation:</strong> ${star.constellation}<br>
      <strong>Magnitude:</strong> ${star.magnitude}<br>
      <strong>Distance:</strong> ${star.distance} light years<br>
      <strong>Age:</strong> ${star.age} billion years<br>
      <strong>Mass:</strong> ${star.mass} solar masses<br>
      <strong>Spectral Class:</strong> ${star.spectralClass}<br>
      <strong>Description:</strong> ${star.description}
    `;

    infoPanel.classList.remove("hidden");
  }

  hideStarInfo() {
    document.getElementById("star-info").classList.add("hidden");
    this.starMap.selectedStar = null;
    this.starMap.render();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM loaded, starting app");
  new StarMapApp();
});
