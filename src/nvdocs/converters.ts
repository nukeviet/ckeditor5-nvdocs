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
	DowncastAttributeEvent,
	ViewElement
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
				// const divInner = nvdocsUtils.findViewInnerNVDocsElement(element)!;
				const divPrimary = nvdocsUtils.findViewPrimaryNVDocsElement(element)!;
				const modelElement = data.item;

				if (data.attributeKey == 'type') {
					if (data.attributeNewValue == 'fixed') {
						// Cố định mới có width và height
						viewWriter.setAttribute('width', modelElement.getAttribute('width') || '710', divPrimary);
						viewWriter.setAttribute('height', modelElement.getAttribute('height') || '920', divPrimary);

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
					data.attributeKey == 'height' || data.attributeKey == 'type' ||
					data.attributeKey == 'provider'
				) {
					viewWriter.setAttribute(`data-docs-${data.attributeKey}`, data.attributeKey == 'ratio' ? (data.attributeNewValue as number[]).join(':') : data.attributeNewValue, divOuter);
					return;
				}

				// Xử lý src từ dạng thuần sang embed
				if (data.attributeKey == 'src') {
					if (modelElement.getAttribute('provider') == 'google') {
						// Google Docs
						data.attributeNewValue = 'https://docs.google.com/viewer?url=' + encodeURIComponent(data.attributeNewValue as string || '') + '&embedded=true';
					} else {
						// Microsoft Office
						data.attributeNewValue = 'https://view.officeapps.live.com/op/embed.aspx?src=' + encodeURIComponent(data.attributeNewValue as string || '');
					}
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
		let provider = viewDiv.getAttribute('data-docs-provider') || 'google';
		const urlView = viewPrimary ? (viewPrimary.getAttribute('src') || '') : '';
		let url = getOriginalLink(urlView);

		if (isNaN(width) || width <= 0 || width > 9999) {
			width = 710;
		}
		if (isNaN(height) || height <= 0 || height > 9999) {
			height = 920;
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
				ratioArr = [1, 2];
			}
		} else {
			ratioArr = [1, 2];
		}
		if (provider != 'google' && provider != 'microsoft') {
			provider = urlView.includes('//docs.google.com') ? 'google' : 'microsoft';
		}

		modelWriter.setAttribute('src', url, modelBox);
		modelWriter.setAttribute('type', type, modelBox);
		modelWriter.setAttribute('width', width, modelBox);
		modelWriter.setAttribute('height', height, modelBox);
		modelWriter.setAttribute('ratio', ratioArr, modelBox);
		modelWriter.setAttribute('provider', provider, modelBox);

		// Các attribute của view chính
		const config = editor.config.get('iframe.attributes')!;
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
 * Upcast cấu trúc nv-docviewer cũ của ckeditor4 thành model nvdocs
 *
 * @param nvdocsUtils
 * @param editor
 * @returns
 */
export function upcastV4NVDocviewer(nvdocsUtils: NVDocsUtils, editor: Editor): (dispatcher: UpcastDispatcher) => void {
	const converter: GetCallback<UpcastElementEvent> = (evt, data, conversionApi) => {
		const viewDocs = data.viewItem;

		// Nhận biết cấu trúc nv-docviewer
		if (!viewDocs.hasClass('nv-docviewer') || !viewDocs.hasAttribute('data-p')) {
			return;
		}
		const primaryEl = Array.from(viewDocs.getChildren()).find(
			child => child.is('element', 'iframe')
		) as ViewElement | undefined;
		if (!primaryEl) {
			return;
		}

		// Đọc các thông số nếu sai thì bỏ
		const paddingBottom = parseFloat(viewDocs.hasAttribute('data-p') ? viewDocs.getAttribute('data-p') as string : '0');
		if (isNaN(paddingBottom) || paddingBottom < 0 || paddingBottom > 10000) {
			return;
		}
		let width = parseInt(viewDocs.getAttribute('width') || '');
		let height = parseInt(viewDocs.getAttribute('height') || '');
		if (isNaN(width) || width <= 0 || width > 9999) width = 710;
		if (isNaN(height) || height <= 0 || height > 9999) height = 920;
		const viewSrc = primaryEl.getAttribute('src') || '';
		const src = getOriginalLink(viewSrc);
		if (!src) return;
		let ratio: [number, number];
		let typeWidth: 'fixed' | 'auto';
		if (paddingBottom > 0) {
			ratio = findClosestRatio(paddingBottom);
			typeWidth = 'auto';
		} else {
			ratio = getScaledRatio(width, height);
			typeWidth = 'fixed';
		}
		const provider = viewSrc.includes('//docs.google.com') ? 'google' : 'microsoft';

		// Consume để không converter khác xử lý
		if (!conversionApi.consumable.consume(viewDocs, { name: true })) {
			return;
		}
		if (!conversionApi.consumable.consume(primaryEl, { name: true })) {
			return;
		}

		const { writer: modelWriter } = conversionApi;

		// Tạo model wrapper (element: nvdocs)
		const modelBox = modelWriter.createElement('nvdocs');
		conversionApi.writer.insert(modelBox, data.modelCursor);

		// Gán attribute vào model
		modelWriter.setAttribute('src', src, modelBox);
		modelWriter.setAttribute('width', width, modelBox);
		modelWriter.setAttribute('height', height, modelBox);
		modelWriter.setAttribute('type', typeWidth, modelBox);
		modelWriter.setAttribute('ratio', ratio, modelBox);
		modelWriter.setAttribute('provider', provider, modelBox);

		console.log('Upcast v4 nv-docviewer:', { paddingBottom, src, width, height, typeWidth, ratio, provider });

		// Config mặc định
		const config = editor.config.get('iframe.attributes')! as Record<string, string | boolean>;
		for (const [key, val] of Object.entries(config)) {
			modelWriter.setAttribute(key, val, modelBox);
		}

		// Hoàn tất
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

/**
 * Tìm tỷ lệ khung hình gần nhất với paddingBottom
 *
 * @param paddingBottom (tính theo %)
 * @returns
 */
function findClosestRatio(paddingBottom: number): [number, number] {
    const ratio = paddingBottom / 100;
    let best: [number, number] = [1, 1];
    let minDiff = Infinity;

    for (let w = 1; w <= 99; w++) {
        const hFloat = ratio * w;
        const h = Math.round(hFloat);
        if (h >= 1 && h <= 99) {
            const diff = Math.abs((h / w) * 100 - paddingBottom);
            if (diff < minDiff) {
                minDiff = diff;
                best = [w, h];
            }
        }
    }

    return best;
}

/**
 * Tìm link gốc từ link viewer (Google Docs hoặc Microsoft Office)
 *
 * @param viewerUrl
 * @returns
 */
function getOriginalLink(viewerUrl: string): string | '' {
    try {
        const url = new URL(viewerUrl);
        // Google Docs dùng "url", Office dùng "src"
        const embedded = url.searchParams.get("url") || url.searchParams.get("src");
        return embedded ? decodeURIComponent(embedded) : '';
    } catch {
        return '';
    }
}
