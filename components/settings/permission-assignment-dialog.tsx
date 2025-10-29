"use client";

import { useState, useEffect } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Permission {
	id: number;
	resource: string;
	action: string;
	description?: string;
}

interface PermissionAssignmentDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	roleName: string;
	currentPermissions: Permission[];
	allPermissions: Permission[];
	onSavePermissions: (permissionIds: number[]) => Promise<void>;
	isLoading?: boolean;
}

export function PermissionAssignmentDialog({
	open,
	onOpenChange,
	roleName,
	currentPermissions,
	allPermissions,
	onSavePermissions,
	isLoading = false,
}: PermissionAssignmentDialogProps) {
	const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
	const [error, setError] = useState("");

	useEffect(() => {
		if (open) {
			setSelectedPermissions(currentPermissions.map((p) => p.id));
			setError("");
		}
	}, [open, currentPermissions]);

	const handlePermissionToggle = (permissionId: number) => {
		setSelectedPermissions((prev) =>
			prev.includes(permissionId)
				? prev.filter((id) => id !== permissionId)
				: [...prev, permissionId]
		);
	};

	const handleSave = async () => {
		try {
			setError("");
			await onSavePermissions(selectedPermissions);
			onOpenChange(false);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to save permissions"
			);
		}
	};

	// Group permissions by resource
	const groupedPermissions = allPermissions.reduce((acc, perm) => {
		if (!acc[perm.resource]) {
			acc[perm.resource] = [];
		}
		acc[perm.resource].push(perm);
		return acc;
	}, {} as Record<string, Permission[]>);

	const getActionColor = (action: string) => {
		switch (action) {
			case "VIEW":
				return "text-blue-600";
			case "READ":
				return "text-green-600";
			case "CREATE":
				return "text-purple-600";
			case "UPDATE":
				return "text-orange-600";
			case "DELETE":
				return "text-red-600";
			case "APPROVE":
				return "text-emerald-600";
			case "REJECT":
				return "text-rose-600";
			default:
				return "text-gray-600";
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[600px]">
				<DialogHeader>
					<DialogTitle>Manage Permissions for {roleName}</DialogTitle>
				</DialogHeader>
				<ScrollArea className="h-[400px] pr-4">
					<div className="space-y-6">
						{Object.entries(groupedPermissions).map(
							([resource, permissions]) => (
								<div key={resource} className="space-y-3">
									<h4 className="font-semibold text-sm text-slate-900">
										{resource}
									</h4>
									<div className="grid grid-cols-2 gap-3 pl-4">
										{permissions.map((permission) => (
											<div
												key={permission.id}
												className="flex items-center space-x-2">
												<Checkbox
													id={`perm-${permission.id}`}
													checked={selectedPermissions.includes(permission.id)}
													onCheckedChange={() =>
														handlePermissionToggle(permission.id)
													}
													disabled={isLoading}
												/>
												<Label
													htmlFor={`perm-${permission.id}`}
													className={`text-sm cursor-pointer font-medium ${getActionColor(
														permission.action
													)}`}>
													{permission.action}
												</Label>
											</div>
										))}
									</div>
								</div>
							)
						)}
					</div>
				</ScrollArea>
				{error && <div className="text-sm text-red-600">{error}</div>}
				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={isLoading}>
						Cancel
					</Button>
					<Button onClick={handleSave} disabled={isLoading}>
						{isLoading ? "Saving..." : "Save Permissions"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
