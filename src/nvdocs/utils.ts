/**
 * NukeViet NVDocs for CKEditor5
 * @version 5.x
 * @author VINADES.,JSC <contact@vinades.vn>
 * @copyright (C) 2009-2025 VINADES.,JSC. All rights reserved
 * @license GNU/GPL version 2 or any later version
 * @see https://github.com/nukeviet The NukeViet CMS GitHub project
 */

import type {
	ViewContainerElement,
	ViewDowncastWriter
} from 'ckeditor5';

/**
 * Tạo phần tử view cho model nvdocs
 *
 * @param writer ViewDowncastWriter
 * @returns
 */
export function createNVDocsViewElement(writer: ViewDowncastWriter): ViewContainerElement {
	return writer.createContainerElement('div', { class: 'nvck-docs' }, [
		writer.createContainerElement('div', { class: 'nvck-docs-inner' }, [
			writer.createEmptyElement('iframe', { class: 'nvck-docs-element' })
		])
	]);
}
