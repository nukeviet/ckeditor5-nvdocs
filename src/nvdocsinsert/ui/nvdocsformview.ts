/**
 * NukeViet NVDocs for CKEditor5
 * @version 5.x
 * @author VINADES.,JSC <contact@vinades.vn>
 * @copyright (C) 2009-2025 VINADES.,JSC. All rights reserved
 * @license GNU/GPL version 2 or any later version
 * @see https://github.com/nukeviet The NukeViet CMS GitHub project
 */

import {
	addListToDropdown,
	Collection,
	ListDropdownItemDefinition,
	ButtonView,
	type DropdownView,
	type InputTextView,
	type InputNumberView,
	LabeledFieldView,
	UIModel,
	FormRowView,
	View,
	createLabeledInputNumber,
	createLabeledInputText,
	createLabeledDropdown,
	submitHandler,
	type Editor
} from 'ckeditor5';
import { FocusTracker, KeystrokeHandler, type Locale } from 'ckeditor5/src/utils.js';

import '@ckeditor/ckeditor5-ui/theme/components/responsive-form/responsiveform.css';
import '../../../theme/nvdocsform.css';

/**
 * The nvdocs form view controller class.
 */
export class NVDocsFormView extends View {
	/**
	 * Tracks information about the DOM focus in the form.
	 */
	public readonly focusTracker: FocusTracker;

	/**
	 * An instance of the {@link module:utils/keystrokehandler~KeystrokeHandler}.
	 */
	public readonly keystrokes: KeystrokeHandler;

	/**
	 * The value of the URL input.
	 */
	declare public nvdocsURLInputValue: string;

	/**
	 * Chiều cao nvdocs
	 */
	declare public nvdocsHeightInputValue: number;

	/**
	 * Chiều rộng nvdocs
	 */
	declare public nvdocsWidthInputValue: number;

	/**
	 * Tỷ lệ khung hình nvdocs
	 */
	declare public nvdocsRatioInputValue: [number, number] | null;

	/**
	 * Kiểu chiều rộng nvdocs: tự động hay cố định
	 */
	declare public nvdocsTypeWidthValue: 'auto' | 'fixed';

	/**
	 * Nhà cung cấp dịch vụ xem tài liệu: Google Docs hay Microsoft Office
	 */
	declare public nvdocsProviderValue: 'google' | 'microsoft';

	/**
	 * The URL input view.
	 */
	public urlInputView: LabeledFieldView<InputTextView>;

	/**
	 * The width input view.
	 */
	public widthInputView: LabeledFieldView<InputNumberView>;

	/**
	 * The height input view.
	 */
	public heightInputView: LabeledFieldView<InputNumberView>;

	/**
	 * The ratio input view.
	 */
	public ratioInputView: LabeledFieldView<InputTextView>;

	/**
	 * The type width select view.
	 */
	public typeWidthSelectView: LabeledFieldView<DropdownView>;

	/**
	 * Ô nhà cung cấp dịch vụ xem tài liệu
	 */
	public providerSelectView: LabeledFieldView<DropdownView>;

	/**
	 * Ô duyệt máy chủ nếu có
	 */
	public browserButtonView?: ButtonView;

	/**
	 * Mảng các hàm kiểm tra tính hợp lệ của form
	 */
	private readonly _validators: Array<(v: NVDocsFormView) => boolean>;

	/**
	 * Nhãn của ô nhập URL nvdocs mặc định
	 */
	private _urlInputViewInfoDefault?: string;

	/**
	 * Text mẹo cho ô nhập URL nvdocs.
	 */
	private _urlInputViewInfoTip?: string;

	/**
	 * Nhãn của ô nhập chiều rộng nvdocs mặc định
	 */
	private _widthInputViewInfoDefault?: string;

	/**
	 * Nhãn của ô nhập chiều cao nvdocs mặc định
	 */
	private _heightInputViewInfoDefault?: string;

	/**
	 * Nhãn của ô nhập tỷ lệ nvdocs mặc định
	 */
	private _ratioInputViewInfoDefault?: string;

	/**
	 * URL nút duyệt máy chủ
	 */
	private browseUrl?: string;

	private editor: Editor;

