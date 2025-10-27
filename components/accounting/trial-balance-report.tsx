import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

interface TrialBalanceData {
	trialBalance: Array<{
		accountCode: string;
		accountName: string;
		accountType: string;
		debit: number;
		credit: number;
	}>;
	totalDebit: number;
	totalCredit: number;
	isBalanced: boolean;
	asOfDate: string;
}

interface TrialBalanceReportProps {
	data: TrialBalanceData | null;
	formatCurrency: (value: number) => string;
}

export default function TrialBalanceReport({
	data,
	formatCurrency,
}: TrialBalanceReportProps) {
	if (!data) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Trial Balance</CardTitle>
					<CardDescription>Loading trial balance data...</CardDescription>
				</CardHeader>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Trial Balance Report</CardTitle>
				<CardDescription>
					As of{" "}
					{new Date(data.asOfDate).toLocaleDateString("en-US", {
						year: "numeric",
						month: "long",
						day: "numeric",
					})}
					{data.isBalanced && (
						<span className="ml-2 text-green-600">✓ Balanced</span>
					)}
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="overflow-x-auto">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Account Code</TableHead>
								<TableHead>Account Name</TableHead>
								<TableHead>Type</TableHead>
								<TableHead className="text-right">Debit</TableHead>
								<TableHead className="text-right">Credit</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{data.trialBalance.map((account) => (
								<TableRow key={account.accountCode}>
									<TableCell className="font-mono text-sm">
										{account.accountCode}
									</TableCell>
									<TableCell>{account.accountName}</TableCell>
									<TableCell className="text-sm text-muted-foreground">
										{account.accountType}
									</TableCell>
									<TableCell className="text-right font-mono">
										{account.debit > 0 ? formatCurrency(account.debit) : "-"}
									</TableCell>
									<TableCell className="text-right font-mono">
										{account.credit > 0 ? formatCurrency(account.credit) : "-"}
									</TableCell>
								</TableRow>
							))}
							<TableRow className="border-t-2 border-border font-bold">
								<TableCell colSpan={3}>Total</TableCell>
								<TableCell className="text-right font-mono">
									{formatCurrency(data.totalDebit)}
								</TableCell>
								<TableCell className="text-right font-mono">
									{formatCurrency(data.totalCredit)}
								</TableCell>
							</TableRow>
						</TableBody>
					</Table>
				</div>
			</CardContent>
		</Card>
	);
}
