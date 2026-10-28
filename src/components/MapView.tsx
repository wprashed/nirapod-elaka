"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ReportItem } from "@/lib/types";
import { CATEGORY_META } from "@/lib/constants";
import { useI18n } from "@/lib/i18n";
import { formatTimestamp, isStale } from "@/lib/constants";
import { StatusBadge } from "./StatusBadge";
import { MapPin, Navigation, Compass, Layers, AlertCircle } from "lucide-react";

interface MapViewProps {
  reports?: ReportItem[];
  selectedReportId?: string;
  onSelectReport?: (report: ReportItem) => void;
  center?: [number, number];
  zoom?: number;
  selectableLocation?: boolean;
  selectedLocation?: [number, number] | null;
  onLocationSelect?: (lat: number, lng: number) => void;
  height?: string;
  showNeighborhoodJumps?: boolean;
}

// Popular Dhaka landmarks / neighborhoods for quick navigation
const DHAKA_AREAS = [
  { nameBn: "ধানমন্ডি", nameEn: "Dhanmondi", lat: 23.7533, lng: 90.3768 },
  { nameBn: "মিরপুর", nameEn: "Mirpur", lat: 23.8055, lng: 90.3685 },
  { nameBn: "গুলশান", nameEn: "Gulshan", lat: 23.7925, lng: 90.4162 },
  { nameBn: "উত্তরা", nameEn: "Uttara", lat: 23.8685, lng: 90.3990 },
  { nameBn: "ফার্মগেট", nameEn: "Farmgate", lat: 23.7570, lng: 90.3890 },
  { nameBn: "মালিবাগ", nameEn: "Malibagh", lat: 23.7485, lng: 90.4132 },
  { nameBn: "পুরান ঢাকা", nameEn: "Old Dhaka", lat: 23.7104, lng: 90.4074 },
];