	/**
	 * @param validators Array of form validators.
	 * @param locale
	 */
	constructor(validators: Array<(v: NVDocsFormView) => boolean>, editor: Editor, browseUrl?: string) {
		super(editor.locale);
		this.editor = editor;
		const locale: Locale = editor.locale;

		this.focusTracker = new FocusTracker();
		this.keystrokes = new KeystrokeHandler();

		this.set('nvdocsURLInputValue', '');
		this.set('nvdocsHeightInputValue', 920);
		this.set('nvdocsWidthInputValue', 710);
		this.set('nvdocsRatioInputValue', [1, 2]);
		this.set('nvdocsTypeWidthValue', 'auto');
		this.set('nvdocsProviderValue', 'microsoft');

		this.browseUrl = browseUrl;

		this.urlInputView = this._createUrlInput();
		this.providerSelectView = this._createProviderSelect();
		this.widthInputView = this._createWidthInput();
		this.heightInputView = this._createHeightInput();
		this.ratioInputView = this._createRatioInput();
		this.typeWidthSelectView = this._createTypeWidthSelect();

		if (!!this.browseUrl) {
			this.browserButtonView = this._createBrowserButton();
		}

		this._validators = validators;

		// Dòng nhập URL
		const rowInput = new FormRowView(locale);
		rowInput.children.add(this.providerSelectView);
		rowInput.children.add(this.urlInputView);
		if (this.browserButtonView) {
			rowInput.children.add(this.browserButtonView);
		}
		rowInput.class.push('ck-nvdocs-form__row_column');

		// Dòng chọn kích thước, nhập chiều rộng, chiều cao, tỷ lệ
		const rowType = new FormRowView(locale);
		rowType.children.add(this.typeWidthSelectView);
		rowType.children.add(this.widthInputView);
		rowType.children.add(this.heightInputView);
		rowType.children.add(this.ratioInputView);
		rowType.class.push('ck-nvdocs-form__row_column');

		this.setTemplate({
			tag: 'form',

			attributes: {
				class: [
					'ck',
					'ck-nvdocs-form',
					'ck-responsive-form'
				],

				tabindex: '-1'
			},

			children: [
				rowInput,
				rowType
			]
		});
	}

	/**
	 * @inheritDoc
	 */
	public override render(): void {
		super.render();

		submitHandler({
			view: this
		});

		this.focusTracker.add(this.urlInputView.element!);
		this.focusTracker.add(this.widthInputView.element!);
		this.focusTracker.add(this.heightInputView.element!);
		this.focusTracker.add(this.ratioInputView.element!);
		this.focusTracker.add(this.typeWidthSelectView.element!);

		this.keystrokes.listenTo(this.element!);
	}

	/**
	 * @inheritDoc
	 */
	public override destroy(): void {
		super.destroy();

		this.focusTracker.destroy();
		this.keystrokes.destroy();
	}

	/**
	 * Focuses the URL input.
	 */
	public focus(): void {
		this.urlInputView.focus();
	}

	/**
	 * Get the URL in the URL input.
	 */
	public get url(): string {
		return this.urlInputView.fieldView.element!.value.trim();
	}

	/**
	 * @param url The URL to set.
	 */
	public set url(url: string) {
		this.urlInputView.fieldView.value = url.trim();
	}

	/**
	 * @param type 'auto' or 'fixed'
	 */
	public set widthType(type: 'auto' | 'fixed') {
		const t = this.locale!.t;
		this.set('nvdocsTypeWidthValue', type);
		this.typeWidthSelectView.fieldView.buttonView.set({ label: type === 'auto' ? t('Auto') : t('Fixed') });
		this._changeTypeWidth();
	}

	/**
	 * Get kiểu chiều rộng: 'auto' or 'fixed'
	 */
	public get widthType(): 'auto' | 'fixed' {
		return this.nvdocsTypeWidthValue;
	}

	/**
	 * Đặt chiều rộng nvdocs
	 */
	public set width(width: number) {
		this.nvdocsWidthInputValue = width;
		this.widthInputView.fieldView.value = width.toString();
	}

	/**
	 * Lấy chiều rộng nvdocs
	 */
	public get width(): number {
		return this.widthInputView.fieldView.element!.value ? parseInt(this.widthInputView.fieldView.element!.value) : 0;
	}

	/**
	 * Đặt chiều cao nvdocs
	 */
	public set height(height: number) {
		this.nvdocsHeightInputValue = height;
		this.heightInputView.fieldView.value = height.toString();
	}

