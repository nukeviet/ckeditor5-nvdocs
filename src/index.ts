/**
 * NukeViet NVDocs for CKEditor5
 * @version 5.x
 * @author VINADES.,JSC <contact@vinades.vn>
 * @copyright (C) 2009-2025 VINADES.,JSC. All rights reserved
 * @license GNU/GPL version 2 or any later version
 * @see https://github.com/nukeviet The NukeViet CMS GitHub project
 */

/**
 * @module nvdocs
 */

export { default as NVDocs } from './nvdocs.js';
export { default as NVDocsInsert } from './nvdocsinsert.js';
export { default as NVDocsInsertUI } from './nvdocsinsert/nvdocsinsertui.js';
export { default as NVDocsEditing } from './nvdocs/nvdocsediting.js';
export { default as NVDocsUtils } from './nvdocsutils.js';

export type { NVDocsConfig } from './nvdocsconfig.js';
export type { default as InsertNVDocsCommand } from './nvdocs/insertnvdocscommand.js';
export type { default as ReplaceNVDocsSourceCommand } from './nvdocs/replacenvdocssourcecommand.js';

import './augmentation.js';
