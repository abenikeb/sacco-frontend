"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { settingsAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit2, Plus } from "lucide-react";

interface User {
	id: number;
	name: string;
	email: string;
	phone: string;
	role: string;
	createdAt: string;
}

export function UserManagementSection() {
	const [users, setUsers] = useState<User[]>([]);
	const [loading, setLoading] = useState(true);
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [showForm, setShowForm] = useState(false);
	const [formData, setFormData] = useState({
		name: "",
		email: "",
		phone: "",
		password: "",
		role: "MEMBER",
	});

	useEffect(() => {
		fetchUsers();
	}, [page]);

	const fetchUsers = async () => {
		try {
			setLoading(true);
			const data = await settingsAPI.getAllUsers(page, 20);
			setUsers(data.users);
			setTotalPages(data.totalPages);
		} catch (error) {
			console.error("Error fetching users:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleCreateUser = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			await settingsAPI.createUser(formData);
			setFormData({
				name: "",
				email: "",
				phone: "",
				password: "",
				role: "MEMBER",
			});
			setShowForm(false);
			fetchUsers();
		} catch (error) {
			console.error("Error creating user:", error);
		}
	};

	const handleDeleteUser = async (userId: number) => {
		if (confirm("Are you sure you want to delete this user?")) {
			try {
				await settingsAPI.deleteUser(userId);
				fetchUsers();
			} catch (error) {
				console.error("Error deleting user:", error);
			}
		}
	};

	const getRoleBadgeColor = (role: string) => {
		const colors: Record<string, string> = {
			MEMBER: "bg-blue-100 text-blue-800",
			ACCOUNTANT: "bg-green-100 text-green-800",
			SUPERVISOR: "bg-yellow-100 text-yellow-800",
			MANAGER: "bg-red-100 text-red-800",
			COMMITTEE: "bg-purple-100 text-purple-800",
		};
		return colors[role] || "bg-gray-100 text-gray-800";
	};

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<div>
					<h3 className="text-lg font-semibold">User Management</h3>
					<p className="text-sm text-gray-600">
						Manage system users and their roles
					</p>
				</div>
				<Button onClick={() => setShowForm(!showForm)} className="gap-2">
					<Plus className="w-4 h-4" />
					Add User
				</Button>
			</div>

			{showForm && (
				<Card>
					<CardHeader>
						<CardTitle>Create New User</CardTitle>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleCreateUser} className="space-y-4">
							<div className="grid grid-cols-2 gap-4">
								<Input
									placeholder="Full Name"
									value={formData.name}
									onChange={(e) =>
										setFormData({ ...formData, name: e.target.value })
									}
									required
								/>
								<Input
									placeholder="Email"
									type="email"
									value={formData.email}
									onChange={(e) =>
										setFormData({ ...formData, email: e.target.value })
									}
									required
								/>
								<Input
									placeholder="Phone"
									value={formData.phone}
									onChange={(e) =>
										setFormData({ ...formData, phone: e.target.value })
									}
									required
								/>
								<Input
									placeholder="Password"
									type="password"
									value={formData.password}
									onChange={(e) =>
										setFormData({ ...formData, password: e.target.value })
									}
									required
								/>
								<select
									value={formData.role}
									onChange={(e) =>
										setFormData({ ...formData, role: e.target.value })
									}
									className="px-3 py-2 border rounded-md">
									<option value="MEMBER">Member</option>
									<option value="ACCOUNTANT">Accountant</option>
									<option value="SUPERVISOR">Supervisor</option>
									<option value="MANAGER">Manager</option>
									<option value="COMMITTEE">Committee</option>
								</select>
							</div>
							<div className="flex gap-2">
								<Button type="submit">Create User</Button>
								<Button
									type="button"
									variant="outline"
									onClick={() => setShowForm(false)}>
									Cancel
								</Button>
							</div>
						</form>
					</CardContent>
				</Card>
			)}

			<Card>
				<CardHeader>
					<CardTitle>Users List</CardTitle>
					<CardDescription>Total Users: {users.length}</CardDescription>
				</CardHeader>
				<CardContent>
					{loading ? (
						<div className="text-center py-8">Loading users...</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full text-sm">
								<thead className="border-b">
									<tr>
										<th className="text-left py-3 px-4">Name</th>
										<th className="text-left py-3 px-4">Email</th>
										<th className="text-left py-3 px-4">Phone</th>
										<th className="text-left py-3 px-4">Role</th>
										<th className="text-left py-3 px-4">Created</th>
										<th className="text-left py-3 px-4">Actions</th>
									</tr>
								</thead>
								<tbody>
									{users.map((user) => (
										<tr key={user.id} className="border-b hover:bg-gray-50">
											<td className="py-3 px-4">{user.name}</td>
											<td className="py-3 px-4">{user.email}</td>
											<td className="py-3 px-4">{user.phone}</td>
											<td className="py-3 px-4">
												<Badge className={getRoleBadgeColor(user.role)}>
													{user.role}
												</Badge>
											</td>
											<td className="py-3 px-4">
												{new Date(user.createdAt).toLocaleDateString()}
											</td>
											<td className="py-3 px-4">
												<div className="flex gap-2">
													<Button
														size="sm"
														variant="outline"
														className="gap-1 bg-transparent">
														<Edit2 className="w-4 h-4" />
													</Button>
													<Button
														size="sm"
														variant="outline"
														className="text-red-600 bg-transparent"
														onClick={() => handleDeleteUser(user.id)}>
														<Trash2 className="w-4 h-4" />
													</Button>
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}

					{totalPages > 1 && (
						<div className="flex justify-center gap-2 mt-4">
							<Button
								variant="outline"
								onClick={() => setPage(Math.max(1, page - 1))}
								disabled={page === 1}>
								Previous
							</Button>
							<span className="py-2 px-4">
								Page {page} of {totalPages}
							</span>
							<Button
								variant="outline"
								onClick={() => setPage(Math.min(totalPages, page + 1))}
								disabled={page === totalPages}>
								Next
							</Button>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
