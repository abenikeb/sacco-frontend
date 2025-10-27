import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";

interface BalanceSheetData {
	assets: Array<{
		accountCode: string;
		accountName: string;
		accountType: string;
		debit: number;
		credit: number;
	}>;
	liabilities: Array<{
		accountCode: string;
		accountName: string;
		accountType: string;
		debit: number;
		credit: number;
	}>;
	equity: Array<{
		accountCode: string;
		accountName: string;
		accountType: string;
		debit: number;
		credit: number;
	}>;
	totalAssets: number;
	totalLiabilities: number;
	totalEquity: number;
	totalLiabilitiesAndEquity: number;
	isBalanced: boolean;
	asOfDate: string;
}

interface BalanceSheetReportProps {
	data: BalanceSheetData | null;
	formatCurrency: (value: number) => string;
}

export default function BalanceSheetReport({
	data,
	formatCurrency,
}: BalanceSheetReportProps) {
	if (!data) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Balance Sheet</CardTitle>
					<CardDescription>Loading balance sheet data...</CardDescription>
				</CardHeader>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Balance Sheet</CardTitle>
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
				<div className="space-y-8">
					{/* Assets */}
					<div>
						<h3 className="mb-4 text-lg font-semibold text-foreground">
							Assets
						</h3>
						<div className="overflow-x-auto">
							<Table>
								<TableBody>
									{data.assets.map((item) => (
										<TableRow key={item.accountCode}>
											<TableCell className="pl-4">{item.accountName}</TableCell>
											<TableCell className="text-right font-mono">
												{formatCurrency(item.debit)}
											</TableCell>
										</TableRow>
									))}
									<TableRow className="border-t-2 border-border bg-primary/10">
										<TableCell className="font-bold">Total Assets</TableCell>
										<TableCell className="text-right font-mono font-bold">
											{formatCurrency(data.totalAssets)}
										</TableCell>
									</TableRow>
								</TableBody>
							</Table>
						</div>
					</div>

					{/* Liabilities & Equity */}
					<div>
						<h3 className="mb-4 text-lg font-semibold text-foreground">
							Liabilities & Equity
						</h3>
						<div className="overflow-x-auto">
							<Table>
								<TableBody>
									<TableRow className="bg-muted/50">
										<TableCell className="font-semibold">Liabilities</TableCell>
										<TableCell className="text-right"></TableCell>
									</TableRow>
									{data.liabilities.map((item) => (
										<TableRow key={item.accountCode}>
											<TableCell className="pl-8">{item.accountName}</TableCell>
											<TableCell className="text-right font-mono">
												{formatCurrency(item.credit)}
											</TableCell>
										</TableRow>
									))}
									<TableRow className="border-t border-border">
										<TableCell className="pl-8 font-semibold">
											Total Liabilities
										</TableCell>
										<TableCell className="text-right font-mono font-semibold">
											{formatCurrency(data.totalLiabilities)}
										</TableCell>
									</TableRow>

									<TableRow className="bg-muted/50">
										<TableCell className="font-semibold">Equity</TableCell>
										<TableCell className="text-right"></TableCell>
									</TableRow>
									{data.equity.map((item) => (
										<TableRow key={item.accountCode}>
											<TableCell className="pl-8">{item.accountName}</TableCell>
											<TableCell className="text-right font-mono">
												{formatCurrency(item.credit)}
											</TableCell>
										</TableRow>
									))}
									<TableRow className="border-t border-border">
										<TableCell className="pl-8 font-semibold">
											Total Equity
										</TableCell>
										<TableCell className="text-right font-mono font-semibold">
											{formatCurrency(data.totalEquity)}
										</TableCell>
									</TableRow>

									<TableRow className="border-t-2 border-border bg-primary/10">
										<TableCell className="font-bold">
											Total Liabilities & Equity
										</TableCell>
										<TableCell className="text-right font-mono font-bold">
											{formatCurrency(data.totalLiabilitiesAndEquity)}
										</TableCell>
									</TableRow>
								</TableBody>
							</Table>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