export function MapView({
  reports = [],
  selectedReportId,
  onSelectReport,
  center = [23.8103, 90.4125],
  zoom = 12,
  selectableLocation = false,
  selectedLocation,
  onLocationSelect,
  height = "520px",
  showNeighborhoodJumps = true,
}: MapViewProps) {
  const { locale, t } = useI18n();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const pinMarkerRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Initialize Leaflet map instance on client
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (typeof window === "undefined" || !mapContainerRef.current) return;
      if (mapInstanceRef.current) return;

      const L = (await import("leaflet")).default;

      if (!isMounted || !mapContainerRef.current) return;

      const map = L.map(mapContainerRef.current, {
        center: center,
        zoom: zoom,
        zoomControl: false,
      });

      // Accessible zoom control in top-right
      L.control.zoom({ position: "topright" }).addTo(map);

      // OpenStreetMap attribution tile layer
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      markersLayerRef.current = markersGroup;
      mapInstanceRef.current = map;

      // Handle map click for pin dropping if selectable
      if (selectableLocation && onLocationSelect) {
        map.on("click", (e: any) => {
          const { lat, lng } = e.latlng;
          onLocationSelect(lat, lng);
        });
      }

      setMapReady(true);
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update report markers whenever reports or map ready changes
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !markersLayerRef.current) return;

    async function renderMarkers() {
      const L = (await import("leaflet")).default;
      const layer = markersLayerRef.current;
      layer.clearLayers();

      reports.forEach((rep) => {
        const meta = CATEGORY_META[rep.category] || CATEGORY_META.other;
        const stale = isStale(rep.lastConfirmedAt ? new Date(rep.lastConfirmedAt) : null, rep.createdAt);

        // Custom accessible DivIcon: category emoji icon + color border + stale styling
        const markerHtml = `
          <div class="custom-hazard-marker ${stale ? "opacity-75 grayscale-30" : ""}" style="background-color: white; border-color: ${meta.markerColor}; width: 34px; height: 34px;">
            <span style="font-size: 16px;" role="img" aria-label="${meta.labelEn}">${meta.icon}</span>
          </div>
        `;

        const icon = L.divIcon({
          html: markerHtml,
          className: "nirapod-marker",
          iconSize: [34, 34],
          iconAnchor: [17, 17],
          popupAnchor: [0, -18],
        });

        const marker = L.marker([rep.latitude, rep.longitude], { icon });

        // Popup content
        const timeInfo = formatTimestamp(rep.createdAt);
        const popupHtml = `
          <div class="p-2 min-w-[220px] max-w-[280px] font-sans">
            <div class="flex items-center gap-1.5 mb-1.5">
              <span class="text-base">${meta.icon}</span>
              <span class="text-xs font-bold text-gray-800 uppercase tracking-wide">
                ${locale === "bn" ? meta.labelBn : meta.labelEn}
              </span>
            </div>
            <h4 class="font-bold text-sm text-gray-900 mb-1 leading-snug">${rep.title}</h4>
            ${
              rep.publicLocationDesc
                ? `<p class="text-xs text-gray-600 mb-2 flex items-center gap-1"><span class="text-teal-600 font-semibold">📍</span> ${rep.publicLocationDesc}</p>`
                : ""
            }
            <div class="text-[11px] text-gray-500 mb-2">
              <span>${timeInfo.relative}</span>
              ${stale ? `<span class="block text-amber-700 font-medium">⚠️ ${locale === "bn" ? "পুরোনো তথ্য" : "Outdated"}</span>` : ""}
            </div>
            <a href="/report/${rep.id}" class="inline-block w-full text-center py-1.5 px-3 bg-teal-600 hover:bg-teal-700 text-white rounded text-xs font-semibold no-underline">
              ${locale === "bn" ? "বিস্তারিত দেখুন" : "View Details"}
            </a>
          </div>
        `;

        marker.bindPopup(popupHtml);

        marker.on("click", () => {
          if (onSelectReport) {
            onSelectReport(rep);
          }
        });

        marker.addTo(layer);

        if (selectedReportId && rep.id === selectedReportId) {
          marker.openPopup();
          mapInstanceRef.current.setView([rep.latitude, rep.longitude], 15, { animate: true });
        }
      });
    }

    renderMarkers();
  }, [reports, mapReady, selectedReportId, locale]);

  // Update selected pin in report form
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return;

    async function updatePin() {
      const L = (await import("leaflet")).default;
      const map = mapInstanceRef.current;

      if (pinMarkerRef.current) {
        map.removeLayer(pinMarkerRef.current);
        pinMarkerRef.current = null;
      }

      if (selectedLocation) {
        const pinHtml = `
          <div class="w-9 h-9 rounded-full bg-teal-600 border-3 border-white shadow-xl flex items-center justify-center text-white pulse-pin">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
          </div>
        `;

        const pinIcon = L.divIcon({
          html: pinHtml,
          className: "selected-pin",
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        });

        const pinMarker = L.marker(selectedLocation, { icon: pinIcon }).addTo(map);
        pinMarkerRef.current = pinMarker;
        map.panTo(selectedLocation);
      }
    }

    updatePin();
  }, [selectedLocation, mapReady]);

  // Handle GPS location request with explicit user feedback
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGpsError(locale === "bn" ? "আপনার ডিভাইসে জিপিএস সমর্থিত নয়।" : "Geolocation is not supported by your browser.");
      return;
    }

    setGpsLoading(true);
    setGpsError(null);

    const onLocationSuccess = (pos: GeolocationPosition) => {
      setGpsLoading(false);
      const { latitude, longitude } = pos.coords;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setView([latitude, longitude], 15, { animate: true });
      }
      if (onLocationSelect) {
        onLocationSelect(latitude, longitude);
      }
    };

    navigator.geolocation.getCurrentPosition(
      onLocationSuccess,
      (err) => {
        // Fallback retry with low accuracy on timeout (Audit Item 35)
        if (err.code === err.TIMEOUT) {
          navigator.geolocation.getCurrentPosition(
            onLocationSuccess,
            () => {
              setGpsLoading(false);
              setGpsError(
                locale === "bn"
                  ? "জিপিএস সময় শেষ হয়েছে। দয়া করে মানচিত্রে সরাসরি স্থান নির্বাচন করুন।"
                  : "GPS location timed out. Please select location directly on the map."
              );
            },
            { enableHighAccuracy: false, timeout: 12000, maximumAge: 60000 }
          );
          return;
        }

        setGpsLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGpsError(
            locale === "bn"
              ? "অবস্থান অ্যাক্সেসের অনুমতি দেওয়া হয়নি। ম্যানুয়ালি মানচিত্রে পিন ফেলুন।"
              : "Location permission denied. Please select location manually on the map."
          );
        } else {
          setGpsError(
            locale === "bn"
              ? "অবস্থান পাওয়া যায়নি। আবার চেষ্টা করুন।"
              : "Could not determine location. Please try again or select manually."
          );
        }
      },
      { enableHighAccuracy: true, timeout: 7000, maximumAge: 30000 }
    );
  };

  const jumpToArea = (lat: number, lng: number) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([lat, lng], 14, { animate: true });
    }
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-gray-50">
      {/* Dhaka neighborhood quick jumps */}
      {showNeighborhoodJumps && (
        <div className="bg-white/90 backdrop-blur-xs border-b border-gray-200 px-3 py-2 flex items-center gap-1.5 overflow-x-auto text-xs z-10 relative scrollbar-none">
          <span className="font-semibold text-gray-600 shrink-0 flex items-center gap-1 mr-1">
            <Compass className="w-3.5 h-3.5 text-teal-600" />
            {locale === "bn" ? "এলাকা:" : "Area:"}
          </span>
          {DHAKA_AREAS.map((area) => (
            <button
              key={area.nameEn}
              type="button"
              onClick={() => jumpToArea(area.lat, area.lng)}
              className="px-2.5 py-1 rounded-full bg-gray-100 hover:bg-teal-50 hover:text-teal-700 text-gray-700 font-medium whitespace-nowrap transition border border-gray-200"
            >
              {locale === "bn" ? area.nameBn : area.nameEn}
            </button>
          ))}
        </div>
      )}

      {/* Map container */}
      <div ref={mapContainerRef} style={{ height, width: "100%" }} className="z-0" />

      {/* Controls Overlay: GPS locate button */}
      <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2">
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={gpsLoading}
          aria-label={locale === "bn" ? "আমার বর্তমান অবস্থান ব্যবহার করুন" : "Use my current location"}
          className="p-3 bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-800 rounded-xl shadow-md border border-gray-200 flex items-center justify-center transition focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50"
        >
          <Navigation className={`w-5 h-5 text-teal-600 ${gpsLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Selectable location instructional tooltip banner */}
      {selectableLocation && (
        <div className="absolute top-12 left-4 right-4 sm:left-auto sm:right-4 z-10 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-teal-500/40 shadow-lg text-xs text-gray-800 flex items-center gap-2 max-w-sm">
          <MapPin className="w-4 h-4 text-teal-600 shrink-0" />
          <span>
            {selectedLocation
              ? locale === "bn"
                ? `পিন বসানো হয়েছে: ${selectedLocation[0].toFixed(4)}, ${selectedLocation[1].toFixed(4)}`
                : `Pin dropped: ${selectedLocation[0].toFixed(4)}, ${selectedLocation[1].toFixed(4)}`
              : locale === "bn"
              ? "সঠিক স্থান চিহ্নিত করতে মানচিত্রের উপর ক্লিক করুন।"
              : "Click anywhere on the map to drop the hazard location pin."}
          </span>
        </div>
      )}

      {/* GPS Error notification */}
      {gpsError && (
        <div className="absolute bottom-16 left-4 right-4 sm:max-w-md z-10 bg-amber-50 border border-amber-300 text-amber-900 px-3 py-2 rounded-xl text-xs flex items-center gap-2 shadow-md">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
          <span>{gpsError}</span>
        </div>
      )}
    </div>
  );
}
