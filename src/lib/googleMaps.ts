// Google Maps Platform Official Configuration
export const GOOGLE_MAPS_API_KEY = 'AIzaSyCEwdJI9Yi6vjIZTRNJahY0-oaCgfjRu9k';

let loadPromise: Promise<any> | null = null;

export function loadGoogleMaps(): Promise<any> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Window is not defined'));
  }
  if ((window as any).google?.maps) {
    return Promise.resolve((window as any).google);
  }
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const checkInterval = setInterval(() => {
      if ((window as any).google?.maps) {
        clearInterval(checkInterval);
        resolve((window as any).google);
      }
    }, 100);

    const existing = document.getElementById('google-maps-sdk');
    if (!existing) {
      const script = document.createElement('script');
      script.id = 'google-maps-sdk';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&loading=async&libraries=places,geometry,marker&language=ar`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        clearInterval(checkInterval);
        resolve((window as any).google);
      };
      script.onerror = (err) => {
        clearInterval(checkInterval);
        console.error('Google Maps API failed to load:', err);
        reject(err);
      };
      document.head.appendChild(script);
    }

    // Safety timeout: 10 seconds
    setTimeout(() => {
      clearInterval(checkInterval);
      if ((window as any).google?.maps) {
        resolve((window as any).google);
      } else {
        reject(new Error('Google Maps load timeout'));
      }
    }, 10000);
  });

  return loadPromise;
}
