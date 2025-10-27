"use client";

import { useState, useEffect } from "react";
import { settingsAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface SystemConfig {
	organizationName: string;
	currency: string;
	fiscalYearStart: string;
	maxLoanAmount: number;
	minSavingsPercentage: number;
	interestCalculationMethod: string;
	loanApprovalLevels: string[];
	withdrawalApprovalLevels: string[];
}

export function SystemConfigurationSection() {
	const [config, setConfig] = useState<SystemConfig | null>(null);
	const [loading, setLoading] = useState(true);
	const [editing, setEditing] = useState(false);
	const [formData, setFormData] = useState<SystemConfig | null>(null);

	useEffect(() => {
		fetchConfig();
	}, []);

	const fetchConfig = async () => {
		try {
			setLoading(true);
			const data = await settingsAPI.getSystemConfig();
			setConfig(data);
			setFormData(data);
		} catch (error) {
			console.error("Error fetching config:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleSave = async () => {
		if (!formData) return;
		try {
			await settingsAPI.updateSystemConfig(formData);
			setConfig(formData);
			setEditing(false);
		} catch (error) {
			console.error("Error updating config:", error);
		}
	};

	if (loading)
		return <div className="text-center py-8">Loading configuration...</div>;

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<div>
					<h3 className="text-lg font-semibold">System Configuration</h3>
					<p className="text-sm text-gray-600">Manage system-wide settings</p>
				</div>
				{!editing && (
					<Button onClick={() => setEditing(true)}>Edit Configuration</Button>
				)}
			</div>

			<Card>
				<CardHeader>
					<CardTitle>General Settings</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						{editing && formData ? (
							<>
								<div className="grid grid-cols-2 gap-4">
									<div>
										<label className="block text-sm font-medium mb-1">
											Organization Name
										</label>
										<Input
											value={formData.organizationName}
											onChange={(e) =>
												setFormData({
													...formData,
													organizationName: e.target.value,
												})
											}
										/>
									</div>
									<div>
										<label className="block text-sm font-medium mb-1">
											Currency
										</label>
										<Input
											value={formData.currency}
											onChange={(e) =>
												setFormData({ ...formData, currency: e.target.value })
											}
										/>
									</div>
									<div>
										<label className="block text-sm font-medium mb-1">
											Fiscal Year Start
										</label>
										<Input
											value={formData.fiscalYearStart}
											onChange={(e) =>
												setFormData({
													...formData,
													fiscalYearStart: e.target.value,
												})
											}
										/>
									</div>
									<div>
										<label className="block text-sm font-medium mb-1">
											Max Loan Amount
										</label>
										<Input
											type="number"
											value={formData.maxLoanAmount}
											onChange={(e) =>
												setFormData({
													...formData,
													maxLoanAmount: Number(e.target.value),
												})
											}
										/>
									</div>
									<div>
										<label className="block text-sm font-medium mb-1">
											Min Savings %
										</label>
										<Input
											type="number"
											value={formData.minSavingsPercentage}
											onChange={(e) =>
												setFormData({
													...formData,
													minSavingsPercentage: Number(e.target.value),
												})
											}
										/>
									</div>
									<div>
										<label className="block text-sm font-medium mb-1">
											Interest Calculation Method
										</label>
										<Input
											value={formData.interestCalculationMethod}
											onChange={(e) =>
												setFormData({
													...formData,
													interestCalculationMethod: e.target.value,
												})
											}
										/>
									</div>
								</div>
								<div className="flex gap-2 pt-4">
									<Button onClick={handleSave}>Save Changes</Button>
									<Button variant="outline" onClick={() => setEditing(false)}>
										Cancel
									</Button>
								</div>
							</>
						) : (
							<div className="grid grid-cols-2 gap-4">
								<div>
									<p className="text-sm text-gray-600">Organization Name</p>
									<p className="font-medium">{config?.organizationName}</p>
								</div>
								<div>
									<p className="text-sm text-gray-600">Currency</p>
									<p className="font-medium">{config?.currency}</p>
								</div>
								<div>
									<p className="text-sm text-gray-600">Fiscal Year Start</p>
									<p className="font-medium">{config?.fiscalYearStart}</p>
								</div>
								<div>
									<p className="text-sm text-gray-600">Max Loan Amount</p>
									<p className="font-medium">{config?.maxLoanAmount}</p>
								</div>
								<div>
									<p className="text-sm text-gray-600">
										Min Savings Percentage
									</p>
									<p className="font-medium">{config?.minSavingsPercentage}%</p>
								</div>
								<div>
									<p className="text-sm text-gray-600">Interest Calculation</p>
									<p className="font-medium">
										{config?.interestCalculationMethod}
									</p>
								</div>
							</div>
						)}
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Approval Levels</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-2 gap-4">
						<div>
							<p className="text-sm font-medium mb-2">Loan Approval Levels</p>
							<ul className="space-y-1">
								{config?.loanApprovalLevels.map((level) => (
									<li key={level} className="text-sm text-gray-600">
										• {level}
									</li>
								))}
							</ul>
						</div>
						<div>
							<p className="text-sm font-medium mb-2">
								Withdrawal Approval Levels
							</p>
							<ul className="space-y-1">
								{config?.withdrawalApprovalLevels.map((level) => (
									<li key={level} className="text-sm text-gray-600">
										• {level}
									</li>
								))}
							</ul>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
