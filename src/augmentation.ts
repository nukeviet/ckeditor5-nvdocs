/**
 * NukeViet NVDocs for CKEditor5
 * @version 5.x
 * @author VINADES.,JSC <contact@vinades.vn>
 * @copyright (C) 2009-2025 VINADES.,JSC. All rights reserved
 * @license GNU/GPL version 2 or any later version
 * @see https://github.com/nukeviet The NukeViet CMS GitHub project
 */

import type {
	NVDocs,
	NVDocsInsert,
	NVDocsInsertUI,
	InsertNVDocsCommand,
	ReplaceNVDocsSourceCommand,
	NVDocsConfig,
	NVDocsEditing,
	NVDocsUtils
} from './index.js';

declare module '@ckeditor/ckeditor5-core' {
	interface EditorConfig {
		/**
		 *
		 */
		nvdocs?: NVDocsConfig;
	}

	// Khai báo các plugin
	interface PluginsMap {
		[NVDocs.pluginName]: NVDocs;
		[NVDocsInsert.pluginName]: NVDocsInsert;
		[NVDocsInsertUI.pluginName]: NVDocsInsertUI;
		[NVDocsUtils.pluginName]: NVDocsUtils;
		[NVDocsEditing.pluginName]: NVDocsEditing;
	}

	// Khai báo các command
	interface CommandsMap {
		insertNVDocs: InsertNVDocsCommand;
		replaceNVDocsSource: ReplaceNVDocsSourceCommand;
	}
}
