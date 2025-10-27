"use client";

import { useState, useEffect } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
	PieChart,
	Pie,
	Cell,
} from "recharts";
import { Download, RefreshCw, AlertCircle } from "lucide-react";
import TrialBalanceReport from "@/components/accounting/trial-balance-report";
import BalanceSheetReport from "@/components/accounting/balance-sheet-report";
import IncomeStatementReport from "@/components/accounting/income-statement-report";
import AccountingMetrics from "@/components/accounting/accounting-metrics";
import { accountingAPI } from "@/lib/api";
import JournalEntriesSection from "@/components/accounting/journal-entries-section";
import ChartOfAccountsSection from "@/components/accounting/chart-of-accounts-section";
import GeneralLedgerSection from "@/components/accounting/general-ledger-section";

export default function AccountingPage() {
	const [activeTab, setActiveTab] = useState("overview");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [trialBalance, setTrialBalance] = useState(null);
	const [balanceSheet, setBalanceSheet] = useState(null);
	const [incomeStatement, setIncomeStatement] = useState(null);
	const [accountMetrics, setAccountMetrics] = useState(null);
	const [accountDistribution, setAccountDistribution] = useState(null);
	const [journalTrend, setJournalTrend] = useState(null);

	useEffect(() => {
		fetchAccountingData();
	}, []);

	const fetchAccountingData = async () => {
		setIsLoading(true);
		setError(null);
		try {
			const [
				trialBalanceRes,
				balanceSheetRes,
				incomeStatementRes,
				metricsRes,
				distributionRes,
				trendRes,
			] = await Promise.all([
				accountingAPI.getTrialBalance(),
				accountingAPI.getBalanceSheet(),
				accountingAPI.getIncomeStatement(),
				accountingAPI.getMetrics(),
				accountingAPI.getAccountDistribution(),
				accountingAPI.getJournalTrend(),
			]);

			setTrialBalance(trialBalanceRes);
			setBalanceSheet(balanceSheetRes);
			setIncomeStatement(incomeStatementRes);
			setAccountMetrics(metricsRes);
			setAccountDistribution(distributionRes);
			setJournalTrend(trendRes);
		} catch (err: any) {
			console.error("Error fetching accounting data:", err);
			setError(err.message || "Failed to fetch accounting data");
		} finally {
			setIsLoading(false);
		}
	};

	const formatCurrency = (value: number) => {
		return new Intl.NumberFormat("am-ET", {
			style: "currency",
			currency: "ETB",
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
		}).format(value);
	};

	const handleExportReport = async (reportType: string) => {
		try {
			const response = await fetch(`/api/accounting/export/${reportType}`);
			if (response.ok) {
				const blob = await response.blob();
				const url = window.URL.createObjectURL(blob);
				const a = document.createElement("a");
				a.href = url;
				a.download = `${reportType}-${
					new Date().toISOString().split("T")[0]
				}.pdf`;
				document.body.appendChild(a);
				a.click();
				window.URL.revokeObjectURL(url);
				document.body.removeChild(a);
			}
		} catch (error) {
			console.error("Error exporting report:", error);
		}
	};

	return (
		<main className="min-h-screen bg-background">
			{/* Header */}
			<div className="border-b border-border bg-card">
				<div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
					<div className="flex items-center justify-between">
						<div>
							<h1 className="text-3xl font-bold text-foreground">
								Accounting & Finance
							</h1>
							<p className="mt-2 text-muted-foreground">
								Manage financial operations and generate reports
							</p>
						</div>
						<Button
							onClick={fetchAccountingData}
							disabled={isLoading}
							variant="outline"
							className="gap-2 bg-transparent">
							<RefreshCw
								className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
							/>
							Refresh
						</Button>
					</div>
				</div>
			</div>

			{/* Main Content */}
			<div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
				{/* Error Alert */}
				{error && (
					<Card className="mb-6 border-red-200 bg-red-50">
						<CardContent className="flex items-center gap-3 pt-6">
							<AlertCircle className="h-5 w-5 text-red-600" />
							<p className="text-sm text-red-800">{error}</p>
						</CardContent>
					</Card>
				)}

				{/* Metrics Overview */}
				{accountMetrics && (
					<AccountingMetrics
						metrics={accountMetrics}
						formatCurrency={formatCurrency}
					/>
				)}

				{/* Tabs */}
				<Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
					<TabsList className="grid w-full grid-cols-7">
						<TabsTrigger value="overview">Overview</TabsTrigger>
						<TabsTrigger value="trial-balance">Trial Balance</TabsTrigger>
						<TabsTrigger value="balance-sheet">Balance Sheet</TabsTrigger>
						<TabsTrigger value="income-statement">Income Statement</TabsTrigger>
						<TabsTrigger value="journal-entries">Journal Entries</TabsTrigger>
						<TabsTrigger value="chart-of-accounts">
							Chart of Accounts
						</TabsTrigger>
						<TabsTrigger value="general-ledger">General Ledger</TabsTrigger>
					</TabsList>

					{/* Overview Tab */}
					<TabsContent value="overview" className="space-y-6">
						<div className="grid gap-6 md:grid-cols-2">
							{/* Account Distribution */}
							<Card>
								<CardHeader>
									<CardTitle>Account Distribution by Type</CardTitle>
									<CardDescription>
										Breakdown of accounts across categories
									</CardDescription>
								</CardHeader>
								<CardContent>
									{accountDistribution &&
									(accountDistribution as any).length > 0 ? (
										<ResponsiveContainer width="100%" height={300}>
											<PieChart>
												<Pie
													data={accountDistribution}
													cx="50%"
													cy="50%"
													labelLine={false}
													label={({ type, count }) => `${type}: ${count}`}
													outerRadius={80}
													fill="#8884d8"
													dataKey="count">
													<Cell fill="hsl(var(--chart-1))" />
													<Cell fill="hsl(var(--chart-2))" />
													<Cell fill="hsl(var(--chart-3))" />
													<Cell fill="hsl(var(--chart-4))" />
													<Cell fill="hsl(var(--chart-5))" />
												</Pie>
												<Tooltip />
											</PieChart>
										</ResponsiveContainer>
									) : (
										<p className="text-center text-muted-foreground">
											No account data available
										</p>
									)}
								</CardContent>
							</Card>

							{/* Recent Transactions */}
							<Card>
								<CardHeader>
									<CardTitle>Journal Entries Trend</CardTitle>
									<CardDescription>Last 7 days activity</CardDescription>
								</CardHeader>
								<CardContent>
									{journalTrend && (journalTrend as any).length > 0 ? (
										<ResponsiveContainer width="100%" height={300}>
											<LineChart data={journalTrend}>
												<CartesianGrid
													strokeDasharray="3 3"
													stroke="hsl(var(--border))"
												/>
												<XAxis
													dataKey="day"
													stroke="hsl(var(--muted-foreground))"
												/>
												<YAxis stroke="hsl(var(--muted-foreground))" />
												<Tooltip />
												<Line
													type="monotone"
													dataKey="entries"
													stroke="hsl(var(--chart-1))"
													strokeWidth={2}
													dot={{ fill: "hsl(var(--chart-1))" }}
												/>
											</LineChart>
										</ResponsiveContainer>
									) : (
										<p className="text-center text-muted-foreground">
											No journal entry data available
										</p>
									)}
								</CardContent>
							</Card>
						</div>

						{/* Quick Actions */}
						<Card>
							<CardHeader>
								<CardTitle>Quick Actions</CardTitle>
								<CardDescription>
									Generate and export financial reports
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
									<Button
										onClick={() => handleExportReport("trial-balance")}
										variant="outline"
										className="gap-2">
										<Download className="h-4 w-4" />
										Trial Balance
									</Button>
									<Button
										onClick={() => handleExportReport("balance-sheet")}
										variant="outline"
										className="gap-2">
										<Download className="h-4 w-4" />
										Balance Sheet
									</Button>
									<Button
										onClick={() => handleExportReport("income-statement")}
										variant="outline"
										className="gap-2">
										<Download className="h-4 w-4" />
										Income Statement
									</Button>
									<Button
										onClick={() => handleExportReport("general-ledger")}
										variant="outline"
										className="gap-2">
										<Download className="h-4 w-4" />
										General Ledger
									</Button>
								</div>
							</CardContent>
						</Card>
					</TabsContent>

					{/* Trial Balance Tab */}
					<TabsContent value="trial-balance">
						<TrialBalanceReport
							data={trialBalance}
							formatCurrency={formatCurrency}
						/>
					</TabsContent>

					{/* Balance Sheet Tab */}
					<TabsContent value="balance-sheet">
						<BalanceSheetReport
							data={balanceSheet}
							formatCurrency={formatCurrency}
						/>
					</TabsContent>

					{/* Income Statement Tab */}
					<TabsContent value="income-statement">
						<IncomeStatementReport
							data={incomeStatement}
							formatCurrency={formatCurrency}
						/>
					</TabsContent>

					{/* Journal Entries Tab */}
					<TabsContent value="journal-entries">
						<JournalEntriesSection formatCurrency={formatCurrency} />
					</TabsContent>

					{/* Chart of Accounts Tab */}
					<TabsContent value="chart-of-accounts">
						<ChartOfAccountsSection formatCurrency={formatCurrency} />
					</TabsContent>

					{/* General Ledger Tab */}
					<TabsContent value="general-ledger">
						<GeneralLedgerSection formatCurrency={formatCurrency} />
					</TabsContent>
				</Tabs>
			</div>
		</main>
	);
}
