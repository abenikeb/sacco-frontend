import { MemberData } from "@/app/models";
import axios from "axios";
import { response } from "express";
import { string } from "prop-types";

export interface LoanApprovalHistoryQuery {
	search?: string;
	status?: "ALL" | "PENDING" | "APPROVED" | "REJECTED";
	fromDate?: string;
	toDate?: string;
	page?: number;
	pageSize?: number;
}

export enum MembershipApproval {
	APPROVED,
	PENDING,
	REJECTED,
}

const API_BASE_URL = "/api";

const api = axios.create({
	baseURL: API_BASE_URL,
	withCredentials: true, // ✅ Important for cookies (session/token)
	headers: {
		"Content-Type": "application/json",
		"Cache-Control": "no-cache, no-store, must-revalidate",
		"Pragma": "no-cache",
		"Expires": "0",
	},
});

// Request Interceptor
api.interceptors.request.use(
	(config) => {
		// Add a timestamp param to bypass caching automatically
		if (config.method?.toUpperCase() === "GET") {
			const separator = config.url?.includes("?") ? "&" : "?";
			config.url = `${config.url}${separator}t=${Date.now()}`;
		}

		// console.log("[API Request]", config.method?.toUpperCase(), config.url);
		return config;
	},
	(error) => {
		console.error("[API Request Error]", error);
		return Promise.reject(error);
	}
);

// Response Interceptor
api.interceptors.response.use(
	(response) => {
		// console.log("[API Response]", response.status, response.config.url);
		return response;
	},
	(error) => {
		const isAuthError = error.response?.status === 401;
		const isBrowser = typeof window !== "undefined";
		const pathname = isBrowser ? window.location.pathname : "";

		const isSafeToRedirect =
			pathname !== "/login" &&
			!pathname.startsWith("/.well-known") &&
			!pathname.match(/\.(js|json|css|map|ico|png|jpg|jpeg)$/);

		console.error("[API Error]", {
			status: error.response?.status,
			url: error.config?.url,
			data: error.response?.data,
		});

		if (isAuthError && isBrowser && isSafeToRedirect) {
			console.warn("[API] Unauthorized - redirecting to login");
			window.location.href = `/login?callbackUrl=${encodeURIComponent(
				pathname
			)}`;
		}

		return Promise.reject(error);
	}
);

//
// ---------- API WRAPPERS ----------
//

export const settingsAPI = {
	// User Management
	getAllUsers: async (page = 1, limit = 20) => {
		const response = await api.get("/settings/users", {
			params: { page, limit },
		});
		return response.data;
	},

	getUserById: async (userId: number) => {
		const response = await api.get(`/settings/users/${userId}`);
		return response.data;
	},

	createUser: async (userData: {
		name: string;
		email: string;
		phone: string;
		password: string;
		role: string;
	}) => {
		const response = await api.post("/settings/users", userData);
		return response.data;
	},

	updateUser: async (
		userId: number,
		userData: {
			name?: string;
			email?: string;
			phone?: string;
			password?: string;
			role?: string;
		}
	) => {
		const response = await api.put(`/settings/users/${userId}`, userData);
		return response.data;
	},

	updateUserRole: async (userId: number, role: string) => {
		const response = await api.put(`/settings/users/${userId}/role`, { role });
		return response.data;
	},

	deleteUser: async (userId: number) => {
		const response = await api.delete(`/settings/users/${userId}`);
		return response.data;
	},

	// Roles & Permissions
	getAllRoles: async () => {
		const response = await api.get("/settings/roles");
		return response.data;
	},

	getRolePermissions: async (role: string) => {
		const response = await api.get(`/settings/roles/${role}/permissions`);
		return response.data;
	},

	// System Configuration
	getSystemConfig: async () => {
		const response = await api.get("/settings/system-config");
		return response.data;
	},
	updateSystemConfig: async (config: Record<string, any>, logoFile?: File) => {
		if (logoFile) {
			// Use FormData for file upload
			const formData = new FormData();

			// Add all config fields to FormData
			Object.keys(config).forEach((key) => {
				if (key !== "organizationLogo") {
					if (Array.isArray(config[key])) {
						formData.append(key, JSON.stringify(config[key]));
					} else {
						formData.append(key, String(config[key]));
					}
				}
			});

			// Add the logo file
			formData.append("logo", logoFile);

			// Create a separate axios instance for this request without JSON content-type
			const response = await axios.put(
				`${API_BASE_URL}/settings/system-config`,
				formData,
				{
					withCredentials: true,
					headers: {
						"Cache-Control": "no-cache, no-store, must-revalidate",
						"Pragma": "no-cache",
						"Expires": "0",
						// Don't set Content-Type, let the browser set it with boundary
					},
				}
			);
			return response.data;
		} else {
			// Use regular JSON for updates without file
			const response = await api.put("/settings/system-config", config);
			return response.data;
		}
	},

	// updateSystemConfig: async (config: Record<string, any>) => {
	// 	const response = await api.put("/settings/system-config", config);
	// 	return response.data;
	// },

	// Audit & Activity
	getAuditLogs: async (page = 1, limit = 50) => {
		const response = await api.get("/settings/audit-logs", {
			params: { page, limit },
		});
		return response.data;
	},

	getUserActivitySummary: async () => {
		const response = await api.get("/settings/user-activity-summary");
		return response.data;
	},
};

