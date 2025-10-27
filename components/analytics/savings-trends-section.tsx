"use client";

import { useEffect, useState } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	AreaChart,
	Area,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	ResponsiveContainer,
} from "recharts";
import { analyticsAPI } from "@/lib/api";

interface SavingsTrendData {
	month: string;
	totalSavings: number;
	transactionCount: number;
}

export function SavingsTrendsSection() {
	const [data, setData] = useState<SavingsTrendData[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const result = await analyticsAPI.getSavingsTrends();
				setData(result);
			} catch (err) {
				setError((err as Error).message);
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, []);

	if (loading) return <div className="text-center py-8">Loading...</div>;
	if (error) return <div className="text-red-500 py-8">Error: {error}</div>;

	const formatCurrency = (value: number) => {
		return new Intl.NumberFormat("am-ET", {
			style: "currency",
			currency: "ETB",
			minimumFractionDigits: 0,
		}).format(value);
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Savings Trends</CardTitle>
				<CardDescription>
					Total savings and transaction count over the last 12 months
				</CardDescription>
			</CardHeader>
			<CardContent>
				<ResponsiveContainer width="100%" height={300}>
					<AreaChart data={data}>
						<CartesianGrid strokeDasharray="3 3" />
						<XAxis dataKey="month" />
						<YAxis />
						<Tooltip formatter={(value) => formatCurrency(value as number)} />
						<Legend />
						<Area
							type="monotone"
							dataKey="totalSavings"
							fill="hsl(var(--chart-3))"
							stroke="hsl(var(--chart-3))"
							name="Total Savings"
						/>
					</AreaChart>
				</ResponsiveContainer>
			</CardContent>
		</Card>
	);
}
