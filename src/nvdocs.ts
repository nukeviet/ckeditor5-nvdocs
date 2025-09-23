/**
 * NukeViet NVDocs for CKEditor5
 * @version 5.x
 * @author VINADES.,JSC <contact@vinades.vn>
 * @copyright (C) 2009-2025 VINADES.,JSC. All rights reserved
 * @license GNU/GPL version 2 or any later version
 * @see https://github.com/nukeviet The NukeViet CMS GitHub project
 */

import { Plugin } from 'ckeditor5';
import NVDocsEditing from './nvdocs/nvdocsediting.js';
import NVDocsInsertUI from './nvdocsinsert/nvdocsinsertui.js';

import '../theme/nvdocs.css';

export default class NVDocs extends Plugin {
    /**
     * @inheritDoc
     */
    static get pluginName() {
        return 'NVDocs' as const;
    }

    /**
     * @inheritDoc
     */
    static get requires() {
        return [NVDocsEditing, NVDocsInsertUI] as const;
    }
}
