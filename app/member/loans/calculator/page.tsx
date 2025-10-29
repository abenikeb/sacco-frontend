"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormDescription,
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

export default function MemberLoanCalculatorPage() {
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
			const result = await membersLoanAPI.calculateLoan(values);
			setCalculationResult(result);
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
					<CardDescription>
						Calculate your potential loan payments
					</CardDescription>
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
										<FormDescription>
											Enter the amount you wish to borrow
										</FormDescription>
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
										<FormDescription>
											Enter the annual interest rate
										</FormDescription>
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
										<FormDescription>
											Enter the loan term in months
										</FormDescription>
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
										<FormDescription>
											Choose how often you want to make payments
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>
							<Button type="submit">Calculate Loan</Button>
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
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
								<div>
									<h3 className="font-semibold">Payment Amount:</h3>
									<p className="text-2xl font-bold text-primary">
										{calculationResult.monthlyPayment.toFixed(2)} ETB
									</p>
									<p className="text-sm text-muted-foreground">
										Per {form.getValues().repaymentFrequency} payment
									</p>
								</div>
								<div>
									<h3 className="font-semibold">Total Payment:</h3>
									<p className="text-2xl font-bold text-primary">
										{calculationResult.totalPayment.toFixed(2)} ETB
									</p>
									<p className="text-sm text-muted-foreground">
										Over the life of the loan
									</p>
								</div>
								<div>
									<h3 className="font-semibold">Total Interest:</h3>
									<p className="text-2xl font-bold text-primary">
										{calculationResult.totalInterest.toFixed(2)} ETB
									</p>
									<p className="text-sm text-muted-foreground">
										Total interest paid
									</p>
								</div>
							</div>
							<div>
								<h3 className="font-semibold mb-2">Amortization Schedule:</h3>
								<div className="overflow-x-auto">
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
							</div>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