export const dashboardAPI = {
	getDashboardData: async () => {
		const response = await api.get("/dashboard");
		return response.data;
	},
};

export const authAPI = {
	login: async (identifier: string, password: string) => {
		const response = await api.post("/auth/login", { identifier, password });
		return { user: response.data.user };
	},

	logout: async () => {
		const response = await api.post("/auth/logout");
		return response.data;
	},

	session: async () => {
		const response = await api.get("/auth/session");
		return response.data;
	},

	signup: async (data: {
		name: string;
		email: string;
		phone: string;
		password: string;
		role?: string;
	}) => {
		const response = await api.post("/auth/register", data);
		return response.data;
	},
	getUserPermissions: async (userId: number) => {
		const response = await api.get(`/permissions/users/${userId}/permissions`);
		return response.data;
	},
};

export const permissionAPI = {
	// Get all permissions
	getAllPermissions: async () => {
		const response = await api.get("/permissions");
		return response.data;
	},

	// Get all roles with permissions
	getAllRolesWithPermissions: async () => {
		const response = await api.get("/permissions/roles");
		return response.data;
	},

	// Get role by ID with permissions
	getRoleWithPermissions: async (roleId: number) => {
		const response = await api.get(`/permissions/roles/${roleId}`);
		return response.data;
	},

	// Create role
	createRole: async (name: string, description?: string) => {
		const response = await api.post("/permissions/roles", {
			name,
			description,
		});
		return response.data;
	},

	// Update role
	updateRole: async (roleId: number, name?: string, description?: string) => {
		const response = await api.put(`/permissions/roles/${roleId}`, {
			name,
			description,
		});
		return response.data;
	},

	// Assign permission to role
	assignPermissionToRole: async (roleId: number, permissionId: number) => {
		const response = await api.post(
			`/permissions/roles/${roleId}/permissions/${permissionId}`
		);
		return response.data;
	},

	// Remove permission from role
	removePermissionFromRole: async (roleId: number, permissionId: number) => {
		const response = await api.delete(
			`/permissions/roles/${roleId}/permissions/${permissionId}`
		);
		return response.data;
	},

	// Get user permissions
	getUserPermissions: async (userId: number) => {
		const response = await api.get(`/permissions/users/${userId}/permissions`);
		return response.data;
	},

	// Check if user has permission
	checkUserPermission: async (
		userId: number,
		resource: string,
		action: string
	) => {
		const response = await api.post(
			`/permissions/users/${userId}/check-permission`,
			{
				resource,
				action,
			}
		);
		return response.data;
	},

	// Assign role to user
	assignRoleToUser: async (userId: number, roleId: number) => {
		const response = await api.post(
			`/permissions/users/${userId}/role/${roleId}`
		);
		return response.data;
	},

	// Initialize default roles and permissions
	initializeDefaultRoles: async () => {
		const response = await api.post("/permissions/initialize");
		return response.data;
	},
};

