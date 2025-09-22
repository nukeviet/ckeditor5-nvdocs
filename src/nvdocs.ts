/**
 * NukeViet NVIframe for CKEditor5
 * @version 5.x
 * @author VINADES.,JSC <contact@vinades.vn>
 * @copyright (C) 2009-2025 VINADES.,JSC. All rights reserved
 * @license GNU/GPL version 2 or any later version
 * @see https://github.com/nukeviet The NukeViet CMS GitHub project
 */

import { Plugin } from 'ckeditor5';
import IframeEditing from './nvdocs/iframeediting.js';
import NVIframeInsertUI from './nvdocsinsert/nviframeinsertui.js';

import '../theme/iframe.css';

export default class NVIframe extends Plugin {
    /**
     * @inheritDoc
     */
    static get pluginName() {
        return 'NVIframe' as const;
    }

    /**
     * @inheritDoc
     */
    static get requires() {
        return [IframeEditing, NVIframeInsertUI] as const;
    }
}
