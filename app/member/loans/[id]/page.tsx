"use client";

import type React from "react";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import {
	ArrowLeft,
	ArrowRight,
	BellRing,
	CalendarClock,
	CheckCircle,
	Clock,
	CreditCard,
	DollarSign,
	Download,
	Eye,
	FileText,
	AlertCircle,
	PieChart,
	Calendar,
	Loader2,
	Info,
	Calculator,
} from "lucide-react";
import Link from "next/link";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { membersLoanAPI, loanDocument } from "@/lib/api";

interface Loan {
	id: number;
	amount: number;
	interestRate: number;
	tenureMonths: number;
	status: string;
	createdAt: string;
	remainingAmount?: number;
	approvalLogs: {
		id: number;
		status: string;
		approvalDate: string;
		comments: string;
		role: string;
	}[];
	loanRepayments: {
		id: number;
		amount: number;
		paidAmount?: number;
		repaymentDate: string;
		reference: string | null;
		sourceType: string;
		status: string;
	}[];
	loanDocuments: {
		id: number;
		documentType: string;
		documentUrl: string;
		fileName?: string;
		uploadDate: string;
	}[];
}

interface PaymentFormData {
	repaymentId: number;
	amount: number;
	reference: string;
	sourceType: string;
}

export default function LoanDetailPage() {
	const [loan, setLoan] = useState<Loan | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
	const [isDocumentLoading, setIsDocumentLoading] = useState(false);
	const [documentError, setDocumentError] = useState<string | null>(null);
	const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
	const [selectedRepayment, setSelectedRepayment] = useState<number | null>(
		null
	);
	const [paymentFormData, setPaymentFormData] = useState<PaymentFormData>({
		repaymentId: 0,
		amount: 0,
		reference: "",
		sourceType: "MANUAL_PAYMENT",
	});
	const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

	const params = useParams();
	const router = useRouter();
	const { toast } = useToast();

	useEffect(() => {
		const fetchLoanDetails = async () => {
			try {
				setIsLoading(true);
				const response = await membersLoanAPI.getLoansById(params.id);
				if (!response) {
					throw new Error("Failed to fetch loan details");
				}

				setLoan(response);
			} catch (error) {
				console.error("Error fetching loan details:", error);
				toast({
					title: "Error",
					description: "Failed to load loan details. Please try again.",
					variant: "destructive",
				});
			} finally {
				setIsLoading(false);
			}
		};

		fetchLoanDetails();
	}, [params.id, toast]);

	const getStatusColor = (status: string) => {
		switch (status.toLowerCase()) {
			case "pending":
				return "bg-yellow-500";
			case "paid":
				return "bg-green-500";
			case "overdue":
				return "bg-red-500";
			default:
				return "bg-gray-500";
		}
	};

	const getLoanStatusColor = (status: string) => {
		switch (status) {
			case "PENDING":
				return "bg-yellow-100 text-yellow-800";
			case "APPROVED":
				return "bg-green-100 text-green-800";
			case "PAID":
				return "bg-green-100 text-green-800";
			case "REJECTED":
				return "bg-red-100 text-red-800";
			case "OVERDUE":
				return "bg-red-100 text-red-800";
			case "DISBURSED":
				return "bg-blue-100 text-blue-800";
			case "COMPLETED":
				return "bg-gray-100 text-gray-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	const getStatusBadge = (status: string) => {
		const statusMap: Record<string, { color: string; icon: React.ReactNode }> =
			{
				PENDING: {
					color: "bg-yellow-500",
					icon: <Clock className="h-4 w-4 mr-1" />,
				},
				VERIFIED: {
					color: "bg-blue-500",
					icon: <CheckCircle className="h-4 w-4 mr-1" />,
				},
				APPROVED: {
					color: "bg-green-500",
					icon: <CheckCircle className="h-4 w-4 mr-1" />,
				},
				DISBURSED: {
					color: "bg-purple-500",
					icon: <DollarSign className="h-4 w-4 mr-1" />,
				},
				REPAID: {
					color: "bg-gray-500",
					icon: <CheckCircle className="h-4 w-4 mr-1" />,
				},
				REJECTED: {
					color: "bg-red-500",
					icon: <AlertCircle className="h-4 w-4 mr-1" />,
				},
			};

		const { color, icon } = statusMap[status] || {
			color: "bg-gray-500",
			icon: null,
		};

		return (
			<Badge className={`${color} flex items-center`}>
				{icon}
				{status}
			</Badge>
		);
	};

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: "ETB",
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
		}).format(amount);
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	};

	// Calculate loan summary statistics
	const loanSummary = useMemo(() => {
		if (!loan) return null;

		const totalAmount = Number(loan.amount);
		const interestRate = Number(loan.interestRate) / 100;
		const tenureMonths = loan.tenureMonths;

		// Simple interest calculation
		const totalInterest = totalAmount * interestRate * (tenureMonths / 12);
		const totalRepayable = totalAmount + totalInterest;
		const monthlyPayment = totalRepayable / tenureMonths;

		// Calculate paid and remaining amounts
		const totalPaid = loan.loanRepayments.reduce((sum, repayment) => {
			if (repayment.paidAmount !== undefined) {
				return sum + Number(repayment.paidAmount);
			} else if (repayment.status === "PAID") {
				return sum + Number(repayment.amount);
			}
			return sum;
		}, 0);

		const remainingAmount =
			loan.remainingAmount !== undefined
				? Number(loan.remainingAmount)
				: totalRepayable - totalPaid;

		// Calculate progress percentage
		const progressPercentage = Math.min(
			100,
			(totalPaid / totalRepayable) * 100
		);

		// Count repayments by status
		const repaymentStatusCounts = loan.loanRepayments.reduce(
			(counts, repayment) => {
				const status = repayment.status.toLowerCase();
				counts[status] = (counts[status] || 0) + 1;
				return counts;
			},
			{} as Record<string, number>
		);

		return {
			totalAmount,
			totalInterest,
			totalRepayable,
			monthlyPayment,
			totalPaid,
			remainingAmount,
			progressPercentage,
			repaymentStatusCounts,
		};
	}, [loan]);

	// Check if next payment is due
	const nextPaymentDue = useMemo(() => {
		if (!loan) return null;

		const pendingRepayments = loan.loanRepayments
			.filter((r) => r.status.toLowerCase() === "pending")
			.sort(
				(a, b) =>
					new Date(a.repaymentDate).getTime() -
					new Date(b.repaymentDate).getTime()
			);

		return pendingRepayments.length > 0 ? pendingRepayments[0] : null;
	}, [loan]);

	// Check if any payments are overdue
	const overduePayments = useMemo(() => {
		if (!loan) return [];

		const today = new Date();
		return loan.loanRepayments
			.filter(
				(r) =>
					r.status.toLowerCase() === "pending" &&
					new Date(r.repaymentDate) < today
			)
			.sort(
				(a, b) =>
					new Date(a.repaymentDate).getTime() -
					new Date(b.repaymentDate).getTime()
			);
	}, [loan]);

	const handleDocumentView = async (documentUrl: string) => {
		setIsDocumentLoading(true);
		setDocumentError(null);
		try {
			// Use the full path for local files
			const fullUrl = documentUrl.startsWith("http")
				? documentUrl
				: `/${documentUrl}`;
			const response = await loanDocument.getLoanDocumentByUrl(fullUrl);
			if (response) {
				const url = URL.createObjectURL(response);
				setSelectedDocument(url);
			} else {
				throw new Error("Failed to load document");
			}
		} catch (error) {
			console.error("Error loading document:", error);
			setDocumentError("Failed to load document. Please try again.");
		} finally {
			setIsDocumentLoading(false);
		}
	};

	const handleDocumentDownload = async (
		documentUrl: string,
		fileName = "document"
	) => {
		try {
			const fullUrl = documentUrl.startsWith("http")
				? documentUrl
				: `/${documentUrl}`;
			const response = await loanDocument.getLoanDocumentByUrl(fullUrl);
			if (response) {
				const url = URL.createObjectURL(response);
				const a = document.createElement("a");
				a.href = url;
				a.download = fileName;
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
				URL.revokeObjectURL(url);
			} else {
				throw new Error("Failed to download document");
			}
		} catch (error) {
			console.error("Error downloading document:", error);
			toast({
				title: "Failed to download document",
				description: "Please try again later.",
				variant: "destructive",
			});
		}
	};

	const openPaymentDialog = (repaymentId: number, amount: number) => {
		setSelectedRepayment(repaymentId);
		setPaymentFormData({
			repaymentId,
			amount,
			reference: "",
			sourceType: "MANUAL_PAYMENT",
		});
		setIsPaymentDialogOpen(true);
	};

	const handlePaymentSubmit = async () => {
		setIsSubmittingPayment(true);
		try {
			const response = await membersLoanAPI.payLoanRepayment(
				params.id,
				paymentFormData.repaymentId,
				{
					amount: paymentFormData.amount,
					reference: paymentFormData.reference,
					sourceType: paymentFormData.sourceType,
				}
			);

			if (response) {
				toast({
					title: "Payment initiated successfully",
					description: `Your payment of ${formatCurrency(
						paymentFormData.amount
					)} has been initiated and is being processed.`,
				});
				setIsPaymentDialogOpen(false);

				// Refresh loan details
				const loanResponse = await membersLoanAPI.getLoansById(params.id);
				console.log("loanResponse", loanResponse);
				if (loanResponse) {
					setLoan(loanResponse);
				}
			} else {
				throw new Error(response.error || "Failed to process payment");
			}
		} catch (error) {
			console.error("Error processing payment:", error);
			toast({
				title: "Failed to process payment",
				description: (error as Error).message,
				variant: "destructive",
			});
		} finally {
			setIsSubmittingPayment(false);
		}
	};

	const renderDocumentViewer = () => {
		if (!selectedDocument) return null;

		return (
			<Dialog
				open={!!selectedDocument}
				onOpenChange={() => setSelectedDocument(null)}>
				<DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
					<DialogHeader>
						<DialogTitle>Document Viewer</DialogTitle>
					</DialogHeader>
					<div className="flex-grow overflow-hidden">
						{isDocumentLoading ? (
							<div className="flex items-center justify-center h-full">
								<Loader2 className="h-12 w-12 animate-spin text-primary" />
							</div>
						) : documentError ? (
							<div className="text-center text-red-500 p-4">
								{documentError}
							</div>
						) : (
							<iframe
								src={selectedDocument}
								className="w-full h-full border-0"
								title="Document Viewer"
							/>
						)}
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setSelectedDocument(null)}>
							Close
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		);
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-[60vh]">
				<div className="text-center">
					<Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
					<p className="mt-4 text-muted-foreground">Loading loan details...</p>
				</div>
			</div>
		);
	}

	if (!loan) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[60vh]">
				<AlertCircle className="h-16 w-16 text-destructive mb-4" />
				<h2 className="text-2xl font-bold mb-2">Loan Not Found</h2>
				<p className="text-muted-foreground mb-4">
					The loan you're looking for doesn't exist or you don't have access to
					it.
				</p>
				<Button onClick={() => router.push("/member/loans")}>
					Back to Loans
				</Button>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div className="flex items-center">
					<Button
						variant="outline"
						size="sm"
						onClick={() => router.back()}
						className="mr-4">
						<ArrowLeft className="h-4 w-4 mr-2" />
						Back
					</Button>
					<h1 className="text-2xl font-bold tracking-tight">
						Loan #{loan.id} Details
					</h1>
				</div>
				{getStatusBadge(loan.status)}
			</div>

			{/* Alerts for important loan information */}
			{nextPaymentDue && ["APPROVED", "DISBURSED"].includes(loan.status) && (
				<Card className="border-amber-200 bg-amber-50">
					<CardContent className="flex items-start gap-3 pt-6">
						<BellRing className="h-5 w-5 text-amber-600 mt-0.5" />
						<div>
							<h3 className="font-medium">Next Payment Due</h3>
							<p className="text-sm text-muted-foreground mt-1">
								Your next payment of{" "}
								{formatCurrency(Number(nextPaymentDue.amount))} is due on{" "}
								{formatDate(nextPaymentDue.repaymentDate)}.
							</p>
							{/* <Button
								size="sm"
								className="mt-2"
								onClick={() =>
									openPaymentDialog(
										nextPaymentDue.id,
										Number(nextPaymentDue.amount)
									)
								}>
								Make Payment
							</Button> */}
						</div>
					</CardContent>
				</Card>
			)}

			{overduePayments.length > 0 && (
				<Card className="border-red-200 bg-red-50">
					<CardContent className="flex items-start gap-3 pt-6">
						<AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
						<div>
							<h3 className="font-medium">Overdue Payments</h3>
							<p className="text-sm text-muted-foreground mt-1">
								You have {overduePayments.length} overdue payment
								{overduePayments.length > 1 ? "s" : ""}. Please make your
								payment as soon as possible to avoid penalties.
							</p>
							{/* <Button
								size="sm"
								className="mt-2"
								variant="destructive"
								onClick={() =>
									openPaymentDialog(
										overduePayments[0].id,
										Number(overduePayments[0].amount)
									)
								}>
								Pay Now
							</Button> */}
						</div>
					</CardContent>
				</Card>
			)}

			{loan.status === "REJECTED" && (
				<Card className="border-red-200 bg-red-50">
					<CardContent className="flex items-start gap-3 pt-6">
						<AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
						<div>
							<h3 className="font-medium">Loan Application Rejected</h3>
							<p className="text-sm text-muted-foreground mt-1">
								Your loan application has been rejected. Please check the
								approval history for more details or contact customer support
								for assistance.
							</p>
							<Button
								size="sm"
								className="mt-2"
								variant="outline"
								onClick={() => router.push("/member/support")}>
								Contact Support
							</Button>
						</div>
					</CardContent>
				</Card>
			)}

			<Card>
				<CardHeader className="pb-2">
					<div className="flex justify-between items-start">
						<div>
							<CardTitle>Loan Overview</CardTitle>
							<CardDescription>
								Applied on {formatDate(loan.createdAt)}
							</CardDescription>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
						<div>
							<p className="text-sm text-muted-foreground">Loan Amount</p>
							<p className="text-2xl font-bold">
								{formatCurrency(loan.amount)}
							</p>
						</div>
						<div>
							<p className="text-sm text-muted-foreground">Interest Rate</p>
							<p className="text-2xl font-bold">{loan.interestRate}%</p>
						</div>
						<div>
							<p className="text-sm text-muted-foreground">Tenure</p>
							<p className="text-2xl font-bold">{loan.tenureMonths} months</p>
						</div>
					</div>

					{loanSummary &&
						["APPROVED", "DISBURSED", "REPAID"].includes(loan.status) && (
							<div className="space-y-6">
								<div className="space-y-2">
									<div className="flex justify-between text-sm">
										<span>Repayment Progress</span>
										<span>{Math.round(loanSummary.progressPercentage)}%</span>
									</div>
									<Progress
										value={loanSummary.progressPercentage}
										className="h-2"
									/>
								</div>

								<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
									<div className="p-3 border rounded-md">
										<p className="text-sm text-muted-foreground">Principal</p>
										<p className="text-lg font-bold">
											{formatCurrency(loanSummary.totalAmount)}
										</p>
									</div>
									<div className="p-3 border rounded-md">
										<p className="text-sm text-muted-foreground">Interest</p>
										<p className="text-lg font-bold">
											{formatCurrency(loanSummary.totalInterest)}
										</p>
									</div>
									<div className="p-3 border rounded-md">
										<p className="text-sm text-muted-foreground">Total Paid</p>
										<p className="text-lg font-bold">
											{formatCurrency(loanSummary.totalPaid)}
										</p>
									</div>
									<div className="p-3 border rounded-md">
										<p className="text-sm text-muted-foreground">Remaining</p>
										<p className="text-lg font-bold">
											{formatCurrency(loanSummary.remainingAmount)}
										</p>
									</div>
								</div>
							</div>
						)}
				</CardContent>
			</Card>

			<Tabs defaultValue="repayments" className="space-y-4">
				<TabsList className="grid grid-cols-3">
					<TabsTrigger value="repayments" className="flex items-center gap-2">
						<Calendar className="h-4 w-4" />
						<span className="hidden sm:inline">Repayments</span>
						<span className="sm:hidden">Payments</span>
					</TabsTrigger>
					<TabsTrigger value="approvals" className="flex items-center gap-2">
						<CheckCircle className="h-4 w-4" />
						<span className="hidden sm:inline">Approval History</span>
						<span className="sm:hidden">Approvals</span>
					</TabsTrigger>
					<TabsTrigger value="documents" className="flex items-center gap-2">
						<FileText className="h-4 w-4" />
						<span className="hidden sm:inline">Documents</span>
						<span className="sm:hidden">Docs</span>
					</TabsTrigger>
				</TabsList>

				<TabsContent value="repayments">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Calendar className="h-5 w-5" />
								Repayment Schedule
							</CardTitle>
							<CardDescription>
								Track your loan repayments and upcoming installments
							</CardDescription>
						</CardHeader>
						<CardContent>
							{loan.loanRepayments.length === 0 ? (
								<div className="text-center py-6">
									<CalendarClock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
									<p className="text-muted-foreground">
										No repayment schedule available yet. This will be generated
										once your loan is disbursed.
									</p>
								</div>
							) : (
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Due Date</TableHead>
											<TableHead>Amount</TableHead>
											<TableHead>Paid</TableHead>
											<TableHead>Remaining</TableHead>
											<TableHead>Status</TableHead>
											{/* <TableHead className="text-right">Actions</TableHead> */}
										</TableRow>
									</TableHeader>
									<TableBody>
										{loan.loanRepayments.map((repayment) => {
											const amount = Number(repayment.amount);
											const paidAmount =
												repayment.paidAmount !== undefined
													? Number(repayment.paidAmount)
													: repayment.status === "PAID"
													? amount
													: 0;
											const remainingAmount = amount - paidAmount;
											const isPending =
												repayment.status.toLowerCase() === "pending";
											const isOverdue =
												isPending &&
												new Date(repayment.repaymentDate) < new Date();

											return (
												<TableRow
													key={repayment.id}
													className={isOverdue ? "bg-red-50" : ""}>
													<TableCell>
														{formatDate(repayment.repaymentDate)}
													</TableCell>
													<TableCell>{formatCurrency(amount)}</TableCell>
													<TableCell>{formatCurrency(paidAmount)}</TableCell>
													<TableCell>
														{formatCurrency(remainingAmount)}
													</TableCell>
													<TableCell>
														<Badge
															className={getStatusColor(
																isOverdue ? "OVERDUE" : repayment.status
															)}>
															{isOverdue ? "OVERDUE" : repayment.status}
														</Badge>
													</TableCell>
													{/* <TableCell className="text-right">
														{isPending &&
															["APPROVED", "DISBURSED"].includes(
																loan.status
															) && (
																<Button
																	size="sm"
																	variant={
																		isOverdue ? "destructive" : "outline"
																	}
																	onClick={() =>
																		openPaymentDialog(
																			repayment.id,
																			remainingAmount
																		)
																	}>
																	<CreditCard className="h-4 w-4 mr-2" />
																	Pay
																</Button>
															)}
													</TableCell> */}
												</TableRow>
											);
										})}
									</TableBody>
								</Table>
							)}
						</CardContent>

						<CardFooter className="flex flex-col sm:flex-row gap-3">
							<Link
								href="/member/loans/calculator"
								className="w-full sm:w-auto">
								<Button className="w-full">
									<Calculator className="mr-2 h-4 w-4" />
									Amortization Calculator
								</Button>
							</Link>
							{/* {["APPROVED", "DISBURSED"].includes(loan.status) &&
								nextPaymentDue && (
									<Button
										className="w-full sm:w-auto"
										onClick={() =>
											openPaymentDialog(
												nextPaymentDue.id,
												Number(nextPaymentDue.amount)
											)
										}>
										<CreditCard className="mr-2 h-4 w-4" />
										Make Next Payment
									</Button>
								)} */}
						</CardFooter>
					</Card>

					{["APPROVED", "DISBURSED"].includes(loan.status) && loanSummary && (
						<Card className="mt-4">
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<PieChart className="h-5 w-5" />
									Loan Amortization
								</CardTitle>
								<CardDescription>
									Breakdown of your loan payments over time
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
										<div>
											<p className="text-sm text-muted-foreground">
												Monthly Payment
											</p>
											<p className="text-2xl font-bold">
												{formatCurrency(loanSummary.monthlyPayment)}
											</p>
										</div>
										<div>
											<p className="text-sm text-muted-foreground">
												Total Repayable
											</p>
											<p className="text-2xl font-bold">
												{formatCurrency(loanSummary.totalRepayable)}
											</p>
										</div>
									</div>

									<div className="space-y-2">
										<h4 className="font-medium">Payment Breakdown</h4>
										<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
											<div className="flex items-center gap-2">
												<div className="w-4 h-4 rounded-full bg-primary"></div>
												<span>
													Principal: {formatCurrency(loanSummary.totalAmount)}
												</span>
											</div>
											<div className="flex items-center gap-2">
												<div className="w-4 h-4 rounded-full bg-amber-500"></div>
												<span>
													Interest: {formatCurrency(loanSummary.totalInterest)}
												</span>
											</div>
										</div>
									</div>

									<div className="pt-4">
										<p className="text-sm text-muted-foreground mb-2">
											Your loan repayment consists of both principal and
											interest. As you make payments, more of each payment goes
											toward the principal and less toward interest.
										</p>
										<Link
											href="/member/loans/amortization"
											className="text-sm text-primary hover:underline">
											View detailed amortization schedule{" "}
											<ArrowRight className="h-4 w-4 inline" />
										</Link>
									</div>
								</div>
							</CardContent>
						</Card>
					)}
				</TabsContent>

				<TabsContent value="approvals">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Clock className="h-5 w-5" />
								Approval History
							</CardTitle>
							<CardDescription>
								Track the progress of your loan application
							</CardDescription>
						</CardHeader>
						<CardContent>
							{loan.approvalLogs.length === 0 ? (
								<div className="text-center py-6">
									<Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
									<p className="text-muted-foreground">
										Your loan application is awaiting initial review.
									</p>
								</div>
							) : (
								<div className="space-y-6">
									{loan.approvalLogs.map((log, index) => (
										<div
											key={log.id}
											className="flex items-start gap-4 relative">
											{index < loan.approvalLogs.length - 1 && (
												<div className="absolute left-[18px] top-8 bottom-0 w-0.5 bg-muted-foreground/20 z-0"></div>
											)}
											<div className="rounded-full bg-primary p-2 z-10">
												<CheckCircle className="h-5 w-5 text-primary-foreground" />
											</div>
											<div className="flex-1">
												<div className="flex justify-between items-start">
													<div>
														<p className="font-medium">
															{log.status} by {log.role.replace(/_/g, " ")}
														</p>
														<p className="text-sm text-muted-foreground">
															{formatDate(log.approvalDate)}
														</p>
													</div>
													{getStatusBadge(log.status)}
												</div>
												{log.comments && (
													<div className="mt-2 p-3 bg-muted rounded-md">
														<p className="text-sm italic">{log.comments}</p>
													</div>
												)}
											</div>
										</div>
									))}
								</div>
							)}
						</CardContent>
						{loan.status === "PENDING" && (
							<CardFooter>
								<div className="w-full p-4 bg-blue-50 rounded-md">
									<div className="flex items-start gap-3">
										<Info className="h-5 w-5 text-blue-600 mt-0.5" />
										<div>
											<h3 className="font-medium">Application In Progress</h3>
											<p className="text-sm text-muted-foreground mt-1">
												Your loan application is being reviewed. This process
												typically takes 2-3 business days. You'll be notified
												once there's an update.
											</p>
										</div>
									</div>
								</div>
							</CardFooter>
						)}
					</Card>
				</TabsContent>

				<TabsContent value="documents">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<FileText className="h-5 w-5" />
								Loan Documents
							</CardTitle>
							<CardDescription>
								View and download documents related to your loan
							</CardDescription>
						</CardHeader>
						<CardContent>
							{loan.loanDocuments.length === 0 ? (
								<div className="text-center py-6">
									<FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
									<p className="text-muted-foreground">
										No documents have been uploaded for this loan yet.
									</p>
								</div>
							) : (
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									{loan.loanDocuments.map((doc) => (
										<Card key={doc.id} className="overflow-hidden">
											<CardHeader className="pb-2">
												<CardTitle className="text-lg flex items-center gap-2">
													<FileText className="h-4 w-4" />
													{doc.documentType}
												</CardTitle>
												<CardDescription>
													Uploaded on {formatDate(doc.uploadDate)}
												</CardDescription>
											</CardHeader>
											<CardFooter className="pt-2 flex gap-2">
												<Button
													variant="outline"
													className="flex-1"
													onClick={() => handleDocumentView(doc.documentUrl)}>
													<Eye className="h-4 w-4 mr-2" />
													View
												</Button>
												<Button
													variant="outline"
													className="flex-1"
													onClick={() =>
														handleDocumentDownload(
															doc.documentUrl,
															doc.fileName ||
																`${doc.documentType.toLowerCase()}.pdf`
														)
													}>
													<Download className="h-4 w-4 mr-2" />
													Download
												</Button>
											</CardFooter>
										</Card>
									))}
								</div>
							)}
						</CardContent>
						<CardFooter>
							<Link href="/member/kyc" className="w-full sm:w-auto">
								<Button variant="outline" className="w-full">
									<FileText className="mr-2 h-4 w-4" />
									Upload Additional Documents
								</Button>
							</Link>
						</CardFooter>
					</Card>
				</TabsContent>
			</Tabs>

			{renderDocumentViewer()}

			<Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Make Loan Payment</DialogTitle>
					</DialogHeader>
					<div className="grid gap-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="amount">Payment Amount (ETB)</Label>
							<Input
								id="amount"
								type="number"
								step="0.01"
								value={paymentFormData.amount}
								onChange={(e) =>
									setPaymentFormData({
										...paymentFormData,
										amount: Number.parseFloat(e.target.value) || 0,
									})
								}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="reference">Reference/Transaction ID</Label>
							<Input
								id="reference"
								value={paymentFormData.reference}
								onChange={(e) =>
									setPaymentFormData({
										...paymentFormData,
										reference: e.target.value,
									})
								}
								placeholder="e.g., Bank transfer reference"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="sourceType">Payment Method</Label>
							<Select
								value={paymentFormData.sourceType}
								onValueChange={(value) =>
									setPaymentFormData({
										...paymentFormData,
										sourceType: value,
									})
								}>
								<SelectTrigger id="sourceType">
									<SelectValue placeholder="Select payment method" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="ERP_PAYROLL">
										ERP Payroll Deduction
									</SelectItem>
									<SelectItem value="MANUAL_PAYMENT">Cash Payment</SelectItem>
									<SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setIsPaymentDialogOpen(false)}>
							Cancel
						</Button>
						<Button
							onClick={handlePaymentSubmit}
							disabled={isSubmittingPayment || paymentFormData.amount <= 0}>
							{isSubmittingPayment ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Processing...
								</>
							) : (
								"Make Payment"
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Help section at the bottom */}
			<Card className="bg-muted/50">
				<CardHeader>
					<CardTitle className="text-lg">Need Help?</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-sm text-muted-foreground">
						If you have any questions about your loan or need assistance with
						payments, please contact our support team.
					</p>
					<div className="flex flex-col sm:flex-row gap-3 mt-4">
						<Link href="/member/support" className="w-full sm:w-auto">
							<Button variant="outline" className="w-full">
								Contact Support
							</Button>
						</Link>
						<Link href="/member/faq" className="w-full sm:w-auto">
							<Button variant="outline" className="w-full">
								View FAQs
							</Button>
						</Link>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
