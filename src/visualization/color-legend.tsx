// @ts-nocheck
import { useState, useRef, useEffect } from "react"
import * as d3 from "d3"

// Function to create a vertical color gradient canvas
function verticalRamp(color, n = 256) {
    const canvas = document.createElement("canvas")
    canvas.width = 1
    canvas.height = n
    const context = canvas.getContext("2d")
    for (let i = 0; i < n; ++i) {
        context.fillStyle = color(i / (n - 1))
        context.fillRect(0, n - 1 - i, 1, 1) // Draw from bottom to top
    }
    return canvas
}

// Helper function to safely parse transform attribute
function parseTransform(transform) {
    if (!transform) return { x: 0, y: 0 }

    // Try to match the transform using different regex patterns
    const match = transform.match(/translate$$\s*([^,)]+)(?:,\s*([^)]+))?$$/)
    if (match) {
        const x = Number.parseFloat(match[1] || 0)
        const y = Number.parseFloat(match[2] || 0)
        return { x, y }
    }

    // Try to match multiple translate transforms
    const translateX = transform.match(/translate$$\s*([^)]+)$$/)
    const translateY = transform.match(/translate$$\s*0\s*,\s*([^)]+)$$/)

    return {
        x: translateX ? Number.parseFloat(translateX[1]) : 0,
        y: translateY ? Number.parseFloat(translateY[1]) : 0,
    }
}

