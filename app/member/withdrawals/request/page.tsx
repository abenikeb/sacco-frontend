"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { membersAPI, withdrawalAPI } from "@/lib/api";

interface MemberData {
	id: number;
	name: string;
	email: string;
}

interface WithdrawalBalance {
	willingDepositBalance: number;
	totalDeposited: number;
	totalWithdrawn: number;
}

export default function WithdrawalRequestPage() {
	const router = useRouter();
	const { toast } = useToast();
	const [memberData, setMemberData] = useState<MemberData | null>(null);
	const [balance, setBalance] = useState<WithdrawalBalance | null>(null);
	const [amount, setAmount] = useState("");
	const [loading, setLoading] = useState(false);
	const [fetching, setFetching] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		const fetchData = async () => {
			try {
				setFetching(true);
				const memberRes = await membersAPI.getCurrentMember();
				if (!memberRes) throw new Error("Failed to fetch member data");
				console.log({
					memberRes,
				});
				setMemberData(memberRes);

				// Get willing deposit balance
				const balanceRes = await withdrawalAPI.getCurrentBalance(memberRes.id);
				console.log({
					balanceRes,
				});
				if (!balanceRes) throw new Error("Failed to fetch balance");
				setBalance(balanceRes);
			} catch (err) {
				console.error("Error fetching data:", err);
				setError("Failed to load withdrawal information");
				toast({
					title: "Error",
					description: "Failed to load withdrawal information",
					variant: "destructive",
				});
			} finally {
				setFetching(false);
			}
		};

		fetchData();
	}, [toast]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");

		// Validate input
		const withdrawalAmount = Number.parseFloat(amount);
		if (!withdrawalAmount || withdrawalAmount <= 0) {
			setError("Please enter a valid amount");
			return;
		}

		if (!balance || withdrawalAmount > balance.willingDepositBalance) {
			setError("Insufficient willing deposit balance");
			return;
		}

		try {
			setLoading(true);
			const url = `/withdrawals/submit`;
			const method = "POST";

			const response = await withdrawalAPI.updateWithdrawalRequest({
				url,
				method,
				data: {
					memberId: memberData?.id,
					amount: withdrawalAmount,
				},
			});

			// const response = await fetch("/api/withdrawals/submit", {
			// 	method: "POST",
			// 	headers: { "Content-Type": "application/json" },
			// 	body: JSON.stringify({
			// 		memberId: memberData?.id,
			// 		amount: withdrawalAmount,
			// 	}),
			// });

			if (!response) {
				const errorData = await response.json();
				throw new Error(
					errorData.error || "Failed to submit withdrawal request"
				);
			}

			// const result = await response.json();
			toast({
				title: "Success",
				description:
					"Withdrawal request submitted successfully. It will be reviewed by the accountant.",
				variant: "default",
			});

			// Reset form
			setAmount("");

			// Redirect to withdrawal history after 2 seconds
			setTimeout(() => {
				router.push("/member/withdrawals/history");
			}, 2000);
		} catch (err) {
			const errorMessage =
				err instanceof Error
					? err.message
					: "Failed to submit withdrawal request";
			setError(errorMessage);
			toast({
				title: "Error",
				description: errorMessage,
				variant: "destructive",
			});
		} finally {
			setLoading(false);
		}
	};

	if (fetching) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<Loader2 className="h-8 w-8 animate-spin text-primary" />
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-background p-4 md:p-8">
			<div className="max-w-2xl mx-auto">
				{/* Header */}
				<div className="mb-8">
					<h1 className="text-3xl font-bold text-foreground mb-2">
						Withdrawal Request
					</h1>
					<p className="text-muted-foreground">
						Submit a withdrawal request from your willing deposit
					</p>
				</div>

				{/* Balance Card */}
				{balance && (
					<Card className="mb-6 border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
						<CardHeader>
							<CardTitle className="text-lg">
								Your Willing Deposit Balance
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-3 gap-4">
								<div>
									<p className="text-sm text-muted-foreground mb-1">
										Total Deposited
									</p>
									<p className="text-2xl font-bold text-foreground">
										{balance.totalDeposited.toFixed(2)}
									</p>
								</div>
								<div>
									<p className="text-sm text-muted-foreground mb-1">
										Total Withdrawn
									</p>
									<p className="text-2xl font-bold text-destructive">
										{balance.totalWithdrawn.toFixed(2)}
									</p>
								</div>
								<div>
									<p className="text-sm text-muted-foreground mb-1">
										Available Balance
									</p>
									<p className="text-2xl font-bold text-green-600">
										{balance.willingDepositBalance.toFixed(2)}
									</p>
								</div>
							</div>
						</CardContent>
					</Card>
				)}

				{/* Withdrawal Form */}
				<Card>
					<CardHeader>
						<CardTitle>Submit Withdrawal Request</CardTitle>
						<CardDescription>
							Enter the amount you wish to withdraw from your willing deposit
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleSubmit} className="space-y-6">
							{/* Error Alert */}
							{error && (
								<Alert variant="destructive">
									<AlertCircle className="h-4 w-4" />
									<AlertDescription>{error}</AlertDescription>
								</Alert>
							)}

							{/* Member Info */}
							<div className="space-y-2">
								<Label className="text-base font-semibold">
									Member Information
								</Label>
								<div className="grid grid-cols-2 gap-4">
									<div>
										<p className="text-sm text-muted-foreground">Name</p>
										<p className="font-medium">{memberData?.name}</p>
									</div>
									<div>
										<p className="text-sm text-muted-foreground">Email</p>
										<p className="font-medium">{memberData?.email}</p>
									</div>
								</div>
							</div>

							{/* Withdrawal Amount */}
							<div className="space-y-2">
								<Label htmlFor="amount" className="text-base font-semibold">
									Withdrawal Amount
								</Label>
								<div className="relative">
									<span className="absolute left-3 top-3 text-muted-foreground">
										E
									</span>
									<Input
										id="amount"
										type="number"
										placeholder="0.00"
										value={amount}
										onChange={(e) => setAmount(e.target.value)}
										className="pl-7"
										step="0.01"
										min="0"
										disabled={loading}
									/>
								</div>
								{balance && amount && (
									<p className="text-sm text-muted-foreground">
										Available: ${balance.willingDepositBalance.toFixed(2)}
									</p>
								)}
							</div>

							{/* Info Alert */}
							<Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
								<AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
								<AlertDescription className="text-blue-800 dark:text-blue-200">
									Your withdrawal request will go through a multi-level approval
									process:
									<ul className="list-disc list-inside mt-2 space-y-1 text-sm">
										<li>Accountant Review</li>
										<li>Supervisor Confirmation</li>
										<li>Manager Final Approval & Disbursement</li>
									</ul>
								</AlertDescription>
							</Alert>

							{/* Submit Button */}
							<Button
								type="submit"
								disabled={loading || !amount}
								className="w-full"
								size="lg">
								{loading ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Submitting...
									</>
								) : (
									<>
										<CheckCircle2 className="mr-2 h-4 w-4" />
										Submit Withdrawal Request
									</>
								)}
							</Button>
						</form>
					</CardContent>
				</Card>

				{/* Info Section */}
				<Card className="mt-6 bg-muted/50">
					<CardHeader>
						<CardTitle className="text-base">Important Information</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3 text-sm">
						<p>
							<span className="font-semibold">Withdrawal Source:</span>{" "}
							Withdrawals are only permitted from your willing deposit balance.
						</p>
						<p>
							<span className="font-semibold">Processing Time:</span> Your
							request will be processed within 2-3 business days after final
							approval.
						</p>
						<p>
							<span className="font-semibold">Approval Required:</span> All
							withdrawals require approval from the accountant, supervisor, and
							manager.
						</p>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
