module.exports = {
	globDirectory: ".",
	globPatterns: [
	  "**/*.{html,js,css,png,jpg,jpeg,svg,mp3,woff2,woff}"
	],
	swDest: "sw.js",
	clientsClaim: true,
	skipWaiting: true,
	runtimeCaching: [
	  // Fallback to index.html for navigation (offline SPA support)
	  {
		urlPattern: ({ request }) => request.mode === 'navigate',
		handler: "NetworkFirst",
		options: {
		  cacheName: "html-pages",
		  networkTimeoutSeconds: 3,
		  expiration: {
			maxEntries: 10
		  },
		  cacheableResponse: {
			statuses: [0, 200]
		  }
		}
	  },
  
	  // Cache assets (images, audio, fonts, etc.)
	  {
		urlPattern: /\.(?:html|png|jpg|jpeg|svg|mp3|woff2|woff|css|js)$/,
		handler: "CacheFirst",
		options: {
		  cacheName: "static-assets",
		  expiration: {
			maxEntries: 100,
			maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
		  },
		  cacheableResponse: {
			statuses: [0, 200]
		  }
		}
	  }
	]
  };
  