	/**
	 * Lấy chiều cao nvdocs
	 */
	public get height(): number {
		return this.heightInputView.fieldView.element!.value ? parseInt(this.heightInputView.fieldView.element!.value) : 0;
	}

	/**
	 * Đặt tỷ lệ khung hình
	 */
	public set ratio(ratio: [number, number] | null) {
		this.nvdocsRatioInputValue = ratio;
		this.ratioInputView.fieldView.value = ratio ? ratio.join(':') : '';
		this._changeTypeWidth();
	}

	/**
	 * Lấy tỷ lệ khung hình
	 */
	public get ratio(): [number, number] | null {
		const ratio = this._parseRatio();
		if (ratio) {
			this.nvdocsRatioInputValue = ratio;
			return ratio;
		}
		this.nvdocsRatioInputValue = null;
		return null;
	}

	/**
	 * @param type 'google' or 'microsoft'
	 */
	public set provider(provider: 'google' | 'microsoft') {
		const t = this.locale!.t;
		this.set('nvdocsProviderValue', provider);
		this.providerSelectView.fieldView.buttonView.set({ label: provider === 'google' ? t('Google Docs') : t('Microsoft Office') });
		this._changeTypeWidth();
	}

	/**
	 * Get kiểu chiều rộng: 'google' or 'microsoft'
	 */
	public get provider(): 'google' | 'microsoft' {
		return this.nvdocsProviderValue;
	}

	/**
	 * Kiểm tra tính hợp lệ của form.
	 *
	 * @returns true|false
	 */
	public isValid(): boolean {
		this.resetFormStatus();

		let errorNumber = 0;

		for (const validator of this._validators) {
			if (!validator(this)) {
				errorNumber++;
			}
		}

		return errorNumber === 0;
	}

	/**
	 * Xóa dữ liệu, cảnh báo, tip và đưa về mặc định
	 *
	 * See {@link #isValid}.
	 */
	public resetFormStatus(): void {
		this.urlInputView.errorText = null;
		this.urlInputView.infoText = this._urlInputViewInfoDefault!;

		this.widthInputView.errorText = null;
		this.widthInputView.infoText = this._widthInputViewInfoDefault!;

		this.heightInputView.errorText = null;
		this.heightInputView.infoText = this._heightInputViewInfoDefault!;

		this.ratioInputView.errorText = null;
		this.ratioInputView.infoText = this._ratioInputViewInfoDefault!;
	}

	/**
	 * Thay đổi hiển thị các ô nhập chiều rộng, chiều cao, tỷ lệ
	 *
	 * @returns void
	 */
	private _changeTypeWidth() {
		this.resetFormStatus();

		if (this.nvdocsTypeWidthValue === 'auto') {
			this.widthInputView.element!.classList.add('ck-hidden');
			this.heightInputView.element!.classList.add('ck-hidden');
			this.ratioInputView.element!.classList.remove('ck-hidden');
			return;
		}

		this.widthInputView.element!.classList.remove('ck-hidden');
		this.heightInputView.element!.classList.remove('ck-hidden');
		this.ratioInputView.element!.classList.add('ck-hidden');
	}

	/**
	 * Tạo ô nhập URL nvdocs.
	 *
	 * @returns LabeledFieldView<InputTextView>
	 */
	private _createUrlInput(): LabeledFieldView<InputTextView> {
		const t = this.locale!.t;

		const labeledInput = new LabeledFieldView(this.locale, createLabeledInputText);
		const inputField = labeledInput.fieldView;

		this._urlInputViewInfoDefault = t('Paste the document URL in the input.');
		this._urlInputViewInfoTip = t('Tip: Paste the URL into the content to embed faster.');

		labeledInput.label = t('Document URL');
		labeledInput.infoText = this._urlInputViewInfoDefault;
		labeledInput.extendTemplate({
			attributes: {
				class: [!!this.browseUrl ? 'c6' : 'c8']
    		}
		});

		inputField.inputMode = 'url';
		inputField.on('input', () => {
			// Hiển thị mẹo khi có nhập liệu, không có dữ liệu thì hiển thị nhãn mặc định
			labeledInput.infoText = inputField.element!.value ? this._urlInputViewInfoTip! : this._urlInputViewInfoDefault!;
			this.nvdocsURLInputValue = inputField.element!.value.trim();
		});

		return labeledInput;
	}

