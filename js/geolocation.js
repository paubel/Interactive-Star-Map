class GeolocationService {
  constructor() {
    this.latitude = null;
    this.longitude = null;
    this.isLocationAvailable = false;
    this.options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000,
    };
  }

  async getCurrentPosition() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by this browser."));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.latitude = position.coords.latitude;
          this.longitude = position.coords.longitude;
          this.isLocationAvailable = true;
          resolve({
            latitude: this.latitude,
            longitude: this.longitude,
            accuracy: position.coords.accuracy,
          });
        },
        (error) => {
          let errorMessage = "Unknown error occurred.";
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "User denied the request for Geolocation.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Location information is unavailable.";
              break;
            case error.TIMEOUT:
              errorMessage = "The request to get user location timed out.";
              break;
          }
          reject(new Error(errorMessage));
        },
        this.options
      );
    });
  }

  getLocation() {
    return {
      latitude: this.latitude,
      longitude: this.longitude,
      isAvailable: this.isLocationAvailable,
    };
  }
}
