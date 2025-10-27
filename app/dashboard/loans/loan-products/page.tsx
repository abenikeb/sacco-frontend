"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit2, Trash2, Check, X } from "lucide-react";
import { loanAPI } from "@/lib/api";

interface LoanProduct {
	id: number;
	name: string;
	description: string | null;
	interestRate: number;
	minDurationMonths: number;
	maxDurationMonths: number;
	requiredSavingsPercentage: number;
	requiredSavingsDuringLoan: number;
	maxLoanBasedOnSalaryMonths: number;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}

export default function LoanProductsPage() {
	const [products, setProducts] = useState<LoanProduct[]>([]);
	const [loading, setLoading] = useState(true);
	const [showForm, setShowForm] = useState(false);
	const [editingId, setEditingId] = useState<number | null>(null);
	const [formData, setFormData] = useState({
		name: "",
		description: "",
		interestRate: 9.5,
		minDurationMonths: 1,
		maxDurationMonths: 120,
		requiredSavingsPercentage: 30,
		requiredSavingsDuringLoan: 35,
		maxLoanBasedOnSalaryMonths: 30,
	});
	const { toast } = useToast();

	useEffect(() => {
		fetchProducts();
	}, []);

	const fetchProducts = async () => {
		try {
			setLoading(true);
			const response = await loanAPI.getLoanProduct();
			if (!response) throw new Error("Failed to fetch products");
			setProducts(response);
		} catch (error) {
			toast({
				title: "Error",
				description: "Failed to fetch loan products",
				variant: "destructive",
			});
		} finally {
			setLoading(false);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		try {
			const url = editingId ? `/loan-products/${editingId}` : "/loan-products";
			const method = editingId ? "PUT" : "POST";

			const response = await loanAPI.updateLoanProduct({
				url,
				method,
				formData,
			});

			// const response = await fetch(url, {
			// 	method,
			// 	headers: { "Content-Type": "application/json" },
			// 	body: JSON.stringify(formData),
			// });

			if (!response) {
				const error = await response.json();
				throw new Error(error.error || "Failed to save product");
			}

			toast({
				title: "Success",
				description: editingId
					? "Loan product updated successfully"
					: "Loan product created successfully",
			});

			setShowForm(false);
			setEditingId(null);
			resetForm();
			fetchProducts();
		} catch (error) {
			toast({
				title: "Error",
				description:
					error instanceof Error ? error.message : "Failed to save product",
				variant: "destructive",
			});
		}
	};

	const handleEdit = (product: LoanProduct) => {
		setFormData({
			name: product.name,
			description: product.description || "",
			interestRate: product.interestRate,
			minDurationMonths: product.minDurationMonths,
			maxDurationMonths: product.maxDurationMonths,
			requiredSavingsPercentage: product.requiredSavingsPercentage,
			requiredSavingsDuringLoan: product.requiredSavingsDuringLoan,
			maxLoanBasedOnSalaryMonths: product.maxLoanBasedOnSalaryMonths,
		});
		setEditingId(product.id);
		setShowForm(true);
	};

	const handleDelete = async (id: number) => {
		if (!confirm("Are you sure you want to delete this loan product?")) return;

		try {
			const response = await fetch(`/api/loan-products/${id}`, {
				method: "DELETE",
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || "Failed to delete product");
			}

			toast({
				title: "Success",
				description: "Loan product deleted successfully",
			});

			fetchProducts();
		} catch (error) {
			toast({
				title: "Error",
				description:
					error instanceof Error ? error.message : "Failed to delete product",
				variant: "destructive",
			});
		}
	};

	const handleToggleActive = async (product: LoanProduct) => {
		try {
			const response = await fetch(`/api/loan-products/${product.id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ isActive: !product.isActive }),
			});

			if (!response.ok) throw new Error("Failed to update product");

			toast({
				title: "Success",
				description: `Loan product ${
					!product.isActive ? "activated" : "deactivated"
				} successfully`,
			});

			fetchProducts();
		} catch (error) {
			toast({
				title: "Error",
				description: "Failed to update product status",
				variant: "destructive",
			});
		}
	};

	const resetForm = () => {
		setFormData({
			name: "",
			description: "",
			interestRate: 9.5,
			minDurationMonths: 1,
			maxDurationMonths: 120,
			requiredSavingsPercentage: 30,
			requiredSavingsDuringLoan: 35,
			maxLoanBasedOnSalaryMonths: 30,
		});
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Loan Products</h1>
					<p className="text-muted-foreground mt-2">
						Manage configurable loan product types and rules
					</p>
				</div>
				<Button
					onClick={() => {
						setShowForm(!showForm);
						setEditingId(null);
						resetForm();
					}}
					className="gap-2">
					<Plus className="w-4 h-4" />
					New Product
				</Button>
			</div>

			{showForm && (
				<Card>
					<CardHeader>
						<CardTitle>
							{editingId ? "Edit Loan Product" : "Create New Loan Product"}
						</CardTitle>
						<CardDescription>
							Configure loan product parameters and eligibility rules
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleSubmit} className="space-y-6">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="name">Product Name *</Label>
									<Input
										id="name"
										value={formData.name}
										onChange={(e) =>
											setFormData({ ...formData, name: e.target.value })
										}
										placeholder="e.g., Short-Term Loan"
										required
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="interestRate">Interest Rate (%) *</Label>
									<Input
										id="interestRate"
										type="number"
										step="0.1"
										value={formData.interestRate}
										onChange={(e) =>
											setFormData({
												...formData,
												interestRate: Number.parseFloat(e.target.value),
											})
										}
										required
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="minDuration">Min Duration (Months) *</Label>
									<Input
										id="minDuration"
										type="number"
										value={formData.minDurationMonths}
										onChange={(e) =>
											setFormData({
												...formData,
												minDurationMonths: Number.parseInt(e.target.value),
											})
										}
										required
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="maxDuration">Max Duration (Months) *</Label>
									<Input
										id="maxDuration"
										type="number"
										value={formData.maxDurationMonths}
										onChange={(e) =>
											setFormData({
												...formData,
												maxDurationMonths: Number.parseInt(e.target.value),
											})
										}
										required
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="requiredSavings">
										Required Savings Before Loan (%) *
									</Label>
									<Input
										id="requiredSavings"
										type="number"
										step="0.1"
										value={formData.requiredSavingsPercentage}
										onChange={(e) =>
											setFormData({
												...formData,
												requiredSavingsPercentage: Number.parseFloat(
													e.target.value
												),
											})
										}
										required
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="savingsDuringLoan">
										Required Savings During Loan (%) *
									</Label>
									<Input
										id="savingsDuringLoan"
										type="number"
										step="0.1"
										value={formData.requiredSavingsDuringLoan}
										onChange={(e) =>
											setFormData({
												...formData,
												requiredSavingsDuringLoan: Number.parseFloat(
													e.target.value
												),
											})
										}
										required
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="maxSalaryMonths">
										Max Loan Based on Salary (Months) *
									</Label>
									<Input
										id="maxSalaryMonths"
										type="number"
										value={formData.maxLoanBasedOnSalaryMonths}
										onChange={(e) =>
											setFormData({
												...formData,
												maxLoanBasedOnSalaryMonths: Number.parseInt(
													e.target.value
												),
											})
										}
										required
									/>
								</div>
							</div>

							<div className="space-y-2">
								<Label htmlFor="description">Description</Label>
								<Textarea
									id="description"
									value={formData.description}
									onChange={(e) =>
										setFormData({ ...formData, description: e.target.value })
									}
									placeholder="Describe this loan product..."
									rows={3}
								/>
							</div>

							<div className="flex gap-2">
								<Button type="submit">
									{editingId ? "Update Product" : "Create Product"}
								</Button>
								<Button
									type="button"
									variant="outline"
									onClick={() => {
										setShowForm(false);
										setEditingId(null);
										resetForm();
									}}>
									Cancel
								</Button>
							</div>
						</form>
					</CardContent>
				</Card>
			)}

			{loading ? (
				<div className="text-center py-8">Loading loan products...</div>
			) : products.length === 0 ? (
				<Card>
					<CardContent className="py-8 text-center">
						<p className="text-muted-foreground">
							No loan products created yet. Create one to get started.
						</p>
					</CardContent>
				</Card>
			) : (
				<div className="grid gap-4">
					{products.map((product) => (
						<Card
							key={product.id}
							className={!product.isActive ? "opacity-60" : ""}>
							<CardHeader>
								<div className="flex items-start justify-between">
									<div className="flex-1">
										<div className="flex items-center gap-2">
											<CardTitle>{product.name}</CardTitle>
											{product.isActive ? (
												<span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs font-medium">
													<Check className="w-3 h-3" />
													Active
												</span>
											) : (
												<span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-800 text-xs font-medium">
													<X className="w-3 h-3" />
													Inactive
												</span>
											)}
										</div>
										{product.description && (
											<CardDescription>{product.description}</CardDescription>
										)}
									</div>
									<div className="flex gap-2">
										<Button
											variant="outline"
											size="sm"
											onClick={() => handleEdit(product)}>
											<Edit2 className="w-4 h-4" />
										</Button>
										<Button
											variant="outline"
											size="sm"
											onClick={() => handleToggleActive(product)}>
											{product.isActive ? "Deactivate" : "Activate"}
										</Button>
										<Button
											variant="destructive"
											size="sm"
											onClick={() => handleDelete(product.id)}>
											<Trash2 className="w-4 h-4" />
										</Button>
									</div>
								</div>
							</CardHeader>
							<CardContent>
								<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
									<div>
										<p className="text-sm text-muted-foreground">
											Interest Rate
										</p>
										<p className="text-lg font-semibold">
											{product.interestRate}%
										</p>
									</div>
									<div>
										<p className="text-sm text-muted-foreground">
											Duration Range
										</p>
										<p className="text-lg font-semibold">
											{product.minDurationMonths}-{product.maxDurationMonths} mo
										</p>
									</div>
									<div>
										<p className="text-sm text-muted-foreground">
											Required Savings
										</p>
										<p className="text-lg font-semibold">
											{product.requiredSavingsPercentage}%
										</p>
									</div>
									<div>
										<p className="text-sm text-muted-foreground">
											Max Salary Multiple
										</p>
										<p className="text-lg font-semibold">
											{product.maxLoanBasedOnSalaryMonths}x
										</p>
									</div>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			)}
		</div>
	);
}
