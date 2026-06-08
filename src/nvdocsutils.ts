/**
 * NukeViet NVDocs for CKEditor5
 * @version 5.x
 * @author VINADES.,JSC <contact@vinades.vn>
 * @copyright (C) 2009-2025 VINADES.,JSC. All rights reserved
 * @license GNU/GPL version 2 or any later version
 * @see https://github.com/nukeviet The NukeViet CMS GitHub project
 */

import {
	type ModelElement,
	type ViewElement,
	type ModelDocumentSelection,
	type ModelSelection,
	type ModelDocumentFragment,
	type ViewDowncastWriter,
	type Model,
	type ModelPosition,
	findOptimalInsertionRange,
	toWidget,
	Plugin,
	type Editor
} from 'ckeditor5';

export default class NVDocsUtils extends Plugin {
	/**
     * @inheritDoc
     */
	public static get pluginName() {
		return 'NVDocsUtils' as const;
	}

	/**
     *
     */
	public insertNVDocs(
		attributes: Record<string, unknown> = {},
		selectable: ModelSelection | ModelPosition | null = null
	): ModelElement | null {
		const editor = this.editor;
		const model = editor.model;
		const selection = model.document.selection;

		if ( !attributes.src ) {
			return null;
		}

		// Gộp các thuộc tính về làm 1
		attributes = {
			...Object.fromEntries( selection.getAttributes() ),
			...attributes
		};

		// Xóa các attr nếu không được phép trong schema
		for ( const attributeName in attributes ) {
			if ( !model.schema.checkAttribute( 'nvdocs', attributeName ) ) {
				delete attributes[ attributeName ];
			}
		}

		attributes.src = autoProcessSrc( attributes.src as string );

		// Chèn model vào
		return model.change( writer => {
			const nvdocsElement = writer.createElement( 'nvdocs', attributes );

			model.insertObject( nvdocsElement, selectable, null, {
				setSelection: 'on',
				findOptimalPosition: !selectable ? 'auto' : undefined
			} );

			if ( nvdocsElement.parent ) {
				return nvdocsElement;
			}

			return null;
		} );
	}

	/**
     *
     */
	public toNVDocsWidget( viewElement: ViewElement, writer: ViewDowncastWriter, label: string ): ViewElement {
		writer.setCustomProperty( 'nvdocs', true, viewElement );

		const labelCreator = () => {
			// const imgElement = this.findViewImgElement(viewElement)!;
			// const altText = imgElement.getAttribute('alt');

			// return altText ? `${altText} ${label}` : label;
			return label;
		};

		return toWidget( viewElement, writer, { label: labelCreator } );
	}

	/**
     * Kiểm tra phần tử có phải là nvdocs không
     */
	public isDocs( modelElement?: ModelElement | null ): modelElement is ModelElement & { name: 'nvdocs' } {
		return !!modelElement && modelElement.is( 'element', 'nvdocs' );
	}

	/**
     * Kiểm tra xem nvdocs có thể chèn vào vị trí hiện tại hay không
     *
     * @internal
     */
	public isNVDocsAllowed(): boolean {
		const model = this.editor.model;
		const selection = model.document.selection;

		return isNVDocsAllowedInParent( this.editor, selection ) && isNotInsideNVDocs( selection );
	}

	/**
     * Tìm thẻ hiển thị chính trong cấu trúc html NVDocs
     */
	public findViewPrimaryNVDocsElement( divView: ViewElement ): ViewElement | undefined {
		if ( this.isPrimaryView( divView ) ) {
			return divView;
		}

		const editingView = this.editor.editing.view;

		for ( const { item } of editingView.createRangeIn( divView ) ) {
			if ( this.isPrimaryView( item as ViewElement ) ) {
				return item as ViewElement;
			}
		}
	}

	public findViewOuterNVDocsElement( divView: ViewElement ): ViewElement | undefined {
		if ( divView.is( 'element', 'div' ) && divView.hasClass( 'nvck-docs' ) ) {
			return divView;
		}
	}

