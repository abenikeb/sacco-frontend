"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, CheckCircle, XCircle, Eye, RefreshCw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { authAPI, membersAPI, membershipAPI } from "@/lib/api";
import { useAuth } from "@/components/auth-provider";

interface MembershipRequest {
	id: number;
	name: string;
	email: string;
	phone: string;
	etNumber?: number;
	department: string;
	status: string;
	createdAt: string;
}

export default function MembershipRequestsReviewPage() {
	const [requests, setRequests] = useState<MembershipRequest[]>([]);
	const [filteredRequests, setFilteredRequests] = useState<MembershipRequest[]>(
		[]
	);
	const [selectedRequest, setSelectedRequest] =
		useState<MembershipRequest | null>(null);
	const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [isProcessing, setIsProcessing] = useState(false);
	const [activeTab, setActiveTab] = useState("all");
	const router = useRouter();
	const { toast } = useToast();
	const { user, logout } = useAuth();
	useEffect(() => {
		fetchMembershipRequests();
	}, []);

	useEffect(() => {
		if (activeTab === "all") {
			setFilteredRequests(requests);
		} else {
			setFilteredRequests(
				requests.filter((request) => request.status === activeTab.toUpperCase())
			);
		}
	}, [activeTab, requests]);

	//let us get the role of the logged user

	const fetchMembershipRequests = async () => {
		setIsLoading(true);
		try {
			const response = await membershipAPI.getMembershipRequests();
			if (response) {
				setRequests(response);
				setFilteredRequests(response);
			} else {
				throw new Error("Failed to fetch membership requests");
			}
		} catch (error) {
			console.error("Error fetching membership requests:", error);
			toast({
				title: "Error",
				description: "Failed to load membership requests. Please try again.",
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
		}
	};

	const handleStatusUpdate = async (id: number, newStatus: string) => {
		setIsProcessing(true);
		try {
			const response = await membershipAPI.getMembershipRequestById(
				id,
				newStatus
			);

			if (response) {
				// Show appropriate toast based on status
				if (newStatus === "APPROVED") {
					toast({
						title: "Request Approved",
						description: response.newMember
							? `Member created with ID: ${response.newMember.memberNumber}`
							: "Membership request has been approved.",
						variant: "default",
					});
				} else if (newStatus === "REJECTED") {
					toast({
						title: "Request Rejected",
						description: "Membership request has been rejected.",
						variant: "default",
					});
				}

				// Close dialog if open
				setIsViewDialogOpen(false);

				// Refresh the list
				fetchMembershipRequests();
			} else {
				throw new Error("Failed to update membership request status");
			}
		} catch (error) {
			console.error("Error updating membership request status:", error);
			toast({
				title: "Error",
				description: "Failed to update status. Please try again.",
				variant: "destructive",
			});
		} finally {
			setIsProcessing(false);
		}
	};

	const handleViewRequest = (request: MembershipRequest) => {
		setSelectedRequest(request);
		setIsViewDialogOpen(true);
	};

	const getStatusBadge = (status: string) => {
		switch (status) {
			case "PENDING":
				return (
					<Badge className="bg-yellow-500 hover:bg-yellow-600">Pending</Badge>
				);
			case "APPROVED":
				return (
					<Badge className="bg-green-500 hover:bg-green-600">Approved</Badge>
				);
			case "REJECTED":
				return <Badge className="bg-red-500 hover:bg-red-600">Rejected</Badge>;
			default:
				return (
					<Badge className="bg-gray-500 hover:bg-gray-600">{status}</Badge>
				);
		}
	};

	return (
		<div className="container mx-auto py-6 space-y-6">
			<div className="flex justify-between items-center">
				<h1 className="text-3xl font-bold tracking-tight">
					Membership Requests
				</h1>
				<Button onClick={fetchMembershipRequests} variant="outline" size="sm">
					<RefreshCw className="h-4 w-4 tmr-2" />
					Refresh
				</Button>
			</div>

			<Tabs
				defaultValue="all"
				value={activeTab}
				onValueChange={setActiveTab}
				className="w-full">
				<TabsList className="grid grid-cols-4 w-full max-w-md mb-4">
					<TabsTrigger value="all">All</TabsTrigger>
					<TabsTrigger value="pending">Pending</TabsTrigger>
					<TabsTrigger value="approved">Approved</TabsTrigger>
					<TabsTrigger value="rejected">Rejected</TabsTrigger>
				</TabsList>

				<TabsContent value={activeTab} className="mt-0">
					<Card>
						<CardHeader className="pb-3">
							<CardTitle>Membership Requests</CardTitle>
							<CardDescription>
								{activeTab === "all"
									? "Review and manage all membership requests"
									: `Showing ${activeTab.toLowerCase()} membership requests`}
							</CardDescription>
						</CardHeader>
						<CardContent>
							{isLoading ? (
								<div className="flex justify-center items-center py-8">
									<Loader2 className="h-8 w-8 animate-spin text-primary" />
								</div>
							) : filteredRequests.length === 0 ? (
								<div className="text-center py-8 text-muted-foreground">
									No {activeTab !== "all" ? activeTab.toLowerCase() : ""}{" "}
									membership requests found
								</div>
							) : (
								<div className="rounded-md border">
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>Name</TableHead>
												<TableHead className="hidden md:table-cell">
													Email
												</TableHead>
												<TableHead className="hidden md:table-cell">
													Phone
												</TableHead>
												<TableHead className="hidden md:table-cell">
													Department
												</TableHead>
												<TableHead>Status</TableHead>
												<TableHead className="hidden md:table-cell">
													Date
												</TableHead>
												<TableHead>Actions</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{filteredRequests.map((request) => (
												<TableRow key={request.id}>
													<TableCell className="font-medium">
														{request.name}
													</TableCell>
													<TableCell className="hidden md:table-cell">
														{request.email}
													</TableCell>
													<TableCell className="hidden md:table-cell">
														{request.phone}
													</TableCell>
													<TableCell className="hidden md:table-cell">
														{request.department}
													</TableCell>
													<TableCell>
														{getStatusBadge(request.status)}
													</TableCell>
													<TableCell className="hidden md:table-cell">
														{new Date(request.createdAt).toLocaleDateString()}
													</TableCell>
													<TableCell>
														<div className="flex items-center gap-2">
															<Button
																variant="ghost"
																size="icon"
																onClick={() => handleViewRequest(request)}
																title="View Details">
																<Eye className="h-4 w-4" />
															</Button>

															{request.status === "PENDING" && (
																<>
																	<Button
																		variant="ghost"
																		size="icon"
																		className="text-green-600 hover:text-green-700 hover:bg-green-50"
																		onClick={() => {
																			let status =
																				user?.role !== "MANAGER"
																					? "PENDING"
																					: "APPROVED";

																			handleStatusUpdate(request.id, status);
																		}}
																		disabled={isProcessing}
																		title="Approve Request">
																		<CheckCircle className="h-4 w-4" />
																	</Button>

																	<Button
																		variant="ghost"
																		size="icon"
																		className="text-red-600 hover:text-red-700 hover:bg-red-50"
																		onClick={() =>
																			handleStatusUpdate(request.id, "REJECTED")
																		}
																		disabled={isProcessing}
																		title="Reject Request">
																		<XCircle className="h-4 w-4" />
																	</Button>
																</>
															)}
														</div>
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>

			{/* View Request Dialog */}
			<Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Membership Request Details</DialogTitle>
						<DialogDescription>
							Complete information about this membership request
						</DialogDescription>
					</DialogHeader>

					{selectedRequest && (
						<div className="space-y-6 py-4">
							<div className="space-y-4">
								<div className="grid grid-cols-3 gap-1">
									<div className="text-sm font-medium text-muted-foreground">
										Name
									</div>
									<div className="col-span-2 font-medium">
										{selectedRequest.name}
									</div>
								</div>

								<div className="grid grid-cols-3 gap-1">
									<div className="text-sm font-medium text-muted-foreground">
										Email
									</div>
									<div className="col-span-2">{selectedRequest.email}</div>
								</div>

								<div className="grid grid-cols-3 gap-1">
									<div className="text-sm font-medium text-muted-foreground">
										Phone
									</div>
									<div className="col-span-2">{selectedRequest.phone}</div>
								</div>

								<div className="grid grid-cols-3 gap-1">
									<div className="text-sm font-medium text-muted-foreground">
										Department
									</div>
									<div className="col-span-2">{selectedRequest.department}</div>
								</div>

								<div className="grid grid-cols-3 gap-1">
									<div className="text-sm font-medium text-muted-foreground">
										Status
									</div>
									<div className="col-span-2">
										{getStatusBadge(selectedRequest.status)}
									</div>
								</div>

								<div className="grid grid-cols-3 gap-1">
									<div className="text-sm font-medium text-muted-foreground">
										Submitted
									</div>
									<div className="col-span-2">
										{new Date(selectedRequest.createdAt).toLocaleString()}
									</div>
								</div>
							</div>

							<div className="border-t pt-4">
								<h4 className="text-sm font-semibold mb-2">Request Timeline</h4>
								<div className="space-y-2">
									<div className="flex items-start gap-2">
										<div className="h-2 w-2 rounded-full bg-green-500 mt-1.5"></div>
										<div>
											<p className="text-sm font-medium">Request Submitted</p>
											<p className="text-xs text-muted-foreground">
												{new Date(selectedRequest.createdAt).toLocaleString()}
											</p>
										</div>
									</div>

									{selectedRequest.status !== "PENDING" && (
										<div className="flex items-start gap-2">
											<div
												className={`h-2 w-2 rounded-full mt-1.5 ${
													selectedRequest.status === "APPROVED"
														? "bg-green-500"
														: "bg-red-500"
												}`}></div>
											<div>
												<p className="text-sm font-medium">
													Request{" "}
													{selectedRequest.status === "APPROVED"
														? "Approved"
														: "Rejected"}
												</p>
												<p className="text-xs text-muted-foreground">
													{new Date(
														(selectedRequest as any)?.updatedAt ||
															selectedRequest.createdAt
													).toLocaleString()}
												</p>
											</div>
										</div>
									)}
								</div>
							</div>
						</div>
					)}

					<DialogFooter className="flex flex-col sm:flex-row gap-2">
						{selectedRequest && selectedRequest.status === "PENDING" && (
							<div className="flex gap-2 w-full sm:w-auto">
								<Button
									variant="outline"
									className="flex-1 sm:flex-initial"
									onClick={() =>
										handleStatusUpdate(selectedRequest.id, "REJECTED")
									}
									disabled={isProcessing}>
									{isProcessing ? (
										<Loader2 className="h-4 w-4 animate-spin mr-2" />
									) : (
										<XCircle className="h-4 w-4 mr-2" />
									)}
									Reject
								</Button>

								<Button
									className="flex-1 sm:flex-initial"
									onClick={() =>
										handleStatusUpdate(selectedRequest.id, "APPROVED")
									}
									disabled={isProcessing}>
									{isProcessing ? (
										<Loader2 className="h-4 w-4 animate-spin mr-2" />
									) : (
										<CheckCircle className="h-4 w-4 mr-2" />
									)}
									Approve
								</Button>
							</div>
						)}

						<Button
							variant="ghost"
							onClick={() => setIsViewDialogOpen(false)}
							className="w-full sm:w-auto">
							Close
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}

// "use client";

// import { useState, useEffect } from "react";
// import { useRouter } from "next/navigation";
// import { Button } from "@/components/ui/button";
// import { useToast } from "@/components/ui/use-toast";
// import {
// 	Table,
// 	TableBody,
// 	TableCell,
// 	TableHead,
// 	TableHeader,
// 	TableRow,
// } from "@/components/ui/table";
// import {
// 	Card,
// 	CardContent,
// 	CardDescription,
// 	CardHeader,
// 	CardTitle,
// } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import {
// 	Dialog,
// 	DialogContent,
// 	DialogDescription,
// 	DialogHeader,
// 	DialogTitle,
// } from "@/components/ui/dialog";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";

// interface MembershipRequest {
// 	id: number;
// 	name: string;
// 	email: string;
// 	phone: string;
// 	etNumber: number;
// 	department: string;
// 	status: string;
// 	createdAt: string;
// }

// export default function MembershipRequestsReviewPage() {
// 	const [requests, setRequests] = useState<MembershipRequest[]>([]);
// 	const [selectedRequest, setSelectedRequest] =
// 		useState<MembershipRequest | null>(null);
// 	const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);
// 	const [memberNumber, setMemberNumber] = useState("");
// 	const router = useRouter();
// 	const { toast } = useToast();

// 	useEffect(() => {
// 		fetchMembershipRequests();
// 	}, []);

// 	const fetchMembershipRequests = async () => {
// 		try {
// 			const response = await fetch("/api/membership/requests");
// 			if (response.ok) {
// 				const data = await response.json();
// 				setRequests(data);
// 			} else {
// 				throw new Error("Failed to fetch membership requests");
// 			}
// 		} catch (error) {
// 			console.error("Error fetching membership requests:", error);
// 			toast({
// 				title: "Error",
// 				description: "Failed to load membership requests. Please try again.",
// 				variant: "destructive",
// 			});
// 		}
// 	};

// 	const handleStatusUpdate = async (id: number, newStatus: string) => {
// 		try {
// 			const response = await fetch(`/api/membership/requests/${id}`, {
// 				method: "PATCH",
// 				headers: {
// 					"Content-Type": "application/json",
// 				},
// 				body: JSON.stringify({ status: newStatus }),
// 			});

// 			if (response.ok) {
// 				toast({
// 					title: "Status updated successfully",
// 					description: `Membership request status updated to ${newStatus}.`,
// 				});
// 				fetchMembershipRequests(); // Refresh the list
// 				if (newStatus === "APPROVED") {
// 					const updatedRequest = requests.find((req) => req.id === id);
// 					if (updatedRequest) {
// 						setSelectedRequest(updatedRequest);
// 						setIsManageDialogOpen(true);
// 					}
// 				}
// 			} else {
// 				throw new Error("Failed to update membership request status");
// 			}
// 		} catch (error) {
// 			console.error("Error updating membership request status:", error);
// 			toast({
// 				title: "Error",
// 				description: "Failed to update status. Please try again.",
// 				variant: "destructive",
// 			});
// 		}
// 	};

// 	const handleCreateMember = async () => {
// 		if (!selectedRequest) return;

// 		try {
// 			const response = await fetch("/api/members", {
// 				method: "POST",
// 				headers: {
// 					"Content-Type": "application/json",
// 				},
// 				body: JSON.stringify({
// 					name: selectedRequest.name,
// 					email: selectedRequest.email,
// 					phone: selectedRequest.phone,
// 					// etNumber: selectedRequest.etNumber,
// 					department: selectedRequest.department,
// 					memberNumber: Number.parseInt(memberNumber),
// 				}),
// 			});

// 			if (response.ok) {
// 				toast({
// 					title: "Member created successfully",
// 					description: "The new member has been added to the system.",
// 				});
// 				setIsManageDialogOpen(false);
// 				fetchMembershipRequests(); // Refresh the list
// 			} else {
// 				throw new Error("Failed to create member");
// 			}
// 		} catch (error) {
// 			console.error("Error creating member:", error);
// 			toast({
// 				title: "Error",
// 				description: "Failed to create member. Please try again.",
// 				variant: "destructive",
// 			});
// 		}
// 	};

// 	const getStatusBadge = (status: string) => {
// 		const statusColors: { [key: string]: string } = {
// 			PENDING: "bg-yellow-500",
// 			APPROVED: "bg-green-500",
// 			REJECTED: "bg-red-500",
// 		};

// 		return (
// 			<Badge className={`${statusColors[status] || "bg-gray-500"}`}>
// 				{status}
// 			</Badge>
// 		);
// 	};

// 	return (
// 		<Card>
// 			<CardHeader>
// 				<CardTitle>Membership Requests Review</CardTitle>
// 				<CardDescription>
// 					Review and manage pending membership requests.
// 				</CardDescription>
// 			</CardHeader>
// 			<CardContent>
// 				<Table>
// 					<TableHeader>
// 						<TableRow>
// 							<TableHead>Name</TableHead>
// 							<TableHead>Email</TableHead>
// 							<TableHead>Phone</TableHead>
// 							{/* <TableHead>ET Number</TableHead> */}
// 							<TableHead>Department</TableHead>
// 							<TableHead>Status</TableHead>
// 							<TableHead>Created At</TableHead>
// 							<TableHead>Actions</TableHead>
// 						</TableRow>
// 					</TableHeader>
// 					<TableBody>
// 						{requests.map((request) => (
// 							<TableRow key={request.id}>
// 								<TableCell>{request.name}</TableCell>
// 								<TableCell>{request.email}</TableCell>
// 								<TableCell>{request.phone}</TableCell>
// 								{/* <TableCell>{request.etNumber}</TableCell> */}
// 								<TableCell>{request.department}</TableCell>
// 								<TableCell>{getStatusBadge(request.status)}</TableCell>
// 								<TableCell>
// 									{new Date(request.createdAt).toLocaleDateString()}
// 								</TableCell>
// 								<TableCell>
// 									{request.status === "PENDING" && (
// 										<>
// 											<Button
// 												onClick={() =>
// 													handleStatusUpdate(request.id, "APPROVED")
// 												}
// 												className="mr-2">
// 												Approve
// 											</Button>
// 											<Button
// 												onClick={() =>
// 													handleStatusUpdate(request.id, "REJECTED")
// 												}
// 												variant="destructive">
// 												Reject
// 											</Button>
// 										</>
// 									)}
// 									{request.status === "APPROVED" && (
// 										<Button
// 											onClick={() => {
// 												setSelectedRequest(request);
// 												setIsManageDialogOpen(true);
// 											}}>
// 											Manage
// 										</Button>
// 									)}
// 								</TableCell>
// 							</TableRow>
// 						))}
// 					</TableBody>
// 				</Table>
// 			</CardContent>

// 			<Dialog open={isManageDialogOpen} onOpenChange={setIsManageDialogOpen}>
// 				<DialogContent>
// 					<DialogHeader>
// 						<DialogTitle>Manage Approved Member</DialogTitle>
// 						<DialogDescription>
// 							Create a new member account for the approved request.
// 						</DialogDescription>
// 					</DialogHeader>
// 					<div className="grid gap-4 py-4">
// 						<div className="grid grid-cols-4 items-center gap-4">
// 							<Label htmlFor="memberNumber" className="text-right">
// 								Member Number
// 							</Label>
// 							<Input
// 								id="memberNumber"
// 								value={memberNumber}
// 								onChange={(e) => setMemberNumber(e.target.value)}
// 								className="col-span-3"
// 							/>
// 						</div>
// 					</div>
// 					<div className="flex justify-end">
// 						<Button onClick={handleCreateMember}>Create Member</Button>
// 					</div>
// 				</DialogContent>
// 			</Dialog>
// 		</Card>
// 	);
// }
