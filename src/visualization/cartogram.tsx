import * as d3 from 'd3';
import * as topojson from 'topojson';
import { RefObject, useEffect, useRef } from 'react';
import { CartogramStateId, MockDataset, StateCartogramData } from './state-cartogram-data';

import us from './states-albers-10m.json';

const WIDTH = 975;
const HEIGHT = 610;

export function Cartogram() {
    const svgRef = useRef(null);

    const data = new Map(process(MockDataset));
    useCartogram(svgRef, data);

    return (
        <svg
            ref={svgRef}
        >
        </svg>
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
            ).nice();
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
            scale(${data.get(d.id)})
            translate(${-x},${-y})
        `;
    }
}

function process(data: StateCartogramData[]): StateCartogramData[] {
    const log = d3.scaleLog([1, 6633], [0, 1]);
    return data.map((dataPoint) => [dataPoint[0], log(dataPoint[1])]);
}

