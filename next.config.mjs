/** @type {import('next').NextConfig} */
const nextConfig = {
	eslint: {
		ignoreDuringBuilds: true,
	},
	typescript: {
		ignoreBuildErrors: true,
	},
	images: {
		unoptimized: true,
	},
	experimental: {
		webpackBuildWorker: true,
		parallelServerBuildTraces: true,
		parallelServerCompiles: true,
	},
	rewrites: async () => [
		{
			source: "/api/:path*",
			destination: `http://5.75.243.13:38443/api/:path*`,
		},
	],
};

export default nextConfig;
