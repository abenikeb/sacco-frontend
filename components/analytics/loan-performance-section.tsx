"use client";

import { useEffect, useState } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { analyticsAPI } from "@/lib/api";

interface LoanPerformanceData {
	totalLoansIssued: number;
	totalLoansOutstanding: number;
	totalRepaid: number;
	activeLoans: number;
	completedLoans: number;
	defaultedLoans: number;
	portfolioAtRisk: number;
	repaymentRate: number;
}

export function LoanPerformanceSection() {
	const [data, setData] = useState<LoanPerformanceData | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const result = await analyticsAPI.getLoanPerformance();
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
	if (!data) return null;

	const formatCurrency = (value: number) => {
		return new Intl.NumberFormat("am-ET", {
			style: "currency",
			currency: "ETB",
			minimumFractionDigits: 0,
		}).format(value);
	};

	const metrics = [
		{
			label: "Total Loans Issued",
			value: formatCurrency(data.totalLoansIssued),
		},
		{
			label: "Outstanding Balance",
			value: formatCurrency(data.totalLoansOutstanding),
		},
		{ label: "Total Repaid", value: formatCurrency(data.totalRepaid) },
		{ label: "Active Loans", value: data.activeLoans },
		{ label: "Completed Loans", value: data.completedLoans },
		{ label: "Defaulted Loans", value: data.defaultedLoans },
		{
			label: "Portfolio at Risk",
			value: `${data.portfolioAtRisk.toFixed(2)}%`,
		},
		{ label: "Repayment Rate", value: `${data.repaymentRate.toFixed(2)}%` },
	];

	return (
		<Card>
			<CardHeader>
				<CardTitle>Loan Performance</CardTitle>
				<CardDescription>
					Key loan metrics and portfolio health indicators
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
					{metrics.map((metric) => (
						<div key={metric.label} className="p-4 bg-muted rounded-lg">
							<p className="text-sm text-muted-foreground">{metric.label}</p>
							<p className="text-lg font-semibold mt-2">{metric.value}</p>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}
