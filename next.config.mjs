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
			destination: `http://localhost:3000/api/:path*`,
		},
		{
			source: "/api-v1/:path*",
			destination: `http://localhost:3000/api-v1/:path*`,
		},
	],
};

export default nextConfig;
