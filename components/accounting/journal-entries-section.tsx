"use client";

import { useState, useEffect } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { accountingAPI } from "@/lib/api";

interface JournalEntriesProps {
	formatCurrency: (value: number) => string;
}

export default function JournalEntriesSection({
	formatCurrency,
}: JournalEntriesProps) {
	const [entries, setEntries] = useState<any[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [expandedEntry, setExpandedEntry] = useState<number | null>(null);
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [fromDate, setFromDate] = useState("");
	const [toDate, setToDate] = useState("");

	useEffect(() => {
		fetchJournalEntries();
	}, [page]);

	const fetchJournalEntries = async () => {
		setIsLoading(true);
		setError(null);
		try {
			const result = await accountingAPI.getJournalEntries(
				page,
				10,
				fromDate || undefined,
				toDate || undefined
			);
			setEntries(result.entries || []);
			setTotalPages(result.pagination?.pages || 1);
		} catch (err: any) {
			console.error("Error fetching journal entries:", err);
			setError(err.message || "Failed to fetch journal entries");
		} finally {
			setIsLoading(false);
		}
	};

	const handleFilter = () => {
		setPage(1);
		fetchJournalEntries();
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Journal Entries</CardTitle>
				<CardDescription>
					View all recorded journal entries with debit and credit details
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				{/* Filters */}
				<div className="flex gap-2 flex-wrap">
					<Input
						type="date"
						value={fromDate}
						onChange={(e) => setFromDate(e.target.value)}
						placeholder="From Date"
						className="w-40"
					/>
					<Input
						type="date"
						value={toDate}
						onChange={(e) => setToDate(e.target.value)}
						placeholder="To Date"
						className="w-40"
					/>
					<Button onClick={handleFilter} disabled={isLoading} variant="outline">
						Filter
					</Button>
				</div>

				{error && (
					<div className="text-sm text-red-600 bg-red-50 p-3 rounded">
						{error}
					</div>
				)}

				{isLoading ? (
					<div className="flex items-center justify-center py-8">
						<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
					</div>
				) : entries.length === 0 ? (
					<div className="text-center py-8 text-muted-foreground">
						No journal entries found
					</div>
				) : (
					<div className="space-y-2">
						{entries.map((entry) => (
							<div key={entry.id} className="border rounded-lg">
								<button
									onClick={() =>
										setExpandedEntry(
											expandedEntry === entry.id ? null : entry.id
										)
									}
									className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
									<div className="flex items-center gap-4 flex-1 text-left">
										<div>
											<p className="font-semibold text-sm">
												{entry.entryNumber}
											</p>
											<p className="text-xs text-muted-foreground">
												{entry.description}
											</p>
										</div>
										<Badge variant="outline">{entry.status}</Badge>
										<div className="text-xs text-muted-foreground">
											{new Date(entry.entryDate).toLocaleDateString()}
										</div>
									</div>
									{expandedEntry === entry.id ? (
										<ChevronUp className="h-4 w-4" />
									) : (
										<ChevronDown className="h-4 w-4" />
									)}
								</button>

								{expandedEntry === entry.id && (
									<div className="border-t bg-muted/30 p-4">
										<table className="w-full text-sm">
											<thead>
												<tr className="border-b">
													<th className="text-left py-2 px-2">Account</th>
													<th className="text-right py-2 px-2">Debit</th>
													<th className="text-right py-2 px-2">Credit</th>
												</tr>
											</thead>
											<tbody>
												{entry.journalLines?.map((line: any, idx: number) => (
													<tr key={idx} className="border-b last:border-b-0">
														<td className="py-2 px-2">
															<div>
																<p className="font-medium">
																	{line.account?.code}
																</p>
																<p className="text-xs text-muted-foreground">
																	{line.account?.name}
																</p>
															</div>
														</td>
														<td className="text-right py-2 px-2">
															{line.debit > 0
																? formatCurrency(Number(line.debit))
																: "-"}
														</td>
														<td className="text-right py-2 px-2">
															{line.credit > 0
																? formatCurrency(Number(line.credit))
																: "-"}
														</td>
													</tr>
												))}
												<tr className="font-semibold bg-muted/50">
													<td className="py-2 px-2">Total</td>
													<td className="text-right py-2 px-2">
														{formatCurrency(
															entry.journalLines?.reduce(
																(sum: number, line: any) =>
																	sum + Number(line.debit),
																0
															) || 0
														)}
													</td>
													<td className="text-right py-2 px-2">
														{formatCurrency(
															entry.journalLines?.reduce(
																(sum: number, line: any) =>
																	sum + Number(line.credit),
																0
															) || 0
														)}
													</td>
												</tr>
											</tbody>
										</table>
									</div>
								)}
							</div>
						))}
					</div>
				)}

				{/* Pagination */}
				{totalPages > 1 && (
					<div className="flex items-center justify-between pt-4 border-t">
						<p className="text-sm text-muted-foreground">
							Page {page} of {totalPages}
						</p>
						<div className="flex gap-2">
							<Button
								onClick={() => setPage(Math.max(1, page - 1))}
								disabled={page === 1 || isLoading}
								variant="outline"
								size="sm">
								Previous
							</Button>
							<Button
								onClick={() => setPage(Math.min(totalPages, page + 1))}
								disabled={page === totalPages || isLoading}
								variant="outline"
								size="sm">
								Next
							</Button>
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