	/**
	 * Tạo ô chọn kiểu kích thước: tự động hay cố định
	 *
	 * @returns LabeledFieldView<DropdownView>
	 */
	private _createTypeWidthSelect(): LabeledFieldView<DropdownView> {
		const t = this.locale!.t;
		const labeledInput = new LabeledFieldView(this.locale, (labeledFieldView, viewUid, statusUid) => {
			const dropdown = createLabeledDropdown(labeledFieldView, viewUid, statusUid);
			const button = dropdown.buttonView;

			/**
			 * Xử lý lỗi của createLabeledDropdown, khi for=viewUid nó đưa vào 1 thẻ div.
			 * Render trước để lấy element là cái nút sau đó đặt id nút đó là viewUid (for của cái label)
			 * Đổi lại id của dropdown thành viewUid_outer để tránh trùng id
			 */
			dropdown.set({
				id: `${viewUid}_outer`
			});
			dropdown.render();
			button.element!.setAttribute('id', viewUid);

			return dropdown;
		});
		const dropdown = labeledInput.fieldView;

		// Thêm các lựa chọn cho dropdown
		const items = new Collection<ListDropdownItemDefinition>();
		items.add({
			type: 'button',
			model: new UIModel({
				withText: true,
				label: t('Auto'),
			})
		});
		items.add({
			type: 'button',
			model: new UIModel({
				withText: true,
				label: t('Fixed'),
			})
		});
		dropdown.on('execute', (evt) => {
			const buttonView = evt.source as ButtonView;
			dropdown.buttonView.set({ label: buttonView.label });
			this.set('nvdocsTypeWidthValue', buttonView.label === t('Auto') ? 'auto' : 'fixed');

			// Trường hợp đổi sang tự động mà chiều rộng hoặc chiều cao lỗi thì đặt nó làm mặc định
			if (this.nvdocsTypeWidthValue === 'auto') {
				if (this.width <= 0 || isNaN(this.width)) {
					this.widthInputView.fieldView.set('value', '710');
					this.widthInputView.fieldView.element!.value = '710';
					this.widthInputView.fieldView.isEmpty = false;
				}
				if (this.height <= 0 || isNaN(this.height)) {
					this.heightInputView.fieldView.set('value', '920');
					this.heightInputView.fieldView.element!.value = '920';
					this.heightInputView.fieldView.isEmpty = false;
				}
			} else {
				// Trường hợp đổi sang cố định mà tỷ lệ lỗi thì đặt nó làm mặc định
				if (this.ratio === null) {
					this.ratioInputView.fieldView.set('value', '1:2');
					this.ratioInputView.fieldView.element!.value = '1:2';
					this.ratioInputView.fieldView.isEmpty = false;
				}
			}

			this._changeTypeWidth();
		});
		addListToDropdown(dropdown, items);

		// Text cho nút dropdown
		dropdown.buttonView.set({
			label: t('Auto'),
			withText: true,
		});

		labeledInput.label = t('Size');
		labeledInput.isEmpty = false;
		labeledInput.extendTemplate({
			attributes: {
				class: ['c4']
    		}
		});

		return labeledInput;
	}

	/**
	 * Tạo ô chọn nhà cung cấp dịch vụ Google hay Microsoft
	 *
	 * @returns LabeledFieldView<DropdownView>
	 */
	private _createProviderSelect(): LabeledFieldView<DropdownView> {
		const t = this.locale!.t;
		const labeledInput = new LabeledFieldView(this.locale, (labeledFieldView, viewUid, statusUid) => {
			const dropdown = createLabeledDropdown(labeledFieldView, viewUid, statusUid);
			const button = dropdown.buttonView;

			/**
			 * Xử lý lỗi của createLabeledDropdown, khi for=viewUid nó đưa vào 1 thẻ div.
			 * Render trước để lấy element là cái nút sau đó đặt id nút đó là viewUid (for của cái label)
			 * Đổi lại id của dropdown thành viewUid_outer để tránh trùng id
			 */
			dropdown.set({
				id: `${viewUid}_outer`
			});
			dropdown.render();
			button.element!.setAttribute('id', viewUid);

			return dropdown;
		});
		const dropdown = labeledInput.fieldView;

		// Thêm các lựa chọn cho dropdown
		const items = new Collection<ListDropdownItemDefinition>();
		items.add({
			type: 'button',
			model: new UIModel({
				withText: true,
				label: t('Google Docs'),
			})
		});
		items.add({
			type: 'button',
			model: new UIModel({
				withText: true,
				label: t('Microsoft Office'),
			})
		});
		dropdown.on('execute', (evt) => {
			const buttonView = evt.source as ButtonView;
			dropdown.buttonView.set({ label: buttonView.label });
			this.set('nvdocsProviderValue', buttonView.label === t('Google Docs') ? 'google' : 'microsoft');
		});
		addListToDropdown(dropdown, items);

		// Text cho nút dropdown
		dropdown.buttonView.set({
			label: t('Google Docs'),
			withText: true,
		});

		labeledInput.label = t('Platform provider');
		labeledInput.isEmpty = false;
		labeledInput.extendTemplate({
			attributes: {
				class: ['c4']
    		}
		});

		return labeledInput;
	}

