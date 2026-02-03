// Vendor shim for react-leaflet.
//
// Why: the dev server can keep a stale pre-bundled react-leaflet build that targets
// React 19 (uses React.use) which crashes React 18 apps with `render2 is not a function`.
//
// Importing via a direct file path forces Vite to treat it as a normal source module
// instead of using the cached optimized dependency bundle.

export {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  Polyline,
  Tooltip,
  useMap,
  useMapEvent,
  useMapEvents,
} from "../../node_modules/react-leaflet/lib/index.js";
