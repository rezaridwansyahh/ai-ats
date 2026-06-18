import { TrendingUp } from "lucide-react"
import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

export const description = "A radar chart with dots"

const chartConfig = {
  score: {
    label: "Score",
    color: "var(--chart-1)",
  },
}

export function ChartRadarDots({ data }) {
  console.log(Object.keys(data).length === 0)
  if(Object.keys(data).length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className='flex items-center'>
          <span className="text-muted-foreground italic">No Data</span>
        </div>
      </div>
      
    )
  }

  const chartData = Object.entries(data)
  .filter(([key]) => key.endsWith('_score') && key !== 'overall_score')
  .map(([key, value]) => ({
    name: key.replace('_score', ''),
    score: value
  }));

  return (
    <ChartContainer
      config={chartConfig}
      className="mx-auto max-h-[250px]"
    >
      <RadarChart 
        data={chartData}
      >
        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
        <PolarAngleAxis 
          dataKey="name" 
          tick={{
            fontSize: 11,
            fontWeight: 500,
            color: 'black'
          }}
        />
        <PolarGrid />
        <Radar
          dataKey="score"
          fill="var(--color-score)"
          fillOpacity={0.6}
          dot={{
            r: 4,
            fillOpacity: 1,
          }}
        />
      </RadarChart>
    </ChartContainer>
  )
}
