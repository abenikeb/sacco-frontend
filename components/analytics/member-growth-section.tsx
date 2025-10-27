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
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	ResponsiveContainer,
} from "recharts";
import { analyticsAPI } from "@/lib/api";

interface MemberGrowthData {
	month: string;
	totalMembers: number;
	newMembers: number;
}

export function MemberGrowthSection() {
	const [data, setData] = useState<MemberGrowthData[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const result = await analyticsAPI.getMemberGrowth();
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

	return (
		<Card>
			<CardHeader>
				<CardTitle>Member Growth Trends</CardTitle>
				<CardDescription>
					Total members and new members over the last 12 months
				</CardDescription>
			</CardHeader>
			<CardContent>
				<ResponsiveContainer width="100%" height={300}>
					<LineChart data={data}>
						<CartesianGrid strokeDasharray="3 3" />
						<XAxis dataKey="month" />
						<YAxis />
						<Tooltip />
						<Legend />
						<Line
							type="monotone"
							dataKey="totalMembers"
							stroke="hsl(var(--chart-1))"
							name="Total Members"
						/>
						<Line
							type="monotone"
							dataKey="newMembers"
							stroke="hsl(var(--chart-2))"
							name="New Members"
						/>
					</LineChart>
				</ResponsiveContainer>
			</CardContent>
		</Card>
	);
}
