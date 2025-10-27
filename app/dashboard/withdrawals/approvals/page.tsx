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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { CheckCircle2, XCircle, Loader2, Clock } from "lucide-react";
import { withdrawalAPI } from "@/lib/api";
import { useAuth } from "@/components/auth-provider";

interface WithdrawalRequest {
	id: number;
	memberId: number;
	amount: number;
	requestedAmount: number;
	approvalStatus: string;
	member: {
		id: number;
		name: string;
		email: string;
	};
	approvalLogs: Array<{
		id: number;
		approvalLevel: string;
		status: string;
		remarks?: string;
		createdAt: string;
		approvedByUser: {
			name: string;
		};
	}>;
	createdAt: string;
}

export default function WithdrawalApprovalsPage() {
	const { toast } = useToast();
	const { user, logout } = useAuth();
	const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
	const [loading, setLoading] = useState(true);
	const [userRole, setUserRole] = useState("");
	const [selectedWithdrawal, setSelectedWithdrawal] =
		useState<WithdrawalRequest | null>(null);
	const [remarks, setRemarks] = useState("");
	const [actionLoading, setActionLoading] = useState(false);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [actionType, setActionType] = useState<"approve" | "reject">("approve");

	useEffect(() => {
		const fetchData = async () => {
			try {
				setLoading(true);
				// Get current user role
				setUserRole(user?.role as any);

				// Get pending withdrawals for this role
				const withdrawalsRes = await withdrawalAPI.getPendingWithdrawals(
					user?.role
				);
				if (!withdrawalsRes) throw new Error("Failed to fetch withdrawals");
				console.log({
					withdrawalsRes,
				});
				setWithdrawals(withdrawalsRes);
			} catch (err) {
				console.error("Error fetching data:", err);
				toast({
					title: "Error",
					description: "Failed to load withdrawal requests",
					variant: "destructive",
				});
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, [toast]);

	const handleApprove = async () => {
		if (!selectedWithdrawal) return;

		try {
			setActionLoading(true);

			const url = `/withdrawals/approve/${selectedWithdrawal.id}`;
			const method = "POST";

			const response = await withdrawalAPI.updateWithdrawalRequest({
				url,
				method,
				data: {
					approvedByUserId: user?.id,
					approvalLevel: userRole,
					remarks,
				},
			});

			// const response = await fetch(
			// 	`/api/withdrawals/approve/${selectedWithdrawal.id}`,
			// 	{
			// 		method: "POST",
			// 		headers: { "Content-Type": "application/json" },
			// 		body: JSON.stringify({
			// 			approvedByUserId: 1, // Get from current user
			// 			approvalLevel: userRole,
			// 			remarks,
			// 		}),
			// 	}
			// );

			if (!response) throw new Error("Failed to approve withdrawal");

			toast({
				title: "Success",
				description: "Withdrawal request approved successfully",
				variant: "default",
			});

			// Remove from list
			setWithdrawals(withdrawals.filter((w) => w.id !== selectedWithdrawal.id));
			setDialogOpen(false);
			setRemarks("");
			setSelectedWithdrawal(null);
		} catch (err) {
			toast({
				title: "Error",
				description:
					err instanceof Error ? err.message : "Failed to approve withdrawal",
				variant: "destructive",
			});
		} finally {
			setActionLoading(false);
		}
	};

	const handleReject = async () => {
		if (!selectedWithdrawal || !remarks) {
			toast({
				title: "Error",
				description: "Please provide a reason for rejection",
				variant: "destructive",
			});
			return;
		}

		try {
			setActionLoading(true);
			const url = `/withdrawals/reject/${selectedWithdrawal.id}`;
			const method = "POST";

			const response = await withdrawalAPI.updateWithdrawalRequest({
				url,
				method,
				data: {
					approvedByUserId: user?.id,
					approvalLevel: userRole,
					remarks,
				},
			});

			// const response = await fetch(
			// 	`/api/withdrawals/reject/${selectedWithdrawal.id}`,
			// 	{
			// 		method: "POST",
			// 		headers: { "Content-Type": "application/json" },
			// 		body: JSON.stringify({
			// 			approvedByUserId: 1, // Get from current user
			// 			approvalLevel: userRole,
			// 			remarks,
			// 		}),
			// 	}
			// );

			if (!response) throw new Error("Failed to reject withdrawal");

			toast({
				title: "Success",
				description: "Withdrawal request rejected successfully",
				variant: "default",
			});

			// Remove from list
			setWithdrawals(withdrawals.filter((w) => w.id !== selectedWithdrawal.id));
			setDialogOpen(false);
			setRemarks("");
			setSelectedWithdrawal(null);
		} catch (err) {
			toast({
				title: "Error",
				description:
					err instanceof Error ? err.message : "Failed to reject withdrawal",
				variant: "destructive",
			});
		} finally {
			setActionLoading(false);
		}
	};

	const getRoleDisplay = (role: string) => {
		const roleMap: { [key: string]: string } = {
			ACCOUNTANT: "Accountant Review",
			SUPERVISOR: "Supervisor Confirmation",
			MANAGER: "Manager Approval",
		};
		return roleMap[role] || role;
	};

	const getStatusColor = (status: string) => {
		const colorMap: { [key: string]: string } = {
			PENDING:
				"bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
			APPROVED_BY_ACCOUNTANT:
				"bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
			APPROVED_BY_SUPERVISOR:
				"bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
			APPROVED_BY_MANAGER:
				"bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
			REJECTED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
			DISBURSED:
				"bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
		};
		return colorMap[status] || "bg-gray-100 text-gray-800";
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
				<div className="mb-8">
					<h1 className="text-3xl font-bold text-foreground mb-2">
						Withdrawal Approvals
					</h1>
					<p className="text-muted-foreground">
						Review and approve withdrawal requests - {getRoleDisplay(userRole)}
					</p>
				</div>

				{/* Info Alert */}
				<Alert className="mb-6 bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
					<Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
					<AlertDescription className="text-blue-800 dark:text-blue-200">
						You are reviewing withdrawal requests at the{" "}
						<span className="font-semibold">{getRoleDisplay(userRole)}</span>{" "}
						level. Approved requests will be forwarded to the next approval
						level.
					</AlertDescription>
				</Alert>

				{/* Pending Requests */}
				{withdrawals.length === 0 ? (
					<Card>
						<CardContent className="pt-6">
							<div className="text-center py-12">
								<CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
								<h3 className="text-lg font-semibold mb-2">
									No Pending Requests
								</h3>
								<p className="text-muted-foreground">
									All withdrawal requests at this level have been processed.
								</p>
							</div>
						</CardContent>
					</Card>
				) : (
					<Card>
						<CardHeader>
							<CardTitle>Pending Withdrawal Requests</CardTitle>
							<CardDescription>
								Total: {withdrawals.length} request(s) awaiting your approval
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="overflow-x-auto">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Member</TableHead>
											<TableHead>Amount</TableHead>
											<TableHead>Requested Date</TableHead>
											<TableHead>Status</TableHead>
											<TableHead>Action</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{withdrawals.map((withdrawal) => (
											<TableRow key={withdrawal.id}>
												<TableCell>
													<div>
														<p className="font-medium">
															{withdrawal.member.name}
														</p>
														<p className="text-sm text-muted-foreground">
															{withdrawal.member.email}
														</p>
													</div>
												</TableCell>
												<TableCell className="font-semibold">
													ETB {Number(withdrawal.amount).toFixed(2)}
												</TableCell>
												<TableCell>
													{new Date(withdrawal.createdAt).toLocaleDateString()}
												</TableCell>
												<TableCell>
													<Badge
														className={getStatusColor(
															withdrawal.approvalStatus
														)}>
														{withdrawal.approvalStatus.replace(/_/g, " ")}
													</Badge>
												</TableCell>
												<TableCell>
													<Dialog
														open={
															dialogOpen &&
															selectedWithdrawal?.id === withdrawal.id
														}
														onOpenChange={setDialogOpen}>
														<DialogTrigger asChild>
															<Button
																variant="outline"
																size="sm"
																onClick={() => {
																	setSelectedWithdrawal(withdrawal);
																	setActionType("approve");
																	setRemarks("");
																}}>
																Review
															</Button>
														</DialogTrigger>
														<DialogContent className="max-w-md">
															<DialogHeader>
																<DialogTitle>
																	Review Withdrawal Request
																</DialogTitle>
																<DialogDescription>
																	Member: {selectedWithdrawal?.member.name}
																</DialogDescription>
															</DialogHeader>

															<div className="space-y-4">
																{/* Request Details */}
																<div className="bg-muted p-4 rounded-lg space-y-2">
																	<div className="flex justify-between">
																		<span className="text-sm text-muted-foreground">
																			Amount:
																		</span>
																		<span className="font-semibold">
																			ETB{" "}
																			{Number(
																				selectedWithdrawal?.amount
																			).toFixed(2)}
																		</span>
																	</div>
																	<div className="flex justify-between">
																		<span className="text-sm text-muted-foreground">
																			Requested:
																		</span>
																		<span className="text-sm">
																			{selectedWithdrawal &&
																				new Date(
																					selectedWithdrawal.createdAt
																				).toLocaleDateString()}
																		</span>
																	</div>
																</div>

																{/* Approval History */}
																{selectedWithdrawal?.approvalLogs &&
																	selectedWithdrawal.approvalLogs.length >
																		0 && (
																		<div className="space-y-2">
																			<Label className="text-sm font-semibold">
																				Approval History
																			</Label>
																			<div className="space-y-2 max-h-32 overflow-y-auto">
																				{selectedWithdrawal.approvalLogs.map(
																					(log) => (
																						<div
																							key={log.id}
																							className="text-sm border-l-2 border-primary pl-3 py-1">
																							<p className="font-medium">
																								{log.approvalLevel}
																							</p>
																							<p className="text-xs text-muted-foreground">
																								{log.approvedByUser.name} -{" "}
																								{new Date(
																									log.createdAt
																								).toLocaleDateString()}
																							</p>
																							{log.remarks && (
																								<p className="text-xs mt-1">
																									{log.remarks}
																								</p>
																							)}
																						</div>
																					)
																				)}
																			</div>
																		</div>
																	)}

																{/* Remarks */}
																<div className="space-y-2">
																	<Label
																		htmlFor="remarks"
																		className="text-sm font-semibold">
																		{actionType === "approve"
																			? "Approval Notes (Optional)"
																			: "Rejection Reason (Required)"}
																	</Label>
																	<Textarea
																		id="remarks"
																		placeholder={
																			actionType === "approve"
																				? "Add any notes about this approval..."
																				: "Please provide a reason for rejection..."
																		}
																		value={remarks}
																		onChange={(e) => setRemarks(e.target.value)}
																		className="min-h-24"
																	/>
																</div>

																{/* Action Buttons */}
																<div className="flex gap-3 pt-4">
																	<Button
																		variant="destructive"
																		className="flex-1"
																		disabled={actionLoading}
																		onClick={() => {
																			setActionType("reject");
																		}}>
																		{actionLoading &&
																		actionType === "reject" ? (
																			<>
																				<Loader2 className="mr-2 h-4 w-4 animate-spin" />
																				Rejecting...
																			</>
																		) : (
																			<>
																				<XCircle className="mr-2 h-4 w-4" />
																				Reject
																			</>
																		)}
																	</Button>
																	<Button
																		className="flex-1"
																		disabled={actionLoading}
																		onClick={() => {
																			setActionType("approve");
																			handleApprove();
																		}}>
																		{actionLoading &&
																		actionType === "approve" ? (
																			<>
																				<Loader2 className="mr-2 h-4 w-4 animate-spin" />
																				Approving...
																			</>
																		) : (
																			<>
																				<CheckCircle2 className="mr-2 h-4 w-4" />
																				Approve
																			</>
																		)}
																	</Button>
																</div>
															</div>
														</DialogContent>
													</Dialog>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
						</CardContent>
					</Card>
				)}
			</div>
		</div>
	);
}
