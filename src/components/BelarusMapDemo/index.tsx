"use client";

import { geoMercator, geoPath } from "d3-geo";
import type { FeatureCollection, Geometry, LineString } from "geojson";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";

import belarusAdm0Json from "@/data/belarus-adm0.json";
import belarusAdm2Json from "@/data/belarus-adm2.json";
import districtRoutesJson from "@/data/belarus-district-routes.json";

const VIEWBOX_WIDTH = 1000;
const VIEWBOX_HEIGHT = 700;
const MAP_CENTER = { x: VIEWBOX_WIDTH / 2, y: VIEWBOX_HEIGHT / 2 };

type DistrictProperties = {
  shapeName?: string;
  shapeID?: string;
};

type CityDefinition = {
  id: string;
  name: string;
  longitude: number;
  latitude: number;
  labelDx: number;
  labelDy: number;
  anchor?: "start" | "end";
};

type ProjectedCity = CityDefinition & {
  x: number;
  y: number;
};

type Point = { x: number; y: number };

type DestinationRecord = {
  id: string;
  sourceName: string;
  name: string;
  latitude: number;
  longitude: number;
  kind: "regional" | "district";
  admin1Code: string;
  distance: number;
  duration: number;
  coordinates: Array<[number, number]>;
};

type DestinationDataset = {
  destinations: DestinationRecord[];
};

type ProjectedRoute = Omit<DestinationRecord, "coordinates" | "distance" | "duration"> & {
  path: string;
  distanceKm: number;
  etaHours: number;
  x: number;
  y: number;
};

type CargoDefinition = {
  name: string;
  code: string;
};

type FleetTrip = {
  truckId: number;
  status: "waiting" | "driving" | "arrived";
  routeIndex: number | null;
  cargoIndex: number;
  cycle: number;
  duration: number;
  startedAt: number;
  arrivesAt: number;
  availableAt: number;
  isManual: boolean;
};

type DispatchRequest = {
  id: number;
  routeIndex: number;
  cargoIndex: number;
};

type FleetSystem = {
  trucks: FleetTrip[];
  queue: DispatchRequest[];
  nextAutoAt: number;
  routeCursor: number;
};

type DisplayTrip = {
  truckId: number;
  route: ProjectedRoute;
  cargo: CargoDefinition;
  status?: "driving" | "arrived";
  isManual?: boolean;
};

const cities: CityDefinition[] = [
  { id: "minsk", name: "Минск", longitude: 27.56653, latitude: 53.90019, labelDx: 14, labelDy: -13 },
  { id: "brest", name: "Брест", longitude: 23.71749, latitude: 52.10894, labelDx: 14, labelDy: -12 },
  { id: "grodno", name: "Гродно", longitude: 23.82887, latitude: 53.6758, labelDx: -14, labelDy: -12, anchor: "end" },
  { id: "vitebsk", name: "Витебск", longitude: 30.2049, latitude: 55.1904, labelDx: 14, labelDy: -12 },
  { id: "mogilev", name: "Могилёв", longitude: 30.34044, latitude: 53.90876, labelDx: 14, labelDy: -12 },
  { id: "gomel", name: "Гомель", longitude: 30.9754, latitude: 52.4345, labelDx: 14, labelDy: 19 },
  { id: "baranovichi", name: "Барановичи", longitude: 26.00775, latitude: 53.13255, labelDx: -14, labelDy: 20, anchor: "end" },
  { id: "bobruisk", name: "Бобруйск", longitude: 29.20548, latitude: 53.14676, labelDx: 14, labelDy: 20 },
];

const cargoCatalog: CargoDefinition[] = [
  { name: "Мясная продукция", code: "М" },
  { name: "Питьевая вода", code: "В" },
  { name: "Пиво и напитки", code: "П" },
  { name: "Бакалея", code: "Б" },
  { name: "Замороженная продукция", code: "❄" },
  { name: "Молочная продукция", code: "М" },
  { name: "Кондитерские изделия", code: "К" },
  { name: "Соусы и консервация", code: "С" },
];

const cargoAccents = [
  "#b95c4d",
  "#4f8fa6",
  "#bd7a37",
  "#718c69",
  "#6289ad",
  "#a79775",
  "#936878",
  "#a85f43",
];

const regionalCityIds = new Set(["minsk", "brest", "grodno", "vitebsk", "mogilev", "gomel"]);
const districtRoutes = districtRoutesJson as unknown as DestinationDataset;

function rewindForD3(
  collection: FeatureCollection<Geometry, DistrictProperties>,
): FeatureCollection<Geometry, DistrictProperties> {
  return {
    ...collection,
    features: collection.features.map((feature) => {
      const { geometry } = feature;

      if (geometry.type === "Polygon") {
        return {
          ...feature,
          geometry: {
            ...geometry,
            coordinates: geometry.coordinates.map((ring) => [...ring].reverse()),
          },
        };
      }

      if (geometry.type === "MultiPolygon") {
        return {
          ...feature,
          geometry: {
            ...geometry,
            coordinates: geometry.coordinates.map((polygon) =>
              polygon.map((ring) => [...ring].reverse()),
            ),
          },
        };
      }

      return feature;
    }),
  };
}