export const membersAPI = {
	getMember: async (etNumber: string) => {
		const response = await api.get(`/members/${etNumber}`);
		return response.data;
	},

	getCurrentMember: async () => {
		const response = await api.get(`/members/current/user`);
		return response.data;
	},

	getMembersByDate: async (effectiveDate: Date) => {
		const response = await api.get("/members__", {
			params: { effectiveDate: effectiveDate.toISOString() },
		});
		return response.data;
	},

	getMembers: async () => {
		const response = await api.get(`/members__`);
		return response.data;
	},
	// this needs to be checked
	uploadKYC: async (formData: FormData) => {
		const response = await api.post("/member/kyc-upload", formData, {
			headers: {
				"Content-Type": "multipart/form-data",
			},
		});
		return response.data;
	},

	importMembers: async (members: MemberData[]) => {
		const response = await api.post("/members__/import", members, {
			headers: {
				"Content-Type": "application/json",
			},
		});
		return response.data;
	},

	getWillingDeposits: async (userId: number | undefined) => {
		const response = await api.get(
			`/willing-deposit/requests?memberId=${userId}`
		);
		return response.data;
	},

	willingDepositRequest: async (data: {
		amount: number;
		reason: string;
		paymentMethod: string;
		memberId: number | undefined;
	}) => {
		const response = await api.post("/willing-deposit/request", data);
		return response.data;
	},
};

export const membersLoanAPI = {
	apply: async (formData: {
		amount: number;
		interestRate: number;
		tenureMonths: number;
		purpose: string;
		coSigner1?: string;
		loanProductId?: any;
		coSigner2?: string;
		agreement: File;
	}) => {
		const data = new FormData();
		data.append("amount", String(formData.amount));
		data.append("interestRate", String(formData.interestRate));
		data.append("tenureMonths", String(formData.tenureMonths));
		data.append("purpose", formData.purpose);
		if (formData.coSigner1) data.append("coSigner1", formData.coSigner1);
		if (formData.coSigner2) data.append("coSigner2", formData.coSigner2);
		data.append("agreement", formData.agreement);

		const response = await api.post(`/loans/apply`, data, {
			headers: {
				"Content-Type": "multipart/form-data",
			},
		});

		return response.data;
	},

	loanEligibilityReq: async () => {
		const response = await api.get("/members/loan-eligibility");
		return response.data;
	},

	getLoans: async () => {
		const response = await api.get("/members/loans");
		return response.data;
	},

	getLoansById: async (Id: string[] | string) => {
		const response = await api.get(`/members/loans/${Id}`);
		return response.data;
	},

	calculateLoan: async (data: {
		loanAmount: number;
		interestRate: number;
		loanTerm: number;
		repaymentFrequency: "monthly" | "quarterly" | "annually";
	}) => {
		const response = await api.post("/loans/calculate", data);
		return response.data;
	},

	payLoanRepayment: async (
		loanId: string | string[],
		repaymentId: string | number,
		data: {
			amount: number;
			reference?: string;
			sourceType: string;
		}
	) => {
		const response = await api.post(
			`/members/loans/${loanId}/repayments/${repaymentId}/pay`,
			data
		);
		return response.data;
	},
};

export const membersSavingsAPI = {
	getSavingsAndTransactions: async (
		etNumber: string,
		period: string,
		type: string
	) => {
		const response = await api.get(
			`/members/${etNumber}/savings-and-transactions`,
			{ params: { period, type } } // axios handles query strings automatically
		);
		return response.data;
	},
};

