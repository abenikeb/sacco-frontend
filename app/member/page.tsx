"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { AreaChart, LineChart, PieChart } from "@/components/ui/chart";
import {
	CreditCard,
	DollarSign,
	PiggyBank,
	RefreshCw,
	TrendingUp,
	Receipt,
	CreditCardIcon,
	ChevronRight,
	Calendar,
	ArrowUpRight,
	ArrowDownRight,
	Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { membersAPI } from "@/lib/api";

interface MemberData {
	name: string;
	totalSavings: number;
	totalContributions: number;
	totalLoanRepayment: number;
	totalMembershipFee: number;
	totalWillingDeposit: number;
	totalRegistrationFee: number;
	totalCostOfShare: number;
	activeLoans: number;
	totalLoanAmount: number;
	nextPayment: {
		amount: number;
		repaymentDate: string;
	} | null;
	lastSavingsAmount: number;
	lastContributionAmount: number;
	savingsHistory: Array<{ date: string; amount: number }>;
	loanRepaymentHistory: Array<{ date: string; amount: number }>;
	transactionsByType: Record<string, number>;
	loanRepaymentProgress: Array<{
		loanId: number;
		loanAmount: number;
		totalRepaid: number;
		remainingAmount: number;
		progress: number;
	}>;
	loans: Array<{
		id: number;
		amount: number;
		loanRepayments: Array<{
			repaymentDate: string;
			amount: number;
			status: string;
		}>;
	}>;
	transactions: Array<{
		transactionDate: string;
		amount: number;
		type: string;
	}>;
}

// Animation variants
const containerVariants = {
	hidden: { opacity: 0 },
	show: {
		opacity: 1,
		transition: {
			staggerChildren: 0.1,
		},
	},
};

const itemVariants = {
	hidden: { y: 20, opacity: 0 },
	show: {
		y: 0,
		opacity: 1,
		transition: {
			type: "spring",
			stiffness: 260,
			damping: 20,
		},
	},
};

const fadeInVariants = {
	hidden: { opacity: 0 },
	show: {
		opacity: 1,
		transition: { duration: 0.5 },
	},
};

export default function MemberDashboardPage() {
	const { user } = useAuth();
	const [memberData, setMemberData] = useState<MemberData | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [timeRange, setTimeRange] = useState("all");
	const [activeTab, setActiveTab] = useState("overview");

	const fetchMemberData = async () => {
		if (!user?.etNumber) return;

		try {
			// Add timestamp to prevent caching
			const timestamp = new Date().getTime();
			// const response = await fetch(
			// 	`/api/members/${user["user"].etNumber}?include=transactions&t=${timestamp}`,
			// 	{
			// 		cache: "no-store",
			// 		headers: {
			// 			"Cache-Control": "no-cache, no-store, must-revalidate",
			// 			"Pragma": "no-cache",
			// 			"Expires": "0",
			// 		},
			// 	}
			// );

			// if (!response.ok) {
			// 	throw new Error("Failed to fetch member data");
			// }

			// const data = await response.json();
			const data = await membersAPI.getMember(user?.etNumber);
			setMemberData(data.member);
			setError(null);
		} catch (err) {
			setError("Failed to load member data");
			console.error(err);
		} finally {
			setIsLoading(false);
			setIsRefreshing(false);
		}
	};

	const handleRefresh = () => {
		setIsRefreshing(true);
		fetchMemberData();
	};

	useEffect(() => {
		fetchMemberData();

		// Set up polling interval (every 5 minutes)
		const intervalId = setInterval(() => {
			fetchMemberData();
		}, 5 * 60 * 1000);

		// Clean up interval on component unmount
		return () => clearInterval(intervalId);
	}, [user]);

	const formatCurrency = (amount: number) => {
		return `ETB ${Number(amount).toFixed(2)}`;
	};

	const filterTransactionsByTimeRange = (transactions: any[]) => {
		if (timeRange === "all") return transactions;

		const now = new Date();
		const startDate = new Date();

		switch (timeRange) {
			case "week":
				startDate.setDate(now.getDate() - 7);
				break;
			case "month":
				startDate.setMonth(now.getMonth() - 1);
				break;
			case "quarter":
				startDate.setMonth(now.getMonth() - 3);
				break;
			case "year":
				startDate.setFullYear(now.getFullYear() - 1);
				break;
			default:
				return transactions;
		}

		return transactions.filter((t) => new Date(t.name) >= startDate);
	};

	// Prepare chart data from savingsHistory
	const savingsChartData =
		memberData?.savingsHistory.map((item) => ({
			name: item.date.split("T")[0],
			amount: Number(item.amount),
		})) || [];

	const loanRepaymentChartData =
		memberData?.loanRepaymentHistory.map((item) => ({
			name: item.date.split("T")[0],
			amount: Number(item.amount),
		})) || [];

	const loanRepaymentData =
		memberData?.loans[0]?.loanRepayments.map((repayment) => ({
			name: repayment.repaymentDate.split("T")[0],
			amount: Number(repayment.amount),
			status: repayment.status,
		})) || [];

	// Prepare pie chart data
	const pieChartData = memberData?.transactionsByType
		? Object.entries(memberData.transactionsByType)
				.filter(([_, amount]) => amount > 0) // Filter out zero values
				.map(([type, amount]) => ({
					name: type
						.replace(/_/g, " ")
						.toLowerCase()
						.split(" ")
						.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
						.join(" "),
					value: amount,
				}))
		: [];

	// Filter chart data based on time range
	const filteredSavingsData = filterTransactionsByTimeRange(savingsChartData);
	const filteredLoanRepaymentData = filterTransactionsByTimeRange(
		loanRepaymentChartData
	);
	const filteredLoanData = filterTransactionsByTimeRange(loanRepaymentData);

	// Get trend icon
	const getTrendIcon = (current: number, previous: number) => {
		if (current > previous) {
			return <ArrowUpRight className="h-3 w-3 text-green-500" />;
		} else if (current < previous) {
			return <ArrowDownRight className="h-3 w-3 text-red-500" />;
		}
		return null;
	};

	// Define chart colors
	const chartColors = [
		"#3b82f6", // blue-500
		"#10b981", // emerald-500
		"#f59e0b", // amber-500
		"#8b5cf6", // violet-500
		"#ef4444", // red-500
		"#6366f1", // indigo-500
		"#ec4899", // pink-500
		"#14b8a6", // teal-500
	];

	if (!user) {
		return <div>Loading... </div>;
	}

	if (isLoading) {
		return (
			<div className="flex flex-col gap-5 animate-pulse">
				<Skeleton className="h-10 w-3/4 max-w-md" />

				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
					{[1, 2, 3, 4].map((i) => (
						<Card key={i} className="overflow-hidden">
							<CardHeader className="pb-2">
								<Skeleton className="h-4 w-1/2" />
							</CardHeader>
							<CardContent>
								<Skeleton className="h-8 w-1/3 mb-2" />
								<Skeleton className="h-4 w-2/3" />
							</CardContent>
						</Card>
					))}
				</div>

				<div className="grid gap-4 md:grid-cols-2">
					{[1, 2].map((i) => (
						<Card key={i}>
							<CardHeader>
								<Skeleton className="h-6 w-1/3 mb-2" />
								<Skeleton className="h-4 w-1/2" />
							</CardHeader>
							<CardContent>
								<Skeleton className="h-[300px] w-full" />
							</CardContent>
						</Card>
					))}
				</div>

				<div className="grid gap-4 md:grid-cols-2">
					{[1, 2].map((i) => (
						<Card key={i}>
							<CardHeader>
								<Skeleton className="h-6 w-1/3 mb-2" />
								<Skeleton className="h-4 w-1/2" />
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									{[1, 2, 3].map((j) => (
										<div key={j} className="flex justify-between">
											<div>
												<Skeleton className="h-4 w-20 mb-1" />
												<Skeleton className="h-3 w-16" />
											</div>
											<Skeleton className="h-4 w-16" />
										</div>
									))}
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			</div>
		);
	}

	if (error || !memberData) {
		return (
			<motion.div
				initial={{ opacity: 0, scale: 0.95 }}
				animate={{ opacity: 1, scale: 1 }}
				transition={{ duration: 0.3 }}>
				<Card className="border-red-200 bg-red-50 shadow-lg">
					<CardHeader>
						<CardTitle className="text-red-700 flex items-center gap-2">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								className="h-6 w-6"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor">
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
								/>
							</svg>
							Error Loading Dashboard
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-red-600 mb-4">
							{error || "Failed to load member data"}
						</p>
						<Button
							onClick={handleRefresh}
							variant="outline"
							className="bg-white hover:bg-red-50 border-red-200 text-red-700 hover:text-red-800">
							<RefreshCw className="mr-2 h-4 w-4" />
							Try Again
						</Button>
					</CardContent>
				</Card>
			</motion.div>
		);
	}

	return (
		<motion.div
			className="flex flex-col gap-5"
			variants={containerVariants}
			initial="hidden"
			animate="show">
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
				<motion.div variants={itemVariants}>
					<h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent">
						Welcome, {memberData.name}
					</h1>
					<p className="text-gray-500 text-sm md:text-base">
						Your financial dashboard
					</p>
				</motion.div>

				<motion.div
					variants={itemVariants}
					className="flex items-center gap-2 self-end sm:self-auto">
					<Select value={timeRange} onValueChange={setTimeRange}>
						<SelectTrigger className="w-[130px] md:w-[180px] h-9 text-sm">
							<Calendar className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
							<SelectValue placeholder="Select time range" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Time</SelectItem>
							<SelectItem value="week">Last Week</SelectItem>
							<SelectItem value="month">Last Month</SelectItem>
							<SelectItem value="quarter">Last Quarter</SelectItem>
							<SelectItem value="year">Last Year</SelectItem>
						</SelectContent>
					</Select>

					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="outline"
									size="icon"
									onClick={handleRefresh}
									disabled={isRefreshing}
									aria-label="Refresh dashboard data"
									className="h-9 w-9 relative overflow-hidden">
									<RefreshCw
										className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
									/>
									{isRefreshing && (
										<span className="absolute bottom-0 left-0 h-0.5 bg-blue-500 animate-progress"></span>
									)}
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								<p>Refresh dashboard data</p>
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				</motion.div>
			</div>

			<Tabs
				defaultValue="overview"
				value={activeTab}
				onValueChange={setActiveTab}
				className="w-full">
				<motion.div variants={itemVariants}>
					<TabsList className="w-full grid grid-cols-3 h-11 mb-4 bg-muted/60 p-1 rounded-lg">
						<TabsTrigger
							value="overview"
							className="rounded-md data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all">
							Overview
						</TabsTrigger>
						<TabsTrigger
							value="financial"
							className="rounded-md data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all">
							Financial
						</TabsTrigger>
						<TabsTrigger
							value="loans"
							className="rounded-md data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all">
							Loans
						</TabsTrigger>
					</TabsList>
				</motion.div>

				{/* Overview Tab */}
				<TabsContent value="overview" className="mt-0 space-y-4">
					<div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
						<motion.div variants={itemVariants}>
							<Card className="overflow-hidden border-t-4 border-t-green-500 hover:shadow-md transition-all duration-300 hover:translate-y-[-2px]">
								<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-green-50 to-transparent">
									<CardTitle className="text-sm font-medium">
										Total Savings
									</CardTitle>
									<div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
										<PiggyBank className="h-4 w-4 text-green-500" />
									</div>
								</CardHeader>
								<CardContent>
									<div className="text-2xl font-bold">
										{formatCurrency(memberData.totalSavings)}
									</div>
									<div className="flex items-center text-xs text-muted-foreground mt-1">
										<span>
											+{formatCurrency(memberData.lastSavingsAmount)} last
											deposit
										</span>
										{getTrendIcon(
											memberData.lastSavingsAmount,
											memberData.lastSavingsAmount * 0.8
										)}
									</div>
								</CardContent>
							</Card>
						</motion.div>

						<motion.div variants={itemVariants}>
							<Card className="overflow-hidden border-t-4 border-t-blue-500 hover:shadow-md transition-all duration-300 hover:translate-y-[-2px]">
								<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-blue-50 to-transparent">
									<CardTitle className="text-sm font-medium">
										Active Loans
									</CardTitle>
									<div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
										<CreditCard className="h-4 w-4 text-blue-500" />
									</div>
								</CardHeader>
								<CardContent>
									<div className="text-2xl font-bold">
										{memberData.activeLoans}
									</div>
									<div className="flex items-center text-xs text-muted-foreground mt-1">
										<span>
											Total: {formatCurrency(memberData.totalLoanAmount)}
										</span>
									</div>
								</CardContent>
							</Card>
						</motion.div>

						<motion.div variants={itemVariants}>
							<Card className="overflow-hidden border-t-4 border-t-purple-500 hover:shadow-md transition-all duration-300 hover:translate-y-[-2px]">
								<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-purple-50 to-transparent">
									<CardTitle className="text-sm font-medium">
										Total Contributions
									</CardTitle>
									<div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
										<DollarSign className="h-4 w-4 text-purple-500" />
									</div>
								</CardHeader>
								<CardContent>
									<div className="text-2xl font-bold">
										{formatCurrency(memberData.totalContributions)}
									</div>
									<div className="flex items-center text-xs text-muted-foreground mt-1">
										<span>
											+{formatCurrency(memberData.lastContributionAmount)} last
											contribution
										</span>
										{getTrendIcon(
											memberData.lastContributionAmount,
											memberData.lastContributionAmount * 0.9
										)}
									</div>
								</CardContent>
							</Card>
						</motion.div>

						<motion.div variants={itemVariants}>
							<Card className="overflow-hidden border-t-4 border-t-amber-500 hover:shadow-md transition-all duration-300 hover:translate-y-[-2px]">
								<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-amber-50 to-transparent">
									<CardTitle className="text-sm font-medium">
										Next Payment
									</CardTitle>
									<div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
										<TrendingUp className="h-4 w-4 text-amber-500" />
									</div>
								</CardHeader>
								<CardContent>
									<div className="text-2xl font-bold">
										{memberData.nextPayment
											? formatCurrency(memberData.nextPayment.amount)
											: "No pending payments"}
									</div>
									<p className="text-xs text-muted-foreground mt-1">
										{memberData.nextPayment
											? `Due on ${
													memberData.nextPayment.repaymentDate.split("T")[0]
											  }`
											: "N/A"}
									</p>
								</CardContent>
							</Card>
						</motion.div>
					</div>

					<div className="grid gap-4 md:grid-cols-2">
						<motion.div variants={itemVariants}>
							<Card className="hover:shadow-md transition-all duration-300 hover:translate-y-[-2px] overflow-hidden">
								<CardHeader className="bg-gradient-to-r from-green-50 to-transparent pb-2">
									<div className="flex justify-between items-center">
										<div>
											<CardTitle>Savings Growth</CardTitle>
											<CardDescription>Your savings over time</CardDescription>
										</div>
										<Badge variant="outline" className="bg-white">
											<Filter className="h-3 w-3 mr-1" />
											{timeRange === "all"
												? "All Time"
												: `Last ${
														timeRange.charAt(0).toUpperCase() +
														timeRange.slice(1)
												  }`}
										</Badge>
									</div>
								</CardHeader>
								<CardContent className="px-2 pt-4">
									{filteredSavingsData.length > 0 ? (
										<AreaChart
											data={filteredSavingsData}
											index="name"
											categories={["amount"]}
											colors={["#10b981"]} // emerald-500
											valueFormatter={(value) => formatCurrency(value)}
											className="h-[250px] md:h-[300px]"
										/>
									) : (
										<div className="flex items-center justify-center h-[250px] md:h-[300px] bg-muted/20 rounded-md">
											<p className="text-muted-foreground">
												No savings data available for the selected period
											</p>
										</div>
									)}
								</CardContent>
							</Card>
						</motion.div>

						<motion.div variants={itemVariants}>
							<Card className="hover:shadow-md transition-all duration-300 hover:translate-y-[-2px] overflow-hidden">
								<CardHeader className="bg-gradient-to-r from-blue-50 to-transparent pb-2">
									<div className="flex justify-between items-center">
										<div>
											<CardTitle>Loan Repayment Schedule</CardTitle>
											<CardDescription>
												Your loan repayment progress
											</CardDescription>
										</div>
										<Badge variant="outline" className="bg-white">
											<Filter className="h-3 w-3 mr-1" />
											{timeRange === "all"
												? "All Time"
												: `Last ${
														timeRange.charAt(0).toUpperCase() +
														timeRange.slice(1)
												  }`}
										</Badge>
									</div>
								</CardHeader>
								<CardContent className="px-2 pt-4">
									{filteredLoanData.length > 0 ? (
										<LineChart
											data={filteredLoanData}
											index="name"
											categories={["amount"]}
											colors={["#3b82f6"]} // blue-500
											valueFormatter={(value) => formatCurrency(value)}
											className="h-[250px] md:h-[300px]"
										/>
									) : (
										<div className="flex items-center justify-center h-[250px] md:h-[300px] bg-muted/20 rounded-md">
											<p className="text-muted-foreground">
												No loan repayment data available for the selected period
											</p>
										</div>
									)}
								</CardContent>
							</Card>
						</motion.div>
					</div>

					<div className="grid gap-4 md:grid-cols-2">
						<motion.div variants={itemVariants}>
							<Card className="hover:shadow-md transition-all duration-300 hover:translate-y-[-2px] overflow-hidden">
								<CardHeader className="bg-gradient-to-r from-indigo-50 to-transparent pb-2">
									<CardTitle>Quick Actions</CardTitle>
									<CardDescription>
										Common tasks you might want to perform
									</CardDescription>
								</CardHeader>
								<CardContent className="pt-4">
									<div className="flex flex-col gap-3">
										<Link href="/member/loans/apply">
											<Button className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-sm">
												Apply for a Loan
											</Button>
										</Link>
										<div className="grid grid-cols-2 gap-3">
											<Link href="/member/loans/calculator">
												<Button
													variant="outline"
													className="w-full border-blue-200 hover:bg-blue-50 shadow-sm">
													Amortization Calculator
												</Button>
											</Link>
											<Link href="/member/profile">
												<Button
													variant="outline"
													className="w-full border-blue-200 hover:bg-blue-50 shadow-sm">
													Update Profile
												</Button>
											</Link>
										</div>
										<div className="grid grid-cols-2 gap-3">
											<Link href="/member/savings">
												<Button
													variant="outline"
													className="w-full border-green-200 hover:bg-green-50 shadow-sm">
													View Savings
												</Button>
											</Link>
											<Link href="/member/loans">
												<Button
													variant="outline"
													className="w-full border-purple-200 hover:bg-purple-50 shadow-sm">
													View Loans
												</Button>
											</Link>
										</div>
									</div>
								</CardContent>
							</Card>
						</motion.div>

						<motion.div variants={itemVariants}>
							<Card className="hover:shadow-md transition-all duration-300 hover:translate-y-[-2px] overflow-hidden">
								<CardHeader className="bg-gradient-to-r from-amber-50 to-transparent pb-2">
									<div className="flex justify-between items-center">
										<div>
											<CardTitle>Recent Transactions</CardTitle>
											<CardDescription>
												Your most recent financial activities
											</CardDescription>
										</div>
										<Button
											variant="ghost"
											size="sm"
											className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 -mr-2"
											onClick={() => setActiveTab("financial")}>
											View All
											<ChevronRight className="h-3 w-3 ml-1" />
										</Button>
									</div>
								</CardHeader>
								<CardContent className="pt-2 px-0">
									{memberData.transactions.length > 0 ? (
										<div className="space-y-0 max-h-[300px] overflow-y-auto">
											{memberData.transactions
												.slice(0, 5)
												.map((transaction, index) => (
													<div
														key={index}
														className="flex items-center justify-between p-3 hover:bg-muted/20 transition-colors border-b border-gray-100 last:border-0">
														<div>
															<p className="text-sm font-medium">
																{transaction.type
																	.replace(/_/g, " ")
																	.toLowerCase()
																	.split(" ")
																	.map(
																		(word) =>
																			word.charAt(0).toUpperCase() +
																			word.slice(1)
																	)
																	.join(" ")}
															</p>
															<p className="text-xs text-muted-foreground">
																{new Date(
																	transaction.transactionDate
																).toLocaleDateString("en-US", {
																	year: "numeric",
																	month: "short",
																	day: "numeric",
																})}
															</p>
														</div>
														<div
															className={`text-sm font-medium ${
																Number(transaction.amount) > 0
																	? "text-green-500"
																	: "text-red-500"
															}`}>
															{Number(transaction.amount) > 0 ? "+" : "-"}
															{formatCurrency(
																Math.abs(Number(transaction.amount))
															)}
														</div>
													</div>
												))}
										</div>
									) : (
										<div className="flex items-center justify-center h-[200px] bg-muted/20 rounded-md mx-3">
											<p className="text-muted-foreground">
												No transaction data available
											</p>
										</div>
									)}
								</CardContent>
							</Card>
						</motion.div>
					</div>
				</TabsContent>

				{/* Financial Tab */}
				<TabsContent value="financial" className="mt-0 space-y-4">
					<div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
						<motion.div
							variants={itemVariants}
							className="col-span-2 sm:col-span-3 lg:col-span-4">
							<Card className="bg-gradient-to-r from-blue-50 to-white border-blue-100 shadow-sm">
								<CardHeader className="pb-2">
									<CardTitle className="text-lg text-blue-700">
										Financial Summary
									</CardTitle>
									<CardDescription>
										Overview of your financial contributions
									</CardDescription>
								</CardHeader>
								<CardContent>
									<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 text-center">
										<div className="bg-white rounded-lg p-3 shadow-sm border border-blue-100">
											<p className="text-xs text-muted-foreground mb-1">
												Total Contributions
											</p>
											<p className="text-lg font-bold text-blue-700">
												{formatCurrency(memberData.totalContributions)}
											</p>
										</div>
										<div className="bg-white rounded-lg p-3 shadow-sm border border-green-100">
											<p className="text-xs text-muted-foreground mb-1">
												Savings
											</p>
											<p className="text-lg font-bold text-green-600">
												{formatCurrency(memberData.totalSavings)}
											</p>
										</div>
										<div className="bg-white rounded-lg p-3 shadow-sm border border-purple-100">
											<p className="text-xs text-muted-foreground mb-1">
												Loan Repayments
											</p>
											<p className="text-lg font-bold text-purple-600">
												{formatCurrency(memberData.totalLoanRepayment)}
											</p>
										</div>
										<div className="bg-white rounded-lg p-3 shadow-sm border border-amber-100">
											<p className="text-xs text-muted-foreground mb-1">
												Membership Fee
											</p>
											<p className="text-lg font-bold text-amber-600">
												{formatCurrency(memberData.totalMembershipFee)}
											</p>
										</div>
										<div className="bg-white rounded-lg p-3 shadow-sm border border-emerald-100">
											<p className="text-xs text-muted-foreground mb-1">
												Willing Deposit
											</p>
											<p className="text-lg font-bold text-emerald-600">
												{formatCurrency(memberData.totalWillingDeposit)}
											</p>
										</div>
										<div className="bg-white rounded-lg p-3 shadow-sm border border-indigo-100">
											<p className="text-xs text-muted-foreground mb-1">
												Registration Fee
											</p>
											<p className="text-lg font-bold text-indigo-600">
												{formatCurrency(memberData.totalRegistrationFee)}
											</p>
										</div>
										<div className="bg-white rounded-lg p-3 shadow-sm border border-rose-100">
											<p className="text-xs text-muted-foreground mb-1">
												Cost of Share
											</p>
											<p className="text-lg font-bold text-rose-600">
												{formatCurrency(memberData.totalCostOfShare)}
											</p>
										</div>
									</div>
								</CardContent>
							</Card>
						</motion.div>

						<motion.div
							variants={itemVariants}
							className="col-span-2 sm:col-span-3 md:col-span-2 lg:col-span-2">
							<Card className="hover:shadow-md transition-all duration-300 hover:translate-y-[-2px] overflow-hidden h-full">
								<CardHeader className="bg-gradient-to-r from-purple-50 to-transparent pb-2">
									<CardTitle>Contribution Breakdown</CardTitle>
									<CardDescription>
										Distribution of your financial contributions
									</CardDescription>
								</CardHeader>
								<CardContent className="px-2 pt-4">
									{pieChartData.length > 0 ? (
										<PieChart
											data={pieChartData}
											index="name"
											categories={["value"]}
											colors={chartColors}
											valueFormatter={(value) => formatCurrency(value)}
											className="h-[250px] md:h-[300px]"
										/>
									) : (
										<div className="flex items-center justify-center h-[250px] md:h-[300px] bg-muted/20 rounded-md">
											<p className="text-muted-foreground">
												No contribution data available
											</p>
										</div>
									)}
								</CardContent>
							</Card>
						</motion.div>

						<motion.div
							variants={itemVariants}
							className="col-span-2 sm:col-span-3 md:col-span-2 lg:col-span-2">
							<Card className="hover:shadow-md transition-all duration-300 hover:translate-y-[-2px] overflow-hidden h-full">
								<CardHeader className="bg-gradient-to-r from-blue-50 to-transparent pb-2">
									<div className="flex justify-between items-center">
										<div>
											<CardTitle>Loan Repayment History</CardTitle>
											<CardDescription>
												Your loan repayment over time
											</CardDescription>
										</div>
										<Badge variant="outline" className="bg-white">
											<Filter className="h-3 w-3 mr-1" />
											{timeRange === "all"
												? "All Time"
												: `Last ${
														timeRange.charAt(0).toUpperCase() +
														timeRange.slice(1)
												  }`}
										</Badge>
									</div>
								</CardHeader>
								<CardContent className="px-2 pt-4">
									{filteredLoanRepaymentData.length > 0 ? (
										<AreaChart
											data={filteredLoanRepaymentData}
											index="name"
											categories={["amount"]}
											colors={["#3b82f6"]} // blue-500
											valueFormatter={(value) => formatCurrency(value)}
											className="h-[250px] md:h-[300px]"
										/>
									) : (
										<div className="flex items-center justify-center h-[250px] md:h-[300px] bg-muted/20 rounded-md">
											<p className="text-muted-foreground">
												No loan repayment data available
											</p>
										</div>
									)}
								</CardContent>
							</Card>
						</motion.div>
					</div>

					<motion.div variants={itemVariants}>
						<Card className="hover:shadow-md transition-all duration-300 hover:translate-y-[-2px] overflow-hidden">
							<CardHeader className="bg-gradient-to-r from-amber-50 to-transparent pb-2">
								<div className="flex justify-between items-center">
									<div>
										<CardTitle>All Transactions</CardTitle>
										<CardDescription>
											Complete history of your financial activities
										</CardDescription>
									</div>
									<Select value={timeRange} onValueChange={setTimeRange}>
										<SelectTrigger className="w-[130px] h-8 text-xs">
											<Calendar className="h-3 w-3 mr-1" />
											<SelectValue placeholder="Select time range" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="all">All Time</SelectItem>
											<SelectItem value="week">Last Week</SelectItem>
											<SelectItem value="month">Last Month</SelectItem>
											<SelectItem value="quarter">Last Quarter</SelectItem>
											<SelectItem value="year">Last Year</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</CardHeader>
							<CardContent className="p-0">
								{memberData.transactions.length > 0 ? (
									<div className="max-h-[400px] overflow-y-auto">
										<table className="w-full">
											<thead className="bg-muted/30 sticky top-0">
												<tr>
													<th className="text-xs font-medium text-left p-3">
														Type
													</th>
													<th className="text-xs font-medium text-left p-3">
														Date
													</th>
													<th className="text-xs font-medium text-right p-3">
														Amount
													</th>
												</tr>
											</thead>
											<tbody>
												{memberData.transactions.map((transaction, index) => (
													<tr
														key={index}
														className="border-b border-gray-100 last:border-0 hover:bg-muted/20 transition-colors">
														<td className="p-3">
															<p className="text-sm font-medium">
																{transaction.type
																	.replace(/_/g, " ")
																	.toLowerCase()
																	.split(" ")
																	.map(
																		(word) =>
																			word.charAt(0).toUpperCase() +
																			word.slice(1)
																	)
																	.join(" ")}
															</p>
														</td>
														<td className="p-3">
															<p className="text-xs text-muted-foreground">
																{new Date(
																	transaction.transactionDate
																).toLocaleDateString("en-US", {
																	year: "numeric",
																	month: "short",
																	day: "numeric",
																})}
															</p>
														</td>
														<td className="p-3 text-right">
															<span
																className={`text-sm font-medium ${
																	Number(transaction.amount) > 0
																		? "text-green-500"
																		: "text-red-500"
																}`}>
																{Number(transaction.amount) > 0 ? "+" : "-"}
																{formatCurrency(
																	Math.abs(Number(transaction.amount))
																)}
															</span>
														</td>
													</tr>
												))}
											</tbody>
										</table>
									</div>
								) : (
									<div className="flex items-center justify-center h-[200px] bg-muted/20 rounded-md m-3">
										<p className="text-muted-foreground">
											No transaction data available
										</p>
									</div>
								)}
							</CardContent>
						</Card>
					</motion.div>
				</TabsContent>

				{/* Loans Tab */}
				<TabsContent value="loans" className="mt-0 space-y-4">
					<div className="grid gap-4 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
						<motion.div variants={itemVariants}>
							<Card className="overflow-hidden border-t-4 border-t-blue-500 hover:shadow-md transition-all duration-300 hover:translate-y-[-2px]">
								<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-blue-50 to-transparent">
									<CardTitle className="text-sm font-medium">
										Active Loans
									</CardTitle>
									<div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
										<CreditCardIcon className="h-4 w-4 text-blue-500" />
									</div>
								</CardHeader>
								<CardContent>
									<div className="text-2xl font-bold">
										{memberData.activeLoans}
									</div>
									<p className="text-xs text-muted-foreground mt-1">
										{memberData.activeLoans > 0
											? "Loans in progress"
											: "No active loans"}
									</p>
								</CardContent>
							</Card>
						</motion.div>

						<motion.div variants={itemVariants}>
							<Card className="overflow-hidden border-t-4 border-t-green-500 hover:shadow-md transition-all duration-300 hover:translate-y-[-2px]">
								<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-green-50 to-transparent">
									<CardTitle className="text-sm font-medium">
										Total Loan Amount
									</CardTitle>
									<div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
										<DollarSign className="h-4 w-4 text-green-500" />
									</div>
								</CardHeader>
								<CardContent>
									<div className="text-2xl font-bold">
										{formatCurrency(memberData.totalLoanAmount)}
									</div>
									<p className="text-xs text-muted-foreground mt-1">
										Total borrowed amount
									</p>
								</CardContent>
							</Card>
						</motion.div>

						<motion.div variants={itemVariants}>
							<Card className="overflow-hidden border-t-4 border-t-purple-500 hover:shadow-md transition-all duration-300 hover:translate-y-[-2px]">
								<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-purple-50 to-transparent">
									<CardTitle className="text-sm font-medium">
										Total Repaid
									</CardTitle>
									<div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
										<Receipt className="h-4 w-4 text-purple-500" />
									</div>
								</CardHeader>
								<CardContent>
									<div className="text-2xl font-bold">
										{formatCurrency(memberData.totalLoanRepayment)}
									</div>
									<p className="text-xs text-muted-foreground mt-1">
										Total amount repaid
									</p>
								</CardContent>
							</Card>
						</motion.div>

						<motion.div variants={itemVariants}>
							<Card className="overflow-hidden border-t-4 border-t-amber-500 hover:shadow-md transition-all duration-300 hover:translate-y-[-2px]">
								<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-amber-50 to-transparent">
									<CardTitle className="text-sm font-medium">
										Next Payment
									</CardTitle>
									<div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
										<TrendingUp className="h-4 w-4 text-amber-500" />
									</div>
								</CardHeader>
								<CardContent>
									<div className="text-2xl font-bold">
										{memberData.nextPayment
											? formatCurrency(memberData.nextPayment.amount)
											: "No pending payments"}
									</div>
									<p className="text-xs text-muted-foreground mt-1">
										{memberData.nextPayment
											? `Due on ${
													memberData.nextPayment.repaymentDate.split("T")[0]
											  }`
											: "N/A"}
									</p>
								</CardContent>
							</Card>
						</motion.div>
					</div>

					{memberData.loanRepaymentProgress.length > 0 ? (
						<motion.div variants={itemVariants}>
							<Card className="hover:shadow-md transition-all duration-300 hover:translate-y-[-2px] overflow-hidden">
								<CardHeader className="bg-gradient-to-r from-blue-50 to-transparent pb-2">
									<CardTitle>Loan Repayment Progress</CardTitle>
									<CardDescription>
										Track your loan repayment progress
									</CardDescription>
								</CardHeader>
								<CardContent>
									<div className="space-y-6">
										{memberData.loanRepaymentProgress.map((loan, index) => (
											<div key={index} className="space-y-2">
												<div className="flex justify-between items-center">
													<div>
														<p className="font-medium">Loan #{loan.loanId}</p>
														<p className="text-sm text-muted-foreground">
															{formatCurrency(loan.totalRepaid)} of{" "}
															{formatCurrency(loan.loanAmount)} repaid
														</p>
													</div>
													<div className="text-right">
														<p className="text-sm font-medium">
															{Math.round(loan.progress)}% complete
														</p>
														<p className="text-xs text-muted-foreground">
															{formatCurrency(loan.remainingAmount)} remaining
														</p>
													</div>
												</div>
												<div className="relative pt-1">
													<div className="overflow-hidden h-2 text-xs flex rounded bg-blue-100">
														<div
															style={{ width: `${loan.progress}%` }}
															className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 transition-all duration-500"></div>
													</div>
												</div>
											</div>
										))}
									</div>
								</CardContent>
							</Card>
						</motion.div>
					) : (
						<motion.div variants={itemVariants}>
							<Card className="hover:shadow-md transition-all duration-300 hover:translate-y-[-2px] overflow-hidden">
								<CardHeader className="bg-gradient-to-r from-blue-50 to-transparent pb-2">
									<CardTitle>No Active Loans</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="flex flex-col items-center justify-center py-6">
										<CreditCardIcon className="h-12 w-12 text-muted-foreground mb-4" />
										<p className="text-muted-foreground mb-4">
											You don't have any active loans at the moment
										</p>
										<Link href="/member/loans/apply">
											<Button className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-sm">
												Apply for a Loan
											</Button>
										</Link>
									</div>
								</CardContent>
							</Card>
						</motion.div>
					)}

					<motion.div variants={itemVariants}>
						<Card className="hover:shadow-md transition-all duration-300 hover:translate-y-[-2px] overflow-hidden">
							<CardHeader className="bg-gradient-to-r from-amber-50 to-transparent pb-2">
								<CardTitle>Loan Repayment Schedule</CardTitle>
								<CardDescription>Your upcoming loan repayments</CardDescription>
							</CardHeader>
							<CardContent className="p-0">
								{memberData.loans.some(
									(loan) => loan.loanRepayments.length > 0
								) ? (
									<div className="max-h-[400px] overflow-y-auto">
										<table className="w-full">
											<thead className="bg-muted/30 sticky top-0">
												<tr>
													<th className="text-xs font-medium text-left p-3">
														Loan ID
													</th>
													<th className="text-xs font-medium text-left p-3">
														Due Date
													</th>
													<th className="text-xs font-medium text-left p-3">
														Status
													</th>
													<th className="text-xs font-medium text-right p-3">
														Amount
													</th>
												</tr>
											</thead>
											<tbody>
												{memberData.loans.flatMap((loan) =>
													loan.loanRepayments.map(
														(repayment, repaymentIndex) => (
															<tr
																key={`${loan.id}-${repaymentIndex}`}
																className="border-b border-gray-100 last:border-0 hover:bg-muted/20 transition-colors">
																<td className="p-3">
																	<p className="text-sm font-medium">
																		Loan #{loan.id}
																	</p>
																</td>
																<td className="p-3">
																	<p className="text-xs">
																		{new Date(
																			repayment.repaymentDate
																		).toLocaleDateString("en-US", {
																			year: "numeric",
																			month: "short",
																			day: "numeric",
																		})}
																	</p>
																</td>
																<td className="p-3">
																	<Badge
																		variant="outline"
																		className={`${
																			repayment.status === "PENDING"
																				? "bg-amber-50 text-amber-700 border-amber-200"
																				: repayment.status === "PAID"
																				? "bg-green-50 text-green-700 border-green-200"
																				: "bg-red-50 text-red-700 border-red-200"
																		}`}>
																		{repayment.status}
																	</Badge>
																</td>
																<td className="p-3 text-right">
																	<span className="text-sm font-medium">
																		{formatCurrency(repayment.amount)}
																	</span>
																</td>
															</tr>
														)
													)
												)}
											</tbody>
										</table>
									</div>
								) : (
									<div className="flex items-center justify-center h-[200px] bg-muted/20 rounded-md m-3">
										<p className="text-muted-foreground">
											No upcoming repayments
										</p>
									</div>
								)}
							</CardContent>
						</Card>
					</motion.div>
				</TabsContent>
			</Tabs>

			{/* Add custom CSS for animations */}
			<style jsx global>{`
				@keyframes progress {
					0% {
						width: 0;
					}
					100% {
						width: 100%;
					}
				}

				.animate-progress {
					animation: progress 2s linear;
				}
			`}</style>
		</motion.div>
	);
}
