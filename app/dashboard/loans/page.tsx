"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { loanAPI } from "@/lib/api";

interface Loan {
	id: number;
	memberId: number;
	memberName: string;
	amount: number;
	interestRate: number;
	tenureMonths: number;
	status: string;
	createdAt: string;
}

export default function LoansListPage() {
	const [loans, setLoans] = useState<Loan[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");
	const router = useRouter();
	const { toast } = useToast();

	// Fetch loans data
	const fetchLoans = useCallback(async () => {
		setIsLoading(true);
		try {
			const response = await loanAPI.getLoan();
			if (!response) {
				throw new Error("Failed to fetch loans");
			}

			setLoans(response);
		} catch (error) {
			console.error("Error fetching loans:", error);
			toast({
				title: "Error",
				description: "Failed to load loans. Please try again.",
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
		}
	}, [toast]);

	useEffect(() => {
		fetchLoans();
	}, [fetchLoans]);

	const filteredLoans = loans.filter((loan) =>
		// loan.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
		loan.status.toLowerCase().includes(searchTerm.toLowerCase())
	);

	const getStatusColor = (status: string) => {
		switch (status) {
			case "PENDING":
				return "bg-yellow-500";
			case "VERIFIED":
				return "bg-blue-500";
			case "APPROVED":
				return "bg-green-500";
			case "DISBURSED":
				return "bg-purple-500";
			case "REPAID":
				return "bg-gray-500";
			case "REJECTED":
				return "bg-red-500";
			default:
				return "bg-gray-500";
		}
	};

	return (
		<div className="space-y-4">
			<h1 className="text-2xl font-bold">Loans List</h1>
			<div className="flex justify-between items-center">
				<Input
					placeholder="Search loans..."
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
					className="max-w-sm"
				/>
			</div>
			{isLoading ? (
				<p>Loading loans...</p>
			) : (
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Loan ID</TableHead>
							<TableHead>Member Name</TableHead>
							<TableHead>Amount</TableHead>
							<TableHead>Interest Rate</TableHead>
							<TableHead>Tenure (Months)</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Created At</TableHead>
							<TableHead>Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{filteredLoans.map((loan) => (
							<TableRow key={loan.id}>
								<TableCell>{loan.id}</TableCell>
								<TableCell>{loan.memberName}</TableCell>
								<TableCell>ETB {Number(loan.amount).toFixed(2)}</TableCell>
								<TableCell>{loan.interestRate}%</TableCell>
								<TableCell>{loan.tenureMonths}</TableCell>
								<TableCell>
									<Badge className={getStatusColor(loan.status)}>
										{loan.status}
									</Badge>
								</TableCell>
								<TableCell>
									{new Date(loan.createdAt).toLocaleDateString()}
								</TableCell>
								<TableCell>
									<Button
										variant="outline"
										size="sm"
										onClick={() => router.push(`/dashboard/loans/${loan.id}`)}>
										View
									</Button>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			)}
		</div>
	);
}