// geoBoundaries follows RFC 7946 winding; d3-geo uses the opposite spherical winding.
const adm0 = rewindForD3(
  belarusAdm0Json as unknown as FeatureCollection<Geometry, DistrictProperties>,
);
const adm2 = rewindForD3(
  belarusAdm2Json as unknown as FeatureCollection<Geometry, DistrictProperties>,
);

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function shuffledIndexes(length: number, initialSeed: number) {
  const indexes = Array.from({ length }, (_, index) => index);
  let seed = initialSeed >>> 0;
  for (let index = indexes.length - 1; index > 0; index -= 1) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const swapIndex = seed % (index + 1);
    [indexes[index], indexes[swapIndex]] = [indexes[swapIndex], indexes[index]];
  }
  return indexes;
}

function tripDuration(distanceKm: number) {
  return clamp(14 + distanceKm / 28, 15, 27);
}

function nextAutomaticRoute(routeCount: number, cursor: number) {
  const cycle = Math.floor(cursor / routeCount);
  const order = shuffledIndexes(routeCount, 20260722 + cycle * 7919);
  return order[cursor % routeCount] ?? 0;
}

function nextDepartureDelay(routeIndex: number, cursor: number) {
  return 3200 + ((routeIndex * 9283 + cursor * 4513) % 4100);
}

