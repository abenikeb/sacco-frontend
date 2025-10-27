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

interface FinancialPerformanceData {
	totalRevenue: number;
	interestIncome: number;
	fees: number;
	totalExpenses: number;
	loansIssued: number;
	netIncome: number;
	profitMargin: number;
	memberDeposits: number;
	fromDate: string;
	toDate: string;
}

export function FinancialPerformanceSection() {
	const [data, setData] = useState<FinancialPerformanceData | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const result = await analyticsAPI.getFinancialPerformance();
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

	return (
		<Card>
			<CardHeader>
				<CardTitle>Financial Performance</CardTitle>
				<CardDescription>
					Period: {data.fromDate} to {data.toDate}
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="space-y-6">
					<div>
						<h3 className="font-semibold mb-3">Revenue</h3>
						<div className="grid grid-cols-3 gap-4">
							<div className="p-4 bg-green-50 rounded-lg border border-green-200">
								<p className="text-sm text-muted-foreground">Total Revenue</p>
								<p className="text-xl font-semibold mt-2 text-green-700">
									{formatCurrency(data.totalRevenue)}
								</p>
							</div>
							<div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
								<p className="text-sm text-muted-foreground">Interest Income</p>
								<p className="text-xl font-semibold mt-2 text-blue-700">
									{formatCurrency(data.interestIncome)}
								</p>
							</div>
							<div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
								<p className="text-sm text-muted-foreground">Fees</p>
								<p className="text-xl font-semibold mt-2 text-purple-700">
									{formatCurrency(data.fees)}
								</p>
							</div>
						</div>
					</div>

					<div>
						<h3 className="font-semibold mb-3">Expenses & Profitability</h3>
						<div className="grid grid-cols-3 gap-4">
							<div className="p-4 bg-red-50 rounded-lg border border-red-200">
								<p className="text-sm text-muted-foreground">Total Expenses</p>
								<p className="text-xl font-semibold mt-2 text-red-700">
									{formatCurrency(data.totalExpenses)}
								</p>
							</div>
							<div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
								<p className="text-sm text-muted-foreground">Loans Issued</p>
								<p className="text-xl font-semibold mt-2 text-orange-700">
									{formatCurrency(data.loansIssued)}
								</p>
							</div>
							<div
								className={`p-4 rounded-lg border ${
									data.netIncome >= 0
										? "bg-green-50 border-green-200"
										: "bg-red-50 border-red-200"
								}`}>
								<p className="text-sm text-muted-foreground">Net Income</p>
								<p
									className={`text-xl font-semibold mt-2 ${
										data.netIncome >= 0 ? "text-green-700" : "text-red-700"
									}`}>
									{formatCurrency(data.netIncome)}
								</p>
							</div>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="p-4 bg-muted rounded-lg">
							<p className="text-sm text-muted-foreground">Profit Margin</p>
							<p className="text-2xl font-semibold mt-2">
								{data.profitMargin.toFixed(2)}%
							</p>
						</div>
						<div className="p-4 bg-muted rounded-lg">
							<p className="text-sm text-muted-foreground">Member Deposits</p>
							<p className="text-2xl font-semibold mt-2">
								{formatCurrency(data.memberDeposits)}
							</p>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
