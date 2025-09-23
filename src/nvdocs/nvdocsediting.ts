/**
 * NukeViet NVDocs for CKEditor5
 * @version 5.x
 * @author VINADES.,JSC <contact@vinades.vn>
 * @copyright (C) 2009-2025 VINADES.,JSC. All rights reserved
 * @license GNU/GPL version 2 or any later version
 * @see https://github.com/nukeviet The NukeViet CMS GitHub project
 */

/* globals window */

import { Plugin } from 'ckeditor5';
import InsertNVDocsCommand from './insertnvdocscommand.js';
import ReplaceNVDocsSourceCommand from './replacenvdocssourcecommand.js';
import NVDocsUtils from '../nvdocsutils.js';
import { createNVDocsViewElement } from './utils.js';
import { downcastNVDocsAttribute, upcastNVDocsDivStructure, upcastPlainHtmlCode } from './converters.js';

export default class NVDocsEditing extends Plugin {
	/**
	 * @inheritDoc
	 */
	public static get pluginName() {
		return 'NVDocsEditing' as const;
	}

	/**
	 * @inheritDoc
	 */
	public init(): void {
		const editor = this.editor;
		const schema = editor.model.schema;

		schema.register('nvdocs', {
			inheritAllFrom: '$blockObject',
			allowAttributes: [
				'allow', 'allowfullscreen', 'height',
				'referrerpolicy', 'sandbox', 'src', 'srcdoc',
				'width', 'type', 'ratio'
			]
		});

		editor.commands.add('insertNVDocs', new InsertNVDocsCommand(editor));
		editor.commands.add('replaceNVDocsSource', new ReplaceNVDocsSourceCommand(editor));

		this._setupConversion();
	}

	/**
	 * Thiết lập bộ chuyển đổi
	 */
	private _setupConversion(): void {
		const editor = this.editor;
		const t = editor.t;
		const conversion = editor.conversion;
		const nvDocsUtils: NVDocsUtils = this.editor.plugins.get('NVDocsUtils');

		// Model => cấu trúc div.nvck-docs cho .getData() - submit form
		conversion.for('dataDowncast')
			.elementToStructure({
				model: 'nvdocs',
				view: (modelElement, { writer }) => createNVDocsViewElement(writer)
			});

		// Model => cấu trúc div.nvck-docs cho editing view - hiển thị trong trình soạn thảo
		conversion.for('editingDowncast')
			.elementToStructure({
				model: 'nvdocs',
				view: (modelElement, { writer }) => nvDocsUtils.toNVDocsWidget(
					createNVDocsViewElement(writer), writer, t('NVDocs widget')
				)
			});

		// Model => attribute cho cả data và editing
		conversion.for('downcast').add(downcastNVDocsAttribute(nvDocsUtils, [
			'src', 'width', 'height', 'allow',
			'allowfullscreen', 'referrerpolicy',
			'sandbox', 'srcdoc', 'type', 'ratio'
		]));

		// div.nvck-docs => model (sau đó để hiển thị ra lại dùng editingDowncast + downcast)
		conversion.for('upcast')
			.add(upcastNVDocsDivStructure(nvDocsUtils, editor)) // Upcast cấu trúc div.nvck-docs
			.add(upcastPlainHtmlCode(nvDocsUtils, editor)); // Upcast thẻ html đơn thuần về cấu trúc div.nvck-docs
	}
}