export default function BelarusMapDemo() {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const [parallax, setParallax] = useState<Point>({ x: 0, y: 0 });
  const [cursor, setCursor] = useState<Point>(MAP_CENTER);
  const [hoveredCity, setHoveredCity] = useState<ProjectedCity | null>(null);
  const [selectedCity, setSelectedCity] = useState<ProjectedCity | null>(null);
  const [hoveredDistrict, setHoveredDistrict] = useState<string | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [hoveredRoute, setHoveredRoute] = useState<ProjectedRoute | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<ProjectedRoute | null>(null);
  const [hoveredTrip, setHoveredTrip] = useState<DisplayTrip | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<DisplayTrip | null>(null);
  const [fleetSystem, setFleetSystem] = useState<FleetSystem>(() => ({
    trucks: Array.from({ length: 8 }, (_, truckId) => ({
      truckId,
      status: "waiting",
      routeIndex: null,
      cargoIndex: 0,
      cycle: 0,
      duration: 0,
      startedAt: 0,
      arrivesAt: 0,
      availableAt: 0,
      isManual: false,
    })),
    queue: [],
    nextAutoAt: 0,
    routeCursor: 0,
  }));
  const [dispatchFeedback, setDispatchFeedback] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const canvasRef = useRef<SVGSVGElement | null>(null);
  const truckRefs = useRef(new Map<number, SVGGElement>());
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    panX: number;
    panY: number;
  } | null>(null);

  const mapData = useMemo(() => {
    const projection = geoMercator().fitExtent(
      [[125, 62], [875, 638]],
      adm0,
    );
    const path = geoPath(projection);

    const districts = adm2.features.map((feature, index) => ({
      id: String(feature.properties?.shapeID ?? index),
      name: feature.properties?.shapeName ?? "Район",
      path: path(feature) ?? "",
    }));

    const projectedCities = cities.flatMap((city) => {
      const point = projection([city.longitude, city.latitude]);
      if (!point) return [];
      return [{ ...city, x: point[0], y: point[1] }];
    });

    const projectedRoutes = districtRoutes.destinations.flatMap((destination) => {
      const point = projection([destination.longitude, destination.latitude]);
      if (!point) return [];

      const geometry: LineString = {
        type: "LineString",
        coordinates: destination.coordinates,
      };

      return [{
        id: destination.id,
        sourceName: destination.sourceName,
        name: destination.name,
        latitude: destination.latitude,
        longitude: destination.longitude,
        kind: destination.kind,
        admin1Code: destination.admin1Code,
        path: path(geometry) ?? "",
        distanceKm: Math.round(destination.distance / 1000),
        etaHours: Math.round((destination.duration / 3600) * 10) / 10,
        x: point[0],
        y: point[1],
      }];
    });

    return {
      countryPath: path(adm0) ?? "",
      districts,
      cities: projectedCities,
      routes: projectedRoutes,
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      const direction = event.deltaY > 0 ? -0.14 : 0.14;
      setZoom((currentZoom) => clamp(currentZoom + direction, 0.82, 2.35));
      setSelectedCity(null);
    };

    canvas.addEventListener("wheel", handleWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", handleWheel);
  }, []);

  useEffect(() => {
    if (!mapData.routes.length) return;

    const interval = window.setInterval(() => {
      const currentTime = Date.now();
      setFleetSystem((currentSystem) => {
        let hasChanges = false;
        let trucks = currentSystem.trucks.map((truck) => {
          if (truck.status === "driving" && currentTime >= truck.arrivesAt) {
            hasChanges = true;
            return {
              ...truck,
              status: "arrived" as const,
              availableAt: currentTime + 1800,
            };
          }

          if (truck.status === "arrived" && currentTime >= truck.availableAt) {
            hasChanges = true;
            return {
              ...truck,
              status: "waiting" as const,
              routeIndex: null,
              startedAt: 0,
              arrivesAt: 0,
              availableAt: 0,
              isManual: false,
            };
          }

          return truck;
        });

        let queue = currentSystem.queue;
        let routeCursor = currentSystem.routeCursor;
        let nextAutoAt = currentSystem.nextAutoAt;

        if (nextAutoAt === 0) {
          nextAutoAt = currentTime + 1100;
          hasChanges = true;
        }

        const waitingTruckIndex = trucks.findIndex((truck) => truck.status === "waiting");
        if (waitingTruckIndex >= 0 && queue.length && currentTime >= nextAutoAt) {
          const request = queue[0];
          const route = mapData.routes[request.routeIndex];
          const duration = tripDuration(route.distanceKm);
          trucks = trucks.map((truck, index) => index === waitingTruckIndex ? {
            ...truck,
            status: "driving" as const,
            routeIndex: request.routeIndex,
            cargoIndex: request.cargoIndex,
            cycle: truck.cycle + 1,
            duration,
            startedAt: currentTime,
            arrivesAt: currentTime + duration * 1000,
            availableAt: 0,
            isManual: true,
          } : truck);
          queue = queue.slice(1);
          nextAutoAt = currentTime + 1800;
          hasChanges = true;
        } else if (waitingTruckIndex >= 0 && currentTime >= nextAutoAt) {
          const routeIndex = nextAutomaticRoute(mapData.routes.length, routeCursor);
          const route = mapData.routes[routeIndex];
          const duration = tripDuration(route.distanceKm);
          const cargoIndex = (routeIndex + routeCursor * 3) % 3;
          trucks = trucks.map((truck, index) => index === waitingTruckIndex ? {
            ...truck,
            status: "driving" as const,
            routeIndex,
            cargoIndex,
            cycle: truck.cycle + 1,
            duration,
            startedAt: currentTime,
            arrivesAt: currentTime + duration * 1000,
            availableAt: 0,
            isManual: false,
          } : truck);
          routeCursor += 1;
          nextAutoAt = currentTime + nextDepartureDelay(routeIndex, routeCursor);
          hasChanges = true;
        }

        if (!hasChanges) return currentSystem;
        return { trucks, queue, nextAutoAt, routeCursor };
      });
    }, 250);

    return () => window.clearInterval(interval);
  }, [mapData.routes]);

  useEffect(() => {
    const visibleTrucks = fleetSystem.trucks.filter((truck) => truck.status !== "waiting" && truck.routeIndex !== null);
    if (!visibleTrucks.length || !canvasRef.current) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const animatedTrips = visibleTrucks.flatMap((trip) => {
      if (trip.routeIndex === null) return [];
      const route = mapData.routes[trip.routeIndex];
      const truck = truckRefs.current.get(trip.truckId);
      const road = canvasRef.current?.querySelector<SVGPathElement>(`#route-${route?.id}`);
      if (!route || !truck || !road) return [];

      return [{
        trip,
        truck,
        road,
        length: road.getTotalLength(),
      }];
    });

    let animationFrame = 0;
    const animate = () => {
      for (const item of animatedTrips) {
        const durationMs = item.trip.duration * 1000;
        const progress = item.trip.status === "arrived"
          ? 1
          : reducedMotion
            ? 0.55
            : clamp((Date.now() - item.trip.startedAt) / durationMs, 0, 1);
        const point = item.road.getPointAtLength(item.length * progress);
        const tangentDistance = Math.min(8, item.length * 0.012);
        const before = item.road.getPointAtLength(Math.max(0, item.length * progress - tangentDistance));
        const after = item.road.getPointAtLength(Math.min(item.length, item.length * progress + tangentDistance));
        const targetAngle = Math.atan2(after.y - before.y, after.x - before.x) * (180 / Math.PI);
        const previousAngle = Number(item.truck.dataset.angle ?? targetAngle);
        const angleDelta = ((targetAngle - previousAngle + 540) % 360) - 180;
        const angle = previousAngle + angleDelta * 0.14;
        const opacity = progress < 0.045 ? progress / 0.045 : 1;

        item.truck.dataset.angle = String(angle);
        item.truck.setAttribute("transform", `translate(${point.x} ${point.y}) rotate(${angle})`);
        item.truck.style.opacity = String(clamp(opacity, 0, 1));
      }

      if (!reducedMotion) animationFrame = window.requestAnimationFrame(animate);
    };

    animationFrame = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(animationFrame);
  }, [fleetSystem.trucks, mapData.routes]);

  const displayCity = hoveredCity ?? selectedCity;
  const selectedLiveTrip = selectedTrip ? (() => {
    const truck = fleetSystem.trucks.find((candidate) => candidate.truckId === selectedTrip.truckId);
    if (!truck || truck.status === "waiting" || truck.routeIndex === null) return null;
    const route = mapData.routes[truck.routeIndex];
    if (route?.id !== selectedTrip.route.id) return null;
    return {
      ...selectedTrip,
      status: truck.status === "arrived" ? "arrived" as const : "driving" as const,
    };
  })() : null;
  const displayTrip = hoveredTrip ?? (hoveredRoute ? null : selectedLiveTrip);
  const displayRoute = hoveredTrip?.route ?? hoveredRoute ?? selectedLiveTrip?.route ?? selectedRoute;
  const displayDistrict = hoveredDistrict ?? selectedDistrict;
  const fleetTrips = fleetSystem.trucks.flatMap((trip) => {
    if (trip.status === "waiting" || trip.routeIndex === null) return [];
    const route = mapData.routes[trip.routeIndex];
    const cargo = cargoCatalog[trip.cargoIndex];
    if (!route || !cargo) return [];
    return [{ ...trip, route, cargo }];
  });
  const fleetRouteIds = new Set(fleetTrips.map((trip) => trip.route.id));
  const visibleRoutes = mapData.routes.filter((route) => (
    route.kind === "regional" || fleetRouteIds.has(route.id) || displayRoute?.id === route.id
  ));
  const mapX = pan.x + parallax.x;
  const mapY = pan.y + parallax.y;

  function eventPoint(event: ReactPointerEvent<SVGSVGElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * VIEWBOX_WIDTH,
      y: ((event.clientY - rect.top) / rect.height) * VIEWBOX_HEIGHT,
    };
  }

  function changeZoom(nextZoom: number) {
    setZoom(clamp(nextZoom, 0.82, 2.35));
    setSelectedCity(null);
  }

  function resetView() {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setParallax({ x: 0, y: 0 });
    setSelectedCity(null);
    setHoveredCity(null);
    setSelectedDistrict(null);
    setHoveredDistrict(null);
    setSelectedRoute(null);
    setHoveredRoute(null);
    setSelectedTrip(null);
    setHoveredTrip(null);
    setDispatchFeedback(null);
  }

  function focusCity(city: ProjectedCity, requestTime: number, cargoSeed: number) {
    const targetZoom = 1.82;
    const isAlreadySelected = selectedCity?.id === city.id;

    if (isAlreadySelected) {
      resetView();
      return;
    }

    setSelectedCity(city);
    setSelectedRoute(null);
    setSelectedTrip(null);
    setSelectedDistrict(null);
    const route = mapData.routes.find((candidate) => candidate.name === city.name);
    if (route) {
      dispatchRandomCargo(route, requestTime, cargoSeed);
    }
    setZoom(targetZoom);
    setPan({
      x: -(city.x - MAP_CENTER.x) * targetZoom,
      y: -(city.y - MAP_CENTER.y) * targetZoom,
    });
    setParallax({ x: 0, y: 0 });
  }

  function selectRoute(route: ProjectedRoute, requestTime: number, cargoSeed: number) {
    setSelectedRoute(route);
    setSelectedTrip(null);
    setSelectedCity(null);
    setSelectedDistrict(null);
    dispatchRandomCargo(route, requestTime, cargoSeed);
  }

  function selectTrip(trip: DisplayTrip) {
    setSelectedTrip((currentTrip) => (
      currentTrip?.truckId === trip.truckId && currentTrip.route.id === trip.route.id ? null : trip
    ));
    setSelectedRoute(null);
    setSelectedCity(null);
    setSelectedDistrict(null);
    setDispatchFeedback(null);
  }

  function selectDistrict(name: string) {
    setSelectedDistrict((currentDistrict) => currentDistrict === name ? null : name);
    setSelectedCity(null);
    setSelectedRoute(null);
    setSelectedTrip(null);
    setDispatchFeedback(null);
  }

  function dispatchRandomCargo(route: ProjectedRoute, requestTime: number, cargoSeed: number) {
    const routeIndex = mapData.routes.findIndex((candidate) => candidate.id === route.id);
    if (routeIndex < 0) return;
    const cargoIndex = Number.isFinite(cargoSeed)
      ? clamp(Math.floor(cargoSeed * 3), 0, 2)
      : routeIndex % 3;
    const cargo = cargoCatalog[cargoIndex] ?? cargoCatalog[0];
    if (!cargo) return;
    const safeRequestTime = Number.isFinite(requestTime) ? requestTime : 0;
    const availableTruck = fleetSystem.trucks.find((truck) => truck.status === "waiting");
    const request: DispatchRequest = {
      id: safeRequestTime,
      routeIndex,
      cargoIndex,
    };

    if (!availableTruck) {
      setFleetSystem((currentSystem) => ({
        ...currentSystem,
        queue: [...currentSystem.queue, request],
        nextAutoAt: Math.min(currentSystem.nextAutoAt || safeRequestTime + 500, safeRequestTime + 500),
      }));
      setDispatchFeedback(`${cargo.name} · заявка №${fleetSystem.queue.length + 1} в очереди`);
      return;
    }

    const currentTime = safeRequestTime;
    const duration = tripDuration(route.distanceKm);
    setFleetSystem((currentSystem) => {
      const availableIndex = currentSystem.trucks.findIndex((truck) => (
        truck.truckId === availableTruck.truckId && truck.status === "waiting"
      ));

      if (availableIndex < 0) {
        return { ...currentSystem, queue: [...currentSystem.queue, request] };
      }

      return {
        ...currentSystem,
        nextAutoAt: Math.max(currentSystem.nextAutoAt, currentTime + 2800),
        trucks: currentSystem.trucks.map((truck, index) => index === availableIndex ? {
          ...truck,
          status: "driving" as const,
          routeIndex,
          cargoIndex,
          cycle: truck.cycle + 1,
          duration,
          startedAt: currentTime,
          arrivesAt: currentTime + duration * 1000,
          availableAt: 0,
          isManual: true,
        } : truck),
      };
    });
    setSelectedTrip({
      truckId: availableTruck.truckId,
      route,
      cargo,
      status: "driving",
      isManual: true,
    });
    setDispatchFeedback(`${cargo.name} · грузовик №${availableTruck.truckId + 1} выехал`);
  }

  function handlePointerDown(event: ReactPointerEvent<SVGSVGElement>) {
    if ((event.target as Element).closest(".city-marker, .truck-unit, .district-center")) return;

    const point = eventPoint(event);
    dragRef.current = {
      pointerId: event.pointerId,
      startX: point.x,
      startY: point.y,
      panX: pan.x,
      panY: pan.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDragging(true);
    setSelectedCity(null);
  }

  function handlePointerMove(event: ReactPointerEvent<SVGSVGElement>) {
    const point = eventPoint(event);
    setCursor(point);

    if (dragRef.current) {
      setPan({
        x: dragRef.current.panX + point.x - dragRef.current.startX,
        y: dragRef.current.panY + point.y - dragRef.current.startY,
      });
      return;
    }

    setParallax({
      x: ((point.x - MAP_CENTER.x) / MAP_CENTER.x) * 13,
      y: ((point.y - MAP_CENTER.y) / MAP_CENTER.y) * 10,
    });
  }

  function handlePointerUp(event: ReactPointerEvent<SVGSVGElement>) {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null;
      setIsDragging(false);
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function handlePointerLeave(event: ReactPointerEvent<SVGSVGElement>) {
    handlePointerUp(event);
    if (!dragRef.current) setParallax({ x: 0, y: 0 });
  }

  return (
    <div className="belarus-map-demo">
      <div className="map-heading">
        <p className="demo-kicker">ЛОГИСТИКА В РЕАЛЬНОМ ВРЕМЕНИ</p>
        <h2>Беларусь в движении</h2>
        <span>{displayDistrict ? `${displayDistrict} · район` : `${fleetTrips.length} в пути · очередь ${fleetSystem.queue.length}`}</span>
      </div>

      <div className="map-controls" aria-label="Управление картой">
        <button type="button" onClick={() => changeZoom(zoom + 0.2)} aria-label="Приблизить карту">+</button>
        <button type="button" onClick={() => changeZoom(zoom - 0.2)} aria-label="Отдалить карту">−</button>
        <button type="button" className="map-reset" onClick={resetView}>Общий вид</button>
      </div>

      <svg
        ref={canvasRef}
        className={`belarus-map-canvas ${isDragging ? "is-dragging" : ""} ${zoom >= 1.35 ? "is-detailed" : ""}`}
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
        style={{
          "--map-tilt-x": `${parallax.y * -0.045}deg`,
          "--map-tilt-y": `${parallax.x * 0.045}deg`,
        } as CSSProperties}
        role="img"
        aria-label="Интерактивная карта районов Беларуси с реальными дорожными маршрутами и грузовиками"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        onDoubleClick={() => changeZoom(zoom + 0.35)}
      >
        <title>Районы и маршруты поставок Genlix в Беларуси</title>
        <desc>Грузовики выезжают из Минска по одному, доставляют продукцию и остаются видимыми до прибытия в административный центр.</desc>
        <defs>
          <pattern id="map-grid" width="52" height="52" patternUnits="userSpaceOnUse">
            <path d="M 52 0 L 0 0 0 52" className="map-grid-line" />
          </pattern>
          <pattern id="tech-mesh" width="36" height="36" patternUnits="userSpaceOnUse">
            <path d="M36 0H0V36" className="tech-mesh-line" />
            <circle cx="0" cy="0" r="1.25" className="tech-mesh-dot" />
          </pattern>
          <radialGradient id="cursor-glow">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.14" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="glass-surface-gradient" x1="8%" y1="4%" x2="92%" y2="96%">
            <stop offset="0%" stopColor="var(--tech-white)" stopOpacity="0.62" />
            <stop offset="36%" stopColor="var(--tech-blue)" stopOpacity="0.075" />
            <stop offset="72%" stopColor="var(--tech-white)" stopOpacity="0.24" />
            <stop offset="100%" stopColor="var(--tech-blue)" stopOpacity="0.12" />
          </linearGradient>
          <linearGradient id="country-glass-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.03" />
            <stop offset="48%" stopColor="currentColor" stopOpacity="0.09" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.025" />
          </linearGradient>
          <linearGradient id="glass-scan-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--tech-white)" stopOpacity="0" />
            <stop offset="50%" stopColor="var(--tech-white)" stopOpacity="0.8" />
            <stop offset="100%" stopColor="var(--tech-white)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="truck-body-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="48%" stopColor="#eef4f5" />
            <stop offset="100%" stopColor="#cbdadd" />
          </linearGradient>
          <linearGradient id="truck-cab-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f9fcfc" />
            <stop offset="62%" stopColor="#d8e5e7" />
            <stop offset="100%" stopColor="#b7cdd2" />
          </linearGradient>
          <clipPath id="country-clip">
            <path d={mapData.countryPath} />
          </clipPath>
          <filter id="map-shadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="14" stdDeviation="20" floodOpacity="0.07" />
          </filter>
          <filter id="glass-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="5" result="glassBlur" />
            <feMerge>
              <feMergeNode in="glassBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="hub-glow" x="-120%" y="-120%" width="340%" height="340%">
            <feGaussianBlur stdDeviation="4.5" result="hubBlur" />
            <feMerge>
              <feMergeNode in="hubBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="route-glow" x="-30%" y="-80%" width="160%" height="260%">
            <feGaussianBlur stdDeviation="3.4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="truck-shadow" x="-80%" y="-80%" width="260%" height="260%">
            <feDropShadow dx="0" dy="4" stdDeviation="3.8" floodOpacity="0.24" />
          </filter>
        </defs>

        <rect width={VIEWBOX_WIDTH} height={VIEWBOX_HEIGHT} className="map-grid" fill="url(#map-grid)" />
        <circle cx={cursor.x} cy={cursor.y} r="180" className="map-cursor-glow" fill="url(#cursor-glow)" />
        <g className="tech-interface-layer" aria-hidden="true">
          <path className="tech-frame-corners" d="M34 96V48H82 M918 48h48v48 M966 604v48h-48 M82 652H34v-48" />
          <path className="tech-frame-scale" d="M102 48h10m18 0h5m18 0h5m18 0h10 M898 652h-10m-18 0h-5m-18 0h-5m-18 0h-10" />
          <g className="cursor-reticle" transform={`translate(${cursor.x} ${cursor.y})`}>
            <circle r="32" />
            <circle r="7" />
            <path d="M-45 0h20M25 0h20M0-45v20M0 25v20" />
          </g>
        </g>

        <g
          className="map-transform"
          style={{
            transform: `translate(${mapX}px, ${mapY}px) translate(${MAP_CENTER.x}px, ${MAP_CENTER.y}px) scale(${zoom}) translate(${-MAP_CENTER.x}px, ${-MAP_CENTER.y}px)`,
          }}
        >
          <g>
            <path d={mapData.countryPath} className="country-shadow" filter="url(#map-shadow)" />
            <g className="country-glass-stack" aria-hidden="true">
              <path d={mapData.countryPath} className="country-glass-depth depth-three" transform="translate(0 14)" />
              <path d={mapData.countryPath} className="country-glass-depth depth-two" transform="translate(0 9)" />
              <path d={mapData.countryPath} className="country-glass-depth depth-one" transform="translate(0 4)" />
              <path d={mapData.countryPath} className="country-glass-surface" fill="url(#glass-surface-gradient)" filter="url(#glass-glow)" />
              <path d={mapData.countryPath} className="country-tech-mesh" fill="url(#tech-mesh)" />
              <rect
                className="country-scan-beam"
                x="-220"
                y="20"
                width="145"
                height="650"
                fill="url(#glass-scan-gradient)"
                clipPath="url(#country-clip)"
              />
            </g>

            <g className="map-districts">
              {mapData.districts.map((district, index) => (
                <path
                  className={`map-district ${displayDistrict === district.name ? "is-active" : ""}`}
                  d={district.path}
                  key={district.id}
                  pathLength="1"
                  style={{ "--district-delay": `${70 + (index % 24) * 18}ms` } as CSSProperties}
                  onPointerEnter={() => setHoveredDistrict(district.name)}
                  onPointerLeave={() => setHoveredDistrict(null)}
                  onClick={() => selectDistrict(district.name)}
                />
              ))}
            </g>

            <g className="road-network">
              {visibleRoutes.map((route, index) => {
                const isActive = displayRoute?.id === route.id;
                return (
                  <g className={`road-route ${isActive ? "is-active" : ""}`} key={route.id}>
                    <path id={`route-${route.id}`} d={route.path} className="road-casing" />
                    <path
                      d={route.path}
                      className="road-surface"
                      pathLength="1"
                      style={{ "--road-delay": `${500 + index * 85}ms` } as CSSProperties}
                    />
                    <path
                      d={route.path}
                      className="road-data-flow"
                      pathLength="1"
                      style={{ "--flow-delay": `${index * -220}ms` } as CSSProperties}
                    />
                    <path
                      d={route.path}
                      className="road-hitbox"
                      onPointerEnter={() => setHoveredRoute(route)}
                      onPointerLeave={() => setHoveredRoute(null)}
                      onClick={() => selectRoute(route, Date.now(), Math.random())}
                    />
                  </g>
                );
              })}
            </g>

            <path d={mapData.countryPath} className="country-outline" pathLength="1" />

            <g className="network-radars" aria-hidden="true">
              {mapData.cities.filter((city) => regionalCityIds.has(city.id)).map((city) => {
                const isHub = city.id === "minsk";
                const radius = isHub ? 47 : 29;
                return (
                  <g
                    className={`tech-radar ${isHub ? "is-hub" : ""}`}
                    key={`radar-${city.id}`}
                    transform={`translate(${city.x} ${city.y})`}
                  >
                    <circle className="tech-radar-halo" r={radius} filter="url(#hub-glow)" />
                    <circle className="tech-radar-ring ring-outer" r={radius} />
                    <circle className="tech-radar-ring ring-mid" r={radius * 0.62} />
                    <circle className="tech-radar-ring ring-inner" r={radius * 0.28} />
                    <path className="tech-radar-axis" d={`M${-radius - 8} 0H${radius + 8}M0 ${-radius - 8}V${radius + 8}`} />
                    <path className="tech-radar-sweep" d={`M0 0L${radius * 0.82} ${-radius * 0.34}`} />
                  </g>
                );
              })}
            </g>

            <g className="district-center-layer">
              {mapData.routes.filter((route) => route.kind === "district").map((route) => {
                const isActive = displayRoute?.id === route.id;
                return (
                  <g
                    className={`district-center ${isActive ? "is-active" : ""}`}
                    key={`center-${route.id}`}
                    role="button"
                    tabIndex={0}
                    aria-label={`${route.name}, районный центр`}
                    onPointerEnter={() => setHoveredRoute(route)}
                    onPointerLeave={() => setHoveredRoute(null)}
                    onFocus={() => setHoveredRoute(route)}
                    onBlur={() => setHoveredRoute(null)}
                    onClick={() => selectRoute(route, Date.now(), Math.random())}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        selectRoute(route, Date.now(), Math.random());
                      }
                    }}
                  >
                    <circle className="district-center-hitbox" cx={route.x} cy={route.y} r="10" />
                    <circle className="district-center-dot" cx={route.x} cy={route.y} r="2.2" />
                    {isActive && (
                      <text className="district-center-label" x={route.x + 9} y={route.y - 7}>{route.name}</text>
                    )}
                  </g>
                );
              })}
            </g>

            {mapData.cities.map((city, index) => {
              const isActive = displayCity?.id === city.id;
              const isRegional = regionalCityIds.has(city.id);
              return (
                <g key={city.id} className={`city-group ${isRegional ? "is-regional" : ""} ${isActive ? "is-active" : ""}`}>
                  <foreignObject
                    x={city.x - 24}
                    y={city.y - 24}
                    width="48"
                    height="48"
                    overflow="visible"
                  >
                    <button
                      className="city-marker"
                      type="button"
                      aria-label={`${city.name}, регион поставок`}
                      style={{ "--city-delay": `${660 + index * 90}ms` } as CSSProperties}
                      onPointerEnter={() => setHoveredCity(city)}
                      onPointerLeave={() => setHoveredCity(null)}
                      onFocus={() => setHoveredCity(city)}
                      onBlur={() => setHoveredCity(null)}
                      onClick={() => focusCity(city, Date.now(), Math.random())}
                    >
                      <span className="city-ring" />
                      <span className="city-core" />
                    </button>
                  </foreignObject>
                  <text
                    className="city-label"
                    x={city.x + city.labelDx}
                    y={city.y + city.labelDy}
                    textAnchor={city.anchor ?? "start"}
                    style={{ "--city-delay": `${760 + index * 90}ms` } as CSSProperties}
                  >
                    {city.name}
                  </text>
                </g>
              );
            })}

            <g className="truck-fleet">
              <g className="truck-trails" aria-hidden="true">
                {fleetTrips.map((trip) => (
                  <path
                    className={`truck-light-trail ${trip.status === "arrived" ? "is-arrived" : ""}`}
                    d={trip.route.path}
                    filter="url(#route-glow)"
                    key={`trail-${trip.truckId}-${trip.cycle}-${trip.route.id}`}
                    pathLength="1"
                    style={{ "--trip-duration": `${trip.duration}s` } as CSSProperties}
                  />
                ))}
              </g>
              {fleetTrips.map((trip) => {
                const tripInfo: DisplayTrip = {
                  truckId: trip.truckId,
                  route: trip.route,
                  cargo: trip.cargo,
                  status: trip.status === "arrived" ? "arrived" : "driving",
                  isManual: trip.isManual,
                };
                const isActive = displayTrip?.truckId === trip.truckId;
                return (
                  <g
                    className={`truck-unit ${trip.isManual ? "is-manual" : ""} ${trip.status === "arrived" ? "is-arrived" : ""} ${isActive ? "is-active" : ""}`}
                    key={`truck-${trip.truckId}-${trip.cycle}-${trip.route.id}`}
                    ref={(node) => {
                      if (node) truckRefs.current.set(trip.truckId, node);
                      else truckRefs.current.delete(trip.truckId);
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label={`Грузовик Genlix: ${trip.cargo.name}, Минск — ${trip.route.name}, ${trip.status === "arrived" ? "доставлено" : "в пути"}`}
                    onPointerEnter={() => setHoveredTrip(tripInfo)}
                    onPointerLeave={() => setHoveredTrip(null)}
                    onFocus={() => setHoveredTrip(tripInfo)}
                    onBlur={() => setHoveredTrip(null)}
                    onClick={() => selectTrip(tripInfo)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        selectTrip(tripInfo);
                      }
                    }}
                  >
                    <g
                      className="truck-symbol"
                      filter="url(#truck-shadow)"
                      style={{ "--cargo-accent": cargoAccents[trip.cargoIndex] } as CSSProperties}
                    >
                      <rect className="truck-hitbox" x="-36" y="-24" width="72" height="48" rx="10" />
                      <ellipse className="truck-ground-shadow" cx="0" cy="3" rx="29" ry="12" />
                      <path className="truck-headlight-beam" d="M26 -6L37 -10V-2zM26 6l11 4V2z" />
                      <rect className="truck-wheel" x="-21" y="-13" width="10" height="3.5" rx="1.75" />
                      <rect className="truck-wheel" x="-21" y="9.5" width="10" height="3.5" rx="1.75" />
                      <rect className="truck-wheel" x="11" y="-13" width="9" height="3.5" rx="1.75" />
                      <rect className="truck-wheel" x="11" y="9.5" width="9" height="3.5" rx="1.75" />
                      <rect className="truck-trailer" x="-29" y="-10.5" width="38" height="21" rx="4.5" />
                      <path className="truck-cab" d="M8 -10.5h9.5c4.6 0 8.6 3.8 10.5 8.2v4.6c-1.9 4.4-5.9 8.2-10.5 8.2H8z" />
                      <path className="truck-window" d="M16 -7.3h2c3 0 5.7 2.7 7.3 6.1v2.4C23.7 4.6 21 7.3 18 7.3h-2z" />
                      <rect className="truck-cargo-stripe" x="-25" y="-1.4" width="30" height="2.8" rx="1.4" />
                      <path className="truck-roof-highlight" d="M-24 -7h27M11 -7h4" />
                      <text className="truck-brand-name" x="-10" y="-4" textAnchor="middle">GENLIX</text>
                      <path className="truck-front-line" d="M26 -4.2v8.4" />
                      <circle className="truck-headlight" cx="26.5" cy="-6.2" r="1.25" />
                      <circle className="truck-headlight" cx="26.5" cy="6.2" r="1.25" />
                    </g>
                  </g>
                );
              })}
            </g>
          </g>
        </g>
      </svg>

      <div className={`map-city-card ${displayCity || displayRoute || displayDistrict ? "is-visible" : ""} ${displayRoute ? "is-route" : ""}`} aria-live="polite">
        {displayTrip ? (
          <>
            <span>Грузовик GENLIX · {displayTrip.status === "arrived" ? "доставлено" : "в пути"}</span>
            <strong>{displayTrip.cargo.name}</strong>
            <p>Минск → {displayTrip.route.name} · {displayTrip.route.distanceKm} км · ≈ {displayTrip.route.etaHours} ч</p>
          </>
        ) : displayRoute ? (
          <>
            <span>{displayRoute.kind === "regional" ? "Областной центр" : "Районный центр"}</span>
            <strong>{displayRoute.name}</strong>
            <p>
              {dispatchFeedback && selectedRoute?.id === displayRoute.id
                ? dispatchFeedback
                : `Маршрут из Минска · ${displayRoute.distanceKm} км · ≈ ${displayRoute.etaHours} ч`}
            </p>
          </>
        ) : displayCity ? (
          <>
            <span>{regionalCityIds.has(displayCity.id) ? "Областной центр" : "Крупный город"}</span>
            <strong>{displayCity.name}</strong>
            <p>Регион поставок</p>
          </>
        ) : displayDistrict ? (
          <>
            <span>Административная территория</span>
            <strong>{displayDistrict}</strong>
            <p>Район Беларуси</p>
          </>
        ) : (
          <>
            <span>Логистическая сеть</span>
            <strong>Беларусь</strong>
            <p>118 районов · 116 направлений</p>
          </>
        )}
      </div>

      <div className="map-hint">
        <span>Колесо — масштаб</span>
        <span>Зажмите и двигайте карту</span>
        <span>Нажмите на пункт — отправить груз</span>
      </div>

      <div className="map-attribution">
        Центры: GeoNames · Районы: geoBoundaries · Дороги: <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap</a>
      </div>
    </div>
  );
}
