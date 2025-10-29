"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { addDays } from "date-fns";
import { loanAPI } from "@/lib/api";

interface ApprovalLog {
	id: number;
	loanId: number;
	loanAmount: number;
	loanStatus: string;
	memberName: string;
	memberEtNumber: number;
	approvedBy: string;
	approverRole: string;
	status: string;
	approvalOrder: number;
	comments: string;
	approvalDate: string;
}

export default function ApprovalHistoryPage() {
	const [approvalLogs, setApprovalLogs] = useState<ApprovalLog[]>([]);
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState("ALL");
	const [dateRange, setDateRange] = useState({
		from: addDays(new Date(), -30),
		to: new Date(),
	});
	const { toast } = useToast();

	const fetchApprovalHistory = useCallback(async () => {
		try {
			const params = new URLSearchParams({
				search: searchTerm,
				status: statusFilter,
				fromDate: dateRange.from?.toISOString() || "",
				toDate: dateRange.to?.toISOString() || "",
				page: "1",
				pageSize: "50", // Adjust as needed
			});
			const response = await loanAPI.getLoanApprovalHistory(params as any);
			if (response) {
				setApprovalLogs(response.logs);
			} else {
				throw new Error("Failed to fetch approval history");
			}
		} catch (error) {
			console.error("Error fetching approval history:", error);
			toast({
				title: "Failed to fetch approval history",
				variant: "destructive",
			});
		}
	}, [searchTerm, statusFilter, dateRange, toast]);

	useEffect(() => {
		fetchApprovalHistory();
	}, [fetchApprovalHistory]);

	const filteredLogs = useMemo(() => {
		return approvalLogs;
	}, [approvalLogs]);

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat("en-ET", {
			style: "currency",
			currency: "ETB",
			minimumFractionDigits: 2,
		}).format(amount);
	};

	const getStatusColor = (status: string) => {
		switch (status.toLowerCase()) {
			case "approved":
				return "bg-green-500";
			case "rejected":
				return "bg-red-500";
			case "pending":
				return "bg-yellow-500";
			default:
				return "bg-gray-500";
		}
	};

	return (
		<Card className="w-full">
			<CardHeader>
				<CardTitle>Loan Approval History</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="flex flex-col md:flex-row gap-4 mb-4">
					<Input
						placeholder="Search by Loan ID, Member, or Approver"
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="w-full md:w-1/3"
					/>
					<Select value={statusFilter} onValueChange={setStatusFilter}>
						<SelectTrigger className="w-full md:w-1/4">
							<SelectValue placeholder="Filter by Status" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="ALL">All Statuses</SelectItem>
							<SelectItem value="APPROVED">Approved</SelectItem>
							<SelectItem value="REJECTED">Rejected</SelectItem>
							<SelectItem value="PENDING">Pending</SelectItem>
						</SelectContent>
					</Select>
					<DatePickerWithRange date={dateRange} setDate={setDateRange} />
				</div>
				<div className="rounded-md border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Loan ID</TableHead>
								<TableHead>Member</TableHead>
								<TableHead>Loan Amount</TableHead>
								<TableHead>Loan Status</TableHead>
								<TableHead>Approved By</TableHead>
								{/* <TableHead>Remark</TableHead> */}

								<TableHead>Status</TableHead>
								<TableHead>Approval Date</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{filteredLogs.map((log) => (
								<TableRow key={log.id}>
									<TableCell>{log.loanId}</TableCell>
									<TableCell>
										{log.memberName} (ET: {log.memberEtNumber})
									</TableCell>
									<TableCell>{formatCurrency(log.loanAmount)}</TableCell>
									<TableCell>{log.loanStatus}</TableCell>
									<TableCell>
										{log.approvedBy} ({log.approverRole})
									</TableCell>
									{/* <TableCell>
										{log.comments} ({log.comments})
									</TableCell> */}
									<TableCell>
										<Badge className={getStatusColor(log.status)}>
											{log.status}
										</Badge>
									</TableCell>
									<TableCell>
										{new Date(log.approvalDate).toLocaleString()}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			</CardContent>
		</Card>
	);
}
