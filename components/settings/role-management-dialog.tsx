"use client";

import { useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface RoleManagementDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onCreateRole: (name: string, description: string) => Promise<void>;
	isLoading?: boolean;
}

export function RoleManagementDialog({
	open,
	onOpenChange,
	onCreateRole,
	isLoading = false,
}: RoleManagementDialogProps) {
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [error, setError] = useState("");

	const handleSubmit = async () => {
		if (!name.trim()) {
			setError("Role name is required");
			return;
		}

		try {
			setError("");
			await onCreateRole(name, description);
			setName("");
			setDescription("");
			onOpenChange(false);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to create role");
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Create New Role</DialogTitle>
				</DialogHeader>
				<div className="space-y-4 py-4">
					<div className="space-y-2">
						<Label htmlFor="role-name">Role Name</Label>
						<Input
							id="role-name"
							placeholder="e.g., Loan Officer"
							value={name}
							onChange={(e) => setName(e.target.value)}
							disabled={isLoading}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="role-description">Description</Label>
						<Textarea
							id="role-description"
							placeholder="Describe the purpose of this role"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							disabled={isLoading}
							rows={3}
						/>
					</div>
					{error && <div className="text-sm text-red-600">{error}</div>}
				</div>
				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={isLoading}>
						Cancel
					</Button>
					<Button onClick={handleSubmit} disabled={isLoading}>
						{isLoading ? "Creating..." : "Create Role"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
