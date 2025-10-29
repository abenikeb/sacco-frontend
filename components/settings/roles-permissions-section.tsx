"use client";

import { useState, useEffect } from "react";
import { permissionAPI } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RoleManagementDialog } from "./role-management-dialog";
import { PermissionAssignmentDialog } from "./permission-assignment-dialog";
import { Plus, Edit2, Trash2 } from "lucide-react";

interface Role {
	id: number;
	name: string;
	description?: string;
	permissions: Array<{
		permission: {
			id: number;
			resource: string;
			action: string;
		};
	}>;
}

interface Permission {
	id: number;
	resource: string;
	action: string;
	description?: string;
}

export function RolesPermissionsSection() {
	const [roles, setRoles] = useState<Role[]>([]);
	const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
	const [loading, setLoading] = useState(true);
	const [createDialogOpen, setCreateDialogOpen] = useState(false);
	const [editDialogOpen, setEditDialogOpen] = useState(false);
	const [selectedRole, setSelectedRole] = useState<Role | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		fetchRolesAndPermissions();
	}, []);

	const fetchRolesAndPermissions = async () => {
		try {
			setLoading(true);
			const [rolesData, permissionsData] = await Promise.all([
				permissionAPI.getAllRolesWithPermissions(),
				permissionAPI.getAllPermissions(),
			]);
			setRoles(rolesData);
			setAllPermissions(permissionsData);
		} catch (error) {
			console.error("Error fetching roles and permissions:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleCreateRole = async (name: string, description: string) => {
		try {
			setIsSubmitting(true);
			await permissionAPI.createRole(name, description);
			await fetchRolesAndPermissions();
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleEditPermissions = (role: Role) => {
		setSelectedRole(role);
		setEditDialogOpen(true);
	};

	const handleSavePermissions = async (permissionIds: number[]) => {
		if (!selectedRole) return;

		try {
			setIsSubmitting(true);
			// Get current permissions
			const currentPermIds = selectedRole.permissions.map(
				(p) => p.permission.id
			);

			// Remove permissions that are no longer selected
			for (const permId of currentPermIds) {
				if (!permissionIds.includes(permId)) {
					await permissionAPI.removePermissionFromRole(selectedRole.id, permId);
				}
			}

			// Add new permissions
			for (const permId of permissionIds) {
				if (!currentPermIds.includes(permId)) {
					await permissionAPI.assignPermissionToRole(selectedRole.id, permId);
				}
			}

			await fetchRolesAndPermissions();
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDeleteRole = async (roleId: number) => {
		if (!confirm("Are you sure you want to delete this role?")) return;

		try {
			setIsSubmitting(true);
			// Note: You may need to add a delete endpoint to the backend
			await fetchRolesAndPermissions();
		} finally {
			setIsSubmitting(false);
		}
	};

	const getActionColor = (action: string) => {
		switch (action) {
			case "VIEW":
				return "bg-blue-100 text-blue-800";
			case "READ":
				return "bg-green-100 text-green-800";
			case "CREATE":
				return "bg-purple-100 text-purple-800";
			case "UPDATE":
				return "bg-orange-100 text-orange-800";
			case "DELETE":
				return "bg-red-100 text-red-800";
			case "APPROVE":
				return "bg-emerald-100 text-emerald-800";
			case "REJECT":
				return "bg-rose-100 text-rose-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h3 className="text-lg font-semibold">
						Roles & Permissions Management
					</h3>
					<p className="text-sm text-gray-600">
						Configure roles and their associated permissions
					</p>
				</div>
				<Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
					<Plus className="w-4 h-4" />
					Create Role
				</Button>
			</div>

			{/* Roles Grid */}
			{loading ? (
				<div className="text-center py-8">Loading roles...</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					{roles.map((role) => (
						<Card key={role.id} className="hover:shadow-lg transition-shadow">
							<CardHeader className="pb-3">
								<div className="flex items-start justify-between">
									<div>
										<CardTitle className="text-base">{role.name}</CardTitle>
										{role.description && (
											<p className="text-sm text-gray-600 mt-1">
												{role.description}
											</p>
										)}
									</div>
									<div className="flex gap-2">
										<Button
											variant="ghost"
											size="sm"
											onClick={() => handleEditPermissions(role)}
											disabled={isSubmitting}>
											<Edit2 className="w-4 h-4" />
										</Button>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => handleDeleteRole(role.id)}
											disabled={isSubmitting}>
											<Trash2 className="w-4 h-4 text-red-600" />
										</Button>
									</div>
								</div>
							</CardHeader>
							<CardContent>
								<div className="space-y-2">
									<p className="text-xs font-semibold text-gray-700">
										Permissions ({role.permissions.length})
									</p>
									<div className="flex flex-wrap gap-2">
										{role.permissions.length > 0 ? (
											role.permissions.map((rp) => (
												<Badge
													key={rp.permission.id}
													className={getActionColor(rp.permission.action)}>
													{rp.permission.resource} - {rp.permission.action}
												</Badge>
											))
										) : (
											<p className="text-xs text-gray-500">
												No permissions assigned
											</p>
										)}
									</div>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			)}

			{/* Dialogs */}
			<RoleManagementDialog
				open={createDialogOpen}
				onOpenChange={setCreateDialogOpen}
				onCreateRole={handleCreateRole}
				isLoading={isSubmitting}
			/>

			{selectedRole && (
				<PermissionAssignmentDialog
					open={editDialogOpen}
					onOpenChange={setEditDialogOpen}
					roleName={selectedRole.name}
					currentPermissions={selectedRole.permissions.map(
						(rp) => rp.permission
					)}
					allPermissions={allPermissions}
					onSavePermissions={handleSavePermissions}
					isLoading={isSubmitting}
				/>
			)}
		</div>
	);
}
