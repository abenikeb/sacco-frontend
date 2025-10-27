import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, DollarSign, Scale, FileText } from "lucide-react";

interface MetricsProps {
	metrics: {
		totalAssets: number;
		totalLiabilities: number;
		totalEquity: number;
		totalRevenue: number;
		totalExpense?: number;
		netIncome?: number;
	};
	formatCurrency: (value: number) => string;
}

export default function AccountingMetrics({
	metrics,
	formatCurrency,
}: MetricsProps) {
	const metricCards = [
		{
			title: "Total Assets",
			value: formatCurrency(metrics.totalAssets),
			icon: DollarSign,
			color: "text-blue-500",
		},
		{
			title: "Total Liabilities",
			value: formatCurrency(metrics.totalLiabilities),
			icon: Scale,
			color: "text-orange-500",
		},
		{
			title: "Total Equity",
			value: formatCurrency(metrics.totalEquity),
			icon: TrendingUp,
			color: "text-green-500",
		},
		{
			title: "Total Revenue",
			value: formatCurrency(metrics.totalRevenue),
			icon: FileText,
			color: "text-purple-500",
		},
	];

	return (
		<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
			{metricCards.map((metric) => {
				const Icon = metric.icon;
				return (
					<Card key={metric.title}>
						<CardContent className="pt-6">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-medium text-muted-foreground">
										{metric.title}
									</p>
									<p className="mt-2 text-2xl font-bold text-foreground">
										{metric.value}
									</p>
								</div>
								<Icon className={`h-8 w-8 ${metric.color}`} />
							</div>
						</CardContent>
					</Card>
				);
			})}
		</div>
	);
}
