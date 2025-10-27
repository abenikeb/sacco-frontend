"use client";

import { useState, useEffect } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { accountingAPI } from "@/lib/api";

interface GeneralLedgerProps {
	formatCurrency: (value: number) => string;
}

export default function GeneralLedgerSection({
	formatCurrency,
}: GeneralLedgerProps) {
	const [summary, setSummary] = useState<any[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [fromDate, setFromDate] = useState("");
	const [toDate, setToDate] = useState("");
	const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
	const [ledgerDetail, setLedgerDetail] = useState<any>(null);
	const [isLoadingDetail, setIsLoadingDetail] = useState(false);

	useEffect(() => {
		fetchGeneralLedgerSummary();
	}, []);

	const fetchGeneralLedgerSummary = async () => {
		setIsLoading(true);
		setError(null);
		try {
			const result = await accountingAPI.getGeneralLedgerSummary(
				fromDate || undefined,
				toDate || undefined
			);
			setSummary(result.summary || []);
		} catch (err: any) {
			console.error("Error fetching general ledger summary:", err);
			setError(err.message || "Failed to fetch general ledger summary");
		} finally {
			setIsLoading(false);
		}
	};

	const handleFilter = () => {
		fetchGeneralLedgerSummary();
	};

	const handleViewDetail = async (accountCode: string) => {
		setSelectedAccount(accountCode);
		setIsLoadingDetail(true);
		try {
			const result = await accountingAPI.getGeneralLedger(
				accountCode,
				fromDate || undefined,
				toDate || undefined
			);
			setLedgerDetail(result);
		} catch (err: any) {
			console.error("Error fetching ledger detail:", err);
			setError(err.message || "Failed to fetch ledger detail");
		} finally {
			setIsLoadingDetail(false);
		}
	};

	return (
		<div className="space-y-6">
			{/* Summary View */}
			<Card>
				<CardHeader>
					<CardTitle>General Ledger Summary</CardTitle>
					<CardDescription>
						Account balances and transaction summary
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{/* Filters */}
					<div className="flex gap-2 flex-wrap">
						<Input
							type="date"
							value={fromDate}
							onChange={(e) => setFromDate(e.target.value)}
							placeholder="From Date"
							className="w-40"
						/>
						<Input
							type="date"
							value={toDate}
							onChange={(e) => setToDate(e.target.value)}
							placeholder="To Date"
							className="w-40"
						/>
						<Button
							onClick={handleFilter}
							disabled={isLoading}
							variant="outline">
							Filter
						</Button>
					</div>

					{error && (
						<div className="text-sm text-red-600 bg-red-50 p-3 rounded">
							{error}
						</div>
					)}

					{isLoading ? (
						<div className="flex items-center justify-center py-8">
							<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
						</div>
					) : summary.length === 0 ? (
						<div className="text-center py-8 text-muted-foreground">
							No ledger entries found
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full text-sm">
								<thead>
									<tr className="border-b bg-muted/50">
										<th className="text-left py-3 px-4 font-semibold">
											Account Code
										</th>
										<th className="text-left py-3 px-4 font-semibold">
											Account Name
										</th>
										<th className="text-left py-3 px-4 font-semibold">Type</th>
										<th className="text-right py-3 px-4 font-semibold">
											Debit
										</th>
										<th className="text-right py-3 px-4 font-semibold">
											Credit
										</th>
										<th className="text-right py-3 px-4 font-semibold">
											Balance
										</th>
										<th className="text-center py-3 px-4 font-semibold">
											Entries
										</th>
										<th className="text-center py-3 px-4 font-semibold">
											Action
										</th>
									</tr>
								</thead>
								<tbody>
									{summary.map((account, idx) => (
										<tr key={idx} className="border-b hover:bg-muted/30">
											<td className="py-3 px-4 font-medium">
												{account.accountCode}
											</td>
											<td className="py-3 px-4">{account.accountName}</td>
											<td className="py-3 px-4">
												<span className="text-xs bg-muted px-2 py-1 rounded">
													{account.accountType}
												</span>
											</td>
											<td className="text-right py-3 px-4">
												{formatCurrency(account.totalDebit)}
											</td>
											<td className="text-right py-3 px-4">
												{formatCurrency(account.totalCredit)}
											</td>
											<td className="text-right py-3 px-4 font-semibold">
												{formatCurrency(account.balance)}
											</td>
											<td className="text-center py-3 px-4">
												{account.entryCount}
											</td>
											<td className="text-center py-3 px-4">
												<Button
													onClick={() => handleViewDetail(account.accountCode)}
													variant="ghost"
													size="sm"
													disabled={isLoadingDetail}>
													View
												</Button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Detail View */}
			{ledgerDetail && (
				<Card>
					<CardHeader>
						<CardTitle>
							Ledger Detail: {ledgerDetail.accountCode} -{" "}
							{ledgerDetail.accountName}
						</CardTitle>
						<CardDescription>
							Period: {new Date(ledgerDetail.fromDate).toLocaleDateString()} to{" "}
							{new Date(ledgerDetail.toDate).toLocaleDateString()}
						</CardDescription>
					</CardHeader>
					<CardContent>
						{isLoadingDetail ? (
							<div className="flex items-center justify-center py-8">
								<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
							</div>
						) : ledgerDetail.entries?.length === 0 ? (
							<div className="text-center py-8 text-muted-foreground">
								No entries for this account
							</div>
						) : (
							<div className="overflow-x-auto">
								<table className="w-full text-sm">
									<thead>
										<tr className="border-b bg-muted/50">
											<th className="text-left py-3 px-4 font-semibold">
												Date
											</th>
											<th className="text-left py-3 px-4 font-semibold">
												Description
											</th>
											<th className="text-right py-3 px-4 font-semibold">
												Debit
											</th>
											<th className="text-right py-3 px-4 font-semibold">
												Credit
											</th>
											<th className="text-right py-3 px-4 font-semibold">
												Balance
											</th>
										</tr>
									</thead>
									<tbody>
										{ledgerDetail.entries?.map((entry: any, idx: number) => (
											<tr key={idx} className="border-b hover:bg-muted/30">
												<td className="py-3 px-4">
													{new Date(entry.transactionDate).toLocaleDateString()}
												</td>
												<td className="py-3 px-4">
													{entry.description || "-"}
												</td>
												<td className="text-right py-3 px-4">
													{entry.debit > 0
														? formatCurrency(Number(entry.debit))
														: "-"}
												</td>
												<td className="text-right py-3 px-4">
													{entry.credit > 0
														? formatCurrency(Number(entry.credit))
														: "-"}
												</td>
												<td className="text-right py-3 px-4 font-semibold">
													{formatCurrency(entry.runningBalance)}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						)}
					</CardContent>
				</Card>
			)}
		</div>
	);
}
