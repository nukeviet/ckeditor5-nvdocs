/**
 * NukeViet NVDocs for CKEditor5
 * @version 5.x
 * @author VINADES.,JSC <contact@vinades.vn>
 * @copyright (C) 2009-2025 VINADES.,JSC. All rights reserved
 * @license GNU/GPL version 2 or any later version
 * @see https://github.com/nukeviet The NukeViet CMS GitHub project
 */

import { Command, type Editor } from 'ckeditor5';
import { toArray, logWarning } from 'ckeditor5';
import NVDocsUtils from '../nvdocsutils.js';
import { type NVDocsExecuteCommandOptions, getDefaultNVDocsExecuteCommandOptions } from './nvdocsexecuteoptions.js';

export default class InsertNVDocsCommand extends Command {
    declare public value: string | undefined;

    /**
     * @inheritDoc
     */
    constructor(editor: Editor) {
        super(editor);
    }

    /**
     * @inheritDoc
     */
    public override refresh(): void {
        const nvDocsUtils: NVDocsUtils = this.editor.plugins.get('NVDocsUtils');
        this.isEnabled = nvDocsUtils.isNVDocsAllowed();
    }

    /**
	 * Thực thi lệnh chèn nvdocs.
	 */
    public override execute(options: string | NVDocsExecuteCommandOptions): void {
        if (typeof options === 'string') {
            const opts = getDefaultNVDocsExecuteCommandOptions();
            opts.src = options;
            options = opts;
        } else {
            options = { ...getDefaultNVDocsExecuteCommandOptions(), ...options };
        }
        const nvDocsUtils: NVDocsUtils = this.editor.plugins.get('NVDocsUtils');
        if (!nvDocsUtils.isUrl(options.src)) {
            logWarning('NVDocs.url is not a valid URL', options);
            return;
        }

        const selection = this.editor.model.document.selection;
        const selectionAttributes = Object.fromEntries(selection.getAttributes());
        const config = this.editor.config.get('nvdocs.attributes')!;
        nvDocsUtils.insertNVDocs({ ...config, ...options, ...selectionAttributes });
    }
}
