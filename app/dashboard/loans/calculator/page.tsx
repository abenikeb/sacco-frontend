"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { membersLoanAPI } from "@/lib/api";

const formSchema = z.object({
	loanAmount: z.string().min(1, "Loan amount is required").transform(Number),
	interestRate: z
		.string()
		.min(1, "Interest rate is required")
		.transform(Number),
	loanTerm: z.string().min(1, "Loan term is required").transform(Number),
	repaymentFrequency: z.enum(["monthly", "quarterly", "annually"]),
});

type LoanCalculationResult = {
	monthlyPayment: number;
	totalPayment: number;
	totalInterest: number;
	amortizationSchedule: {
		period: number;
		payment: number;
		principal: number;
		interest: number;
		balance: number;
	}[];
};

export default function LoanCalculatorPage() {
	const [calculationResult, setCalculationResult] =
		useState<LoanCalculationResult | null>(null);
	const { toast } = useToast();

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			loanAmount: "",
			interestRate: "",
			loanTerm: "",
			repaymentFrequency: "monthly",
		} as any,
	});

	async function onSubmit(values: z.infer<typeof formSchema>) {
		try {
			// const response = await fetch("/api/loans/calculate", {
			// 	method: "POST",
			// 	headers: {
			// 		"Content-Type": "application/json",
			// 	},
			// 	body: JSON.stringify(values),
			// });
			const response = await membersLoanAPI.calculateLoan(values);

			if (!response) {
				throw new Error("Failed to calculate loan");
			}

			// const result = await response.json();
			setCalculationResult(response);
			console.log("calculated", response);
		} catch (error) {
			console.error("Error calculating loan:", error);
			toast({
				title: "Error",
				description: "Failed to calculate loan. Please try again.",
				variant: "destructive",
			});
		}
	}

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>Amortization Calculator</CardTitle>
				</CardHeader>
				<CardContent>
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
							<FormField
								control={form.control}
								name="loanAmount"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Loan Amount (ETB)</FormLabel>
										<FormControl>
											<Input type="number" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="interestRate"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Annual Interest Rate (%)</FormLabel>
										<FormControl>
											<Input type="number" step="0.01" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="loanTerm"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Loan Term (months)</FormLabel>
										<FormControl>
											<Input type="number" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="repaymentFrequency"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Repayment Frequency</FormLabel>
										<Select
											onValueChange={field.onChange}
											defaultValue={field.value}>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Select repayment frequency" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="monthly">Monthly</SelectItem>
												<SelectItem value="quarterly">Quarterly</SelectItem>
												<SelectItem value="annually">Annually</SelectItem>
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
							<Button type="submit">Calculate</Button>
						</form>
					</Form>
				</CardContent>
			</Card>

			{calculationResult && (
				<Card>
					<CardHeader>
						<CardTitle>Loan Calculation Results</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							<div>
								<strong>Monthly Payment:</strong>{" "}
								{calculationResult.monthlyPayment.toFixed(2)} ETB
							</div>
							<div>
								<strong>Total Payment:</strong>{" "}
								{calculationResult.totalPayment.toFixed(2)} ETB
							</div>
							<div>
								<strong>Total Interest:</strong>{" "}
								{calculationResult.totalInterest.toFixed(2)} ETB
							</div>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Period</TableHead>
										<TableHead>Payment</TableHead>
										<TableHead>Principal</TableHead>
										<TableHead>Interest</TableHead>
										<TableHead>Balance</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{calculationResult.amortizationSchedule.map((row) => (
										<TableRow key={row.period}>
											<TableCell>{row.period}</TableCell>
											<TableCell>{row.payment.toFixed(2)}</TableCell>
											<TableCell>{row.principal.toFixed(2)}</TableCell>
											<TableCell>{row.interest.toFixed(2)}</TableCell>
											<TableCell>{row.balance.toFixed(2)}</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
