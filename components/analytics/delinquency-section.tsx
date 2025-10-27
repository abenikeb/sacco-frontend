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
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { analyticsAPI } from "@/lib/api";

interface DelinquentLoan {
	loanId: number;
	memberId: number;
	memberName: string;
	loanAmount: number;
	outstanding: number;
	daysOverdue: number;
	category: string;
	lastRepaymentDate: string;
}

interface DelinquencyData {
	delinquent: DelinquentLoan[];
	defaulters: DelinquentLoan[];
	totalDelinquent: number;
	totalDefaulters: number;
	delinquencyRate: number;
}

export function DelinquencySection() {
	const [data, setData] = useState<DelinquencyData | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const result = await analyticsAPI.getDelinquencyReport();
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

	const getCategoryColor = (category: string) => {
		switch (category) {
			case "DELINQUENT":
				return "bg-yellow-100 text-yellow-800";
			case "SEVERELY_DELINQUENT":
				return "bg-orange-100 text-orange-800";
			case "DEFAULTED":
				return "bg-red-100 text-red-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	const allLoans = [...data.delinquent, ...data.defaulters];

	return (
		<div className="space-y-4">
			<Card>
				<CardHeader>
					<CardTitle>Delinquency & Defaulters Report</CardTitle>
					<CardDescription>Loans overdue by more than 30 days</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-3 gap-4 mb-6">
						<div className="p-4 bg-muted rounded-lg">
							<p className="text-sm text-muted-foreground">Total Delinquent</p>
							<p className="text-2xl font-semibold mt-2">
								{data.totalDelinquent}
							</p>
						</div>
						<div className="p-4 bg-muted rounded-lg">
							<p className="text-sm text-muted-foreground">Total Defaulters</p>
							<p className="text-2xl font-semibold mt-2">
								{data.totalDefaulters}
							</p>
						</div>
						<div className="p-4 bg-muted rounded-lg">
							<p className="text-sm text-muted-foreground">Delinquency Rate</p>
							<p className="text-2xl font-semibold mt-2">
								{data.delinquencyRate.toFixed(2)}%
							</p>
						</div>
					</div>

					{allLoans.length > 0 ? (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Member Name</TableHead>
										<TableHead>Loan Amount</TableHead>
										<TableHead>Outstanding</TableHead>
										<TableHead>Days Overdue</TableHead>
										<TableHead>Status</TableHead>
										<TableHead>Last Payment</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{allLoans.map((loan) => (
										<TableRow key={loan.loanId}>
											<TableCell>{loan.memberName}</TableCell>
											<TableCell>{formatCurrency(loan.loanAmount)}</TableCell>
											<TableCell>{formatCurrency(loan.outstanding)}</TableCell>
											<TableCell>{loan.daysOverdue} days</TableCell>
											<TableCell>
												<Badge className={getCategoryColor(loan.category)}>
													{loan.category.replace(/_/g, " ")}
												</Badge>
											</TableCell>
											<TableCell>{loan.lastRepaymentDate}</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					) : (
						<p className="text-center text-muted-foreground py-8">
							No delinquent loans
						</p>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
