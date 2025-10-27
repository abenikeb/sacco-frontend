import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";

interface IncomeStatementData {
	revenues: Array<{
		accountCode: string;
		accountName: string;
		amount: number;
	}>;
	expenses: Array<{
		accountCode: string;
		accountName: string;
		amount: number;
	}>;
	totalRevenue: number;
	totalExpense: number;
	netIncome: number;
	fromDate: string;
	toDate: string;
}

interface IncomeStatementReportProps {
	data: IncomeStatementData | null;
	formatCurrency: (value: number) => string;
}

export default function IncomeStatementReport({
	data,
	formatCurrency,
}: IncomeStatementReportProps) {
	if (!data) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Income Statement</CardTitle>
					<CardDescription>Loading income statement data...</CardDescription>
				</CardHeader>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Income Statement</CardTitle>
				<CardDescription>
					For the period from{" "}
					{new Date(data.fromDate).toLocaleDateString("en-US", {
						year: "numeric",
						month: "short",
						day: "numeric",
					})}{" "}
					to{" "}
					{new Date(data.toDate).toLocaleDateString("en-US", {
						year: "numeric",
						month: "short",
						day: "numeric",
					})}
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="overflow-x-auto">
					<Table>
						<TableBody>
							<TableRow className="bg-muted/50">
								<TableCell className="font-semibold">Revenue</TableCell>
								<TableCell className="text-right"></TableCell>
							</TableRow>
							{data.revenues.length > 0 ? (
								data.revenues.map((item) => (
									<TableRow key={item.accountCode}>
										<TableCell className="pl-8">{item.accountName}</TableCell>
										<TableCell className="text-right font-mono">
											{formatCurrency(item.amount)}
										</TableCell>
									</TableRow>
								))
							) : (
								<TableRow>
									<TableCell colSpan={2} className="pl-8 text-muted-foreground">
										No revenue data
									</TableCell>
								</TableRow>
							)}
							<TableRow className="border-t border-border">
								<TableCell className="pl-8 font-semibold">
									Total Revenue
								</TableCell>
								<TableCell className="text-right font-mono font-semibold">
									{formatCurrency(data.totalRevenue)}
								</TableCell>
							</TableRow>

							<TableRow className="bg-muted/50">
								<TableCell className="font-semibold">
									Operating Expenses
								</TableCell>
								<TableCell className="text-right"></TableCell>
							</TableRow>
							{data.expenses.length > 0 ? (
								data.expenses.map((item) => (
									<TableRow key={item.accountCode}>
										<TableCell className="pl-8">{item.accountName}</TableCell>
										<TableCell className="text-right font-mono">
											{formatCurrency(item.amount)}
										</TableCell>
									</TableRow>
								))
							) : (
								<TableRow>
									<TableCell colSpan={2} className="pl-8 text-muted-foreground">
										No expense data
									</TableCell>
								</TableRow>
							)}
							<TableRow className="border-t border-border">
								<TableCell className="pl-8 font-semibold">
									Total Expenses
								</TableCell>
								<TableCell className="text-right font-mono font-semibold">
									{formatCurrency(data.totalExpense)}
								</TableCell>
							</TableRow>

							<TableRow className="border-t-2 border-border bg-primary/10">
								<TableCell className="font-bold">Net Income</TableCell>
								<TableCell
									className={`text-right font-mono font-bold ${
										data.netIncome >= 0 ? "text-green-600" : "text-red-600"
									}`}>
									{formatCurrency(data.netIncome)}
								</TableCell>
							</TableRow>
						</TableBody>
					</Table>
				</div>
			</CardContent>
		</Card>
	);
}
