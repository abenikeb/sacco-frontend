"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
	type ColumnDef,
	type ColumnFiltersState,
	type SortingState,
	type VisibilityState,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
} from "@tanstack/react-table";
import {
	ArrowUpDown,
	ChevronDown,
	MoreHorizontal,
	Download,
} from "lucide-react";
import { format, parseISO, startOfMonth, addMonths } from "date-fns";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { DatePicker } from "@/components/ui/date_picker";
import { Badge } from "@/components/ui/badge";
import { membersAPI } from "@/lib/api";

interface Member {
	id: number;
	memberNumber: number;
	etNumber: number;
	name: string;
	division: string | null;
	department: string | null;
	section: string | null;
	group: string | null;
	effectiveDate: string | null;
	balance: {
		totalSavings: number;
		totalContributions: number;
		membershipFee: number;
		willingDeposit: number;
		loanRepayments: number;
	};
}

export default function MembersListPage() {
	const [members, setMembers] = useState<Member[]>([]);
	const [sorting, setSorting] = useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
	const [rowSelection, setRowSelection] = useState({});
	const [effectiveDate, setEffectiveDate] = useState<Date>(
		// startOfMonth(new Date())
		startOfMonth(addMonths(new Date(), 1))
	);
	const router = useRouter();
	const { toast } = useToast();

	const fetchMembers = useCallback(async () => {
		try {
			const response = await membersAPI.getMembersByDate(effectiveDate);
			if (!response) {
				throw new Error("Failed to fetch members");
			}
			// const data = await response.json();
			console.log({ response });
			setMembers(response);
		} catch (error) {
			console.error("Error fetching members:", error);
			toast({
				title: "Error",
				description: "Failed to load members. Please try again.",
				variant: "destructive",
			});
		}
	}, [effectiveDate, toast]);

	useEffect(() => {
		fetchMembers();
	}, [fetchMembers]);

	const columns: ColumnDef<Member>[] = useMemo(
		() => [
			{
				id: "select",
				header: ({ table }) => (
					<Checkbox
						checked={table.getIsAllPageRowsSelected()}
						onCheckedChange={(value) =>
							table.toggleAllPageRowsSelected(!!value)
						}
						aria-label="Select all"
					/>
				),
				cell: ({ row }) => (
					<Checkbox
						checked={row.getIsSelected()}
						onCheckedChange={(value) => row.toggleSelected(!!value)}
						aria-label="Select row"
					/>
				),
				enableSorting: false,
				enableHiding: false,
			},
			{
				accessorKey: "memberNumber",
				header: "Member Number",
				cell: ({ row }) => <div>{row.getValue("memberNumber")}</div>,
			},
			{
				accessorKey: "etNumber",
				header: "ET Number",
				cell: ({ row }) => <div>{row.getValue("etNumber")}</div>,
			},
			{
				accessorKey: "name",
				header: ({ column }) => {
					return (
						<Button
							variant="ghost"
							onClick={() =>
								column.toggleSorting(column.getIsSorted() === "asc")
							}>
							Name
							<ArrowUpDown className="ml-2 h-4 w-4" />
						</Button>
					);
				},
				cell: ({ row }) => <div>{row.getValue("name")}</div>,
			},
			{
				accessorKey: "division",
				header: "Division",
				cell: ({ row }) => (
					<Badge
						variant="outline"
						className="bg-green-100 text-green-800 border-green-300">
						{row.getValue("division") || "N/A"}
					</Badge>
				),
			},
			{
				accessorKey: "department",
				header: "Department",
				cell: ({ row }) => <div>{row.getValue("department")}</div>,
			},
			// {
			// 	accessorKey: "group",
			// 	header: "Group",
			// 	cell: ({ row }) => <div>{row.getValue("group")}</div>,
			// },
			{
				accessorKey: "effectiveDate",
				header: "Effective Date",
				cell: ({ row }) => {
					const date = row.getValue("effectiveDate");
					const displayDate = date ? parseISO(date as string) : new Date();
					return (
						<Badge
							variant="outline"
							className="bg-blue-100 text-blue-800 border-blue-300">
							{format(displayDate, "MMMM yyyy")}
						</Badge>
					);
				},
			},
			{
				accessorKey: "balance.totalSavings",
				header: "Current Month Savings",
				cell: ({ row }) => {
					const amount = row.original.balance.totalSavings;
					if (amount === 0) {
						return <div className="text-muted-foreground italic">No data</div>;
					}
					const formatted = new Intl.NumberFormat("en-ET", {
						style: "currency",
						currency: "ETB",
					}).format(amount);
					return <div>{formatted}</div>;
				},
			},
			{
				accessorKey: "balance.totalContributions",
				header: "Total Contributions",
				cell: ({ row }) => {
					const amount = row.original.balance.totalContributions;

					if (amount === 0) {
						return <div className="text-muted-foreground italic">No data</div>;
					}
					const formatted = new Intl.NumberFormat("en-ET", {
						style: "currency",
						currency: "ETB",
					}).format(amount);
					return <div>{formatted}</div>;
				},
			},
			{
				accessorKey: "balance.loanRepayments",
				header: "Loan Repayments",
				cell: ({ row }) => {
					const amount = row.original.balance.loanRepayments;
					if (amount === 0) {
						return <div className="text-muted-foreground italic">No data</div>;
					}
					const formatted = new Intl.NumberFormat("en-ET", {
						style: "currency",
						currency: "ETB",
					}).format(amount);
					return <div>{formatted}</div>;
				},
			},
			{
				accessorKey: "balance.willingDeposit",
				header: "Willing Deposit",
				cell: ({ row }) => {
					const amount = row.original.balance.willingDeposit;
					if (amount === 0) {
						return <div className="text-muted-foreground italic">No data</div>;
					}
					const formatted = new Intl.NumberFormat("en-ET", {
						style: "currency",
						currency: "ETB",
					}).format(amount);
					return <div>{formatted}</div>;
				},
			},
			{
				id: "actions",
				enableHiding: false,
				cell: ({ row }) => {
					const member = row.original;

					return (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="ghost" className="h-8 w-8 p-0">
									<span className="sr-only">Open menu</span>
									<MoreHorizontal className="h-4 w-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuLabel>Actions</DropdownMenuLabel>
								<DropdownMenuItem
									onClick={() =>
										router.push(`/dashboard/members/${member.etNumber}`)
									}>
									View Details
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() =>
										router.push(`/dashboard/members/edit/${member.etNumber}`)
									}>
									Edit Member
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem>Delete Member</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					);
				},
			},
		],
		[router]
	);

	const table = useReactTable({
		data: members,
		columns,
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		onColumnVisibilityChange: setColumnVisibility,
		onRowSelectionChange: setRowSelection,
		state: {
			sorting,
			columnFilters,
			columnVisibility,
			rowSelection,
		},
	});

	const handleDateChange = useCallback((date: Date | undefined) => {
		if (date) {
			// const newDate = startOfMonth(date);
			const newDate = startOfMonth(addMonths(date, 1));
			console.log("New effective date:", newDate.toISOString()); // Debug log
			setEffectiveDate(newDate);
		}
	}, []);

	const handleExport = useCallback(() => {
		const headers = columns
			.filter(
				(column: any) =>
					column.accessorKey &&
					column.accessorKey !== "membershipFee" &&
					column.accessorKey !== "section"
			)
			.map((column) => column.header as string);

		const csvContent = [
			headers.join(","),
			...members.map((member) =>
				columns
					.filter(
						(column: any) =>
							column.accessorKey &&
							column.accessorKey !== "membershipFee" &&
							column.accessorKey !== "section"
					)
					.map((column: any) => {
						const value = column.accessorKey
							.split(".")
							.reduce((obj: any, key: any) => obj[key], member);
						return typeof value === "string" && value.includes(",")
							? `"${value}"`
							: value;
					})
					.join(",")
			),
		].join("\n");

		const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
		const link = document.createElement("a");
		if (link.download !== undefined) {
			const url = URL.createObjectURL(blob);
			link.setAttribute("href", url);
			link.setAttribute(
				"download",
				`members_${format(new Date(), "yyyy-MM-dd")}.csv`
			);
			link.style.visibility = "hidden";
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
		}
	}, [members, columns]);

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-bold">Members List</h1>
				<div className="flex items-center space-x-2">
					<DatePicker
						selected={effectiveDate}
						onSelect={handleDateChange}
						placeholderText="Select Effective Month"
					/>
					<Input
						placeholder="Filter members..."
						value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
						onChange={(event) =>
							table.getColumn("name")?.setFilterValue(event.target.value)
						}
						className="max-w-sm"
					/>
					<Button onClick={() => router.push("/dashboard/members/add")}>
						Add Member
					</Button>
					<Button onClick={() => router.push("/dashboard/members/import")}>
						Import Members
					</Button>
					<Button onClick={handleExport} variant="outline">
						<Download className="mr-2 h-4 w-4" />
						Export CSV
					</Button>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline" className="ml-auto">
								Columns <ChevronDown className="ml-2 h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							{table
								.getAllColumns()
								.filter((column) => column.getCanHide())
								.map((column) => {
									return (
										<DropdownMenuCheckboxItem
											key={column.id}
											className="capitalize"
											checked={column.getIsVisible()}
											onCheckedChange={(value) =>
												column.toggleVisibility(!!value)
											}>
											{column.id}
										</DropdownMenuCheckboxItem>
									);
								})}
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>
			<div className="rounded-md border">
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => {
									return (
										<TableHead key={header.id}>
											{header.isPlaceholder
												? null
												: flexRender(
														header.column.columnDef.header,
														header.getContext()
												  )}
										</TableHead>
									);
								})}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map((row) => (
								<TableRow
									key={row.id}
									data-state={row.getIsSelected() && "selected"}>
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id}>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext()
											)}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell
									colSpan={columns.length}
									className="h-24 text-center">
									No results.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
			<div className="flex items-center justify-end space-x-2 py-4">
				<div className="flex-1 text-sm text-muted-foreground">
					{table.getFilteredSelectedRowModel().rows.length} of{" "}
					{table.getFilteredRowModel().rows.length} row(s) selected.
				</div>
				<div className="space-x-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => table.previousPage()}
						disabled={!table.getCanPreviousPage()}>
						Previous
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => table.nextPage()}
						disabled={!table.getCanNextPage()}>
						Next
					</Button>
				</div>
			</div>
		</div>
	);
}
