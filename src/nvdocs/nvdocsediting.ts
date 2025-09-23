/**
 * NukeViet NVIframe for CKEditor5
 * @version 4.x
 * @author VINADES.,JSC <contact@vinades.vn>
 * @copyright (C) 2009-2024 VINADES.,JSC. All rights reserved
 * @license GNU/GPL version 2 or any later version
 * @see https://github.com/nukeviet The NukeViet CMS GitHub project
 */

/* globals window */

import { Plugin } from 'ckeditor5';
import InsertIframeCommand from './insertnvdocscommand.js';
import ReplaceIframeSourceCommand from './replacenvdocssourcecommand.js';
import NVDocsUtils from '../nvdocsutils.js';
import { createIframeViewElement } from './utils.js';
import { downcastIframeAttribute, upcastIframeDivStructure, upcastPlainIframe } from './converters.js';

export default class IframeEditing extends Plugin {
	/**
	 * @inheritDoc
	 */
	public static get pluginName() {
		return 'IframeEditing' as const;
	}

	/**
	 * @inheritDoc
	 */
	public init(): void {
		const editor = this.editor;
		const schema = editor.model.schema;

		schema.register('iframe', {
			inheritAllFrom: '$blockObject',
			allowAttributes: [
				'allow', 'allowfullscreen', 'height',
				'referrerpolicy', 'sandbox', 'src', 'srcdoc',
				'width', 'type', 'ratio'
			]
		});

		editor.commands.add('insertIframe', new InsertIframeCommand(editor));
		editor.commands.add('replaceIframeSource', new ReplaceIframeSourceCommand(editor));

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

		// Model => cấu trúc div.nvck-iframe cho .getData() - submit form
		conversion.for('dataDowncast')
			.elementToStructure({
				model: 'iframe',
				view: (modelElement, { writer }) => createIframeViewElement(writer)
			});

		// Model => cấu trúc div.nvck-iframe cho editing view - hiển thị trong trình soạn thảo
		conversion.for('editingDowncast')
			.elementToStructure({
				model: 'iframe',
				view: (modelElement, { writer }) => nvDocsUtils.toIframeWidget(
					createIframeViewElement(writer), writer, t('Iframe widget')
				)
			});

		// Model => attribute cho cả data và editing
		conversion.for('downcast').add(downcastIframeAttribute(nvDocsUtils, [
			'src', 'width', 'height', 'allow',
			'allowfullscreen', 'referrerpolicy',
			'sandbox', 'srcdoc', 'type', 'ratio'
		]));

		// div.nvck-iframe => model (sau đó để hiển thị ra lại dùng editingDowncast + downcast)
		conversion.for('upcast')
			.add(upcastIframeDivStructure(nvDocsUtils, editor)) // Upcast cấu trúc div.nvck-iframe
			.add(upcastPlainIframe(nvDocsUtils, editor)); // Upcast thẻ iframe đơn thuần về cấu trúc div.nvck-iframe
	}
}
