# Frontend

## Installing Chart Dependencies

To add the SVG-based charting dependencies used in the admin cabang reports, run the following commands from the `frontend/` directory:

```bash
expo install react-native-svg
npm install react-native-svg-charts
```

The first command keeps `react-native-svg` aligned with the Expo SDK, while the second installs the charting primitives consumed by the new report visualizations.

### Why two commands?

Using `expo install react-native-svg` pins the SVG renderer to a release that matches the Expo SDK version, preventing native build mismatches. Afterwards run `npm install react-native-svg-charts` so that npm records the chart library in `package.json` and the lockfile.

### Troubleshooting

If you run into a `403 Forbidden` error while installing through a proxy, clear the proxy-related environment variables for the single command and retry:

```bash
HTTPS_PROXY= HTTP_PROXY= https_proxy= http_proxy= npm install react-native-svg-charts
```

This falls back to a direct registry connection so npm can resolve the package successfully.