	public findViewInnerNVDocsElement( divView: ViewElement ): ViewElement | undefined {
		const editingView = this.editor.editing.view;

		for ( const { item } of editingView.createRangeIn( divView ) ) {
			if ( !!item && item.is( 'element', 'div' ) && item.hasClass( 'nvck-docs-inner' ) ) {
				return item as ViewElement;
			}
		}
	}

	/**
     * Xác định đối tượng ViewElement có phải là thẻ view chính show ra để nhìn không
     */
	public isPrimaryView( element?: ViewElement | null ): boolean {
		return !!element && element.is( 'element', 'iframe' ) && element.hasClass( 'nvck-docs-element' );
	}

	public isBlockNVDocsView( element?: ViewElement | null ): boolean {
		return !!element && element.is( 'element', 'div' ) && element.hasClass( 'nvck-docs' );
	}

	/**
     * Kiểm tra URL hợp lệ hay không
     *
     * @param url URL cần kiểm tra
     * @returns
     */
	public isUrl( url: string ): boolean {
		if ( url.startsWith( '/' ) ) {
			// Url nội bộ
			return true;
		}
		const urlPattern = /^(https?:\/\/[^\s]+)/;
		return urlPattern.test( url );
	}

	/**
     * Kiểm tra xem phần tử view có nằm trong nvdocs hay không
     *
     * @param viewElement Phần tử view cần kiểm tra
     * @returns
     */
	public isViewInsideNVDocs( viewElement: ViewElement ): boolean {
		// Cha cấp 1 (phải là div.nvck-docs-inner)
		const parent1 = viewElement.parent as ViewElement | null;
		if ( !parent1 || !parent1.is( 'element', 'div' ) || !parent1.hasClass( 'nvck-docs-inner' ) ) {
			return false;
		}

		// Cha cấp 2 (phải là div.nvck-docs)
		const parent2 = parent1.parent as ViewElement | null;
		if ( !parent2 || !parent2.is( 'element', 'div' ) || !parent2.hasClass( 'nvck-docs' ) ) {
			return false;
		}

		return true;
	}

	private _getDomain(): string {
		let domain = window.location.origin;
		if ( !domain ) {
			domain = window.location.protocol + '//' + window.location.host;
			if ( window.location.port != '80' && window.location.port != '443' ) {
				domain += ':' + window.location.port;
			}
		}
		return domain;
	}

	/**
     * Chuyển đổi URL tuyệt đối thành URL tương đối
     *
     * @param absoluteUrl URL tuyệt đối
     * @returns URL tương đối
     */
	public toRelativeUrl( absoluteUrl: string ): string {
		const domain = this._getDomain();
		if ( absoluteUrl.indexOf( domain ) == 0 ) {
			absoluteUrl = absoluteUrl.substring( domain.length );
		}
		return absoluteUrl;
	}

	/**
     * Chuyển đổi URL tương đối thành URL tuyệt đối
     *
     * @param relativeUrl URL tương đối
     * @returns URL tuyệt đối
     */
	public toAbsoluteUrl( relativeUrl: string ): string {
		const domain = this._getDomain();
		if ( relativeUrl.indexOf( 'http' ) != 0 && relativeUrl.indexOf( '//' ) != 0 ) {
			if ( relativeUrl.indexOf( '/' ) == 0 ) {
				relativeUrl = domain + relativeUrl;
			} else {
				relativeUrl = domain + '/' + relativeUrl;
			}
		}
		return relativeUrl;
	}
}

/**
 * Kiểm tra xem nvdocs có chèn được trong đối tượng cha đang chọn hay không
 */
function isNVDocsAllowedInParent( editor: Editor, selection: ModelSelection | ModelDocumentSelection ): boolean {
	const parent = getInsertNVdocsParent( selection, editor.model );

	if ( editor.model.schema.checkChild( parent as ModelElement, 'nvdocs' ) ) {
		return true;
	}

	return false;
}

/**
 * Checks if selection is not placed inside an nvdocs (e.g. its caption).
 */
function isNotInsideNVDocs( selection: ModelDocumentSelection ): boolean {
	return [ ...selection.focus!.getAncestors() ].every( ancestor => !ancestor.is( 'element', 'nvdocs' ) );
}

/**
 * Returns a node that will be used to insert image with `model.insertContent`.
 */
