/**
 * NukeViet NVIframe for CKEditor5
 * @version 4.x
 * @author VINADES.,JSC <contact@vinades.vn>
 * @copyright (C) 2009-2024 VINADES.,JSC. All rights reserved
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
import { first, type GetCallback } from 'ckeditor5';
import type IframeUtils from '../nvdocsutils.js';

/**
 * Chuyển đổi thuộc tính iframe từ model sang view editing và data
 *
 * @param iframeUtils
 * @param attributeKeys
 * @returns
 */
export function downcastIframeAttribute(iframeUtils: IframeUtils, attributeKeys: string[]): (dispatcher: DowncastDispatcher) => void {
	return dispatcher => {
		for (const attributeKey of attributeKeys) {
			dispatcher.on<DowncastAttributeEvent<ModelElement>>(`attribute:${attributeKey}:iframe`, (evt, data, conversionApi) => {
				if (!conversionApi.consumable.consume(data.item, evt.name)) {
					return;
				}

				const viewWriter = conversionApi.writer;
				const element = conversionApi.mapper.toViewElement(data.item)!;
				if (!element) {
					return;
				}

				const divOuter = iframeUtils.findViewOuterIframeElement(element)!;
				//const divInner = iframeUtils.findViewInnerIframeElement(element)!;
				const iframe = iframeUtils.findViewIframeElement(element)!;
				const modelElement = data.item;

				if (data.attributeKey == 'type') {
					if (data.attributeNewValue == 'fixed') {
						// Cố định thì iframe mới có width và height
						viewWriter.setAttribute('width', modelElement.getAttribute('width') || '560', iframe);
						viewWriter.setAttribute('height', modelElement.getAttribute('height') || '315', iframe);

						viewWriter.removeClass('nvck-iframe-responsive', divOuter);
						viewWriter.removeStyle('padding-bottom', divOuter);
					} else {
						viewWriter.addClass('nvck-iframe-responsive', divOuter);

						const paddingBottom = (((modelElement.getAttribute('ratio') as number[])[1] / (modelElement.getAttribute('ratio') as number[])[0]) * 100).toFixed(2);
						viewWriter.setStyle('padding-bottom', `${paddingBottom}%`, divOuter);
					}
				}

				if (
					data.attributeKey == 'ratio' || data.attributeKey == 'width' ||
					data.attributeKey == 'height' || data.attributeKey == 'type'
				) {
					viewWriter.setAttribute(`data-iframe-${data.attributeKey}`, data.attributeKey == 'ratio' ? (data.attributeNewValue as number[]).join(':') : data.attributeNewValue, divOuter);
					return;
				}

				viewWriter.setAttribute(data.attributeKey, data.attributeNewValue || '', iframe);
			});
		}
	};
}

/**
 * Chuyển đổi cấu trúc thẻ div.nvck-iframe trong view thành model iframe
 */
export function upcastIframeDivStructure(iframeUtils: IframeUtils, editor: Editor): (dispatcher: UpcastDispatcher) => void {
	const converter: GetCallback<UpcastElementEvent> = (evt, data, conversionApi) => {
		const viewDiv = data.viewItem;
		const viewInner = iframeUtils.findViewInnerIframeElement(viewDiv);
		const viewIframe = iframeUtils.findViewIframeElement(viewDiv);

		// Kiểm tra và consume div.nvck-iframe
		if (
			!viewDiv.hasClass('nvck-iframe') ||
			!conversionApi.consumable.consume(viewDiv, { name: true, classes: 'nvck-iframe' }) ||
			!viewInner || !conversionApi.consumable.consume(viewInner, { name: true, classes: 'nvck-iframe-inner' }) ||
			!viewIframe || !conversionApi.consumable.consume(viewIframe, { name: true, classes: 'nvck-iframe-element' })
		) {
			return;
		}

		const { writer: modelWriter } = conversionApi;

		// Tạo model iframe
		const modelBox = modelWriter.createElement('iframe');
		conversionApi.writer.insert(modelBox, data.modelCursor);

		if (viewInner && conversionApi.consumable.test(viewInner, { name: true })) {
			// Consume để ngăn converter khác
			conversionApi.consumable.consume(viewInner, { name: true });

			if (viewIframe && conversionApi.consumable.test(viewIframe, { name: true })) {
				// Consume iframe
				conversionApi.consumable.consume(viewIframe, { name: true });
			}
		}

		// Lấy các attribute của wrapper div
		let width = parseInt(viewDiv.getAttribute('data-iframe-width') || '');
		let height = parseInt(viewDiv.getAttribute('data-iframe-height') || '');
		let type = viewDiv.getAttribute('data-iframe-type') || '';
		let ratio = viewDiv.getAttribute('data-iframe-ratio') || '';
		let url = viewIframe ? (viewIframe.getAttribute('src') || '') : '';

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

		// Các attribute iframe
		const config = editor.config.get('iframe.attributes')!;
		const sandbox = viewIframe.getAttribute('sandbox') || '';
		const allow = viewIframe.getAttribute('allow') || '';
		const referrerPolicy = viewIframe.getAttribute('referrerpolicy') || '';
		const allowFullscreen = viewIframe.getAttribute('allowfullscreen') || '';
		const frameborder = viewIframe.getAttribute('frameborder') || '';
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
 * Upcast thẻ iframe đơn thuần về model iframe
 * Xử lý khi người dùng paste thẻ iframe từ bên ngoài vào
 *
 * @param iframeUtils
 * @param editor
 * @returns
 */
export function upcastPlainIframe(iframeUtils: IframeUtils, editor: Editor): (dispatcher: UpcastDispatcher) => void {
	const converter: GetCallback<UpcastElementEvent> = (evt, data, conversionApi) => {
		const viewIframe = data.viewItem;

		// Đã nằm trong iframe rồi thì không xử lý nữa
		if (iframeUtils.isViewInsideIframe(viewIframe)) {
			return;
		}

		// Consume iframe để không converter khác xử lý
		if (!conversionApi.consumable.consume(viewIframe, { name: true })) {
			return;
		}

		const { writer: modelWriter } = conversionApi;

		// Tạo model wrapper (element: iframe)
		const modelBox = modelWriter.createElement('iframe');
		conversionApi.writer.insert(modelBox, data.modelCursor);

		// Lấy attr từ thẻ iframe gốc
		const src = viewIframe.getAttribute('src') || '';
		let width = parseInt(viewIframe.getAttribute('width') || '');
		let height = parseInt(viewIframe.getAttribute('height') || '');
		if (isNaN(width) || width <= 0 || width > 9999) width = 560;
		if (isNaN(height) || height <= 0 || height > 9999) height = 315;

		const sandbox = viewIframe.getAttribute('sandbox') || '';
		const allow = viewIframe.getAttribute('allow') || '';
		const referrerPolicy = viewIframe.getAttribute('referrerpolicy') || '';
		const allowFullscreen = viewIframe.hasAttribute('allowfullscreen');
		const frameborder = viewIframe.getAttribute('frameborder') || '';

		// Gán attribute vào model
		modelWriter.setAttribute('src', src, modelBox);
		modelWriter.setAttribute('width', width, modelBox);
		modelWriter.setAttribute('height', height, modelBox);
		modelWriter.setAttribute('type', 'auto', modelBox);
		modelWriter.setAttribute('ratio', getScaledRatio(width, height), modelBox);

		// Config mặc định
		const config = editor.config.get('iframe.attributes')!;

		// Đưa các attribute iframe vào
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
