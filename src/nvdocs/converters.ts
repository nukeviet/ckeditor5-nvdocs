/**
 * NukeViet NVDocs for CKEditor5
 * @version 5.x
 * @author VINADES.,JSC <contact@vinades.vn>
 * @copyright (C) 2009-2025 VINADES.,JSC. All rights reserved
 * @license GNU/GPL version 2 or any later version
 * @see https://github.com/nukeviet The NukeViet CMS GitHub project
 */

import type {
	DowncastDispatcher,
	ModelElement,
	Editor,
	UpcastDispatcher,
	UpcastElementEvent,
	DowncastAttributeEvent
} from 'ckeditor5';
import { type GetCallback } from 'ckeditor5';
import type NVDocsUtils from '../nvdocsutils.js';

/**
 * Chuyển đổi thuộc tính nvdocs từ model sang view editing và data
 *
 * @param nvdocsUtils
 * @param attributeKeys
 * @returns
 */
export function downcastNVDocsAttribute(nvdocsUtils: NVDocsUtils, attributeKeys: string[]): (dispatcher: DowncastDispatcher) => void {
	return dispatcher => {
		for (const attributeKey of attributeKeys) {
			dispatcher.on<DowncastAttributeEvent<ModelElement>>(`attribute:${attributeKey}:nvdocs`, (evt, data, conversionApi) => {
				if (!conversionApi.consumable.consume(data.item, evt.name)) {
					return;
				}

				const viewWriter = conversionApi.writer;
				const element = conversionApi.mapper.toViewElement(data.item)!;
				if (!element) {
					return;
				}

				const divOuter = nvdocsUtils.findViewOuterNVDocsElement(element)!;
				//const divInner = nvdocsUtils.findViewInnerNVDocsElement(element)!;
				const divPrimary = nvdocsUtils.findViewPrimaryNVDocsElement(element)!;
				const modelElement = data.item;

				if (data.attributeKey == 'type') {
					if (data.attributeNewValue == 'fixed') {
						// Cố định mới có width và height
						viewWriter.setAttribute('width', modelElement.getAttribute('width') || '560', divPrimary);
						viewWriter.setAttribute('height', modelElement.getAttribute('height') || '315', divPrimary);

						viewWriter.removeClass('nvck-docs-responsive', divOuter);
						viewWriter.removeStyle('padding-bottom', divOuter);
					} else {
						viewWriter.addClass('nvck-docs-responsive', divOuter);

						const paddingBottom = (((modelElement.getAttribute('ratio') as number[])[1] / (modelElement.getAttribute('ratio') as number[])[0]) * 100).toFixed(2);
						viewWriter.setStyle('padding-bottom', `${paddingBottom}%`, divOuter);
					}
				}

				if (
					data.attributeKey == 'ratio' || data.attributeKey == 'width' ||
					data.attributeKey == 'height' || data.attributeKey == 'type'
				) {
					viewWriter.setAttribute(`data-docs-${data.attributeKey}`, data.attributeKey == 'ratio' ? (data.attributeNewValue as number[]).join(':') : data.attributeNewValue, divOuter);
					return;
				}

				viewWriter.setAttribute(data.attributeKey, data.attributeNewValue || '', divPrimary);
			});
		}
	};
}

/**
 * Chuyển đổi cấu trúc thẻ div.nvck-docs chuẩn trong view thành model nvdocs
 */
