"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Loader2,
	AlertCircle,
	CheckCircle2,
	XCircle,
	Clock,
	ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { membersAPI, withdrawalAPI } from "@/lib/api";

interface ApprovalLog {
	id: number;
	approvalLevel: string;
	status: string;
	remarks?: string;
	createdAt: string;
	approvedByUser: {
		name: string;
		role: string;
	};
}

interface WithdrawalRequest {
	id: number;
	amount: number;
	requestedAmount: number;
	approvalStatus: string;
	createdAt: string;
	updatedAt: string;
	approvalLogs: ApprovalLog[];
}

export default function WithdrawalHistoryPage() {
	const { toast } = useToast();
	const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
	const [loading, setLoading] = useState(true);
	const [selectedWithdrawal, setSelectedWithdrawal] =
		useState<WithdrawalRequest | null>(null);
	const [showDetails, setShowDetails] = useState(false);

	useEffect(() => {
		const fetchWithdrawalHistory = async () => {
			try {
				setLoading(true);
				// Get current member
				const memberRes = await membersAPI.getCurrentMember();
				if (!memberRes) throw new Error("Failed to fetch member data");
				// Get withdrawal history
				const historyRes = await withdrawalAPI.getBalanceHistory(memberRes.id);
				if (!historyRes) throw new Error("Failed to fetch balance history");
				setWithdrawals(historyRes);
			} catch (err) {
				console.error("Error fetching withdrawal history:", err);
				toast({
					title: "Error",
					description: "Failed to load withdrawal history",
					variant: "destructive",
				});
			} finally {
				setLoading(false);
			}
		};

		fetchWithdrawalHistory();
	}, [toast]);

	const getStatusIcon = (status: string) => {
		switch (status) {
			case "DISBURSED":
				return <CheckCircle2 className="h-5 w-5 text-green-600" />;
			case "REJECTED":
				return <XCircle className="h-5 w-5 text-red-600" />;
			case "PENDING":
			case "APPROVED_BY_ACCOUNTANT":
			case "APPROVED_BY_SUPERVISOR":
			case "APPROVED_BY_MANAGER":
				return <Clock className="h-5 w-5 text-blue-600" />;
			default:
				return <AlertCircle className="h-5 w-5 text-gray-600" />;
		}
	};

	const getStatusBadge = (status: string) => {
		switch (status) {
			case "DISBURSED":
				return (
					<Badge className="bg-green-100 text-green-800 hover:bg-green-100">
						Disbursed
					</Badge>
				);
			case "REJECTED":
				return (
					<Badge className="bg-red-100 text-red-800 hover:bg-red-100">
						Rejected
					</Badge>
				);
			case "PENDING":
				return (
					<Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
						Pending Review
					</Badge>
				);
			case "APPROVED_BY_ACCOUNTANT":
				return (
					<Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
						Accountant Approved
					</Badge>
				);
			case "APPROVED_BY_SUPERVISOR":
				return (
					<Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
						Supervisor Approved
					</Badge>
				);
			case "APPROVED_BY_MANAGER":
				return (
					<Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
						Manager Approved
					</Badge>
				);
			default:
				return <Badge>{status}</Badge>;
		}
	};

	const getApprovalStage = (status: string) => {
		const stages = [
			{ name: "Accountant", key: "PENDING" },
			{ name: "Supervisor", key: "APPROVED_BY_ACCOUNTANT" },
			{ name: "Manager", key: "APPROVED_BY_SUPERVISOR" },
			{ name: "Disbursed", key: "APPROVED_BY_MANAGER" },
		];

		const currentIndex = stages.findIndex((s) => s.key === status);
		return stages.map((stage, index) => ({
			...stage,
			completed: index < currentIndex,
			current: index === currentIndex,
		}));
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<Loader2 className="h-8 w-8 animate-spin text-primary" />
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-background p-4 md:p-8">
			<div className="max-w-6xl mx-auto">
				{/* Header */}
				<div className="mb-8 flex items-center justify-between">
					<div>
						<h1 className="text-3xl font-bold text-foreground mb-2">
							Withdrawal History
						</h1>
						<p className="text-muted-foreground">
							View all your withdrawal requests and their approval status
						</p>
					</div>
					<Link href="/member/withdrawals/request">
						<Button>New Withdrawal Request</Button>
					</Link>
				</div>

				{/* Empty State */}
				{withdrawals.length === 0 ? (
					<Card>
						<CardContent className="pt-12 pb-12 text-center">
							<AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
							<h3 className="text-lg font-semibold mb-2">
								No Withdrawal Requests
							</h3>
							<p className="text-muted-foreground mb-6">
								You haven't submitted any withdrawal requests yet.
							</p>
							<Link href="/member/withdrawals/request">
								<Button>Submit Your First Request</Button>
							</Link>
						</CardContent>
					</Card>
				) : (
					<div className="space-y-4">
						{/* Withdrawal Requests Table */}
						<Card>
							<CardHeader>
								<CardTitle>All Withdrawal Requests</CardTitle>
								<CardDescription>
									Total requests: {withdrawals.length}
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="overflow-x-auto">
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>Request ID</TableHead>
												<TableHead>Amount</TableHead>
												<TableHead>Status</TableHead>
												<TableHead>Requested Date</TableHead>
												<TableHead>Last Updated</TableHead>
												<TableHead className="text-right">Action</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{withdrawals.map((withdrawal) => (
												<TableRow key={withdrawal.id}>
													<TableCell className="font-medium">
														#{withdrawal.id}
													</TableCell>
													<TableCell className="font-semibold">
														ETB {Number(withdrawal.amount).toFixed(2)}
													</TableCell>
													<TableCell>
														{getStatusBadge(withdrawal.approvalStatus)}
													</TableCell>
													<TableCell className="text-sm text-muted-foreground">
														{formatDate(withdrawal.createdAt)}
													</TableCell>
													<TableCell className="text-sm text-muted-foreground">
														{formatDate(withdrawal.updatedAt)}
													</TableCell>
													<TableCell className="text-right">
														<Button
															variant="outline"
															size="sm"
															onClick={() => {
																setSelectedWithdrawal(withdrawal);
																setShowDetails(true);
															}}>
															View Details
														</Button>
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</div>
							</CardContent>
						</Card>
					</div>
				)}

				{/* Details Dialog */}
				<Dialog open={showDetails} onOpenChange={setShowDetails}>
					<DialogContent className="max-w-2xl">
						<DialogHeader>
							<DialogTitle>Withdrawal Request Details</DialogTitle>
							<DialogDescription>
								Request ID: #{selectedWithdrawal?.id}
							</DialogDescription>
						</DialogHeader>

						{selectedWithdrawal && (
							<div className="space-y-6">
								{/* Amount and Status */}
								<div className="grid grid-cols-2 gap-4">
									<div>
										<p className="text-sm text-muted-foreground mb-1">
											Requested Amount
										</p>
										<p className="text-2xl font-bold">
											ETB{" "}
											{Number(selectedWithdrawal.requestedAmount).toFixed(2)}
										</p>
									</div>
									<div>
										<p className="text-sm text-muted-foreground mb-1">
											Current Status
										</p>
										<div className="flex items-center gap-2">
											{getStatusIcon(selectedWithdrawal.approvalStatus)}
											{getStatusBadge(selectedWithdrawal.approvalStatus)}
										</div>
									</div>
								</div>

								{/* Approval Timeline */}
								<div>
									<p className="text-sm font-semibold mb-4">
										Approval Progress
									</p>
									<div className="space-y-3">
										{getApprovalStage(selectedWithdrawal.approvalStatus).map(
											(stage, index, arr) => (
												<div
													key={stage.key}
													className="flex items-center gap-3">
													<div
														className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold ${
															stage.completed
																? "bg-green-100 text-green-800"
																: stage.current
																? "bg-blue-100 text-blue-800"
																: "bg-gray-100 text-gray-600"
														}`}>
														{stage.completed ? "✓" : index + 1}
													</div>
													<div className="flex-1">
														<p className="font-medium">{stage.name}</p>
														{stage.completed && (
															<p className="text-xs text-muted-foreground">
																{selectedWithdrawal.approvalLogs.find(
																	(log) => log.approvalLevel === stage.name
																)?.createdAt &&
																	formatDate(
																		selectedWithdrawal.approvalLogs.find(
																			(log) => log.approvalLevel === stage.name
																		)?.createdAt || ""
																	)}
															</p>
														)}
													</div>
													{index < arr.length - 1 && (
														<ArrowRight className="h-4 w-4 text-muted-foreground" />
													)}
												</div>
											)
										)}
									</div>
								</div>

								{/* Approval Logs */}
								{selectedWithdrawal.approvalLogs.length > 0 && (
									<div>
										<p className="text-sm font-semibold mb-3">
											Approval History
										</p>
										<div className="space-y-3 max-h-64 overflow-y-auto">
											{selectedWithdrawal.approvalLogs.map((log) => (
												<div
													key={log.id}
													className="border rounded-lg p-3 bg-muted/50">
													<div className="flex items-start justify-between mb-2">
														<div>
															<p className="font-medium text-sm">
																{log.approvalLevel}
															</p>
															<p className="text-xs text-muted-foreground">
																{log.approvedByUser.name}
															</p>
														</div>
														<Badge
															variant={
																log.status === "REJECTED"
																	? "destructive"
																	: "default"
															}
															className="text-xs">
															{log.status === "REJECTED"
																? "Rejected"
																: "Approved"}
														</Badge>
													</div>
													{log.remarks && (
														<p className="text-sm text-muted-foreground italic">
															"{log.remarks}"
														</p>
													)}
													<p className="text-xs text-muted-foreground mt-2">
														{formatDate(log.createdAt)}
													</p>
												</div>
											))}
										</div>
									</div>
								)}

								{/* Dates */}
								<div className="grid grid-cols-2 gap-4 pt-4 border-t">
									<div>
										<p className="text-xs text-muted-foreground">
											Requested On
										</p>
										<p className="text-sm font-medium">
											{formatDate(selectedWithdrawal.createdAt)}
										</p>
									</div>
									<div>
										<p className="text-xs text-muted-foreground">
											Last Updated
										</p>
										<p className="text-sm font-medium">
											{formatDate(selectedWithdrawal.updatedAt)}
										</p>
									</div>
								</div>
							</div>
						)}
					</DialogContent>
				</Dialog>
			</div>
		</div>
	);
}
