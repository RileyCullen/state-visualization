import * as d3 from 'd3';
import * as topojson from 'topojson';
import { RefObject, useEffect, useRef } from 'react';
import { CartogramStateId, MockDataset, StateCartogramData } from './state-cartogram-data';
// @ts-ignore
import { legend } from './legend';

import us from './states-albers-10m.json';
import ColorLegend from './color-legend';

const WIDTH = 975;
const HEIGHT = 610;

export function Cartogram() {
    const cartogramRef = useRef(null);

    const data = new Map(process(MockDataset));
    useCartogram(cartogramRef, data);

    return (
        <div style={{ display: 'flex', flexDirection: 'row' }}>
            <div>
                <h1
                    style={{ textAlign: 'center' }}
                >
                    Triatomine Bug Distribution on a Logarithmic scale
                </h1>
                <h4 style={{ textAlign: 'center' }}>
                    By Khoa Vu and Jade Zdeblick
                </h4>
                <svg
                    ref={cartogramRef}
                >
                </svg>
            </div>
            <ColorLegend
                data={new Map(MockDataset)}
            />
        </div >
    )
}

function useCartogram(
    svgRef: RefObject<SVGElement | null>,
    data: Map<CartogramStateId, number>
) {
    useEffect(
        () => {
            if (!svgRef) return;
            const svg = d3.select(svgRef.current)
                .attr('viewBox', [0, 0, WIDTH, HEIGHT])
                .attr('width', WIDTH)
                .attr('height', HEIGHT)
                .attr('stroke-linejoin', 'round')
                .attr('stroke-linecap', 'round')
                .attr('style', 'max-width: 100%; height: auto');

            const path = d3.geoPath();

            // Outline of map
            svg.append('path')
                // @ts-ignore
                .datum(topojson.mesh(us, us.objects.states))
                .attr('fill', 'none')
                .attr('stroke', '#ccc')
                .attr('d', path);

            const color = d3.scaleSequential(
                // @ts-ignore
                d3.extent(Array.from(data.values()).flat()),
                d3.interpolateReds
                // @ts-ignore
            );

            // Actual state colorings
            svg.append('g')
                .attr('stroke', '#000')
                .selectAll('path')
                .data(
                    // @ts-ignore
                    topojson.feature(us, us.objects.states)
                        // @ts-ignore
                        .features
                        // @ts-ignore
                        .filter(d => data.has(d.id))
                )
                .join('path')
                .attr('vector-effect', 'non-scaling-stroke')
                // @ts-ignore
                .attr('d', path)
                // @ts-ignore
                .attr('fill', d => color(data.get(d.id)))
                .attr('transform', d => transform(path, d))

        },
        [svgRef, data]
    );

    function transform(path: any, d: any) {
        const [x, y] = path.centroid(d);
        return `
            translate(${x},${y})
            translate(${-x},${-y})
        `;
    }
}

function process(data: StateCartogramData[]): StateCartogramData[] {
    const log = d3.scaleLog([0.5, 6633], [0, 6633]);
    return data.map((dataPoint) => [dataPoint[0], log(dataPoint[1])]);
}

