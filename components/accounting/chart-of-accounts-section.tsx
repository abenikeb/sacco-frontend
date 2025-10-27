"use client";

import { useState, useEffect } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { accountingAPI } from "@/lib/api";

interface ChartOfAccountsProps {
	formatCurrency: (value: number) => string;
}

export default function ChartOfAccountsSection({
	formatCurrency,
}: ChartOfAccountsProps) {
	const [accounts, setAccounts] = useState<any[]>([]);
	const [grouped, setGrouped] = useState<Record<string, any[]>>({});
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		fetchChartOfAccounts();
	}, []);

	const fetchChartOfAccounts = async () => {
		setIsLoading(true);
		setError(null);
		try {
			const result = await accountingAPI.getChartOfAccounts(true);
			setAccounts(result.accounts || []);
			setGrouped(result.grouped || {});
		} catch (err: any) {
			console.error("Error fetching chart of accounts:", err);
			setError(err.message || "Failed to fetch chart of accounts");
		} finally {
			setIsLoading(false);
		}
	};

	const getAccountTypeColor = (type: string) => {
		const colors: Record<string, string> = {
			ASSET: "bg-blue-100 text-blue-800",
			LIABILITY: "bg-red-100 text-red-800",
			EQUITY: "bg-green-100 text-green-800",
			INCOME: "bg-emerald-100 text-emerald-800",
			REVENUE: "bg-emerald-100 text-emerald-800",
			EXPENSE: "bg-orange-100 text-orange-800",
		};
		return colors[type] || "bg-gray-100 text-gray-800";
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Chart of Accounts</CardTitle>
				<CardDescription>
					Complete list of all active accounts organized by type
				</CardDescription>
			</CardHeader>
			<CardContent>
				{error && (
					<div className="text-sm text-red-600 bg-red-50 p-3 rounded mb-4">
						{error}
					</div>
				)}

				{isLoading ? (
					<div className="flex items-center justify-center py-8">
						<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
					</div>
				) : accounts.length === 0 ? (
					<div className="text-center py-8 text-muted-foreground">
						No accounts found
					</div>
				) : (
					<div className="space-y-6">
						{Object.entries(grouped).map(([type, typeAccounts]) => (
							<div key={type}>
								<h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
									{type}
									<Badge className={getAccountTypeColor(type)}>
										{typeAccounts.length}
									</Badge>
								</h3>
								<div className="grid gap-2">
									{typeAccounts.map((account) => (
										<div
											key={account.id}
											className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
											<div>
												<p className="font-medium text-sm">{account.code}</p>
												<p className="text-sm text-muted-foreground">
													{account.name}
												</p>
											</div>
											<Badge variant="outline">
												{account.isActive ? "Active" : "Inactive"}
											</Badge>
										</div>
									))}
								</div>
							</div>
						))}
					</div>
				)}

				<div className="mt-6 pt-4 border-t">
					<p className="text-sm text-muted-foreground">
						Total Accounts:{" "}
						<span className="font-semibold">{accounts.length}</span>
					</p>
				</div>
			</CardContent>
		</Card>
	);
}