export function upcastNVDocsDivStructure(nvdocsUtils: NVDocsUtils, editor: Editor): (dispatcher: UpcastDispatcher) => void {
	const converter: GetCallback<UpcastElementEvent> = (evt, data, conversionApi) => {
		const viewDiv = data.viewItem;
		const viewInner = nvdocsUtils.findViewInnerNVDocsElement(viewDiv);
		const viewPrimary = nvdocsUtils.findViewPrimaryNVDocsElement(viewDiv);

		// Kiểm tra và consume div.nvck-docs
		if (
			!viewDiv.hasClass('nvck-docs') ||
			!conversionApi.consumable.consume(viewDiv, { name: true, classes: 'nvck-docs' }) ||
			!viewInner || !conversionApi.consumable.consume(viewInner, { name: true, classes: 'nvck-docs-inner' }) ||
			!viewPrimary || !conversionApi.consumable.consume(viewPrimary, { name: true, classes: 'nvck-docs-element' })
		) {
			return;
		}

		const { writer: modelWriter } = conversionApi;

		// Tạo model nvdocs
		const modelBox = modelWriter.createElement('nvdocs');
		conversionApi.writer.insert(modelBox, data.modelCursor);

		if (viewInner && conversionApi.consumable.test(viewInner, { name: true })) {
			// Consume để ngăn converter khác
			conversionApi.consumable.consume(viewInner, { name: true });

			if (viewPrimary && conversionApi.consumable.test(viewPrimary, { name: true })) {
				// Consume thẻ view chính
				conversionApi.consumable.consume(viewPrimary, { name: true });
			}
		}

		// Lấy các attribute của wrapper div
		let width = parseInt(viewDiv.getAttribute('data-docs-width') || '');
		let height = parseInt(viewDiv.getAttribute('data-docs-height') || '');
		let type = viewDiv.getAttribute('data-docs-type') || '';
		let ratio = viewDiv.getAttribute('data-docs-ratio') || '';
		let url = viewPrimary ? (viewPrimary.getAttribute('src') || '') : '';

		if (isNaN(width) || width <= 0 || width > 9999) {
			width = 560;
		}
		if (isNaN(height) || height <= 0 || height > 9999) {
			height = 315;
		}
		if (type != 'fixed' && type != 'auto') {
			type = 'auto';
		}
		let ratioArr: [number, number];
		const match = ratio.match(/^(\d+):(\d+)$/);
		if (match) {
			const x = parseInt(match[1], 10);
			const y = parseInt(match[2], 10);

			// Kiểm tra > 0
			if (x > 0 && y > 0) {
				ratioArr = [x, y];
			} else {
				ratioArr = [16, 9];
			}
		} else {
			ratioArr = [16, 9];
		}

		modelWriter.setAttribute('src', url, modelBox);
		modelWriter.setAttribute('type', type, modelBox);
		modelWriter.setAttribute('width', width, modelBox);
		modelWriter.setAttribute('height', height, modelBox);
		modelWriter.setAttribute('ratio', ratioArr, modelBox);

		// Các attribute của view chính
		const config = editor.config.get('nvdocs.attributes')!;
		const sandbox = viewPrimary.getAttribute('sandbox') || '';
		const allow = viewPrimary.getAttribute('allow') || '';
		const referrerPolicy = viewPrimary.getAttribute('referrerpolicy') || '';
		const allowFullscreen = viewPrimary.getAttribute('allowfullscreen') || '';
		const frameborder = viewPrimary.getAttribute('frameborder') || '';
		// if (sandbox) config.sandbox = sandbox;
		// if (allow) config.allow = allow;
		// if (referrerPolicy) config.referrerpolicy = referrerPolicy;
		// if (allowFullscreen) config.allowfullscreen = (allowFullscreen == 'true' || allowFullscreen == '1') ? true : false;
		// if (frameborder) config.frameborder = frameborder;
		for (const [key, val] of Object.entries(config)) {
			modelWriter.setAttribute(key, val, modelBox);
		}

		data.modelRange = modelWriter.createRangeOn(modelBox);
		data.modelCursor = data.modelRange.end;

		conversionApi.convertChildren(data.viewItem, modelBox);
		conversionApi.updateConversionResult(modelBox, data);
	};

	return dispatcher => {
		dispatcher.on<UpcastElementEvent>('element:div', converter);
	};
}

