import { useEffect, useRef } from 'react';
import { Chart, register } from '@antv/g2';
import * as d3 from 'd3-voronoi';
import type {
  DeviceCoordinate,
  VoronoiPolygon,
} from '@/features/manager/types/visualizationTypes';

type VoronoiChartProps = {
  devices: DeviceCoordinate[];
  width?: number;
  height?: number;
};

// Register custom shapes for device icons
const registerDeviceShapes = () => {
  // ESP32 Icon (using a simple microchip-like SVG path)
  register('shape.point.esp32', (style, context) => {
    const { document } = context;
    const { color, size = 20 } = style;

    // ESP32 microchip icon (simple rectangle with pins)
    const path = document.createElement('path', {
      style: {
        d: `M ${-size / 2} ${-size / 2} 
            L ${size / 2} ${-size / 2} 
            L ${size / 2} ${size / 2} 
            L ${-size / 2} ${size / 2} 
            Z
            M ${-size / 2} ${-size / 3} L ${-size / 2 - 3} ${-size / 3}
            M ${-size / 2} 0 L ${-size / 2 - 3} 0
            M ${-size / 2} ${size / 3} L ${-size / 2 - 3} ${size / 3}
            M ${size / 2} ${-size / 3} L ${size / 2 + 3} ${-size / 3}
            M ${size / 2} 0 L ${size / 2 + 3} 0
            M ${size / 2} ${size / 3} L ${size / 2 + 3} ${size / 3}`,
        fill: color,
        stroke: '#fff',
        strokeWidth: 2,
        lineWidth: 2,
      },
    });
    return path;
  });

  // Android Icon (using tablet/phone shape)
  register('shape.point.android', (style, context) => {
    const { document } = context;
    const { color, size = 20 } = style;

    // Android tablet icon (rounded rectangle with camera dot)
    const group = document.createElement('g', {});

    // Main body
    const body = document.createElement('rect', {
      style: {
        x: -size / 2,
        y: -size / 2,
        width: size,
        height: size * 1.3,
        rx: size / 5,
        fill: color,
        stroke: '#fff',
        strokeWidth: 2,
      },
    });

    // Camera dot
    const camera = document.createElement('circle', {
      style: {
        cx: 0,
        cy: -size / 3,
        r: size / 10,
        fill: '#fff',
      },
    });

    group.appendChild(body);
    group.appendChild(camera);

    return group;
  });

  // Offline Icon (X mark)
  register('shape.point.offline', (style, context) => {
    const { document } = context;
    const { color, size = 20 } = style;

    const path = document.createElement('path', {
      style: {
        d: `M ${-size / 3} ${-size / 3} L ${size / 3} ${size / 3}
            M ${size / 3} ${-size / 3} L ${-size / 3} ${size / 3}`,
        stroke: color,
        strokeWidth: 3,
        lineWidth: 3,
        fill: 'none',
      },
    });

    const circle = document.createElement('circle', {
      style: {
        cx: 0,
        cy: 0,
        r: size / 2,
        fill: color,
        fillOpacity: 0.2,
        stroke: color,
        strokeWidth: 2,
      },
    });

    const group = document.createElement('g', {});
    group.appendChild(circle);
    group.appendChild(path);

    return group;
  });
};

export const VoronoiChart = ({
  devices,
  width = 800,
  height = 600,
}: VoronoiChartProps) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<Chart | null>(null);

  useEffect(() => {
    // Register custom shapes once
    registerDeviceShapes();
  }, []);

  useEffect(() => {
    if (!chartRef.current || devices.length === 0) return;

    // Clear existing chart
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    // Create Voronoi layout
    const layout = (data: DeviceCoordinate[]): VoronoiPolygon[] => {
      return d3
        .voronoi()
        .x((d: any) => d.x)
        .y((d: any) => d.y)
        .extent([
          [0, 0],
          [width, height],
        ])
        .polygons(data)
        .map((polygon) => {
          if (!polygon) return null;
          return {
            x: polygon.map((point) => point[0]),
            y: polygon.map((point) => point[1]),
            // @ts-ignore - d3-voronoi attaches data to polygon
            data: polygon.data,
          };
        })
        .filter((p): p is VoronoiPolygon => p !== null);
    };

    const voronoiData = layout(devices);

    // Create G2 Chart
    const chart = new Chart({
      container: chartRef.current,
      autoFit: true,
      paddingLeft: 0,
      paddingRight: 0,
      paddingTop: 0,
      paddingBottom: 0,
    });

    // Draw Voronoi Cells
    chart
      .polygon()
      .data(voronoiData)
      .encode('x', 'x')
      .encode('y', 'y')
      .encode('color', (d) => {
        if (d.data.status === 'offline') return '#d9d9d9';
        return d.data.device_type === 'esp32' ? '#52c41a' : '#1677ff';
      })
      .scale('x', { domain: [0, width] })
      .scale('y', { domain: [0, height] })
      .scale('color', {
        type: 'ordinal',
        domain: ['#52c41a', '#1677ff', '#d9d9d9'],
        range: ['#52c41a', '#1677ff', '#d9d9d9'],
      })
      .axis(false)
      .style('stroke', '#fff')
      .style('strokeWidth', 2)
      .style('fillOpacity', 0.25)
      .tooltip({
        title: (d) => d.data.device_name,
        items: [
          {
            name: 'Device ID',
            value: (d) => d.data.device_id,
          },
          {
            name: 'Type',
            value: (d) => d.data.device_type.toUpperCase(),
          },
          {
            name: 'Status',
            value: (d) => d.data.status.toUpperCase(),
          },
          {
            name: 'Signal',
            value: (d) => `${d.data.signal_strength || 0}%`,
          },
        ],
      });

    // Draw Device Icons (instead of points)
    chart
      .point()
      .data(devices)
      .encode('x', 'x')
      .encode('y', 'y')
      .encode('color', (d) => {
        if (d.status === 'offline') return '#d9d9d9';
        return d.device_type === 'esp32' ? '#52c41a' : '#1677ff';
      })
      .encode('size', 16) // Size of the icon
      .encode('shape', (d) => {
        // Use custom shapes based on device type and status
        if (d.status === 'offline') return 'offline';
        return d.device_type === 'esp32' ? 'esp32' : 'android';
      })
      .scale('x', { domain: [0, width] })
      .scale('y', { domain: [0, height] })
      .tooltip(false);

    // Render
    chart.render();

    chartInstanceRef.current = chart;

    return () => {
      chart.destroy();
    };
  }, [devices, width, height]);

  return (
    <div
      ref={chartRef}
      style={{ width: '100%', height: '100%' }}
    />
  );
};
