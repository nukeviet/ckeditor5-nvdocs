/**
 * NukeViet NVIframe for CKEditor5
 * @version 5.x
 * @author VINADES.,JSC <contact@vinades.vn>
 * @copyright (C) 2009-2025 VINADES.,JSC. All rights reserved
 * @license GNU/GPL version 2 or any later version
 * @see https://github.com/nukeviet The NukeViet CMS GitHub project
 */

import { Plugin } from 'ckeditor5';
import NVIframeInsertUI from './nvdocsinsert/nviframeinsertui.js';

export default class NVIframeInsert extends Plugin {
    /**
     * @inheritDoc
     */
    static get pluginName() {
        return 'NVIframeInsert' as const;
    }

    /**
     * @inheritDoc
     */
    static get requires() {
        return [NVIframeInsertUI] as const;
    }
}
