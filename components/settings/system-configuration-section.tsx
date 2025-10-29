"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { settingsAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

interface SystemConfig {
	id?: number;
	organizationName: string;
	organizationLogo?: string;
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
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);
	const [logoPreview, setLogoPreview] = useState<string | null>(null);
	const [logoFile, setLogoFile] = useState<File | null>(null);
	const [isSaving, setIsSaving] = useState(false);

	useEffect(() => {
		fetchConfig();
	}, []);

	const fetchConfig = async () => {
		try {
			setLoading(true);
			setError(null);
			const data = await settingsAPI.getSystemConfig();
			setConfig(data);
			setFormData(data);
			if (data.organizationLogo) {
				setLogoPreview(data.organizationLogo);
			}
		} catch (error: any) {
			setError(error.response?.data?.error || "Error fetching configuration");
			console.error("Error fetching config:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			// Validate file type
			if (!file.type.startsWith("image/")) {
				setError("Please select a valid image file");
				return;
			}

			// Validate file size (5MB max)
			if (file.size > 5 * 1024 * 1024) {
				setError("File size must be less than 5MB");
				return;
			}

			// Store the file for upload
			setLogoFile(file);

			// Create preview URL for immediate display
			const previewUrl = URL.createObjectURL(file);
			setLogoPreview(previewUrl);
			setError(null);
		}
	};

	const handleRemoveLogo = () => {
		setLogoPreview(null);
		setLogoFile(null);
		setFormData({ ...formData!, organizationLogo: undefined });
	};

	const handleSave = async () => {
		if (!formData) return;
		try {
			setError(null);
			setSuccess(null);
			setIsSaving(true);

			// Create a clean config object without the logo field
			const configToSend = { ...formData };
			delete (configToSend as any).organizationLogo;

			// Send with file if one was selected
			const response = await settingsAPI.updateSystemConfig(
				configToSend,
				logoFile || undefined
			);

			setConfig(response);
			setFormData(response);
			setLogoFile(null);
			setEditing(false);
			setSuccess("Configuration updated successfully");

			// Refresh logo preview with the new path from server
			if (response.organizationLogo) {
				setLogoPreview(response.organizationLogo);
			}
		} catch (error: any) {
			setError(error.response?.data?.error || "Error updating configuration");
			console.error("Error updating config:", error);
		} finally {
			setIsSaving(false);
		}
	};

	if (loading)
		return <div className="text-center py-8">Loading configuration...</div>;

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<div>
					<h3 className="text-lg font-semibold">System Configuration</h3>
					<p className="text-sm text-gray-600">
						Manage system-wide settings and organization details
					</p>
				</div>
				{!editing && (
					<Button onClick={() => setEditing(true)}>Edit Configuration</Button>
				)}
			</div>

			{error && (
				<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex justify-between items-center">
					<span>{error}</span>
					<button onClick={() => setError(null)}>
						<X className="w-4 h-4" />
					</button>
				</div>
			)}

			{success && (
				<div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md flex justify-between items-center">
					<span>{success}</span>
					<button onClick={() => setSuccess(null)}>
						<X className="w-4 h-4" />
					</button>
				</div>
			)}

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

								<div className="border-t pt-4">
									<label className="block text-sm font-medium mb-2">
										Organization Logo
									</label>
									<div className="flex gap-4">
										<div className="flex-1">
											<Input
												type="file"
												accept="image/*"
												onChange={handleLogoChange}
												className="cursor-pointer"
											/>
											<p className="text-xs text-gray-500 mt-1">
												Recommended: 200x200px, PNG or JPG (Max 5MB)
											</p>
										</div>
										{logoPreview && (
											<div className="flex items-center gap-2">
												<img
													src={logoPreview || "/placeholder.svg"}
													alt="Logo preview"
													className="h-20 w-20 object-contain border rounded"
												/>
												<Button
													type="button"
													variant="outline"
													size="sm"
													onClick={handleRemoveLogo}
													className="text-red-600 bg-transparent">
													Remove
												</Button>
											</div>
										)}
									</div>
								</div>

								<div className="flex gap-2 pt-4">
									<Button onClick={handleSave} disabled={isSaving}>
										{isSaving ? "Saving..." : "Save Changes"}
									</Button>
									<Button
										variant="outline"
										onClick={() => {
											setEditing(false);
											setLogoFile(null);
										}}
										disabled={isSaving}>
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
								{config?.organizationLogo && (
									<div>
										<p className="text-sm text-gray-600">Organization Logo</p>
										<img
											src={config.organizationLogo || "/placeholder.svg"}
											alt="Organization logo"
											className="h-20 w-20 object-contain mt-1"
										/>
									</div>
								)}
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
// "use client";

// import type React from "react";

// import { useState, useEffect } from "react";
// import { settingsAPI } from "@/lib/api";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { X } from "lucide-react";

// interface SystemConfig {
// 	id?: number;
// 	organizationName: string;
// 	organizationLogo?: string;
// 	currency: string;
// 	fiscalYearStart: string;
// 	maxLoanAmount: number;
// 	minSavingsPercentage: number;
// 	interestCalculationMethod: string;
// 	loanApprovalLevels: string[];
// 	withdrawalApprovalLevels: string[];
// }

// export function SystemConfigurationSection() {
// 	const [config, setConfig] = useState<SystemConfig | null>(null);
// 	const [loading, setLoading] = useState(true);
// 	const [editing, setEditing] = useState(false);
// 	const [formData, setFormData] = useState<SystemConfig | null>(null);
// 	const [error, setError] = useState<string | null>(null);
// 	const [success, setSuccess] = useState<string | null>(null);
// 	const [logoPreview, setLogoPreview] = useState<string | null>(null);

// 	useEffect(() => {
// 		fetchConfig();
// 	}, []);

// 	const fetchConfig = async () => {
// 		try {
// 			setLoading(true);
// 			setError(null);
// 			const data = await settingsAPI.getSystemConfig();
// 			setConfig(data);
// 			setFormData(data);
// 			if (data.organizationLogo) {
// 				setLogoPreview(data.organizationLogo);
// 			}
// 		} catch (error: any) {
// 			setError(error.response?.data?.error || "Error fetching configuration");
// 			console.error("Error fetching config:", error);
// 		} finally {
// 			setLoading(false);
// 		}
// 	};

// 	const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
// 		const file = e.target.files?.[0];
// 		if (file) {
// 			const reader = new FileReader();
// 			reader.onloadend = () => {
// 				const base64String = reader.result as string;
// 				setLogoPreview(base64String);
// 				setFormData({ ...formData!, organizationLogo: base64String });
// 			};
// 			reader.readAsDataURL(file);
// 		}
// 	};

// 	const handleRemoveLogo = () => {
// 		setLogoPreview(null);
// 		setFormData({ ...formData!, organizationLogo: undefined });
// 	};

// 	const handleSave = async () => {
// 		if (!formData) return;
// 		try {
// 			setError(null);
// 			setSuccess(null);
// 			await settingsAPI.updateSystemConfig(formData);
// 			setConfig(formData);
// 			setEditing(false);
// 			setSuccess("Configuration updated successfully");
// 		} catch (error: any) {
// 			setError(error.response?.data?.error || "Error updating configuration");
// 			console.error("Error updating config:", error);
// 		}
// 	};

// 	if (loading)
// 		return <div className="text-center py-8">Loading configuration...</div>;

// 	return (
// 		<div className="space-y-6">
// 			<div className="flex justify-between items-center">
// 				<div>
// 					<h3 className="text-lg font-semibold">System Configuration</h3>
// 					<p className="text-sm text-gray-600">
// 						Manage system-wide settings and organization details
// 					</p>
// 				</div>
// 				{!editing && (
// 					<Button onClick={() => setEditing(true)}>Edit Configuration</Button>
// 				)}
// 			</div>

// 			{error && (
// 				<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex justify-between items-center">
// 					<span>{error}</span>
// 					<button onClick={() => setError(null)}>
// 						<X className="w-4 h-4" />
// 					</button>
// 				</div>
// 			)}

// 			{success && (
// 				<div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md flex justify-between items-center">
// 					<span>{success}</span>
// 					<button onClick={() => setSuccess(null)}>
// 						<X className="w-4 h-4" />
// 					</button>
// 				</div>
// 			)}

// 			<Card>
// 				<CardHeader>
// 					<CardTitle>General Settings</CardTitle>
// 				</CardHeader>
// 				<CardContent>
// 					<div className="space-y-4">
// 						{editing && formData ? (
// 							<>
// 								<div className="grid grid-cols-2 gap-4">
// 									<div>
// 										<label className="block text-sm font-medium mb-1">
// 											Organization Name
// 										</label>
// 										<Input
// 											value={formData.organizationName}
// 											onChange={(e) =>
// 												setFormData({
// 													...formData,
// 													organizationName: e.target.value,
// 												})
// 											}
// 										/>
// 									</div>
// 									<div>
// 										<label className="block text-sm font-medium mb-1">
// 											Currency
// 										</label>
// 										<Input
// 											value={formData.currency}
// 											onChange={(e) =>
// 												setFormData({ ...formData, currency: e.target.value })
// 											}
// 										/>
// 									</div>
// 									<div>
// 										<label className="block text-sm font-medium mb-1">
// 											Fiscal Year Start
// 										</label>
// 										<Input
// 											value={formData.fiscalYearStart}
// 											onChange={(e) =>
// 												setFormData({
// 													...formData,
// 													fiscalYearStart: e.target.value,
// 												})
// 											}
// 										/>
// 									</div>
// 									<div>
// 										<label className="block text-sm font-medium mb-1">
// 											Max Loan Amount
// 										</label>
// 										<Input
// 											type="number"
// 											value={formData.maxLoanAmount}
// 											onChange={(e) =>
// 												setFormData({
// 													...formData,
// 													maxLoanAmount: Number(e.target.value),
// 												})
// 											}
// 										/>
// 									</div>
// 									<div>
// 										<label className="block text-sm font-medium mb-1">
// 											Min Savings %
// 										</label>
// 										<Input
// 											type="number"
// 											value={formData.minSavingsPercentage}
// 											onChange={(e) =>
// 												setFormData({
// 													...formData,
// 													minSavingsPercentage: Number(e.target.value),
// 												})
// 											}
// 										/>
// 									</div>
// 									<div>
// 										<label className="block text-sm font-medium mb-1">
// 											Interest Calculation Method
// 										</label>
// 										<Input
// 											value={formData.interestCalculationMethod}
// 											onChange={(e) =>
// 												setFormData({
// 													...formData,
// 													interestCalculationMethod: e.target.value,
// 												})
// 											}
// 										/>
// 									</div>
// 								</div>

// 								<div className="border-t pt-4">
// 									<label className="block text-sm font-medium mb-2">
// 										Organization Logo
// 									</label>
// 									<div className="flex gap-4">
// 										<div className="flex-1">
// 											<Input
// 												type="file"
// 												accept="image/*"
// 												onChange={handleLogoChange}
// 												className="cursor-pointer"
// 											/>
// 											<p className="text-xs text-gray-500 mt-1">
// 												Recommended: 200x200px, PNG or JPG
// 											</p>
// 										</div>
// 										{logoPreview && (
// 											<div className="flex items-center gap-2">
// 												<img
// 													src={logoPreview || "/placeholder.svg"}
// 													alt="Logo preview"
// 													className="h-20 w-20 object-contain border rounded"
// 												/>
// 												<Button
// 													type="button"
// 													variant="outline"
// 													size="sm"
// 													onClick={handleRemoveLogo}
// 													className="text-red-600 bg-transparent">
// 													Remove
// 												</Button>
// 											</div>
// 										)}
// 									</div>
// 								</div>

// 								<div className="flex gap-2 pt-4">
// 									<Button onClick={handleSave}>Save Changes</Button>
// 									<Button variant="outline" onClick={() => setEditing(false)}>
// 										Cancel
// 									</Button>
// 								</div>
// 							</>
// 						) : (
// 							<div className="grid grid-cols-2 gap-4">
// 								<div>
// 									<p className="text-sm text-gray-600">Organization Name</p>
// 									<p className="font-medium">{config?.organizationName}</p>
// 								</div>
// 								<div>
// 									<p className="text-sm text-gray-600">Currency</p>
// 									<p className="font-medium">{config?.currency}</p>
// 								</div>
// 								<div>
// 									<p className="text-sm text-gray-600">Fiscal Year Start</p>
// 									<p className="font-medium">{config?.fiscalYearStart}</p>
// 								</div>
// 								<div>
// 									<p className="text-sm text-gray-600">Max Loan Amount</p>
// 									<p className="font-medium">{config?.maxLoanAmount}</p>
// 								</div>
// 								<div>
// 									<p className="text-sm text-gray-600">
// 										Min Savings Percentage
// 									</p>
// 									<p className="font-medium">{config?.minSavingsPercentage}%</p>
// 								</div>
// 								<div>
// 									<p className="text-sm text-gray-600">Interest Calculation</p>
// 									<p className="font-medium">
// 										{config?.interestCalculationMethod}
// 									</p>
// 								</div>
// 								{config?.organizationLogo && (
// 									<div>
// 										<p className="text-sm text-gray-600">Organization Logo</p>
// 										<img
// 											src={config.organizationLogo || "/placeholder.svg"}
// 											alt="Organization logo"
// 											className="h-20 w-20 object-contain mt-1"
// 										/>
// 									</div>
// 								)}
// 							</div>
// 						)}
// 					</div>
// 				</CardContent>
// 			</Card>

// 			<Card>
// 				<CardHeader>
// 					<CardTitle>Approval Levels</CardTitle>
// 				</CardHeader>
// 				<CardContent>
// 					<div className="grid grid-cols-2 gap-4">
// 						<div>
// 							<p className="text-sm font-medium mb-2">Loan Approval Levels</p>
// 							<ul className="space-y-1">
// 								{config?.loanApprovalLevels.map((level) => (
// 									<li key={level} className="text-sm text-gray-600">
// 										• {level}
// 									</li>
// 								))}
// 							</ul>
// 						</div>
// 						<div>
// 							<p className="text-sm font-medium mb-2">
// 								Withdrawal Approval Levels
// 							</p>
// 							<ul className="space-y-1">
// 								{config?.withdrawalApprovalLevels.map((level) => (
// 									<li key={level} className="text-sm text-gray-600">
// 										• {level}
// 									</li>
// 								))}
// 							</ul>
// 						</div>
// 					</div>
// 				</CardContent>
// 			</Card>
// 		</div>
// 	);
// }
