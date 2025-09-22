/**
 * NukeViet NVIframe for CKEditor5
 * @version 5.x
 * @author VINADES.,JSC <contact@vinades.vn>
 * @copyright (C) 2009-2025 VINADES.,JSC. All rights reserved
 * @license GNU/GPL version 2 or any later version
 * @see https://github.com/nukeviet The NukeViet CMS GitHub project
 */

import {
    ButtonView,
    CssTransitionDisablerMixin,
    MenuBarMenuListItemButtonView,
    Plugin,
    Locale,
    Editor
} from 'ckeditor5';

import iframeIcon from '../../theme/icons/iframe.svg';

import { NVIframeFormView } from './ui/nviframeformview.js';
import IframeUtils from '../nvdocsutils.js';

export default class NVIframeInsertUI extends Plugin {
    private _formView: NVIframeFormView | undefined;

    /**
     * Đối tượng đang chọn có phải iframe hay không
     */
    declare public isIframeSelected: boolean;

    /**
     * @inheritDoc
     */
    public static get pluginName() {
        return 'NVIframeInsertUI' as const;
    }

    /**
     * @inheritDoc
     */
    public static get requires() {
        return [IframeUtils] as const;
    }

    /**
     * @inheritDoc
     */
    public init(): void {
        const editor = this.editor;
        const selection = editor.model.document.selection;
        const iframeUtils: IframeUtils = editor.plugins.get('IframeUtils');

        const componentCreator = (locale: Locale) => this._createToolbarComponent(locale);

        this.set('isIframeSelected', false);
        this.listenTo(editor.model.document, 'change', () => {
            this.isIframeSelected = iframeUtils.isIframe(selection.getSelectedElement());
        });

        editor.ui.componentFactory.add('nviframeInsert', componentCreator);
        editor.ui.componentFactory.add('insertNVIframe', componentCreator);
    }

    /**
     * Creates a dialog button.
     * @param ButtonClass The button class to instantiate.
     * @returns The created button instance.
     */
    private _createDialogButton<T extends typeof ButtonView | typeof MenuBarMenuListItemButtonView>(ButtonClass: T): InstanceType<T> {
        const editor = this.editor;
        const buttonView = new ButtonClass(editor.locale) as InstanceType<T>;
        const command = editor.commands.get('insertIframe')!;
        const dialogPlugin = this.editor.plugins.get('Dialog');

        buttonView.icon = iframeIcon;

        buttonView.bind('isEnabled').to(command, 'isEnabled');

        buttonView.on('execute', () => {
            if (dialogPlugin.id === 'nviframeInsert') {
                dialogPlugin.hide();
            } else {
                this._showDialog();
            }
        });

        return buttonView;
    }

    /**
     * Thiết lập nút chèn iframe
     */
    private _createToolbarComponent(locale: Locale): ButtonView {
        const t = locale.t;
        const button = this._createDialogButton(ButtonView);

        button.tooltip = true;
        button.bind('label').to(
            this,
            'isIframeSelected',
            isIframeSelected => isIframeSelected ? t('Update iframe') : t('Insert iframe')
        );

        return button;
    }

    /**
     * The form view displayed in the dialog.
     */
    private _showDialog() {
        const editor = this.editor;
        const dialog = editor.plugins.get('Dialog');
        const command = editor.commands.get('replaceIframeSource')!;
        const t = editor.locale.t;

        const isIframeSelected = command.isEnabled;

        if (!this._formView) {
            this._formView = new (CssTransitionDisablerMixin(NVIframeFormView))(getFormValidators(editor), editor.locale);
            this._formView.on('submit', () => this._handleSubmitForm());
        }

        dialog.show({
            id: 'nviframeInsert',
            title: isIframeSelected ? t('Update iframe') : t('Insert iframe'),
            content: this._formView,
            isModal: true,
            onShow: () => {
                this._formView!.widthType = command.isEnabled ? (command.type || 'auto') : 'auto';
                this._formView!.width = command.isEnabled ? (command.width || 560) : 560;
                this._formView!.height = command.isEnabled ? (command.height || 315) : 315;
                this._formView!.ratio = command.isEnabled ? (command.ratio || [16, 9]) : [16, 9];
                this._formView!.url = command.isEnabled ? (command.value || '') : '';
                this._formView!.resetFormStatus();
                this._formView!.urlInputView.fieldView.select();
            },
            actionButtons: [
                {
                    label: t('Cancel'),
                    withText: true,
                    onExecute: () => dialog.hide()
                },
                {
                    label: isIframeSelected ? t('Save') : t('Insert'),
                    class: 'ck-button-action',
                    withText: true,
                    onExecute: () => this._handleSubmitForm()
                }
            ]
        });
    }

    /**
     * Xử lý khi submit form
     */
    private _handleSubmitForm() {
        const editor = this.editor;
        const dialog = editor.plugins.get('Dialog');

        // Nếu form hợp lệ thì chèn iframe hoặc cập nhật iframe
        if (this._formView!.isValid()) {
            editor.execute('insertIframe', {
                src: this._formView!.url,
                width: this._formView!.width,
                height: this._formView!.height,
                type: this._formView!.widthType,
                ratio: this._formView!.ratio
            });

            dialog.hide();
            editor.editing.view.focus();
        }
    }
}

/**
 * Các hàm kiểm tra tính hợp lệ của form
 *
 * @param t
 * @returns
 */
function getFormValidators(editor: Editor): Array<(v: NVIframeFormView) => boolean> {
    const t = editor.locale.t;
    const iframeUtils: IframeUtils = editor.plugins.get('IframeUtils');

    return [
        // Kiểm tra URL không được để trống
        form => {
            if (!form.url.length) {
                form.urlInputView.errorText = t('The URL must not be empty.');
                return false;
            }
            if (!iframeUtils.isUrl(form.url)) {
                form.urlInputView.errorText = t('The URL is not valid.');
                return false;
            }
            return true;
        },
        // Kiểm tra chiều rộng > 0
        form => {
            if (form.width <= 0 || isNaN(form.width)) {
                form.widthInputView.errorText = t('Width must be greater than 0');
                return false;
            }
            return true;
        },
        // Kiểm tra chiều cao > 0
        form => {
            if (form.height <= 0 || isNaN(form.height)) {
                form.heightInputView.errorText = t('Height must be greater than 0');
                return false;
            }
            return true;
        },
        // Kiểm tra tỷ lệ khung hình đúng định dạng
        form => {
            if (form.ratio === null) {
                form.ratioInputView.errorText = t('Ratio must follow the x:y format');
                return false;
            }
            return true;
        }
    ];
}
