"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Search, ChevronDown, ChevronUp } from "lucide-react";
import { loanAPI } from "@/lib/api";

interface Loan {
	id: number;
	memberId: number;
	amount: number;
	interestRate: number;
	tenureMonths: number;
	status: string;
	createdAt: string;
	member: {
		name: string;
	};
}

export default function LoanDetailsPage() {
	const [loans, setLoans] = useState<Loan[]>([]);
	const [filteredLoans, setFilteredLoans] = useState<Loan[]>([]);
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState("ALL");
	const [sortConfig, setSortConfig] = useState<{
		key: keyof Loan | "expectedRepayment";
		direction: "ascending" | "descending";
	} | null>(null);
	const router = useRouter();
	const { toast } = useToast();

	useEffect(() => {
		fetchLoans();
	}, []);

	useEffect(() => {
		filterLoans();
	}, [loans, searchTerm, statusFilter]);

	const fetchLoans = async () => {
		try {
			const data = await loanAPI.getLoan();
			if (data) {
				setLoans(data);
			} else {
				throw new Error("Failed to fetch loans");
			}
		} catch (error) {
			console.error("Error fetching loans:", error);
			toast({ title: "Failed to fetch loans", variant: "destructive" });
		}
	};

	const filterLoans = () => {
		let filtered = loans;

		if (searchTerm) {
			filtered = filtered.filter(
				(loan) =>
					loan.member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
					loan.id.toString().includes(searchTerm)
			);
		}

		if (statusFilter !== "ALL") {
			filtered = filtered.filter((loan) => loan.status === statusFilter);
		}

		setFilteredLoans(filtered);
	};

	const calculateExpectedRepayment = (loan: Loan) => {
		const monthlyInterestRate = loan.interestRate / 100 / 12;
		const totalRepayment =
			loan.amount * Math.pow(1 + monthlyInterestRate, loan.tenureMonths);
		return totalRepayment;
	};

	const handleSort = (key: keyof Loan | "expectedRepayment") => {
		let direction: "ascending" | "descending" = "ascending";
		if (
			sortConfig &&
			sortConfig.key === key &&
			sortConfig.direction === "ascending"
		) {
			direction = "descending";
		}
		setSortConfig({ key, direction });

		const sortedLoans = [...filteredLoans].sort((a, b) => {
			if (key === "member") {
				if (a.member.name < b.member.name)
					return direction === "ascending" ? -1 : 1;
				if (a.member.name > b.member.name)
					return direction === "ascending" ? 1 : -1;
				return 0;
			}
			if (key === "expectedRepayment") {
				const aRepayment = calculateExpectedRepayment(a);
				const bRepayment = calculateExpectedRepayment(b);
				if (aRepayment < bRepayment) return direction === "ascending" ? -1 : 1;
				if (aRepayment > bRepayment) return direction === "ascending" ? 1 : -1;
				return 0;
			}
			if (a[key] < b[key]) return direction === "ascending" ? -1 : 1;
			if (a[key] > b[key]) return direction === "ascending" ? 1 : -1;
			return 0;
		});

		setFilteredLoans(sortedLoans);
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case "PENDING":
				return "bg-yellow-500 text-white";
			case "VERIFIED":
				return "bg-blue-500 text-white";
			case "APPROVED":
				return "bg-green-500 text-white";
			case "DISBURSED":
				return "bg-purple-500 text-white";
			case "REPAID":
				return "bg-gray-500 text-white";
			case "REJECTED":
				return "bg-red-500 text-white";
			default:
				return "bg-gray-300 text-gray-800";
		}
	};

	const renderSortIcon = (key: keyof Loan | "expectedRepayment") => {
		if (sortConfig && sortConfig.key === key) {
			return sortConfig.direction === "ascending" ? (
				<ChevronUp className="w-4 h-4" />
			) : (
				<ChevronDown className="w-4 h-4" />
			);
		}
		return null;
	};

	return (
		<Card className="w-full">
			<CardHeader>
				<CardTitle>Loan Details</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="flex justify-between items-center mb-4">
					<div className="flex items-center space-x-2">
						<Label htmlFor="search">Search:</Label>
						<div className="relative">
							<Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
							<Input
								id="search"
								placeholder="Search by name or ID"
								className="pl-8"
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
							/>
						</div>
					</div>
					<div className="flex items-center space-x-2">
						<Label htmlFor="status-filter">Status:</Label>
						<Select value={statusFilter} onValueChange={setStatusFilter}>
							<SelectTrigger id="status-filter" className="w-[180px]">
								<SelectValue placeholder="Filter by status" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="ALL">All Statuses</SelectItem>
								<SelectItem value="PENDING">Pending</SelectItem>
								<SelectItem value="VERIFIED">Verified</SelectItem>
								<SelectItem value="APPROVED">Approved</SelectItem>
								<SelectItem value="DISBURSED">Disbursed</SelectItem>
								<SelectItem value="REPAID">Repaid</SelectItem>
								<SelectItem value="REJECTED">Rejected</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead
								className="cursor-pointer"
								onClick={() => handleSort("id")}>
								Loan ID {renderSortIcon("id")}
							</TableHead>
							<TableHead
								className="cursor-pointer"
								onClick={() => handleSort("member")}>
								Member Name {renderSortIcon("member")}
							</TableHead>
							<TableHead
								className="cursor-pointer"
								onClick={() => handleSort("amount")}>
								Amount {renderSortIcon("amount")}
							</TableHead>
							<TableHead
								className="cursor-pointer"
								onClick={() => handleSort("interestRate")}>
								Interest Rate {renderSortIcon("interestRate")}
							</TableHead>
							<TableHead
								className="cursor-pointer"
								onClick={() => handleSort("tenureMonths")}>
								Tenure (Months) {renderSortIcon("tenureMonths")}
							</TableHead>
							<TableHead
								className="cursor-pointer"
								onClick={() => handleSort("expectedRepayment")}>
								Expected Repayment {renderSortIcon("expectedRepayment")}
							</TableHead>
							<TableHead
								className="cursor-pointer"
								onClick={() => handleSort("status")}>
								Status {renderSortIcon("status")}
							</TableHead>
							<TableHead
								className="cursor-pointer"
								onClick={() => handleSort("createdAt")}>
								Created At {renderSortIcon("createdAt")}
							</TableHead>
							<TableHead>Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{filteredLoans.length === 0 ? (
							<div className="pt-8 text-xl text-gray-500 flex justify-center items-center w-full font-medium">
								No Pending Loans Found
							</div>
						) : (
							filteredLoans.map((loan) => (
								<TableRow key={loan.id}>
									<TableCell>{loan.id}</TableCell>
									<TableCell>{loan.member.name}</TableCell>
									<TableCell>
										{new Intl.NumberFormat("en-ET", {
											style: "currency",
											currency: "ETB",
										}).format(Number(loan.amount))}
									</TableCell>
									<TableCell>{loan.interestRate}%</TableCell>
									<TableCell>{loan.tenureMonths}</TableCell>
									<TableCell>
										{new Intl.NumberFormat("en-ET", {
											style: "currency",
											currency: "ETB",
										}).format(calculateExpectedRepayment(loan))}
									</TableCell>
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
											onClick={() =>
												router.push(`/dashboard/loans/details/${loan.id}`)
											}>
											View
										</Button>
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</CardContent>
		</Card>
	);
}