	/**
	 * Tạo ô nhập chiều rộng
	 *
	 * @returns LabeledFieldView<InputNumberView>
	 */
	private _createWidthInput(): LabeledFieldView<InputNumberView> {
		const t = this.locale!.t;
		const labeledInput = new LabeledFieldView(this.locale, createLabeledInputNumber);
		const inputField = labeledInput.fieldView;

		this._widthInputViewInfoDefault = t('In pixels');

		labeledInput.label = t('Width');
		labeledInput.infoText = this._widthInputViewInfoDefault;
		labeledInput.extendTemplate({
			attributes: {
				class: ['c4']
    		}
		});

		inputField.min = 0;
		inputField.max = 9999;

		return labeledInput;
	}

	/**
	 * Tạo ô nhập chiều cao
	 *
	 * @returns LabeledFieldView<InputNumberView>
	 */
	private _createHeightInput(): LabeledFieldView<InputNumberView> {
		const t = this.locale!.t;
		const labeledInput = new LabeledFieldView(this.locale, createLabeledInputNumber);
		const inputField = labeledInput.fieldView;

		this._heightInputViewInfoDefault = t('In pixels');

		labeledInput.label = t('Height');
		labeledInput.infoText = this._heightInputViewInfoDefault;
		labeledInput.extendTemplate({
			attributes: {
				class: ['c4']
    		}
		});

		inputField.min = 0;
		inputField.max = 9999;

		return labeledInput;
	}

	/**
	 * Tạo ô nhập tỷ lệ
	 *
	 * @returns LabeledFieldView<InputTextView>
	 */
	private _createRatioInput(): LabeledFieldView<InputTextView> {
		const t = this.locale!.t;
		const labeledInput = new LabeledFieldView(this.locale, createLabeledInputText);
		//const inputField = labeledInput.fieldView;

		this._ratioInputViewInfoDefault = t('Use the format x:y');

		labeledInput.label = t('Ratio');
		labeledInput.infoText = this._ratioInputViewInfoDefault;
		labeledInput.extendTemplate({
			attributes: {
				class: ['c8']
    		}
		});

		return labeledInput;
	}

	/**
	 * Tạo nút duyệt máy chủ
	 *
	 * @returns ButtonView
	 */
	private _createBrowserButton(): ButtonView {
		const t = this.locale!.t;
		const button = new ButtonView(this.locale);

		button.withText = true;
		button.label = t('Browse');
		button.extendTemplate({
			attributes: {
				class: ['c2', 'ck-nvdocs-button']
    		}
		});
		button.on('execute', () => {
			this.editor.execute('nvbox', button.element, {
				imgfile: this.url,
				callback: (data: Record<string, any>) => {
					this.url = data.path;
					this.focus();
				}
			});
		});

		return button;
	}

	/**
	 * Xử lý ô nhập tỷ lệ khung hình ra dạng [number, number] hoặc null nếu không đúng định dạng
	 *
	 * @returns [number, number] | null
	 */
	private _parseRatio(): [number, number] | null {
		const parts = this.ratioInputView.fieldView.element!.value.split(':').map(part => parseInt(part.trim(), 10));
		if (parts.length === 2 && parts.every(num => !isNaN(num) && num > 0)) {
			return [parts[0], parts[1]];
		}

		return null;
	}
}