//withdrawls
export const withdrawalAPI = {
	getCurrentBalance: async (memberId: any) => {
		const response = await api.get(`/withdrawals/balance/${memberId}`);
		console.log({ balanceWIthdrawl: response });
		return response.data;
	},

	getBalanceHistory: async (memberId: any) => {
		const response = await api.get(`/withdrawals/history/${memberId}`);
		return response.data;
	},

	getPendingWithdrawals: async (userRole: any) => {
		const response = await api.get(`/withdrawals/pending/${userRole}`);
		console.log({ pendingEesponse: response });
		return response.data;
	},
	updateWithdrawalRequest: async ({ url, method, data }: any) => {
		console.log({ url, method, data });
		if (method === "POST") {
			const response = await api.post(url, {
				data,
			});
			return response.data;
		}
		const response = await api.put(url, {
			data,
		});
		return response.data;
	},
};

export const accountingAPI = {
	// Get trial balance
	getTrialBalance: async (asOfDate?: string) => {
		const response = await api.get("/accounting/trial-balance", {
			params: { asOfDate },
		});
		return response.data;
	},

	// Get balance sheet
	getBalanceSheet: async (asOfDate?: string) => {
		const response = await api.get("/accounting/balance-sheet", {
			params: { asOfDate },
		});
		return response.data;
	},

	// Get income statement
	getIncomeStatement: async (fromDate?: string, toDate?: string) => {
		const response = await api.get("/accounting/income-statement", {
			params: { fromDate, toDate },
		});
		return response.data;
	},

	// Get accounting metrics
	getMetrics: async () => {
		const response = await api.get("/accounting/metrics");
		return response.data;
	},

	// Get journal entries
	getJournalEntries: async (
		page = 1,
		limit = 20,
		fromDate?: string,
		toDate?: string
	) => {
		const response = await api.get("/accounting/journal-entries", {
			params: { page, limit, fromDate, toDate },
		});
		return response.data;
	},

	// Get general ledger for an account
	getGeneralLedger: async (
		accountCode: string,
		fromDate?: string,
		toDate?: string
	) => {
		const response = await api.get(
			`/accounting/general-ledger/${accountCode}`,
			{
				params: { fromDate, toDate },
			}
		);
		return response.data;
	},

	// Get account distribution
	getAccountDistribution: async () => {
		const response = await api.get("/accounting/account-distribution");
		return response.data;
	},

	// Get journal entries trend
	getJournalTrend: async () => {
		const response = await api.get("/accounting/journal-trend");
		return response.data;
	},

	// Get account balance
	getAccountBalance: async (code: string, asOfDate?: string) => {
		const response = await api.get(`/accounting/account-balance/${code}`, {
			params: { asOfDate },
		});
		return response.data;
	},

	// Initialize Chart of Accounts
	initializeChartOfAccounts: async () => {
		const response = await api.post("/accounting/initialize-coa");
		return response.data;
	},

	// Get chart of accounts
	getChartOfAccounts: async (isActive?: boolean) => {
		const response = await api.get("/accounting/chart-of-accounts", {
			params: { isActive },
		});
		return response.data;
	},

	// Get general ledger summary
	getGeneralLedgerSummary: async (fromDate?: string, toDate?: string) => {
		const response = await api.get("/accounting/general-ledger-summary", {
			params: { fromDate, toDate },
		});
		return response.data;
	},
};

export const analyticsAPI = {
	getMemberGrowth: async () => {
		const response = await api.get("/analytics/member-growth");
		return response.data;
	},

	getSavingsTrends: async () => {
		const response = await api.get("/analytics/savings-trends");
		return response.data;
	},

	getLoanPerformance: async () => {
		const response = await api.get("/analytics/loan-performance");
		return response.data;
	},

	getDelinquencyReport: async () => {
		const response = await api.get("/analytics/delinquency-report");
		return response.data;
	},

	getFinancialPerformance: async (fromDate?: string, toDate?: string) => {
		const response = await api.get("/analytics/financial-performance", {
			params: { fromDate, toDate },
		});
		return response.data;
	},

	getLoanPortfolioBreakdown: async () => {
		const response = await api.get("/analytics/loan-portfolio-breakdown");
		return response.data;
	},

	getMemberDemographics: async () => {
		const response = await api.get("/analytics/member-demographics");
		return response.data;
	},
};

