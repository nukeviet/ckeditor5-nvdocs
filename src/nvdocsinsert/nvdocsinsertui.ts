/**
 * NukeViet NVDocs for CKEditor5
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

import nvdocsIcon from '../../theme/icons/nvdocs.svg';

import { NVDocsFormView } from './ui/nvdocsformview.js';
import NVDocsUtils from '../nvdocsutils.js';

export default class NVDocsInsertUI extends Plugin {
    private _formView: NVDocsFormView | undefined;

    /**
     * Đối tượng đang chọn có phải nvdocs hay không
     */
    declare public isNVDocsSelected: boolean;

    /**
     * @inheritDoc
     */
    public static get pluginName() {
        return 'NVDocsInsertUI' as const;
    }

    /**
     * @inheritDoc
     */
    public static get requires() {
        return [NVDocsUtils] as const;
    }

    /**
     * @inheritDoc
     */
    public init(): void {
        const editor = this.editor;
        const selection = editor.model.document.selection;
        const nvDocsUtils: NVDocsUtils = editor.plugins.get('NVDocsUtils');

        const componentCreator = (locale: Locale) => this._createToolbarComponent(locale);

        this.set('isNVDocsSelected', false);
        this.listenTo(editor.model.document, 'change', () => {
            this.isNVDocsSelected = nvDocsUtils.isDocs(selection.getSelectedElement());
        });

        editor.ui.componentFactory.add('nvdocsInsert', componentCreator);
        editor.ui.componentFactory.add('insertNVDocs', componentCreator);
    }

    /**
     * Đặt URL cho form
     *
     * @param url
     */
    public setUrl(url: string) {
        if (this._formView) {
            this._formView.url = url;
            this._formView.resetFormStatus();
        }
    }

    /**
     * Creates a dialog button.
     * @param ButtonClass The button class to instantiate.
     * @returns The created button instance.
     */
    private _createDialogButton<T extends typeof ButtonView | typeof MenuBarMenuListItemButtonView>(ButtonClass: T): InstanceType<T> {
        const editor = this.editor;
        const buttonView = new ButtonClass(editor.locale) as InstanceType<T>;
        const command = editor.commands.get('insertNVDocs')!;
        const dialogPlugin = this.editor.plugins.get('Dialog');

        buttonView.icon = nvdocsIcon;

        buttonView.bind('isEnabled').to(command, 'isEnabled');

        buttonView.on('execute', () => {
            if (dialogPlugin.id === 'nvdocsInsert') {
                dialogPlugin.hide();
            } else {
                this._showDialog();
            }
        });

        return buttonView;
    }

    /**
     * Thiết lập nút chèn nvdocs
     */
    private _createToolbarComponent(locale: Locale): ButtonView {
        const t = locale.t;
        const button = this._createDialogButton(ButtonView);

        button.tooltip = true;
        button.bind('label').to(
            this,
            'isNVDocsSelected',
            isNVDocsSelected => isNVDocsSelected ? t('Update document') : t('Insert document')
        );

        return button;
    }

    /**
     * The form view displayed in the dialog.
     */
    private _showDialog() {
        const editor = this.editor;
        const dialog = editor.plugins.get('Dialog');
        const command = editor.commands.get('replaceNVDocsSource')!;
        const t = editor.locale.t;

        const isNVDocsSelected = command.isEnabled;

        if (!this._formView) {
            const browseUrl = editor.config.get('nvbox.browseUrl') as string | undefined;
            this._formView = new (CssTransitionDisablerMixin(NVDocsFormView))(getFormValidators(editor), editor, browseUrl);
            this._formView.on('submit', () => this._handleSubmitForm());
        }

        dialog.show({
            id: 'nvdocsInsert',
            title: isNVDocsSelected ? t('Update document') : t('Insert document'),
            content: this._formView,
            isModal: true,
            onShow: () => {
                this._formView!.widthType = command.isEnabled ? (command.type || 'auto') : 'auto';
                this._formView!.width = command.isEnabled ? (command.width || 710) : 710;
                this._formView!.height = command.isEnabled ? (command.height || 920) : 920;
                this._formView!.ratio = command.isEnabled ? (command.ratio || [1, 2]) : [1, 2];
                this._formView!.url = command.isEnabled ? (command.value || '') : '';
                this._formView!.provider = command.isEnabled ? (command.provider || 'google') : 'google';
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
                    label: isNVDocsSelected ? t('Save') : t('Insert'),
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

        // Nếu form hợp lệ thì chèn nvdocs hoặc cập nhật nvdocs
        if (this._formView!.isValid()) {
            editor.execute('insertNVDocs', {
                src: this._formView!.url,
                width: this._formView!.width,
                height: this._formView!.height,
                type: this._formView!.widthType,
                ratio: this._formView!.ratio,
                provider: this._formView!.provider
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
function getFormValidators(editor: Editor): Array<(v: NVDocsFormView) => boolean> {
    const t = editor.locale.t;
    const nvDocsUtils: NVDocsUtils = editor.plugins.get('NVDocsUtils');

    return [
        // Kiểm tra URL không được để trống
        form => {
            if (!form.url.length) {
                form.urlInputView.errorText = t('The URL must not be empty.');
                return false;
            }
            if (!nvDocsUtils.isUrl(form.url)) {
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
