"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserManagementSection } from "@/components/settings/user-management-section";
import { RolesPermissionsSection } from "@/components/settings/roles-permissions-section";
import { SystemConfigurationSection } from "@/components/settings/system-configuration-section";
import { AuditLogsSection } from "@/components/settings/audit-logs-section";
import { Users, Lock, Settings, FileText } from "lucide-react";

export default function SettingsPage() {
	const [activeTab, setActiveTab] = useState("users");

	return (
		<main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
			<div className="max-w-7xl mx-auto">
				{/* Header */}
				<div className="mb-8">
					<h1 className="text-3xl font-bold text-slate-900 mb-2">
						Settings & Administration
					</h1>
					<p className="text-slate-600">
						Manage users, roles, permissions, and system configuration
					</p>
				</div>

				{/* Tabs */}
				<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
					<TabsList className="grid w-full grid-cols-4 mb-8">
						<TabsTrigger value="users" className="gap-2">
							<Users className="w-4 h-4" />
							<span className="hidden sm:inline">Users</span>
						</TabsTrigger>
						<TabsTrigger value="roles" className="gap-2">
							<Lock className="w-4 h-4" />
							<span className="hidden sm:inline">Roles</span>
						</TabsTrigger>
						<TabsTrigger value="config" className="gap-2">
							<Settings className="w-4 h-4" />
							<span className="hidden sm:inline">Config</span>
						</TabsTrigger>
						<TabsTrigger value="audit" className="gap-2">
							<FileText className="w-4 h-4" />
							<span className="hidden sm:inline">Audit</span>
						</TabsTrigger>
					</TabsList>

					{/* Tab Contents */}
					<TabsContent value="users" className="space-y-6">
						<UserManagementSection />
					</TabsContent>

					<TabsContent value="roles" className="space-y-6">
						<RolesPermissionsSection />
					</TabsContent>

					<TabsContent value="config" className="space-y-6">
						<SystemConfigurationSection />
					</TabsContent>

					<TabsContent value="audit" className="space-y-6">
						<AuditLogsSection />
					</TabsContent>
				</Tabs>
			</div>
		</main>
	);
}