/**
 * Upcast thẻ chèn đơn thuần về model nvdocs
 * Xử lý khi người dùng paste đoạn mã chèn từ các nguồn từ bên ngoài vào
 *
 * @param nvdocsUtils
 * @param editor
 * @returns
 */
export function upcastPlainHtmlCode(nvdocsUtils: NVDocsUtils, editor: Editor): (dispatcher: UpcastDispatcher) => void {
	const converter: GetCallback<UpcastElementEvent> = (evt, data, conversionApi) => {
		const viewDocs = data.viewItem;

		// Đã nằm trong nvdocs rồi thì không xử lý nữa
		if (nvdocsUtils.isViewInsideNVDocs(viewDocs)) {
			return;
		}

		// Consume để không converter khác xử lý
		if (!conversionApi.consumable.consume(viewDocs, { name: true })) {
			return;
		}

		const { writer: modelWriter } = conversionApi;

		// Tạo model wrapper (element: nvdocs)
		const modelBox = modelWriter.createElement('nvdocs');
		conversionApi.writer.insert(modelBox, data.modelCursor);

		// Lấy attr từ thẻ html gốc
		const src = viewDocs.getAttribute('src') || '';
		let width = parseInt(viewDocs.getAttribute('width') || '');
		let height = parseInt(viewDocs.getAttribute('height') || '');
		if (isNaN(width) || width <= 0 || width > 9999) width = 560;
		if (isNaN(height) || height <= 0 || height > 9999) height = 315;

		const sandbox = viewDocs.getAttribute('sandbox') || '';
		const allow = viewDocs.getAttribute('allow') || '';
		const referrerPolicy = viewDocs.getAttribute('referrerpolicy') || '';
		const allowFullscreen = viewDocs.hasAttribute('allowfullscreen');
		const frameborder = viewDocs.getAttribute('frameborder') || '';

		// Gán attribute vào model
		modelWriter.setAttribute('src', src, modelBox);
		modelWriter.setAttribute('width', width, modelBox);
		modelWriter.setAttribute('height', height, modelBox);
		modelWriter.setAttribute('type', 'auto', modelBox);
		modelWriter.setAttribute('ratio', getScaledRatio(width, height), modelBox);

		// Config mặc định
		const config = editor.config.get('nvdocs.attributes')!;

		// Đưa các attribute vào
		// if (sandbox) config.sandbox = sandbox;
		// if (allow) config.allow = allow;
		// if (referrerPolicy) config.referrerpolicy = referrerPolicy;
		// if (allowFullscreen) config.allowfullscreen = true;
		// if (frameborder) config.frameborder = frameborder;
		for (const [key, val] of Object.entries(config)) {
			modelWriter.setAttribute(key, val, modelBox);
		}

		// Hoàn tất
		data.modelRange = modelWriter.createRangeOn(modelBox);
		data.modelCursor = data.modelRange.end;

		// Không có inner div hay children nên không cần convertChildren
		conversionApi.updateConversionResult(modelBox, data);
	};

    return dispatcher => {
        dispatcher.on<UpcastElementEvent>('element:iframe', converter);
    };
}

/**
 * Lấy tỷ lệ khung hình đã được rút gọn và tối đa mỗi chiều không quá 99
 *
 * @param width
 * @param height
 * @returns
 */
function getScaledRatio(width: number, height: number): [number, number] {
    // Tìm ước chung lớn nhất (Euclid)
    function gcd(a: number, b: number): number {
        return b === 0 ? a : gcd(b, a % b);
    }

    let x = width;
    let y = height;

    const g = gcd(x, y);
    x = Math.round(x / g);
    y = Math.round(y / g);

    const MAX = 99;
    const maxVal = Math.max(x, y);

    if (maxVal > MAX) {
        const scale = MAX / maxVal;
        x = Math.round(x * scale);
        y = Math.round(y * scale);
        // Đảm bảo không về 0
        x = Math.max(x, 1);
        y = Math.max(y, 1);
    }

    return [x, y];
}
