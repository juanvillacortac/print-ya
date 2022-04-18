import type { GetSession, Handle } from '@sveltejs/kit';
 
const minification_options = {
  collapseBooleanAttributes: true,
  collapseWhitespace: true,
  conservativeCollapse: true,
  decodeEntities: true,
  html5: true,
  ignoreCustomComments: [/^#/],
  minifyCSS: true,
  minifyJS: false,
  removeAttributeQuotes: true,
  removeComments: true,
  removeOptionalTags: true,
  removeRedundantAttributes: true,
  removeScriptTypeAttributes: true,
  removeStyleLinkTypeAttributes: true,
  sortAttributes: true,
  sortClassName: true
};

export const getSession: GetSession = (event) => ({ userAgent: event.request.headers.get('user-agent'), host: event.url.protocol + '//' + event.url.host })

export const handle: Handle = async ({ event, resolve }) => {
	const response = await resolve(event)

	response.headers['Cache-Control'] = `public, s-maxage=1, stale-while-revalidate=59`

	// if (prerendering && response.headers.get('content-type') === 'text/html') {
  //   return new Response(minify(await response.text(), minification_options), {
  //     status: response.status,
  //     headers: response.headers
  //   });
  // }

	return response
};
