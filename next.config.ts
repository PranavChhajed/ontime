import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Development only: lets a phone on the same Wi-Fi use the dev server.
  // Without this Next blocks the phone's address and the page loads but does
  // not respond to taps. Only private network ranges are listed.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.*.*.*"],
};

export default nextConfig;
