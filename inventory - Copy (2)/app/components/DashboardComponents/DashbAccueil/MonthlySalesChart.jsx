"use client";

import { TrendingUp } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  RadialBarChart,
  RadialBar,
  PolarRadiusAxis,
  Label,
  ResponsiveContainer,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const chartData = [
  { name: "Desktop", value: 1260, fill: "hsl(var(--chart-1))" },
  { name: "Mobile", value: 570, fill: "hsl(var(--chart-2))" },
];

const chartConfig = {
  desktop: { label: "Desktop", color: "hsl(var(--chart-1))" },
  mobile: { label: "Mobile", color: "hsl(var(--chart-2))" },
};

export function MonthlySalesChart() {
  const totalVisitors = chartData.reduce((sum, data) => sum + data.value, 0);

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Radial Chart - Stacked</CardTitle>
        <CardDescription>January - June 2024</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 items-center pb-0">
        <ChartContainer config={chartConfig} className="w-full">
          <ResponsiveContainer width="100%" height={200}>
            <RadialBarChart
              data={chartData}
              innerRadius="65%"
              outerRadius="95%"
              startAngle={180}
              endAngle={0}
            >
              <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      return (
                        <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle">
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) - 12}
                            className="fill-foreground text-2xl font-bold"
                          >
                            {totalVisitors.toLocaleString()}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 6}
                            className="fill-muted-foreground text-sm"
                          >
                            Visitors
                          </tspan>
                        </text>
                      );
                    }
                  }}
                />
              </PolarRadiusAxis>
              <RadialBar dataKey="value" cornerRadius={5} stroke="transparent" strokeWidth={2} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            </RadialBarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex flex-col gap-0 text-sm text-center mt-[-10px]">
        <div className="flex items-center gap-1 font-medium leading-none">
          Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground text-xs">
          Showing total visitors for the last 6 months
        </div>
      </CardFooter>
    </Card>
  );
}
