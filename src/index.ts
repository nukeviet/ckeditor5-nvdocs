/**
 * NukeViet NVDocs for CKEditor5
 * @version 5.x
 * @author VINADES.,JSC <contact@vinades.vn>
 * @copyright (C) 2009-2025 VINADES.,JSC. All rights reserved
 * @license GNU/GPL version 2 or any later version
 * @see https://github.com/nukeviet The NukeViet CMS GitHub project
 */

/**
 * @module nviframe
 */

export { default as NVIframe } from './nvdocs.js';
export { default as NVIframeInsert } from './nvdocsinsert.js';
export { default as NVIframeInsertUI } from './nvdocsinsert/nviframeinsertui.js';
export { default as IframeEditing } from './nvdocs/iframeediting.js';
export { default as IframeUtils } from './nvdocsutils.js';

export type { IframeConfig } from './nvdocsconfig.js';
export type { default as InsertIframeCommand } from './nvdocs/insertiframecommand.js';
export type { default as ReplaceIframeSourceCommand } from './nvdocs/replaceiframesourcecommand.js';

import './augmentation.js';
