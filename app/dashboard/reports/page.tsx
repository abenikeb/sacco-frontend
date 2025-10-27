"use client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MemberGrowthSection } from "@/components/analytics/member-growth-section";
import { SavingsTrendsSection } from "@/components/analytics/savings-trends-section";
import { LoanPerformanceSection } from "@/components/analytics/loan-performance-section";
import { DelinquencySection } from "@/components/analytics/delinquency-section";
import { FinancialPerformanceSection } from "@/components/analytics/financial-performance-section";

export default function AnalyticsPage() {
	return (
		<div className="min-h-screen bg-background">
			<div className="container mx-auto py-8 px-4">
				<div className="mb-8">
					<h1 className="text-3xl font-bold tracking-tight">
						Reporting & Analytics
					</h1>
					<p className="text-muted-foreground mt-2">
						Comprehensive insights into member growth, loan performance, and
						financial health
					</p>
				</div>

				<Tabs defaultValue="overview" className="space-y-6">
					<TabsList className="grid w-full grid-cols-4">
						<TabsTrigger value="overview">Overview</TabsTrigger>
						<TabsTrigger value="loans">Loan Performance</TabsTrigger>
						<TabsTrigger value="delinquency">Delinquency</TabsTrigger>
						<TabsTrigger value="financial">Financial</TabsTrigger>
					</TabsList>

					<TabsContent value="overview" className="space-y-6">
						<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
							<MemberGrowthSection />
							<SavingsTrendsSection />
						</div>
					</TabsContent>

					<TabsContent value="loans" className="space-y-6">
						<LoanPerformanceSection />
					</TabsContent>

					<TabsContent value="delinquency" className="space-y-6">
						<DelinquencySection />
					</TabsContent>

					<TabsContent value="financial" className="space-y-6">
						<FinancialPerformanceSection />
					</TabsContent>
				</Tabs>
			</div>
		</div>
	);
}
