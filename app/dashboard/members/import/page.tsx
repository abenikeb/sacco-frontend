"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, CheckCircle, AlertCircle, XCircle } from "lucide-react";
import * as XLSX from "xlsx";
import { Progress } from "@/components/ui/progress";
import { membersAPI } from "@/lib/api";

interface MemberData {
	"Location Category": string;
	"Location": string;
	"Employee Number": number;
	"ET Number": number;
	"Assignment Number": number;
	"Name": string;
	"Division": string;
	"Department"?: string;
	"Section": string;
	"Group": string;
	"Assignment Status": string;
	"Effective Date": number;
	"Credit Association Savings": number;
	"Credit Association Membership Fee": number;
	"Credit Association Registration Fee": number;
	"Credit Association Cost of Share": number;
	"Credit Association Loan Repayment": number;
	"Credit Association Purchases": number;
	"Credit Association Willing Deposit": number;
	"Total": number;
}

interface ImportResult {
	importedCount: number;
	skipped: number;
	failed: number;
	errors?: string[];
}

export default function ImportMembersPage() {
	const [file, setFile] = useState<File | null>(null);
	const [importErrors, setImportErrors] = useState<string[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [importResult, setImportResult] = useState<ImportResult | null>(null);
	const [uploadProgress, setUploadProgress] = useState(0);
	const router = useRouter();
	const { toast } = useToast();

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files) {
			setFile(e.target.files[0]);
			setImportErrors([]);
			setImportResult(null);
			setUploadProgress(0);
		}
	};

	const handleImport = async () => {
		if (!file) {
			toast({
				title: "Error",
				description: "Please select a file to import.",
				variant: "destructive",
			});
			return;
		}

		setIsLoading(true);
		setUploadProgress(10);

		const reader = new FileReader();

		reader.onload = async (e) => {
			try {
				setUploadProgress(30);
				const data = new Uint8Array(e.target?.result as ArrayBuffer);
				const workbook = XLSX.read(data, { type: "array" });
				const sheetName = workbook.SheetNames[0];
				const worksheet = workbook.Sheets[sheetName];
				const jsonData: MemberData[] = XLSX.utils.sheet_to_json(worksheet);
				console.log("jsondata", jsonData);

				setUploadProgress(50);
				const response = await membersAPI.importMembers(jsonData);

				setUploadProgress(90);

				if (!response) {
					throw new Error("Failed to import members");
				}

				// const result: ImportResult = await response.json();
				setUploadProgress(100);

				// Store the complete result
				setImportResult(response);

				if (response.errors && response.errors.length > 0) {
					setImportErrors(response.errors);
				}

				toast({
					title: "Import Complete",
					description: `Imported ${response.importedCount} members successfully.`,
				});
			} catch (error) {
				console.error("Error importing members:", error);
				toast({
					title: "Error",
					description: "Failed to import members. Please try again.",
					variant: "destructive",
				});
				setImportErrors([(error as Error).message]);
			} finally {
				setIsLoading(false);
			}
		};

		reader.readAsArrayBuffer(file);
	};

	const handleNavigateToDashboard = () => {
		router.push("/dashboard/members");
	};

	return (
		<div className="space-y-6">
			<h1 className="text-2xl font-bold">Import Members</h1>

			<Card>
				<CardHeader>
					<CardTitle>Import Members from Excel</CardTitle>
					<CardDescription>
						Upload an Excel file containing member data
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						<div>
							<Label htmlFor="file">Excel File</Label>
							<Input
								id="file"
								type="file"
								accept=".xlsx, .xls"
								onChange={handleFileChange}
								disabled={isLoading}
							/>
						</div>
						<Button
							onClick={handleImport}
							disabled={!file || isLoading}
							className="w-full sm:w-auto">
							{isLoading ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Importing Members...
								</>
							) : (
								"Import Members"
							)}
						</Button>
					</div>
				</CardContent>
			</Card>

			{isLoading && (
				<Card>
					<CardHeader>
						<CardTitle>Processing Import</CardTitle>
						<CardDescription>
							Please wait while we process your file
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<Progress value={uploadProgress} className="h-2 w-full" />
						<div className="flex items-center justify-center p-4">
							<div className="text-center">
								<Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
								<p className="mt-2 text-sm text-muted-foreground">
									{uploadProgress < 30 && "Reading file..."}
									{uploadProgress >= 30 &&
										uploadProgress < 50 &&
										"Processing data..."}
									{uploadProgress >= 50 &&
										uploadProgress < 90 &&
										"Uploading to server..."}
									{uploadProgress >= 90 && "Finalizing import..."}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
			)}

			{importResult && !isLoading && (
				<Card>
					<CardHeader>
						<CardTitle>Import Results</CardTitle>
						<CardDescription>Summary of the import operation</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="grid gap-4 sm:grid-cols-3">
							<div className="flex flex-col items-center justify-center p-4 bg-green-50 rounded-lg">
								<CheckCircle className="h-8 w-8 text-green-500 mb-2" />
								<p className="text-xl font-bold">
									{importResult.importedCount}
								</p>
								<p className="text-sm text-muted-foreground">
									Successfully Imported
								</p>
							</div>

							<div className="flex flex-col items-center justify-center p-4 bg-amber-50 rounded-lg">
								<AlertCircle className="h-8 w-8 text-amber-500 mb-2" />
								<p className="text-xl font-bold">{importResult.skipped}</p>
								<p className="text-sm text-muted-foreground">Skipped Records</p>
							</div>

							<div className="flex flex-col items-center justify-center p-4 bg-red-50 rounded-lg">
								<XCircle className="h-8 w-8 text-red-500 mb-2" />
								<p className="text-xl font-bold">{importResult.failed}</p>
								<p className="text-sm text-muted-foreground">Failed Records</p>
							</div>
						</div>
					</CardContent>
					<CardFooter>
						{importResult.importedCount > 0 && (
							<Button onClick={handleNavigateToDashboard} className="ml-auto">
								View Members
							</Button>
						)}
					</CardFooter>
				</Card>
			)}

			{importErrors.length > 0 && !isLoading && (
				<Card>
					<CardHeader>
						<CardTitle>Import Errors</CardTitle>
						<CardDescription>
							The following errors occurred during import:
						</CardDescription>
					</CardHeader>
					<CardContent>
						<ul className="list-disc pl-5 space-y-1">
							{importErrors.map((error, index) => (
								<li key={index} className="text-red-500">
									{error}
								</li>
							))}
						</ul>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