// Vertical color legend component
export function VerticalColorLegend({
    color,
    title,
    tickSize = 6,
    width = 44 + tickSize,
    height = 700,
    marginTop = 80,
    marginRight = 16 + tickSize,
    marginBottom = 0,
    marginLeft = 18,
    ticks = height / 64,
    tickFormat,
    tickValues,
    tickLabels,
    onLabelChange,
    useLogScale = false,
    logBase = 10,
}) {
    const containerRef = useRef(null)
    const svgRef = useRef(null)
    const [editingIndex, setEditingIndex] = useState(null)
    const [editValue, setEditValue] = useState("")
    const [labelPositions, setLabelPositions] = useState([])
    const [actualTickValues, setActualTickValues] = useState([])

    useEffect(() => {
        if (!svgRef.current || !color) return

        // Clear previous content
        d3.select(svgRef.current).selectAll("*").remove()

        const svg = d3
            .select(svgRef.current)
            .attr("width", width)
            .attr("height", height)
            .attr("viewBox", [0, 0, width, height])
            .style("overflow", "visible")
            .style("display", "block")

        // Get the color domain
        const colorDomain = color.domain()

        // Create a scale for the vertical legend
        // For log scale, we need to ensure the domain doesn't include zero or negative values
        let y
        let originalDomain = colorDomain

        if (useLogScale) {
            // Ensure domain values are positive for log scale
            const minDomain = Math.max(0.1, colorDomain[0]) // Avoid zero or negative values
            const maxDomain = Math.max(minDomain * 1.1, colorDomain[1])

            y = d3
                .scaleLog()
                .base(logBase)
                .domain([minDomain, maxDomain])
                .range([height - marginBottom, marginTop])

            // Store original domain for label display
            originalDomain = [colorDomain[0], colorDomain[1]]
        } else {
            y = Object.assign(color.copy().interpolator(d3.interpolateRound(height - marginBottom, marginTop)), {
                range() {
                    return [height - marginBottom, marginTop]
                },
            })
        }

        // Add the gradient image
        svg
            .append("image")
            .attr("x", marginLeft)
            .attr("y", marginTop)
            .attr("width", width - marginLeft - marginRight)
            .attr("height", height - marginTop - marginBottom)
            .attr("preserveAspectRatio", "none")
            .attr("xlink:href", verticalRamp(color.interpolator()).toDataURL())

        // Handle tick values
        let tValues = tickValues
        let originalValues = []

        if (useLogScale) {
            if (tValues === undefined) {
                // Generate logarithmically spaced ticks
                const logMin = Math.log(y.domain()[0]) / Math.log(logBase)
                const logMax = Math.log(y.domain()[1]) / Math.log(logBase)
                const tickCount = Math.round(ticks + 1)

                // Generate ticks in log space
                const logTicks = d3.range(tickCount).map((i) => {
                    const logValue = logMin + (i / (tickCount - 1)) * (logMax - logMin)
                    return Math.pow(logBase, logValue)
                })

                tValues = logTicks

                // Store original values (same as log values in this case, but could be different)
                originalValues = [...tValues]
            } else {
                // If custom tick values are provided, store them as original values
                originalValues = [...tValues]
            }
        } else {
            if (tValues === undefined) {
                const n = Math.round(ticks + 1)
                tValues = d3.range(n).map((i) => d3.quantile(color.domain(), i / (n - 1)))
                originalValues = [...tValues]
            } else {
                originalValues = [...tValues]
            }
        }

        // Store actual tick values for reference
        setActualTickValues(originalValues)

        // Create a mapping of tick values to custom labels if provided
        const labelMap = new Map()
        if (tickLabels && originalValues) {
            originalValues.forEach((value, i) => {
                if (i < tickLabels.length) {
                    labelMap.set(value, tickLabels[i])
                }
            })
        }

        // Custom tick format function that uses the label map or formats the original values
        const customTickFormat = (d, i) => {
            // Get the corresponding original value
            const originalValue = originalValues[i] !== undefined ? originalValues[i] : d

            if (labelMap.has(originalValue)) {
                return labelMap.get(originalValue)
            }

            // Format the original value, not the log-scaled value
            return typeof tickFormat === "function" ? tickFormat(originalValue) : d3.format(tickFormat || ",f")(originalValue)
        }

        // Create the axis with the actual tick values but custom labels
        const axis = svg
            .append("g")
            .attr("transform", `translate(${marginLeft + width - marginLeft - marginRight},0)`)
            .call(d3.axisRight(y).tickSize(tickSize).tickValues(tValues).tickFormat(customTickFormat))
            .call((g) => g.select(".domain").remove())
            .call((g) =>
                g
                    .append("text")
                    .attr("x", -6)
                    .attr("y", marginTop - 6)
                    .attr("fill", "currentColor")
                    .attr("text-anchor", "start")
                    .attr("font-weight", "bold")
                    .text(title),
            )

        // Store positions of labels for overlay editing
        const positions = []

        axis.selectAll(".tick").each(function (d, i) {
            const tick = d3.select(this)
            const text = tick.select("text")

            // Get the position of the tick
            const transform = tick.attr("transform")
            const { y: translateY } = parseTransform(transform)

            // Get the text element's bounding box
            const textNode = text.node()
            if (!textNode) return

            const bbox = textNode.getBBox()

            positions.push({
                value: originalValues[i] || d,
                index: i,
                x: Number.parseFloat(text.attr("x") || "0") + marginLeft + width - marginLeft - marginRight,
                y: translateY,
                width: bbox.width + 20,
                height: bbox.height + 4,
                label: text.text(),
            })

            // Add click handler to the text element
            text.style("cursor", "pointer").on("click", () => {
                if (onLabelChange) {
                    setEditingIndex(i)
                    setEditValue(text.text())
                }
            })

            // Add a transparent overlay to make clicking easier
            tick
                .append("rect")
                .attr("x", Number.parseFloat(text.attr("x") || "0") - 2)
                .attr("y", -10)
                .attr("width", bbox.width + 4)
                .attr("height", 20)
                .attr("fill", "transparent")
                .style("cursor", "pointer")
                .on("click", () => {
                    if (onLabelChange) {
                        setEditingIndex(i)
                        setEditValue(text.text())
                    }
                })
        })

        setLabelPositions(positions)
    }, [
        color,
        title,
        tickSize,
        width,
        height,
        marginTop,
        marginRight,
        marginBottom,
        marginLeft,
        ticks,
        tickFormat,
        tickValues,
        tickLabels,
        onLabelChange,
        useLogScale,
        logBase,
    ])

    const handleInputBlur = () => {
        if (editingIndex !== null && onLabelChange) {
            onLabelChange(actualTickValues[editingIndex], editValue)
            setEditingIndex(null)
        }
    }

    const handleInputKeyDown = (e) => {
        if (e.key === "Enter") {
            handleInputBlur()
        } else if (e.key === "Escape") {
            setEditingIndex(null)
        }
    }

    return (
        <div ref={containerRef} className="relative inline-block">
            <svg ref={svgRef} />

            {/* Overlay input for editing */}
            {editingIndex !== null && labelPositions[editingIndex] && (
                <div
                    className="absolute"
                    style={{
                        left: `${labelPositions[editingIndex].x}px`,
                        top: `${labelPositions[editingIndex].y - 10}px`,
                        transform: "translateX(8px)",
                        zIndex: 100,
                    }}
                >
                    <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={handleInputBlur}
                        onKeyDown={handleInputKeyDown}
                        className="border border-gray-300 rounded px-1 py-0 text-sm w-20"
                        autoFocus
                    />
                </div>
            )}
        </div>
    )
}

// Example usage component with logarithmic scale
export default function ColorLegendDemo(props: { data: any }) {
    const { data } = props;
    // Using values that span multiple orders of magnitude for log scale
    const tickValues = Array.from(data.values()).flat();

    // Custom labels for the ticks that don't affect positioning
    const [tickLabels, setTickLabels] = useState(tickValues)

    const handleLabelChange = (tickValue, newLabel) => {
        setTickLabels((prev) => {
            const index = tickValues.indexOf(tickValue)
            if (index !== -1) {
                const newLabels = [...prev]
                newLabels[index] = newLabel
                return newLabels
            }
            return prev
        })
    }

    const color = d3.scaleSequential(
        // @ts-ignore
        d3.extent(Array.from(data.values()).flat()),
        d3.interpolateReds
        // @ts-ignore
    ).nice();


    return (
        <div className="flex flex-col items-center p-4">
            <div className="flex gap-8 items-start">
                <VerticalColorLegend
                    color={d3.scaleSequential([1, 6663], d3.interpolateReds)}
                    title=""
                    tickValues={tickValues}
                    tickLabels={tickLabels}
                    onLabelChange={handleLabelChange}
                    useLogScale={true}
                    logBase={10}
                />
            </div>
        </div>
    )
}
