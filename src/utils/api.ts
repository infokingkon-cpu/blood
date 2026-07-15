// Detect the current API Base URL.
// In local development or full-stack environments, relative path "/api" works.
// When deployed on platforms like Netlify/Vercel (static hosts), you can set VITE_API_BASE_URL
// in the platform's Environment Variables (e.g. VITE_API_BASE_URL="https://your-backend-app.run.app")
export const getApiUrl = (path: string): string => {
  let baseUrl = import.meta.env.VITE_API_BASE_URL || "";
  
  // Smart Fallback: If we are running in the browser:
  // - On localhost/127.0.0.1 (local dev)
  // - On Cloud Run containers (*.run.app) or AI Studio preview frames
  // We want to use relative paths ("") so that requests are routed to the SAME container
  // that serves the app. This prevents "Failed to fetch" (CORS/connection errors)
  // when accessing the dev container while VITE_API_BASE_URL points to the pre/shared container.
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (
      hostname === "localhost" || 
      hostname.includes("127.0.0.1") || 
      hostname.includes(".run.app") || 
      hostname.includes("aistudio")
    ) {
      baseUrl = "";
    }
  }

  // Ensure we don't have double slashes if path starts with "/"
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
};
