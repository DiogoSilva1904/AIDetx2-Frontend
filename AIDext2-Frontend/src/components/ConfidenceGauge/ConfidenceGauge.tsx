import { Gauge } from "@mui/x-charts/Gauge";

interface Props {
    confidence: number;
}

export default function ConfidenceGauge({ confidence }: Props) {
    const value = Math.round(confidence * 100);

    return (
        <Gauge
            width={240}
            height={170}
            value={value}
            text={({ value }) => `${value}%`}
            startAngle={-110}
            endAngle={110}
            innerRadius="78%"
            outerRadius="100%"
            sx={{
                "& .MuiGauge-valueArc": {
                    fill: `hsl(${120 - value * 1.2}, 75%, 50%)`,
                    transition: "fill 0.4s ease",
                },

                "& .MuiGauge-referenceArc": {
                    fill: "#2c2c2c",
                },

                "& text": {
                    fill: "#000",
                    fontWeight: 700,
                    fontSize: 30,
                },
            }}
        />
    );
}