"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
	Card,
	CardHeader,
	CardTitle,
	CardContent,
	CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	FileText,
	Info,
	Calculator,
	AlertCircle,
	CheckCircle,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { membersAPI, membersLoanAPI, loanAgreement } from "@/lib/api";

interface Member {
	id: number;
	name: string;
	etNumber: number;
}

interface ActiveLoanBalance {
	totalDisbursed: number;
	totalRepaid: number;
	remainingBalance: number;
	activeLoansCount: number;
}

interface MemberData {
	totalSavings: number;
	totalContributions: number;
	monthlySalary: number;
	maxLoanBasedOnSalary: number;
	maxLoanBasedOnSavings: number;
	maxLoanAmount: number;
	hasActiveLoan: boolean;
	activeLoanBalance: ActiveLoanBalance | null;
	savingsRequirementRate: number;
	maxLoanTerm: number;
	interestRate: number;
}

export default function LoanApplicationPage() {
	const { user } = useAuth();
	const { toast } = useToast();
	const router = useRouter();
	const [amount, setAmount] = useState("");
	const [interestRate] = useState("9.5");
	const [tenureMonths] = useState("120");
	const [purpose, setPurpose] = useState("");
	const [coSigner1, setCoSigner1] = useState("");
	const [coSigner2, setCoSigner2] = useState("");
	const [members, setMembers] = useState<Member[]>([]);
	const [file, setFile] = useState<File | null>(null);
	const [memberData, setMemberData] = useState<MemberData | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	const maxLoanAmount = memberData?.maxLoanAmount || 0;
	const requiredContributionRate = memberData?.savingsRequirementRate || 0.3;
	const requiredContribution =
		Number.parseFloat(amount || "0") * requiredContributionRate;

	useEffect(() => {
		fetchMembers();
		fetchMemberData();
	}, []);

	const fetchMembers = async () => {
		try {
			const data = await membersAPI.getMembers();
			setMembers(data.filter((member: Member) => member.id !== user?.id));
		} catch (error) {
			console.error("Error fetching members:", error);
			toast({
				title: "Error",
				description: "Failed to load members. Please try again.",
				variant: "destructive",
			});
		}
	};

	const fetchMemberData = async () => {
		try {
			setIsLoading(true);
			const data = await membersLoanAPI.loanEligibilityReq();
			setMemberData(data);
		} catch (error) {
			console.error("Error fetching member data:", error);
			toast({
				title: "Error",
				description: "Failed to load your eligibility data. Please try again.",
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
		}
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files) {
			setFile(e.target.files[0]);
		}
	};

	const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		const numValue = Number.parseFloat(value);

		if (numValue > maxLoanAmount) {
			toast({
				title: "Amount Exceeds Limit",
				description: `Maximum loan amount is ${maxLoanAmount.toLocaleString()} ETB`,
				variant: "destructive",
			});
			return;
		}

		setAmount(value);
	};

	const validateForm = () => {
		if (!memberData) {
			toast({
				title: "Error",
				description: "Member data not loaded. Please refresh and try again.",
				variant: "destructive",
			});
			return false;
		}

		const amountValue = Number.parseFloat(amount);

		// Requirement 1: Validate loan amount is provided
		if (!amount || amountValue <= 0) {
			toast({
				title: "Invalid Amount",
				description: "Please enter a valid loan amount.",
				variant: "destructive",
			});
			return false;
		}

		// Requirement 2: Validate max loan term (120 months)
		if (Number.parseInt(tenureMonths) > 120) {
			toast({
				title: "Invalid Tenure",
				description: "Loan tenure cannot exceed 120 months (10 years).",
				variant: "destructive",
			});
			return false;
		}

		// Requirement 3: Validate savings requirement before loan (30% of requested amount)
		if (memberData.totalSavings < requiredContribution) {
			toast({
				title: "Insufficient Savings",
				description: `You need at least ${requiredContribution.toLocaleString()} ETB in savings (${
					requiredContributionRate * 100
				}% of requested amount). Current savings: ${memberData.totalSavings.toLocaleString()} ETB`,
				variant: "destructive",
			});
			return false;
		}

		// Requirement 4: Validate loan limit based on salary (max 30 months' salary)
		if (amountValue > memberData.maxLoanBasedOnSalary) {
			toast({
				title: "Exceeds Salary Limit",
				description: `Loan amount cannot exceed ${memberData.maxLoanBasedOnSalary.toLocaleString()} ETB (30 months of your salary).`,
				variant: "destructive",
			});
			return false;
		}

		// Requirement 5: Validate savings requirement during active loan (35% of monthly income)
		if (memberData.hasActiveLoan) {
			const requiredMonthlySavings = memberData.monthlySalary * 0.35;
			toast({
				title: "Active Loan Notice",
				description: `You have an active loan. You must continue saving at least ${requiredMonthlySavings.toLocaleString()} ETB per month (35% of your salary) during the loan period.`,
			});
		}

		// Validate overall max loan amount
		if (amountValue > maxLoanAmount) {
			toast({
				title: "Amount Exceeds Limit",
				description: `Maximum loan amount is ${maxLoanAmount.toLocaleString()} ETB`,
				variant: "destructive",
			});
			return false;
		}

		if (!purpose.trim()) {
			toast({
				title: "Missing Purpose",
				description: "Please specify the loan purpose.",
				variant: "destructive",
			});
			return false;
		}

		if (!file) {
			toast({
				title: "Missing Document",
				description: "Please upload the signed loan agreement document.",
				variant: "destructive",
			});
			return false;
		}

		return true;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!validateForm()) {
			return;
		}

		try {
			const response = await membersLoanAPI.apply({
				amount: Number.parseInt(amount),
				interestRate: Number.parseFloat(interestRate),
				tenureMonths: Number.parseInt(tenureMonths),
				purpose,
				coSigner1,
				coSigner2,
				agreement: file!,
			});

			if (response) {
				toast({
					title: "Loan Application Submitted",
					description: "Your loan application has been submitted successfully.",
				});
				router.push("/member/loans");
			} else {
				throw new Error(response.error || "Failed to submit loan application");
			}
		} catch (error) {
			console.error("Error submitting loan application:", error);
			toast({
				title: "Submission Failed",
				description: "Failed to submit loan application, Please try again",
				variant: "destructive",
			});
		}
	};

	const handleDownloadAgreement = async () => {
		try {
			const response = await loanAgreement.getLoanAgreement();
			if (response) {
				const url = window.URL.createObjectURL(response);
				const a = document.createElement("a");
				a.style.display = "none";
				a.href = url;
				a.download = "loan_agreement_template.pdf";
				document.body.appendChild(a);
				a.click();
				window.URL.revokeObjectURL(url);
			} else {
				throw new Error("Failed to download agreement template");
			}
		} catch (error) {
			console.error("Error downloading agreement template:", error);
			toast({
				title: "Download Failed",
				description: "Failed to download agreement template. Please try again.",
				variant: "destructive",
			});
		}
	};

	if (isLoading) {
		return (
			<Card className="max-w-2xl mx-auto">
				<CardContent className="flex items-center justify-center py-8">
					<div className="text-center">Loading your loan eligibility...</div>
				</CardContent>
			</Card>
		);
	}

	if (!memberData) {
		return (
			<Card className="max-w-2xl mx-auto">
				<CardContent className="flex items-center justify-center py-8">
					<div className="text-center text-red-600">
						Failed to load eligibility data. Please try again.
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className="max-w-4xl mx-auto">
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Calculator className="w-5 h-5" />
					Apply for a Loan
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-6">
				<div className="space-y-4">
					<h3 className="font-semibold text-lg">Your Financial Summary</h3>

					<Alert>
						<Info className="h-4 w-4" />
						<AlertDescription>
							<div className="space-y-3">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<p className="text-sm text-muted-foreground">
											Total Savings
										</p>
										<p className="text-lg font-semibold">
											{memberData.totalSavings.toLocaleString()} ETB
										</p>
									</div>
									<div>
										<p className="text-sm text-muted-foreground">
											Monthly Salary
										</p>
										<p className="text-lg font-semibold">
											{memberData.monthlySalary.toLocaleString()} ETB
										</p>
									</div>
									<div>
										<p className="text-sm text-muted-foreground">
											Max Loan (Salary-based)
										</p>
										<p className="text-lg font-semibold">
											{memberData.maxLoanBasedOnSalary.toLocaleString()} ETB
										</p>
										<p className="text-xs text-muted-foreground">
											30 months of salary
										</p>
									</div>
									<div>
										<p className="text-sm text-muted-foreground">
											Max Loan (Savings-based)
										</p>
										<p className="text-lg font-semibold">
											{memberData.maxLoanBasedOnSavings.toLocaleString()} ETB
										</p>
										<p className="text-xs text-muted-foreground">
											Based on {requiredContributionRate * 100}% requirement
										</p>
									</div>
								</div>

								<div className="border-t pt-3">
									<p className="text-sm font-semibold text-green-700">
										Maximum Loan Amount: {maxLoanAmount.toLocaleString()} ETB
									</p>
								</div>
							</div>
						</AlertDescription>
					</Alert>
				</div>

				{memberData.hasActiveLoan && memberData.activeLoanBalance && (
					<Alert className="border-blue-200 bg-blue-50">
						<AlertCircle className="h-4 w-4 text-blue-600" />
						<AlertDescription className="text-blue-900">
							<div className="space-y-2">
								<p className="font-semibold">Active Loan Balance</p>
								<div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
									<div>
										<p className="text-muted-foreground">Total Disbursed</p>
										<p className="font-semibold">
											{memberData.activeLoanBalance.totalDisbursed.toLocaleString()}{" "}
											ETB
										</p>
									</div>
									<div>
										<p className="text-muted-foreground">Total Repaid</p>
										<p className="font-semibold">
											{memberData.activeLoanBalance.totalRepaid.toLocaleString()}{" "}
											ETB
										</p>
									</div>
									<div>
										<p className="text-muted-foreground">Remaining Balance</p>
										<p className="font-semibold text-red-600">
											{memberData.activeLoanBalance.remainingBalance.toLocaleString()}{" "}
											ETB
										</p>
									</div>
								</div>
								<p className="text-xs mt-2">
									You must continue saving at least{" "}
									<strong>
										{(memberData.monthlySalary * 0.35).toLocaleString()} ETB
									</strong>{" "}
									per month (35% of your salary) during the loan period.
								</p>
							</div>
						</AlertDescription>
					</Alert>
				)}

				<div className="space-y-3">
					<h3 className="font-semibold text-lg">Loan Requirements</h3>
					<div className="space-y-2 text-sm">
						<div className="flex items-start gap-2">
							<CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
							<span>
								<strong>Max Loan Term:</strong> 10 years (120 months)
							</span>
						</div>
						<div className="flex items-start gap-2">
							<CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
							<span>
								<strong>Fixed Interest Rate:</strong> 9.5% per annum
							</span>
						</div>
						<div className="flex items-start gap-2">
							<CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
							<span>
								<strong>Savings Requirement:</strong> Minimum 30% of requested
								loan amount
							</span>
						</div>
						<div className="flex items-start gap-2">
							<CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
							<span>
								<strong>Salary Limit:</strong> Loan cannot exceed 30 months of
								your salary
							</span>
						</div>
						{memberData.hasActiveLoan && (
							<div className="flex items-start gap-2">
								<AlertCircle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
								<span>
									<strong>Active Loan:</strong> Must save 35% of monthly income
									during loan period
								</span>
							</div>
						)}
					</div>
				</div>

				{/* Download Agreement Template */}
				<div className="flex flex-col items-center space-y-2">
					<Button
						onClick={handleDownloadAgreement}
						variant="outline"
						className="w-full h-20 flex flex-col items-center justify-center bg-transparent">
						<FileText size={24} className="mb-1" />
						<span>Download Loan Agreement Template</span>
					</Button>
					<p className="text-sm text-muted-foreground text-center">
						Please download, review, and sign the loan agreement before
						uploading.
					</p>
				</div>

				<form onSubmit={handleSubmit} className="space-y-4">
					{/* Loan Amount */}
					<div className="space-y-2">
						<Label htmlFor="amount">Loan Amount (ETB) *</Label>
						<Input
							type="number"
							id="amount"
							value={amount}
							onChange={handleAmountChange}
							max={maxLoanAmount}
							step="0.01"
							placeholder="Enter loan amount"
							required
						/>
						<div className="text-sm text-muted-foreground">
							Maximum: {maxLoanAmount.toLocaleString()} ETB
							{amount && (
								<div className="mt-1 text-blue-600">
									Required savings: {requiredContribution.toLocaleString()} ETB
									({requiredContributionRate * 100}%)
								</div>
							)}
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="interestRate">Interest Rate (%)</Label>
						<Input
							type="number"
							id="interestRate"
							value={interestRate}
							step="0.1"
							disabled
							className="bg-muted"
						/>
						<p className="text-sm text-muted-foreground">
							Fixed at 9.5% per annum
						</p>
					</div>

					<div className="space-y-2">
						<Label htmlFor="tenureMonths">Loan Tenure</Label>
						<Input
							type="text"
							id="tenureMonths"
							value="120 months (10 years)"
							disabled
							className="bg-muted"
						/>
						<p className="text-sm text-muted-foreground">
							Fixed at 10 years (120 months)
						</p>
					</div>

					<div className="space-y-2">
						<Label htmlFor="purpose">Loan Purpose *</Label>
						<Input
							type="text"
							id="purpose"
							value={purpose}
							onChange={(e) => setPurpose(e.target.value)}
							placeholder="Specify the purpose of the loan"
							required
						/>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="coSigner1">Co-Signer 1</Label>
							<Select value={coSigner1} onValueChange={setCoSigner1}>
								<SelectTrigger>
									<SelectValue placeholder="Select Co-Signer 1" />
								</SelectTrigger>
								<SelectContent>
									{members.map((member) => (
										<SelectItem key={member.id} value={member.id.toString()}>
											{member.name} (ET: {member.etNumber})
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label htmlFor="coSigner2">Co-Signer 2</Label>
							<Select value={coSigner2} onValueChange={setCoSigner2}>
								<SelectTrigger>
									<SelectValue placeholder="Select Co-Signer 2" />
								</SelectTrigger>
								<SelectContent>
									{members.map((member) => (
										<SelectItem key={member.id} value={member.id.toString()}>
											{member.name} (ET: {member.etNumber})
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="agreement">Signed Loan Agreement Document *</Label>
						<Input
							type="file"
							id="agreement"
							onChange={handleFileChange}
							accept=".pdf,.doc,.docx"
							required
							className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
						/>
						{file && (
							<div className="flex items-center mt-2 text-sm text-green-600">
								<FileText className="w-4 h-4 mr-1" />
								{file.name}
							</div>
						)}
					</div>

					<Button type="submit" className="w-full" size="lg">
						Submit Loan Application
					</Button>
				</form>
			</CardContent>
			<CardFooter className="flex justify-between">
				<Button
					variant="outline"
					onClick={() => router.push("/member/loans/calculator")}>
					Loan Calculator
				</Button>
				<Button variant="outline" onClick={() => router.push("/member/loans")}>
					Back to Loans
				</Button>
			</CardFooter>
		</Card>
	);
}
// "use client";

// import type React from "react";
// import { useState, useEffect } from "react";
// import { useRouter } from "next/navigation";
// import { useAuth } from "@/components/auth-provider";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { useToast } from "@/hooks/use-toast";
// import {
// 	Card,
// 	CardHeader,
// 	CardTitle,
// 	CardContent,
// 	CardFooter,
// } from "@/components/ui/card";
// import { Label } from "@/components/ui/label";
// import {
// 	Select,
// 	SelectContent,
// 	SelectItem,
// 	SelectTrigger,
// 	SelectValue,
// } from "@/components/ui/select";
// import { FileText, Info, Calculator } from "lucide-react";
// import { Alert, AlertDescription } from "@/components/ui/alert";
// import { membersAPI, membersLoanAPI, loanAgreement } from "@/lib/api";

// interface Member {
// 	id: number;
// 	name: string;
// 	etNumber: number;
// }

// interface MemberData {
// 	totalContribution: number;
// 	monthlySalary: number;
// 	hasActiveLoan: boolean;
// }

// export default function LoanApplicationPage() {
// 	const { user } = useAuth();
// 	const { toast } = useToast();
// 	const router = useRouter();
// 	const [amount, setAmount] = useState("");
// 	const [interestRate] = useState("9.5");
// 	const [tenureMonths] = useState("120");
// 	const [purpose, setPurpose] = useState("");
// 	const [coSigner1, setCoSigner1] = useState("");
// 	const [coSigner2, setCoSigner2] = useState("");
// 	const [members, setMembers] = useState<Member[]>([]);
// 	const [file, setFile] = useState<File | null>(null);
// 	const [memberData, setMemberData] = useState<MemberData>({
// 		totalContribution: 0,
// 		monthlySalary: 0,
// 		hasActiveLoan: false,
// 	});
// 	const [isLoading, setIsLoading] = useState(true);

// 	// Calculate loan limits based on business rules
// 	const maxLoanBasedOnSalary = memberData.monthlySalary * 30;
// 	const requiredContributionRate = memberData.hasActiveLoan ? 0.35 : 0.3;
// 	const maxLoanBasedOnContribution =
// 		memberData.totalContribution / requiredContributionRate;
// 	const maxLoanAmount = Math.min(
// 		maxLoanBasedOnSalary,
// 		maxLoanBasedOnContribution
// 	);
// 	console.log("based on salary", maxLoanBasedOnSalary);
// 	console.log("required contribution", requiredContributionRate);
// 	const requiredContribution =
// 		Number.parseFloat(amount || "0") * requiredContributionRate;

// 	useEffect(() => {
// 		fetchMembers();
// 		fetchMemberData();
// 	}, []);

// 	const fetchMembers = async () => {
// 		try {
// 			const data = await membersAPI.getMembers();
// 			setMembers(data.filter((member: Member) => member.id !== user?.id));
// 		} catch (error) {
// 			console.error("Error fetching members:", error);
// 			toast({
// 				title: "Error",
// 				description: "Failed to load members. Please try again.",
// 				variant: "destructive",
// 			});
// 		}
// 	};

// 	const fetchMemberData = async () => {
// 		try {
// 			setIsLoading(true);
// 			const data = await membersLoanAPI.loanEligibilityReq();
// 			console.log(data);
// 			setMemberData(data);
// 		} catch (error) {
// 			console.error("Error fetching member data:", error);
// 			toast({
// 				title: "Error",
// 				description: "Failed to load your eligibility data. Please try again.",
// 				variant: "destructive",
// 			});
// 		} finally {
// 			setIsLoading(false);
// 		}
// 	};

// 	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
// 		if (e.target.files) {
// 			setFile(e.target.files[0]);
// 		}
// 	};

// 	const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
// 		const value = e.target.value;
// 		const numValue = Number.parseFloat(value);

// 		if (numValue > maxLoanAmount) {
// 			toast({
// 				title: "Amount Exceeds Limit",
// 				description: `Maximum loan amount is ${maxLoanAmount.toLocaleString()} ETB`,
// 				variant: "destructive",
// 			});
// 			return;
// 		}

// 		setAmount(value);
// 	};

// 	const validateForm = () => {
// 		const amountValue = Number.parseFloat(amount);

// 		if (!amount || amountValue <= 0) {
// 			toast({
// 				title: "Invalid Amount",
// 				description: "Please enter a valid loan amount.",
// 				variant: "destructive",
// 			});
// 			return false;
// 		}

// 		if (amountValue > maxLoanAmount) {
// 			toast({
// 				title: "Amount Exceeds Limit",
// 				description: `Maximum loan amount is ${maxLoanAmount.toLocaleString()} ETB`,
// 				variant: "destructive",
// 			});
// 			return false;
// 		}

// 		if (memberData.totalContribution < requiredContribution) {
// 			toast({
// 				title: "Insufficient Contribution",
// 				description: `You need ${requiredContribution.toLocaleString()} ETB in contributions. Current: ${memberData.totalContribution.toLocaleString()} ETB`,
// 				variant: "destructive",
// 			});
// 			return false;
// 		}

// 		if (!purpose.trim()) {
// 			toast({
// 				title: "Missing Purpose",
// 				description: "Please specify the loan purpose.",
// 				variant: "destructive",
// 			});
// 			return false;
// 		}

// 		if (!file) {
// 			toast({
// 				title: "Missing Document",
// 				description: "Please upload the signed loan agreement document.",
// 				variant: "destructive",
// 			});
// 			return false;
// 		}

// 		return true;
// 	};

// 	const handleSubmit = async (e: React.FormEvent) => {
// 		e.preventDefault();

// 		if (!validateForm()) {
// 			return;
// 		}

// 		try {
// 			const response = await membersLoanAPI.apply({
// 				amount: Number.parseInt(amount),
// 				interestRate: Number.parseFloat(interestRate),
// 				tenureMonths: Number.parseInt(tenureMonths),
// 				purpose,
// 				coSigner1,
// 				coSigner2,
// 				agreement: file!,
// 			});
// 			console.log(interestRate);
// 			if (response) {
// 				toast({
// 					title: "Loan Application Submitted",
// 					description: "Your loan application has been submitted successfully.",
// 				});
// 				router.push("/member/loans");
// 			} else {
// 				throw new Error(response.error || "Failed to submit loan application");
// 			}
// 		} catch (error) {
// 			console.error("Error submitting loan application:", error);
// 			toast({
// 				title: "Submission Failed",
// 				description:
// 					error instanceof Error
// 						? error.message
// 						: "Failed to submit loan application",
// 				variant: "destructive",
// 			});
// 		}
// 	};

// 	const handleDownloadAgreement = async () => {
// 		try {
// 			const response = await loanAgreement.getLoanAgreement();
// 			if (response) {
// 				const url = window.URL.createObjectURL(response);
// 				const a = document.createElement("a");
// 				a.style.display = "none";
// 				a.href = url;
// 				a.download = "loan_agreement_template.pdf";
// 				document.body.appendChild(a);
// 				a.click();
// 				window.URL.revokeObjectURL(url);
// 			} else {
// 				throw new Error("Failed to download agreement template");
// 			}
// 		} catch (error) {
// 			console.error("Error downloading agreement template:", error);
// 			toast({
// 				title: "Download Failed",
// 				description: "Failed to download agreement template. Please try again.",
// 				variant: "destructive",
// 			});
// 		}
// 	};

// 	if (isLoading) {
// 		return (
// 			<Card className="max-w-2xl mx-auto">
// 				<CardContent className="flex items-center justify-center py-8">
// 					<div className="text-center">Loading your loan eligibility...</div>
// 				</CardContent>
// 			</Card>
// 		);
// 	}

// 	return (
// 		<Card className="max-w-2xl mx-auto">
// 			<CardHeader>
// 				<CardTitle className="flex items-center gap-2">
// 					<Calculator className="w-5 h-5" />
// 					Apply for a Loan
// 				</CardTitle>
// 			</CardHeader>
// 			<CardContent className="space-y-6">
// 				{/* Eligibility Summary */}
// 				<Alert>
// 					<Info className="h-4 w-4" />
// 					<AlertDescription>
// 						<div className="space-y-2">
// 							<div>
// 								<strong>Your Total Contribution:</strong>{" "}
// 								{memberData.totalContribution.toLocaleString()} ETB
// 							</div>
// 							<div>
// 								<strong>Monthly Salary:</strong>{" "}
// 								{memberData.monthlySalary.toLocaleString()} ETB
// 							</div>
// 							<div>
// 								<strong>Maximum Loan Amount:</strong>{" "}
// 								{maxLoanAmount.toLocaleString()} ETB
// 							</div>
// 							<div>
// 								<strong>Required Contribution Rate:</strong>{" "}
// 								{requiredContributionRate * 100}%{" "}
// 								{memberData.hasActiveLoan &&
// 									"(Active loan - higher rate applies)"}
// 							</div>
// 						</div>
// 					</AlertDescription>
// 				</Alert>

// 				{/* Download Agreement Template */}
// 				<div className="flex flex-col items-center space-y-2">
// 					<Button
// 						onClick={handleDownloadAgreement}
// 						variant="outline"
// 						className="w-full h-20 flex flex-col items-center justify-center bg-transparent">
// 						<FileText size={24} className="mb-1" />
// 						<span>Download Loan Agreement Template</span>
// 					</Button>
// 					<p className="text-sm text-muted-foreground text-center">
// 						Please download, review, and sign the loan agreement before
// 						uploading.
// 					</p>
// 				</div>

// 				<form onSubmit={handleSubmit} className="space-y-4">
// 					{/* Loan Amount */}
// 					<div className="space-y-2">
// 						<Label htmlFor="amount">Loan Amount (ETB) *</Label>
// 						<Input
// 							type="number"
// 							id="amount"
// 							value={amount}
// 							onChange={handleAmountChange}
// 							max={maxLoanAmount}
// 							step="0.01"
// 							placeholder="Enter loan amount"
// 							required
// 						/>
// 						<div className="text-sm text-muted-foreground">
// 							Maximum: {maxLoanAmount.toLocaleString()} ETB
// 							{amount && (
// 								<div className="mt-1 text-blue-600">
// 									Required contribution: {requiredContribution.toLocaleString()}{" "}
// 									ETB ({requiredContributionRate * 100}%)
// 								</div>
// 							)}
// 						</div>
// 					</div>

// 					{/* Interest Rate (Fixed) */}
// 					<div className="space-y-2">
// 						<Label htmlFor="interestRate">Interest Rate (%)</Label>
// 						<Input
// 							type="number"
// 							id="interestRate"
// 							value={interestRate}
// 							step="0.1"
// 							disabled
// 							className="bg-muted"
// 						/>
// 						<p className="text-sm text-muted-foreground">
// 							Fixed at 9.5% per annum
// 						</p>
// 					</div>

// 					{/* Loan Tenure (Fixed) */}
// 					<div className="space-y-2">
// 						<Label htmlFor="tenureMonths">Loan Tenure</Label>
// 						<Input
// 							type="text"
// 							id="tenureMonths"
// 							value="120 months (10 years)"
// 							disabled
// 							className="bg-muted"
// 						/>
// 						<p className="text-sm text-muted-foreground">
// 							Fixed at 10 years (120 months)
// 						</p>
// 					</div>

// 					{/* Loan Purpose */}
// 					<div className="space-y-2">
// 						<Label htmlFor="purpose">Loan Purpose *</Label>
// 						<Input
// 							type="text"
// 							id="purpose"
// 							value={purpose}
// 							onChange={(e) => setPurpose(e.target.value)}
// 							placeholder="Specify the purpose of the loan"
// 							required
// 						/>
// 					</div>

// 					{/* Co-Signers */}
// 					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
// 						<div className="space-y-2">
// 							<Label htmlFor="coSigner1">Co-Signer 1</Label>
// 							<Select value={coSigner1} onValueChange={setCoSigner1}>
// 								<SelectTrigger>
// 									<SelectValue placeholder="Select Co-Signer 1" />
// 								</SelectTrigger>
// 								<SelectContent>
// 									{members.map((member) => (
// 										<SelectItem key={member.id} value={member.id.toString()}>
// 											{member.name} (ET: {member.etNumber})
// 										</SelectItem>
// 									))}
// 								</SelectContent>
// 							</Select>
// 						</div>

// 						<div className="space-y-2">
// 							<Label htmlFor="coSigner2">Co-Signer 2</Label>
// 							<Select value={coSigner2} onValueChange={setCoSigner2}>
// 								<SelectTrigger>
// 									<SelectValue placeholder="Select Co-Signer 2" />
// 								</SelectTrigger>
// 								<SelectContent>
// 									{members.map((member) => (
// 										<SelectItem key={member.id} value={member.id.toString()}>
// 											{member.name} (ET: {member.etNumber})
// 										</SelectItem>
// 									))}
// 								</SelectContent>
// 							</Select>
// 						</div>
// 					</div>

// 					{/* File Upload */}
// 					<div className="space-y-2">
// 						<Label htmlFor="agreement">Signed Loan Agreement Document *</Label>
// 						<Input
// 							type="file"
// 							id="agreement"
// 							onChange={handleFileChange}
// 							accept=".pdf,.doc,.docx"
// 							required
// 							className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
// 						/>
// 						{file && (
// 							<div className="flex items-center mt-2 text-sm text-green-600">
// 								<FileText className="w-4 h-4 mr-1" />
// 								{file.name}
// 							</div>
// 						)}
// 					</div>

// 					<Button type="submit" className="w-full" size="lg">
// 						Submit Loan Application
// 					</Button>
// 				</form>
// 			</CardContent>
// 			<CardFooter className="flex justify-between">
// 				<Button
// 					variant="outline"
// 					onClick={() => router.push("/member/loans/calculator")}>
// 					Loan Calculator
// 				</Button>
// 				<Button variant="outline" onClick={() => router.push("/member/loans")}>
// 					Back to Loans
// 				</Button>
// 			</CardFooter>
// 		</Card>
// 	);
// }