export const loanAPI = {
	getLoan: async () => {
		const response = await api.get("/loans");
		return response.data;
	},

	getLoanProduct: async () => {
		const response = await api.get("/loan-products");
		return response.data;
	},

	getLoanById: async (id: string[] | string) => {
		let param: number;

		if (typeof id === "string") {
			param = Number.parseInt(id, 10);
		} else {
			// join array into single string, then parse
			param = Number.parseInt(id.join(""), 10);
		}

		const response = await api.get(`/loans/${param}`);
		return response.data;
	},

	getLoanApprovalHistory: async (query: LoanApprovalHistoryQuery = {}) => {
		const response = await api.get("/loans/approval-history", {
			params: query,
		});
		return response.data;
	},

	getPendingLoans: async () => {
		const response = await api.get("/loans/pending");
		return response.data;
	},

	getDisbursedLoan: async () => {
		const response = await api.get("/loans/disbursed");
		console.log({
			disbursedLOan: response,
		});
		return response.data;
	},

	approveLoans: async (id: number, status: string, comment: string) => {
		const response = await api.post(`/loans/approve/${id}`, {
			status,
			comment,
		});
		return response.data;
	},

	autoAssignMemeber: async (totalContributions: any) => {
		const response = await api.post("/loan-products/auto-assign", {
			totalContributions,
		});
		return response.data;
	},

	updateLoanProduct: async ({ url, method, formData }: any) => {
		console.log({ url, method, formData });
		if (method === "POST") {
			const response = await api.post(url, {
				formData,
			});
			return response.data;
		}
		const response = await api.put(url, {
			formData,
		});
		return response.data;
	},

	updateRepaymentStatusUpdate: async (
		amount: number,
		reference: string,
		sourceType: string,
		memberId: number | undefined,
		loanId: string | string[],
		repaymentId: string | number
	) => {
		const response = await api.post(
			`/loans/${loanId}/repayments/${repaymentId}/pay`,
			{
				amount,
				reference,
				sourceType,
				memberId,
			}
		);
		return response.data;
	},
};

export const loanCalculator = {
	getCalculated: async (
		loanAmount: number,
		interestRate: number,
		loanTerm: number,
		repaymentFrequency: "monthly" | "quarterly" | "annually"
	) => {
		const result = await api.post("/loans/calculate", {
			loanAmount,
			interestRate,
			loanTerm,
			repaymentFrequency,
		});
		return result.data;
	},
};

export const loanAgreement = {
	getLoanAgreement: async () => {
		const response = await api.get("/loans/agreement-template", {
			responseType: "blob",
		});
		return response.data;
	},
};

export const loanDocument = {
	getLoanDocumentById: async (documentId: number) => {
		const response = await api.get(`/member/loans/documents/${documentId}`);
		return response.data;
	},

	getLoanDocumentByUrl: async (URL: string) => {
		const response = await api.get(
			`/members/documents/view?url=${encodeURIComponent(URL)}`,
			{
				responseType: "blob",
			}
		);
		return response.data;
	},

	getLoanDocument: async () => {
		const response = await api.get("/members/loans/documents");
		return response.data;
	},
};

export const notificationAPI = {
	getNotifications: async () => {
		const response = await api.get("/notifications");
		console.log({
			response,
		});
		return response.data?.notifications;
	},
	updateNotifications: async (id: number, status: string) => {
		const response = await api.patch(`/notifications/${id}/read`, { status });
		console.log({
			response,
		});
		return response.data;
	},
};

export const membershipAPI = {
	getMembershipRequests: async () => {
		const response = await api.get("/membership/requests");
		return response.data;
	},

	getMembershipRequestById: async (id: number, status: string) => {
		const response = await api.patch(`/membership/requests/${id}`, { status });
		return response.data;
	},

	membershipRequest: async (data: FormData) => {
		const response = await api.post("/membership/request", data, {
			headers: { "Content-Type": "multipart/form-data" },
		});
		return response.data;
	},
};

export default api;
