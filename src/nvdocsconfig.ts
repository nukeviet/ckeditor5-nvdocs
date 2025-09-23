/**
 * NukeViet NVDocs for CKEditor5
 * @version 5.x
 * @author VINADES.,JSC <contact@vinades.vn>
 * @copyright (C) 2009-2025 VINADES.,JSC. All rights reserved
 * @license GNU/GPL version 2 or any later version
 * @see https://github.com/nukeviet The NukeViet CMS GitHub project
 */

/**
 * ```
 * ClassicEditor
 * 	.create(editorElement, {
 * 		nvdocs: {
 * 			attributes: {
 *              sandbox: 'allow-same-origin allow-scripts',
 *              allow: 'camera; microphone; geolocation',
 *              frameborder: '0',
 *              referrerpolicy: 'no-referrer',
 *              allowfullscreen: true
 * 			},
 * 		}
 * 	})
 * 	.then( ... )
 * 	.catch( ... );
 * ```
 */
export interface NVDocsConfig {
    /*
     *
     */
    browser_url?: string;
}

// export interface NVDocsAttributes extends Record<string, unknown> {
//     sandbox?: string;
//     allow?: string;
//     frameborder?: string;
//     referrerpolicy?: string;
//     allowfullscreen?: boolean;
// }