function getInsertNVdocsParent( selection: ModelSelection | ModelDocumentSelection, model: Model ): ModelElement | ModelDocumentFragment {
	const insertionRange = findOptimalInsertionRange( selection, model );
	const parent = insertionRange.start.parent;

	if ( parent.isEmpty && !parent.is( 'element', '$root' ) ) {
		return parent.parent!;
	}

	return parent;
}

/**
 * Chuẩn hóa URL video về dạng EMBED
 * (Nếu đã là embed thì giữ nguyên)
 */
function autoProcessSrc( url: string ): string {
	const providers: Array<{
		name: string;
		patterns: Array<RegExp>;
		toEmbed: ( id: string, match: RegExpExecArray ) => string;
	}> = [
		// 🟥 YouTube
		{
			name: 'youtube',
			patterns: [
				// https://www.youtube.com/watch?v=ID
				/(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/i,
				// https://youtu.be/ID
				/(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/i,
				// https://www.youtube.com/shorts/ID
				/(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/i,
				// https://www.youtube.com/embed/ID (đã embed)
				/(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/i
			],
			toEmbed: ( id, match ) => {
				// Nếu match từ /embed/ thì giữ nguyên (coi như đã embed)
				if ( /embed/.test( match[ 0 ] ) ) {
					return url;
				}
				return `https://www.youtube.com/embed/${ id }`;
			}
		},

		// 🟦 Vimeo
		{
			name: 'vimeo',
			patterns: [
				// https://vimeo.com/123456789
				/(?:vimeo\.com\/)(\d+)/i,
				// https://player.vimeo.com/video/123456789
				/(?:player\.vimeo\.com\/video\/)(\d+)/i
			],
			toEmbed: ( id, match ) => {
				if ( /player\.vimeo/.test( match[ 0 ] ) ) {
					return url;
				}
				return `https://player.vimeo.com/video/${ id }`;
			}
		},

		// 🟩 Facebook (public video)
		{
			name: 'facebook',
			patterns: [
				// https://www.facebook.com/.../videos/123456789/
				/facebook\.com\/(?:.+)\/videos\/(\d+)/i,
				// https://fb.watch/abcXYZ/
				/fb\.watch\/([a-zA-Z0-9_-]+)/i
			],
			toEmbed: ( id, match ) => {
				// Facebook embed yêu cầu full URL encode
				// Với dạng videos/ID:
				if ( /videos/.test( match[ 0 ] ) ) {
					return `https://www.facebook.com/plugins/video.php?href=${ encodeURIComponent( url ) }`;
				}
				// Với dạng fb.watch/ -> vẫn cần full URL
				return `https://www.facebook.com/plugins/video.php?href=${ encodeURIComponent( url ) }`;
			}
		},

		// 🟧 TikTok
		{
			name: 'tiktok',
			patterns: [
				// https://www.tiktok.com/@username/video/1234567890123456789
				/tiktok\.com\/@[\w.-]+\/video\/(\d+)/i,
				// https://www.tiktok.com/embed/1234567890123456789
				/tiktok\.com\/embed\/(\d+)/i
			],
			toEmbed: ( id, match ) =>
				/embed/.test( match[ 0 ] ) ?
					url :
					`https://www.tiktok.com/embed/${ id }`
		},

		// 🟪 Dailymotion
		{
			name: 'dailymotion',
			patterns: [
				// https://www.dailymotion.com/video/x7xyzab
				/dailymotion\.com\/video\/([a-zA-Z0-9]+)/i,
				// https://www.dailymotion.com/embed/video/x7xyzab
				/dailymotion\.com\/embed\/video\/([a-zA-Z0-9]+)/i
			],
			toEmbed: ( id, match ) =>
				/embed/.test( match[ 0 ] ) ?
					url :
					`https://www.dailymotion.com/embed/video/${ id }`
		}
	];

	for ( const p of providers ) {
		for ( const pattern of p.patterns ) {
			const m = pattern.exec( url );
			if ( m && m[ 1 ] ) {
				return p.toEmbed( m[ 1 ], m );
			}
		}
	}

	// Không khớp nhà cung cấp nào: trả nguyên URL
	return url;
}
